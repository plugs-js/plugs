const main = require('main')

const me = 'route'

console.log(`requiring ${main} in ${me}`)

const track = {
  use: 'URL/navigation state',
  deps: ['???'],
  description: `
    keeps track of browser history - in 'backup' - and
    serves the correct html page + js components
  `,
}

const patch = {
  use: 'pushes a new route',
  deps: ['???'],
  description: `
    pushes a new route onto the history object and updates the client
  `,
}

module.exports = {
  track,
  patch,
}
