import { UploadCloud } from 'lucide-react';

export default function FileUpload({
  label = 'Upload file',
  hint,
  accept,
  preview,
  onChange,
  required = false,
  className = '',
}) {
  return (
    <label
      className={`group relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-[#F8F9FC] p-6 transition-all hover:border-[#5A2EFF] hover:bg-indigo-50/30 ${className}`}
    >
      {preview ? (
        <>
          <img src={preview} alt="Preview" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
            <UploadCloud className="mb-2 h-8 w-8 text-white" />
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
              Ganti file
            </span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
            <UploadCloud className="h-6 w-6 text-[#5A2EFF]" />
          </div>
          <p className="text-sm font-bold text-gray-800">{label}</p>
          {hint && <p className="mt-1 max-w-[220px] text-xs text-gray-500">{hint}</p>}
        </div>
      )}
      <input type="file" accept={accept} required={required} onChange={onChange} className="absolute inset-0 cursor-pointer opacity-0" />
    </label>
  );
}
