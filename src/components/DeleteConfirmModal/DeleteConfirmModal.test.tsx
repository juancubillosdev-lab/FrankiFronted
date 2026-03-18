import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteConfirmModal } from './DeleteConfirmModal';

const base = {
  isOpen: true,
  taskTitle: 'Tarea de prueba',
  loading: false,
  error: null,
  onConfirm: vi.fn(),
  onClose: vi.fn(),
};

describe('DeleteConfirmModal', () => {
  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(<DeleteConfirmModal {...base} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra el título de la tarea en el mensaje', () => {
    render(<DeleteConfirmModal {...base} />);
    expect(screen.getByText('Tarea de prueba')).toBeInTheDocument();
  });

  it('muestra "esta tarea" cuando taskTitle es undefined', () => {
    render(<DeleteConfirmModal {...base} taskTitle={undefined} />);
    expect(screen.getByText('esta tarea')).toBeInTheDocument();
  });

  it('llama onClose al hacer click en Cancelar', async () => {
    const onClose = vi.fn();
    render(<DeleteConfirmModal {...base} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('llama onConfirm al hacer click en Sí, eliminar', async () => {
    const onConfirm = vi.fn();
    render(<DeleteConfirmModal {...base} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('deshabilita ambos botones mientras loading es true', () => {
    render(<DeleteConfirmModal {...base} loading={true} />);
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Eliminando…' })).toBeDisabled();
  });

  it('muestra el texto "Eliminando…" en el botón de confirmar durante loading', () => {
    render(<DeleteConfirmModal {...base} loading={true} />);
    expect(screen.getByText('Eliminando…')).toBeInTheDocument();
  });

  it('muestra el mensaje de error cuando se proporciona', () => {
    render(<DeleteConfirmModal {...base} error="No se pudo eliminar la tarea." />);
    expect(screen.getByText('No se pudo eliminar la tarea.')).toBeInTheDocument();
  });

  it('no muestra mensaje de error cuando error es null', () => {
    render(<DeleteConfirmModal {...base} />);
    expect(screen.queryByText(/eliminar la tarea/i)).not.toBeInTheDocument();
  });
});
