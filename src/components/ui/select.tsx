import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    placeholder?: string
    options: { value: string; label: string }[]
    value?: string
    onValueChange?: (value: string) => void
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, children, placeholder, options, value, onValueChange, ...props }, ref) => (
        <div className="relative">
            <select
                className={cn(
                    "flex h-9 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-200",
                    className
                )}
                ref={ref}
                value={value}
                onChange={(e) => onValueChange?.(e.target.value)}
                {...props}
            >
                {placeholder && (
                    <option value="" disabled className="text-gray-500">
                        {placeholder}
                    </option>
                )}
                {options.map((option) => (
                    <option key={option.value} value={option.value} className="text-gray-700">
                        {option.label}
                    </option>
                ))}
            </select>
            <ChevronDown className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
    )
)
Select.displayName = "Select"

export { Select }