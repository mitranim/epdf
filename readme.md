## Description

Uses Electron to render any webpage (by URL) to a PDF. Works for websites
rendered dynamically with JavaScript.

## Usage

Epdf has two interfaces: programmatic (as a Node.js library) and CLI.

### Programmatic

```js
const {render} = require('epdf')

render(options)
  .then(buffer => {
    // buffer contains rendered PDF in binary form
  })
  .catch(err => {
    // ...
  })
```

To see available options, run `$(npm bin)/epdf --help` (for local install) or
`epdf --help` (for global install). The options are identical between `render`
and CLI.

### CLI

Install locally for one project, or globally:

```sh
npm i epdf
npm i -g epdf
```

Use from shell:

```sh
# get help
epdf --help

# to stdout
epdf --url <some-url>

# to file
epdf --url <some-url> --out <some-file>
```
