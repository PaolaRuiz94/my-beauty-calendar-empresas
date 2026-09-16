import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerStore } from '../firebase/auth';
import { useStore } from '../context/StoreContext';

export default function Register() {
  const navigate = useNavigate();
  const { setStore } = useStore();
  const [form, setForm] = useState({ name: '', city: '', whatsapp: '', website: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const storeData = await registerStore(form);
      setStore(storeData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>My Beauty Calendar</h1>
          <p>Crea la cuenta de tu peluquería</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Nombre del negocio</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Rizos & Co."
              required
            />
          </div>
          <div className="form-group">
            <label>Ciudad</label>
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="Bogotá"
              required
            />
          </div>
          <div className="form-group">
            <label>WhatsApp</label>
            <input
              name="whatsapp"
              value={form.whatsapp}
              onChange={handleChange}
              placeholder="+57 300 123 4567"
              required
            />
          </div>
          <div className="form-group">
            <label>Sitio web (opcional)</label>
            <input
              name="website"
              value={form.website}
              onChange={handleChange}
              placeholder="https://tutienda.co"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="hola@rizo.co"
              required
            />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
