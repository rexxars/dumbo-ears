const {timeout, filter, tap} = require('rxjs/operators')
const SanityClient = require('@sanity/client')
const getUuid = require('uuid/v4')
const Client = require('../src')

// eslint-disable-next-line no-process-env
const token = process.env.DUMBO_EARS_TOKEN
const projectId = '89qx0zd4'
const dataset = 'sweets'

const client = new Client({projectId, dataset, token})
const mutator = new SanityClient({projectId, dataset, token, useCdn: false})

beforeAll(() => {
  /* eslint-disable no-console, no-process-exit */
  if (!token) {
    console.error('No Sanity token provided through DUMBO_EARS_TOKEN')
    process.exit()
  }
  /* eslint-enable no-console, no-process-exit */
})

const notImplemented = [
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
]

function getBroadcaster(uuid) {
  return evt => {
    if (evt.type !== 'welcome') {
      return null
    }

    return mutator
      .createOrReplace({_id: 'dumbo.', _type: 'dumboTest', uuid}, {visibility: 'async'})
      .then(doc => mutator.delete(doc._id, {visibility: 'async'}))
  }
}

test('can listen', done => {
  const uuid = getUuid()
  const sub$ = client
    .listen(
      `*[_type == "dumboTest" && uuid == ${JSON.stringify(uuid)}]`,
      {},
      {events: ['mutation', 'welcome']}
    )
    .pipe(
      tap(getBroadcaster(uuid)),
      filter(msg => msg.type !== 'welcome'),
      timeout(3000)
    )
    .subscribe({
      next: res => {
        sub$.unsubscribe()
        expect(res).toHaveProperty('result.uuid', uuid)
        done()
      },
      error: err => {
        sub$.unsubscribe()
        expect(err).not.toBeTruthy()
        done()
      }
    })
})

test('can listen with params', done => {
  const uuid = getUuid()
  const sub$ = client
    .listen(
      '*[_type == $type && uuid == $uuid]',
      {type: 'dumboTest', uuid},
      {events: ['mutation', 'welcome']}
    )
    .pipe(
      tap(getBroadcaster(uuid)),
      filter(msg => msg.type !== 'welcome'),
      timeout(3000)
    )
    .subscribe({
      next: res => {
        sub$.unsubscribe()
        expect(res).toHaveProperty('result.uuid', uuid)
        done()
      },
      error: err => {
        sub$.unsubscribe()
        expect(err).not.toBeTruthy()
        done()
      }
    })
})

test('can instantiate client without `new` keyword', () => {
  const datClient = Client({projectId: '89qx0zd4', dataset: 'sweets'})
  expect(datClient.listen).toBeInstanceOf(Function)
})

describe('throws when using unimplemented methods', () => {
  notImplemented.forEach(method => {
    test(method, () => expect(client[method]).toThrow(/not implemented/i))
  })
})
