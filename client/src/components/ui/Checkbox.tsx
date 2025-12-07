import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export function Checkbox({ id, checked, onChange, className, disabled }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      id={id}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
        'focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:outline-none',
        checked
          ? 'bg-black border-black'
          : 'bg-white border-gray-300 hover:border-gray-400',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {checked && <Check size={14} className="text-white" strokeWidth={3} />}
    </button>
  );
}
