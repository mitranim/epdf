'use strict'

const fs = require('fs')
const child_process = require('child_process')
const mkdirp = require('mkdirp')

exports.extend = extend
function extend (...values) {
  return Object.assign({}, ...values)
}

class Future extends require('posterus').Future {
  constructor () {
    super(...arguments)
    this.arrive = this.arrive.bind(this)
  }
}

exports.Future = Future

exports.printToPDF = printToPDF
function printToPDF (window, pdfOptions) {
  return Future.init(future => {
    window.webContents.printToPDF(pdfOptions, future.arrive)
  })
}

exports.delay = delay
function delay (time) {
  return Future.init(future => after(time, future.arrive))
}

exports.after = after
function after (delay, fun, ...args) {
  return clearTimeout.bind(null, setTimeout(fun, delay, ...args))
}

exports.once = once
function once (emitter, eventName) {
  return Future.init(future => {
    function onEvent (value) {
      future.arrive(null, value)
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
      if (error) future.arrive(stderr.length ? stderr : error)
      future.arrive(null, {stdout, stderr})
    })
    return proc.kill.bind(proc)
  })
}

exports.readFile = readFile
function readFile (filename, encoding) {
  return Future.init(future => {
    fs.readFile(filename, encoding, future.arrive)
  })
}

exports.writeFile = writeFile
function writeFile (filename, buffer) {
  return Future.init(future => {
    fs.writeFile(filename, buffer, future.arrive)
  })
}

exports.mkdir = mkdir
function mkdir (path) {
  return Future.init(future => {
    mkdirp(path, future.arrive)
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
  return optionValue == null ? '' : `--${optionName} ${optionValue}`
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
