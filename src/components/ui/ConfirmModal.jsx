import { AlertTriangle } from 'lucide-react';
import Button from './Button';
import Modal from './Modal';

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  loading = false,
  variant = 'danger',
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={description}
      icon={AlertTriangle}
      size="sm"
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} className="flex-1" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="rounded-xl border border-red-100 bg-red-50/60 px-4 py-3 text-sm text-red-700">
        Tindakan ini tidak dapat dibatalkan setelah dikonfirmasi.
      </div>
    </Modal>
  );
}
