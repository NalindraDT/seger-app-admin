import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { ShadcnInput } from './shadcn/input';
import { cn } from '@/lib/utils';

const ICON_SLOT = 'w-11';

export default function Input({
  icon: Icon,
  suffix,
  type = 'text',
  error,
  className = '',
  inputClassName = '',
  id,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const resolvedType = isPassword && showPassword ? 'text' : type;
  const hasLeftIcon = Boolean(Icon);
  const hasRightAdornment = isPassword || Boolean(suffix);

  return (
    <div className={cn('relative', className)}>
      {hasLeftIcon && (
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center justify-center text-muted-foreground',
            ICON_SLOT
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
        </span>
      )}

      <ShadcnInput
        id={id}
        type={resolvedType}
        data-has-left-icon={hasLeftIcon ? 'true' : undefined}
        data-has-right-adornment={hasRightAdornment ? 'true' : undefined}
        className={cn(
          inputClassName,
          hasLeftIcon && 'pl-11',
          hasRightAdornment && 'pr-11',
          hasLeftIcon && inputClassName?.includes('text-center') && 'text-left',
          error && 'border-red-300 focus-visible:border-red-500 focus-visible:ring-red-500/15'
        )}
        {...props}
      />

      {suffix && !isPassword && (
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center justify-center text-xs font-bold text-muted-foreground',
            ICON_SLOT
          )}
        >
          {suffix}
        </span>
      )}

      {isPassword && (
        <button
          type="button"
          tabIndex={-1}
          aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
          onClick={() => setShowPassword((prev) => !prev)}
          className={cn(
            'absolute inset-y-0 right-0 z-10 flex items-center justify-center text-muted-foreground transition-colors hover:text-primary',
            ICON_SLOT
          )}
        >
          {showPassword ? <EyeOff className="h-4 w-4 shrink-0" /> : <Eye className="h-4 w-4 shrink-0" />}
        </button>
      )}
    </div>
  );
}
