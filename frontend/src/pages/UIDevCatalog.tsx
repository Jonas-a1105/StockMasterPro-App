import { useState, useEffect, useMemo } from 'react';
import { Button, Card, CardHeader, CardTitle, CardBody, CardFooter, Badge, Input, Select, Text, EmptyState, FormField, Toolbar } from '@shared/ui';
import { DataTable } from '@features/shared-ui';
import { InventoryProductCard } from '@features/inventory/components/InventoryProductCard';
import { ThemeProvider } from '@contexts/ThemeContext';
import styles from './UIDevCatalog.module.css';

const COMPONENTS = [
  {
    name: 'Button',
    variants: [
      { label: 'Primary', props: { variant: 'primary', children: 'Primary' } },
      { label: 'Secondary', props: { variant: 'secondary', children: 'Secondary' } },
      { label: 'Danger', props: { variant: 'danger', children: 'Danger' } },
      { label: 'Ghost', props: { variant: 'ghost', children: 'Ghost' } },
      { label: 'Loading', props: { variant: 'primary', loading: true, children: 'Loading' } },
      { label: 'Disabled', props: { variant: 'primary', disabled: true, children: 'Disabled' } },
    ],
  },
  {
    name: 'Card',
    variants: [
      { label: 'Default', props: { children: <><CardTitle>Título</CardTitle><CardBody>Contenido de la tarjeta</CardBody></> } },
      { label: 'Con Header', props: { children: <><CardHeader><CardTitle>Con Header</CardTitle></CardHeader><CardBody>Contenido</CardBody></> } },
      { label: 'Clickable', props: { onClick: () => {}, children: <><CardTitle>Clickable</CardTitle><CardBody>Click para probar</CardBody></> } },
      { label: 'Sin Padding', props: { padding: false, children: <CardBody>Sin padding</CardBody> } },
    ],
  },
  {
    name: 'Badge',
    variants: [
      { label: 'Default', props: { variant: 'default', children: 'Default' } },
      { label: 'Success', props: { variant: 'success', children: 'Success' } },
      { label: 'Danger', props: { variant: 'danger', children: 'Danger' } },
      { label: 'Warning', props: { variant: 'warning', children: 'Warning' } },
      { label: 'Info', props: { variant: 'info', children: 'Info' } },
    ],
  },
  {
    name: 'Text',
    variants: [
      { label: 'H1', props: { variant: 'h1', children: 'Heading 1' } },
      { label: 'H2', props: { variant: 'h2', children: 'Heading 2' } },
      { label: 'H3', props: { variant: 'h3', children: 'Heading 3' } },
      { label: 'H4', props: { variant: 'h4', children: 'Heading 4' } },
      { label: 'Body', props: { variant: 'body', children: 'Texto body normal' } },
      { label: 'Body Small', props: { variant: 'body-sm', children: 'Texto body small' } },
      { label: 'Description', props: { variant: 'description', children: 'Descripción muted' } },
      { label: 'Caption', props: { variant: 'caption', children: 'Caption text' } },
      { label: 'Label', props: { variant: 'label', children: 'Label text' } },
      { label: 'Muted', props: { variant: 'body', color: 'muted', children: 'Color muted' } },
      { label: 'Primary', props: { variant: 'body', color: 'primary', children: 'Color primary' } },
      { label: 'Danger', props: { variant: 'body', color: 'danger', children: 'Color danger' } },
      { label: 'Success', props: { variant: 'body', color: 'success', children: 'Color success' } },
    ],
  },
  {
    name: 'Input',
    variants: [
      { label: 'Default', props: { placeholder: 'Placeholder...' } },
      { label: 'Con Label', props: { label: 'Email', placeholder: 'usuario@ejemplo.com' } },
      { label: 'Con Error', props: { label: 'Email', value: 'invalid', error: 'Email inválido' } },
      { label: 'Con Helper', props: { label: 'Password', type: 'password', helperText: 'Mínimo 8 caracteres' } },
      { label: 'Disabled', props: { placeholder: 'Disabled', disabled: true } },
    ],
  },
  {
    name: 'Select',
    variants: [
      { label: 'Default', props: { options: [{ value: '1', label: 'Opción 1' }, { value: '2', label: 'Opción 2' }, { value: '3', label: 'Opción 3' }], placeholder: 'Selecciona...' } },
      { label: 'Con Label', props: { label: 'País', options: [{ value: 've', label: 'Venezuela' }, { value: 'co', label: 'Colombia' }, { value: 'mx', label: 'México' }], placeholder: 'Selecciona país' } },
      { label: 'Con Error', props: { label: 'Ciudad', options: [{ value: '1', label: 'Caracas' }], error: 'Requerido' } },
      { label: 'Disabled', props: { options: [{ value: '1', label: 'Opción 1' }], disabled: true } },
    ],
  },
  {
    name: 'Table (simple)',
    variants: [
      { label: 'Basic', props: { simple: true, data: [{ id: 1, name: 'Producto A', price: 100, stock: 10 }, { id: 2, name: 'Producto B', price: 200, stock: 5 }, { id: 3, name: 'Producto C', price: 50, stock: 0 }], columns: [{ key: 'name', header: 'Nombre' }, { key: 'price', header: 'Precio', align: 'right' }, { key: 'stock', header: 'Stock', align: 'center' }], keyExtractor: (r) => r.id } },
      { label: 'Striped', props: { simple: true, data: [{ id: 1, name: 'A', price: 100 }, { id: 2, name: 'B', price: 200 }, { id: 3, name: 'C', price: 300 }], columns: [{ key: 'name', header: 'Nombre' }, { key: 'price', header: 'Precio' }], keyExtractor: (r) => r.id, striped: true } },
      { label: 'Con Acciones', props: { simple: true, data: [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }], columns: [{ key: 'name', header: 'Nombre' }, { key: 'actions', header: 'Acciones', render: (r) => <span>Editar / Eliminar</span> }], keyExtractor: (r) => r.id } },
      { label: 'Empty', props: { simple: true, data: [], columns: [{ key: 'name', header: 'Nombre' }], keyExtractor: (r) => r.id, emptyMessage: 'No hay datos' } },
    ],
  },
  {
    name: 'EmptyState',
    variants: [
      { label: 'Default', props: { title: 'No hay datos', description: 'Intenta cambiar los filtros' } },
      { label: 'Search', props: { variant: 'search', title: 'Sin resultados', description: 'No se encontraron coincidencias' } },
      { label: 'Warning', props: { variant: 'warning', title: 'Atención', description: 'Requiere configuración', action: { label: 'Configurar', onClick: () => {} } } },
      { label: 'Empty', props: { variant: 'empty', title: 'Vacío', description: 'No hay elementos' } },
    ],
  },
  {
    name: 'Toolbar',
    variants: [
      { label: 'Default', props: { search: { value: '', onChange: () => {}, placeholder: 'Buscar...' }, addBtn: { label: 'Nuevo', onClick: () => {} } } },
      { label: 'Con Export/Import', props: { search: { value: '', onChange: () => {}, placeholder: 'Buscar...' }, onExport: () => {}, onImport: () => {}, addBtn: { label: 'Nuevo', onClick: () => {} } } },
      { label: 'Sin Search', props: { addBtn: { label: 'Nuevo', onClick: () => {} } } },
    ],
  },
  {
    name: 'DataTable',
    variants: [
      { label: 'Default', props: { data: [{ id: 1, name: 'Item 1', status: 'active' }, { id: 2, name: 'Item 2', status: 'pending' }], columns: [{ key: 'name', header: 'Nombre' }, { key: 'status', header: 'Estado', render: (r) => <Badge variant={r.status === 'active' ? 'success' : 'warning'}>{r.status}</Badge> }], keyExtractor: (r) => r.id, searchable: true, sortable: true, onAdd: () => {} } },
      { label: 'Con Filtros', props: { data: [{ id: 1, name: 'Item 1', type: 'type1' }, { id: 2, name: 'Item 2', type: 'type2' }], columns: [{ key: 'name', header: 'Nombre' }, { key: 'type', header: 'Tipo' }], keyExtractor: (r) => r.id, filterable: true, filterOptions: [{ key: 'type', label: 'Tipo', options: [{ value: 'type1', label: 'Tipo 1' }, { value: 'type2', label: 'Tipo 2' }] }] } },
    ],
  },
  {
    name: 'InventoryProductCard',
    variants: [
      { label: 'Con Imagen', props: { product: { id: 1, name: 'Producto Demo', price: 100, cost: 60, stock: 15, minStock: 5, imageUrl: 'https://picsum.photos/seed/product/200' }, onView: () => {}, onEdit: () => {}, onDelete: () => {}, canEdit: true } },
      { label: 'Sin Imagen', props: { product: { id: 2, name: 'Sin Imagen', price: 50, cost: 30, stock: 0, minStock: 5 }, onView: () => {}, onEdit: () => {}, onDelete: () => {}, canEdit: true } },
      { label: 'Stock Bajo', props: { product: { id: 3, name: 'Stock Bajo', price: 200, cost: 150, stock: 3, minStock: 10 }, onView: () => {}, onEdit: () => {}, onDelete: () => {}, canEdit: true } },
      { label: 'Agotado', props: { product: { id: 4, name: 'Agotado', price: 50, cost: 30, stock: 0, minStock: 5 }, onView: () => {}, onEdit: () => {}, onDelete: () => {}, canEdit: true } },
      { label: 'Solo Ver', props: { product: { id: 5, name: 'Solo Ver', price: 100, cost: 60, stock: 20, minStock: 5 }, onView: () => {}, onEdit: () => {}, onDelete: () => {}, canEdit: false } },
    ],
  },
];

