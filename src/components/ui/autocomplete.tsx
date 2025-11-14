import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface AutocompleteOption {
    label: string
    value: string
    disabled?: boolean
}

// Component to handle truncated text with hover tooltip
const TruncatedText = ({ text, className }: { text: string; className?: string }) => {
    const [isTruncated, setIsTruncated] = React.useState(false)
    const [showTooltip, setShowTooltip] = React.useState(false)
    const [tooltipPosition, setTooltipPosition] = React.useState({ x: 0, y: 0 })
    const textRef = React.useRef<HTMLSpanElement>(null)

    React.useEffect(() => {
        const checkTruncation = () => {
            if (textRef.current) {
                setIsTruncated(textRef.current.scrollWidth > textRef.current.clientWidth)
            }
        }

        checkTruncation()
        window.addEventListener('resize', checkTruncation)
        return () => window.removeEventListener('resize', checkTruncation)
    }, [text])

    const handleMouseEnter = (e: React.MouseEvent) => {
        if (isTruncated) {
            const rect = textRef.current?.getBoundingClientRect()
            if (rect) {
                setTooltipPosition({
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10
                })
                setShowTooltip(true)
            }
        }
    }

    const handleMouseLeave = () => {
        setShowTooltip(false)
    }

    return (
        <>
            <span
                ref={textRef}
                className={cn("truncate", isTruncated && "cursor-help", className)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {text}
            </span>

            {showTooltip && isTruncated && (
                <div
                    className="fixed z-[9999] pointer-events-none"
                    style={{
                        left: `${tooltipPosition.x}px`,
                        top: `${tooltipPosition.y}px`,
                        transform: 'translateX(-50%) translateY(-100%)'
                    }}
                >
                    <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-md shadow-lg max-w-md whitespace-normal break-words">
                        {text}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                </div>
            )}
        </>
    )
}

interface AutocompleteProps {
    options: AutocompleteOption[]
    value?: string
    onSelect?: (value: string) => void
    onSearch?: (search: string) => void
    placeholder?: string
    emptyMessage?: string
    disabled?: boolean
    className?: string
    buttonClassName?: string
    searchPlaceholder?: string
    allowClear?: boolean
    loading?: boolean
}

const Autocomplete = React.forwardRef<HTMLButtonElement, AutocompleteProps>(
    ({
        options,
        value,
        onSelect,
        onSearch,
        placeholder = "Select option...",
        emptyMessage = "No option found.",
        disabled = false,
        className,
        buttonClassName,
        searchPlaceholder = "Search options...",
        allowClear = false,
        loading = false,
        ...props
    }, ref) => {
        const [open, setOpen] = React.useState(false)
        const [searchValue, setSearchValue] = React.useState("")
        const autocompleteId = React.useId()
        const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
        const lastSearchedValueRef = React.useRef<string>("")
        const isInitialOpenRef = React.useRef<boolean>(false)
        
        // Track when popup opens to prevent API call on initial open
        React.useEffect(() => {
            if (open) {
                isInitialOpenRef.current = true
                // Reset after a short delay to allow user to start typing
                const timer = setTimeout(() => {
                    isInitialOpenRef.current = false
                }, 100)
                return () => clearTimeout(timer)
            } else {
                isInitialOpenRef.current = false
                lastSearchedValueRef.current = ""
            }
        }, [open])
        
        // Debounced search - only call onSearch after user stops typing
        React.useEffect(() => {
            // Clear any existing timeout
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current)
            }
            
            // Only call onSearch if:
            // 1. Popup is open
            // 2. onSearch is provided
            // 3. User has typed something (not empty)
            // 4. Not the initial open
            // 5. Value has actually changed from last search
            if (onSearch && open && searchValue.trim().length > 0 && !isInitialOpenRef.current && searchValue !== lastSearchedValueRef.current) {
                // Set debounce timeout - only call API after user stops typing for 300ms
                debounceTimeoutRef.current = setTimeout(() => {
                    lastSearchedValueRef.current = searchValue
                    onSearch(searchValue)
                }, 300)
            }
            
            // Cleanup timeout on unmount or when dependencies change
            return () => {
                if (debounceTimeoutRef.current) {
                    clearTimeout(debounceTimeoutRef.current)
                }
            }
        }, [searchValue, onSearch, open])

        const selectedOption = options.find((option) => option.value === value)

        // Clear search when popup closes
        React.useEffect(() => {
            if (!open) {
                setSearchValue("")
            }
        }, [open])

        // Handle click outside to close popup
        React.useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                const target = event.target as Element
                const clickedAutocomplete = target.closest('[data-autocomplete]')
                const thisAutocomplete = document.querySelector(`[data-autocomplete-id="${autocompleteId}"]`)

                // Close if clicking outside any autocomplete or on a different autocomplete
                if (open && (!clickedAutocomplete || clickedAutocomplete !== thisAutocomplete)) {
                    setOpen(false)
                }
            }

            document.addEventListener('mousedown', handleClickOutside)
            return () => {
                document.removeEventListener('mousedown', handleClickOutside)
            }
        }, [open, autocompleteId])

        const handleSelect = (selectedValue: string) => {
            if (selectedValue === value && allowClear) {
                onSelect?.("")
            } else {
                onSelect?.(selectedValue)
            }
            setOpen(false)
        }

        const handleClear = (e: React.MouseEvent) => {
            e.stopPropagation()
            onSelect?.("")
        }

        return (
            <div className={cn("relative", className)} data-autocomplete data-autocomplete-id={autocompleteId}>
                <div className="relative">
                    <Button
                        ref={ref}
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        disabled={disabled}
                        onClick={() => setOpen(!open)}
                        className={cn(
                            "w-full justify-between h-9 px-3 py-2 text-sm",
                            !selectedOption && "text-muted-foreground",
                            buttonClassName
                        )}
                        {...props}
                    >
                        <TruncatedText
                            text={selectedOption ? selectedOption.label : placeholder}
                            className="text-left"
                        />
                        <div className="flex items-center gap-1">
                            {allowClear && selectedOption && (
                                <div
                                    onClick={handleClear}
                                    className="h-4 w-4 opacity-50 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault()
                                            handleClear(e as any)
                                        }
                                    }}
                                >
                                    <X className="h-3 w-3" />
                                </div>
                            )}
                            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                        </div>
                    </Button>

                    {open && (
                        <div className="absolute top-full left-0 right-0 mt-1 z-50">
                            <div
                                className="max-h-[300px] rounded-md border border-gray-200 bg-white shadow-lg"
                                onMouseDown={(e) => e.preventDefault()}
                                onPointerDown={(e) => e.preventDefault()}
                            >
                                <div className="p-2 border-b border-gray-100">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder={searchPlaceholder}
                                            value={searchValue}
                                            onChange={(e) => setSearchValue(e.target.value)}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onPointerDown={(e) => e.stopPropagation()}
                                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-6"
                                        />
                                        {loading && (
                                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="max-h-[250px] overflow-y-auto">
                                    {options
                                        .filter(option =>
                                            !searchValue || option.label.toLowerCase().includes(searchValue.toLowerCase())
                                        )
                                        .length === 0 ? (
                                        <div className="py-2 text-center text-sm text-gray-500">{emptyMessage}</div>
                                    ) : (
                                        options
                                            .filter(option =>
                                                !searchValue || option.label.toLowerCase().includes(searchValue.toLowerCase())
                                            )
                                            .map((option) => (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    disabled={option.disabled}
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onPointerDown={(e) => e.preventDefault()}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleSelect(option.value);
                                                    }}
                                                    className="w-full flex items-center justify-between cursor-pointer hover:bg-gray-100 px-3 py-2 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <TruncatedText text={option.label} />
                                                    <Check
                                                        className={cn(
                                                            "h-4 w-4",
                                                            value === option.value ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                </button>
                                            ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }
)

Autocomplete.displayName = "Autocomplete"

export { Autocomplete, type AutocompleteProps }
