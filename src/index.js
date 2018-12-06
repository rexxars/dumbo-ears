const eventSource = require('eventsource')
const Client = require('./client')

module.exports = cfg => new Client(cfg, eventSource)
