import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import {
  getStoreProducts, addStoreProduct, updateStoreProduct, deleteStoreProduct,
} from '../firebase/products';
import { TAG_OPTIONS, CATEGORY_OPTIONS, WEIGHT_CLASS_CATEGORIES, WEIGHT_CLASS_OPTIONS } from '../data/productTaxonomy';

const EMPTY_FORM = {
  name: '', brand: '', description: '', category: CATEGORY_OPTIONS[0],
  tags: [], weightClass: '', price: '', image: '', externalProductId: '',
};

export default function Products() {
  const { store } = useStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      setProducts(await getStoreProducts(store.storeId));
    } catch {
      setError('No se pudieron cargar los productos.');
    }
    setLoading(false);
  }

  function openNewForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormOpen(true);
  }

  function openEditForm(product) {
    setForm({
      name: product.name || '',
      brand: product.brand || '',
      description: product.description || '',
      category: product.category || CATEGORY_OPTIONS[0],
      tags: product.tags || [],
      weightClass: product.weightClass || '',
      price: product.price ?? '',
      image: product.image || '',
      externalProductId: product.externalProductId || '',
    });
    setEditingId(product.id);
    setFormOpen(true);
  }

  function toggleTag(tag) {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }));
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const needsWeightClass = WEIGHT_CLASS_CATEGORIES.includes(form.category);
    const data = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      description: form.description.trim(),
      category: form.category,
      tags: form.tags,
      weightClass: needsWeightClass ? (form.weightClass || null) : null,
      price: form.price === '' ? null : Number(form.price),
      image: form.image.trim(),
      externalProductId: form.externalProductId.trim() || null,
    };
    try {
      if (editingId) {
        await updateStoreProduct(store.storeId, editingId, data);
      } else {
        await addStoreProduct(store.storeId, data);
      }
      setFormOpen(false);
      await loadProducts();
    } catch {
      setError('No se pudo guardar el producto.');
    }
    setSaving(false);
  }

  async function handleDelete(productId) {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await deleteStoreProduct(store.storeId, productId);
      setProducts(products.filter(p => p.id !== productId));
    } catch {
      setError('No se pudo eliminar el producto.');
    }
  }

  async function handleImport() {
    setImportMessage('');
    let items;
    try {
      items = JSON.parse(importText);
      if (!Array.isArray(items)) throw new Error('not an array');
    } catch {
      setImportMessage('El JSON no es válido o no es un array.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!CATEGORY_OPTIONS.includes(it.category)) {
        setImportMessage(`Producto #${i + 1} ("${it.name || 'sin nombre'}"): category "${it.category}" no coincide con ninguna opción de la taxonomía.`);
        return;
      }
      if (!Array.isArray(it.tags) || it.tags.length === 0 || it.tags.some(t => !TAG_OPTIONS.includes(t))) {
        setImportMessage(`Producto #${i + 1} ("${it.name || 'sin nombre'}"): tags inválidos (deben ser un array no vacío de la taxonomía).`);
        return;
      }
    }

    if (!confirm(`Esto va a borrar los ${products.length} productos actuales de esta tienda y cargar ${items.length} nuevos. ¿Continuar?`)) return;

    setImporting(true);
    try {
      for (const p of products) {
        await deleteStoreProduct(store.storeId, p.id);
      }
      for (const it of items) {
        const needsWeight = WEIGHT_CLASS_CATEGORIES.includes(it.category);
        await addStoreProduct(store.storeId, {
          name: it.name || '',
          brand: it.brand || '',
          description: it.description || '',
          category: it.category,
          tags: it.tags,
          weightClass: needsWeight ? (it.weightClass || null) : null,
          price: it.price ?? null,
          image: it.image || '',
          externalProductId: it.externalProductId || null,
        });
      }
      setImportMessage(`Listo: se cargaron ${items.length} productos.`);
      setImportText('');
      setImportOpen(false);
      await loadProducts();
    } catch {
      setImportMessage('Ocurrió un error durante la importación — revisá qué quedó guardado antes de reintentar.');
    }
    setImporting(false);
  }

  const needsWeightClass = WEIGHT_CLASS_CATEGORIES.includes(form.category);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <Link to="/dashboard" className="back-link">← Volver</Link>
          <h2>Mis productos</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setImportOpen(o => !o)} className="btn-ghost btn-inline">
            {importOpen ? 'Cerrar importador' : 'Importar JSON (reemplaza todo)'}
          </button>
          <button onClick={openNewForm} className="btn-primary btn-inline">+ Agregar producto</button>
        </div>
      </header>

      <main className="dashboard-main">
        {error && <p className="auth-error">{error}</p>}

        {importOpen && (
          <div className="product-form">
            <h3>Importar catálogo (reemplaza todo lo existente)</h3>
            <p>Pegá un array JSON con los campos: name, brand, description, category, tags[], weightClass, price, image, externalProductId (opcional). Esto borra primero todos los productos actuales de esta tienda.</p>
            <textarea
              rows={10}
              style={{ width: '100%', fontFamily: 'monospace' }}
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="[ { &quot;name&quot;: ... } ]"
            />
            {importMessage && <p className="auth-error">{importMessage}</p>}
            <div className="form-actions">
              <button type="button" className="btn-ghost" onClick={() => setImportOpen(false)}>Cancelar</button>
              <button type="button" className="btn-primary" onClick={handleImport} disabled={importing || !importText.trim()}>
                {importing ? 'Importando...' : 'Reemplazar y cargar'}
              </button>
            </div>
          </div>
        )}

        {formOpen && (
          <form onSubmit={handleSubmit} className="product-form">
            <h3>{editingId ? 'Editar producto' : 'Nuevo producto'}</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Nombre</label>
                <input name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Marca</label>
                <input name="brand" value={form.brand} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <input name="description" value={form.description} onChange={handleChange} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Categoría</label>
                <select name="category" value={form.category} onChange={handleChange}>
                  {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Precio (COP)</label>
                <input type="number" min="0" name="price" value={form.price} onChange={handleChange} />
              </div>
            </div>

            {needsWeightClass && (
              <div className="form-group">
                <label>Peso/textura</label>
                <select name="weightClass" value={form.weightClass} onChange={handleChange} required>
                  <option value="">Selecciona una opción</option>
                  {WEIGHT_CLASS_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>URL de imagen</label>
              <input name="image" value={form.image} onChange={handleChange} placeholder="https://..." />
            </div>

            <div className="form-group">
              <label>ID externo (opcional — ej. ID real en la tienda online, para "Comprar")</label>
              <input name="externalProductId" value={form.externalProductId} onChange={handleChange} placeholder="78665" />
            </div>

            <div className="form-group">
              <label>Etiquetas (para el motor de recomendación)</label>
              <div className="tag-grid">
                {TAG_OPTIONS.map(tag => (
                  <label key={tag} className={`tag-chip ${form.tags.includes(tag) ? 'tag-chip-active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={form.tags.includes(tag)}
                      onChange={() => toggleTag(tag)}
                    />
                    {tag}
                  </label>
                ))}
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
          <p className="loading-inline">Cargando productos...</p>
        ) : products.length === 0 ? (
          <div className="welcome-card">
            <h3>Todavía no tienes productos</h3>
            <p>Agrega tu primer producto para que empiece a aparecer en las recomendaciones de tus clientas.</p>
          </div>
        ) : (
          <div className="product-grid">
            {products.map(p => (
              <div key={p.id} className="product-card">
                {p.image && <img src={p.image} alt={p.name} className="product-image" />}
                <div className="product-card-body">
                  <h4>{p.name}</h4>
                  {p.brand && <p className="product-brand">{p.brand}</p>}
                  <span className="product-category">{p.category}</span>
                  {p.price != null && <p className="product-price">${p.price.toLocaleString('es-CO')}</p>}
                  <div className="product-tags">
                    {(p.tags || []).map(t => <span key={t} className="tag-pill">{t}</span>)}
                  </div>
                  <div className="product-card-actions">
                    <button className="btn-ghost" onClick={() => openEditForm(p)}>Editar</button>
                    <button className="btn-ghost btn-danger" onClick={() => handleDelete(p.id)}>Eliminar</button>
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
