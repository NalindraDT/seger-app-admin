import { cn } from '@/lib/utils';

export function ShadcnTextarea({ className, ...props }) {
  return (
    <textarea
      data-admin-input=""
      className={cn(
        'flex min-h-[80px] w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors',
        'placeholder:text-muted-foreground',
        'hover:border-gray-300',
        'focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}
