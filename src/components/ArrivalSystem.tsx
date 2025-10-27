import React, { useState, useMemo } from 'react'
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
    const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({
        course: '',
        school: '',
        cohort: '',
        date: null
    })
    const [arrivalStatuses, setArrivalStatuses] = useState<Record<string, boolean>>({})

    // Extract unique options
    const courses = useMemo(() => {
        return Array.from(new Set(registrations.map(r => r.course).filter(Boolean)))
    }, [registrations])

    const schools = useMemo(() => {
        return Array.from(new Set(registrations.map(r => r.school).filter(Boolean)))
    }, [registrations])

    const cohorts = useMemo(() => {
        if (!selectedFilters.school) return []
        return Array.from(new Set(
            registrations
                .filter(r => r.school === selectedFilters.school)
                .map(r => r.class)
                .filter(Boolean)
        ))
    }, [registrations, selectedFilters.school])

    // Filter registrations based on selected filters
    const filteredRegistrations = useMemo(() => {
        let filtered = registrations

        if (selectedFilters.course) {
            filtered = filtered.filter(r => r.course === selectedFilters.course)
        }

        if (selectedFilters.school) {
            filtered = filtered.filter(r => r.school === selectedFilters.school)
        }

        if (selectedFilters.cohort) {
            filtered = filtered.filter(r => r.class === selectedFilters.cohort)
        }

        if (selectedFilters.date) {
            const selectedDateStr = selectedFilters.date.toISOString().split('T')[0]
            filtered = filtered.filter(r => r.trialDate === selectedDateStr)
        }

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

    const allFieldsSelected = selectedFilters.course && selectedFilters.school &&
        selectedFilters.cohort && selectedFilters.date

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

    return (
        <div className="max-w-7xl mx-auto px-6 py-8" dir="rtl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">מערכת הגעות</h1>
                <p className="text-gray-600">נהל הגעות של משתתפים לקורסים</p>
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
                            onSelect={(value) => setSelectedFilters(prev => ({ ...prev, course: value }))}
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
                            disabled={!selectedFilters.school}
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
            {allFieldsSelected && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">רשימת הרשמות</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    נמצאו {filteredRegistrations.length} הרשמות
                                </p>
                            </div>
                            <Button
                                onClick={handleSendToWebhook}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                שלח לעדכון
                            </Button>
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
                                            {registration.class}
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

            {!allFieldsSelected && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                    <p className="text-blue-800">
                        נא לבחור את כל השדות כדי לראות את רשימת ההרשמות
                    </p>
                </div>
            )}
        </div>
    )
}

export default ArrivalSystem

