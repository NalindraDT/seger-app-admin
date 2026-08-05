import { TABLE_PAGE_SIZE_OPTIONS } from '../../constants/tablePagination';

/**
 * Dropdown to change how many rows a table shows per page.
 */
export default function PageSizeSelect({
  value,
  onChange,
  options = TABLE_PAGE_SIZE_OPTIONS,
  className = '',
}) {
  return (
    <label className={`inline-flex items-center gap-2 text-sm text-gray-500 font-medium ${className}`}>
      <span className="whitespace-nowrap">Tampilkan</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8 rounded-md border border-gray-200 bg-white px-2 text-sm font-bold text-gray-700 outline-none focus:border-[#5A2EFF] focus:ring-1 focus:ring-[#5A2EFF]"
      >
        {options.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      <span className="whitespace-nowrap">baris</span>
    </label>
  );
}
