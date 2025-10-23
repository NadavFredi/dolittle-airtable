import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface AutocompleteOption {
    label: string
    value: string
    disabled?: boolean
}

interface AutocompleteProps {
    options: AutocompleteOption[]
    value?: string
    onSelect?: (value: string) => void
    placeholder?: string
    emptyMessage?: string
    disabled?: boolean
    className?: string
    buttonClassName?: string
    searchPlaceholder?: string
    allowClear?: boolean
}

const Autocomplete = React.forwardRef<HTMLButtonElement, AutocompleteProps>(
    ({
        options,
        value,
        onSelect,
        placeholder = "Select option...",
        emptyMessage = "No option found.",
        disabled = false,
        className,
        buttonClassName,
        searchPlaceholder = "Search options...",
        allowClear = false,
        ...props
    }, ref) => {
        const [open, setOpen] = React.useState(false)
        const [searchValue, setSearchValue] = React.useState("")
        const autocompleteId = React.useId()

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
                        <span className="truncate">
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                        <div className="flex items-center gap-1">
                            {allowClear && selectedOption && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="h-4 w-4 opacity-50 hover:opacity-100 transition-opacity flex items-center justify-center"
                                >
                                    <X className="h-3 w-3" />
                                </button>
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
                                    <input
                                        type="text"
                                        placeholder={searchPlaceholder}
                                        value={searchValue}
                                        onChange={(e) => setSearchValue(e.target.value)}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
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
                                                    <span className="truncate">{option.label}</span>
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
