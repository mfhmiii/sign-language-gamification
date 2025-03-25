"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Eye, EyeOff } from "lucide-react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  rightIcon?: React.ReactNode
  showPasswordToggle?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, rightIcon, showPasswordToggle = false, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const inputType = showPassword ? "text" : type

    return (
      <div
        className={cn(
          "relative flex items-center w-full rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:border-primary",
          className,
        )}
      >
        {icon && <div className="flex items-center justify-center pl-3 text-muted-foreground">{icon}</div>}
        <input
          type={inputType}
          className={cn(
            "flex h-10 w-full rounded-md bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            icon && "pl-1",
            (rightIcon || showPasswordToggle) && "pr-10",
          )}
          ref={ref}
          {...props}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-green-500 focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
        {rightIcon && !showPasswordToggle && <div className="absolute right-3 text-muted-foreground">{rightIcon}</div>}
      </div>
    )
  },
)

Input.displayName = "Input"

export { Input }

