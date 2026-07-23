import { Link, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/auth-context';
import './layout.css';

const navItems = [
  { to: '/khach-hang', label: 'Khách hàng' },
  { to: '/lo-dat', label: 'Lô đất' },
  { to: '/giao-dich', label: 'Giao dịch' },
  { to: '/dich-vu-so-do', label: 'Dịch vụ sổ đỏ' },
];

export function AppLayout() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div className="boot-screen">Đang tải…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <strong>An Hưng Land</strong>
          <span>CRM</span>
        </div>
        <nav>
          {navItems.map((item) => (
            <Link key={item.to} to={item.to}>
              {item.label}
            </Link>
          ))}
          {user.role === 'ADMIN' ? (
            <Link to="/quan-tri/khach-hang">Quản trị khách</Link>
          ) : null}
        </nav>
        <div className="sidebar-user">
          <div>
            <strong>{user.fullName}</strong>
            <span>{user.role}</span>
          </div>
          <button type="button" onClick={() => void logout()}>
            Đăng xuất
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
