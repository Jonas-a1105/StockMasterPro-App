import { useState, useEffect } from 'react';
import { api } from '@shared/lib/http/client';
import { Pencil, Trash2, Users, Shield, UserCheck } from 'lucide-react';
import { useToast } from '@contexts/ToastContext';
import { Modal } from '@shared/ui/Modal';
import { LoadingDots } from '@shared/ui/LoadingDots';
import { ButtonLoader } from '@shared/ui/ButtonLoader';
import { SkeletonTablePage } from '@shared/ui/Skeleton';
import { useTheme } from '@contexts/ThemeContext';
import type { TenantUser } from '@types';
import { TabNav } from '@shared/ui/TabNav';
import { KpiGrid } from '@shared/ui/KpiGrid';
import { Toolbar } from '@shared/ui/Toolbar';
import styles from './UsersPage.module.css';

export function UsersPage() {
  const { showToast } = useToast();
  const { config } = useTheme();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<TenantUser | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'cajero' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const openEdit = (u: TenantUser) => {
    setEditingUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (editingUser) {
        const data: any = { name: form.name, email: form.email, role: form.role };
        if (form.password) data.password = form.password;
        await api.updateUser(editingUser.id, data);
      } else {
        await api.createUser({ ...form, password: form.password });
      }
      setShowModal(false);
      loadUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      await api.deleteUser(id);
      loadUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleActive = async (u: TenantUser) => {
    try {
      await api.updateUser(u.id, { isActive: !u.isActive });
      loadUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const roleBadgeClass = (role: string) => {
    if (role === 'admin') return styles.roleAdmin;
    if (role === 'gerente') return styles.roleGerente;
    return styles.roleCajero;
  };

  const roleLabel = (role: string) => {
    if (role === 'admin') return 'Admin';
    if (role === 'gerente') return 'Gerente';
    return 'Cajero';
  };

  const filteredUsers = users.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const activeUsers = users.filter(u => u.isActive !== false).length;

  if (loading) return config.skeletonEnabled ? <SkeletonTablePage rows={8} cols={6} kpi={3} /> : <LoadingDots text="Cargando usuarios" />;

  return (
    <div className={styles.container}>
      <TabNav
        tabs={[
          { key: 'usuarios', label: 'Usuarios', icon: <Users size={16} /> },
        ]}
        activeTab="usuarios"
        onTabChange={() => {}}
      />

      <KpiGrid
        items={[
          { icon: <Users size={18} />, value: totalUsers, label: 'Total Usuarios' },
          { icon: <Shield size={18} />, value: adminCount, label: 'Administradores', color: '#f05a28' },
          { icon: <UserCheck size={18} />, value: activeUsers, label: 'Activos', color: '#16a34a' },
        ]}
      />

      <Toolbar
        search={{ value: search, onChange: setSearch, placeholder: 'Buscar usuarios...' }}
        addBtn={{ label: 'Nuevo Usuario', onClick: () => { setShowModal(true); setEditingUser(null); setForm({ name: '', email: '', password: '', role: 'cajero' }); } }}
      />

      <div className="lista-container">
        <table className="lista-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th style={{textAlign:'center'}}>Estado</th>
              <th>Fecha Registro</th>
              <th style={{textAlign:'center'}}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id}>
                <td><span className="lista-name-text">{u.name}</span></td>
                <td style={{color:'var(--text-muted)'}}>{u.email}</td>
                <td><span className={`lista-badge ${roleBadgeClass(u.role)}`}>{roleLabel(u.role)}</span></td>
                <td style={{textAlign:'center'}}>
                  <span 
                    className={`lista-badge ${u.isActive ? 'active' : 'inactive'}`}
                    onClick={() => handleToggleActive(u)}
                    style={{ cursor: 'pointer' }}
                    title="Click para cambiar estado"
                  >
                    {u.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td style={{textAlign:'center'}}>
                  <div className="lista-actions" style={{justifyContent:'center'}}>
                    <button className="lista-action-btn" onClick={() => openEdit(u)} title="Editar">
                      <Pencil size={14} />
                    </button>
                    {u.role !== 'admin' && (
                      <button className="lista-action-btn danger" onClick={() => handleDelete(u.id)} title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No hay usuarios registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal open={showModal} onClose={() => setShowModal(false)} title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}>
          <div className={styles.modalContent}>
            <form onSubmit={handleSave} className={styles.form}>
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.field}>
                <label>Nombre</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Nombre del usuario" />
              </div>
              <div className={styles.field}>
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required placeholder="usuario@gmail.com" />
              </div>
              <div className={styles.field}>
                <label>Contraseña {editingUser && <span className={styles.optional}>(dejar vacío para no cambiar)</span>}</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required={!editingUser}
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className={styles.field}>
                <label>Rol</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  <option value="cajero">Cajero</option>
                  <option value="gerente">Gerente</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? <ButtonLoader /> : (editingUser ? 'Actualizar' : 'Crear Usuario')}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
