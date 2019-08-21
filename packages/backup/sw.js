importScripts(
  'https://unpkg.com/dexie@2.0.4/dist/dexie.js',
  'https://unpkg.com/ramda@0.26.1/dist/ramda.min.js',
  'https://unpkg.com/axios@0.19.0/dist/axios.min.js',
  'https://unpkg.com/swivel@4.0.3/dist/swivel.min.js'
)

let static = ['index.html', 'index.js']

addEventListener('install', async evt => {
  console.log('Service Worker installing.')
  const $C$ = await caches.open('my_$') // create a new cache object
  $C$.addAll(static) // put local static assets in
})

// addEventListener('activate', async evt =>
//   console.log('Service Worker activating.')
// )

// Immediately claim any new clients. This is not needed to send messages, but
// makes for a better demo experience since the user does not need to refresh.
// A more complete example of this given in the immediate-claim recipe.
addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim())
})

addEventListener('message', async evt =>
  console.log('Service Worker messaging.')
)

addEventListener('fetch', evt => {
  // console.log('from ./sw.js fetch:', e)
  // console.log('fetch e:', evt)
  var db = new Dexie('post_cache')
  const req = evt.request.clone()
  const url = new URL(req.url) // create a url object
  console.log('url.origin:', url.origin)
  if (
    req.method === 'POST' && // is a POST request
    url.pathname.match(/graphql/g).length > 0 && // is a graphql request
    url.href.match(/mutation/g) === null // isn't a mutation
  ) {
    console.log('mutations:', url.href.match(/mutation/g))
    console.log('req:', req)
    console.log('url:', url)
    console.log('evt:', evt)
    evt.respondWith(graphql(db, evt))
  } else if (url.origin === location.origin) {
    evt.respondWith($thenNet(req)) // prefer cache first if own resource
  } else {
    evt.respondWith(netThen$(req)) // prefer network first for external
  }
})

const $thenNet = async req => {
  // console.log('$thenNet req =>', req)
  const $ed = await caches.match(req) // match any previous requests
  return $ed || fetch(req) // return matches if there, else fetch
}

const netThen$ = async req => {
  // console.log('netThen$ r =>', req)
  // We will cache all POST requests, but in the real world, you will probably filter for
  // specific URLs like if(... || event.request.url.href.match(...))

  const $er = await caches.open('new_$') // create a new cache object
  try {
    const res = await fetch(req)
    $er.put(req, res.clone()) // put a new k:v pair into the object
    return res
  } catch (err) {
    // if fetch doesn't work
    console.log('netThen$ ERROR:', err)
    return await caches.match(req) // return any matches
  }
}
const graphql = async (db, evt) => {
  const req = evt.request.clone()
  const url = new URL(req.url)
  // console.log('netThen$ r =>', req)
  // We will cache all POST requests, but in the real world, you will probably filter for
  // specific URLs like if(... || event.request.url.href.match(...))

  const $er = await caches.open('graphql_$') // create a new cache object
  try {
    const res = await fetch(req)
    $er.put(url.href, res.clone()) // put a new k:v pair into the object
    return res
  } catch (err) {
    // if fetch doesn't work
    console.log('netThen$ ERROR:', err)
    return await caches.match(req) // return any matches
  }
}
//https://a.kabachnik.info/offline-post-requests-via-service-worker-and-indexeddb.html
const graphqlOG = (db, evt) => {
  // Init the cache. We use Dexie here to simplify the code. You can use any other
  // way to access IndexedDB of course.
  // console.log("req.method === 'POST'")

  db.version(1).stores({
    post_cache: 'key, response, timestamp',
  })

  evt.respondWith(
    // First try to fetch the request from the server
    fetch(evt.request.clone())
      .then(res => {
        // If it works, put the response into IndexedDB
        const req = evt.request.clone()
        const url = req.url
        console.log('URL in caching:', url)
        cachePut(evt.request.clone(), res.clone(), db.post_cache)
        return res
      })
      .catch(err => {
        console.log('caught error in graphql:', err)
        return cacheMatch(evt.request.clone(), db.post_cache)
      })
    // If it does not work, return the cached response. If the cache does not
    // contain a response for our request, it will give us a 503-response
  )
}

// console.log('Dexie:', Dexie)
// console.log('R:', R)
// console.log('axios:', axios)
// console.log('swivel:', swivel)

// swivel.on('data', function handler(context, ...data) {
//   console.log('swivel `context`:', context)
//   console.log('swivel `data`:', data)
//   context.reply('data', 'BLOOP')
// })

function serializeRequest(req) {
  var serialized = {
    url: req.url,
    headers: serializeHeaders(req.headers),
    method: req.method,
    mode: req.mode,
    credentials: req.credentials,
    cache: req.cache,
    redirect: req.redirect,
    referrer: req.referrer,
  }

  // Only if method is not `GET` or `HEAD` is the request allowed to have body.
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return req
      .clone()
      .text()
      .then(function(body) {
        serialized.body = body
        return Promise.resolve(serialized)
      })
  }
  return Promise.resolve(serialized)
}

/**
 * Serializes a Response into a plain JS object
 *
 * @param res
 * @returns Promise
 */

function serializeResponse(res) {
  var serialized = {
    headers: serializeHeaders(res.headers),
    status: res.status,
    statusText: res.statusText,
  }

  return res
    .clone()
    .text()
    .then(function(body) {
      serialized.body = body
      return Promise.resolve(serialized)
    })
}

/**
 * Serializes headers into a plain JS object
 *
 * @param headers
 * @returns object
 */

function serializeHeaders(headers) {
  var serialized = {}
  // `for(... of ...)` is ES6 notation but current browsers supporting SW, support this
  // notation as well and this is the only way of retrieving all the headers.
  for (var entry of headers.entries()) {
    serialized[entry[0]] = entry[1]
  }
  return serialized
}

/**
 * Creates a Response from it's serialized version
 *
 * @param data
 * @returns Promise
 */

function deserializeResponse(data) {
  return Promise.resolve(new Response(data.body, data))
}

/**
 * Returns a string identifier for our POST request.
 *
 * @param request
 * @return string
 */
const getPostId = async req => {
  return JSON.stringify(serializeRequest(req.clone()))
}

/**
 * Saves the response for the given request eventually overriding the previous version
 *
 * @param data
 * @returns Promise
 */
function cachePut(req, res, store) {
  var key, data
  getPostId(req.clone())
    .then(function(id) {
      key = id
      return serializeResponse(res.clone())
    })
    .then(function(serializedResponse) {
      data = serializedResponse
      var entry = {
        key: key,
        response: data,
        timestamp: Date.now(),
      }
      store.add(entry).catch(function(error) {
        store.update(entry.key, entry)
      })
    })
}

/**
 * Returns the cached response for the given req or an empty 503-response  for a cache miss.
 *
 * @param req
 * @return Promise
 */
function cacheMatch(req) {
  return getPostId(req.clone())
    .then(function(id) {
      return store.get(id)
    })
    .then(function(data) {
      if (data) {
        return deserializeResponse(data.response)
      } else {
        return new Response('', {
          status: 503,
          statusText: 'Service Unavailable',
        })
      }
    })
}
