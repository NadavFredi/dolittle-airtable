import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getAttendanceRequestKey,
  getFilledHistoryWindow,
  getHistoryDisplayDates,
  getHistoryNavigationDates,
  getNextFilledHistoryPageOffset,
} from './attendance-history'

const requestedDates = [
  '2026-04-22',
  '2026-04-23',
  '2026-04-24',
  '2026-04-25',
]

test('getHistoryDisplayDates hides empty days by default while keeping reported absences', () => {
  const result = getHistoryDisplayDates({
    requestedDates,
    reportedDates: ['2026-04-22', '2026-04-24'],
    history: {
      studentA: {
        '2026-04-22': false,
        '2026-04-24': true,
      },
      studentB: {
        '2026-04-22': false,
        '2026-04-24': false,
      },
    },
    includeEmptyDays: false,
  })

  assert.deepEqual(result, ['2026-04-22', '2026-04-24'])
})

test('getHistoryDisplayDates includes every requested day when empty days are enabled', () => {
  const result = getHistoryDisplayDates({
    requestedDates,
    reportedDates: ['2026-04-22', '2026-04-24'],
    history: {
      studentA: {
        '2026-04-22': false,
        '2026-04-24': true,
      },
    },
    includeEmptyDays: true,
  })

  assert.deepEqual(result, requestedDates)
})

test('getHistoryDisplayDates derives reported dates from history when the API omits dates', () => {
  const result = getHistoryDisplayDates({
    requestedDates,
    history: {
      studentA: {
        '2026-04-23': false,
      },
      studentB: {
        '2026-04-25': true,
      },
    },
    includeEmptyDays: false,
  })

  assert.deepEqual(result, ['2026-04-23', '2026-04-25'])
})

test('getHistoryNavigationDates keeps navigation anchored when displayed dates are empty', () => {
  const result = getHistoryNavigationDates({
    displayDates: [],
    requestedDates,
  })

  assert.deepEqual(result, requestedDates)
})

test('getAttendanceRequestKey changes when cohort or date range changes', () => {
  const firstKey = getAttendanceRequestKey({
    cohortId: 'cohort-a',
    date: '2026-04-25',
  })
  const nextDateKey = getAttendanceRequestKey({
    cohortId: 'cohort-a',
    date: '2026-04-26',
  })
  const nextCohortKey = getAttendanceRequestKey({
    cohortId: 'cohort-b',
    date: '2026-04-25',
  })
  const nextRangeKey = getAttendanceRequestKey({
    cohortId: 'cohort-a',
    dateRange: {
      startDate: '2026-04-12',
      endDate: '2026-04-25',
    },
  })
  const fullHistoryKey = getAttendanceRequestKey({
    cohortId: 'cohort-a',
    fullHistory: true,
  })

  assert.notEqual(firstKey, nextDateKey)
  assert.notEqual(firstKey, nextCohortKey)
  assert.notEqual(firstKey, nextRangeKey)
  assert.notEqual(nextRangeKey, fullHistoryKey)
})

test('getFilledHistoryWindow pages through filled dates instead of calendar days', () => {
  const reportedDates = [
    '2026-04-01',
    '2026-04-08',
    '2026-04-15',
    '2026-04-22',
    '2026-04-29',
  ]

  assert.deepEqual(
    getFilledHistoryWindow({
      reportedDates,
      anchorDate: '2026-04-30',
      pageOffset: 0,
      pageSize: 2,
    }),
    ['2026-04-22', '2026-04-29']
  )

  assert.deepEqual(
    getFilledHistoryWindow({
      reportedDates,
      anchorDate: '2026-04-30',
      pageOffset: 1,
      pageSize: 2,
    }),
    ['2026-04-08', '2026-04-15']
  )
})

test('getNextFilledHistoryPageOffset does not advance past the last filled page', () => {
  const reportedDates = [
    '2026-04-01',
    '2026-04-08',
    '2026-04-15',
  ]

  assert.equal(
    getNextFilledHistoryPageOffset({
      reportedDates,
      anchorDate: '2026-04-30',
      currentOffset: 1,
      direction: 'back',
      pageSize: 2,
    }),
    1
  )

  assert.equal(
    getNextFilledHistoryPageOffset({
      reportedDates,
      anchorDate: '2026-04-30',
      currentOffset: 1,
      direction: 'forward',
      pageSize: 2,
    }),
    0
  )
})
