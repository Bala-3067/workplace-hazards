/**
 * run-tests.mjs
 * Launcher: changes process.chdir to the project root before running tests,
 * so relative paths in test files resolve correctly regardless of where
 * Node is invoked from.
 *
 * Usage:  node tests/run-tests.mjs
 */
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')

const result = spawnSync(
  process.execPath,
  ['--test', join(projectRoot, 'tests', 'security-rules-enhanced.test.mjs')],
  {
    cwd:   projectRoot,      // ← critical: node_modules + relative rule paths
    stdio: 'inherit',
    env:   { ...process.env },
  }
)

process.exit(result.status ?? 1)
