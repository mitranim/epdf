'use strict'

const fs = require('fs')
const child_process = require('child_process')
const mkdirp = require('mkdirp')
const {Future} = require('posterus')

exports.errorUuid = require('uuid')()

exports.containsEpdfError = containsEpdfError
function containsEpdfError (value) {
  return String(value).includes(exports.errorUuid)
}

exports.extend = extend
function extend (...values) {
  return Object.assign({}, ...values)
}

exports.printToPDF = printToPDF
function printToPDF (window, pdfOptions) {
  const future = new Future()
  window.webContents.printToPDF(pdfOptions, future.settle.bind(future))
  return future
}

exports.delay = delay
function delay (time) {
  const future = new Future()
  const cancel = after(time, future.settle.bind(future))
  return future.finally(cancel)
}

exports.after = after
function after (delay, fun, ...args) {
  return clearTimeout.bind(null, setTimeout(fun, delay, ...args))
}

exports.once = once
function once (emitter, eventName) {
  const future = new Future()
  function onEvent (value) {future.settle(null, value)}
  emitter.once(eventName, onEvent)
  return future.finally(function finalize () {
    emitter.removeListener(eventName, onEvent)
  })
}

exports.exec = exec
function exec (cmd, options) {
  const future = new Future()
  const proc = child_process.exec(cmd, options, (error, stdout, stderr) => {
    if (error) future.settle(error)
    future.settle(null, {stdout, stderr})
  })
  return future.finally(function finalize (error) {
    if (error) proc.kill()
  })
}

exports.readFile = readFile
function readFile (filename, encoding) {
  const future = new Future()
  fs.readFile(filename, encoding, future.settle.bind(future))
  return future
}

exports.writeFile = writeFile
function writeFile (filename, buffer) {
  const future = new Future()
  fs.writeFile(filename, buffer, future.settle.bind(future))
  return future
}

exports.mkdir = mkdir
function mkdir (path) {
  const future = new Future()
  mkdirp(path, future.settle.bind(future))
  return future
}

exports.serialiseArgs = serialiseArgs
function serialiseArgs (args, namedArgs) {
  const out = args.slice()
  for (const key in namedArgs) {
    const arg = serialiseArg(key, namedArgs[key])
    if (arg) out.push(arg)
  }
  return out.join(' ')
}

exports.serialiseArg = serialiseArg
function serialiseArg (optionName, optionValue) {
  return optionValue == null ? '' : `--${optionName}="${optionValue}"`
}

exports.yargsSpecialKey = yargsSpecialKey
function yargsSpecialKey (__, key) {
  return key === '_' || /^\$\d/.test(key)
}

exports.omitBy = omitBy
function omitBy (fun, dict) {
  const out = {}
  for (const key in dict) if (!fun(dict[key], key)) out[key] = dict[key]
  return out
}

exports.onlyNamedArgs = onlyNamedArgs
function onlyNamedArgs(args) {
  return omitBy(yargsSpecialKey, args)
}
