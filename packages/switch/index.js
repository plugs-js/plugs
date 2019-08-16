const main = require('main')

const me = 'switch'

console.log(`requiring ${main} in ${me}`)

const plate = {
  use: 'styling',
  deps: ['@emotion/core', 'react', 'react-dom', 'styled-system'],
  description: `
    offline first styling 
    styles can reference variables from a theme stored in 'backup'
    uses 'styled-system' for responsive breakpoints
  `,
}

const flip = {
  use: 'styling',
  deps: ['react-flip-toolkit'],
  description: `
    handles transition animations between routes...
    Does it's best to mimic native transition animations. 
    that is all and that's enough for me. 
  `,
}

module.exports = {
  plate,
  flip,
}
