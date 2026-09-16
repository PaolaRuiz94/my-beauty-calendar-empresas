import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import {
  getStoreServices, addStoreService, updateStoreService, deleteStoreService,
} from '../firebase/services';

const EMPTY_FORM = { nombre: '', descripcion: '', duracionMinutos: '', precio: '' };

export default function Services() {
  const { store } = useStore();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    setLoading(true);
    try {
      setServices(await getStoreServices(store.storeId));
    } catch {
      setError('No se pudieron cargar los servicios.');
    }
    setLoading(false);
  }

  function openNewForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormOpen(true);
  }

  function openEditForm(service) {
    setForm({
      nombre: service.nombre || '',
      descripcion: service.descripcion || '',
      duracionMinutos: service.duracionMinutos ?? '',
      precio: service.precio ?? '',
    });
    setEditingId(service.id);
    setFormOpen(true);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const data = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      duracionMinutos: form.duracionMinutos === '' ? null : Number(form.duracionMinutos),
      precio: form.precio === '' ? null : Number(form.precio),
    };
    try {
      if (editingId) {
        await updateStoreService(store.storeId, editingId, data);
      } else {
        await addStoreService(store.storeId, data);
      }
      setFormOpen(false);
      await loadServices();
    } catch {
      setError('No se pudo guardar el servicio.');
    }
    setSaving(false);
  }

  async function handleDelete(serviceId) {
    if (!confirm('¿Eliminar este servicio?')) return;
    try {
      await deleteStoreService(store.storeId, serviceId);
      setServices(services.filter(s => s.id !== serviceId));
    } catch {
      setError('No se pudo eliminar el servicio.');
    }
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <Link to="/dashboard" className="back-link">← Volver</Link>
          <h2>Mis servicios</h2>
        </div>
        <button onClick={openNewForm} className="btn-primary btn-inline">+ Agregar servicio</button>
      </header>

      <main className="dashboard-main">
        {error && <p className="auth-error">{error}</p>}

        {formOpen && (
          <form onSubmit={handleSubmit} className="product-form">
            <h3>{editingId ? 'Editar servicio' : 'Nuevo servicio'}</h3>

            <div className="form-group">
              <label>Nombre</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <input name="descripcion" value={form.descripcion} onChange={handleChange} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Duración (minutos)</label>
                <input type="number" min="5" step="5" name="duracionMinutos" value={form.duracionMinutos} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Precio (COP)</label>
                <input type="number" min="0" name="precio" value={form.precio} onChange={handleChange} />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-ghost" onClick={() => setFormOpen(false)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="loading-inline">Cargando servicios...</p>
        ) : services.length === 0 ? (
          <div className="welcome-card">
            <h3>Todavía no tienes servicios</h3>
            <p>Agregá tu primer servicio para que tus clientas puedan agendar citas.</p>
          </div>
        ) : (
          <div className="product-grid">
            {services.map(s => (
              <div key={s.id} className="product-card">
                <div className="product-card-body">
                  <h4>{s.nombre}</h4>
                  {s.descripcion && <p className="product-brand">{s.descripcion}</p>}
                  {s.duracionMinutos != null && <span className="product-category">{s.duracionMinutos} min</span>}
                  {s.precio != null && <p className="product-price">${s.precio.toLocaleString('es-CO')}</p>}
                  <div className="product-card-actions">
                    <button className="btn-ghost" onClick={() => openEditForm(s)}>Editar</button>
                    <button className="btn-ghost btn-danger" onClick={() => handleDelete(s.id)}>Eliminar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
