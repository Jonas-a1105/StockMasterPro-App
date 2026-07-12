import { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { useTheme } from '@contexts/ThemeContext';
import { SkeletonTable } from '@shared/ui/Skeleton';
import { LoadingDots } from '@shared/ui/LoadingDots';
import { getInventoryProducts, getInventoryMovements } from '../api/inventory.api';
import type { Product, InventoryMovement } from '@types';
import styles from '../pages/InventoryPage.module.css';
import tableStyles from '@shared/ui/TableList.module.css';

export function KardexTab() {
  const { config } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getInventoryProducts()
      .then(setProducts)
      .catch(() => {});
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.barcode?.includes(productSearch)
  );

  const loadMovements = async (productId: string) => {
    setLoading(true);
    try {
      setMovements(await getInventoryMovements(productId));
    } catch {
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductSearch(product.name);
    setShowDropdown(false);
    loadMovements(product.id);
  };

  const typeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sale: 'Venta',
      purchase: 'Compra',
      adjustment: 'Ajuste',
      waste: 'Merma',
      return: 'Devolución',
      theft: 'Robo',
    };
    return labels[type] || type;
  };

  return (
    <>
      <div className={styles.header}>
        <h3 className={styles.sectionTitle}>Kardex de Inventario</h3>
      </div>
      <div className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.fieldFull}>
            <label>Producto</label>
            <div className={styles.selectWithSearch}>
              <input
                type="text"
                placeholder="Buscar producto..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setShowDropdown(true);
                  setSelectedProduct(null);
                  setMovements([]);
                }}
                onFocus={() => setShowDropdown(true)}
              />
              {showDropdown && filteredProducts.length > 0 && (
                <div className={styles.dropdown}>
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      className={styles.dropdownItem}
                      onClick={() => selectProduct(p)}
                    >
                      <span>{p.name}</span>
                      <span className={styles.dropdownMeta}>Stock: {p.stock}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedProduct && (
        <>
          <div className={styles.kardexInfo}>
            <Package size={18} />
            <span>
              <strong>{selectedProduct.name}</strong> — Stock actual: {selectedProduct.stock}
            </span>
          </div>
          {loading ? (
            config.skeletonEnabled ? (
              <SkeletonTable rows={5} cols={5} />
            ) : (
              <LoadingDots text="Cargando movimientos..." />
            )
          ) : (
            <div className={tableStyles.container}>
              <table className={tableStyles.table}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th className={styles.textAlignRight}>Cantidad</th>
                    <th>Referencia</th>
                    <th>Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={styles.empty}>
                        Sin movimientos
                      </td>
                    </tr>
                  ) : (
                    movements.map((m) => (
                      <tr key={m.id}>
                        <td>{new Date(m.createdAt).toLocaleString()}</td>
                        <td>
                          <span
                            className={`${tableStyles.badge} ${m.type === 'sale' || m.type === 'exit' ? tableStyles.badgeSaturated : m.type === 'purchase' || m.type === 'entry' ? tableStyles.badgeActive : tableStyles.badgeWarning}`}
                          >
                            {typeLabel(m.type)}
                          </span>
                        </td>
                        <td className={styles.textAlignRight}>
                          <span
                            className={`${tableStyles.numberValue} ${styles.colorVar}`}
                            style={
                              {
                                '--color-var':
                                  m.quantity > 0 ? 'var(--color-success)' : 'var(--color-danger)',
                              } as React.CSSProperties
                            }
                          >
                            {m.quantity > 0 ? '+' : ''}
                            {m.quantity}
                          </span>
                        </td>
                        <td>{m.reference || '-'}</td>
                        <td>{m.userId ? m.userId.slice(0, 8) : '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
