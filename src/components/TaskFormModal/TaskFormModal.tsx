import { useReducer } from 'react';
import { TASK_STATUSES } from '../../types';
import type { TaskStatus, FormMode, TaskFormInitialData, TaskPayload } from '../../types';
import { useFocusTrap } from '../../hooks/useFocusTrap.ts';
import './TaskFormModal.css';

const TITLE_MAX = 100;
const DESC_MAX  = 200;

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending:   'Pendiente',
  progress:  'En progreso',
  completed: 'Completado',
};

/* ─── Estado del formulario con useReducer ───────────────────────────────────── */
interface FormErrors {
  title?: string;
  description?: string;
  api?: string;
}

interface FormState {
  title: string;
  description: string;
  status: TaskStatus;
  errors: FormErrors;
  loading: boolean;
}

type FormAction =
  | { type: 'SET_TITLE'; value: string }
  | { type: 'SET_DESCRIPTION'; value: string }
  | { type: 'SET_STATUS'; value: TaskStatus }
  | { type: 'SET_ERRORS'; errors: FormErrors }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'CLEAR_FIELD_ERROR'; field: 'title' | 'description' };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_TITLE':
      return { ...state, title: action.value };
    case 'SET_DESCRIPTION':
      return { ...state, description: action.value };
    case 'SET_STATUS':
      return { ...state, status: action.value };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'CLEAR_FIELD_ERROR':
      return { ...state, errors: { ...state.errors, [action.field]: undefined } };
  }
}

/* ─── Validación local — mismas reglas que el backend ───────────────────────── */
function validate({ title, description }: { title: string; description: string }): FormErrors {
  const errors: FormErrors = {};
  if (!title.trim())
    errors.title = 'El título es obligatorio';
  else if (title.trim().length > TITLE_MAX)
    errors.title = `Máximo ${TITLE_MAX} caracteres`;

  if (description && description.trim().length > DESC_MAX)
    errors.description = `Máximo ${DESC_MAX} caracteres`;

  return errors;
}

interface TaskFormModalProps {
  isOpen: boolean;
  mode: FormMode;
  initialData: TaskFormInitialData | null;
  targetStatus: TaskStatus;
  onSubmit: (payload: TaskPayload) => Promise<void>;
  onClose: () => void;
}

