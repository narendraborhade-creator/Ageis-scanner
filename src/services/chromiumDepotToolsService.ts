/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Chromium Depot Tools & Engine Studio Service
 * Grounded in https://chromium.googlesource.com/chromium/tools/depot_tools
 */

export interface DepotToolItem {
  id: string;
  name: string;
  command: string;
  category: 'sync' | 'meta-build' | 'build' | 'review' | 'runtime' | 'package';
  description: string;
  docUrl: string;
  usageExample: string;
  defaultArgs?: string;
}

export interface GnBuildArgPreset {
  id: string;
  name: string;
  description: string;
  targetEnv: string;
  argsContent: string;
  features: string[];
}

export interface ChromiumRuntimeFlag {
  id: string;
  flag: string;
  name: string;
  category: 'graphics' | 'media' | 'network' | 'security' | 'v8';
  description: string;
  recommended: boolean;
  enabled: boolean;
}

// 1. Official Chromium Depot Tools Inventory
export const DEPOT_TOOLS_CATALOG: DepotToolItem[] = [
  {
    id: 'fetch',
    name: 'fetch',
    command: 'fetch',
    category: 'sync',
    description: 'Initializes and checkouts the complete Chromium source tree and all related third-party repositories.',
    docUrl: 'https://chromium.googlesource.com/chromium/tools/depot_tools/+/main/fetch.py',
    usageExample: 'fetch --nohooks chromium',
    defaultArgs: '--nohooks chromium',
  },
  {
    id: 'gclient',
    name: 'gclient',
    command: 'gclient',
    category: 'sync',
    description: 'Multi-repository management and synchronization tool for Chromium. Runs hooks, DEPS resolution, and CIPD binaries.',
    docUrl: 'https://chromium.googlesource.com/chromium/tools/depot_tools/+/main/gclient.py',
    usageExample: 'gclient sync -D --jobs=16',
    defaultArgs: 'sync -D --jobs=16',
  },
  {
    id: 'gn',
    name: 'gn (Generate Ninja)',
    command: 'gn',
    category: 'meta-build',
    description: 'Fast meta-build system that reads .gn and BUILD.gn files to generate high-performance Ninja build configuration files.',
    docUrl: 'https://gn.googlesource.com/gn/+/main/docs/reference.md',
    usageExample: 'gn gen out/Default --args="is_debug=false is_component_build=false"',
    defaultArgs: 'gen out/Default',
  },
  {
    id: 'autoninja',
    name: 'autoninja',
    command: 'autoninja',
    category: 'build',
    description: 'Wrapper around Ninja that automatically calculates CPU cores, RAM limits, and reclient/goma concurrency for maximal compilation speed.',
    docUrl: 'https://chromium.googlesource.com/chromium/tools/depot_tools/+/main/autoninja.py',
    usageExample: 'autoninja -C out/Default chrome',
    defaultArgs: '-C out/Default chrome',
  },
  {
    id: 'git-cl',
    name: 'git-cl',
    command: 'git cl',
    category: 'review',
    description: 'Chromium Gerrit code-review and commit workflow automation tool. Handles upload, presubmit tests, formatting, and try-jobs.',
    docUrl: 'https://chromium.googlesource.com/chromium/tools/depot_tools/+/main/git_cl.py',
    usageExample: 'git cl upload',
    defaultArgs: 'upload',
  },
  {
    id: 'vpython3',
    name: 'vpython3',
    command: 'vpython3',
    category: 'runtime',
    description: 'Hermetic Python 3 virtual environment executor that ensures deterministic build scripts and CIPD wheel resolutions across platforms.',
    docUrl: 'https://chromium.googlesource.com/infra/infra/+/main/go/src/infra/tools/vpython3/',
    usageExample: 'vpython3 -v',
    defaultArgs: '--version',
  },
  {
    id: 'cipd',
    name: 'cipd (Chrome Infra Package Deployer)',
    command: 'cipd',
    category: 'package',
    description: 'High-speed content-addressed package management tool for distributing build toolchains, SDKs, and precompiled binaries.',
    docUrl: 'https://chromium.googlesource.com/infra/infra/+/main/cipd/',
    usageExample: 'cipd ensure -root src/third_party -ensure-file DEPS',
    defaultArgs: 'version',
  },
  {
    id: 'clang-format',
    name: 'clang-format',
    command: 'clang-format',
    category: 'review',
    description: 'Official Google C++ and WebEngine code formatter adhering to Chromium formatting standards.',
    docUrl: 'https://chromium.googlesource.com/chromium/src/+/main/docs/clang_format.md',
    usageExample: 'git cl format',
    defaultArgs: '-i',
  },
];

