import * as React from "react"
import { cn } from "@/lib/utils"

interface PopoverProps {
    children: React.ReactNode
    content: React.ReactNode
    className?: string
}

const Popover = React.forwardRef<HTMLDivElement, PopoverProps>(
    ({ children, content, className }, ref) => {
        const [isOpen, setIsOpen] = React.useState(false)

        return (
            <div
                ref={ref}
                className={cn("relative inline-block", className)}
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
            >
                {children}
                {isOpen && (
                    <div className="absolute z-50 mt-1 left-0 right-0">
                        <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 text-sm text-gray-700 max-w-xs">
                            {content}
                        </div>
                    </div>
                )}
            </div>
        )
    }
)

Popover.displayName = "Popover"

export { Popover }
