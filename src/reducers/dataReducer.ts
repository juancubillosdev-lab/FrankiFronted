import type { Task } from '../types';

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
