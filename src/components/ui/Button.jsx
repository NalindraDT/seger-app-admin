const variants = {
  primary: 'bg-[#5A2EFF] text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200/50',
  success: 'bg-[#10B981] text-white hover:bg-emerald-600 shadow-sm shadow-emerald-200/50',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-200/50',
  secondary: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
  ghost: 'text-gray-600 hover:bg-gray-100',
  accent: 'bg-[#E11D48] text-white hover:bg-[#BE123C] shadow-sm shadow-rose-200/50',
};

const sizes = {
  sm: 'px-3 py-2 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-5 py-3 text-sm rounded-xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  icon: Icon,
  children,
  disabled,
  ...props
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : Icon ? (
        <Icon className="h-4 w-4" />
      ) : null}
      {children}
    </button>
  );
}
