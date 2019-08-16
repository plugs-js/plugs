const co = require('co')
const { Channel } = require('core-async')
const r = require('ramda')

console.log(`requiring ${me} in ${me}`)

// tomato TODO

const run = {
  use: 'compose plugs',
  deps: ['co', 'core-async', 'ramda'],
  description: `
    takes an array of '(_I_, _E_)' fns and plugs them
    together in order.
    Requires three instantiated channels
    the signature of each fn: see example 'plug' below
  `,
  signature: ([...pN]) => _E_ => _I_ => co(function *() {
    const I = yield _I_.take()

    const _O_ = yield r.pipe(p => {
      const _i_ = new Channel()
      _i_.put(I)
      const _o_ = yield p(_E_)(_i_)
      return _o_
    })(pN)

    return _O_
  }),
}

const breaker = {
  use: 'convenience fn for simple error handling within chord',
  deps: [],
  description: "placed at the end of a run to short circuit if _E_.put(error)",
  signature:  (msg = e => console.log(`breaker tripped! ${e}`), _E_) => _I_ => {
    const [v,chan] = yield alts([_E_, _I_])

    if (chan == _E_) {
      return msg(v)
      _I_.close()
    } else {
      return v
    }
  }
}

const tapWith = {
  use: 'apply a function to a value in a run',
  deps: ['co', 'core-async'],
  description: `
    a plug that takes a synchronous function and applies it to the async
    result and then passes it on
  `,
  signature: withFn => _E_ => _I_ => {
      let x = yield _I_.take()
      let y = withFn(x)
      let _O_ = new Channel()
      _O_.put(y)
      return _O_
    },
}

const race = {
  use: 'race between multiple plugs',
  deps: ['co', 'core-async', 'ramda'],
  description: `
    takes an array of plugs and an input chan to creates new channel
    for each plug and uses alts to choose the first of the chans to 
    avail a successful take() 
  `,
  fn: ([...pN]) => _I_ => co(function *() {
    const I = yield _I_.take()
    const _O_ = new Channel()

    r.map(p => {
      const _e_ = new Channel()
      const _i_ = new Channel()
      _i_.put(I)
      const _o_ = yield p(_e_)(_i_)
      const o = yield _o_.take()
      _O_.put(o)
    })(pN)

    const r = yield _O_.take()
    return r
  })
}

module.exports = {
  run,
  tap,
  race,
  tapWith,
  breaker
}
