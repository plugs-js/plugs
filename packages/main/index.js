const co = require('co')
const { Channel, alts } = require('core-async')
const r = require('ramda')

/**
 * convenience fn for simple error handling within chord 
    placed at the end of a run to short circuit if _E_.put(error)
    used to resolve to a value instead of a channel or trigger an error function 
    (mutually exclusive)
 */
const breaker = (msg = e => console.log(`breaker tripped! ${e}`), _E_) => _I_ =>
  co(function*() {
    const [v, chan] = yield alts([_E_, _I_])

    if (chan == _E_) {
      return msg(v)
      _I_.close()
    } else {
      return v
    }
  })

/**
 * apply a function to a value between other channel returning `plug`s
    e.g., within a `run`
    a plug that takes a synchronous function and applies it to the async
    result and then passes it on
 */
const tapWith = fn => _E_ => _I_ =>
  co(function*() {
    let x = yield _I_.take()
    let y = fn(x)
    let _O_ = new Channel()
    _O_.put(y)
    return _O_
  })

/**
 * race between multiple plugs
    takes an array of plugs and an input chan to creates new channel
    for each plug and uses alts to choose the first of the chans to 
    avail a successful take() 
 */
const race = (...pN) => _I_ =>
  co(function*() {
    const I = yield _I_.take()
    const _O_ = new Channel()

    r.map(p =>
      co(function*() {
        const _e_ = new Channel()
        const _i_ = new Channel()
        _i_.put(I)
        const _o_ = yield p(_e_)(_i_)
        const o = yield _o_.take()
        _O_.put(o)
      })
    )(pN)

    const r = yield _O_.take()
    return r
  })

/**
 * takes an array of '(_I_, _E_)' fns and plugs them
    together in order. Requires three instantiated channels
    the signature of each fn: see example 'plug' below
 */
const run = (...pN) => _E_ => _I_ =>
  co(function*() {
    const I = yield _I_.take()

    const _O_ = yield r.pipe(p =>
      co(function*() {
        const _i_ = new Channel()
        _i_.put(I)
        const _o_ = yield p(_E_)(_i_)
        return _o_
      })(pN)
    )

    return _O_
  })

module.exports = {
  run,
  race,
  tapWith,
  breaker,
}
