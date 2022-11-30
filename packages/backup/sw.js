importScripts(
  'https://unpkg.com/ramda@0.26.1/dist/ramda.min.js',
  'https://cdn.jsdelivr.net/npm/idb-keyval@3/dist/idb-keyval-iife.min.js',
  'https://unpkg.com/crypto-js@3.1.8/crypto-js.js'
  // 'https://unpkg.com/axios@0.19.0/dist/axios.min.js'
)

let static = ['index.html', 'index.js']

addEventListener('install', async evt => {
  console.log('Service Worker installing.')
  const $C$ = await caches.open('$install$') // create a new cache object
  $C$.addAll(static) // put local static assets in
})

// addEventListener('activate', evt => console.log('Service Worker activating.'))

// Immediately claim any new clients. This is not needed to send messages, but
// makes for a better demo experience since the user does not need to refresh.
// A more complete example of this given in the immediate-claim recipe.
addEventListener('activate', evt => {
  console.log('Service Worker activating.')
  evt.waitUntil(self.clients.claim())
})

addEventListener('error', evt => {
  console.log('Service Worker caught error:', evt.filename, evt.lineno, evt.colno, evt.message)
})

// see -> https://flaviocopes.com/channel-messaging-api/
addEventListener('message', evt => {
  console.log('SW Received Message: ' + evt.data)
  evt.ports[0].postMessage(`SW ECHO: ${evt.data}`)
  evt.ports[0].close() // option for closing ones used
})

addEventListener('fetch', evt => {
  const req = evt.request.clone()
  const url = new URL(req.url) // create a url object
  // console.log('url.origin:', url.origin)
  if (
    req.method === 'POST' && // is a POST request
    url.pathname.match(/graphql/g).length > 0 && // is a graphql request
    url.href.match(/mutation/g) === null // isn't a mutation
  ) {
    evt.respondWith(graphql_$$(req))
  } else if (url.origin === location.origin) {
    evt.respondWith($$_fetch(req)) // prefer cache first if own resource
  } else {
    evt.respondWith(fetch_$$(req)) // prefer network first for external
  }
})

const $$_fetch = async req => {
  const $R$ = await caches.match(req) // match any previous requests
  return $R$ || fetch(req) // return matches if there, else fetch
}

const fetch_$$ = async req => {
  const $R$ = await caches.open('$fetch$') // create a new cache object
  try {
    const res = await fetch(req.clone())
    $R$.put(req.clone(), res.clone()) // put a new k:v pair into the object
    return res
  } catch (err) {
    console.log(`${err} 'GET' from network, trying caches...`) // TypeError: Failed to fetch
    return await caches.match(req) // return any matches
  }
}

const $graphql$ = new idbKeyval.Store('$graphql$', 'POSTs') // create a simple K:V store-like cache API

// See -> https://medium.com/@jono/cache-graphql-post-requests-with-service-worker-100a822a388a
const graphql_$$ = async req => {
  let promise = null
  let $R$ = await getCache(req.clone()) // hash the request for key to match
  let fetchPromise = fetch(req.clone())
    .then(res => {
      setCache(req.clone(), res.clone())
      return res
    })
    .catch(err => {
      console.error(err)
    })
  return $R$ ? Promise.resolve($R$) : fetchPromise
}

const serializeResponse = async res => {
  let serializedHeaders = {}
  for (var entry of res.headers.entries()) {
    serializedHeaders[entry[0]] = entry[1]
  }
  let serialized = {
    headers: serializedHeaders,
    status: res.status,
    statusText: res.statusText,
  }
  serialized.body = await res.json()
  return serialized
}

const setCache = async (req, res) => {
  var key, data
  let body = await req.json()
  let query = body.query.replace(/\s|\n/g, '')
  // console.log('graphql request body:', query)
  let id = CryptoJS.MD5(query).toString()

  var entry = {
    query,
    response: await serializeResponse(res),
    timestamp: Date.now(),
  }
  idbKeyval.set(id, entry, $graphql$)
}

const getCache = async req => {
  let data
  try {
    let body = await req.json()
    let query = body.query.replace(/\s|\n/g, '')
    let id = CryptoJS.MD5(query).toString()
    data = await idbKeyval.get(id, $graphql$)
    if (!data) return null

    // Check cache max age.
    let cacheControl = req.headers.get('Cache-Control')
    let maxAge = cacheControl ? parseInt(cacheControl.split('=')[1]) : 3600 // throttle
    if (Date.now() - data.timestamp > maxAge * 1000) {
      console.log(`Cached data is stale. Loading data remotely...`)
      return null
    }

    console.log(`Loading response from cache...`)
    return new Response(JSON.stringify(data.response.body), data.response)
  } catch (err) {
    return null
  }
}
