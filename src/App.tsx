import { useReducer, useEffect, useCallback, useMemo, useState } from 'react';
import { DndContext, DragOverlay, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { TASK_STATUSES } from './types';
import type { Task, TaskStatus, FormMode, TaskFormInitialData, TaskPayload } from './types';
import { Sidebar } from './components/Sidebar/Sidebar.tsx';
import { TaskCard } from './components/TaskCard/TaskCard.tsx';
import { TaskColumn } from './components/TaskColumn/TaskColumn.tsx';
import { TaskFormModal } from './components/TaskFormModal/TaskFormModal.tsx';
import { DeleteConfirmModal } from './components/DeleteConfirmModal/DeleteConfirmModal.tsx';
import { getTasks, createTask, updateTask, deleteTask } from './services/api.ts';
import './App.css';

/* ─── Estado de datos con useReducer ─────────────────────────────────────────── */
interface DataState {
  tasks: Task[];
  loading: boolean;
  globalError: string | null;
}

type DataAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; tasks: Task[] }
  | { type: 'FETCH_ERROR'; message: string }
  | { type: 'ADD_TASK'; task: Task }
  | { type: 'UPDATE_TASK'; task: Task }
  | { type: 'DELETE_TASK'; id: string };

export function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, globalError: null };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, tasks: action.tasks };
    case 'FETCH_ERROR':
      return { ...state, loading: false, globalError: action.message };
    case 'ADD_TASK':
      return { ...state, tasks: [action.task, ...state.tasks] };
    case 'UPDATE_TASK':
      return { ...state, tasks: state.tasks.map((t) => (t.id === action.task.id ? action.task : t)) };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };
  }
}

export const initialDataState: DataState = { tasks: [], loading: true, globalError: null };

/* ─── Estado de los modales ──────────────────────────────────────────────────── */
interface FormModalState {
  isOpen: boolean;
  mode: FormMode;
  initialData: TaskFormInitialData | null;
  targetStatus: TaskStatus;
}

interface DeleteModalState {
  isOpen: boolean;
  task: Task | null;
  loading: boolean;
  error: string | null;
}

const initialFormModal: FormModalState    = { isOpen: false, mode: 'create', initialData: null, targetStatus: 'pending' };
const initialDeleteModal: DeleteModalState = { isOpen: false, task: null, loading: false, error: null };

type ModalAction =
  | { type: 'OPEN_CREATE'; status: TaskStatus }
  | { type: 'OPEN_EDIT'; task: Task }
  | { type: 'CLOSE_FORM' }
  | { type: 'OPEN_DELETE'; task: Task }
  | { type: 'DELETE_LOADING' }
  | { type: 'DELETE_ERROR'; message: string }
  | { type: 'CLOSE_DELETE' };

interface ModalState {
  form: FormModalState;
  deleteConfirm: DeleteModalState;
}

export function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'OPEN_CREATE':
      return { ...state, form: { isOpen: true, mode: 'create', initialData: null, targetStatus: action.status } };
    case 'OPEN_EDIT':
      return {
        ...state,
        form: {
          isOpen: true,
          mode: 'edit',
          initialData: { id: action.task.id, title: action.task.title, description: action.task.description, status: action.task.status },
          targetStatus: action.task.status,
        },
      };
    case 'CLOSE_FORM':
      return { ...state, form: { ...state.form, isOpen: false } };
    case 'OPEN_DELETE':
      return { ...state, deleteConfirm: { isOpen: true, task: action.task, loading: false, error: null } };
    case 'DELETE_LOADING':
      return { ...state, deleteConfirm: { ...state.deleteConfirm, loading: true, error: null } };
    case 'DELETE_ERROR':
      return { ...state, deleteConfirm: { ...state.deleteConfirm, loading: false, error: action.message } };
    case 'CLOSE_DELETE':
      return { ...state, deleteConfirm: initialDeleteModal };
  }
}

export const initialModalState: ModalState = { form: initialFormModal, deleteConfirm: initialDeleteModal };

