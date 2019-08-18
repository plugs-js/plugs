const co = require('co')
const { Channel, alts } = require('core-async')
const r = require('ramda')
const axios = require('axios')

/**
 * convenience fn for simple error handling within chord 
    placed at the end of a run to short circuit if _E_.put(error)
    used to resolve to a value instead of a channel or trigger an error function 
    (mutually exclusive)
 */
const breaker = (
  msg = e => console.log(`breaker tripped! ${e}`)
) => _E_ => _I_ =>
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
const lift = fn => _E_ => _I_ =>
  co(function*() {
    // console.log('in lift')
    let I = yield _I_.take()
    try {
      let O = fn(I)
      let _O_ = new Channel()
      _O_.put(O)
      return _O_
    } catch (E) {
      _E_.put(E)
    }
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
const run = (...fns) => _I_ =>
  co(function*() {
    // console.log('in run')
    try {
      const _O_ = yield r.pipeWith(r.then)(fns)(_I_)
      return _O_
    } catch (E) {
      console.log('Error in `run`:', E)
      _I_.close()
    }
  })

const reach = _E_ => _I_ =>
  co(function*() {
    const [url, opts = {}] = yield _I_.take()
    try {
      const res = yield axios.get(url, opts)
      const data = yield res.data
      const _O_ = new Channel()
      _O_.put(data)
      return _O_
    } catch (err) {
      console.log('Error in `reach`:', err)
      _E_.put(err)
    }
  })

const governer = 'something that can be used for: debounce, throttle, etc.'

// // EXAMPLE run with reach, lift and breaker
// const nameLens = r.lensProp('name')
// const getNamesList = r.pipe(
//   r.prop('fips'),
//   r.map(r.prop('name'))
// )

// co(function*() {
//   const _E_ = new Channel()
//   const _I_ = new Channel()
//   _I_.put(['https://api.census.gov/data/2017/acs/acs1/geography.json', {}])
//   // const _O_ = yield run(reach(_E_), lift(getNamesList)(_E_))(_I_)
//   // const O = _O_.take()
//   const O = yield run(reach(_E_), lift(getNamesList)(_E_), breaker()(_E_))(_I_)
//   return O
// }) //?

module.exports = {
  run,
  race,
  lift,
  breaker,
  reach,
}
