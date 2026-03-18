import { LayoutGrid } from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  activeView?: 'tasks';
  onViewChange?: (id: 'tasks') => void;
}

export function Sidebar({ activeView = 'tasks', onViewChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      {/* Marca */}
      <div className="sidebar__brand">
        <img
          className="sidebar__logo"
          src="/logo.png"
          alt="Franki AI"
        />
      </div>

      {/* Navegación */}
      <nav className="sidebar__nav">
        <p className="sidebar__nav-label">Menú</p>
        <ul className="sidebar__nav-list">
          <li>
            <button
              className={`sidebar__nav-item${activeView === 'tasks' ? ' sidebar__nav-item--active' : ''}`}
              onClick={() => onViewChange?.('tasks')}
              data-tooltip="Ver y gestionar todas las tareas"
              data-tooltip-pos="right"
            >
              <span className="sidebar__nav-icon"><LayoutGrid size={18} /></span>
              <span className="sidebar__nav-text">Tareas</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Avatar usuario */}
      <div className="sidebar__user" data-tooltip="Sesión activa como Administrador" data-tooltip-pos="right">
        <div className="sidebar__avatar">U</div>
        <div className="sidebar__user-info">
          <p className="sidebar__user-name">Juan Cubillos</p>
          <p className="sidebar__user-role">Administrador</p>
        </div>
      </div>
    </aside>
  );
}
