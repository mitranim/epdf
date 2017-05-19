'use strict'

const pt = require('path')
const del = require('del')
const uuid = require('uuid')
const electronPath = require('electron')
const {mkdir, exec, readFile, serialiseArgDict, extend} = require('./utils')
const pdfModulePath = pt.join(__dirname, 'epdf.js')

exports.render = render
function render (args) {
  return args.out ? renderToFile(args) : renderToStdout(args)
}

function renderToFile (args) {
  return exec(`${electronPath} ${pdfModulePath} ${serialiseArgDict(args)}`).mapResult(logExec)
}

function renderToStdout (args) {
  const TMP_DIR = pt.join(require('os').tmpdir(), 'epdf')
  const out = pt.join(TMP_DIR, `${uuid()}.pdf`)
  args = extend(args, {out})

  // We use a temp file instead of `stdout` because when exceeding a certain size,
  // the `stdout` in the parent process gets bugged: it has the correct size,
  // but reading from it produces duplicate data.
  return mkdir(TMP_DIR)
    .mapResult(() => exec(`${electronPath} ${pdfModulePath} ${serialiseArgDict(args)}`))
    .mapResult(logExec)
    .mapResult(() => readFile(out))
    .mapResult(result => {
      del(out, {force: true}).catch(console.error.bind(console))
      return result
    })
}

// This contains yargs output and errors.
// The result of rendering is passed through a file.
function logExec ({stdout, stderr}) {
  process.stdout.write(stdout)
  // We exit Electron with code 0 to avoid annoying nagging on next startup.
  // Non-empty stderr means there was an error.
  if (stderr.length) throw stderr
}
