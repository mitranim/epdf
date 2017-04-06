'use strict'

const pt = require('path')
const del = require('del')
const uuid = require('uuid')
const electronPath = require('electron')
const {mkdir, exec, readFile, serialiseArgDict, extend} = require('./utils')
const pdfModulePath = pt.join(__dirname, 'epdf.js')

exports.render = render
async function render (args) {
  let {out} = args

  const useTmpFile = !out

  // We use a temp file instead of `stdout` because when exceeding a certain
  // size, the `stdout` in the parent process gets bugged: it has the correct
  // size, but reading from it produces duplicate data.
  if (useTmpFile) {
    const TMP_DIR = pt.join(require('os').tmpdir(), 'epdf')
    out = pt.join(TMP_DIR, `${uuid()}.pdf`)
    args = extend(args, {out})
    await mkdir(TMP_DIR)
  }

  process.once('exit', cleanup)

  function cleanup () {
    process.removeListener('exit', cleanup)
    if (useTmpFile) del(out, {force: true}).catch(console.error.bind(console))
  }

  try {
    const {stdout, stderr} = await exec(`${electronPath} ${pdfModulePath} ${serialiseArgDict(args)}`)
    process.stdout.write(stdout)
    process.stderr.write(stderr)
    return readFile(out)
  }
  finally {
    cleanup()
  }
}