/* ─── Componente ─────────────────────────────────────────────────────────────── */
export default function App() {
  const [data, dispatchData]     = useReducer(dataReducer, initialDataState);
  const [modals, dispatchModals] = useReducer(modalReducer, initialModalState);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  /* ─── Carga inicial de tareas ───────────────────────────────────────────────── */
  const loadTasks = useCallback(async () => {
    dispatchData({ type: 'FETCH_START' });
    try {
      const tasks = await getTasks();
      dispatchData({ type: 'FETCH_SUCCESS', tasks });
    } catch {
      dispatchData({ type: 'FETCH_ERROR', message: 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.' });
    }
  }, []);

  useEffect(() => { void loadTasks(); }, [loadTasks]);

  /* ─── Agrupar tareas por estado ─────────────────────────────────────────────── */
  const groupedTasks = useMemo(() => ({
    pending:   data.tasks.filter((t) => t.status === 'pending'),
    progress:  data.tasks.filter((t) => t.status === 'progress'),
    completed: data.tasks.filter((t) => t.status === 'completed'),
  }), [data.tasks]);

  /* ─── Callbacks estables para TaskColumn (evitan re-render de TaskCard.memo) ── */
  const handleOpenCreate = useCallback(
    (status: TaskStatus) => dispatchModals({ type: 'OPEN_CREATE', status }),
    [],
  );
  const handleOpenEdit = useCallback(
    (task: Task) => dispatchModals({ type: 'OPEN_EDIT', task }),
    [],
  );
  const handleOpenDelete = useCallback(
    (task: Task) => dispatchModals({ type: 'OPEN_DELETE', task }),
    [],
  );

  /* ─── Drag and drop ─────────────────────────────────────────────────────────── */
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = data.tasks.find((t) => t.id === String(event.active.id));
    setDraggedTask(task ?? null);
  }, [data.tasks]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedTask(null);
    if (!over) return;

    const task = data.tasks.find((t) => t.id === String(active.id));
    if (!task) return;

    const newStatus = String(over.id) as TaskStatus;
    if (task.status === newStatus) return;

    // Update optimista: la tarjeta se mueve de columna al instante
    const originalTask = { ...task };
    dispatchData({ type: 'UPDATE_TASK', task: { ...task, status: newStatus } });

    void updateTask(task.id, { status: newStatus }).then((updated) => {
      dispatchData({ type: 'UPDATE_TASK', task: updated });
    }).catch(() => {
      // Rollback si la API falla
      dispatchData({ type: 'UPDATE_TASK', task: originalTask });
    });
  }, [data.tasks]);

  /* ─── Handlers de formulario ────────────────────────────────────────────────── */
  const handleSubmitForm = async (payload: TaskPayload) => {
    if (modals.form.mode === 'create') {
      const task = await createTask({ ...payload, status: modals.form.targetStatus });
      dispatchData({ type: 'ADD_TASK', task });
    } else if (modals.form.initialData) {
      const task = await updateTask(modals.form.initialData.id, payload);
      dispatchData({ type: 'UPDATE_TASK', task });
    }
  };

  /* ─── Handlers de borrado ────────────────────────────────────────────────────── */
  const handleConfirmDelete = async () => {
    const { task } = modals.deleteConfirm;
    if (!task) return;
    dispatchModals({ type: 'DELETE_LOADING' });
    try {
      await deleteTask(task.id);
      dispatchData({ type: 'DELETE_TASK', id: task.id });
      dispatchModals({ type: 'CLOSE_DELETE' });
    } catch {
      dispatchModals({ type: 'DELETE_ERROR', message: 'No se pudo eliminar la tarea. Intenta de nuevo.' });
    }
  };

  const handleCloseDelete = () => {
    if (modals.deleteConfirm.loading) return;
    dispatchModals({ type: 'CLOSE_DELETE' });
  };

  /* ─── Render ─────────────────────────────────────────────────────────────────── */
  return (
    <div className="app">
      <Sidebar activeView="tasks" />

      <main className="app__main">
        {/* Cabecera */}
        <header className="app__header">
          <div className="app__heading">
            <h1 className="app__title">Tablero de tareas</h1>
            <p className="app__subtitle">
              {data.tasks.length === 0 && !data.loading
                ? 'Sin tareas todavía — ¡crea la primera!'
                : `${data.tasks.length} tarea${data.tasks.length !== 1 ? 's' : ''} en total`}
            </p>
          </div>
          <button
            className="app__add-btn"
            onClick={() => handleOpenCreate('pending')}
            data-tooltip="Crea una nueva tarea y agrégala a Pendiente"
            data-tooltip-pos="bottom"
          >
            <Plus size={16} strokeWidth={2.5} /> Nueva tarea
          </button>
        </header>

        {/* Progress bar */}
        {!data.loading && data.tasks.length > 0 && (
          <div className="app__progress">
            <div
              className="app__progress-bar"
              role="progressbar"
              aria-valuenow={Math.round((groupedTasks.completed.length / data.tasks.length) * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progreso general del proyecto"
            >
              <div
                className="app__progress-segment app__progress-segment--completed"
                style={{ width: `${(groupedTasks.completed.length / data.tasks.length) * 100}%` }}
                data-tooltip={`${groupedTasks.completed.length} completada${groupedTasks.completed.length !== 1 ? 's' : ''}`}
              />
              <div
                className="app__progress-segment app__progress-segment--progress"
                style={{ width: `${(groupedTasks.progress.length / data.tasks.length) * 100}%` }}
                data-tooltip={`${groupedTasks.progress.length} en progreso`}
              />
            </div>
            <div className="app__progress-stats">
              <span className="app__progress-stat app__progress-stat--completed">
                <span className="app__progress-dot" />
                {groupedTasks.completed.length} completada{groupedTasks.completed.length !== 1 ? 's' : ''}
              </span>
              <span className="app__progress-stat app__progress-stat--progress">
                <span className="app__progress-dot" />
                {groupedTasks.progress.length} en progreso
              </span>
              <span className="app__progress-stat app__progress-stat--pending">
                <span className="app__progress-dot" />
                {groupedTasks.pending.length} pendiente{groupedTasks.pending.length !== 1 ? 's' : ''}
              </span>
              <span className="app__progress-pct">
                {Math.round((groupedTasks.completed.length / data.tasks.length) * 100)}% completado
              </span>
            </div>
          </div>
        )}

        {/* Banner de error global */}
        {data.globalError && (
          <div className="app__error-banner">
            <span>{data.globalError}</span>
            <button className="app__error-retry" onClick={() => void loadTasks()}>Reintentar</button>
          </div>
        )}

        {/* Tablero Kanban */}
        {data.loading ? (
          <div className="app__loading">
            <div className="app__spinner" />
            <span>Cargando tareas…</span>
          </div>
        ) : (
          <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="app__board">
              {TASK_STATUSES.map((status) => (
                <TaskColumn
                  key={status}
                  status={status}
                  tasks={groupedTasks[status]}
                  onAdd={handleOpenCreate}
                  onEdit={handleOpenEdit}
                  onDelete={handleOpenDelete}
                />
              ))}
            </div>

            {/* Clon visual que sigue al cursor durante el drag */}
            <DragOverlay dropAnimation={null}>
              {draggedTask && (
                <TaskCard
                  task={draggedTask}
                  onEdit={handleOpenEdit}
                  onDelete={handleOpenDelete}
                  isDragOverlay
                />
              )}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      {/* Modal de formulario — key fuerza remount con datos frescos al abrir */}
      <TaskFormModal
        key={`${String(modals.form.isOpen)}-${modals.form.mode}-${modals.form.initialData?.id ?? 'new'}`}
        isOpen={modals.form.isOpen}
        mode={modals.form.mode}
        initialData={modals.form.initialData}
        targetStatus={modals.form.targetStatus}
        onSubmit={handleSubmitForm}
        onClose={() => dispatchModals({ type: 'CLOSE_FORM' })}
      />

      {/* Modal de confirmación de borrado */}
      <DeleteConfirmModal
        isOpen={modals.deleteConfirm.isOpen}
        taskTitle={modals.deleteConfirm.task?.title}
        loading={modals.deleteConfirm.loading}
        error={modals.deleteConfirm.error}
        onConfirm={() => void handleConfirmDelete()}
        onClose={handleCloseDelete}
      />
    </div>
  );
}
