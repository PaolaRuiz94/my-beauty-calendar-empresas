import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { logoutStore, updateStoreWebsite } from '../firebase/auth';
import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard() {
  const { store, setStore } = useStore();
  const navigate = useNavigate();
  const [website, setWebsite] = useState(store?.website || '');
  const [savingWebsite, setSavingWebsite] = useState(false);

  async function handleLogout() {
    await logoutStore();
    setStore(null);
    navigate('/login');
  }

  async function handleSaveWebsite(e) {
    e.preventDefault();
    setSavingWebsite(true);
    try {
      await updateStoreWebsite(store.storeId, website);
      setStore({ ...store, website: website ? website.trim() : null });
    } finally {
      setSavingWebsite(false);
    }
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

        <form onSubmit={handleSaveWebsite} className="welcome-card">
          <h3>Sitio web de tu tienda</h3>
          <p>Si tenés una página propia, el cliente va a poder ir directo ahí al comprar tus productos.</p>
          <div className="form-row">
            <input
              value={website}
              onChange={e => setWebsite(e.target.value)}
              placeholder="https://tutienda.co"
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-primary" disabled={savingWebsite}>
              {savingWebsite ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>

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
