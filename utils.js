'use strict'

const fs = require('fs')
const child_process = require('child_process')
const mkdirp = require('mkdirp')
const {slice, isFunction, isArray, isList, isString, validate} = require('fpx')

exports.extend = extend
function extend (...values) {
  return Object.assign({}, ...values)
}

exports.flushBy = flushBy
function flushBy (values, fun) {
  validate(isFunction, fun)
  validate(isArray, values)
  try {
    while (values.length) {
      fun.call(this, values.shift())
    }
  }
  catch (err) {
    flushBy.call(this, values, fun)
    throw err
  }
}

exports.forceEach = forceEach
function forceEach (values, fun, arg) {
  validate(isFunction, fun)
  if (isList(values)) {
    flushBy.call(this, slice(values), fun, arg)
  }
}

exports.once = once
function once (emitter, eventName, fun) {
  validate(isFunction, emitter.once)
  validate(isString, eventName)
  validate(isFunction, fun)

  let pending = true

  emitter.once(eventName, (...args) => {
    if (pending) {
      pending = false
      fun(...args)
    }
  })

  return () => {
    if (pending) {
      pending = false
      // Doesn't seem to work in Electron.
      emitter.removeListener(eventName, fun)
    }
  }
}

exports.timer = timer
function timer (delay, fun, ...args) {
  return clearTimeout.bind(null, setTimeout(fun, delay, ...args))
}

exports.exec = exec
function exec (cmd, options) {
  return new Promise((resolve, reject) => {
    child_process.exec(cmd, options, (err, stdout, stderr) => {
      if (err) reject(Object.assign(err, {stdout, stderr, exec: true}))
      else resolve({stdout, stderr})
    })
  })
}

exports.readFile = readFile
function readFile (filename, encoding) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, encoding, (err, buffer) => {
      if (err) reject(err)
      else resolve(buffer)
    })
  })
}

exports.mkdir = mkdir
function mkdir (path) {
  return new Promise((resolve, reject) => {
    mkdirp(path, (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
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
