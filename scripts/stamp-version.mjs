// Writes build-info.json so every build knows what it is and who built it.
// CI builds:    <run number>+<commit>, built by the GitHub actor.
// Local builds: local-<username>-<timestamp>+<commit>, with a dirty flag.
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { userInfo } from 'node:os';

const git = (args) => {
  try {
    return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
};

const ci = process.env.GITHUB_ACTIONS === 'true';
const commit = git('rev-parse --short HEAD') || 'uncommitted';
const dirty = git('status --porcelain') !== '';
const builtAt = new Date().toISOString();
const builtBy = ci ? process.env.GITHUB_ACTOR : userInfo().username;
const timestamp = builtAt.replace(/[-:]/g, '').slice(0, 13); // 20261028T1530

const version = ci
  ? `${process.env.GITHUB_RUN_NUMBER}+${commit}`
  : `local-${builtBy}-${timestamp}+${commit}`;

const info = { version, commit, dirty, builtBy, builtAt, source: ci ? 'ci' : 'local' };
writeFileSync('build-info.json', JSON.stringify(info, null, 2) + '\n');
console.log(`build ${version}${dirty ? ' (dirty)' : ''}`);