// 2. GN Build Configuration Presets (args.gn)
export const GN_BUILD_ARG_PRESETS: GnBuildArgPreset[] = [
  {
    id: 'production-fast',
    name: 'Production High-Performance (Optimized)',
    targetEnv: 'Windows / Linux / macOS x64',
    description: 'Official production configuration with full LTO optimizations, zero debug overhead, and stripped symbols.',
    features: ['Official Build', 'Optimized V8', 'No Debug Overhead', 'Fastest Page Load'],
    argsContent: `# Production High-Performance Build
is_official_build = true
is_debug = false
is_component_build = false
symbol_level = 0
dcheck_always_on = false
target_cpu = "x64"
proprietary_codecs = true
ffmpeg_branding = "Chrome"
enable_nacl = false
use_thin_lto = true
blink_symbol_level = 0
v8_symbol_level = 0
`,
  },
  {
    id: 'media-codecs',
    name: 'Full Media & Video Codecs (YouTube 4K & Widevine)',
    targetEnv: 'Streaming & Video Hardware Acceleration',
    description: 'Enables proprietary media codecs (H.264, AAC, HEVC), hardware VA-API acceleration, and Widevine CDM for YouTube and media streaming.',
    features: ['H.264 / AAC Codecs', 'Hardware VA-API', 'HEVC Support', 'Smooth YouTube 60FPS'],
    argsContent: `# Full Media & Video Acceleration
is_debug = false
is_component_build = false
proprietary_codecs = true
ffmpeg_branding = "Chrome"
enable_widevine = true
media_use_ffmpeg = true
media_use_libvpx = true
enable_platform_hevc = true
enable_hevc_parser_and_hw_decoder = true
use_vaapi = true
enable_mse_mpeg2ts_stream_parser = true
`,
  },
  {
    id: 'security-hardened',
    name: 'Zero-Trust Security Hardened Sandbox',
    targetEnv: 'Maximum Threat Defense & Isolation',
    description: 'Hardened compilation flags enforcing site isolation, CFI (Control Flow Integrity), and minimal attack surface.',
    features: ['Control Flow Integrity (CFI)', 'Safe Browsing v4', 'Strict Site Isolation', 'NACL Disabled'],
    argsContent: `# Zero-Trust Hardened Chromium
is_official_build = true
is_debug = false
dcheck_always_on = false
enable_nacl = false
safe_browsing_mode = 1
is_cfi = true
use_cfi_cast = true
use_cfi_icall = true
enable_remoting = false
enable_vr = false
enable_plugins = false
enable_pdf = true
`,
  },
  {
    id: 'developer-debug',
    name: 'Developer Debug & Hot Reload (Component Build)',
    targetEnv: 'Development & Extension Testing',
    description: 'Component build linking dynamic shared libraries for fast incremental compile times and interactive debugging.',
    features: ['Component Shared Libs', 'Full V8 Symbols', 'Dcheck Enabled', 'Fastest Link Time'],
    argsContent: `# Developer Debug & Fast Link
is_debug = true
is_component_build = true
symbol_level = 1
dcheck_always_on = true
enable_nacl = false
proprietary_codecs = true
ffmpeg_branding = "Chrome"
`,
  },
];

