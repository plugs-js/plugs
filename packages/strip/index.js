const main = require('main')

const me = 'strip'

console.log(`requiring ${main} in ${me}`)

const split = {
  use: 'web worker pool',
  deps: ['threads'],
  description: `
    distributes a stream of incoming events to a worker pool
    does so via a live 'co(function *())' which - for every 
    '_I_.take()' throws the work at the next available worker
  `,
}

const port = {
  use: 'dedicated web worker',
  deps: ['threads'],
  description: `
    handles a single heavy-duty processing task - off the main thread
    eg: for state management - would coordinate with backup
  `,
}

module.exports = {
  split,
  port,
}
