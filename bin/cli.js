#!/usr/bin/env node
'use strict'

const args = require('yargs').argv
const {onlyNamedArgs} = require('../lib/utils')
const {render} = require('../lib')

const positionalArgs = args._
const namedArgs = onlyNamedArgs(args)
const toStdout = !namedArgs.out

render(positionalArgs, namedArgs)
  .mapResult(out => {
    if (toStdout && out) process.stdout.write(out)
    process.exitCode = 0
  })
  .mapError(err => {
    console.error(err)
    process.exitCode = 1
  })
