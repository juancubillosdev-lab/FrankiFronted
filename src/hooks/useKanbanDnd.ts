import { useState, useCallback } from 'react';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { updateTask } from '../services/api';
import type { Task, TaskStatus } from '../types';

export function useKanbanDnd(tasks: Task[], updateTaskInState: (task: Task) => void) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === String(event.active.id));
    setDraggedTask(task ?? null);
  }, [tasks]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedTask(null);
    if (!over) return;

    const task = tasks.find((t) => t.id === String(active.id));
    if (!task) return;

    const newStatus = String(over.id) as TaskStatus;
    if (task.status === newStatus) return;

    const originalTask = { ...task };
    updateTaskInState({ ...task, status: newStatus });

    void updateTask(task.id, { status: newStatus }).then((updated) => {
      updateTaskInState(updated);
    }).catch(() => {
      updateTaskInState(originalTask);
    });
  }, [tasks, updateTaskInState]);

  return { draggedTask, handleDragStart, handleDragEnd };
}
