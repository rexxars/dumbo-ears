const {EventSourcePolyfill} = require('event-source-polyfill')
const Client = require('./client')

module.exports = cfg => new Client(cfg, EventSourcePolyfill)
