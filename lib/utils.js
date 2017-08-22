'use strict'

const fs = require('fs')
const child_process = require('child_process')
const mkdirp = require('mkdirp')

const errorUuid = require('uuid')()

exports.errorUuid = errorUuid

exports.containsEpdfError = containsEpdfError
function containsEpdfError (value) {
  return String(value).includes(errorUuid)
}

exports.extend = extend
function extend (...values) {
  return Object.assign({}, ...values)
}

class Future extends require('posterus').Future {
  constructor () {
    super(...arguments)
    this.settle = this.settle.bind(this)
  }
}

exports.Future = Future

exports.printToPDF = printToPDF
function printToPDF (window, pdfOptions) {
  return Future.init(future => {
    window.webContents.printToPDF(pdfOptions, future.settle)
  })
}

exports.delay = delay
function delay (time) {
  return Future.init(future => after(time, future.settle))
}

exports.after = after
function after (delay, fun, ...args) {
  return clearTimeout.bind(null, setTimeout(fun, delay, ...args))
}

exports.once = once
function once (emitter, eventName) {
  return Future.init(future => {
    function onEvent (value) {
      future.settle(null, value)
    }

    emitter.once(eventName, onEvent)

    return function onDeinit () {
      emitter.removeListener(eventName, onEvent)
    }
  })
}

exports.exec = exec
function exec (cmd, options) {
  return Future.init(future => {
    const proc = child_process.exec(cmd, options, (error, stdout, stderr) => {
      if (error) future.settle(error)
      future.settle(null, {stdout, stderr})
    })
    return proc.kill.bind(proc)
  })
}

exports.readFile = readFile
function readFile (filename, encoding) {
  return Future.init(future => {
    fs.readFile(filename, encoding, future.settle)
  })
}

exports.writeFile = writeFile
function writeFile (filename, buffer) {
  return Future.init(future => {
    fs.writeFile(filename, buffer, future.settle)
  })
}

exports.mkdir = mkdir
function mkdir (path) {
  return Future.init(future => {
    mkdirp(path, future.settle)
  })
}

exports.serialiseArgDict = serialiseArgDict
function serialiseArgDict (dict) {
  const out = []
  for (const key in dict) {
    const arg = serialiseArg(key, dict[key])
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
