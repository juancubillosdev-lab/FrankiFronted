import type { Task, TaskPayload, TaskStatus } from '../types';

const BASE = '/api/v1/tasks';

const VALID_STATUSES = new Set<TaskStatus>(['pending', 'progress', 'completed']);

function normalizeStatus(raw: unknown): TaskStatus {
  return VALID_STATUSES.has(raw as TaskStatus) ? (raw as TaskStatus) : 'pending';
}

/* ─── Obtener todas las tareas ───────────────────────────────────────────────── */
export async function getTasks(): Promise<Task[]> {
  const res = await fetch(`${BASE}?limit=100`);
  if (!res.ok) throw new Error('Error al obtener las tareas');
  const body = await res.json();
  return (body.data as Task[]).map((t) => ({ ...t, status: normalizeStatus(t.status) }));
}

/* ─── Crear tarea ────────────────────────────────────────────────────────────── */
export async function createTask(payload: TaskPayload): Promise<Task> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return { ...(body.data as Task), status: normalizeStatus((body.data as Task).status) };
}

/* ─── Actualizar tarea ───────────────────────────────────────────────────────── */
export async function updateTask(id: string, payload: Partial<TaskPayload>): Promise<Task> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return { ...(body.data as Task), status: normalizeStatus((body.data as Task).status) };
}

/* ─── Eliminar tarea ─────────────────────────────────────────────────────────── */
export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar la tarea');
}
