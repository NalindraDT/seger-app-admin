import { CheckCircle2, XCircle, X } from 'lucide-react';

export default function Toast({ message, onClose, type = 'success' }) {
  if (!message) return null;

  const isError = type === 'error';
  const styles = isError
    ? 'border-red-100 bg-white text-red-700'
    : 'border-green-100 bg-white text-green-700';
  const Icon = isError ? XCircle : CheckCircle2;

  return (
    <div className="fixed top-4 inset-x-4 z-[100] animate-in fade-in slide-in-from-top-4 duration-300 sm:inset-x-auto sm:right-8 sm:top-8 sm:slide-in-from-right-8">
      <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 pr-3 shadow-xl ${styles}`}>
        <Icon className={`h-5 w-5 shrink-0 ${isError ? 'text-red-500' : 'text-[#10B981]'}`} />
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-gray-900">{isError ? 'Gagal' : 'Berhasil'}</p>
          <p className="text-xs font-medium text-gray-500">{message}</p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="ml-2 rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