export function UIDevCatalog() {
  const [theme, setTheme] = useState('light');
  const [search, setSearch] = useState('');

  const filteredComponents = useMemo(() => {
    if (!search) return COMPONENTS;
    return COMPONENTS.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.variants.some((v) => v.label.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="uidc-root">
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>🎨 UI Dev Catalog</h1>
          <span className={styles.beta}>Solo desarrollo</span>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.search}>
            <input
              type="text"
              placeholder="Buscar componente o variante..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.themeToggle}>
            <Button variant="secondary" size="sm" onClick={() => setTheme('light')}>☀️ Light</Button>
            <Button variant="secondary" size="sm" onClick={() => setTheme('dark')}>🌙 Dark</Button>
            <Button variant="secondary" size="sm" onClick={() => setTheme('oled')}>⚫ OLED</Button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <aside className={styles.sidebar}>
          <nav>
            {COMPONENTS.map((comp) => (
              <button
                key={comp.name}
                className={`${styles.sidebarItem} ${search && !comp.variants.some(v => v.label.toLowerCase().includes(search.toLowerCase())) ? styles.hidden : ''}`}
              >
                {comp.name} <span className={styles.count}>{comp.variants.length}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className={styles.content}>
          {filteredComponents.map((comp) => (
            <section key={comp.name} className={styles.section}>
              <h2 className={styles.sectionTitle}>{comp.name}</h2>
              <div className={styles.grid}>
                {comp.variants.map((variant) => (
                  <Card key={`${comp.name}-${variant.label}`} className={styles.card}>
                    <CardHeader>
                      <CardTitle>{variant.label}</CardTitle>
                    </CardHeader>
                    <CardBody className={styles.demo}>
{(() => {
                          try {
                            const ComponentMap = {
                              Button: () => import('@shared/ui/Button').then(m => m.Button),
                              Card: () => import('@shared/ui/Card').then(m => m.Card),
                              Badge: () => import('@shared/ui/Badge').then(m => m.Badge),
                              Text: () => import('@shared/ui/Text').then(m => m.Text),
                              Input: () => import('@shared/ui/Input').then(m => m.Input),
                              Select: () => import('@shared/ui/Select').then(m => m.Select),
                              Table: () => import('@shared/ui/DataTable').then(m => m.DataTable),
                              EmptyState: () => import('@shared/ui/EmptyState/EmptyState').then(m => m.EmptyState),
                              Toolbar: () => import('@shared/ui/Toolbar').then(m => m.Toolbar),
                              DataTable: () => import('@shared/ui/DataTable').then(m => m.DataTable),
                              InventoryProductCard: () => import('@features/inventory/components/InventoryProductCard').then(m => m.InventoryProductCard),
                            };
                            const Loader = ComponentMap[comp.name];
                            if (Loader) {
                              return <DemoWrapper loader={Loader} props={variant.props} />;
                            }
                            return <div className={styles.notImplemented}>Componente no disponible en demo</div>;
                          } catch {
                            return <div className={styles.error}>Error cargando componente</div>;
                          }
                        })()}
                    </CardBody>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

function DemoWrapper({ loader, props }) {
  const [Component, setComponent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loader()
      .then((mod) => setComponent(mod.default))
      .catch((err) => setError(err.message));
  }, [loader]);

  if (error) return <div className={styles.error}>Error: {error}</div>;
  if (!Component) return <div className={styles.loading}>Cargando...</div>;

  return <Component {...props} />;
}

export default UIDevCatalog;
