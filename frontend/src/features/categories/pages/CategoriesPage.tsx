import { useState, useEffect } from 'react';
import { api } from '@shared/lib/http/client';
import { useToast } from '@contexts/ToastContext';
import { Tag, Plus, Pencil, Trash2, Search, X, Package } from 'lucide-react';
import styles from './CategoriesPage.module.css';

export function CategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<any>(null);
  const [showDelete, setShowDelete] = useState<any>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getCategories();
      setCategories(data || []);
    } catch (err: any) {
      showToast(err.message || 'Error al cargar categorías', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.createCategory({ name: name.trim() });
      showToast('Categoría creada', 'success');
      setShowCreate(false);
      setName('');
      load();
    } catch (err: any) {
      showToast(err.message || 'Error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!showEdit || !name.trim()) return;
    setSaving(true);
    try {
      await api.updateCategory(showEdit.id, { name: name.trim() });
      showToast('Categoría actualizada', 'success');
      setShowEdit(null);
      setName('');
      load();
    } catch (err: any) {
      showToast(err.message || 'Error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    setSaving(true);
    try {
      await api.deleteCategory(showDelete.id);
      showToast('Categoría eliminada', 'success');
      setShowDelete(null);
      load();
    } catch (err: any) {
      showToast(err.message || 'Error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filtered = categories.filter(
    (c) => !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderModal = () => {
    const isEdit = !!showEdit;
    const onClose = () => {
      setShowCreate(false);
      setShowEdit(null);
      setName('');
    };
    const onSave = isEdit ? handleEdit : handleCreate;
    const title = isEdit ? 'Editar categoría' : 'Nueva categoría';

    if (!showCreate && !showEdit) return null;

    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3 className={styles.modalTitle}>{title}</h3>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={18} />
            </button>
          </div>
          <div className={styles.modalBody}>
            <label className={styles.label}>Nombre</label>
            <input
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSave()}
              placeholder="Nombre de la categoría"
              autoFocus
            />
          </div>
          <div className={styles.modalFooter}>
            <button className={styles.cancelBtn} onClick={onClose}>
              Cancelar
            </button>
            <button className={styles.saveBtn} onClick={onSave} disabled={!name.trim() || saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDeleteModal = () => {
    if (!showDelete) return null;
    const productCount = showDelete._count?.products || 0;
    return (
      <div className={styles.overlay} onClick={() => setShowDelete(null)}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3 className={styles.modalTitle}>Eliminar categoría</h3>
            <button className={styles.closeBtn} onClick={() => setShowDelete(null)}>
              <X size={18} />
            </button>
          </div>
          <div className={styles.modalBody}>
            <p className={styles.m0}>
              ¿Eliminar <strong>{showDelete.name}</strong>?
            </p>
            {productCount > 0 && (
              <p className={styles.warningText}>
                <Package size={14} className={styles.inlineIcon} />
                {productCount} producto{productCount !== 1 ? 's' : ''} perderán esta categoría.
              </p>
            )}
          </div>
          <div className={styles.modalFooter}>
            <button className={styles.cancelBtn} onClick={() => setShowDelete(null)}>
              Cancelar
            </button>
            <button className={styles.deleteBtn} onClick={handleDelete} disabled={saving}>
              {saving ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Categorías</h2>
          <p className={styles.subtitle}>
            {categories.length} categoría{categories.length !== 1 ? 's' : ''} registradas
          </p>
        </div>
        <button
          className={styles.addBtn}
          onClick={() => {
            setName('');
            setShowCreate(true);
          }}
        >
          <Plus size={18} /> Nueva categoría
        </button>
      </div>

      <div className={styles.searchBar}>
        <Search size={16} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar categorías..."
        />
        {search && (
          <button className={styles.clearBtn} onClick={() => setSearch('')}>
            <X size={16} />
          </button>
        )}
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th className={styles.thCenter100}>Productos</th>
              <th className={styles.thWidth180}>Creada</th>
              <th className={styles.thCenter100}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className={styles.emptyCell}>
                  Cargando...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.emptyCell}>
                  {search ? 'Sin resultados' : 'No hay categorías. Crea la primera.'}
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className={styles.cellName}>
                      <Tag size={14} className={styles.tagIcon} />
                      <span>{c.name}</span>
                    </div>
                  </td>
                  <td className={styles.textCenter}>{c._count?.products ?? 0}</td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className={styles.textCenter}>
                    <div className={styles.actions}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => {
                          setShowEdit(c);
                          setName(c.name);
                        }}
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={() => setShowDelete(c)}
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {renderModal()}
      {renderDeleteModal()}
    </div>
  );
}
