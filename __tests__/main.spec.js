import { Machine } from "xstate"
import { createStore, combineReducers, applyMiddleware } from "redux"

import { createMiddleware, createReducer } from "../src"

describe("xstate middleware", () => {
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
    createMiddleware(machines.foo, actionMapFoo, reduxKeys.foo),
    createMiddleware(machines.bar, actionMapBar, reduxKeys.bar)
  ];

  const store = createStore(
    combineReducers({
      [reduxKeys.foo]: createReducer(machines.foo.initialState, reduxKeys.foo),
      [reduxKeys.bar]: createReducer(machines.bar.initialState, reduxKeys.bar)
    }),
    applyMiddleware(...middlewareList)
  )

  it("transitions machine state", () => {
    store.dispatch({ type: "TIMER" })

    expect(store.getState().foo.value).toBe("yellow")
  })

  it("trigger actions", () => {
    store.dispatch({ type: "TIMER" })

    expect(store.getState().foo.value).toEqual({ red: "walk" })
    expect(actionMapFoo.mockFn.mock.calls.length).toBe(1)
    expect(actionMapFoo.mockFn.mock.calls[0][2]).toEqual({ type: "TIMER" })
  })
})
