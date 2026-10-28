// Writes build-info.json so every build knows what it is and who built it.
// Semver, with major.minor from package.json:
//   CI builds:    0.1.<run number>+<commit>
//   Local builds: 0.1.0-local.<user>.<UTC timestamp>+<commit>  (pre-release: sorts below CI builds)
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { userInfo } from 'node:os';

const git = (args) => {
  try {
    return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return '';
  }
};

const ci = process.env.GITHUB_ACTIONS === 'true';
const [major, minor] = JSON.parse(readFileSync('package.json', 'utf8')).version.split('.');
const commit = git('rev-parse --short HEAD') || 'uncommitted';
const dirty = git('status --porcelain') !== '';
const builtAt = new Date().toISOString();
const builtBy = ci ? process.env.GITHUB_ACTOR : userInfo().username;
const timestamp = builtAt.replace(/[-:]/g, '').slice(0, 13) + 'Z'; // 20261028T1530Z (UTC)

const version = ci
  ? `${major}.${minor}.${process.env.GITHUB_RUN_NUMBER}+${commit}`
  : `${major}.${minor}.0-local.${builtBy}.${timestamp}+${commit}`;

const info = { version, commit, dirty, builtBy, builtAt, source: ci ? 'ci' : 'local' };
writeFileSync('build-info.json', JSON.stringify(info, null, 2) + '\n');
console.log(`build ${version}${dirty ? ' (dirty)' : ''}`);
