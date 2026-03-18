import type { Task, TaskStatus, FormMode, TaskFormInitialData } from '../types';

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

interface ModalState {
  form: FormModalState;
  deleteConfirm: DeleteModalState;
}

type ModalAction =
  | { type: 'OPEN_CREATE'; status: TaskStatus }
  | { type: 'OPEN_EDIT'; task: Task }
  | { type: 'CLOSE_FORM' }
  | { type: 'OPEN_DELETE'; task: Task }
  | { type: 'DELETE_LOADING' }
  | { type: 'DELETE_ERROR'; message: string }
  | { type: 'CLOSE_DELETE' };

const initialFormModal: FormModalState    = { isOpen: false, mode: 'create', initialData: null, targetStatus: 'pending' };
const initialDeleteModal: DeleteModalState = { isOpen: false, task: null, loading: false, error: null };

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
