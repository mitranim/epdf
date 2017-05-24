'use strict'

const args = require('yargs')
  .usage(`Usage example:
  epdf --url https://my-awesome-site --out ./page.pdf`)
  .option('url', {type: 'string', demand: true, describe: 'URL to render'})
  .option('out', {type: 'string', demand: true, describe: 'Output filename'})
  .option('maxDelay', {type: 'number', default: 30000, describe: 'Maximum allotted time in ms'})
  .option('siteDelay', {type: 'number', default: 500, describe: 'Pause between site load and render in ms'})
  .option('width', {type: 'number', default: 1280, describe: 'Window width'})
  .option('height', {type: 'number', default: 1024, describe: 'Window height'})
  .option('pageSize', {type: 'string', default: 'A4', describe: 'A3 | A4 | A5 | Legal | Letter | Tabloid'})
  .option('printBackground', {type: 'boolean', default: true})
  .option('landscape', {type: 'boolean', default: false, describe: 'true = landscape | false = portrait'})
  .option('marginsType', {type: 'number', default: 0, describe: '0 = default | 1 = none | 2 = min'})
  .argv

const del = require('del')
const electron = require('electron')
const {Future, delay, once, printToPDF, writeFile} = require('./utils')

const {url, out: filename, width, height, maxDelay, siteDelay, pageSize, printBackground, landscape, marginsType} = args

const jobOptions = {maxDelay, siteDelay}

const windowOptions = {show: false, width, height}

const pdfOptions = {pageSize, printBackground, landscape, marginsType}

electron.app.once('ready', render)

function render () {
  const window = new electron.BrowserWindow(windowOptions)

  window.loadURL(url)

  Future.race([
    delay(jobOptions.maxDelay).mapResult(() => {
      throw Error(`Loading timed out after ${jobOptions.maxDelay}`)
    }),

    once(window.webContents, 'did-fail-load').mapResult(() => {
      throw Error(`Failed to load url: ${url}`)
    }),

    once(window.webContents, 'did-finish-load')
      .mapResult(() => delay(jobOptions.siteDelay))
      .mapResult(() => printToPDF(window, pdfOptions))
      .mapResult(buffer => (
        writeFile(filename, buffer)
          .mapError(error => {
            del(filename, {force: true}).catch(console.error.bind(console))
            throw error
          })
      ))
  ])
  .map(error => {
    if (error) console.error(error)
    // Exit as early as possible and let Electron think we finished successfully
    // to avoid annoying nagging on next startup. The parent process will
    // "guess" the error from stderr.
    process.exit(0)
  })
}
