const Observable = require('@sanity/observable/minimal')

const enc = encodeURIComponent
const host = 'api.sanity.io'

function DumboEars(config, es) {
  if (!(this instanceof DumboEars)) {
    return new DumboEars(config)
  }

  this.cfg = config
  this.es = es
}

;[
  'clone',
  'config',
  'create',
  'createIfNotExists',
  'createOrReplace',
  'delete',
  'fetch',
  'mutate',
  'patch',
  'transaction'
].forEach(method => {
  DumboEars.prototype[method] = ni(method)
})

DumboEars.prototype.listen = function(query, params, opts = {}) {
  const options = {
    includeResult: 'includeResult' in opts ? opts.includeResult : true,
    includePreviousRevision: opts.includePreviousRevision || false
  }

  const cfg = this.cfg
  const qs = getQs(query, params, options)
  const url = `https://${cfg.projectId}.${host}/v1/data/listen/${cfg.dataset}${qs}`

  const EventSource = this.es
  const listenFor = opts.events ? opts.events : ['mutation']
  const shouldEmitReconnect = listenFor.indexOf('reconnect') !== -1

  const esOptions = {}
  if (cfg.token || cfg.withCredentials) {
    esOptions.withCredentials = true
  }

  if (cfg.token) {
    esOptions.headers = {
      Authorization: `Bearer ${cfg.token}`
    }
  }

  return new Observable(observer => {
    let es = getEventSource()
    let reconnectTimer
    let stopped = false

    function onError() {
      if (stopped) {
        return
      }

      emitReconnect()

      // Allow event handlers of `emitReconnect` to cancel/close the reconnect attempt
      if (stopped) {
        return
      }

      // Unless we've explicitly stopped the ES (in which case `stopped` should be true),
      // we should never be in a disconnected state. By default, EventSource will reconnect
      // automatically, in which case it sets readyState to `CONNECTING`, but in some cases
      // (like when a laptop lid is closed), it closes the connection. In these cases we need
      // to explicitly reconnect.
      if (es.readyState === EventSource.CLOSED) {
        unsubscribe()
        clearTimeout(reconnectTimer)
        reconnectTimer = setTimeout(open, 100)
      }
    }

    function onChannelError(err) {
      observer.error(cooerceError(err))
    }

    function onMessage(evt) {
      const event = parseEvent(evt)
      return event instanceof Error ? observer.error(event) : observer.next(event)
    }

    function onDisconnect(evt) {
      stopped = true
      unsubscribe()
      observer.complete()
    }

    function unsubscribe() {
      es.removeEventListener('error', onError, false)
      es.removeEventListener('channelError', onChannelError, false)
      es.removeEventListener('disconnect', onDisconnect, false)
      listenFor.forEach(type => es.removeEventListener(type, onMessage, false))
      es.close()
    }

    function emitReconnect() {
      if (shouldEmitReconnect) {
        observer.next({type: 'reconnect'})
      }
    }

    function getEventSource() {
      const evs = new EventSource(url, esOptions)
      evs.addEventListener('error', onError, false)
      evs.addEventListener('channelError', onChannelError, false)
      evs.addEventListener('disconnect', onDisconnect, false)
      listenFor.forEach(type => evs.addEventListener(type, onMessage, false))
      return evs
    }

    function open() {
      es = getEventSource()
    }

    function stop() {
      stopped = true
      unsubscribe()
    }

    return stop
  })
}

function parseEvent(event) {
  try {
    const data = (event.data && JSON.parse(event.data)) || {}
    return Object.assign({type: event.type}, data)
  } catch (err) {
    return err
  }
}

function cooerceError(err) {
  if (err instanceof Error) {
    return err
  }

  const evt = parseEvent(err)
  return evt instanceof Error ? evt : new Error(extractErrorMessage(evt))
}

function extractErrorMessage(err) {
  if (!err.error) {
    return err.message || 'Unknown listener error'
  }

  if (err.error.description) {
    return err.error.description
  }

  return typeof err.error === 'string' ? err.error : JSON.stringify(err.error, null, 2)
}

function getQs(query, params, opts) {
  const baseQs = `?query=${enc(query)}`
  const qs = Object.keys(opts || {}).reduce((current, option) => {
    // Only include the option if it is truthy
    return opts[option] ? `${current}&${enc(option)}=${enc(opts[option])}` : current
  }, baseQs)

  return Object.keys(params || {}).reduce((current, param) => {
    return `${current}&${enc(`$${param}`)}=${enc(JSON.stringify(params[param]))}`
  }, qs)
}

function ni(method) {
  return () => {
    throw new Error(`Method "${method}" not implemented, use @sanity/client`)
  }
}

module.exports = DumboEars
