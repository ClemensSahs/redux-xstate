function getActions(states) {
  return Object.keys(states)
    .map(key => {
      const state = states[key]
      const actions = Object.keys(state.on || {})

      return state.states ? getActions(state.states) : actions
    })
    .reduce((a, b) => a.concat(b), [])
    .filter((key, pos, arr) => arr.indexOf(key) === pos)
}

export function createMiddleware(machine, actionMap = {}, reducerMap = {}, reduxStateKey = 'machine') {
  const validActions = getActions(machine.config.states)

  return ({ dispatch, getState }) => next => action => {
    if (validActions.includes(action.type)) {
      const currentState = getState()
      let nextState = {
        state: null,
        data: currentState[reduxStateKey].data
      }
      const machineState = machine.transition(
        currentState[reduxStateKey].state,
        action,
        currentState
      )

      // write next state
      nextState.state = machineState.value

      // allow data reducer for state.action aka ReduxActionType
      if (reducerMap[action.type] !== undefined) {
        nextState.data = reducerMap[action.type](nextState.data, action)
      }

      // push the next state to redux
      dispatch({
        type: `@@${reduxStateKey}/UPDATE_STATE`,
        payload: nextState
      })

      // run xstate action
      machineState.actions
        .map(key => actionMap[key])
        .filter(Boolean)
        .forEach(fn => fn(dispatch, currentState, action))
    }

    next(action)
  }
}

export function createReducer(machine, reduxStateKey = 'machine') {
  const initialState = {
    state: machine.initialStateValue,
    data: {}
  }

  return (state = initialState, { type, payload }) =>
    type === `@@${reduxStateKey}/UPDATE_STATE` ? payload : state
}
