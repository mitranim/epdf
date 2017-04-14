'use strict'

const {url, out: filename, width, height, maxDelay, siteDelay, pageSize, printBackground, landscape, marginsType} =
  require('yargs')
  .option('url', {type: 'string', demand: true, describe: 'URL to render'})
  .option('out', {type: 'string', demand: true, describe: 'Output filename'})
  .option('width', {type: 'number', default: 1280, describe: 'Window width'})
  .option('height', {type: 'number', default: 1024, describe: 'Window height'})
  .option('maxDelay', {type: 'number', default: 30000, describe: 'Maximum allotted time'})
  .option('siteDelay', {type: 'number', default: 500, describe: 'How long to wait after loading the site'})
  .option('pageSize', {type: 'string', default: 'A4', describe: 'Typographic page size'})
  .option('printBackground', {type: 'boolean', default: true})
  .option('landscape', {type: 'boolean', default: false, describe: 'Use landscape orientation'})
  .option('marginsType', {type: 'number', default: 0, describe: 'Specifies the type of margins to use'})
  .argv

const fs = require('fs')
const del = require('del')
const electron = require('electron')
const {call, bind} = require('fpx')
const {once, timer, flushBy} = require('./utils')

const jobOptions = {maxDelay, siteDelay}

const windowOptions = {show: false, width, height}

const pdfOptions = {pageSize, printBackground, landscape, marginsType}

electron.app.once('ready', render)

function render () {
  const window = new electron.BrowserWindow(windowOptions)

  window.loadURL(url)

  function quit (code) {
    flushBy(competingTasks, call)
    process.exit(code)
  }

  const competingTasks = [
    timer(jobOptions.maxDelay, () => {
      process.stdout.write('timeout', bind(quit, 1))
    }),

    once(window.webContents, 'did-fail-load', () => {
      process.stdout.write('failed to load', bind(quit, 1))
    }),

    once(window.webContents, 'did-finish-load', () => {
      competingTasks.push(timer(jobOptions.siteDelay, () => {
        window.webContents.printToPDF(pdfOptions, (err, buffer) => {
          if (err) {
            // This error should be safe to send to user
            process.stdout.write(err.message, bind(quit, 1))
          }
          else {
            fs.writeFile(filename, buffer, err => {
              if (err) {
                del(filename, {force: true}).catch(console.error.bind(console))
                process.stderr.write(err.message, bind(quit, 1))
              }
              else {
                quit(0)
              }
            })
          }
        })
      }))
    })
  ]
}
