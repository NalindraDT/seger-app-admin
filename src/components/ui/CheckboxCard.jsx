export default function CheckboxCard({ checked, onChange, label, description, disabled = false, className = '' }) {
  const stateClasses = disabled
    ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-70'
    : checked
      ? 'cursor-pointer border-[#5A2EFF] bg-indigo-50/70 shadow-sm shadow-indigo-100'
      : 'cursor-pointer border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50';

  return (
    <label className={`flex items-start gap-3 rounded-xl border p-3 transition-all ${stateClasses} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#5A2EFF] focus:ring-[#5A2EFF]"
      />
      <span className="min-w-0">
        <span className={`block text-xs font-bold ${!disabled && checked ? 'text-[#5A2EFF]' : 'text-gray-700'}`}>{label}</span>
        {description && <span className="mt-0.5 block text-[11px] text-gray-500">{description}</span>}
      </span>
    </label>
  );
}
