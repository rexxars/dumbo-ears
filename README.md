# dumbo-ears

[![npm version](https://img.shields.io/npm/v/dumbo-ears.svg?style=flat-square)](http://browsenpm.org/package/dumbo-ears)[![Build Status](https://img.shields.io/travis/rexxars/dumbo-ears/master.svg?style=flat-square)](https://travis-ci.org/rexxars/dumbo-ears)

Small(ish) listener implementation for Sanity. Useful if you only need listeners.

## Targets

- Node.js >= 6
- Modern(ish) browsers (IE >= 11, Chrome, Safari, Firefox etc)

## Installation

```bash
npm install --save dumbo-ears
```

## Usage

```js
const DumboEars = require('dumbo-ears')

// Instantiate a client
const client = new DumboEars({
  projectId: 'myProjectId',
  dataset: 'myDataset',
  token: 'moop', // optional
})

// Listen for changes on the given query
const subscription = client
  .listen(
    '*[_type == $someType]',
    {someType: 'article'},
    {includePreviousRevision: false}
  )
  .subscribe(mutation => console.log(mutation))

// Unsubscribe from events after 30 seconds
setTimeout(() => {
  subscription.unsubscribe()
}, 30 * 1000)
```

## UMD bundle

You can load this module as a UMD-bundle from unpkg - https://unpkg.com/dumbo-ears  
If used in a global browser context, it will be available as `window.DumboEars`

## License

MIT © [Espen Hovlandsdal](https://espen.codes/)
