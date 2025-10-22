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
                    "flex h-8 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                value={value}
                onChange={(e) => onValueChange?.(e.target.value)}
                {...props}
            >
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <ChevronDown className="absolute left-2 top-2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
    )
)
Select.displayName = "Select"

export { Select }