import { useStore } from '../context/StoreContext';
import { logoutStore } from '../firebase/auth';
import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard() {
  const { store, setStore } = useStore();
  const navigate = useNavigate();

  async function handleLogout() {
    await logoutStore();
    setStore(null);
    navigate('/login');
  }

  if (!store) return null;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h2>{store.nombre}</h2>
          <span className="store-id">/{store.storeId}</span>
        </div>
        <button onClick={handleLogout} className="btn-ghost">Cerrar sesión</button>
      </header>

      <main className="dashboard-main">
        <div className="welcome-card">
          <h3>Bienvenida a tu panel</h3>
          <p>Desde aquí podrás gestionar tus productos, ver tu link de diagnóstico y revisar tus métricas.</p>
        </div>

        <div className="coming-soon-grid">
          <Link to="/dashboard/productos" className="coming-soon-card coming-soon-card-active">
            <span className="card-icon">📦</span>
            <h4>Mis productos</h4>
            <p>Gestiona tu catálogo</p>
          </Link>
          <div className="coming-soon-card">
            <span className="card-icon">🔗</span>
            <h4>Mi link</h4>
            <p>Próximamente</p>
          </div>
          <div className="coming-soon-card">
            <span className="card-icon">📊</span>
            <h4>Métricas</h4>
            <p>Próximamente</p>
          </div>
        </div>
      </main>
    </div>
  );
}
