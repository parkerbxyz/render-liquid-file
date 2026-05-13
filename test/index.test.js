import { spawnSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function createTempDir() {
  return mkdtempSync(join(tmpdir(), 'render-liquid-file-'))
}

function runAction(inputs, tempDir) {
  const outputPath = join(tempDir, 'github-output')
  const eventPath = join(tempDir, 'event.json')
  writeFileSync(eventPath, '{}')
  writeFileSync(outputPath, '')

  const env = {
    ...process.env,
    GITHUB_EVENT_PATH: eventPath,
    GITHUB_OUTPUT: outputPath,
    INPUT_EXTNAME: '',
    INPUT_ROOT: '',
    INPUT_LAYOUTS: '',
    INPUT_PARTIALS: '',
    INPUT_FILE: '',
  }

  for (const [name, value] of Object.entries(inputs)) {
    env[`INPUT_${name.toUpperCase()}`] = value
  }

  return {
    outputPath,
    result: spawnSync(process.execPath, ['index.js'], {
      cwd: repoRoot,
      encoding: 'utf8',
      env,
    }),
  }
}

function readOutput(name, outputPath) {
  const output = readFileSync(outputPath, 'utf8')
  const match = output.match(
    new RegExp(`${name}<<(.+)\\r?\\n([\\s\\S]*)\\r?\\n\\1(?:\\r?\\n)?$`),
  )
  assert.ok(match, `Expected ${name} in GITHUB_OUTPUT`)
  return match[2]
}

test('renders a Liquid file and writes rendered-content output', () => {
  const tempDir = createTempDir()

  try {
    const root = join(tempDir, 'templates')
    const layouts = join(root, 'layouts')
    const partials = join(root, 'partials')

    mkdirSync(layouts, { recursive: true })
    mkdirSync(partials, { recursive: true })
    writeFileSync(
      join(root, 'page.liquid'),
      "{% layout 'base' %}Hello,{% render 'name', name: 'Ada' %}!",
    )
    writeFileSync(
      join(layouts, 'base.liquid'),
      '<main>{% block %}{% endblock %}</main>',
    )
    writeFileSync(join(partials, 'name.liquid'), '{{ name }}')

    const { outputPath, result } = runAction(
      {
        extname: '.liquid',
        root,
        layouts,
        partials,
        file: 'page',
      },
      tempDir,
    )

    assert.equal(result.status, 0, result.stderr || result.stdout)
    assert.equal(
      readOutput('rendered-content', outputPath),
      '<main>Hello,Ada!</main>',
    )
  } finally {
    rmSync(tempDir, { force: true, recursive: true })
  }
})

test('reports failure when the template file is missing', () => {
  const tempDir = createTempDir()

  try {
    const root = join(tempDir, 'templates')
    mkdirSync(root, { recursive: true })

    const { result } = runAction(
      {
        root,
        file: 'missing-template',
      },
      tempDir,
    )

    const failureOutput = `${result.stdout}${result.stderr}`
    assert.notEqual(result.status, 0)
    assert.match(failureOutput, /::error::/)
    assert.match(failureOutput, /missing-template/)
  } finally {
    rmSync(tempDir, { force: true, recursive: true })
  }
})
