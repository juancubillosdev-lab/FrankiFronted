import { useReducer, useCallback } from 'react';
import { dataReducer, initialDataState } from '../reducers/dataReducer';
import { getTasks } from '../services/api';
import type { Task } from '../types';

export function useTasks() {
  const [data, dispatch] = useReducer(dataReducer, initialDataState);

  const loadTasks = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const tasks = await getTasks();
      dispatch({ type: 'FETCH_SUCCESS', tasks });
    } catch {
      dispatch({ type: 'FETCH_ERROR', message: 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.' });
    }
  }, []);

  const addTask = useCallback((task: Task) => {
    dispatch({ type: 'ADD_TASK', task });
  }, []);

  const updateTaskInState = useCallback((task: Task) => {
    dispatch({ type: 'UPDATE_TASK', task });
  }, []);

  const deleteTaskFromState = useCallback((id: string) => {
    dispatch({ type: 'DELETE_TASK', id });
  }, []);

  return { data, loadTasks, addTask, updateTaskInState, deleteTaskFromState };
}
