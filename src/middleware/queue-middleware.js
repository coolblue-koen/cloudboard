/* global io */

import { play } from '../actions/sound-actions'
import { QUEUE } from '../constants'
import { SERVER_QUEUE } from '../../server/constants'

export default function createQueueMiddleware(soundEventRepository) {
  return ({ dispatch }) => {
    let listener = null

    const socket = io.connect(window.location.host)

    return next => action => {
      if (action.type === QUEUE) {
        socket.emit(SERVER_QUEUE, { board: null, sound: action.sound })
        queueSound(action, soundEventRepository)
      }

      if (action.type === '@@router/LOCATION_CHANGE') {
        listener = handleLocationChange(listener, action, soundEventRepository, dispatch)
      }

      next(action)
    }
  }
}

function queueSound(action, soundEventRepository) {
  const { sound, collection } = action
  soundEventRepository.pushToQueue(sound, collection)
}

function handleLocationChange(listener, action, soundEventRepository, dispatch) {
  if (listener) {
    listener.off()
  }

  const { pathname } = action.payload
  const board = pathname.slice(1, pathname.length)

  if (board) {
    changeBoard(board, soundEventRepository, dispatch)
  }

  return listener
}

function changeBoard(board, soundEventRepository, dispatch) {
  soundEventRepository.setBoard(board)
  return soundEventRepository.listenForChanges(({ sound, collection }, id) => {
    dispatch(play(sound, collection, id))
  })
}
