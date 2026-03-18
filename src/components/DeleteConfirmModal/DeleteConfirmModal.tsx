import { TriangleAlert } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap.ts';
import './DeleteConfirmModal.css';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  taskTitle: string | undefined;
  loading: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteConfirmModal({ isOpen, taskTitle, onConfirm, onClose, loading, error }: DeleteConfirmModalProps) {
  const dialogRef = useFocusTrap<HTMLDivElement>(isOpen);

  if (!isOpen) return null;

  const handleOverlayKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="delete-modal__overlay"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={handleOverlayKeyDown}
    >
      <div ref={dialogRef} className="delete-modal" role="dialog" aria-modal="true">
        {/* Icono de advertencia */}
        <div className="delete-modal__icon">
          <TriangleAlert size={28} />
        </div>

        {/* Contenido */}
        <div className="delete-modal__body">
          <h2 className="delete-modal__title">¿Eliminar tarea?</h2>
          <p className="delete-modal__message">
            Vas a eliminar{' '}
            <strong className="delete-modal__task-name">
              {taskTitle ?? 'esta tarea'}
            </strong>
            . Esta acción no se puede deshacer.
          </p>
          {error && <p className="delete-modal__error">{error}</p>}
        </div>

        {/* Acciones */}
        <div className="delete-modal__actions">
          <button
            type="button"
            className="delete-modal__btn delete-modal__btn--cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="delete-modal__btn delete-modal__btn--confirm"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Eliminando…' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
