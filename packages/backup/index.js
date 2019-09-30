import co from 'co'
import gql from 'nanographql'
import fetch from 'isomorphic-unfetch'
import {Channel, alts} from 'core-async'
import * as R from 'ramda'
import 'setimmediate'
import {_I_ as _1_, _O_ as _2_, send_message_to_sw} from './message'

if (!('serviceWorker' in navigator)) {
  return
}

// hack for parcel to notice my service worker
navigator.serviceWorker.register('sw.js')

const _3_ = new Channel()
const _4_ = new Channel()

const defaultConfig = {
  SW_file: '/sw.js',
  IO_array: [[_1_, _2_], [_3_, _4_]],
}

export const registerBackup = (config = defaultConfig) =>
  //using the worker returned: thank god for SO -> https://stackoverflow.com/a/51291570/7506767
  navigator.serviceWorker.register(config.SW_file).then(async worker => {
    await navigator.serviceWorker.ready
    console.log('Service Worker ready.')
    const I_chans = R.pluck(0, config.IO_array)
    console.log('I_chans:', I_chans)
    const O_chans = R.pluck(1, config.IO_array)
    console.log('O_chans:', O_chans)
    co(function*() {
      while (true) {
        // keep alive and create new `msg_chan` for each yield
        const [msg, chan] = yield alts(I_chans)
        /**
         * see https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage#Syntax
         * transferred objects are handed off and can't be used again!
         *  */

        const msg_chan = new MessageChannel()
        // console.log('Chosen msg:', msg)
        const idx = R.indexOf(chan, I_chans)
        // console.log('Chosen chan:', chan)
        // console.log('idx:', idx)

        msg_chan.port1.onmessage = event => {
          // console.log('EVENT:', event)
          if (event.data.error) {
            console.log('msg_chan.port1.onmessage rejected:', event.data.error)
            throw event.data.error // Blue TODO add _E_ chan
          } else {
            // console.log(`${event.data} put! in O_chan`)
            O_chans[idx].put(event.data)
            return event.data
          }
        }
        worker.active.postMessage(msg, [msg_chan.port2])
      }
    })
  })

registerBackup(defaultConfig)

co(function*() {
  while (true) {
    const message = yield _4_.take()
    console.log('Client got message from _4_.take():', message)
  }
})

const appendCensus = async () => {
  const res = await fetch(
    'https://api.census.gov/data/2017/acs/acs5?get=NAME,B01001_001E&for=state:*'
  )
  const data = await res.json()
  const json = JSON.stringify(data, null, 2) || 'NAN!'
  const str = `Appended by appendGraphQL

  ${json}
  
  `
  document.getElementById('payload1').append(str)
}

const query1 = gql`
  query {
    allCinemaDetails(before: "2017-10-04", after: "2010-01-01") {
      edges {
        node {
          slug
          hallName
        }
      }
    }
  }
`
const query2 = gql`
  query {
    stationWithEvaId(evaId: 8000105) {
      name
      location {
        latitude
        longitude
      }
      picture {
        url
      }
    }
  }
`
const headers = {
  'Accept': 'application/json',
  'Connection': 'keep-alive',
  'Content-Type': 'application/json',
}

const appendGraphQL = async (url, query) => {
  // console.log('query():', query())
  try {
    const res = await fetch(url, {
      body: query(),
      method: 'POST',
      // mode: 'cors',
      headers,
    })
    // console.log('res:', res)
    const data = await res.json()
    const json = JSON.stringify(data, null, 2) || 'NAN!'
    const str = `<h2>Appended by appendGraphQL</h2>
    <section>${json}</section>`
    document.getElementById('payload2').append(str)
    // console.log(str)
  } catch (err) {
    console.error('ERROR In graqphl fetch:', err)
  }
}

// const appendGraphQL = async (url, query) => {
//   let timeout = new Promise((resolve, reject) => {
//     setTimeout(reject, 20000, 'request timed out')
//   })
//   let get = new Promise((resolve, reject) => {
//     const res = fetch(`${url}?${query()}`.replace(/\s+|\\n/g, ''), {
//       body: query(),
//       method: 'POST',
//       // mode: 'cors',
//       headers,
//     })
//       .then(response => response.json())
//       .then(json => document.body.append(JSON.stringify(json, null, 2)))
//       .catch(reject)
//   })
//   return Promise.race([timeout, get]).catch(err => console.error('ERROR In graqphl fetch:', err))
// }

appendGraphQL('https://etmdb.com/graphql', query1)
appendCensus()
setTimeout(() => appendGraphQL('https://etmdb.com/graphql', query1), 4000)
setTimeout(
  () => appendGraphQL('https://cors-e.herokuapp.com/https://bahnql.herokuapp.com/graphql', query2),
  3000
)
setTimeout(() => appendCensus(), 7000)
// setTimeout(() => swivel.emit('data', 'one', 'two'), 6000)
// export const send_message_to_sw = msg =>
//   co(function*() {
//     _3_.put(msg)
//   })

send_message_to_sw('SOMETHING IMMEDIATELY')

setTimeout(() => send_message_to_sw('Something from this world after 9s'), 9000)
