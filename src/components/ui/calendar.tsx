import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalendarProps {
    mode?: 'single'
    selected?: Date
    onSelect?: (date: Date | undefined) => void
    defaultMonth?: Date
    initialFocus?: boolean
    className?: string
}

const Calendar: React.FC<CalendarProps> = ({
    mode = 'single',
    selected,
    onSelect,
    defaultMonth = new Date(),
    initialFocus = false,
    className
}) => {
    const [currentMonth, setCurrentMonth] = React.useState(defaultMonth)

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDayOfWeek = firstDay.getDay()

        const days = []

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null)
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day))
        }

        return days
    }

    const handleDayClick = (day: Date) => {
        if (onSelect) {
            onSelect(day)
        }
    }

    const goToPreviousMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))
    }

    const goToNextMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))
    }

    const days = getDaysInMonth(currentMonth)
    const monthNames = [
        'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
        'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ]
    const dayNames = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']

    return (
        <div className={cn("p-3", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={goToPreviousMonth}
                    className="p-1 hover:bg-gray-100 rounded"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
                <div className="text-sm font-medium">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </div>
                <button
                    onClick={goToNextMonth}
                    className="p-1 hover:bg-gray-100 rounded"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                    <div key={day} className="text-center text-xs text-gray-500 p-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => (
                    <div key={index} className="text-center">
                        {day ? (
                            <button
                                onClick={() => handleDayClick(day)}
                                className={cn(
                                    "w-8 h-8 text-sm rounded hover:bg-gray-100",
                                    selected && day.toDateString() === selected.toDateString()
                                        ? "bg-blue-500 text-white hover:bg-blue-600"
                                        : "text-gray-700"
                                )}
                            >
                                {day.getDate()}
                            </button>
                        ) : (
                            <div className="w-8 h-8" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export { Calendar }
