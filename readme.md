## Description

Uses Electron to render any webpage (by URL) to a PDF. Works for websites
rendered in the browser with JavaScript.

## Installation and Usage

Get with NPM:

```sh
# local for one project
npm install --save-exact epdf

# global for CLI
npm install --global epdf
```

Epdf can be used as a Node.js library or from the command line.

### Programmatic API

```js
const {render} = require('epdf')

render({url: 'https://my-awesome-website' /* other settings */})
  .then(buffer => {
    // buffer contains rendered PDF in binary form
  })
  .catch(error => {
    // ...
  })
```

`render` takes the same args as the CLI. To see the available settings, run
`$(npm bin)/epdf --help` (for local install) or `epdf --help` (for global
install).

The value returned by `render` can be used as a promise, but is actually a
[`Future`](https://github.com/mitranim/posterus#future) from the
[Posterus](https://github.com/mitranim/posterus) library. You can stop it by
calling `.deinit()`, which immediately closes the Electron process.

```js
const {render} = require('epdf')

const future = render(settings)
  .mapResult(buffer => {})
  .mapError(error => {})

// Stops the whole thing
future.deinit()
```

### CLI

```sh
# for global install
epdf

# for local install
$(npm bin)/epdf

# get help
epdf --help

# to stdout
epdf --url <some-url>

# to file
epdf --url <some-url> --out <some-file>
```
