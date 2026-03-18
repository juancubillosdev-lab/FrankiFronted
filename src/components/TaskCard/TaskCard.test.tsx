import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskCard } from './TaskCard';
import type { Task } from '../../types';

const task: Task = {
  id: '1',
  title: 'Tarea de ejemplo',
  description: 'Descripción de prueba',
  status: 'pending',
  createdAt: '2024-01-15T10:00:00.000Z',
  updatedAt: '2024-01-15T10:00:00.000Z',
};

describe('TaskCard', () => {
  it('renderiza el título y la descripción', () => {
    render(<TaskCard task={task} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Tarea de ejemplo')).toBeInTheDocument();
    expect(screen.getByText('Descripción de prueba')).toBeInTheDocument();
  });

  it('no renderiza el párrafo de descripción cuando es null', () => {
    render(<TaskCard task={{ ...task, description: null }} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByText('Descripción de prueba')).not.toBeInTheDocument();
  });

  it('llama onEdit con la tarea al hacer click en Editar', async () => {
    const onEdit = vi.fn();
    render(<TaskCard task={task} onEdit={onEdit} onDelete={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Editar tarea' }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledWith(task);
  });

  it('llama onDelete con la tarea al hacer click en Eliminar', async () => {
    const onDelete = vi.fn();
    render(<TaskCard task={task} onEdit={vi.fn()} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar tarea' }));
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith(task);
  });

  it('agrega data-tooltip en descripción cuando supera 80 caracteres', () => {
    const longDesc = 'a'.repeat(81);
    render(<TaskCard task={{ ...task, description: longDesc }} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText(longDesc)).toHaveAttribute('data-tooltip', longDesc);
  });

  it('no agrega data-tooltip en descripción corta', () => {
    render(<TaskCard task={task} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Descripción de prueba')).not.toHaveAttribute('data-tooltip');
  });
});
