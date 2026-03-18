import { useEffect, useCallback, useMemo } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { TASK_STATUSES } from './types';
import type { TaskPayload } from './types';
import { Sidebar } from './components/Sidebar/Sidebar.tsx';
import { TaskCard } from './components/TaskCard/TaskCard.tsx';
import { TaskColumn } from './components/TaskColumn/TaskColumn.tsx';
import { TaskFormModal } from './components/TaskFormModal/TaskFormModal.tsx';
import { DeleteConfirmModal } from './components/DeleteConfirmModal/DeleteConfirmModal.tsx';
import { createTask, updateTask, deleteTask } from './services/api.ts';
import { useTasks } from './hooks/useTasks.ts';
import { useModals } from './hooks/useModals.ts';
import { useKanbanDnd } from './hooks/useKanbanDnd.ts';
import './App.css';

export default function App() {
  const { data, loadTasks, addTask, updateTaskInState, deleteTaskFromState } = useTasks();
  const { modals, openCreate, openEdit, openDelete, closeForm, closeDelete, setDeleteLoading, setDeleteError } = useModals();
  const { draggedTask, handleDragStart, handleDragEnd } = useKanbanDnd(data.tasks, updateTaskInState);

  useEffect(() => { void loadTasks(); }, [loadTasks]);

  /* ─── Agrupar tareas por estado ─────────────────────────────────────────────── */
  const groupedTasks = useMemo(() => ({
    pending:   data.tasks.filter((t) => t.status === 'pending'),
    progress:  data.tasks.filter((t) => t.status === 'progress'),
    completed: data.tasks.filter((t) => t.status === 'completed'),
  }), [data.tasks]);

  /* ─── Punto 4: useMemo para el porcentaje de progreso ───────────────────────── */
  const completionPct = useMemo(() =>
    data.tasks.length > 0
      ? Math.round((groupedTasks.completed.length / data.tasks.length) * 100)
      : 0,
  [groupedTasks.completed.length, data.tasks.length]);

  /* ─── Punto 3: useCallback en handleSubmitForm ──────────────────────────────── */
  const handleSubmitForm = useCallback(async (payload: TaskPayload) => {
    if (modals.form.mode === 'create') {
      const task = await createTask({ ...payload, status: modals.form.targetStatus });
      addTask(task);
    } else if (modals.form.initialData) {
      const task = await updateTask(modals.form.initialData.id, payload);
      updateTaskInState(task);
    }
  }, [modals.form.mode, modals.form.targetStatus, modals.form.initialData, addTask, updateTaskInState]);

  /* ─── Punto 3: useCallback en handleConfirmDelete ───────────────────────────── */
  const handleConfirmDelete = useCallback(async () => {
    const { task } = modals.deleteConfirm;
    if (!task) return;
    setDeleteLoading();
    try {
      await deleteTask(task.id);
      deleteTaskFromState(task.id);
      closeDelete();
    } catch {
      setDeleteError('No se pudo eliminar la tarea. Intenta de nuevo.');
    }
  }, [modals.deleteConfirm, setDeleteLoading, deleteTaskFromState, closeDelete, setDeleteError]);

  const handleCloseDelete = useCallback(() => {
    if (modals.deleteConfirm.loading) return;
    closeDelete();
  }, [modals.deleteConfirm.loading, closeDelete]);

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
            onClick={() => openCreate('pending')}
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
              aria-valuenow={completionPct}
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
                {completionPct}% completado
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
                  onAdd={openCreate}
                  onEdit={openEdit}
                  onDelete={openDelete}
                />
              ))}
            </div>

            {/* Clon visual que sigue al cursor durante el drag */}
            <DragOverlay dropAnimation={null}>
              {draggedTask && (
                <TaskCard
                  task={draggedTask}
                  onEdit={openEdit}
                  onDelete={openDelete}
                  isDragOverlay
                />
              )}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      {/* Modal de formulario — sin key trick, se resetea internamente con useEffect */}
      <TaskFormModal
        isOpen={modals.form.isOpen}
        mode={modals.form.mode}
        initialData={modals.form.initialData}
        targetStatus={modals.form.targetStatus}
        onSubmit={handleSubmitForm}
        onClose={closeForm}
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