// 3. Chromium Runtime Flags (chrome://flags equivalent)
export const CHROMIUM_RUNTIME_FLAGS_DEFAULT: ChromiumRuntimeFlag[] = [
  {
    id: 'gpu-rasterization',
    flag: '--enable-gpu-rasterization',
    name: 'GPU Rasterization',
    category: 'graphics',
    description: 'Forces GPU hardware acceleration for rendering web content and CSS layers, delivering smooth 60-120 FPS scrolling.',
    recommended: true,
    enabled: true,
  },
  {
    id: 'zero-copy',
    flag: '--enable-zero-copy',
    name: 'Zero-Copy Rasterizer',
    category: 'graphics',
    description: 'Writes raster buffers directly to GPU memory without intermediate CPU staging buffers, drastically reducing latency and RAM.',
    recommended: true,
    enabled: true,
  },
  {
    id: 'ignore-gpu-blocklist',
    flag: '--ignore-gpu-blocklist',
    name: 'Override Software Rendering List',
    category: 'graphics',
    description: 'Overrides built-in GPU blocklists to enable WebGL and hardware acceleration on all graphics cards.',
    recommended: true,
    enabled: true,
  },
  {
    id: 'vaapi-video-decoder',
    flag: '--enable-features=VaapiVideoDecoder',
    name: 'Hardware Accelerated Video Decoding',
    category: 'media',
    description: 'Enables hardware-accelerated video decoding for H.264, VP9, and AV1 on YouTube and streaming sites.',
    recommended: true,
    enabled: true,
  },
  {
    id: 'quic-protocol',
    flag: '--enable-quic',
    name: 'Experimental QUIC (HTTP/3) Protocol',
    category: 'network',
    description: 'Enables high-throughput UDP-based QUIC protocol for instantaneous connection establishment and zero-RTT handshakes.',
    recommended: true,
    enabled: true,
  },
  {
    id: 'parallel-downloading',
    flag: '--enable-features=ParallelDownloading',
    name: 'Parallel Downloading Engine',
    category: 'network',
    description: 'Splits multi-megabyte file downloads into concurrent parallel HTTP ranges, speeding up download transfers by 200-400%.',
    recommended: true,
    enabled: true,
  },
  {
    id: 'strict-site-isolation',
    flag: '--site-per-process',
    name: 'Process-Per-Site Isolation',
    category: 'security',
    description: 'Renders every distinct web origin in its own dedicated, sandboxed operating system process to block Spectre/Meltdown leaks.',
    recommended: true,
    enabled: true,
  },
  {
    id: 'v8-cache-options',
    flag: '--js-flags="--max-old-space-size=4096"',
    name: 'V8 4GB High-Memory Heap',
    category: 'v8',
    description: 'Allocates up to 4GB of RAM to V8 JavaScript garbage collector heap, preventing Out-Of-Memory crashes in heavy web apps.',
    recommended: true,
    enabled: true,
  },
];

const LOCAL_STORAGE_FLAGS_KEY = 'aegis_chromium_runtime_flags';

export function getStoredChromiumFlags(): ChromiumRuntimeFlag[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FLAGS_KEY);
    if (!raw) return CHROMIUM_RUNTIME_FLAGS_DEFAULT;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {}
  return CHROMIUM_RUNTIME_FLAGS_DEFAULT;
}

export function saveChromiumFlags(flags: ChromiumRuntimeFlag[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_FLAGS_KEY, JSON.stringify(flags));
  } catch (err) {
    console.warn('Failed to save Chromium runtime flags:', err);
  }
}

export function toggleChromiumFlag(flagId: string): ChromiumRuntimeFlag[] {
  const current = getStoredChromiumFlags();
  const updated = current.map((f) => (f.id === flagId ? { ...f, enabled: !f.enabled } : f));
  saveChromiumFlags(updated);
  return updated;
}

// 4. Generate Command Pipeline script for Depot Tools
export function generateDepotToolsSetupScript(platform: 'windows' | 'linux' | 'macos'): string {
  if (platform === 'windows') {
    return `# 1. Clone Chromium Depot Tools (Run in PowerShell as Administrator)
git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git C:\\src\\depot_tools

# 2. Add Depot Tools to front of user PATH
$env:Path = "C:\\src\\depot_tools;" + $env:Path
[Environment]::SetEnvironmentVariable("Path", "C:\\src\\depot_tools;" + [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User), [EnvironmentVariableTarget]::User)

# 3. Enable Windows Chromium build tools
$env:DEPOT_TOOLS_WIN_TOOLCHAIN = 0
[Environment]::SetEnvironmentVariable("DEPOT_TOOLS_WIN_TOOLCHAIN", "0", [EnvironmentVariableTarget]::User)

# 4. Verify installation
gclient --version
`;
  }

  return `# 1. Clone Chromium Depot Tools
git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git ~/depot_tools

# 2. Add Depot Tools to PATH
export PATH="$HOME/depot_tools:$PATH"
echo 'export PATH="$HOME/depot_tools:$PATH"' >> ~/.bashrc

# 3. Verify installation
gclient --version
`;
}
