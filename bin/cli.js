#!/usr/bin/env node
'use strict'

const args = require('yargs').argv
const {render} = require('../')
const {omitBy, yargsSpecialKey} = require('../utils')

const toStdout = !args.out

render(omitBy(yargsSpecialKey, args))
  .then(out => {
    if (toStdout) process.stdout.write(out)
    process.exitCode = 0
  })
  .catch(err => {
    process.stdout.write(err.stdout || err.message || err)
    process.exitCode = 1
  })
