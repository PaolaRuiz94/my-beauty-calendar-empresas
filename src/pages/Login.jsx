import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginStore, resetStorePassword } from '../firebase/auth';
import { useStore } from '../context/StoreContext';
import logo from '../assets/logo.png';

export default function Login() {
  const navigate = useNavigate();
  const { setStore } = useStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSending, setResetSending] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const storeData = await loginStore(form.email, form.password);
      setStore(storeData);
      navigate('/dashboard');
    } catch (err) {
      setError('Email o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  }

  function openForgotMode() {
    setResetEmail(form.email);
    setResetMessage('');
    setForgotMode(true);
  }

  async function handleReset(e) {
    e.preventDefault();
    setResetMessage('');
    setResetSending(true);
    try {
      await resetStorePassword(resetEmail);
      setResetMessage('Te enviamos un correo con un link para restablecer tu contraseña.');
    } catch {
      setResetMessage('No pudimos enviar el correo. Revisá que el email sea correcto.');
    } finally {
      setResetSending(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img src={logo} alt="My Beauty Calendar" className="auth-logo" />
          <p>Panel de empresas</p>
        </div>

        {forgotMode ? (
          <form onSubmit={handleReset} className="auth-form">
            <p className="auth-help">Escribí el email de tu cuenta y te mandamos un link para elegir una contraseña nueva.</p>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                placeholder="hola@rizo.co"
                required
              />
            </div>

            {resetMessage && <p className={resetMessage.startsWith('Te enviamos') ? 'auth-success' : 'auth-error'}>{resetMessage}</p>}

            <button type="submit" className="btn-primary" disabled={resetSending}>
              {resetSending ? 'Enviando...' : 'Enviar link de recuperación'}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setForgotMode(false)}>
              Volver a iniciar sesión
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="auth-form">
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
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Entrando...' : 'Iniciar sesión'}
              </button>
            </form>

            <p className="auth-footer">
              <button type="button" className="link-button" onClick={openForgotMode}>¿Olvidaste tu contraseña?</button>
            </p>

            <p className="auth-footer">
              ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
