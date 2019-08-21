// import swivel from 'swivel'
const gql = require('nanographql')

if (!('serviceWorker' in navigator)) {
  return
}

const appendCensus = async () => {
  const res = await fetch(
    'https://api.census.gov/data/2017/acs/acs5?get=NAME,B01001_001E&for=state:*'
  )
  const data = await res.json()
  document.body.append(JSON.stringify(data, null, 2))
}

const query1 = gql`
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
const query2 = gql`
  query {
    stationWithEvaId(evaId: 8000105) {
      name
      location {
        latitude
        longitude
      }
      picture {
        url
      }
    }
  }
`
const headers = {
  'Accept': 'application/json',
  'Connection': 'keep-alive',
  'Content-Type': 'application/json',
}

const appendGraphQL = async (url, query) => {
  // console.log('query():', query())
  try {
    const res = await fetch(`${url}?${query()}`.replace(/\s+|\\n|\"/g, ''), {
      body: query(),
      method: 'POST',
      // mode: 'cors',
      headers,
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
    appendGraphQL('https://etmdb.com/graphql', query1)
    appendCensus()
  })

setTimeout(() => appendGraphQL('https://etmdb.com/graphql', query1), 3000)
setTimeout(
  () =>
    appendGraphQL(
      'https://cors-e.herokuapp.com/https://bahnql.herokuapp.com/graphql',
      query2
    ),
  3000
)
setTimeout(() => appendCensus(), 6000)
