import { useState, useEffect } from 'react';
import { Plus, Send, Trash2, X } from 'lucide-react';
import { Skeleton } from '@shared/ui/Skeleton';
import { api } from '@shared/lib/http/client';
import { formatUsd } from '@shared/lib/format/currency';
import type { SocialCatalog, SocialCatalogItem } from '@types';

function CatalogGridSkeleton() {
  return (
    <div className="ig-catalog-grid">
      {[1, 2, 3].map(i => (
        <div key={i} className="ig-catalog-card" style={{ pointerEvents: 'none' }}>
          <Skeleton height={200} width="100%" borderRadius={0} />
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skeleton height={14} width="70%" />
            <Skeleton height={10} width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SocialCatalogs() {
  const [catalogs, setCatalogs] = useState<SocialCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'my' | 'explore'>('my');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCatalog, setSelectedCatalog] = useState<SocialCatalog | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', coverImage: '', category: '' });
  const [newItem, setNewItem] = useState({ name: '', price: 0, imageUrl: '' });

  useEffect(() => { loadCatalogs(); }, [view]);

  const loadCatalogs = async () => {
    setLoading(true);
    try {
      if (view === 'my') {
        const data = await api.getMyCatalogs();
        setCatalogs(data.catalogs || []);
      } else {
        const data = await api.getPublicCatalogs();
        setCatalogs(data.catalogs || []);
      }
    } catch {} finally { setLoading(false); }
  };

  const handleCreate = async () => {
    try {
      const catalog = await api.createSocialCatalog(form);
      setCatalogs(prev => [catalog, ...prev]);
      setShowCreate(false);
      setForm({ title: '', description: '', coverImage: '', category: '' });
    } catch {}
  };

  const handlePublish = async (id: string) => {
    try {
      const updated = await api.publishSocialCatalog(id);
      setCatalogs(prev => prev.map(c => c.id === id ? updated : c));
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteSocialCatalog(id);
      setCatalogs(prev => prev.filter(c => c.id !== id));
    } catch {}
  };

  const handleAddItem = async (catalogId: string) => {
    if (!newItem.name) return;
    try {
      const item = await api.addCatalogItem(catalogId, newItem);
      setCatalogs(prev => prev.map(c =>
        c.id === catalogId ? { ...c, items: [...(c.items || []), item] } : c
      ));
      setNewItem({ name: '', price: 0, imageUrl: '' });
    } catch {}
  };

  const openDetail = (catalog: SocialCatalog) => {
    setSelectedCatalog(catalog);
    setShowDetail(true);
  };

  return (
    <div className="ig-catalogs">
      <div className="ig-catalog-top">
        <div className="ig-catalog-tabs">
          <button className={`ig-catalog-tab ${view === 'my' ? 'active' : ''}`} onClick={() => setView('my')}>Mis Catálogos</button>
          <button className={`ig-catalog-tab ${view === 'explore' ? 'active' : ''}`} onClick={() => setView('explore')}>Explorar</button>
        </div>
        <button className="ig-btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={18} /> Nuevo
        </button>
      </div>

      {showCreate && (
        <div className="ig-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="ig-modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="ig-modal-header">
              <h2>Crear Nuevo Catálogo</h2>
              <button className="ig-modal-close-btn" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <div className="ig-modal-body">
              <div className="ig-catalog-create-form">
                <input placeholder="Título del catálogo" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                <textarea placeholder="Descripción" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                <input placeholder="URL de imagen de portada" value={form.coverImage} onChange={e => setForm(p => ({ ...p, coverImage: e.target.value }))} />
                <button className="ig-btn-primary" onClick={handleCreate}>Crear Catálogo</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? <CatalogGridSkeleton /> : (
        <div className="ig-catalog-grid">
          {catalogs.map(catalog => (
            <div key={catalog.id} className="ig-catalog-card" onClick={() => openDetail(catalog)}>
              <div className="ig-catalog-cover" style={{
                background: catalog.coverImage
                  ? `url(${catalog.coverImage}) center/cover`
                  : 'linear-gradient(135deg, var(--color-primary), var(--color-secondary, #667eea))',
              }}>
                <span className={`ig-catalog-badge ${catalog.status}`}>
                  {catalog.status === 'published' ? 'Publicado' : 'Borrador'}
                </span>
              </div>
              <div className="ig-catalog-info">
                <h3>{catalog.title}</h3>
                <span>{catalog._count?.items || catalog.items?.length || 0} productos</span>
              </div>
              {view === 'my' && (
                <div className="ig-catalog-actions" onClick={e => e.stopPropagation()}>
                  {catalog.status === 'draft' && (
                    <button className="ig-action-sm primary" title="Publicar" onClick={() => handlePublish(catalog.id)}>
                      <Send size={14} />
                    </button>
                  )}
                  <button className="ig-action-sm" title="Eliminar" onClick={() => handleDelete(catalog.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showDetail && selectedCatalog && (
        <div className="ig-modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="ig-modal-content ig-catalog-detail" onClick={e => e.stopPropagation()}>
            <button className="ig-modal-close" onClick={() => setShowDetail(false)}>×</button>
            <div className="ig-catalog-detail-layout">
              <div className="ig-catalog-detail-left">
                <img src={selectedCatalog.coverImage || 'https://via.placeholder.com/400'} alt="" />
              </div>
              <div className="ig-catalog-detail-right">
                <h2>{selectedCatalog.title}</h2>
                {selectedCatalog.description && <p>{selectedCatalog.description}</p>}
                <div className="ig-catalog-detail-items">
                  {(selectedCatalog.items || []).map(item => (
                    <div key={item.id} className="ig-catalog-detail-item">
                      {item.imageUrl && <img src={item.imageUrl} alt="" />}
                      <div>
                        <strong>{item.name}</strong>
                        {item.price > 0 && <span>{formatUsd(item.price)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
                {view === 'my' && selectedCatalog.status === 'draft' && (
                  <div className="ig-catalog-add-item">
                    <input placeholder="Nombre" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} />
                    <input placeholder="Precio" type="number" value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: Number(e.target.value) }))} />
                    <input placeholder="URL imagen" value={newItem.imageUrl} onChange={e => setNewItem(p => ({ ...p, imageUrl: e.target.value }))} />
                    <button className="ig-btn-primary" onClick={() => handleAddItem(selectedCatalog.id)}>Agregar</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
