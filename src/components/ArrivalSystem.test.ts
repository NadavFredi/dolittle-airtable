import test, { after, afterEach, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/',
})

Object.defineProperty(globalThis, 'window', { value: dom.window })
Object.defineProperty(globalThis, 'document', { value: dom.window.document })
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator })
Object.defineProperty(globalThis, 'HTMLElement', { value: dom.window.HTMLElement })
Object.defineProperty(globalThis, 'HTMLInputElement', { value: dom.window.HTMLInputElement })
Object.defineProperty(globalThis, 'Node', { value: dom.window.Node })
Object.defineProperty(globalThis, 'MouseEvent', { value: dom.window.MouseEvent })
Object.defineProperty(globalThis, 'KeyboardEvent', { value: dom.window.KeyboardEvent })
Object.defineProperty(globalThis, 'requestAnimationFrame', {
  value: (callback: FrameRequestCallback) => setTimeout(callback, 0),
})
Object.defineProperty(globalThis, 'cancelAnimationFrame', {
  value: (id: number) => clearTimeout(id),
})

const React = await import('react')
const { render, screen, waitFor, cleanup, fireEvent } = await import('@testing-library/react')
const { Provider } = await import('react-redux')
const { configureStore } = await import('@reduxjs/toolkit')
const { MemoryRouter } = await import('react-router-dom')
const { attendanceApi } = await import('../store/api')
const { supabase } = await import('../hooks/useAuth')
const { default: ArrivalSystem } = await import('./ArrivalSystem')

const registrations = [
  {
    id: 'student-a',
    childName: 'Student A',
    cycle: 'Group A',
    parentPhone: '0500000000',
    parentName: 'Parent A',
    course: 'Chess',
    school: 'School A',
    class: 'A',
    needsPickup: false,
    trialDate: '2026-04-01',
    inWhatsAppGroup: true,
    registrationStatus: 'אושר',
    cohortId: 'cohort-a',
  },
]

const filledDates = Array.from({ length: 16 }, (_, index) => {
  const day = String(index + 1).padStart(2, '0')
  return `2026-04-${day}`
})

const history = Object.fromEntries(
  filledDates.map((date, index) => [date, index % 2 === 0])
)

let requests: any[] = []
let currentStore: any = null

const createStore = () => configureStore({
  reducer: {
    [attendanceApi.reducerPath]: attendanceApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(attendanceApi.middleware),
})

const renderHistory = () => {
  const store = createStore()
  currentStore = store

  return render(
    React.createElement(
      Provider,
      { store },
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/?view=history&cohortId=cohort-a&date=2026-04-30'] },
        React.createElement(ArrivalSystem, { registrations })
      )
    )
  )
}

beforeEach(() => {
  requests = []
  Object.defineProperty(supabase, 'functions', {
    configurable: true,
    value: {
      invoke: async (_name: string, options: any) => {
        assert.equal(_name, 'get-attendance')
        requests.push(options.body)

        if (options.body.fullHistory) {
          return {
            data: {
              success: true,
              data: {
                dates: filledDates,
                history: {
                  'student-a': history,
                },
                notes: {},
                cohortId: 'cohort-a',
              },
            },
            error: null,
          }
        }

        return {
          data: {
            success: true,
            data: {
              dates: ['2026-04-17', '2026-04-18'],
              history: {
                'student-a': {
                  '2026-04-17': true,
                  '2026-04-18': false,
                },
              },
              notes: {},
              cohortId: 'cohort-a',
            },
          },
          error: null,
        }
      },
    },
  })
})

afterEach(() => {
  cleanup()
  currentStore?.dispatch(attendanceApi.util.resetApiState())
  currentStore = null
})

after(() => {
  ;(supabase as any).removeAllChannels?.()
  ;(supabase as any).realtime?.disconnect?.()
  dom.window.close()
  setTimeout(() => process.exit(process.exitCode ?? 0), 0)
})

test('history view pages through filled dates when empty days are excluded', async () => {
  renderHistory()

  await waitFor(() => {
    assert.ok(screen.getByText('16.04'))
  })

  assert.ok(requests.some((request) => request.fullHistory))

  fireEvent.click(screen.getByTitle('תאריכים קודמים'))

  await waitFor(() => {
    assert.ok(screen.getByText('01.04'))
    assert.ok(screen.getByText('02.04'))
  })

  assert.equal(screen.queryByText('16.04'), null)
})

test('history view requests a calendar range when empty days are included', async () => {
  renderHistory()

  await waitFor(() => {
    assert.ok(requests.some((request) => request.fullHistory))
  })

  fireEvent.click(await screen.findByLabelText('include empty days'))

  await waitFor(() => {
    assert.ok(requests.some((request) => request.dateRange))
  })

  const latestRangeRequest = requests.findLast((request) => request.dateRange)
  assert.deepEqual(latestRangeRequest.dateRange, {
    startDate: '2026-04-17',
    endDate: '2026-04-30',
  })
})
