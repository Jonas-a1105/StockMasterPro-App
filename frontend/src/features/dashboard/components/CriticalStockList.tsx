import styles from '../pages/DashboardPage.module.css';

export function CriticalStockList({ products }: { products: any[] }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>Alertas de stock crítico</div>
      <div className={styles.cardBody}>
        {products.length === 0 ? (
          <p className={styles.muted}>No hay productos con stock bajo.</p>
        ) : (
          <div className={styles.stockTableWrap}>
            <table className={styles.stockTable}>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Código</th>
                  <th>Mínimo</th>
                  <th>Disponible</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 10).map((p) => {
                  const isBelowMin = p.stock < p.minStock;
                  return (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.barcode || '—'}</td>
                      <td>{p.minStock} u.</td>
                      <td
                        className={isBelowMin ? styles.stockValueDanger : styles.stockValueWarning}
                      >
                        {p.stock} u.
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
