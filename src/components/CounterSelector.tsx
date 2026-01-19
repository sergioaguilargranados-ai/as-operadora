"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Minus, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"

interface CounterSelectorProps {
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
    label?: string
    sublabel?: string
    showQuickButtons?: boolean
}

export function CounterSelector({
    value,
    onChange,
    min = 1,
    max = 20,
    label,
    sublabel,
    showQuickButtons = false
}: CounterSelectorProps) {
    const [localValue, setLocalValue] = useState(value.toString())

    useEffect(() => {
        // Only update local state if the prop value is different from parsed local value
        // This prevents overwriting partial inputs (like "") if the parent re-renders for other reasons
        const parsedLocal = parseInt(localValue)
        if (parsedLocal !== value) {
            setLocalValue(value.toString())
        }
    }, [value])

    const handleIncrement = () => {
        if (value < max) {
            onChange(value + 1)
        }
    }

    const handleDecrement = () => {
        if (value > min) {
            onChange(value - 1)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value
        setLocalValue(newVal)

        if (newVal === "") return

        // Only allow numbers
        if (!/^\d*$/.test(newVal)) return

        const numVal = parseInt(newVal)

        if (!isNaN(numVal)) {
            // We allow intermediate values, but only trigger change if valid
            if (numVal >= min && numVal <= max) {
                onChange(numVal)
            }
        }
    }

    const handleBlur = () => {
        let numVal = parseInt(localValue)
        if (isNaN(numVal) || numVal < min) numVal = min
        if (numVal > max) numVal = max

        setLocalValue(numVal.toString())
        onChange(numVal)
    }

    const quickOptions = [1, 2, 5, 10, 15, 20]

    return (
        <div className="w-full">
            {(label || sublabel) && (
                <div className="mb-2">
                    {label && <div className="text-sm font-medium text-gray-900">{label}</div>}
                    {sublabel && <div className="text-xs text-muted-foreground">{sublabel}</div>}
                </div>
            )}

            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    onClick={handleDecrement}
                    disabled={value <= min}
                    type="button"
                >
                    <Minus className="h-4 w-4" />
                </Button>

                <div className="flex-1 relative">
                    <Input
                        type="text"
                        inputMode="numeric"
                        value={localValue}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        onFocus={(e) => e.target.select()}
                        className="text-center h-10 font-bold text-gray-900 bg-white"
                    />
                </div>

                <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    onClick={handleIncrement}
                    disabled={value >= max}
                    type="button"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            {showQuickButtons && (
                <div className="flex bg-gray-100 rounded-md p-1 mt-2 gap-1 justify-between overflow-x-auto">
                    {quickOptions.map((opt) => (
                        opt <= max && opt >= min && (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => onChange(opt)}
                                className={`text-xs py-1 px-2 rounded-sm transition-colors flex-1 min-w-[24px] ${value === opt
                                    ? "bg-white text-primary font-bold shadow-sm"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-200"
                                    }`}
                            >
                                {opt}
                            </button>
                        )
                    ))}
                </div>
            )}
        </div>
    )
}
