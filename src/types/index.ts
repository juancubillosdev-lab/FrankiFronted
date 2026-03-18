/* ─── Tipos compartidos de la aplicación ─────────────────────────────────────── */

/** Estados posibles de una tarea en el tablero Kanban */
export const TASK_STATUSES = ['pending', 'progress', 'completed'] as const;
export type TaskStatus = typeof TASK_STATUSES[number];

/** Tarea tal como la devuelve el backend */
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

/** Payload para crear o editar una tarea */
export interface TaskPayload {
  title: string;
  description?: string | null;
  status?: TaskStatus;
}

/** Modo del modal de formulario */
export type FormMode = 'create' | 'edit';

/** Datos que se rellenan al abrir el modal en modo edición */
export interface TaskFormInitialData {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
}
