import type { BrowserWindow as BrowserWindowType } from 'electron';
import * as electronModule from 'electron';

const electron = (electronModule as any).default || electronModule;
const app = electron?.app;
const BrowserWindow = electron?.BrowserWindow;
const ipcMain = electron?.ipcMain;
import { spawn, spawnSync, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import http from 'http';

export type BotStatus = 'starting' | 'online' | 'error' | 'stopped';

export interface PythonBotState {
  status: BotStatus;
  port: number;
  url: string;
  pid: number | null;
  error?: string;
  lastHealthCheck?: number;
  engineInfo?: any;
  recentLogs: string[];
}

const DEFAULT_PORT = 5005;
const BOT_PORT = process.env.PYTHON_PORT ? parseInt(process.env.PYTHON_PORT, 10) : DEFAULT_PORT;
const BOT_URL = `http://127.0.0.1:${BOT_PORT}`;

let botProcess: ChildProcess | null = null;
let healthCheckTimer: NodeJS.Timeout | null = null;
let restartAttempts = 0;
const MAX_RESTART_ATTEMPTS = 5;
let isShuttingDown = false;
let registeredIpc = false;

const state: PythonBotState = {
  status: 'stopped',
  port: BOT_PORT,
  url: BOT_URL,
  pid: null,
  recentLogs: [],
};

function addLog(line: string): void {
  const trimmed = line.trim();
  if (!trimmed) return;
  state.recentLogs.push(trimmed);
  if (state.recentLogs.length > 50) {
    state.recentLogs.shift();
  }
}

/**
 * Broadcast current status to all open Electron windows
 */
export function broadcastBotStatus(): void {
  const payload = {
    status: state.status,
    port: state.port,
    url: state.url,
    pid: state.pid,
    error: state.error,
    engineInfo: state.engineInfo,
    lastHealthCheck: state.lastHealthCheck,
  };

  try {
    if (BrowserWindow && typeof BrowserWindow.getAllWindows === 'function') {
      const windows = BrowserWindow.getAllWindows();
      for (const win of windows) {
        if (!win.isDestroyed() && win.webContents) {
          win.webContents.send('python-bot:status', payload);
        }
      }
    }
  } catch (err) {
    console.warn('[PythonBot] Failed to broadcast status to windows:', err);
  }
}

/**
 * Locate the project root containing python_backend
 */
function resolveProjectRoot(): string {
  const candidatePaths = [
    app?.getAppPath ? app.getAppPath() : process.cwd(),
    process.cwd(),
    path.resolve(__dirname, '..', '..'),
    path.resolve(__dirname, '..'),
    path.resolve(process.resourcesPath || '', 'app'),
  ];

  for (const cPath of candidatePaths) {
    if (fs.existsSync(path.join(cPath, 'python_backend', 'main.py'))) {
      return cPath;
    }
  }

  return process.cwd();
}

/**
 * Locate a usable Python binary
 */
function resolvePythonBinary(projectRoot: string): string {
  if (process.env.PYTHON_PATH && fs.existsSync(process.env.PYTHON_PATH)) {
    return process.env.PYTHON_PATH;
  }

  const isWin = process.platform === 'win32';
  const venvPython = isWin
    ? path.join(projectRoot, '.venv', 'Scripts', 'python.exe')
    : path.join(projectRoot, '.venv', 'bin', 'python');

  if (fs.existsSync(venvPython)) {
    return venvPython;
  }

  // Common Windows global install paths or launcher
  const candidateCommands = isWin ? ['python', 'py', 'python3'] : ['python3', 'python'];

  for (const cmd of candidateCommands) {
    try {
      spawnSync(cmd, ['--version'], { stdio: 'ignore' });
      return cmd;
    } catch {
      // try next
    }
  }

  return isWin ? 'python' : 'python3';
}

/**
 * Perform a single HTTP health check against the Python engine
 */
export async function checkBotHealth(timeoutMs = 1500): Promise<{ ok: boolean; data?: any }> {
  return new Promise((resolve) => {
    const req = http.get(
      `${BOT_URL}/health`,
      {
        timeout: timeoutMs,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(body);
              resolve({ ok: true, data: parsed });
            } catch {
              resolve({ ok: true, data: { status: 'online' } });
            }
          } else {
            resolve({ ok: false });
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false });
    });

    req.on('error', () => {
      resolve({ ok: false });
    });
  });
}

/**
 * Poll health endpoint until healthy or timeout
 */
