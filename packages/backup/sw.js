importScripts(
  'https://unpkg.com/ramda@0.26.1/dist/ramda.min.js'
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

// see -> https://flaviocopes.com/channel-messaging-api/
self.addEventListener('message', function(event) {
  console.log('SW Received Message: ' + event.data)
  event.ports[0].postMessage("SW Says 'Hello back!'")
  // event.ports[0].close() // option for closing ones used
})

addEventListener('fetch', evt => {
  const req = evt.request.clone()
  const url = new URL(req.url) // create a url object
  console.log('url.origin:', url.origin)
  if (
    req.method === 'POST' && // is a POST request
    url.pathname.match(/graphql/g).length > 0 && // is a graphql request
    url.href.match(/mutation/g) === null // isn't a mutation
  ) {
    evt.respondWith(graphql(req))
  } else if (url.origin === location.origin) {
    evt.respondWith($$thenNet(req)) // prefer cache first if own resource
  } else {
    evt.respondWith(netThen$$(req)) // prefer network first for external
  }
})

const $$thenNet = async req => {
  // console.log('$$thenNet req =>', req)
  const $R = await caches.match(req) // match any previous requests
  return $R || fetch(req) // return matches if there, else fetch
}

const netThen$$ = async req => {
  const $R$ = await caches.open('$fetch$') // create a new cache object
  try {
    const res = await fetch(req)
    $R$.put(req, res.clone()) // put a new k:v pair into the object
    return res
  } catch (err) {
    console.log(`${err} 'GET' from network, trying caches...`) // TypeError: Failed to fetch
    return await caches.match(req) // return any matches
  }
}
const graphql = async req => {
  const url = new URL(req.url)
  const $R$ = await caches.open('$graphql$') // create a new cache object
  try {
    const res = await fetch(req)
    $R$.put(url.href, res.clone()) // put a new k:v pair into the object
    return res
  } catch (err) {
    console.log(`${err} graphql 'POST' query from network, trying caches...`) // TypeError: Failed to fetch
    return await caches.match(url.href) // return any matches
  }
}
