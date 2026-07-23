import { cloneElement, isValidElement, useId } from 'react';
import { Label } from './shadcn/label';
import { cn } from '@/lib/utils';

export default function FormField({
  label,
  htmlFor,
  hint,
  error,
  required = false,
  optional = false,
  className = '',
  children,
}) {
  const generatedId = useId();
  const fieldId = htmlFor || generatedId;

  const enhancedChild = label && isValidElement(children)
    ? cloneElement(children, { id: children.props.id || fieldId })
    : children;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={fieldId}>
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </Label>
          {optional && !required && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Opsional</span>
          )}
        </div>
      )}
      {enhancedChild}
      {error ? (
        <p className="text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs font-medium text-gray-400">{hint}</p>
      ) : null}
    </div>
  );
}
