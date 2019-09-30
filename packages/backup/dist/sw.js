// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"sw.js":[function(require,module,exports) {
importScripts('https://unpkg.com/ramda@0.26.1/dist/ramda.min.js', 'https://cdn.jsdelivr.net/npm/idb-keyval@3/dist/idb-keyval-iife.min.js', 'https://unpkg.com/crypto-js@3.1.8/crypto-js.js' // 'https://unpkg.com/axios@0.19.0/dist/axios.min.js'
);
let static = ['index.html', 'index.js'];
addEventListener('install', async evt => {
  console.log('Service Worker installing.');
  const $C$ = await caches.open('$install$'); // create a new cache object

  $C$.addAll(static); // put local static assets in
}); // addEventListener('activate', evt => console.log('Service Worker activating.'))
// Immediately claim any new clients. This is not needed to send messages, but
// makes for a better demo experience since the user does not need to refresh.
// A more complete example of this given in the immediate-claim recipe.

addEventListener('activate', evt => {
  console.log('Service Worker activating.');
  evt.waitUntil(self.clients.claim());
});
addEventListener('error', evt => {
  console.log('Service Worker caught error:', evt.filename, evt.lineno, evt.colno, evt.message);
}); // see -> https://flaviocopes.com/channel-messaging-api/

addEventListener('message', evt => {
  console.log('SW Received Message: ' + evt.data);
  evt.ports[0].postMessage(`SW ECHO: ${evt.data}`);
  evt.ports[0].close(); // option for closing ones used
});
addEventListener('fetch', evt => {
  const req = evt.request.clone();
  const url = new URL(req.url); // create a url object
  // console.log('url.origin:', url.origin)

  if (req.method === 'POST' && // is a POST request
  url.pathname.match(/graphql/g).length > 0 && // is a graphql request
  url.href.match(/mutation/g) === null // isn't a mutation
  ) {
      evt.respondWith(graphql_$$(req));
    } else if (url.origin === location.origin) {
    evt.respondWith($$_fetch(req)); // prefer cache first if own resource
  } else {
    evt.respondWith(fetch_$$(req)); // prefer network first for external
  }
});

const $$_fetch = async req => {
  const $R$ = await caches.match(req); // match any previous requests

  return $R$ || fetch(req); // return matches if there, else fetch
};

const fetch_$$ = async req => {
  const $R$ = await caches.open('$fetch$'); // create a new cache object

  try {
    const res = await fetch(req.clone());
    $R$.put(req.clone(), res.clone()); // put a new k:v pair into the object

    return res;
  } catch (err) {
    console.log(`${err} 'GET' from network, trying caches...`); // TypeError: Failed to fetch

    return await caches.match(req); // return any matches
  }
};

const $graphql$ = new idbKeyval.Store('$graphql$', 'POSTs'); // create a simple K:V store-like cache API
// See -> https://medium.com/@jono/cache-graphql-post-requests-with-service-worker-100a822a388a

const graphql_$$ = async req => {
  let promise = null;
  let $R$ = await getCache(req.clone()); // hash the request for key to match

  let fetchPromise = fetch(req.clone()).then(res => {
    setCache(req.clone(), res.clone());
    return res;
  }).catch(err => {
    console.error(err);
  });
  return $R$ ? Promise.resolve($R$) : fetchPromise;
};

const serializeResponse = async res => {
  let serializedHeaders = {};

  for (var entry of res.headers.entries()) {
    serializedHeaders[entry[0]] = entry[1];
  }

  let serialized = {
    headers: serializedHeaders,
    status: res.status,
    statusText: res.statusText
  };
  serialized.body = await res.json();
  return serialized;
};

const setCache = async (req, res) => {
  var key, data;
  let body = await req.json();
  let query = body.query.replace(/\s|\n/g, ''); // console.log('graphql request body:', query)

  let id = CryptoJS.MD5(query).toString();
  var entry = {
    query,
    response: await serializeResponse(res),
    timestamp: Date.now()
  };
  idbKeyval.set(id, entry, $graphql$);
};

const getCache = async req => {
  let data;

  try {
    let body = await req.json();
    let query = body.query.replace(/\s|\n/g, '');
    let id = CryptoJS.MD5(query).toString();
    data = await idbKeyval.get(id, $graphql$);
    if (!data) return null; // Check cache max age.

    let cacheControl = req.headers.get('Cache-Control');
    let maxAge = cacheControl ? parseInt(cacheControl.split('=')[1]) : 3600; // throttle

    if (Date.now() - data.timestamp > maxAge * 1000) {
      console.log(`Cached data is stale. Loading data remotely...`);
      return null;
    }

    console.log(`Loading response from cache...`);
    return new Response(JSON.stringify(data.response.body), data.response);
  } catch (err) {
    return null;
  }
};
},{}],"../../../../AppData/Local/nvs/node/10.16.2/x64/node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "59474" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else {
        window.location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../../../../AppData/Local/nvs/node/10.16.2/x64/node_modules/parcel-bundler/src/builtins/hmr-runtime.js","sw.js"], null)
//# sourceMappingURL=/sw.js.map