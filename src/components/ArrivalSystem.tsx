import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Autocomplete } from '@/components/ui/autocomplete'
import { DatePickerInput } from '@/components/ui/date-picker-input'
import { Calendar, ChevronLeft, ChevronRight, FileText, X } from 'lucide-react'
import { toast } from 'sonner'
import { useGetAttendanceQuery } from '@/store/api'
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
    cohortId: string // Store the cohort ID instead of name in URL
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
        cohortId: searchParams.get('cohortId') || '',
        date: getInitialDate()
    })
    const [arrivalStatuses, setArrivalStatuses] = useState<Record<string, boolean>>({})
    const [notes, setNotes] = useState<Record<string, string>>({}) // studentId -> note text
    const [noteEditMode, setNoteEditMode] = useState<string | null>(null) // studentId currently being edited
    const [notePopupOpen, setNotePopupOpen] = useState<string | null>(null) // studentId for popup dialog
    const [tempNoteValue, setTempNoteValue] = useState<string>('') // Temporary value for popup
    const [isSaving, setIsSaving] = useState(false)
    const [isLoadingAttendance, setIsLoadingAttendance] = useState(false)

    // For history view - fetch attendance records
    const [fullAttendanceHistory, setFullAttendanceHistory] = useState<Record<string, Record<string, boolean>>>({})
    const [historyNotes, setHistoryNotes] = useState<Record<string, Record<string, string>>>({}) // studentId -> { date: note }
    const [allHistoryDates, setAllHistoryDates] = useState<string[]>([]) // All dates from API
    const [attendanceDates, setAttendanceDates] = useState<string[]>([]) // Current 14-day window to display
    const [attendanceHistory, setAttendanceHistory] = useState<Record<string, Record<string, boolean>>>({}) // Current window data
    const [currentDateOffset, setCurrentDateOffset] = useState(0) // Days to offset from today
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)

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

    const handleOpenNotePopup = (studentId: string) => {
        setNotePopupOpen(studentId)
        setTempNoteValue(notes[studentId] || '')
    }

    const handleCloseNotePopup = () => {
        setNotePopupOpen(null)
        setTempNoteValue('')
    }

    const handleSaveNote = (studentId: string) => {
        setNotes(prev => ({ ...prev, [studentId]: tempNoteValue }))
        handleCloseNotePopup()
    }

    // Handle ESC key to close popup
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && notePopupOpen) {
                handleCloseNotePopup()
            }
        }
        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [notePopupOpen])

    // Load course/school/cohort from cohortId on initial load
    useEffect(() => {
        if (selectedFilters.cohortId && !selectedFilters.cohort) {
            // Find the registration with this cohortId
            const matchingReg = registrations.find(r => r.cohortId === selectedFilters.cohortId)
            if (matchingReg) {
                setSelectedFilters(prev => ({
                    ...prev,
                    course: matchingReg.course,
                    school: matchingReg.school,
                    cohort: matchingReg.cycle
                }))
            }
        }
    }, [selectedFilters.cohortId, selectedFilters.cohort, registrations])

    // All required fields for displaying the table (date is optional, for marking attendance)
    const allFieldsSelected = selectedFilters.course && selectedFilters.school && selectedFilters.cohort

    // Early return for loading state - MUST be before all hooks to avoid "Rendered fewer hooks" error
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

    // Sync filters to URL params - only store cohortId for cleaner URLs
    useEffect(() => {
        const params = new URLSearchParams(searchParams)

        let hasChanges = false

        // Update cohortId (this is what we actually use)
        if (selectedFilters.cohortId && params.get('cohortId') !== selectedFilters.cohortId) {
            params.set('cohortId', selectedFilters.cohortId)
            hasChanges = true
        } else if (!selectedFilters.cohortId && params.has('cohortId')) {
            params.delete('cohortId')
            hasChanges = true
        }

        // Check and update date
        const dateString = selectedFilters.date ? selectedFilters.date.toISOString().split('T')[0] : null
        if (dateString && params.get('date') !== dateString) {
            params.set('date', dateString)
            hasChanges = true
        } else if (!dateString && params.has('date')) {
            params.delete('date')
            hasChanges = true
        }

        // Check and update view
        const currentView = params.get('view') || 'mark'
        if (viewMode !== currentView) {
            params.set('view', viewMode)
            hasChanges = true
        }

        // Remove old name-based params if they exist (for migration)
        if (params.has('course')) params.delete('course')
        if (params.has('school')) params.delete('school')
        if (params.has('cohort')) params.delete('cohort')

        // Only update if there are actual changes
        if (hasChanges) {
            setSearchParams(params, { replace: true })
        }
    }, [selectedFilters.cohortId, selectedFilters.date, viewMode, searchParams, setSearchParams])

    // Get attendance data using RTK Query for mark mode
    const shouldFetchMarkAttendance =
        viewMode === 'mark' &&
        selectedFilters.date &&
        allFieldsSelected &&
        filteredRegistrations.length > 0

    const cohortId = filteredRegistrations[0]?.cohortId
    const date = selectedFilters.date?.toISOString().split('T')[0]

    const {
        data: markAttendanceData,
        isLoading: isLoadingMarkAttendance,
        error: markAttendanceError
    } = useGetAttendanceQuery(
        {
            cohortId: cohortId || '',
            date: date
        },
        {
            skip: !shouldFetchMarkAttendance || !cohortId || !date
        }
    )

    // Update state when mark attendance data is loaded
    useEffect(() => {
        if (viewMode === 'mark' && markAttendanceData?.success && markAttendanceData?.data) {
            if (markAttendanceData.data.attendance) {
                setArrivalStatuses(markAttendanceData.data.attendance)
            }
            if (markAttendanceData.data.notes) {
                setNotes(markAttendanceData.data.notes)
            }
        }
    }, [markAttendanceData, viewMode])

    // Update loading state
    useEffect(() => {
        if (shouldFetchMarkAttendance) {
            setIsLoadingAttendance(isLoadingMarkAttendance)
        }
    }, [shouldFetchMarkAttendance, isLoadingMarkAttendance])

    // Handle errors
    useEffect(() => {
        if (markAttendanceError) {
            const errorMessage = (markAttendanceError as any)?.error || 'Unknown error'
            if (!errorMessage.includes('502') && !errorMessage.includes('Bad Gateway')) {
                toast.error('שגיאה בטעינת נתוני הגעה', {
                    description: errorMessage
                })
            }
        }
    }, [markAttendanceError])

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
                parentPhone: reg.parentPhone,
                note: notes[reg.id] || ''
            }))

            const payload = {
                cohortId,
                cohortName,
                date,
                arrivals
            }

            console.log('Sending to API:', payload)

            // Call Supabase Edge Function instead of webhook directly
            const { data, error } = await supabase.functions.invoke('send-attendance', {
                body: payload
            })

            if (error) {
                console.error('Error calling send-attendance:', error)
                throw new Error(error.message || 'Failed to send attendance')
            }

            console.log('API response:', data)

            toast.success(`נשלח בהצלחה! ${arrivals.length} תלמידים`, {
                description: `תאריך: ${date} • קבוצה: ${cohortName.substring(0, 30)}...`
            })
        } catch (error) {
            console.error('Error sending attendance:', error)
            toast.error('שגיאה בשליחה', {
                description: error instanceof Error ? error.message : 'Unknown error'
            })
        } finally {
            setIsSaving(false)
        }
    }

    // Get attendance history using RTK Query for history mode
    const shouldFetchHistory =
        viewMode === 'history' &&
        allFieldsSelected &&
        filteredRegistrations.length > 0

    const historyCohortId = filteredRegistrations[0]?.cohortId

    const {
        data: historyAttendanceData,
        isLoading: isLoadingHistoryAttendance,
        error: historyAttendanceError
    } = useGetAttendanceQuery(
        {
            cohortId: historyCohortId || '',
            fullHistory: true
        },
        {
            skip: !shouldFetchHistory || !historyCohortId
        }
    )

    // Update state when history attendance data is loaded
    useEffect(() => {
        if (viewMode === 'history' && historyAttendanceData?.success && historyAttendanceData?.data) {
            if (historyAttendanceData.data.history) {
                setFullAttendanceHistory(historyAttendanceData.data.history)
            }

            // Load notes if provided
            if (historyAttendanceData.data.historyNotes) {
                setHistoryNotes(historyAttendanceData.data.historyNotes)
            }

            if (historyAttendanceData.data.dates && Array.isArray(historyAttendanceData.data.dates) && historyAttendanceData.data.dates.length > 0) {
                setAllHistoryDates(historyAttendanceData.data.dates)
            } else {
                // Extract dates from history if not provided
                const allDates = new Set<string>()
                const history = historyAttendanceData.data.history || {}
                Object.values(history).forEach((studentDates) => {
                    if (studentDates && typeof studentDates === 'object') {
                        Object.keys(studentDates).forEach(date => allDates.add(date))
                    }
                })
                setAllHistoryDates(Array.from(allDates).sort())
            }
        }
    }, [historyAttendanceData, viewMode])

    // Update loading state for history
    useEffect(() => {
        if (shouldFetchHistory) {
            setIsLoadingHistory(isLoadingHistoryAttendance)
        }
    }, [shouldFetchHistory, isLoadingHistoryAttendance])

    // Handle history errors
    useEffect(() => {
        if (historyAttendanceError) {
            console.error('Error fetching history attendance:', historyAttendanceError)
        }
    }, [historyAttendanceError])

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

    // When filters change, reset the current date offset
    useEffect(() => {
        setCurrentDateOffset(0)
    }, [selectedFilters.cohort])

    return (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-6" dir="rtl">
            <div className="mb-3 sm:mb-6">
                <div className="mb-3 sm:mb-4">
                    <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-0.5 sm:mb-2">מערכת הגעות</h1>
                    <p className="text-xs sm:text-base text-gray-600">נהל הגעות של משתתפים לקורסים</p>
                </div>

                {/* View Mode Toggle */}
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
                    <button
                        onClick={() => setViewMode('mark')}
                        className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-md font-medium transition-colors text-sm sm:text-base ${viewMode === 'mark'
                            ? 'bg-white shadow-sm text-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        סמן הגעה
                    </button>
                    <button
                        onClick={() => setViewMode('history')}
                        className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-md font-medium transition-colors text-sm sm:text-base ${viewMode === 'history'
                            ? 'bg-white shadow-sm text-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        היסטוריית הגעה
                    </button>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6 mb-3 sm:mb-6">
                <h2 className="text-sm sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-4 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                    סינון נתונים
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            קורס
                        </label>
                        <Autocomplete
                            options={courses.map(c => ({ label: c, value: c }))}
                            value={selectedFilters.course}
                            onSelect={(value) => setSelectedFilters(prev => ({ ...prev, course: value, school: '', cohort: '', cohortId: '' }))}
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
                            onSelect={(value) => setSelectedFilters(prev => ({ ...prev, school: value, cohort: '', cohortId: '' }))}
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
                            onSelect={(value) => {
                                // Find the cohortId for this cohort
                                const filtered = registrations
                                    .filter(r => r.school === selectedFilters.school && r.course === selectedFilters.course && r.cycle === value)
                                const cohortId = filtered[0]?.cohortId || ''
                                setSelectedFilters(prev => ({ ...prev, cohort: value, cohortId }))
                            }}
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
                    <div className="p-3 sm:p-6 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                            <div className="flex-1">
                                <h2 className="text-base sm:text-lg font-semibold text-gray-900">רשימת התלמידים בקבוצה</h2>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1">
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
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                                    <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-right order-2 sm:order-1">
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
                                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 w-full sm:w-auto order-1 sm:order-2"
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

                    <div className="overflow-x-hidden">
                        {isLoadingAttendance ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">טוען נתוני הגעה...</p>
                            </div>
                        ) : (
                            <>
                                {/* Mobile Card View */}
                                <div className="block md:hidden divide-y divide-gray-200">
                                    {filteredRegistrations.map((registration) => (
                                        <div key={registration.id} className="bg-white px-3 py-3 active:bg-gray-50 transition-colors">
                                            <div className="flex items-start gap-2.5 mb-2.5">
                                                <input
                                                    type="checkbox"
                                                    checked={arrivalStatuses[registration.id] || false}
                                                    onChange={() => handleToggleArrival(registration.id)}
                                                    className="h-5 w-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-semibold text-base text-gray-900">{registration.childName}</h3>
                                                        {notes[registration.id] && (
                                                            <div className="relative group/name-tooltip flex-shrink-0">
                                                                <FileText className="w-4 h-4 text-blue-500" />
                                                                <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-10 opacity-0 group-hover/name-tooltip:opacity-100 transition-opacity pointer-events-none">
                                                                    {notes[registration.id]}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${registration.registrationStatus === 'אושר'
                                                            ? 'bg-green-100 text-green-800'
                                                            : registration.registrationStatus === 'נדחה'
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {registration.registrationStatus}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-2.5 text-sm">
                                                <div>
                                                    <span className="text-gray-500">הורה:</span> <span className="text-gray-900">{registration.parentName}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">טלפון:</span> <a href={`tel:${registration.parentPhone}`} className="text-blue-600">{registration.parentPhone}</a>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-gray-500">קורס:</span> <span className="text-gray-900">{registration.course}</span>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-gray-500">בית ספר:</span> <span className="text-gray-900">{registration.school}</span>
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-gray-200">
                                                <button
                                                    onClick={() => handleOpenNotePopup(registration.id)}
                                                    className="w-full flex items-center justify-between gap-2 text-sm py-2 px-3 rounded-md border border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all"
                                                >
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <FileText className={`w-4 h-4 flex-shrink-0 ${notes[registration.id] ? 'text-blue-600' : 'text-gray-400'}`} />
                                                        <span className="text-gray-700 font-medium">
                                                            {notes[registration.id] ? 'ערוך הערה' : 'הוסף הערה'}
                                                        </span>
                                                    </div>
                                                    {notes[registration.id] && (
                                                        <span className="text-xs text-gray-500 truncate max-w-[40%]">
                                                            {notes[registration.id]}
                                                        </span>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop Table View */}
                                <table className="w-full hidden md:table">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                הגיע
                                            </th>
                                            <th className="px-3 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                שם הילד
                                            </th>
                                            <th className="px-3 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                שם ההורה
                                            </th>
                                            <th className="px-3 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                טלפון
                                            </th>
                                            <th className="px-3 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                קורס
                                            </th>
                                            <th className="px-3 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                בית ספר
                                            </th>
                                            <th className="px-3 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                סטטוס הרשמה
                                            </th>
                                            <th className="px-3 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                הערות
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredRegistrations.map((registration) => (
                                            <tr key={registration.id} className="hover:bg-gray-50 group">
                                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={arrivalStatuses[registration.id] || false}
                                                        onChange={() => handleToggleArrival(registration.id)}
                                                        className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <div className="flex items-center gap-2">
                                                        <span>{registration.childName}</span>
                                                        {notes[registration.id] && (
                                                            <div className="relative group/name-tooltip">
                                                                <FileText className="w-4 h-4 text-blue-500" />
                                                                <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10 opacity-0 group-hover/name-tooltip:opacity-100 transition-opacity pointer-events-none">
                                                                    {notes[registration.id]}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {registration.parentName}
                                                </td>
                                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {registration.parentPhone}
                                                </td>
                                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {registration.course}
                                                </td>
                                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {registration.school}
                                                </td>
                                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${registration.registrationStatus === 'אושר'
                                                        ? 'bg-green-100 text-green-800'
                                                        : registration.registrationStatus === 'נדחה'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {registration.registrationStatus}
                                                    </span>
                                                </td>
                                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                                                    {noteEditMode === registration.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={notes[registration.id] || ''}
                                                                onChange={(e) => setNotes(prev => ({ ...prev, [registration.id]: e.target.value }))}
                                                                onBlur={() => setNoteEditMode(null)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        setNoteEditMode(null)
                                                                    }
                                                                }}
                                                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                autoFocus
                                                            />
                                                            <button
                                                                onClick={() => setNoteEditMode(null)}
                                                                className="text-gray-400 hover:text-gray-600"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <div className="relative group/tooltip">
                                                                {notes[registration.id] ? (
                                                                    <FileText className="w-4 h-4 text-blue-600" />
                                                                ) : (
                                                                    <FileText className="w-4 h-4 text-gray-300" />
                                                                )}
                                                                {notes[registration.id] && (
                                                                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-opacity">
                                                                        {notes[registration.id]}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() => handleOpenNotePopup(registration.id)}
                                                                className="text-xs text-blue-600 hover:text-blue-800"
                                                            >
                                                                {notes[registration.id] ? 'ערוך' : 'הוסף'}
                                                            </button>
                                                        </div>
                                                    )}
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
                            <table className="w-full border-collapse min-w-[600px]">
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
                                        <tr key={student.id} className="hover:bg-gray-50 group">
                                            {/* Fixed student name cell */}
                                            <td className="sticky right-0 bg-white border-b border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 z-10 whitespace-nowrap">
                                                {student.childName}
                                            </td>
                                            {/* Attendance cells */}
                                            {attendanceDates.map((date) => {
                                                const note = historyNotes[student.id]?.[date]
                                                const hasNote = note !== undefined && note !== null && note !== ''
                                                return (
                                                    <td
                                                        key={date}
                                                        className="border-b border-gray-200 px-3 py-3 text-center"
                                                    >
                                                        <div className="flex items-center justify-center gap-1 group/cell">
                                                            {attendanceHistory[student.id]?.[date] ? (
                                                                <span className="text-green-600 text-xl">✓</span>
                                                            ) : (
                                                                <span className="text-red-400 text-xl">✗</span>
                                                            )}
                                                            {hasNote && (
                                                                <div className="relative group/note-icon">
                                                                    <FileText className="w-3 h-3 text-blue-500" />
                                                                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10 opacity-0 group-hover/note-icon:opacity-100 transition-opacity pointer-events-none whitespace-normal">
                                                                        {note}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                )
                                            })}
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

            {/* Note Popup Modal */}
            {notePopupOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={handleCloseNotePopup}
                >
                    <div
                        className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
                        dir="rtl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">הוסף הערה</h3>
                            <button
                                onClick={handleCloseNotePopup}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <textarea
                            value={tempNoteValue}
                            onChange={(e) => setTempNoteValue(e.target.value)}
                            placeholder="הקלד הערה..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px] resize-none text-sm"
                            dir="rtl"
                            autoFocus
                        />

                        <div className="flex gap-2 mt-4">
                            <Button
                                onClick={() => handleSaveNote(notePopupOpen)}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                                שמור
                            </Button>
                            <Button
                                onClick={handleCloseNotePopup}
                                variant="outline"
                                className="flex-1"
                            >
                                ביטול
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ArrivalSystem

