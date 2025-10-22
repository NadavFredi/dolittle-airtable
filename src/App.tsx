import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronLeft, Filter, ArrowUpDown, Search, MoreHorizontal, Zap, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Mock data for demonstration - replace with actual API call
    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
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
                },
                {
                    id: '4',
                    childName: 'נועה כהן',
                    cycle: 'רוניקה א-ב - ראשון - 16:15',
                    parentPhone: '0505518588',
                    parentName: 'שרה כהן',
                    course: 'אלקטרוניקה',
                    school: 'גורדון',
                    class: 'ב',
                    needsPickup: true,
                    trialDate: '14/9/2025',
                    inWhatsAppGroup: true,
                    registrationStatus: 'מאושר'
                },
                {
                    id: '5',
                    childName: 'דוד לוי',
                    cycle: 'רוניקה א-ב - ראשון - 16:15',
                    parentPhone: '0505518589',
                    parentName: 'מיכאל לוי',
                    course: 'אלקטרוניקה',
                    school: 'גורדון',
                    class: 'א',
                    needsPickup: true,
                    trialDate: '14/9/2025',
                    inWhatsAppGroup: true,
                    registrationStatus: 'מאושר'
                },
                {
                    id: '6',
                    childName: 'מיכל אברהם',
                    cycle: 'רוניקה א-ב - ראשון - 16:15',
                    parentPhone: '0505518590',
                    parentName: 'רחל אברהם',
                    course: 'אלקטרוניקה',
                    school: 'גורדון',
                    class: 'ב',
                    needsPickup: true,
                    trialDate: '14/9/2025',
                    inWhatsAppGroup: false,
                    registrationStatus: 'מאושר'
                },
                {
                    id: '7',
                    childName: 'יונתן ישראלי',
                    cycle: 'רוניקה א-ב - ראשון - 16:15',
                    parentPhone: '0505518591',
                    parentName: 'דני ישראלי',
                    course: 'אלקטרוניקה',
                    school: 'גורדון',
                    class: 'א',
                    needsPickup: true,
                    trialDate: '14/9/2025',
                    inWhatsAppGroup: true,
                    registrationStatus: 'מאושר'
                },
                {
                    id: '8',
                    childName: 'שירה רוזן',
                    cycle: 'רוניקה א-ב - ראשון - 16:15',
                    parentPhone: '0505518592',
                    parentName: 'ענת רוזן',
                    course: 'אלקטרוניקה',
                    school: 'גורדון',
                    class: 'ב',
                    needsPickup: true,
                    trialDate: '14/9/2025',
                    inWhatsAppGroup: true,
                    registrationStatus: 'מאושר'
                }
            ])
            setLoading(false)
        }, 1000)
    }, [])

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

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-destructive mb-4">שגיאה בטעינת הנתונים: {error}</p>
                    <Button onClick={() => window.location.reload()}>נסה שוב</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="border-b bg-white shadow-sm">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-semibold">הרשמות לפי קבוצות - 2</h1>
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
            <div className="border-b bg-white px-6 py-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" className="flex items-center gap-2">
                        בית ספר
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                        מחזור
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                        חוג
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                        כיתה
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                        האם צריך איסוף מהצהרון
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                        האם בקבוצת הוואטסאפ
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                        סטטוס רישום לחוג
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Grouping Section */}
            <div className="bg-white px-6 py-4 border-b">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">חוג</span>
                        <ChevronDown className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-md">
                        <Zap className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium">אלקטרוניקה</span>
                        <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">52</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">מחזור</span>
                        <ChevronDown className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-md">
                        <span className="text-sm">גורדון - אלקטרוניקה - א-ב - אלקטרוניקה א-ב - ראשון - 16:15</span>
                        <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">21</span>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white">
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
                            {registrations.map((registration, index) => (
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
    )
}

export default App
