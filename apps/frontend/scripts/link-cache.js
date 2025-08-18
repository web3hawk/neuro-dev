// Ensure node_modules/.cache points to ../../lib/.cache via junction/symlink.
// This redirects caches produced during `npm install` (e.g., 0.pack, 1.pack, etc.)
// away from local node_modules to a shared location, as required.

const fs = require('fs');
const path = require('path');

function ensureDir(p) {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
}

function isSymlink(p) {
  try {
    const stat = fs.lstatSync(p);
    return stat.isSymbolicLink();
  } catch (_) {
    return false;
  }
}

function isDirectory(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch (_) {
    return false;
  }
}

function moveDirContents(src, dest) {
  ensureDir(dest);
  for (const name of fs.readdirSync(src)) {
    const from = path.join(src, name);
    const to = path.join(dest, name);
    if (fs.existsSync(to)) {
      // Skip if already exists
      continue;
    }
    fs.renameSync(from, to);
  }
}

function main() {
  const projectRoot = __dirname.replace(/[/\\]scripts$/, '');
  const target = path.resolve(projectRoot, '..', '..', 'lib', '.cache'); // ../../lib/.cache
  const nodeModules = path.resolve(projectRoot, 'node_modules');
  const linkPath = path.join(nodeModules, '.cache');

  ensureDir(target);
  ensureDir(nodeModules);

  if (fs.existsSync(linkPath)) {
    if (isSymlink(linkPath)) {
      // Remove existing symlink/junction if pointing elsewhere
      try {
        fs.unlinkSync(linkPath);
      } catch (_) {}
    } else if (isDirectory(linkPath)) {
      // Move existing contents to target, then remove dir
      try {
        moveDirContents(linkPath, target);
      } catch (_) {}
      try {
        fs.rmdirSync(linkPath, { recursive: true });
      } catch (_) {}
    } else {
      try { fs.unlinkSync(linkPath); } catch (_) {}
    }
  }

  // Create junction on Windows for best compatibility, falls back to dir symlink on others
  const type = process.platform === 'win32' ? 'junction' : 'dir';
  try {
    fs.symlinkSync(target, linkPath, type);
    console.log(`[link-cache] Linked ${linkPath} -> ${target}`);
  } catch (err) {
    console.warn('[link-cache] Failed to create symlink, attempting to copy existing files instead.', err.message);
    // As a fallback, leave the directory as-is (already moved contents earlier) and rely on future runs.
    ensureDir(linkPath);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    console.error('[link-cache] Error:', e);
    process.exit(0); // do not fail install
  }
}

module.exports = main;
