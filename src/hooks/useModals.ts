import { useReducer, useCallback } from 'react';
import { modalReducer, initialModalState } from '../reducers/modalReducer';
import type { Task, TaskStatus } from '../types';

export function useModals() {
  const [modals, dispatch] = useReducer(modalReducer, initialModalState);

  const openCreate = useCallback((status: TaskStatus) => {
    dispatch({ type: 'OPEN_CREATE', status });
  }, []);

  const openEdit = useCallback((task: Task) => {
    dispatch({ type: 'OPEN_EDIT', task });
  }, []);

  const openDelete = useCallback((task: Task) => {
    dispatch({ type: 'OPEN_DELETE', task });
  }, []);

  const closeForm = useCallback(() => {
    dispatch({ type: 'CLOSE_FORM' });
  }, []);

  const closeDelete = useCallback(() => {
    dispatch({ type: 'CLOSE_DELETE' });
  }, []);

  const setDeleteLoading = useCallback(() => {
    dispatch({ type: 'DELETE_LOADING' });
  }, []);

  const setDeleteError = useCallback((message: string) => {
    dispatch({ type: 'DELETE_ERROR', message });
  }, []);

  return { modals, openCreate, openEdit, openDelete, closeForm, closeDelete, setDeleteLoading, setDeleteError };
}
