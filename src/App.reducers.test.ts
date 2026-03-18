import { dataReducer, initialDataState } from './reducers/dataReducer';
import { modalReducer, initialModalState } from './reducers/modalReducer';
import type { Task } from './types';

const makeTask = (id: string, title = `Tarea ${id}`, status: Task['status'] = 'pending'): Task => ({
  id,
  title,
  description: null,
  status,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
});

/* ─── dataReducer ────────────────────────────────────────────────────────────── */
describe('dataReducer', () => {
  it('FETCH_START → loading true, globalError null', () => {
    const state = { ...initialDataState, loading: false, globalError: 'error previo' };
    expect(dataReducer(state, { type: 'FETCH_START' })).toMatchObject({
      loading: true,
      globalError: null,
    });
  });

  it('FETCH_SUCCESS → loading false, tasks actualizadas', () => {
    const tasks = [makeTask('1')];
    const next = dataReducer(initialDataState, { type: 'FETCH_SUCCESS', tasks });
    expect(next).toMatchObject({ loading: false, tasks });
  });

  it('FETCH_ERROR → loading false, globalError con mensaje', () => {
    const next = dataReducer(initialDataState, { type: 'FETCH_ERROR', message: 'Fallo de red' });
    expect(next).toMatchObject({ loading: false, globalError: 'Fallo de red' });
  });

  it('ADD_TASK → prepend al array', () => {
    const existing = makeTask('1');
    const state = { ...initialDataState, loading: false, tasks: [existing] };
    const newTask = makeTask('2', 'Nueva', 'progress');
    const next = dataReducer(state, { type: 'ADD_TASK', task: newTask });
    expect(next.tasks[0]).toEqual(newTask);
    expect(next.tasks).toHaveLength(2);
  });

  it('ADD_TASK → preserva el status de la tarea recibida del backend', () => {
    const state = { ...initialDataState, loading: false, tasks: [] };
    const task = makeTask('1', 'T', 'completed');
    const next = dataReducer(state, { type: 'ADD_TASK', task });
    expect(next.tasks[0].status).toBe('completed');
  });

  it('UPDATE_TASK → reemplaza la tarea por ID, conserva el resto', () => {
    const t1 = makeTask('1', 'Viejo');
    const t2 = makeTask('2');
    const state = { ...initialDataState, loading: false, tasks: [t1, t2] };
    const updated = { ...t1, title: 'Nuevo', status: 'progress' as const };
    const next = dataReducer(state, { type: 'UPDATE_TASK', task: updated });
    expect(next.tasks.find((t) => t.id === '1')?.title).toBe('Nuevo');
    expect(next.tasks.find((t) => t.id === '1')?.status).toBe('progress');
    expect(next.tasks).toHaveLength(2);
  });

  it('DELETE_TASK → elimina la tarea del array', () => {
    const state = { ...initialDataState, loading: false, tasks: [makeTask('1'), makeTask('2')] };
    const next = dataReducer(state, { type: 'DELETE_TASK', id: '1' });
    expect(next.tasks.find((t) => t.id === '1')).toBeUndefined();
    expect(next.tasks).toHaveLength(1);
  });
});

/* ─── modalReducer ───────────────────────────────────────────────────────────── */
describe('modalReducer', () => {
  it('OPEN_CREATE → abre el formulario en modo create con el status dado', () => {
    const next = modalReducer(initialModalState, { type: 'OPEN_CREATE', status: 'progress' });
    expect(next.form).toMatchObject({ isOpen: true, mode: 'create', targetStatus: 'progress' });
  });

  it('OPEN_EDIT → abre el formulario con los datos de la tarea (incluyendo status)', () => {
    const task = makeTask('1', 'Editar esto', 'completed');
    const next = modalReducer(initialModalState, { type: 'OPEN_EDIT', task });
    expect(next.form).toMatchObject({
      isOpen: true,
      mode: 'edit',
      initialData: { id: '1', title: 'Editar esto', status: 'completed' },
    });
  });

  it('CLOSE_FORM → cierra el formulario sin tocar deleteConfirm', () => {
    const opened = modalReducer(initialModalState, { type: 'OPEN_CREATE', status: 'pending' });
    const next = modalReducer(opened, { type: 'CLOSE_FORM' });
    expect(next.form.isOpen).toBe(false);
    expect(next.deleteConfirm).toEqual(initialModalState.deleteConfirm);
  });

  it('OPEN_DELETE → abre el modal de borrado con la tarea', () => {
    const task = makeTask('1');
    const next = modalReducer(initialModalState, { type: 'OPEN_DELETE', task });
    expect(next.deleteConfirm).toMatchObject({ isOpen: true, task, loading: false, error: null });
  });

  it('DELETE_LOADING → loading true, error null', () => {
    const task = makeTask('1');
    const opened = modalReducer(initialModalState, { type: 'OPEN_DELETE', task });
    const next = modalReducer(opened, { type: 'DELETE_LOADING' });
    expect(next.deleteConfirm).toMatchObject({ loading: true, error: null });
  });

  it('DELETE_ERROR → loading false, error con mensaje', () => {
    const task = makeTask('1');
    const state = modalReducer(initialModalState, { type: 'OPEN_DELETE', task });
    const next = modalReducer(state, { type: 'DELETE_ERROR', message: 'No se pudo eliminar' });
    expect(next.deleteConfirm).toMatchObject({ loading: false, error: 'No se pudo eliminar' });
  });

  it('CLOSE_DELETE → resetea deleteConfirm a su estado inicial', () => {
    const task = makeTask('1');
    const state = modalReducer(initialModalState, { type: 'OPEN_DELETE', task });
    const next = modalReducer(state, { type: 'CLOSE_DELETE' });
    expect(next.deleteConfirm).toEqual(initialModalState.deleteConfirm);
  });
});
