import { X } from 'lucide-react';

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  size = 'md',
  className = '',
  overlayClassName = '',
}) {
  if (!open) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
    full: 'max-w-5xl',
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center sm:p-4 ${overlayClassName}`}>
      <div className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-gray-100 bg-white shadow-2xl sm:rounded-2xl ${sizes[size]} ${className}`}>
        <div className="flex items-start justify-between border-b border-gray-100 bg-gradient-to-r from-[#F8F9FC] to-white px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50">
                <Icon className="h-5 w-5 text-[#5A2EFF]" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-extrabold text-gray-900">{title}</h2>
              {subtitle && <p className="mt-0.5 text-xs font-medium text-gray-500">{subtitle}</p>}
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="overflow-y-auto px-4 py-5 sm:px-6">{children}</div>

        {footer && (
          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50/80 px-4 py-4 sm:flex-row sm:px-6">{footer}</div>
        )}
      </div>
    </div>
  );
}
