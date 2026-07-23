export default function CheckboxCard({ checked, onChange, label, description, className = '' }) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all ${
        checked
          ? 'border-[#5A2EFF] bg-indigo-50/70 shadow-sm shadow-indigo-100'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      } ${className}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#5A2EFF] focus:ring-[#5A2EFF]"
      />
      <span className="min-w-0">
        <span className={`block text-xs font-bold ${checked ? 'text-[#5A2EFF]' : 'text-gray-700'}`}>{label}</span>
        {description && <span className="mt-0.5 block text-[11px] text-gray-500">{description}</span>}
      </span>
    </label>
  );
}