async function waitForBotHealth(maxAttempts = 30, intervalMs = 400): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    if (isShuttingDown) return false;
    const health = await checkBotHealth(1000);
    if (health.ok) {
      state.status = 'online';
      state.lastHealthCheck = Date.now();
      state.engineInfo = health.data;
      state.error = undefined;
      broadcastBotStatus();
      console.log(`[PythonBot] Python cybersecurity engine online at ${BOT_URL}`);
      return true;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

/**
 * Starts continuous heartbeat monitoring
 */
function startHeartbeat(): void {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
  }

  let consecutiveFailures = 0;

  healthCheckTimer = setInterval(async () => {
    if (isShuttingDown || state.status === 'stopped') return;

    const health = await checkBotHealth(2000);
    if (health.ok) {
      consecutiveFailures = 0;
      if (state.status !== 'online') {
        state.status = 'online';
        state.engineInfo = health.data;
        broadcastBotStatus();
      }
      state.lastHealthCheck = Date.now();
    } else {
      consecutiveFailures++;
      if (consecutiveFailures >= 3 && state.status === 'online') {
        console.warn('[PythonBot] Health check failed 3 times; setting status to error');
        state.status = 'error';
        state.error = 'Bot health check timed out or unreachable';
        broadcastBotStatus();

        // Attempt reconnection / restart
        if (restartAttempts < MAX_RESTART_ATTEMPTS) {
          console.log(`[PythonBot] Attempting auto-restart (${restartAttempts + 1}/${MAX_RESTART_ATTEMPTS})...`);
          restartPythonBot();
        }
      }
    }
  }, 5000);
}

/**
 * Spawns the Python AI CyberBot child process
 */
