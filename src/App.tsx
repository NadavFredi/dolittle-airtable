import React, { useState, useEffect, useMemo } from 'react'
import { ChevronDown, ChevronLeft, Filter, ArrowUpDown, Search, MoreHorizontal, Zap, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

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

const App: React.FC = () => {
    const [registrations, setRegistrations] = useState<Registration[]>([])
    const [filterOptions, setFilterOptions] = useState({
        schools: [] as string[],
        cycles: [] as string[],
        courses: [] as string[],
        classes: [] as string[],
        registrationStatuses: [] as string[]
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Filter states
    const [filters, setFilters] = useState({
        school: '',
        cycle: '',
        course: '',
        class: '',
        needsPickup: '',
        inWhatsAppGroup: '',
        registrationStatus: ''
    })

    // Fetch real data from Supabase edge function
    useEffect(() => {
        const fetchRegistrations = async () => {
            try {
                setLoading(true)
                setError(null)

                // Get Supabase URL from environment
                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'

                const response = await fetch(`${supabaseUrl}/functions/v1/get-registrations`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }

                const result = await response.json()

                if (result.success) {
                    setRegistrations(result.data)
                    if (result.filterOptions) {
                        setFilterOptions(result.filterOptions)
                    }
                } else {
                    throw new Error(result.error || 'Failed to fetch registrations')
                }
            } catch (err) {
                console.error('Error fetching registrations:', err)
                setError(err instanceof Error ? err.message : 'An unknown error occurred')

                // Fallback to mock data if API fails
                console.log('Falling back to mock data...')
                setRegistrations([
                    {
                        id: '1',
                        childName: 'גיל',
                        cycle: 'רוניקה א-ב - ראשון - 16:15',
                        parentPhone: '0505518585',
                        parentName: 'אריאל אלבז',
                        course: 'אלקטרוניקה',
                        school: 'גורדון',
                        class: 'א',
                        needsPickup: true,
                        trialDate: '14/9/2025',
                        inWhatsAppGroup: true,
                        registrationStatus: 'מאושר'
                    },
                    {
                        id: '2',
                        childName: 'ליאם יורמן',
                        cycle: 'רוניקה א-ב - ראשון - 16:15',
                        parentPhone: '0505518586',
                        parentName: 'דניאלה יורמן',
                        course: 'אלקטרוניקה',
                        school: 'גורדון',
                        class: 'ב',
                        needsPickup: true,
                        trialDate: '14/9/2025',
                        inWhatsAppGroup: true,
                        registrationStatus: 'מאושר'
                    },
                    {
                        id: '3',
                        childName: 'פלא ניב',
                        cycle: 'רוניקה א-ב - ראשון - 16:15',
                        parentPhone: '0505518587',
                        parentName: 'מיכל ניב',
                        course: 'אלקטרוניקה',
                        school: 'גורדון',
                        class: 'א',
                        needsPickup: true,
                        trialDate: '14/9/2025',
                        inWhatsAppGroup: false,
                        registrationStatus: 'מאושר'
                    }
                ])
            } finally {
                setLoading(false)
            }
        }

        fetchRegistrations()
    }, [])

    // Filter and process data
    const filteredRegistrations = useMemo(() => {
        return registrations.filter(reg => {
            if (filters.school && reg.school !== filters.school) return false
            if (filters.cycle && reg.cycle !== filters.cycle) return false
            if (filters.course && reg.course !== filters.course) return false
            if (filters.class && reg.class !== filters.class) return false
            if (filters.needsPickup && reg.needsPickup.toString() !== filters.needsPickup) return false
            if (filters.inWhatsAppGroup && reg.inWhatsAppGroup.toString() !== filters.inWhatsAppGroup) return false
            if (filters.registrationStatus && reg.registrationStatus !== filters.registrationStatus) return false
            return true
        })
    }, [registrations, filters])


    const handleFilterChange = (filterName: string, value: string) => {
        setFilters(prev => ({ ...prev, [filterName]: value }))
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">טוען נתונים...</p>
                </div>
            </div>
        )
    }

    const handleRefresh = () => {
        window.location.reload()
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
                    <div className="text-red-500 mb-4">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">שגיאה בטעינת הנתונים</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={handleRefresh} className="bg-blue-600 hover:bg-blue-700">
                        נסה שוב
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="border-b bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold">הרשמות לפי קבוצות - {filteredRegistrations.length}</h1>
                            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">הרשמות</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" className="flex items-center gap-2">
                                Group
                                <span className="bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs">2</span>
                            </Button>
                            <Button variant="outline" className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                Filter
                            </Button>
                            <Button variant="outline" className="flex items-center gap-2">
                                <ArrowUpDown className="h-4 w-4" />
                                Sort
                            </Button>
                            <Button variant="outline" size="icon">
                                <div className="h-4 w-4 bg-muted-foreground rounded-sm"></div>
                            </Button>
                            <Button variant="outline" size="icon">
                                <Search className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="border-b bg-white">
                    <div className="max-w-7xl mx-auto px-6 py-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                            <Select
                                placeholder="בית ספר"
                                options={filterOptions.schools.map(school => ({ value: school, label: school }))}
                                value={filters.school}
                                onValueChange={(value) => handleFilterChange('school', value)}
                            />
                            <Select
                                placeholder="מחזור"
                                options={filterOptions.cycles.map(cycle => ({ value: cycle, label: cycle }))}
                                value={filters.cycle}
                                onValueChange={(value) => handleFilterChange('cycle', value)}
                            />
                            <Select
                                placeholder="חוג"
                                options={filterOptions.courses.map(course => ({ value: course, label: course }))}
                                value={filters.course}
                                onValueChange={(value) => handleFilterChange('course', value)}
                            />
                            <Select
                                placeholder="כיתה"
                                options={filterOptions.classes.map(cls => ({ value: cls, label: cls }))}
                                value={filters.class}
                                onValueChange={(value) => handleFilterChange('class', value)}
                            />
                            <Select
                                placeholder="איסוף מהצהרון"
                                options={[
                                    { value: 'true', label: 'כן' },
                                    { value: 'false', label: 'לא' }
                                ]}
                                value={filters.needsPickup}
                                onValueChange={(value) => handleFilterChange('needsPickup', value)}
                            />
                            <Select
                                placeholder="קבוצת וואטסאפ"
                                options={[
                                    { value: 'true', label: 'כן' },
                                    { value: 'false', label: 'לא' }
                                ]}
                                value={filters.inWhatsAppGroup}
                                onValueChange={(value) => handleFilterChange('inWhatsAppGroup', value)}
                            />
                            <Select
                                placeholder="סטטוס רישום"
                                options={filterOptions.registrationStatuses.map(status => ({ value: status, label: status }))}
                                value={filters.registrationStatus}
                                onValueChange={(value) => handleFilterChange('registrationStatus', value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Grouping Section */}
                <div className="bg-white border-b">
                    <div className="max-w-7xl mx-auto px-6 py-3">
                        <div className="flex items-center gap-4 flex-wrap">
                            {filters.course && (
                                <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-md">
                                    <Zap className="h-4 w-4 text-yellow-600" />
                                    <span className="text-sm font-medium">{filters.course}</span>
                                    <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                                        {filteredRegistrations.filter(r => r.course === filters.course).length}
                                    </span>
                                </div>
                            )}

                            {filters.cycle && (
                                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-md">
                                    <span className="text-sm">{filters.cycle}</span>
                                    <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                                        {filteredRegistrations.filter(r => r.cycle === filters.cycle).length}
                                    </span>
                                </div>
                            )}

                            {filters.school && (
                                <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-md">
                                    <span className="text-sm">{filters.school}</span>
                                    <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                                        {filteredRegistrations.filter(r => r.school === filters.school).length}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="text-right font-semibold text-gray-700">תאריך הגעה לשיעור ניסיון</TableHead>
                                        <TableHead className="text-right font-semibold text-gray-700">האם צריך איסוף מהצהרון</TableHead>
                                        <TableHead className="text-right font-semibold text-gray-700">כיתה</TableHead>
                                        <TableHead className="text-right font-semibold text-gray-700">בית ספר</TableHead>
                                        <TableHead className="text-right font-semibold text-gray-700">חוג</TableHead>
                                        <TableHead className="text-right font-semibold text-gray-700">שם מלא הורה</TableHead>
                                        <TableHead className="text-right font-semibold text-gray-700">טלפון הורה</TableHead>
                                        <TableHead className="text-right font-semibold text-gray-700">מחזור</TableHead>
                                        <TableHead className="text-right font-semibold text-gray-700">שם הילד</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRegistrations.map((registration, index) => (
                                        <TableRow key={registration.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <TableCell className="font-medium text-gray-900">{registration.trialDate}</TableCell>
                                            <TableCell className="text-center">
                                                {registration.needsPickup && (
                                                    <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full mx-auto">
                                                        <Check className="h-4 w-4 text-green-600" />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                                    {registration.class}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-gray-700">{registration.school}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Zap className="h-4 w-4 text-yellow-600" />
                                                    <span className="text-gray-700">{registration.course}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-700">{registration.parentName}</TableCell>
                                            <TableCell className="text-gray-700 font-mono">{registration.parentPhone}</TableCell>
                                            <TableCell>
                                                <Button variant="outline" size="sm" className="text-xs bg-gray-100 hover:bg-gray-200 border-gray-300">
                                                    {registration.cycle}
                                                </Button>
                                            </TableCell>
                                            <TableCell className="font-semibold text-gray-900">{registration.childName}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default App
