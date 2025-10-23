import React, { useState, useEffect, useMemo } from 'react'
import { Filter, Zap, Check, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Search, Settings, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Autocomplete } from '@/components/ui/autocomplete'
import { Popover } from '@/components/ui/popover'

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

// Filter groups system
interface FilterCondition {
    id: string
    field: string
    operator: 'contains' | 'equals' | 'not_equals' | 'is_empty' | 'is_not_empty'
    value: string | boolean | null
}

interface FilterGroup {
    id: string
    conditions: FilterCondition[]
    operator: 'AND' | 'OR'
}

// Filter Condition Component
const FilterCondition = ({
    condition,
    fieldOptions,
    operatorOptions,
    filterOptions,
    onUpdate,
    onDelete
}: {
    condition: FilterCondition
    fieldOptions: Array<{ value: string, label: string }>
    operatorOptions: Array<{ value: string, label: string }>
    filterOptions: any
    onUpdate: (condition: FilterCondition) => void
    onDelete: () => void
}) => {
    const getValueOptions = (field: string) => {
        switch (field) {
            case 'school': return filterOptions.schools
            case 'course': return filterOptions.courses
            case 'cycle': return filterOptions.cycles
            case 'class': return filterOptions.classes
            case 'registrationStatus': return filterOptions.registrationStatuses
            case 'needsPickup':
            case 'inWhatsAppGroup': return ['כן', 'לא']
            default: return []
        }
    }

    const renderValueInput = () => {
        const valueOptions = getValueOptions(condition.field)
        const isEmptyOperator = condition.operator === 'is_empty' || condition.operator === 'is_not_empty'

        if (isEmptyOperator) {
            return <span className="text-gray-500 text-sm">אין צורך בערך</span>
        }

        if (valueOptions.length > 0) {
            return (
                <select
                    value={condition.value as string || ''}
                    onChange={(e) => onUpdate({ ...condition, value: e.target.value })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm min-w-[120px]"
                >
                    <option value="">בחר ערך</option>
                    {valueOptions.map((option: string) => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            )
        }

        return (
            <input
                type="text"
                value={condition.value as string || ''}
                onChange={(e) => onUpdate({ ...condition, value: e.target.value })}
                placeholder="הזן ערך"
                className="px-2 py-1 border border-gray-300 rounded text-sm min-w-[120px]"
            />
        )
    }

    return (
        <div className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-md">
            <select
                value={condition.field}
                onChange={(e) => onUpdate({ ...condition, field: e.target.value, value: null })}
                className="px-2 py-1 border border-gray-300 rounded text-sm min-w-[140px]"
            >
                {fieldOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>

            <select
                value={condition.operator}
                onChange={(e) => onUpdate({ ...condition, operator: e.target.value as any })}
                className="px-2 py-1 border border-gray-300 rounded text-sm min-w-[100px]"
            >
                {operatorOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>

            {renderValueInput()}

            <button
                onClick={onDelete}
                className="p-1 text-gray-400 hover:text-red-500"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    )
}

// Filter Group Component
const FilterGroup = ({
    group,
    fieldOptions,
    operatorOptions,
    filterOptions,
    onUpdate,
    onDelete,
    onAddCondition
}: {
    group: FilterGroup
    fieldOptions: Array<{ value: string, label: string }>
    operatorOptions: Array<{ value: string, label: string }>
    filterOptions: any
    onUpdate: (group: FilterGroup) => void
    onDelete: () => void
    onAddCondition: () => void
}) => {
    const updateCondition = (condition: FilterCondition) => {
        const updatedConditions = group.conditions.map((c: FilterCondition) =>
            c.id === condition.id ? condition : c
        )
        onUpdate({ ...group, conditions: updatedConditions })
    }

    const deleteCondition = (conditionId: string) => {
        const updatedConditions = group.conditions.filter((c: FilterCondition) => c.id !== conditionId)
        onUpdate({ ...group, conditions: updatedConditions })
    }

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">קבוצת תנאים</span>
                    <select
                        value={group.operator}
                        onChange={(e) => onUpdate({ ...group, operator: e.target.value as 'AND' | 'OR' })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                        <option value="AND">וגם (AND)</option>
                        <option value="OR">או (OR)</option>
                    </select>
                </div>
                <button
                    onClick={onDelete}
                    className="p-1 text-gray-400 hover:text-red-500"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="space-y-2">
                {group.conditions.map((condition: FilterCondition, index: number) => (
                    <div key={condition.id}>
                        {index > 0 && (
                            <div className="flex items-center justify-center py-2">
                                <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded border">
                                    {group.operator}
                                </span>
                            </div>
                        )}
                        <FilterCondition
                            condition={condition}
                            fieldOptions={fieldOptions}
                            operatorOptions={operatorOptions}
                            filterOptions={filterOptions}
                            onUpdate={updateCondition}
                            onDelete={() => deleteCondition(condition.id)}
                        />
                    </div>
                ))}
            </div>

            <button
                onClick={onAddCondition}
                className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
            >
                <span className="text-lg">+</span>
                הוסף תנאי
            </button>
        </div>
    )
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

    // Advanced filter states
    const [advancedFilters, setAdvancedFilters] = useState({
        schools: [] as string[],
        cycles: [] as string[],
        courses: [] as string[],
        classes: [] as string[],
        needsPickup: null as boolean | null,
        inWhatsAppGroup: null as boolean | null,
        registrationStatuses: [] as string[],
        operator: 'AND' as 'AND' | 'OR'
    })

    const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([])

    // Field options for filter conditions
    const fieldOptions = [
        { value: 'childName', label: 'שם הילד' },
        { value: 'parentName', label: 'שם מלא הורה' },
        { value: 'parentPhone', label: 'טלפון הורה' },
        { value: 'school', label: 'בית ספר' },
        { value: 'course', label: 'חוג' },
        { value: 'class', label: 'כיתה' },
        { value: 'cycle', label: 'מחזור' },
        { value: 'trialDate', label: 'תאריך הגעה לשיעור ניסיון' },
        { value: 'needsPickup', label: 'איסוף מהצהרון' },
        { value: 'inWhatsAppGroup', label: 'בקבוצת הוואטסאפ' },
        { value: 'registrationStatus', label: 'סטטוס רישום' }
    ]

    const operatorOptions = [
        { value: 'contains', label: 'מכיל' },
        { value: 'equals', label: 'שווה ל' },
        { value: 'not_equals', label: 'לא שווה ל' },
        { value: 'is_empty', label: 'ריק' },
        { value: 'is_not_empty', label: 'לא ריק' }
    ]

    // Sorting state
    const [sortConfig, setSortConfig] = useState<{
        key: keyof Registration | null;
        direction: 'asc' | 'desc';
    }>({ key: null, direction: 'asc' })

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 50

    // Search state
    const [searchQuery, setSearchQuery] = useState('')

    // Advanced filtering mode
    const [isAdvancedMode, setIsAdvancedMode] = useState(false)

    // Fetch real data from Supabase edge function
    useEffect(() => {
        const fetchRegistrations = async () => {
            try {
                setLoading(true)
                setError(null)

                // Get Supabase URL from environment
                const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'http://localhost:54321'

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
            } finally {
                setLoading(false)
            }
        }

        fetchRegistrations()
    }, [])

    // Handle sorting
    const handleSort = (key: keyof Registration) => {
        setSortConfig(prev => {
            // If clicking the same column
            if (prev.key === key) {
                // First click: asc, second click: desc, third click: unsort
                if (prev.direction === 'asc') {
                    return { key, direction: 'desc' }
                } else if (prev.direction === 'desc') {
                    return { key: null, direction: 'asc' } // Unsort
                }
            }
            // If clicking a different column, start with asc
            return { key, direction: 'asc' }
        })
    }

    // Filter and sort data
    const filteredRegistrations = useMemo(() => {
        // Ensure registrations is always an array
        const safeRegistrations = Array.isArray(registrations) ? registrations : []

        let filtered = safeRegistrations.filter(reg => {
            if (isAdvancedMode) {
                // Filter groups logic
                if (filterGroups.length > 0) {
                    const groupResults = filterGroups.map(group => {
                        const conditionResults = group.conditions.map(condition => {
                            const fieldValue = reg[condition.field as keyof Registration]

                            switch (condition.operator) {
                                case 'contains':
                                    return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase())
                                case 'equals':
                                    return String(fieldValue) === String(condition.value)
                                case 'not_equals':
                                    return String(fieldValue) !== String(condition.value)
                                case 'is_empty':
                                    return !fieldValue || String(fieldValue).trim() === ''
                                case 'is_not_empty':
                                    return fieldValue && String(fieldValue).trim() !== ''
                                default:
                                    return true
                            }
                        })

                        // Apply group operator (AND/OR within group)
                        return group.operator === 'AND'
                            ? conditionResults.every(result => result)
                            : conditionResults.some(result => result)
                    })

                    // All groups must pass (AND between groups)
                    return groupResults.every(result => result)
                }

                // Fallback to old advanced filters if no groups
                const conditions = []

                // Schools filter (OR within schools)
                if (advancedFilters.schools.length > 0) {
                    conditions.push(advancedFilters.schools.includes(reg.school))
                }

                // Cycles filter (OR within cycles)
                if (advancedFilters.cycles.length > 0) {
                    conditions.push(advancedFilters.cycles.includes(reg.cycle))
                }

                // Courses filter (OR within courses)
                if (advancedFilters.courses.length > 0) {
                    conditions.push(advancedFilters.courses.includes(reg.course))
                }

                // Classes filter (OR within classes)
                if (advancedFilters.classes.length > 0) {
                    conditions.push(advancedFilters.classes.includes(reg.class))
                }

                // Registration statuses filter (OR within statuses)
                if (advancedFilters.registrationStatuses.length > 0) {
                    conditions.push(advancedFilters.registrationStatuses.includes(reg.registrationStatus))
                }

                // Boolean filters
                if (advancedFilters.needsPickup !== null) {
                    conditions.push(reg.needsPickup === advancedFilters.needsPickup)
                }

                if (advancedFilters.inWhatsAppGroup !== null) {
                    conditions.push(reg.inWhatsAppGroup === advancedFilters.inWhatsAppGroup)
                }

                // Apply AND/OR logic
                if (conditions.length === 0) return true

                if (advancedFilters.operator === 'AND') {
                    return conditions.every(condition => condition)
                } else {
                    return conditions.some(condition => condition)
                }
            } else {
                // Simple filtering logic (existing)
                if (filters.school && reg.school !== filters.school) return false
                if (filters.cycle && reg.cycle !== filters.cycle) return false
                if (filters.course && reg.course !== filters.course) return false
                if (filters.class && reg.class !== filters.class) return false
                if (filters.needsPickup && reg.needsPickup.toString() !== filters.needsPickup) return false
                if (filters.inWhatsAppGroup && reg.inWhatsAppGroup.toString() !== filters.inWhatsAppGroup) return false
                if (filters.registrationStatus && reg.registrationStatus !== filters.registrationStatus) return false
                return true
            }
        })

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim()
            filtered = filtered.filter(reg => {
                return (
                    reg.childName.toLowerCase().includes(query) ||
                    reg.parentName.toLowerCase().includes(query) ||
                    reg.parentPhone.includes(query) ||
                    reg.school.toLowerCase().includes(query) ||
                    reg.course.toLowerCase().includes(query) ||
                    reg.class.toLowerCase().includes(query) ||
                    reg.cycle.toLowerCase().includes(query) ||
                    reg.trialDate.includes(query) ||
                    reg.registrationStatus.toLowerCase().includes(query)
                )
            })
        }

        // Apply sorting
        if (sortConfig.key) {
            filtered.sort((a, b) => {
                const aValue = a[sortConfig.key!]
                const bValue = b[sortConfig.key!]

                // Handle different data types
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    const comparison = aValue.localeCompare(bValue, 'he')
                    return sortConfig.direction === 'asc' ? comparison : -comparison
                }

                if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
                    const comparison = aValue === bValue ? 0 : aValue ? 1 : -1
                    return sortConfig.direction === 'asc' ? comparison : -comparison
                }

                // Fallback to string comparison
                const comparison = String(aValue).localeCompare(String(bValue), 'he')
                return sortConfig.direction === 'asc' ? comparison : -comparison
            })
        }

        return filtered
    }, [registrations, filters, sortConfig, searchQuery, isAdvancedMode, advancedFilters, filterGroups])

    // Pagination calculations
    const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedRegistrations = filteredRegistrations.slice(startIndex, endIndex)

    // Reset to first page when filters or search change
    useEffect(() => {
        setCurrentPage(1)
    }, [filters, searchQuery])


    const handleFilterChange = (filterName: string, value: string) => {
        setFilters(prev => ({ ...prev, [filterName]: value }))
    }

    const clearAllFilters = () => {
        setFilters({
            school: '',
            cycle: '',
            course: '',
            class: '',
            needsPickup: '',
            inWhatsAppGroup: '',
            registrationStatus: ''
        })
    }

    const clearAdvancedFilters = () => {
        setAdvancedFilters({
            schools: [],
            cycles: [],
            courses: [],
            classes: [],
            needsPickup: null,
            inWhatsAppGroup: null,
            registrationStatuses: [],
            operator: 'AND'
        })
    }

    // Filter groups helper functions
    const addFilterGroup = () => {
        const newGroup: FilterGroup = {
            id: Date.now().toString(),
            conditions: [{
                id: Date.now().toString() + '_1',
                field: 'childName',
                operator: 'contains',
                value: ''
            }],
            operator: 'AND'
        }
        setFilterGroups(prev => [...prev, newGroup])
    }

    const updateFilterGroup = (groupId: string, updatedGroup: FilterGroup) => {
        setFilterGroups(prev => prev.map(group =>
            group.id === groupId ? updatedGroup : group
        ))
    }

    const deleteFilterGroup = (groupId: string) => {
        setFilterGroups(prev => prev.filter(group => group.id !== groupId))
    }

    const addConditionToGroup = (groupId: string) => {
        const newCondition: FilterCondition = {
            id: Date.now().toString(),
            field: 'childName',
            operator: 'contains',
            value: ''
        }
        setFilterGroups(prev => prev.map(group =>
            group.id === groupId
                ? { ...group, conditions: [...group.conditions, newCondition] }
                : group
        ))
    }

    const clearFilterGroups = () => {
        setFilterGroups([])
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
            {/* Navbar */}
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">D</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">Dolittle</h1>
                                <p className="text-sm text-gray-500">ניהול הרשמות</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">סה"כ הרשמות</p>
                                <p className="text-2xl font-bold text-blue-600">{filteredRegistrations.length}</p>
                            </div>
                            <div className="w-px h-8 bg-gray-300"></div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefresh}
                                className="flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                רענן
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Search Bar */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="חיפוש בכל השדות..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                                />
                            </div>
                        </div>
                        {searchQuery && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSearchQuery('')}
                                className="text-gray-600 hover:text-gray-800"
                            >
                                נקה חיפוש
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="border-b bg-white">
                <div className="max-w-7xl mx-auto px-6 py-3">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">סינון:</span>
                        </div>

                        {/* Mode Toggle */}
                        <Button
                            variant={isAdvancedMode ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                            className="flex items-center gap-2"
                        >
                            <Settings className="h-4 w-4" />
                            {isAdvancedMode ? 'מצב מתקדם' : 'מצב פשוט'}
                        </Button>

                        {isAdvancedMode ? (
                            // Filter Groups Interface
                            <div className="w-full">
                                <div className="text-sm font-medium text-gray-700 mb-3">
                                    בתצוגה זו, הצג רשומות
                                </div>

                                {filterGroups.length === 0 ? (
                                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                        <div className="text-gray-500 mb-4">
                                            גרור תנאים לכאן כדי להוסיף אותם לקבוצה זו
                                        </div>
                                        <div className="flex items-center justify-center gap-4">
                                            <button
                                                onClick={addFilterGroup}
                                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                                            >
                                                <span className="text-lg">+</span>
                                                הוסף תנאי
                                            </button>
                                            <button
                                                onClick={addFilterGroup}
                                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                                            >
                                                <span className="text-lg">+</span>
                                                הוסף קבוצת תנאים
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {filterGroups.map((group, index) => (
                                            <div key={group.id}>
                                                {index > 0 && (
                                                    <div className="flex items-center justify-center py-2">
                                                        <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded border">
                                                            וגם (AND)
                                                        </span>
                                                    </div>
                                                )}
                                                <FilterGroup
                                                    group={group}
                                                    fieldOptions={fieldOptions}
                                                    operatorOptions={operatorOptions}
                                                    filterOptions={filterOptions}
                                                    onUpdate={(updatedGroup) => updateFilterGroup(group.id, updatedGroup)}
                                                    onDelete={() => deleteFilterGroup(group.id)}
                                                    onAddCondition={() => addConditionToGroup(group.id)}
                                                />
                                            </div>
                                        ))}

                                        <div className="flex items-center gap-4 pt-2">
                                            <button
                                                onClick={addFilterGroup}
                                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                                            >
                                                <span className="text-lg">+</span>
                                                הוסף תנאי
                                            </button>
                                            <button
                                                onClick={addFilterGroup}
                                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                                            >
                                                <span className="text-lg">+</span>
                                                הוסף קבוצת תנאים
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Simple Filters
                            <div className="flex items-center gap-3 flex-wrap">
                                <Autocomplete
                                    options={filterOptions.schools.map(school => ({ label: school, value: school }))}
                                    value={filters.school}
                                    onSelect={(value) => handleFilterChange('school', value)}
                                    placeholder="בית ספר"
                                    allowClear={true}
                                    className="min-w-[120px]"
                                />

                                <Autocomplete
                                    options={filterOptions.cycles.map(cycle => ({ label: cycle, value: cycle }))}
                                    value={filters.cycle}
                                    onSelect={(value) => handleFilterChange('cycle', value)}
                                    placeholder="מחזור"
                                    allowClear={true}
                                    className="min-w-[250px]"
                                />

                                <Autocomplete
                                    options={filterOptions.courses.map(course => ({ label: course, value: course }))}
                                    value={filters.course}
                                    onSelect={(value) => handleFilterChange('course', value)}
                                    placeholder="חוג"
                                    allowClear={true}
                                    className="min-w-[180px]"
                                />

                                <Autocomplete
                                    options={filterOptions.classes.map(cls => ({ label: cls, value: cls }))}
                                    value={filters.class}
                                    onSelect={(value) => handleFilterChange('class', value)}
                                    placeholder="כיתה"
                                    allowClear={true}
                                    className="min-w-[100px]"
                                />

                                <Autocomplete
                                    options={[
                                        { label: "כן", value: "true" },
                                        { label: "לא", value: "false" }
                                    ]}
                                    value={filters.needsPickup}
                                    onSelect={(value) => handleFilterChange('needsPickup', value)}
                                    placeholder="איסוף מהצהרון"
                                    allowClear={true}
                                    className="min-w-[140px]"
                                />

                                <Autocomplete
                                    options={[
                                        { label: "כן", value: "true" },
                                        { label: "לא", value: "false" }
                                    ]}
                                    value={filters.inWhatsAppGroup}
                                    onSelect={(value) => handleFilterChange('inWhatsAppGroup', value)}
                                    placeholder="קבוצת וואטסאפ"
                                    allowClear={true}
                                    className="min-w-[140px]"
                                />

                                <Autocomplete
                                    options={filterOptions.registrationStatuses.map(status => ({ label: status, value: status }))}
                                    value={filters.registrationStatus}
                                    onSelect={(value) => handleFilterChange('registrationStatus', value)}
                                    placeholder="סטטוס רישום"
                                    allowClear={true}
                                    className="min-w-[140px]"
                                />
                            </div>
                        )}

                        {/* Clear Button */}
                        {(isAdvancedMode ?
                            (filterGroups.length > 0 || advancedFilters.schools.length > 0 || advancedFilters.cycles.length > 0 || advancedFilters.courses.length > 0 ||
                                advancedFilters.classes.length > 0 || advancedFilters.registrationStatuses.length > 0 ||
                                advancedFilters.needsPickup !== null || advancedFilters.inWhatsAppGroup !== null) :
                            (filters.school || filters.cycle || filters.course || filters.class || filters.needsPickup || filters.inWhatsAppGroup || filters.registrationStatus)
                        ) && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={isAdvancedMode ? (filterGroups.length > 0 ? clearFilterGroups : clearAdvancedFilters) : clearAllFilters}
                                    className="text-gray-600 hover:text-gray-800"
                                >
                                    נקה הכל
                                </Button>
                            )}
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
                <div className="max-w-7xl mx-auto px-6">
                    {/* Table Header */}
                    <div className="flex items-center border-b bg-gray-50 py-3">
                        <div className="flex-1 min-w-[140px] px-4 text-center font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort('trialDate')}>
                            <div className="flex items-center justify-center gap-2">
                                תאריך הגעה לשיעור ניסיון
                                {sortConfig.key === 'trialDate' && (
                                    sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                )}
                            </div>
                        </div>
                        <div className="flex-1 min-w-[100px] px-4 text-center font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort('needsPickup')}>
                            <div className="flex items-center justify-center gap-2">
                                איסוף מהצהרון
                                {sortConfig.key === 'needsPickup' && (
                                    sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                )}
                            </div>
                        </div>
                        <div className="flex-1 min-w-[70px] px-4 text-center font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort('class')}>
                            <div className="flex items-center justify-center gap-2">
                                כיתה
                                {sortConfig.key === 'class' && (
                                    sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                )}
                            </div>
                        </div>
                        <div className="flex-1 min-w-[120px] px-4 text-center font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort('school')}>
                            <div className="flex items-center justify-center gap-2">
                                בית ספר
                                {sortConfig.key === 'school' && (
                                    sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                )}
                            </div>
                        </div>
                        <div className="flex-1 min-w-[120px] px-4 text-center font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort('course')}>
                            <div className="flex items-center justify-center gap-2">
                                חוג
                                {sortConfig.key === 'course' && (
                                    sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                )}
                            </div>
                        </div>
                        <div className="flex-1 min-w-[140px] px-4 text-center font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort('parentName')}>
                            <div className="flex items-center justify-center gap-2">
                                שם מלא הורה
                                {sortConfig.key === 'parentName' && (
                                    sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                )}
                            </div>
                        </div>
                        <div className="flex-1 min-w-[120px] px-4 text-center font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort('parentPhone')}>
                            <div className="flex items-center justify-center gap-2">
                                טלפון הורה
                                {sortConfig.key === 'parentPhone' && (
                                    sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                )}
                            </div>
                        </div>
                        <div className="flex-1 min-w-[200px] px-4 text-center font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort('cycle')}>
                            <div className="flex items-center justify-center gap-2">
                                מחזור
                                {sortConfig.key === 'cycle' && (
                                    sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                )}
                            </div>
                        </div>
                        <div className="flex-1 min-w-[120px] px-4 text-center font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort('childName')}>
                            <div className="flex items-center justify-center gap-2">
                                שם הילד
                                {sortConfig.key === 'childName' && (
                                    sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Paginated Table Body */}
                    <div className="overflow-x-auto">
                        {paginatedRegistrations.length > 0 ? (
                            <>
                                {paginatedRegistrations.map((registration, index) => (
                                    <div key={registration.id} className={`flex items-center border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                        <div className="flex-1 min-w-[140px] px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                                            {registration.trialDate}
                                        </div>
                                        <div className="flex-1 min-w-[100px] px-4 py-3 text-center">
                                            {registration.needsPickup && (
                                                <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full mx-auto">
                                                    <Check className="h-4 w-4 text-green-600" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-[70px] px-4 py-3">
                                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                                                {registration.class}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-[120px] px-4 py-3 text-gray-700 whitespace-nowrap">
                                            {registration.school}
                                        </div>
                                        <div className="flex-1 min-w-[120px] px-4 py-3">
                                            <div className="flex items-center gap-2 whitespace-nowrap">
                                                <Zap className="h-4 w-4 text-yellow-600" />
                                                <span className="text-gray-700">{registration.course}</span>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-[140px] px-4 py-3 text-gray-700 whitespace-nowrap">
                                            {registration.parentName}
                                        </div>
                                        <div className="flex-1 min-w-[120px] px-4 py-3 text-gray-700 font-mono whitespace-nowrap">
                                            {registration.parentPhone}
                                        </div>
                                        <div className="flex-1 min-w-[200px] px-4 py-3">
                                            <Popover content={registration.cycle}>
                                                <Button variant="outline" size="sm" className="text-xs bg-gray-100 hover:bg-gray-200 border-gray-300 whitespace-nowrap max-w-[180px] truncate">
                                                    {registration.cycle}
                                                </Button>
                                            </Popover>
                                        </div>
                                        <div className="flex-1 min-w-[120px] px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                                            {registration.childName}
                                        </div>
                                    </div>
                                ))}

                                {/* Pagination Controls */}
                                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
                                    <div className="text-sm text-gray-700">
                                        מציג {startIndex + 1}-{Math.min(endIndex, filteredRegistrations.length)} מתוך {filteredRegistrations.length} רשומות
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                            הקודם
                                        </Button>
                                        <span className="text-sm text-gray-700">
                                            עמוד {currentPage} מתוך {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                        >
                                            הבא
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-96 text-gray-500">
                                <div className="text-center">
                                    <p className="text-lg font-medium">אין נתונים להצגה</p>
                                    <p className="text-sm">לא נמצאו הרשמות התואמות לסינון הנוכחי</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default App
