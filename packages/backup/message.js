import co from 'co'
import gql from 'nanographql'
import 'setimmediate'
import { Channel } from 'core-async'

export const _I_ = new Channel()
export const _O_ = new Channel()

export const send_message_to_sw = msg =>
  co(function*() {
    _I_.put(msg)
  })

send_message_to_sw('SOMETHING FROM ANOTHER WORLD IMMEDIATELY')
// send_message_to_sw('SOMETHING ELSE')

setTimeout(
  () => send_message_to_sw('SOMETHING FROM ANOTHER WORLD after 5s again'),
  5000
)
