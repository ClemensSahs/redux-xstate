import { Machine } from "xstate"
import { createStore, combineReducers, applyMiddleware } from "redux"

import { createMiddleware, createReducer } from "../src"

describe("xstate middleware", () => {
  const reducerMapFoo = {
    TIMER: (state, action) => action.payload,
  }
  const actionMapFoo = {
    mockFn: jest.fn()
  }
  const actionMapBar = {
    mockFn: jest.fn()
  }
  const stateChart = {
    key: "light",
    initial: "green",
    states: {
      green: {
        on: {
          TIMER: "yellow"
        }
      },
      yellow: {
        on: {
          TIMER: "red"
        }
      },
      red: {
        on: {
          TIMER: "green"
        },
        initial: "walk",
        states: {
          walk: {
            on: {
              PED_COUNTDOWN: "wait"
            },
            onEntry: ["mockFn"]
          },
          wait: {
            on: {
              PED_COUNTDOWN: "stop"
            }
          },
          stop: {}
        }
      }
    }
  }

  const machines = {
    foo: Machine(stateChart),
    bar: Machine(stateChart),
  }

  const reduxKeys = {
    foo: 'foo',
    bar: 'bar'
  }

  const middlewareList = [
    createMiddleware(machines.foo, actionMapFoo, reducerMapFoo, reduxKeys.foo),
    createMiddleware(machines.bar, actionMapBar, {}, reduxKeys.bar)
  ];

  const store = createStore(
    combineReducers({
      [reduxKeys.foo]: createReducer(machines.foo, reduxKeys.foo),
      [reduxKeys.bar]: createReducer(machines.bar, reduxKeys.bar)
    }),
    applyMiddleware(...middlewareList)
  )

  it("transitions machine state", () => {
    store.dispatch({ type: "TIMER" })

    expect(store.getState()[reduxKeys.foo].state).toBe("yellow")
  })

  it("trigger actions", () => {
    store.dispatch({ type: "TIMER" })

    expect(store.getState().foo.state).toEqual({ red: "walk" })
    expect(actionMapFoo.mockFn.mock.calls.length).toBe(1)
    expect(actionMapFoo.mockFn.mock.calls[0][2]).toEqual({ type: "TIMER" })
  })

  it("trigger reducer", () => {
    store.dispatch({
      type: "TIMER",
      payload: { foo: 'bar' }
    })

    expect(store.getState().foo.state).toEqual( "green" )
    expect(store.getState().foo.data).toEqual({ foo: "bar" })
  })
})
