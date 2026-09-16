import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Services from './pages/Services';
import Agenda from './pages/Agenda';
import './index.css';

function PrivateRoute({ children }) {
  const { store, loading } = useStore();
  if (loading) return <div className="loading">Cargando...</div>;
  return store ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { store, loading } = useStore();
  if (loading) return <div className="loading">Cargando...</div>;
  return store ? <Navigate to="/dashboard" /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/dashboard/productos" element={<PrivateRoute><Products /></PrivateRoute>} />
      <Route path="/dashboard/servicios" element={<PrivateRoute><Services /></PrivateRoute>} />
      <Route path="/dashboard/agenda" element={<PrivateRoute><Agenda /></PrivateRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </StoreProvider>
  );
}
