import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          className="sr-only peer"
          ref={ref}
          checked={checked}
          {...props}
        />
        <div
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded border-2 border-gray-300 transition-all",
            "peer-checked:border-[#4f60a8] peer-checked:bg-[#4f60a8]",
            "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-[#4f60a8] peer-focus-visible:ring-offset-2",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            "cursor-pointer select-none",
            checked && "border-[#4f60a8] bg-[#4f60a8]",
            className
          )}
        >
          <Check
            className={cn(
              "h-3.5 w-3.5 text-white transition-opacity",
              checked ? "opacity-100" : "opacity-0"
            )}
          />
        </div>
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }

