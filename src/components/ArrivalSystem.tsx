import React, { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Autocomplete } from '@/components/ui/autocomplete'
import { DatePickerInput } from '@/components/ui/date-picker-input'
import { Calendar } from 'lucide-react'

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
    const [viewMode, setViewMode] = useState<'mark' | 'history'>('mark')
    const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({
        course: '',
        school: '',
        cohort: '',
        date: null
    })
    const [arrivalStatuses, setArrivalStatuses] = useState<Record<string, boolean>>({})

    // For history view - fetch attendance records
    const [attendanceHistory, setAttendanceHistory] = useState<Record<string, Record<string, boolean>>>({})
    const [attendanceDates, setAttendanceDates] = useState<string[]>([])

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

    const handleSendToWebhook = async () => {
        if (!selectedFilters.cohort || !selectedFilters.date) {
            alert('נא למלא את כל השדות: cohort ותאריך')
            return
        }

        const cohortId = selectedFilters.cohort
        const date = selectedFilters.date.toISOString().split('T')[0]

        try {
            // Mock API call - in production this would be the actual webhook
            console.log('Sending to webhook:', { cohortId, date })

            const arrivals = filteredRegistrations.map(reg => ({
                id: reg.id,
                arrived: arrivalStatuses[reg.id] || false,
                childName: reg.childName,
                parentName: reg.parentName,
                parentPhone: reg.parentPhone
            }))

            console.log('Arrivals data:', arrivals)

            // In production, make actual API call:
            // const response = await fetch('https://hook.eu2.make.com/0e2cyv1hcdgbvcisfh6hk3sc55lqqjai', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ cohortId, date, arrivals })
            // })

            alert(`נשלח בהצלחה! Cohort: ${cohortId}, Date: ${date}, Records: ${arrivals.length}`)
        } catch (error) {
            console.error('Error sending to webhook:', error)
            alert('שגיאה בשליחה')
        }
    }

    // All required fields for displaying the table (date is optional, for marking attendance)
    const allFieldsSelected = selectedFilters.course && selectedFilters.school && selectedFilters.cohort

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

    // Fetch attendance history when in history mode
    useEffect(() => {
        if (viewMode === 'history' && allFieldsSelected) {
            // Mock: In real app, this would fetch from API
            // For now, generate some sample dates
            const dates = []
            const today = new Date()
            for (let i = 0; i < 14; i++) {
                const date = new Date(today)
                date.setDate(date.getDate() - i)
                dates.push(date.toISOString().split('T')[0])
            }
            setAttendanceDates(dates.reverse())

            // Mock attendance data
            const mockAttendance: Record<string, Record<string, boolean>> = {}
            filteredRegistrations.forEach(student => {
                mockAttendance[student.id] = {}
                dates.forEach(date => {
                    // Random for demo
                    mockAttendance[student.id][date] = Math.random() > 0.3
                })
            })
            setAttendanceHistory(mockAttendance)
        }
    }, [viewMode, allFieldsSelected, filteredRegistrations])

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
                                    נמצאו {filteredRegistrations.length} תלמידים{selectedFilters.date && ` - סמן הגעה לתאריך ${selectedFilters.date.toLocaleDateString('he-IL')}`}
                                </p>
                            </div>
                            {selectedFilters.date && (
                                <Button
                                    onClick={handleSendToWebhook}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    שלח לעדכון
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
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
                        </div>
                    </div>

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

