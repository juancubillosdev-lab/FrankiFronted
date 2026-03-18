import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import type { Task, TaskStatus } from '../../types';
import { TaskCard } from '../TaskCard/TaskCard.tsx';
import './TaskColumn.css';

interface StatusConfig {
  label: string;
  modifier: TaskStatus;
  description: string;
}

const STATUS_LABELS: Record<TaskStatus, StatusConfig> = {
  pending:   { label: 'PENDIENTE',   modifier: 'pending',   description: 'Tareas sin empezar'        },
  progress:  { label: 'EN PROGRESO', modifier: 'progress',  description: 'Tareas en las que trabajas' },
  completed: { label: 'COMPLETADO',  modifier: 'completed', description: 'Tareas finalizadas'         },
};

interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onAdd: (status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskColumn({ status, tasks, onAdd, onEdit, onDelete }: TaskColumnProps) {
  const { label, modifier, description } = STATUS_LABELS[status];

  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section className="task-column">
      {/* Cabecera */}
      <div className="task-column__header">
        <div className="task-column__header-left">
          <span
            className={`task-column__dot task-column__dot--${modifier}`}
            data-tooltip={description}
          />
          <h2 className="task-column__title">{label}</h2>
          <span
            className="task-column__count"
            data-tooltip={`${tasks.length} tarea${tasks.length !== 1 ? 's' : ''} en esta columna`}
          >
            {tasks.length}
          </span>
        </div>
        <button
          className="task-column__add-btn"
          onClick={() => onAdd(status)}
          aria-label={`Agregar tarea en ${label}`}
          data-tooltip={`Nueva tarea en ${label.charAt(0) + label.slice(1).toLowerCase()}`}
          data-tooltip-pos="bottom"
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* Lista de tareas — zona de drop */}
      <div
        ref={setNodeRef}
        className={`task-column__list${isOver ? ' task-column__list--over' : ''}`}
      >
        {tasks.length === 0 ? (
          <div className="task-column__empty">
            <p className="task-column__empty-text">
              {isOver ? 'Suelta aquí' : 'Sin tareas aquí'}
            </p>
            {!isOver && (
              <button
                className="task-column__empty-btn"
                onClick={() => onAdd(status)}
                data-tooltip="Crear la primera tarea en esta columna"
                data-tooltip-pos="bottom"
              >
                + Agregar tarea
              </button>
            )}
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </section>
  );
}
