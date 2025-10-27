import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Autocomplete } from '@/components/ui/autocomplete'
import { DatePickerInput } from '@/components/ui/date-picker-input'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/hooks/useAuth'

interface Registration {
    id: string
    childName: string
    cycle: string
    parentPhone: string
    parentName: string
    course: string
    school: string
    class: string
    needsPickup: boolean
    trialDate: string
    inWhatsAppGroup: boolean
    registrationStatus: string
    cohortId?: string  // מזהה רשומת מחזור
}

interface ArrivalSystemProps {
    registrations: Registration[]
    loading?: boolean
}

interface SelectedFilters {
    course: string
    school: string
    cohort: string
    date: Date | null
}

const ArrivalSystem: React.FC<ArrivalSystemProps> = ({ registrations, loading = false }) => {
    const [searchParams, setSearchParams] = useSearchParams()

    // Initialize state from URL params
    const getInitialDate = () => {
        const dateParam = searchParams.get('date')
        if (dateParam) {
            const parsed = new Date(dateParam)
            if (!isNaN(parsed.getTime())) return parsed
        }
        return new Date() // Default to today
    }

    const [viewMode, setViewMode] = useState<'mark' | 'history'>(() => {
        const mode = searchParams.get('view') as 'mark' | 'history' | null
        return mode === 'history' ? 'history' : 'mark'
    })
    const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({
        course: searchParams.get('course') || '',
        school: searchParams.get('school') || '',
        cohort: searchParams.get('cohort') || '',
        date: getInitialDate()
    })
    const [arrivalStatuses, setArrivalStatuses] = useState<Record<string, boolean>>({})
    const [isSaving, setIsSaving] = useState(false)
    const [isLoadingAttendance, setIsLoadingAttendance] = useState(false)

    // For history view - fetch attendance records
    const [fullAttendanceHistory, setFullAttendanceHistory] = useState<Record<string, Record<string, boolean>>>({})
    const [allHistoryDates, setAllHistoryDates] = useState<string[]>([]) // All dates from API
    const [attendanceDates, setAttendanceDates] = useState<string[]>([]) // Current 14-day window to display
    const [attendanceHistory, setAttendanceHistory] = useState<Record<string, Record<string, boolean>>>({}) // Current window data
    const [currentDateOffset, setCurrentDateOffset] = useState(0) // Days to offset from today
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)
    const [hasFetchedFullHistory, setHasFetchedFullHistory] = useState(false) // Track if we've fetched full history

    // Extract unique options
    const courses = useMemo(() => {
        return Array.from(new Set(registrations.map(r => r.course).filter(Boolean)))
    }, [registrations])

    const schools = useMemo(() => {
        if (!selectedFilters.course) return []
        return Array.from(new Set(
            registrations
                .filter(r => r.course === selectedFilters.course)
                .map(r => r.school)
                .filter(Boolean)
        ))
    }, [registrations, selectedFilters.course])

    const cohorts = useMemo(() => {
        if (!selectedFilters.school || !selectedFilters.course) return []
        return Array.from(new Set(
            registrations
                .filter(r => r.school === selectedFilters.school && r.course === selectedFilters.course)
                .map(r => r.cycle)
                .filter(Boolean)
        ))
    }, [registrations, selectedFilters.school, selectedFilters.course])

    // Filter registrations based on selected filters (date is NOT used for filtering, only for attendance marking)
    const filteredRegistrations = useMemo(() => {
        let filtered = registrations

        if (selectedFilters.course) {
            filtered = filtered.filter(r => r.course === selectedFilters.course)
        }

        if (selectedFilters.school) {
            filtered = filtered.filter(r => r.school === selectedFilters.school)
        }

        if (selectedFilters.cohort) {
            filtered = filtered.filter(r => r.cycle === selectedFilters.cohort)
        }

        // NOTE: Date is NOT used for filtering - it's used as the attendance date for marking
        // We show ALL students in this cohort regardless of their trialDate

        return filtered
    }, [registrations, selectedFilters])

    const handleToggleArrival = (registrationId: string) => {
        setArrivalStatuses(prev => ({
            ...prev,
            [registrationId]: !prev[registrationId]
        }))
    }

    // All required fields for displaying the table (date is optional, for marking attendance)
    const allFieldsSelected = selectedFilters.course && selectedFilters.school && selectedFilters.cohort

    // Sync filters to URL params
    useEffect(() => {
        const params = new URLSearchParams(searchParams)

        if (selectedFilters.course) {
            params.set('course', selectedFilters.course)
        } else {
            params.delete('course')
        }

        if (selectedFilters.school) {
            params.set('school', selectedFilters.school)
        } else {
            params.delete('school')
        }

        if (selectedFilters.cohort) {
            params.set('cohort', selectedFilters.cohort)
        } else {
            params.delete('cohort')
        }

        if (selectedFilters.date) {
            params.set('date', selectedFilters.date.toISOString().split('T')[0])
        } else {
            params.delete('date')
        }

        params.set('view', viewMode)

        setSearchParams(params, { replace: true })
    }, [selectedFilters, viewMode, searchParams, setSearchParams])

    // Load existing attendance data when date is selected
    useEffect(() => {
        if (selectedFilters.date && allFieldsSelected && filteredRegistrations.length > 0) {
            const fetchAttendanceData = async () => {
                try {
                    setIsLoadingAttendance(true)
                    const cohortId = filteredRegistrations[0]?.cohortId
                    if (!cohortId) {
                        console.log('No cohort ID available')
                        setIsLoadingAttendance(false)
                        return
                    }

                    const date = selectedFilters.date!.toISOString().split('T')[0]

                    const { data, error } = await supabase.functions.invoke('get-attendance', {
                        body: { cohortId, date }
                    })

                    if (error) {
                        console.error('Error calling get-attendance:', error)
                        setIsLoadingAttendance(false)
                        return
                    }

                    if (data?.success && data?.data?.attendance) {
                        setArrivalStatuses(data.data.attendance)
                    } else {
                        console.log('No attendance data found for this date')
                    }
                } catch (error) {
                    console.error('Error fetching attendance:', error)
                } finally {
                    setIsLoadingAttendance(false)
                }
            }

            fetchAttendanceData()
        }
    }, [selectedFilters.date, allFieldsSelected, filteredRegistrations])

    const handleSendToWebhook = async () => {
        if (!selectedFilters.cohort || !selectedFilters.date) {
            toast.error('נא למלא את כל השדות: cohort ותאריך')
            return
        }

        const cohortName = selectedFilters.cohort
        const date = selectedFilters.date.toISOString().split('T')[0]

        try {
            setIsSaving(true)

            // Get cohortId from the first registration (all should have the same cohort)
            const cohortId = filteredRegistrations[0]?.cohortId || ''

            if (!cohortId) {
                toast.error('לא נמצא מזהה קבוצה - נא לנסות שוב')
                return
            }

            const arrivals = filteredRegistrations.map(reg => ({
                id: reg.id,
                arrived: arrivalStatuses[reg.id] || false,
                childName: reg.childName,
                parentName: reg.parentName,
                parentPhone: reg.parentPhone
            }))

            const payload = {
                cohortId,
                cohortName,
                date,
                arrivals
            }

            console.log('Sending to webhook:', payload)

            const response = await fetch('https://hook.eu2.make.com/6luhtuffr5m49cnoronku4fnv7g7wlyr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            // Handle the response - it might return plain text or JSON
            const contentType = response.headers.get('content-type')
            if (contentType && contentType.includes('application/json')) {
                const result = await response.json()
                console.log('Webhook response:', result)
            } else {
                const textResult = await response.text()
                console.log('Webhook response (text):', textResult)
            }

            toast.success(`נשלח בהצלחה! ${arrivals.length} תלמידים`, {
                description: `תאריך: ${date} • קבוצה: ${cohortName.substring(0, 30)}...`
            })
        } catch (error) {
            console.error('Error sending to webhook:', error)
            toast.error('שגיאה בשליחה', {
                description: error instanceof Error ? error.message : 'Unknown error'
            })
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">טוען...</p>
                </div>
            </div>
        )
    }

    // Fetch full attendance history once when entering history mode
    useEffect(() => {
        if (viewMode === 'history' && allFieldsSelected && filteredRegistrations.length > 0 && !hasFetchedFullHistory) {
            const fetchFullHistory = async () => {
                try {
                    setIsLoadingHistory(true)
                    const cohortId = filteredRegistrations[0]?.cohortId
                    if (!cohortId) {
                        console.log('No cohort ID available')
                        setIsLoadingHistory(false)
                        return
                    }

                    // Fetch full history from API (without date range)
                    const { data, error } = await supabase.functions.invoke('get-attendance', {
                        body: {
                            cohortId,
                            fullHistory: true
                        }
                    })

                    if (error) {
                        console.error('Error calling get-attendance for history:', error)
                        setFullAttendanceHistory({})
                        setAllHistoryDates([])
                        return
                    }

                    if (data?.success && data?.data) {
                        if (data.data.history) {
                            setFullAttendanceHistory(data.data.history)
                        }

                        if (data.data.dates && Array.isArray(data.data.dates) && data.data.dates.length > 0) {
                            setAllHistoryDates(data.data.dates)
                        } else {
                            // Extract dates from history if not provided
                            const allDates = new Set<string>()
                            const history = data.data.history || {}
                            Object.values(history).forEach((studentDates) => {
                                if (studentDates && typeof studentDates === 'object') {
                                    Object.keys(studentDates).forEach(date => allDates.add(date))
                                }
                            })
                            setAllHistoryDates(Array.from(allDates).sort())
                        }
                    }

                    setHasFetchedFullHistory(true)
                } catch (error) {
                    console.error('Error fetching history:', error)
                    setFullAttendanceHistory({})
                    setAllHistoryDates([])
                } finally {
                    setIsLoadingHistory(false)
                }
            }

            fetchFullHistory()
        }
    }, [viewMode, allFieldsSelected, filteredRegistrations, hasFetchedFullHistory])

    // Update displayed dates based on current offset (no API call needed)
    useEffect(() => {
        if (viewMode === 'history' && allHistoryDates.length > 0) {
            const allDatesCopy = [...allHistoryDates]
            const maxOffset = Math.max(0, allDatesCopy.length - 14)
            const clampedOffset = Math.min(currentDateOffset, maxOffset)

            // Display 14 dates starting from the offset (or fewer if not enough dates)
            const windowDates = allDatesCopy.slice(clampedOffset, clampedOffset + 14)
            setAttendanceDates(windowDates)

            // Filter attendance history for current window
            const windowHistory: Record<string, Record<string, boolean>> = {}
            filteredRegistrations.forEach(student => {
                if (fullAttendanceHistory[student.id]) {
                    windowHistory[student.id] = {}
                    windowDates.forEach(date => {
                        windowHistory[student.id][date] = fullAttendanceHistory[student.id][date] || false
                    })
                } else {
                    windowHistory[student.id] = {}
                    windowDates.forEach(date => {
                        windowHistory[student.id][date] = false
                    })
                }
            })
            setAttendanceHistory(windowHistory)
        }
    }, [viewMode, allHistoryDates, currentDateOffset, filteredRegistrations, fullAttendanceHistory])

    const handleDateNavigation = (direction: 'forward' | 'back') => {
        if (direction === 'forward') {
            setCurrentDateOffset(prev => Math.max(0, prev - 14))
        } else {
            // Calculate max offset based on all available dates
            const maxOffset = Math.max(0, allHistoryDates.length - 14)
            setCurrentDateOffset(prev => Math.min(prev + 14, maxOffset))
        }
    }

    // When filters change, reset the full history fetch flag
    useEffect(() => {
        setHasFetchedFullHistory(false)
        setCurrentDateOffset(0)
    }, [selectedFilters.cohort])

    return (
        <div className="max-w-7xl mx-auto px-6 py-8" dir="rtl">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">מערכת הגעות</h1>
                    <p className="text-gray-600">נהל הגעות של משתתפים לקורסים</p>
                </div>

                {/* View Mode Toggle */}
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('mark')}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${viewMode === 'mark'
                            ? 'bg-white shadow-sm text-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        סמן הגעה
                    </button>
                    <button
                        onClick={() => setViewMode('history')}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${viewMode === 'history'
                            ? 'bg-white shadow-sm text-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        היסטוריית הגעה
                    </button>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    סינון נתונים
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            קורס
                        </label>
                        <Autocomplete
                            options={courses.map(c => ({ label: c, value: c }))}
                            value={selectedFilters.course}
                            onSelect={(value) => setSelectedFilters(prev => ({ ...prev, course: value, school: '', cohort: '' }))}
                            placeholder="בחר קורס"
                            allowClear
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            בית ספר
                        </label>
                        <Autocomplete
                            options={schools.map(s => ({ label: s, value: s }))}
                            value={selectedFilters.school}
                            onSelect={(value) => setSelectedFilters(prev => ({ ...prev, school: value, cohort: '' }))}
                            placeholder="בחר בית ספר"
                            allowClear
                            disabled={!selectedFilters.course}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            קבוצה
                        </label>
                        <Autocomplete
                            options={cohorts.map(c => ({ label: c, value: c }))}
                            value={selectedFilters.cohort}
                            onSelect={(value) => setSelectedFilters(prev => ({ ...prev, cohort: value }))}
                            placeholder="בחר קבוצה"
                            allowClear
                            disabled={!selectedFilters.school || !selectedFilters.course}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            תאריך
                        </label>
                        <DatePickerInput
                            value={selectedFilters.date}
                            onChange={(date) => setSelectedFilters(prev => ({ ...prev, date }))}
                            placeholder="בחר תאריך"
                        />
                    </div>
                </div>
            </div>

            {/* Results Section */}
            {allFieldsSelected && viewMode === 'mark' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">רשימת התלמידים בקבוצה</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    נמצאו {filteredRegistrations.length} תלמידים
                                    {selectedFilters.date && (
                                        <>
                                            {' • '}
                                            <span className="font-medium text-green-600">
                                                {Object.values(arrivalStatuses).filter(Boolean).length} סומנו
                                            </span>
                                        </>
                                    )}
                                </p>
                            </div>
                            {selectedFilters.date && (
                                <div className="flex items-center gap-3">
                                    <div className="text-sm text-gray-600">
                                        {selectedFilters.date.toLocaleDateString('he-IL', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                    <Button
                                        onClick={handleSendToWebhook}
                                        disabled={isSaving}
                                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                שולח...
                                            </>
                                        ) : (
                                            'שמור עדכונים'
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {isLoadingAttendance ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">טוען נתוני הגעה...</p>
                            </div>
                        ) : (
                            <>
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                הגיע
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                שם הילד
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                שם ההורה
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                טלפון
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                קורס
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                בית ספר
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                קבוצה
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                סטטוס הרשמה
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredRegistrations.map((registration) => (
                                            <tr key={registration.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={arrivalStatuses[registration.id] || false}
                                                        onChange={() => handleToggleArrival(registration.id)}
                                                        className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {registration.childName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {registration.parentName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {registration.parentPhone}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {registration.course}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {registration.school}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {registration.cycle}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${registration.registrationStatus === 'אושר'
                                                        ? 'bg-green-100 text-green-800'
                                                        : registration.registrationStatus === 'נדחה'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {registration.registrationStatus}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {filteredRegistrations.length === 0 && (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500">לא נמצאו הרשמות העונות על הקריטריונים</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* History Matrix View */}
            {allFieldsSelected && viewMode === 'history' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">היסטוריית הגעה</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    {filteredRegistrations.length} תלמידים • {attendanceDates.length} תאריכים
                                </p>
                            </div>

                            {/* Date Navigation */}
                            {!isLoadingHistory && attendanceDates.length > 0 && (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleDateNavigation('back')}
                                        disabled={currentDateOffset === 0 || allHistoryDates.length <= 14}
                                        className="p-2 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="תאריכים קודמים"
                                    >
                                        <ChevronRight className="w-5 h-5 text-gray-600" />
                                    </button>

                                    <div className="text-sm font-medium text-gray-700 px-3">
                                        {new Date(attendanceDates[0]).toLocaleDateString('he-IL', {
                                            day: '2-digit',
                                            month: '2-digit'
                                        })} - {new Date(attendanceDates[attendanceDates.length - 1]).toLocaleDateString('he-IL', {
                                            day: '2-digit',
                                            month: '2-digit'
                                        })}
                                    </div>

                                    <button
                                        onClick={() => handleDateNavigation('forward')}
                                        disabled={(currentDateOffset + 14) >= allHistoryDates.length || allHistoryDates.length <= 14}
                                        className="p-2 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="תאריכים הבאים"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {isLoadingHistory ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">טוען היסטוריית הגעה...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {/* Fixed student name column */}
                                        <th className="sticky right-0 bg-gray-50 border-b border-gray-200 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider z-10">
                                            שם התלמיד
                                        </th>
                                        {/* Date columns */}
                                        {attendanceDates.map((date) => (
                                            <th
                                                key={date}
                                                className="border-b border-gray-200 px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                {new Date(date).toLocaleDateString('he-IL', {
                                                    month: '2-digit',
                                                    day: '2-digit'
                                                })}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredRegistrations.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            {/* Fixed student name cell */}
                                            <td className="sticky right-0 bg-white border-b border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 z-10 whitespace-nowrap">
                                                {student.childName}
                                            </td>
                                            {/* Attendance cells */}
                                            {attendanceDates.map((date) => (
                                                <td
                                                    key={date}
                                                    className="border-b border-gray-200 px-3 py-3 text-center"
                                                >
                                                    {attendanceHistory[student.id]?.[date] ? (
                                                        <div className="flex items-center justify-center">
                                                            <span className="text-green-600 text-xl">✓</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center">
                                                            <span className="text-red-400 text-xl">✗</span>
                                                        </div>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {!allFieldsSelected && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                    <p className="text-blue-800">
                        נא לבחור קורס, בית ספר וקבוצה כדי לראות את רשימת התלמידים
                    </p>
                    <p className="text-sm text-blue-700 mt-2">
                        תאריך משמש לסמן הגעה - נא לבחור תאריך גם כן
                    </p>
                </div>
            )}
        </div>
    )
}

export default ArrivalSystem

