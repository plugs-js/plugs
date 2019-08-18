const { Channel, alts } = require('core-async')
const co = require('co')
const { run, reach, race, tapWith, breaker } = require('@plugs/main') //?
const axios = require('axios')
const r = require('ramda')

// EXAMPLE run with reach, lift and breaker
const nameLens = r.lensProp('name')
const getNamesList = r.pipe(
  r.prop('fips'),
  r.map(r.prop('name'))
)

co(function*() {
  const _E_ = new Channel()
  const _I_ = new Channel()
  _I_.put(['https://api.census.gov/data/2017/acs/acs1/geography.json', {}])
  // const _O_ = yield run(reach(_E_), lift(getNamesList)(_E_))(_I_)
  // const O = _O_.take()
  const O = yield run(reach(_E_), lift(getNamesList)(_E_), breaker()(_E_))(_I_)
  return O
}) //?
