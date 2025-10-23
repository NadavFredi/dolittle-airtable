import React, { useState, useEffect, useMemo } from 'react'
import { Filter, Zap, Check, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Search, Settings, X, MessageCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Autocomplete } from '@/components/ui/autocomplete'
import { Popover } from '@/components/ui/popover'
import { AppFooter } from '@/components/AppFooter'

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
                <Autocomplete
                    options={valueOptions.map((option: string) => ({ label: option, value: option }))}
                    value={condition.value as string || ''}
                    onSelect={(value) => onUpdate({ ...condition, value })}
                    placeholder="בחר ערך"
                    allowClear={true}
                    className="min-w-[120px]"
                />
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
        <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
            <Autocomplete
                options={fieldOptions}
                value={condition.field}
                onSelect={(value) => onUpdate({ ...condition, field: value, value: null })}
                placeholder="בחר שדה"
                allowClear={false}
                className="min-w-[140px]"
            />

            <select
                value={condition.operator}
                onChange={(e) => onUpdate({ ...condition, operator: e.target.value as any })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm min-w-[100px] bg-white"
            >
                {operatorOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>

            {renderValueInput()}

            <button
                onClick={onDelete}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
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
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">קבוצת תנאים</span>
                    <select
                        value={group.operator}
                        onChange={(e) => onUpdate({ ...group, operator: e.target.value as 'AND' | 'OR' })}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white"
                    >
                        <option value="AND">וגם (AND)</option>
                        <option value="OR">או (OR)</option>
                    </select>
                </div>
                <button
                    onClick={onDelete}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="space-y-3">
                {group.conditions.map((condition: FilterCondition, index: number) => (
                    <div key={condition.id}>
                        {index > 0 && (
                            <div className="flex items-center justify-center py-2">
                                <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-md border shadow-sm">
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
                className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
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

    // Inter-group operator (AND/OR between groups)
    const [interGroupOperator, setInterGroupOperator] = useState<'AND' | 'OR'>('AND')

    // Bulk messaging state
    const [showBulkMessaging, setShowBulkMessaging] = useState(false)
    const [bulkMessagingStep, setBulkMessagingStep] = useState<'config' | 'confirm' | 'sending'>('config')
    const [messagingMode, setMessagingMode] = useState<'formal' | 'informal'>('formal')
    const [registrationLink, setRegistrationLink] = useState('')
    const [messageContent, setMessageContent] = useState('')
    const [flowId, setFlowId] = useState('')
    const [isSendingLink, setIsSendingLink] = useState(false)
    const [trackingUrl, setTrackingUrl] = useState('')

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

                    // Apply inter-group operator (AND/OR between groups)
                    return interGroupOperator === 'AND'
                        ? groupResults.every(result => result)
                        : groupResults.some(result => result)
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
    }, [registrations, filters, sortConfig, searchQuery, isAdvancedMode, advancedFilters, filterGroups, interGroupOperator])

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

    // Bulk messaging functions
    const getUniquePhoneNumbers = () => {
        const phones = filteredRegistrations.map(reg => reg.parentPhone).filter(phone => phone)
        return [...new Set(phones)]
    }

    const sendBulkMessages = async () => {
        setIsSending(true)
        setBulkMessagingStep('sending')

        try {
            const uniquePhones = getUniquePhoneNumbers()

            const payload = {
                registrations: filteredRegistrations.map(reg => ({
                    id: reg.id,
                    childName: reg.childName,
                    parentName: reg.parentName,
                    parentPhone: reg.parentPhone,
                    school: reg.school,
                    course: reg.course,
                    cycle: reg.cycle,
                    registrationLink: registrationLink ? `${registrationLink}?id=${reg.id}` : null,
                    messageContent: messageContent,
                    flowId: flowId
                })),
                totalUsers: filteredRegistrations.length,
                uniqueNumbers: uniquePhones.length,
                registrationLink: registrationLink,
                messageContent: messageContent,
                messagingMode: messagingMode,
                flowId: flowId
            }

            const response = await fetch(`${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/send-bulk-messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(import.meta as any).env.VITE_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify(payload)
            })

            if (response.ok) {
                const result = await response.json()

                // Store tracking URL - no ugly browser alerts!
                if (result.result?.url) {
                    setTrackingUrl(result.result.url)
                }

                // Don't close modal yet - user can see tracking link
                setBulkMessagingStep('confirm')
            } else {
                throw new Error('Failed to send messages')
            }
        } catch (error) {
            console.error('Error sending bulk messages:', error)
            alert('שגיאה בשליחת ההודעות')
        } finally {
            setIsSending(false)
        }
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
                            <img
                                src="/easyflow-site-logo.png"
                                alt="EasyFlow logo"
                                className="h-10 w-auto object-contain"
                            />
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

                            {/* WhatsApp Bulk Messaging Button */}
                            {filteredRegistrations.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowBulkMessaging(true)}
                                    className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    שליחת הודעות
                                </Button>
                            )}

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
                                        <div className="text-gray-500 mb-6 text-sm">
                                            גרור תנאים לכאן כדי להוסיף אותם לקבוצה זו
                                        </div>
                                        <div className="flex items-center justify-center gap-4">
                                            <button
                                                onClick={addFilterGroup}
                                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium px-4 py-2 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                                            >
                                                <span className="text-lg">+</span>
                                                הוסף תנאי
                                            </button>
                                            <button
                                                onClick={addFilterGroup}
                                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium px-4 py-2 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
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
                                                        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded border shadow-sm">
                                                            <span className="text-sm text-gray-600">לוגיקה בין קבוצות:</span>
                                                            <select
                                                                value={interGroupOperator}
                                                                onChange={(e) => setInterGroupOperator(e.target.value as 'AND' | 'OR')}
                                                                className="px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                                                            >
                                                                <option value="AND">וגם (AND)</option>
                                                                <option value="OR">או (OR)</option>
                                                            </select>
                                                        </div>
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

                                        <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                                            <button
                                                onClick={addFilterGroup}
                                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium px-4 py-2 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                                            >
                                                <span className="text-lg">+</span>
                                                הוסף תנאי
                                            </button>
                                            <button
                                                onClick={addFilterGroup}
                                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium px-4 py-2 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
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
                                    onClick={isAdvancedMode ? (filterGroups.length > 0 ? () => { clearFilterGroups(); setInterGroupOperator('AND') } : clearAdvancedFilters) : clearAllFilters}
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

            {/* Bulk Messaging Modal */}
            {showBulkMessaging && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <MessageCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">שליחת הודעות WhatsApp</h2>
                                        <p className="text-sm text-gray-500">שליחת הודעות למשתמשים מסוננים</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowBulkMessaging(false)
                                        setBulkMessagingStep('config')
                                        setRegistrationLink('')
                                        setMessageContent('')
                                        setFlowId('')
                                        setMessagingMode('formal')
                                        setIsSendingLink(false)
                                        setTrackingUrl('')
                                    }}
                                    className="p-2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Statistics */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-blue-600">{filteredRegistrations.length}</p>
                                        <p className="text-sm text-gray-600">סה"כ משתמשים</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-green-600">{getUniquePhoneNumbers().length}</p>
                                        <p className="text-sm text-gray-600">מספרים ייחודיים</p>
                                    </div>
                                </div>
                            </div>

                            {bulkMessagingStep === 'config' && (
                                <div className="space-y-6">
                                    {/* Mode Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            בחר סוג הודעה
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setMessagingMode('formal')}
                                                className={`p-4 rounded-lg border-2 transition-colors ${messagingMode === 'formal'
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className="text-center">
                                                    <div className="font-medium mb-1">רשמי</div>
                                                    <div className="text-xs text-gray-500">WhatsApp Business API</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => setMessagingMode('informal')}
                                                className={`p-4 rounded-lg border-2 transition-colors ${messagingMode === 'informal'
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className="text-center">
                                                    <div className="font-medium mb-1">לא רשמי</div>
                                                    <div className="text-xs text-gray-500">הודעות ארוכות</div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Formal Mode Fields */}
                                    {messagingMode === 'formal' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Flow ID
                                                </label>
                                                <input
                                                    type="text"
                                                    value={flowId}
                                                    onChange={(e) => setFlowId(e.target.value)}
                                                    placeholder="content20250910073225_988996"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    הזן את מזהה ה-Flow מה-WhatsApp Business API
                                                </p>
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <input
                                                        type="checkbox"
                                                        id="sendingLink"
                                                        checked={isSendingLink}
                                                        onChange={(e) => setIsSendingLink(e.target.checked)}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <label htmlFor="sendingLink" className="text-sm font-medium text-gray-700">
                                                        אני שולח קישור הרשמה
                                                    </label>
                                                </div>

                                                {isSendingLink && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            קישור בסיס (עם פרמטר שאילתה)
                                                        </label>
                                                        <input
                                                            type="url"
                                                            value={registrationLink}
                                                            onChange={(e) => setRegistrationLink(e.target.value)}
                                                            placeholder="https://example.com/register?id="
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            הקישור יושלם עם מזהה כל רשומה: {registrationLink ? `${registrationLink}123` : 'https://example.com/register?id=123'}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {/* Informal Mode Fields */}
                                    {messagingMode === 'informal' && (
                                        <>
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center">
                                                        <span className="text-yellow-600 text-sm">!</span>
                                                    </div>
                                                    <h3 className="font-medium text-yellow-800">שירות זמנית לא זמין</h3>
                                                </div>
                                                <p className="text-sm text-yellow-700">
                                                    אנו עדיין לא תומכים בהודעות WhatsApp לא רשמיות. אנא בחר במצב רשמי.
                                                </p>
                                            </div>

                                            <div className="opacity-50">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    תוכן ההודעה הארוכה
                                                </label>
                                                <textarea
                                                    value={messageContent}
                                                    onChange={(e) => setMessageContent(e.target.value)}
                                                    placeholder="הזן את תוכן ההודעה הארוכה שתישלח..."
                                                    rows={6}
                                                    disabled
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    שדה זה יהיה זמין בעתיד
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    <div className="flex items-center justify-end gap-3 pt-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowBulkMessaging(false)}
                                        >
                                            ביטול
                                        </Button>
                                        <Button
                                            onClick={() => setBulkMessagingStep('confirm')}
                                            disabled={messagingMode === 'formal' ? !flowId.trim() : true}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            המשך
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {bulkMessagingStep === 'confirm' && (
                                <div className="space-y-6">
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center">
                                                <span className="text-yellow-600 text-sm">!</span>
                                            </div>
                                            <h3 className="font-medium text-yellow-800">אישור שליחה</h3>
                                        </div>
                                        <p className="text-sm text-yellow-700">
                                            אתה עומד לשלוח הודעה ל-{getUniquePhoneNumbers().length} מספרים ייחודיים.
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 mb-3">תצוגה מקדימה:</h4>
                                        <div className="space-y-2">
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">סוג הודעה:</span> {messagingMode === 'formal' ? 'רשמי (WhatsApp Business API)' : 'לא רשמי (הודעות ארוכות)'}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">מספר נמענים:</span> {getUniquePhoneNumbers().length}
                                            </p>
                                            {messagingMode === 'formal' && (
                                                <>
                                                    <p className="text-sm text-gray-600">
                                                        <span className="font-medium">Flow ID:</span> {flowId}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        <span className="font-medium">קישור הרשמה:</span> {isSendingLink ? (registrationLink ? 'כן' : 'לא מוגדר') : 'לא'}
                                                    </p>
                                                </>
                                            )}
                                            {messagingMode === 'informal' && messageContent && (
                                                <div className="mt-3 p-3 bg-white rounded border">
                                                    <p className="text-sm font-medium text-gray-700 mb-1">תוכן ההודעה:</p>
                                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{messageContent}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Tracking URL Section - shown after successful send */}
                                    {trackingUrl && (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                                                    <span className="text-green-600 text-sm">✓</span>
                                                </div>
                                                <h3 className="font-medium text-green-800">הודעות נשלחו בהצלחה!</h3>
                                            </div>
                                            <p className="text-sm text-green-700 mb-3">
                                                אתה יכול לבדוק את הסטטוס כאן:
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={trackingUrl}
                                                    readOnly
                                                    className="flex-1 px-3 py-2 border border-green-300 rounded-md bg-white text-sm font-mono"
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigator.clipboard.writeText(trackingUrl)}
                                                    className="text-green-600 hover:text-green-700 border-green-300 hover:bg-green-50"
                                                >
                                                    העתק
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => window.open(trackingUrl, '_blank')}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    פתח
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-end gap-3 pt-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => setBulkMessagingStep('config')}
                                        >
                                            חזור
                                        </Button>
                                        {!trackingUrl && (
                                            <Button
                                                onClick={sendBulkMessages}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                <Send className="w-4 h-4 mr-2" />
                                                שלח הודעות
                                            </Button>
                                        )}
                                        {trackingUrl && (
                                            <Button
                                                onClick={() => {
                                                    setShowBulkMessaging(false)
                                                    setBulkMessagingStep('config')
                                                    setRegistrationLink('')
                                                    setMessageContent('')
                                                    setFlowId('')
                                                    setMessagingMode('formal')
                                                    setIsSendingLink(false)
                                                    setTrackingUrl('')
                                                }}
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                סגור
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {bulkMessagingStep === 'sending' && (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">שולח הודעות...</h3>
                                    <p className="text-sm text-gray-600">
                                        נא להמתין בזמן שליחת ההודעות ל-{getUniquePhoneNumbers().length} מספרים
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <AppFooter />
        </div>
    )
}

export default App
