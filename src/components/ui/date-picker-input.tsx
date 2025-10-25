import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from "react"
import type { FocusEvent, InputHTMLAttributes } from "react"
import { format, isValid, parse, addDays, subDays } from "date-fns"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"

interface DatePickerInputProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
    value: Date | null
    onChange: (value: Date | null) => void
    displayFormat?: string
    wrapperClassName?: string
}

const DEFAULT_DISPLAY_FORMAT = "dd/MM/yyyy"
const INPUT_FORMATS = [
    "dd/MM/yyyy",
    "d/M/yyyy",
    "dd-MM-yyyy",
    "d-M-yyyy",
    "dd.MM.yyyy",
    "d.M.yyyy",
    "yyyy-MM-dd",
]

const normalizeDigits = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "")
    if (digitsOnly.length === 8) {
        return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4)}`
    }
    return value
}

const parseInputDate = (value: string): Date | null => {
    const trimmed = value.trim()
    if (!trimmed) {
        return null
    }

    for (const pattern of INPUT_FORMATS) {
        const parsed = parse(trimmed, pattern, new Date())
        if (isValid(parsed)) {
            return parsed
        }
    }

    const normalized = normalizeDigits(trimmed)
    if (normalized !== trimmed) {
        for (const pattern of INPUT_FORMATS) {
            const parsed = parse(normalized, pattern, new Date())
            if (isValid(parsed)) {
                return parsed
            }
        }
    }

    return null
}

export const DatePickerInput = forwardRef<HTMLInputElement, DatePickerInputProps>(
    (
        {
            value,
            onChange,
            displayFormat = DEFAULT_DISPLAY_FORMAT,
            className,
            wrapperClassName,
            onFocus,
            onBlur,
            ...rest
        },
        ref,
    ) => {
        const containerRef = useRef<HTMLDivElement | null>(null)
        const inputRef = useRef<HTMLInputElement | null>(null)
        const calendarContainerRef = useRef<HTMLDivElement | null>(null)
        const suppressNextFocusRef = useRef(false)
        const [open, setOpen] = useState(false)
        const [inputValue, setInputValue] = useState(() => (value ? format(value, displayFormat) : ""))

        useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

        useEffect(() => {
            setInputValue(value ? format(value, displayFormat) : "")
        }, [value, displayFormat])

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (!open) return
                const target = event.target as Node
                if (
                    containerRef.current &&
                    !containerRef.current.contains(target) &&
                    calendarContainerRef.current &&
                    !calendarContainerRef.current.contains(target)
                ) {
                    setOpen(false)
                    setInputValue(value ? format(value, displayFormat) : "")
                }
            }

            document.addEventListener("mousedown", handleClickOutside)
            return () => document.removeEventListener("mousedown", handleClickOutside)
        }, [open, value, displayFormat])

        const handleSelectDate = useCallback(
            (date: Date | undefined) => {
                if (!date) return
                onChange(date)
                setInputValue(format(date, displayFormat))
                setOpen(false)
                suppressNextFocusRef.current = true
                requestAnimationFrame(() => {
                    inputRef.current?.focus()
                })
            },
            [displayFormat, onChange],
        )

        const handleInputBlur = useCallback(
            (event: FocusEvent<HTMLInputElement>) => {
                const related = event.relatedTarget as HTMLElement | null
                if (
                    related &&
                    (containerRef.current?.contains(related) || calendarContainerRef.current?.contains(related))
                ) {
                    return
                }

                const parsed = parseInputDate(inputValue)
                if (parsed) {
                    onChange(parsed)
                    setInputValue(format(parsed, displayFormat))
                } else {
                    setInputValue(value ? format(value, displayFormat) : "")
                }

                setOpen(false)
            },
            [displayFormat, inputValue, onChange, value],
        )

        const calendarMonth = useMemo(() => {
            const parsed = parseInputDate(inputValue)
            if (parsed) return parsed
            return value ?? new Date()
        }, [inputValue, value])

        const handlePreviousDay = useCallback(() => {
            if (!value) return
            const previousDay = subDays(value, 1)
            onChange(previousDay)
            setInputValue(format(previousDay, displayFormat))
        }, [value, onChange, displayFormat])

        const handleNextDay = useCallback(() => {
            if (!value) return
            const nextDay = addDays(value, 1)
            onChange(nextDay)
            setInputValue(format(nextDay, displayFormat))
        }, [value, onChange, displayFormat])

        return (
            <div ref={containerRef} className={cn("relative", wrapperClassName)}>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    {/* Date Input */}
                    <div className="relative flex items-center flex-1">
                        <Input
                            ref={inputRef}
                            value={inputValue}
                            onChange={(event) => {
                                const raw = event.target.value
                                const sanitized = raw.replace(/[^\d./-]/g, "")
                                setInputValue(sanitized)
                            }}
                            onFocus={(event) => {
                                if (suppressNextFocusRef.current) {
                                    suppressNextFocusRef.current = false
                                } else {
                                    setOpen(true)
                                }
                                onFocus?.(event)
                            }}
                            onBlur={(event) => {
                                handleInputBlur(event)
                                onBlur?.(event)
                            }}
                            onClick={() => setOpen(true)}
                            placeholder={displayFormat.toLowerCase()}
                            className={cn("text-right", className, "pr-12 pl-3")}
                            {...rest}
                        />

                        {/* Calendar Button */}
                        <button
                            type="button"
                            className="absolute right-3 text-gray-500 hover:text-gray-700"
                            onClick={() => {
                                setOpen((prev) => !prev)
                                inputRef.current?.focus()
                            }}
                            tabIndex={-1}
                            aria-label="פתח לוח שנה"
                        >
                            <CalendarIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {open && (
                    <div
                        ref={calendarContainerRef}
                        className="absolute right-0 z-50 mt-2 w-[18rem] rounded-md border border-gray-200 bg-white shadow-lg"
                    >
                        <Calendar
                            key={calendarMonth.toISOString()}
                            mode="single"
                            selected={value ?? undefined}
                            onSelect={handleSelectDate}
                            defaultMonth={calendarMonth}
                            initialFocus
                        />
                    </div>
                )}
            </div>
        )
    },
)

DatePickerInput.displayName = "DatePickerInput"
