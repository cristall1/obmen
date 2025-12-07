import { cn } from '@/lib/utils';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className
}: SegmentedControlProps<T>) {
  return (
    <div className={cn('flex gap-2 bg-gray-100 p-1 rounded-lg', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded transition-colors',
            value === option.value
              ? 'accent-bg text-white'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
