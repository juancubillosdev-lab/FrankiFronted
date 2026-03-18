import { memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Pencil, Trash2, GripVertical } from 'lucide-react';
import type { Task } from '../../types';
import './TaskCard.css';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatDateFull(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  /** Cuando es true el componente actúa como overlay del drag (sin hook de arrastre) */
  isDragOverlay?: boolean;
}

export const TaskCard = memo(function TaskCard({ task, onEdit, onDelete, isDragOverlay = false }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
    disabled: isDragOverlay,
  });

  return (
    <article
      ref={setNodeRef}
      className={[
        'task-card',
        isDragging    ? 'task-card--dragging'    : '',
        isDragOverlay ? 'task-card--drag-overlay' : '',
      ].filter(Boolean).join(' ')}
    >
      {/* Handle de arrastre */}
      <button
        className="task-card__drag-handle"
        aria-label="Arrastrar tarea"
        data-tooltip="Arrastra para cambiar de columna"
        {...listeners}
        {...attributes}
      >
        <GripVertical size={14} />
      </button>

      <div className="task-card__body">
        <h3 className="task-card__title">{task.title}</h3>
        {task.description && (
          <p
            className="task-card__description"
            data-tooltip={task.description.length > 80 ? task.description : undefined}
            data-tooltip-pos="bottom"
          >
            {task.description}
          </p>
        )}
      </div>

      <div className="task-card__footer">
        <span
          className="task-card__date"
          data-tooltip={`Creado: ${formatDateFull(task.createdAt)}`}
        >
          {formatDate(task.createdAt)}
        </span>

        <div className="task-card__actions">
          <button
            className="task-card__btn task-card__btn--edit"
            onClick={() => onEdit(task)}
            aria-label="Editar tarea"
            data-tooltip="Editar título y descripción"
          >
            <Pencil size={14} />
          </button>
          <button
            className="task-card__btn task-card__btn--delete"
            onClick={() => onDelete(task)}
            aria-label="Eliminar tarea"
            data-tooltip="Eliminar tarea permanentemente"
            data-tooltip-pos="right"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
});
