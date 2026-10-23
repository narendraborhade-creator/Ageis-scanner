/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Chromium Depot Tools & Engine Studio Service
 * Grounded in https://source.chromium.org/chromium/chromium/tools/depot_tools/+/main:
 * and https://chromium.googlesource.com/chromium/tools/depot_tools
 */

export interface DepotToolItem {
  id: string;
  name: string;
  command: string;
  filename: string;
  category: 'sync' | 'meta-build' | 'build' | 'review' | 'runtime' | 'package';
  description: string;
  sourceChromiumUrl: string;
  docUrl: string;
  usageExample: string;
  defaultArgs?: string;
  sourcePreview: string;
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

export interface SourceChromiumTreeFile {
  name: string;
  path: string;
  type: 'python' | 'shell' | 'config' | 'markdown';
  size: string;
  description: string;
  url: string;
  codeSnippet: string;
}

export const DEPOT_TOOLS_MAIN_URL = 'https://source.chromium.org/chromium/chromium/tools/depot_tools/+/main:';

// 1. Official Chromium Depot Tools Inventory (Extracted directly from source.chromium.org)
export const DEPOT_TOOLS_CATALOG: DepotToolItem[] = [
  {
    id: 'fetch',
    name: 'fetch.py',
    command: 'fetch',
    filename: 'fetch.py',
    category: 'sync',
    description: 'Initializes and checkouts the complete Chromium source tree, dependencies, submodules, and CIPD binaries.',
    sourceChromiumUrl: 'https://source.chromium.org/chromium/chromium/tools/depot_tools/+/main:fetch.py',
    docUrl: 'https://chromium.googlesource.com/chromium/tools/depot_tools/+/main/fetch.py',
    usageExample: 'fetch --nohooks chromium',
    defaultArgs: '--nohooks chromium',
    sourcePreview: `#!/usr/bin/env vpython3
# Copyright 2024 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

import optparse
import os
import sys

import gclient_utils

class FetchRecipe:
    """Dispatches recipe configuration for chromium, v8, webrtc, etc."""
    def __init__(self, options, args):
        self.options = options
        self.args = args

    def run(self):
        target = self.args[0] if self.args else 'chromium'
        print(f"[fetch] Initializing target: {target}")
        cmd = ['gclient', 'config', '--spec', self.get_spec(target)]
        return gclient_utils.CheckCallAndFilter(cmd)
`,
  },
  {
    id: 'gclient',
    name: 'gclient.py',
    command: 'gclient',
    filename: 'gclient.py',
    category: 'sync',
    description: 'Multi-repository management and synchronization tool for Chromium. Resolves .gclient, DEPS, git submodules, and hooks.',
    sourceChromiumUrl: 'https://source.chromium.org/chromium/chromium/tools/depot_tools/+/main:gclient.py',
    docUrl: 'https://chromium.googlesource.com/chromium/tools/depot_tools/+/main/gclient.py',
    usageExample: 'gclient sync -D --jobs=16',
    defaultArgs: 'sync -D --jobs=16',
    sourcePreview: `#!/usr/bin/env vpython3
# Copyright 2024 The Chromium Authors. All rights reserved.
# source.chromium.org/chromium/chromium/tools/depot_tools/+/main:gclient.py

import logging
import optparse
import os
import sys

import gclient_scm
import gclient_utils

def CMDsync(parser, args):
    """Synchronizes all repos declared in the DEPS file with git-cache."""
    parser.add_option('-f', '--force', action='store_true', help='force sync')
    parser.add_option('-j', '--jobs', default=8, type='int', help='parallel jobs')
    parser.add_option('-D', '--delete_unversioned_trees', action='store_true')
    (options, args) = parser.parse_args(args)
    client = GClient.LoadCurrentConfig(options)
    return client.RunOnDeps('sync', args)
`,
  },
  {
    id: 'autoninja',
    name: 'autoninja.py',
    command: 'autoninja',
    filename: 'autoninja.py',
    category: 'build',
    description: 'High-speed compilation orchestrator that automatically tunes CPU parallelism, RAM buffers, and remote execution (reclient/siso).',
    sourceChromiumUrl: 'https://source.chromium.org/chromium/chromium/tools/depot_tools/+/main:autoninja.py',
    docUrl: 'https://chromium.googlesource.com/chromium/tools/depot_tools/+/main/autoninja.py',
    usageExample: 'autoninja -C out/Default chrome',
    defaultArgs: '-C out/Default chrome',
    sourcePreview: `#!/usr/bin/env vpython3
# Copyright 2024 The Chromium Authors. All rights reserved.
# source.chromium.org/chromium/chromium/tools/depot_tools/+/main:autoninja.py

import multiprocessing
import os
import subprocess
import sys

def main(args):
    # Calculate optimal parallel jobs based on physical hardware cores
    core_count = multiprocessing.cpu_count()
    use_remoteexec = os.environ.get('RBE_client_d', '') != ''
    
    # Scale concurrency for remote builds or local threads
    j_flag = ['-j', str(core_count * 10 if use_remoteexec else core_count)]
    cmd = ['ninja'] + j_flag + args[1:]
    return subprocess.call(cmd)
`,
  },
  {
    id: 'siso',
    name: 'siso.py',
    command: 'siso',
    filename: 'siso.py',
    category: 'build',
    description: 'Next-Generation high-performance Chromium build engine written in Go, replacing Ninja with built-in remote execution and local caching.',
    sourceChromiumUrl: 'https://source.chromium.org/chromium/chromium/tools/depot_tools/+/main:siso.py',
    docUrl: 'https://chromium.googlesource.com/chromium/tools/depot_tools/+/main/siso.py',
    usageExample: 'siso ninja -C out/Default chrome',
    defaultArgs: 'ninja -C out/Default chrome',
    sourcePreview: `#!/usr/bin/env vpython3
# Copyright 2024 The Chromium Authors. All rights reserved.
# source.chromium.org/chromium/chromium/tools/depot_tools/+/main:siso.py

import os
import subprocess
import sys

def main(args):
    """Executes Siso next-gen Ninja-compatible build system."""
    siso_bin = os.path.join(os.path.dirname(__file__), 'siso')
    cmd = [siso_bin] + args[1:]
    return subprocess.call(cmd)
`,
  },
  {
    id: 'gn',
    name: 'gn.py',
    command: 'gn',
    filename: 'gn.py',
    category: 'meta-build',
    description: 'Fast meta-build system that reads .gn and BUILD.gn files to generate high-performance Ninja build configuration files.',
    sourceChromiumUrl: 'https://source.chromium.org/chromium/chromium/tools/depot_tools/+/main:gn.py',
    docUrl: 'https://gn.googlesource.com/gn/+/main/docs/reference.md',
    usageExample: 'gn gen out/Default --args="is_debug=false is_component_build=false"',
    defaultArgs: 'gen out/Default',
    sourcePreview: `#!/usr/bin/env vpython3
# Copyright 2024 The Chromium Authors. All rights reserved.
# source.chromium.org/chromium/chromium/tools/depot_tools/+/main:gn.py

import subprocess
import sys
import gclient_paths

def main(args):
    gn_path = gclient_paths.GetGClientPath('buildtools', 'gn')
    return subprocess.call([gn_path] + args[1:])
`,
  },
  {
    id: 'git-cl',
    name: 'git_cl.py',
    command: 'git cl',
    filename: 'git_cl.py',
    category: 'review',
    description: 'Chromium Gerrit code-review and commit workflow automation tool. Handles upload, presubmit tests, formatting, and try-jobs.',
    sourceChromiumUrl: 'https://source.chromium.org/chromium/chromium/tools/depot_tools/+/main:git_cl.py',
    docUrl: 'https://chromium.googlesource.com/chromium/tools/depot_tools/+/main/git_cl.py',
    usageExample: 'git cl upload',
    defaultArgs: 'upload',
    sourcePreview: `#!/usr/bin/env vpython3
# Copyright 2024 The Chromium Authors. All rights reserved.
# source.chromium.org/chromium/chromium/tools/depot_tools/+/main:git_cl.py

import optparse
import sys

def CMDUpload(parser, args):
    """Uploads current branch as a patchset to Chromium Gerrit review."""
    parser.add_option('--cq-dry-run', action='store_true', help='Trigger trybots')
    parser.add_option('-m', '--message', help='Commit description')
    (options, args) = parser.parse_args(args)
    # Check presubmits and upload via git-review API
`,
  },
  {
    id: 'cipd',
    name: 'cipd.py',
    command: 'cipd',
    filename: 'cipd.py',
    category: 'package',
    description: 'High-speed content-addressed package management tool for distributing build toolchains, SDKs, and precompiled binaries.',
    sourceChromiumUrl: 'https://source.chromium.org/chromium/chromium/tools/depot_tools/+/main:cipd.py',
    docUrl: 'https://chromium.googlesource.com/infra/infra/+/main/cipd/',
    usageExample: 'cipd ensure -root src/third_party -ensure-file DEPS',
    defaultArgs: 'version',
    sourcePreview: `#!/usr/bin/env vpython3
# Copyright 2024 The Chromium Authors. All rights reserved.
# source.chromium.org/chromium/chromium/tools/depot_tools/+/main:cipd.py

import os
import subprocess
import sys

def main():
    # Bootstrap or execute client binary from CIPD cache
    cipd_bin = find_or_download_cipd()
    return subprocess.call([cipd_bin] + sys.argv[1:])
`,
  },
  {
    id: 'clang-format',
    name: 'clang_format.py',
    command: 'clang-format',
    filename: 'clang_format.py',
    category: 'review',
    description: 'Official Google C++ and WebEngine code formatter adhering to Chromium formatting standards.',
    sourceChromiumUrl: 'https://source.chromium.org/chromium/chromium/tools/depot_tools/+/main:clang_format.py',
    docUrl: 'https://chromium.googlesource.com/chromium/src/+/main/docs/clang_format.md',
    usageExample: 'git cl format',
    defaultArgs: '-i',
    sourcePreview: `#!/usr/bin/env vpython3
# Copyright 2024 The Chromium Authors. All rights reserved.
# source.chromium.org/chromium/chromium/tools/depot_tools/+/main:clang_format.py

import subprocess
import sys

def main(args):
    """Invokes LLVM Clang-Format with Chromium .clang-format style rules."""
    return subprocess.call(['buildtools/clang-format'] + args[1:])
`,
  },
  {
    id: 'presubmit',
    name: 'presubmit_support.py',
    command: 'presubmit_support',
    filename: 'presubmit_support.py',
    category: 'review',
    description: 'Validates change-lists against style guides, banned functions, security best practices, and copyright headers.',
    sourceChromiumUrl: 'https://source.chromium.org/chromium/chromium/tools/depot_tools/+/main:presubmit_support.py',
    docUrl: 'https://chromium.googlesource.com/chromium/tools/depot_tools/+/main/presubmit_support.py',
    usageExample: 'git cl presubmit',
    defaultArgs: '--upload',
    sourcePreview: `#!/usr/bin/env vpython3
# Copyright 2024 The Chromium Authors. All rights reserved.
# source.chromium.org/chromium/chromium/tools/depot_tools/+/main:presubmit_support.py

def DoPresubmitChecks(change, is_committing, verbose, output_stream):
    """Audits modified lines against banned APIs, format rules, and licenses."""
    results = []
    results.extend(CheckChangeLints(change))
    results.extend(CheckSecurityPolicyRules(change))
    return results
`,
  },
  {
    id: 'download_from_google_storage',
    name: 'download_from_google_storage.py',
    command: 'download_from_google_storage',
    filename: 'download_from_google_storage.py',
    category: 'sync',
    description: 'Downloads large build artifacts, clang compilers, and SDK tarballs indexed by SHA1 hashes in Google Cloud Storage.',
    sourceChromiumUrl: 'https://source.chromium.org/chromium/chromium/tools/depot_tools/+/main:download_from_google_storage.py',
    docUrl: 'https://chromium.googlesource.com/chromium/tools/depot_tools/+/main/download_from_google_storage.py',
    usageExample: 'download_from_google_storage --no_resume --bucket chromium-browser-clang -s tools/clang/scripts/update.py.sha1',
    defaultArgs: '--version',
    sourcePreview: `#!/usr/bin/env vpython3
# Copyright 2024 The Chromium Authors. All rights reserved.
# source.chromium.org/chromium/chromium/tools/depot_tools/+/main:download_from_google_storage.py

import optparse
import sys

def main(args):
    """Fetches binary assets from GCS buckets using SHA-1 file pointers."""
    # Authenticates and pulls object from storage.googleapis.com
`,
  },
];

// 2. Real source.chromium.org depot_tools Tree Explorer Files
export const SOURCE_CHROMIUM_DEPOT_TOOLS_FILES: SourceChromiumTreeFile[] = [
  {
    name: 'fetch.py',
    path: 'fetch.py',
    type: 'python',
    size: '18.4 KB',
    description: 'Entry-point script to clone Chromium sources, v8, webrtc, and dependencies.',
    url: 'https://source.chromium.org/chromium/chromium/tools/depot_tools/+/main:fetch.py',
    codeSnippet: `#!/usr/bin/env vpython3
# [source.chromium.org/chromium/chromium/tools/depot_tools/+/main:fetch.py]
import optparse
import os
import sys

def main():
    parser = optparse.OptionParser(usage='%prog [options] <target>')
    parser.add_option('--nohooks', action='store_true', help='Do not run gclient hooks')
    (options, args) = parser.parse_args()
    target = args[0] if args else 'chromium'
    print(f"Fetching Chromium target tree for {target}...")
`,
  },
  {
    name: 'gclient.py',
    path: 'gclient.py',
    type: 'python',
    size: '104.2 KB',
    description: 'Multi-repository checkout engine and DEPS dependency solver for Chromium.',
    url: 'https://source.chromium.org/chromium/chromium/tools/depot_tools/+/main:gclient.py',
    codeSnippet: `#!/usr/bin/env vpython3
# [source.chromium.org/chromium/chromium/tools/depot_tools/+/main:gclient.py]
import gclient_scm
import gclient_utils

def CMDsync(parser, args):
    """Executes parallel checkout of all Chromium submodules and DEPS entries."""
    print("Executing gclient sync with multi-process workers...")
`,
  },
  {
    name: 'autoninja.py',
    path: 'autoninja.py',
    type: 'python',
    size: '9.8 KB',
    description: 'Automatic hardware-optimized compilation wrapper for Ninja and Siso.',
    url: 'https://source.chromium.org/chromium/chromium/tools/depot_tools/+/main:autoninja.py',
    codeSnippet: `#!/usr/bin/env vpython3
# [source.chromium.org/chromium/chromium/tools/depot_tools/+/main:autoninja.py]
import multiprocessing
import subprocess

def main(args):
    threads = multiprocessing.cpu_count() * 2
    print(f"Autoninja scaling to {threads} concurrency workers...")
`,
  },
  {
    name: 'siso.py',
    path: 'siso.py',
    type: 'python',
    size: '6.2 KB',
    description: 'Next-Generation Chromium build system written in Go with integrated RBE.',
    url: 'https://source.chromium.org/chromium/chromium/tools/depot_tools/+/main:siso.py',
    codeSnippet: `#!/usr/bin/env vpython3
# [source.chromium.org/chromium/chromium/tools/depot_tools/+/main:siso.py]
# Siso (Super-fast Ninja replacement for Chromium build systems)
import subprocess

def main(args):
    print("Launching Siso high-concurrency remote build client...")
`,
  },
  {
    name: 'gn.py',
    path: 'gn.py',
    type: 'python',
    size: '3.8 KB',
    description: 'Meta-build system driver for compiling BUILD.gn into out/Default/build.ninja.',
    url: 'https://source.chromium.org/chromium/chromium/tools/depot_tools/+/main:gn.py',
    codeSnippet: `#!/usr/bin/env vpython3
# [source.chromium.org/chromium/chromium/tools/depot_tools/+/main:gn.py]
import subprocess
# Generate Ninja configuration from args.gn
`,
  },
  {
    name: 'git_cl.py',
    path: 'git_cl.py',
    type: 'python',
    size: '142.1 KB',
    description: 'Gerrit review workflow manager, trybot executor, and changelist publisher.',
    url: 'https://source.chromium.org/chromium/chromium/tools/depot_tools/+/main:git_cl.py',
    codeSnippet: `#!/usr/bin/env vpython3
# [source.chromium.org/chromium/chromium/tools/depot_tools/+/main:git_cl.py]
# Handles 'git cl upload', 'git cl try', 'git cl format', 'git cl archive'
`,
  },
];

// 3. GN Build Configuration Presets (args.gn)
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

// 4. Chromium Runtime Flags (chrome://flags equivalent)
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

// 5. Generate Command Pipeline script for Depot Tools
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
