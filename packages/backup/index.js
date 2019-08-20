// import swivel from 'swivel'
const gql = require('nanographql')

if (!('serviceWorker' in navigator)) {
  return
}

const appendCensus = async () => {
  const res = await fetch(
    'https://api.census.gov/data/2017/acs/acs5?get=NAME,B01001_001E&for=state:*'
  )
  console.log('DATA BITCH:', res)
  const data = await res.json()
  document.body.append(JSON.stringify(data, null, 2))
}

const query = gql`
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

const appendGraphQL = async () => {
  try {
    const res = await fetch('https://etmdb.com/graphql', {
      body: query(),
      method: 'POST',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9,pt-PT;q=0.8,pt;q=0.7,fr;q=0.6',
        'Connection': 'keep-alive',
        'Content-Length': '192',
        'Content-Type': 'application/json',
        'DNT': '1',
      },
    })
    const data = await res.json()
    document.body.append(JSON.stringify(data, null, 2))
  } catch (err) {
    console.error('ERROR In graqphl fetch:', err)
  }
}

navigator.serviceWorker
  .register('sw.js')
  .then(navigator.serviceWorker.ready)
  .then(function() {
    // swivel.on('data', function handler(context, ...data) {
    //   console.log('swivel `context`:', context)
    //   console.log('swivel `data`:', data)
    //   context.reply('data', 'BLOOP')
    // })
    appendGraphQL()
    appendCensus()
  })

setTimeout(() => appendGraphQL(), 3000)
setTimeout(() => appendCensus(), 6000)