export async function startPythonBot(mainWindow?: BrowserWindowType): Promise<PythonBotState> {
  if (isShuttingDown) {
    isShuttingDown = false;
  }

  // Register IPC handlers once
  registerIpcHandlers();

  // If already running and healthy, return immediately
  const initialHealth = await checkBotHealth(800);
  if (initialHealth.ok) {
    state.status = 'online';
    state.engineInfo = initialHealth.data;
    state.lastHealthCheck = Date.now();
    startHeartbeat();
    broadcastBotStatus();
    console.log(`[PythonBot] Python bot is already running and healthy at ${BOT_URL}`);
    return state;
  }

  // Terminate any previous instance if lingering
  if (botProcess) {
    stopPythonBot();
    await new Promise((r) => setTimeout(r, 500));
  }

  state.status = 'starting';
  state.error = undefined;
  broadcastBotStatus();

  const projectRoot = resolveProjectRoot();
  const pythonCmd = resolvePythonBinary(projectRoot);

  console.log(`[PythonBot] Launching Python Cyber Intelligence Server using "${pythonCmd}" in "${projectRoot}"...`);

  const spawnArgs = [
    '-m',
    'uvicorn',
    'python_backend.main:app',
    '--host',
    '127.0.0.1',
    '--port',
    String(BOT_PORT),
  ];

  try {
    botProcess = spawn(pythonCmd, spawnArgs, {
      cwd: projectRoot,
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUNBUFFERED: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    state.pid = botProcess.pid || null;

    botProcess.stdout?.on('data', (data) => {
      const text = data.toString();
      addLog(`[STDOUT] ${text}`);
      console.log(`[PythonBot stdout]: ${text.trim()}`);
    });

    botProcess.stderr?.on('data', (data) => {
      const text = data.toString();
      addLog(`[STDERR] ${text}`);
      console.log(`[PythonBot stderr]: ${text.trim()}`);
    });

    botProcess.on('error', (err) => {
      console.error('[PythonBot] Process error:', err);
      state.status = 'error';
      state.error = err.message;
      state.pid = null;
      broadcastBotStatus();
    });

    botProcess.on('exit', (code, signal) => {
      console.log(`[PythonBot] Child process exited with code ${code}, signal ${signal}`);
      state.pid = null;
      botProcess = null;

      if (!isShuttingDown) {
        state.status = 'error';
        state.error = `Bot process terminated unexpectedly (code: ${code}, signal: ${signal})`;
        broadcastBotStatus();

        if (restartAttempts < MAX_RESTART_ATTEMPTS) {
          restartAttempts++;
          const delay = Math.min(2000 * restartAttempts, 10000);
          console.log(`[PythonBot] Scheduling restart attempt ${restartAttempts} in ${delay}ms...`);
          setTimeout(() => {
            if (!isShuttingDown && state.status !== 'online') {
              startPythonBot();
            }
          }, delay);
        }
      } else {
        state.status = 'stopped';
        broadcastBotStatus();
      }
    });

    // Wait for health check confirmation
    const healthy = await waitForBotHealth(30, 400);
    if (healthy) {
      restartAttempts = 0;
      startHeartbeat();
    } else {
      if ((state.status as BotStatus) !== 'online') {
        state.status = 'error';
        state.error = 'Timed out waiting for Python bot health check on port ' + BOT_PORT;
        broadcastBotStatus();
      }
    }
  } catch (spawnErr: any) {
    console.error('[PythonBot] Failed to spawn Python process:', spawnErr);
    state.status = 'error';
    state.error = spawnErr?.message || String(spawnErr);
    broadcastBotStatus();
  }

  return state;
}

/**
 * Alias for startPythonBot for compatibility with main process lifecycle
 */
export const initPythonBot = startPythonBot;

/**
 * Cleanly stops and kills the Python child process
 */
export function stopPythonBot(): void {
  isShuttingDown = true;

  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
    healthCheckTimer = null;
  }

  const pid = state.pid || botProcess?.pid;

  if (pid) {
    console.log(`[PythonBot] Terminating Python child process (PID: ${pid})...`);
    if (process.platform === 'win32') {
      try {
        // Kill the entire process tree on Windows forcefully using spawnSync (no shell invocation)
        spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' });
        console.log(`[PythonBot] Successfully killed PID ${pid} via taskkill`);
      } catch (e) {
        // Ignore errors if process already terminated
      }
    } else {
      try {
        // On POSIX, kill the process group to ensure worker subprocesses do not orphan
        try {
          process.kill(-pid, 'SIGTERM');
        } catch {
          if (botProcess && !botProcess.killed) {
            botProcess.kill('SIGTERM');
          }
        }
        setTimeout(() => {
          try {
            process.kill(-pid, 'SIGKILL');
          } catch {
            if (botProcess && !botProcess.killed) {
              botProcess.kill('SIGKILL');
            }
          }
        }, 1000);
      } catch (e) {
        // Ignore
      }
    }
  }

  botProcess = null;
  state.status = 'stopped';
  state.pid = null;
  broadcastBotStatus();
}

/**
 * Restarts the Python bot
 */
export async function restartPythonBot(): Promise<PythonBotState> {
  stopPythonBot();
  await new Promise((r) => setTimeout(r, 600));
  return startPythonBot();
}

/**
 * Returns current bot state
 */
export function getBotState(): PythonBotState {
  return { ...state };
}

/**
 * Helper to proxy HTTP queries to Python bot with timeout
 */
async function postBotEndpoint(endpoint: string, bodyData: any, timeoutMs = 12000): Promise<any> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(bodyData);
    const url = new URL(endpoint, BOT_URL);

    const req = http.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: timeoutMs,
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(responseBody));
            } catch (jsonErr) {
              resolve({ raw: responseBody });
            }
          } else {
            reject(new Error(`Python bot error HTTP ${res.statusCode}: ${responseBody}`));
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Python bot request timed out'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Register IPC Main handlers for renderer communication
 */
export function registerIpcHandlers(): void {
  if (registeredIpc) return;
  registeredIpc = true;

  if (ipcMain && typeof ipcMain.handle === 'function') {
    const isAuthorizedSender = (event: any): boolean => {
      try {
        if (!BrowserWindow || typeof BrowserWindow.getAllWindows !== 'function') return true;
        const mainWins = BrowserWindow.getAllWindows();
        return mainWins.some((w: any) => !w.isDestroyed() && w.webContents === event.sender);
      } catch {
        return false;
      }
    };

    ipcMain.handle('python-bot:get-status', () => {
      return getBotState();
    });

    ipcMain.handle('python-bot:restart', async (event: any) => {
      if (!isAuthorizedSender(event)) return { ok: false, error: 'Unauthorized sender' };
      return restartPythonBot();
    });

    ipcMain.handle('python-bot:health', async () => {
      return checkBotHealth(3000);
    });

    ipcMain.handle('python-bot:chat', async (event: any, reqData: any) => {
      if (!isAuthorizedSender(event)) return { ok: false, error: 'Unauthorized sender' };
      try {
        const result = await postBotEndpoint('/chat', {
          messages: reqData?.messages || [],
          persona_id: reqData?.persona_id || reqData?.personaId || 'cyber-sentinel',
          system_instruction: reqData?.system_instruction || reqData?.systemInstruction,
          model: reqData?.model || 'aegis-cyber-python',
        });
        return { ok: true, data: result };
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    });

    ipcMain.handle('python-bot:analyze', async (event: any, payloadData: any) => {
      if (!isAuthorizedSender(event)) return { ok: false, error: 'Unauthorized sender' };
      try {
        const payloadString = typeof payloadData === 'string' ? payloadData : payloadData?.payload || '';
        const result = await postBotEndpoint('/analyze', {
          payload: payloadString,
        });
        return { ok: true, data: result };
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    });

    ipcMain.handle('python-bot:terms', async () => {
      return new Promise((resolve) => {
        http
          .get(`${BOT_URL}/terms`, { timeout: 3000 }, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
              try {
                resolve({ ok: true, data: JSON.parse(body) });
              } catch {
                resolve({ ok: false, error: 'Failed to parse terms response' });
              }
            });
          })
          .on('error', (e) => resolve({ ok: false, error: e.message }));
      });
    });
  }

  // Ensure clean termination on Electron app lifecycle events
  if (app && typeof app.on === 'function') {
    app.on('before-quit', () => {
      stopPythonBot();
    });

    app.on('will-quit', () => {
      stopPythonBot();
    });
  }

  process.on('exit', () => {
    stopPythonBot();
  });

  process.on('SIGINT', () => {
    stopPythonBot();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    stopPythonBot();
    process.exit(0);
  });
}
