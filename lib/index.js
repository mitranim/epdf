'use strict'

const pt = require('path')
const del = require('del')
const uuid = require('uuid')
const electronPath = require('electron')
const {mkdir, exec, readFile, serialiseArgDict, extend, containsEpdfError} = require('./utils')
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
  const cmd = `${electronPath} ${pdfModulePath} ${serialiseArgDict(extend(args, {out}))}`

  // We use a temp file instead of `stdout` because when exceeding a certain size,
  // the `stdout` in the parent process gets bugged: it has the correct size,
  // but reading from it produces duplicate data.
  return mkdir(TMP_DIR)
    .mapResult(() => exec(cmd))
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
  // We exit Electron with code 0 to avoid annoying nagging on next startup,
  // and "guess" the error by using a secret message!
  if (containsEpdfError(stderr)) throw stderr
  else process.stderr.write(stderr)
}
