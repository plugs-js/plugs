const { Channel, alts } = require('core-async')
const co = require('co')
const { run, race, tapWith, breaker } = require('@plugs/main') //?
const axios = require('axios')
const r = require('ramda')

run //?
const reach = _E_ => _I_ =>
  co(function*() {
    const [url, opts = {}] = yield _I_.take()
    try {
      const res = yield axios.get(url, opts)
      console.log('res in test1: ', res)
      const data = yield res.data
      const _O_ = new Channel()
      _O_.put(data)
      return _O_
    } catch (err) {
      console.log('EEEERRRRR: ', err)
      _E_.put(err)
    }
  })

// co(function*() {
//   const _E_ = new Channel()
//   const _I_ = new Channel()
//   _I_.put(['https://api.census.gov/data/2017/acs/acs1/examples.json', {}])
//   const _data_ = yield reach(_E_)(_I_)
//   const data = yield _data_.take()
//   return data
// }) //?

/**
  { get: [ 'NAME', 'B00001_001E' ], 
  fips:  
   [ { name: 'us', 
       exampleValue: '1', 
       geoLevelDisplay: '010', 
       referenceDate: '2016-01-01' }, 
     { name: 'region', 
       exampleValue: '1', 
       ...
 */

const nameLens = r.lensProp('name')
const getNamesList = data => r.map(r.view(nameLens), data)

co(function*() {
  const _E_ = new Channel()
  const _I_ = new Channel()
  _I_.put(['https://api.census.gov/data/2017/acs/acs1/geography.json', {}])
  run(reach, tapWith(getNamesList))(_E_)(_I_)
}) //?