export function TaskFormModal({ isOpen, mode, initialData, targetStatus, onSubmit, onClose }: TaskFormModalProps) {
  const dialogRef = useFocusTrap<HTMLDivElement>(isOpen);

  const [state, dispatch] = useReducer(formReducer, {
    title:       initialData?.title ?? '',
    description: initialData?.description ?? '',
    status:      initialData?.status ?? targetStatus,
    errors:      {},
    loading:     false,
  });

  if (!isOpen) return null;

  const handleOverlayKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') onClose();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = validate({ title: state.title, description: state.description });
    if (Object.keys(errs).length) { dispatch({ type: 'SET_ERRORS', errors: errs }); return; }

    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      await onSubmit({
        title: state.title.trim(),
        description: state.description.trim() || null,
        status: state.status,
      });
      onClose();
    } catch (err) {
      const apiErr = err as { details?: string[] };
      dispatch({
        type: 'SET_ERRORS',
        errors: { api: apiErr?.details?.join(' · ') ?? 'Ocurrió un error. Intenta de nuevo.' },
      });
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  };

  const isEditing = mode === 'edit';
  const { title, description, status, errors, loading } = state;

  return (
    <div
      className="task-form-modal__overlay"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={handleOverlayKeyDown}
    >
      <div ref={dialogRef} className="task-form-modal" role="dialog" aria-modal="true">
        {/* Cabecera */}
        <div className="task-form-modal__header">
          <h2 className="task-form-modal__title">
            {isEditing ? 'Editar tarea' : 'Nueva tarea'}
          </h2>
          <button
            className="task-form-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
            data-tooltip="Cerrar (Esc)"
            data-tooltip-pos="bottom"
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form className="task-form-modal__form" onSubmit={handleSubmit} noValidate>
          {errors.api && (
            <div className="task-form-modal__api-error">{errors.api}</div>
          )}

          {/* Campo título — autoFocus reemplaza el setTimeout + ref */}
          <div className="task-form-modal__field">
            <label className="task-form-modal__label" htmlFor="task-title">
              Título <span className="task-form-modal__required">*</span>
            </label>
            <input
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              id="task-title"
              className={`task-form-modal__input${errors.title ? ' task-form-modal__input--error' : ''}`}
              type="text"
              placeholder="Escribe un título para la tarea"
              value={title}
              maxLength={TITLE_MAX}
              onChange={(e) => {
                dispatch({ type: 'SET_TITLE', value: e.target.value });
                dispatch({ type: 'CLEAR_FIELD_ERROR', field: 'title' });
              }}
            />
            <div className="task-form-modal__field-footer">
              {errors.title
                ? <span className="task-form-modal__error-msg">{errors.title}</span>
                : <span />
              }
              <span
                className={`task-form-modal__counter${title.length >= TITLE_MAX ? ' task-form-modal__counter--limit' : ''}`}
                data-tooltip={title.length >= TITLE_MAX ? 'Límite alcanzado' : `Quedan ${TITLE_MAX - title.length} caracteres`}
              >
                {title.length}/{TITLE_MAX}
              </span>
            </div>
          </div>

          {/* Campo descripción */}
          <div className="task-form-modal__field">
            <label className="task-form-modal__label" htmlFor="task-desc">
              Descripción <span className="task-form-modal__optional">(opcional)</span>
            </label>
            <textarea
              id="task-desc"
              className={`task-form-modal__textarea${errors.description ? ' task-form-modal__textarea--error' : ''}`}
              placeholder="Agrega detalles sobre la tarea..."
              value={description}
              maxLength={DESC_MAX}
              rows={4}
              onChange={(e) => {
                dispatch({ type: 'SET_DESCRIPTION', value: e.target.value });
                dispatch({ type: 'CLEAR_FIELD_ERROR', field: 'description' });
              }}
            />
            <div className="task-form-modal__field-footer">
              {errors.description
                ? <span className="task-form-modal__error-msg">{errors.description}</span>
                : <span />
              }
              <span
                className={`task-form-modal__counter${description.length >= DESC_MAX ? ' task-form-modal__counter--limit' : ''}`}
                data-tooltip={description.length >= DESC_MAX ? 'Límite alcanzado' : `Quedan ${DESC_MAX - description.length} caracteres`}
              >
                {description.length}/{DESC_MAX}
              </span>
            </div>
          </div>

          {/* Selector de estado */}
          <div className="task-form-modal__field">
            <span className="task-form-modal__label">Estado</span>
            <div className="task-form-modal__status-group" role="group" aria-label="Estado de la tarea">
              {TASK_STATUSES.map((s) => (
                <label
                  key={s}
                  className={`task-form-modal__status-option${status === s ? ' task-form-modal__status-option--active' : ''}`}
                  data-status={s}
                  data-tooltip={STATUS_LABELS[s]}
                  data-tooltip-pos="bottom"
                >
                  <input
                    type="radio"
                    name="task-status"
                    value={s}
                    checked={status === s}
                    onChange={() => dispatch({ type: 'SET_STATUS', value: s })}
                    className="visually-hidden"
                  />
                  <span className="task-form-modal__status-dot" aria-hidden="true" />
                  {STATUS_LABELS[s]}
                </label>
              ))}
            </div>
          </div>

          {/* Acciones */}
          <div className="task-form-modal__actions">
            <button
              type="button"
              className="task-form-modal__btn task-form-modal__btn--cancel"
              onClick={onClose}
              disabled={loading}
              data-tooltip="Descartar cambios y cerrar"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="task-form-modal__btn task-form-modal__btn--submit"
              disabled={loading}
              data-tooltip={isEditing ? 'Guardar los cambios realizados' : 'Crear la tarea y agregarla al tablero'}
            >
              {loading ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
