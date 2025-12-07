import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function CustomSelect({ options, value, onChange, placeholder = "Выберите...", className }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={ref} className={cn("relative", className)}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-left flex items-center justify-between",
                    "hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900",
                    "transition-all duration-150",
                    isOpen && "ring-2 ring-gray-900/10 border-gray-900"
                )}
            >
                <span className={cn(
                    "text-sm",
                    selectedOption ? "text-gray-900" : "text-gray-400"
                )}>
                    {selectedOption?.label || placeholder}
                </span>
                <ChevronDown
                    size={18}
                    className={cn(
                        "text-gray-400 transition-transform duration-200",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "w-full px-4 py-3 text-left text-sm flex items-center justify-between",
                                "hover:bg-gray-50 transition-colors",
                                option.value === value && "bg-gray-50 text-gray-900 font-medium",
                                option.value !== value && "text-gray-600"
                            )}
                        >
                            <span>{option.label}</span>
                            {option.value === value && (
                                <Check size={16} className="text-gray-900" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
