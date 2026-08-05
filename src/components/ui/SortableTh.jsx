import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const alignClass = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

const justifyClass = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
};

export default function SortableTh({
  label,
  sortKey,
  activeKey,
  direction = 'asc',
  onSort,
  className = '',
  align = 'left',
  sortable = true,
}) {
  if (!sortable || !sortKey || !onSort) {
    return (
      <th className={cn('px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider', alignClass[align], className)}>
        {label}
      </th>
    );
  }

  const active = activeKey === sortKey;
  const Icon = !active ? ArrowUpDown : direction === 'asc' ? ArrowUp : ArrowDown;

  return (
    <th className={cn('px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider', alignClass[align], className)}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          'inline-flex w-full items-center gap-1.5 font-semibold uppercase tracking-wider transition-colors hover:text-[#5A2EFF]',
          justifyClass[align],
          active ? 'text-[#5A2EFF]' : 'text-gray-500'
        )}
      >
        <span>{label}</span>
        <Icon className={cn('h-3.5 w-3.5 shrink-0', active ? 'opacity-100' : 'opacity-40')} />
      </button>
    </th>
  );
}
