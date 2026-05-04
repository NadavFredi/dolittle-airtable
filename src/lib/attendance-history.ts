interface GetHistoryDisplayDatesOptions {
  requestedDates: string[]
  reportedDates?: string[]
  history: Record<string, Record<string, boolean>>
  includeEmptyDays: boolean
}

interface GetHistoryNavigationDatesOptions {
  displayDates: string[]
  requestedDates: string[]
}

interface GetAttendanceRequestKeyOptions {
  cohortId: string
  date?: string
  dateRange?: {
    startDate: string
    endDate: string
  }
  fullHistory?: boolean
}

interface GetFilledHistoryWindowOptions {
  reportedDates: string[]
  anchorDate: string
  pageOffset: number
  pageSize: number
}

interface GetNextFilledHistoryPageOffsetOptions {
  reportedDates: string[]
  anchorDate: string
  currentOffset: number
  direction: 'forward' | 'back'
  pageSize: number
}

export const getHistoryDisplayDates = ({
  requestedDates,
  reportedDates,
  history,
  includeEmptyDays,
}: GetHistoryDisplayDatesOptions) => {
  if (includeEmptyDays) {
    return requestedDates
  }

  const requestedDateSet = new Set(requestedDates)
  const dateOrder = new Map(requestedDates.map((date, index) => [date, index]))
  const datesWithAttendance = new Set<string>()

  if (reportedDates) {
    reportedDates.forEach((date) => {
      if (requestedDateSet.has(date)) {
        datesWithAttendance.add(date)
      }
    })
  } else {
    Object.values(history).forEach((studentHistory) => {
      Object.keys(studentHistory).forEach((date) => {
        if (requestedDateSet.has(date)) {
          datesWithAttendance.add(date)
        }
      })
    })
  }

  return Array.from(datesWithAttendance).sort((leftDate, rightDate) => {
    return (dateOrder.get(leftDate) ?? 0) - (dateOrder.get(rightDate) ?? 0)
  })
}

export const getHistoryNavigationDates = ({
  displayDates,
  requestedDates,
}: GetHistoryNavigationDatesOptions) => {
  return displayDates.length > 0 ? displayDates : requestedDates
}

export const getAttendanceRequestKey = ({
  cohortId,
  date,
  dateRange,
  fullHistory,
}: GetAttendanceRequestKeyOptions) => {
  if (fullHistory) {
    return `${cohortId}:full-history`
  }

  if (dateRange) {
    return `${cohortId}:${dateRange.startDate}:${dateRange.endDate}`
  }

  return `${cohortId}:${date || ''}`
}

export const getFilledHistoryWindow = ({
  reportedDates,
  anchorDate,
  pageOffset,
  pageSize,
}: GetFilledHistoryWindowOptions) => {
  const sortedDates = Array.from(new Set(reportedDates)).sort()
  if (sortedDates.length === 0) {
    return []
  }

  const anchorIndex = sortedDates.findLastIndex((date) => date <= anchorDate)
  const anchoredEndIndex = anchorIndex === -1 ? sortedDates.length - 1 : anchorIndex
  const endIndex = anchoredEndIndex - pageOffset * pageSize

  if (endIndex < 0) {
    return []
  }

  const startIndex = Math.max(0, endIndex - pageSize + 1)
  return sortedDates.slice(startIndex, endIndex + 1)
}

export const getNextFilledHistoryPageOffset = ({
  reportedDates,
  anchorDate,
  currentOffset,
  direction,
  pageSize,
}: GetNextFilledHistoryPageOffsetOptions) => {
  if (direction === 'forward') {
    return Math.max(0, currentOffset - 1)
  }

  const nextOffset = currentOffset + 1
  const nextWindow = getFilledHistoryWindow({
    reportedDates,
    anchorDate,
    pageOffset: nextOffset,
    pageSize,
  })

  return nextWindow.length > 0 ? nextOffset : currentOffset
}
