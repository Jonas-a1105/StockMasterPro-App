import styles from '../pages/DashboardPage.module.css';

export function CriticalStockList({ products }: { products: any[] }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>Alertas de stock crítico</div>
      <div className={styles.cardBody}>
        {products.length === 0 ? (
          <p className={styles.muted}>No hay productos con stock bajo.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'var(--bg-main, #1c1c1c)', color: 'var(--text-muted, #888)', textTransform: "none", fontSize: 9, letterSpacing: '0.5px', borderBottom: '1px solid var(--border-color, #333)' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Producto</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Código</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Mínimo</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Disponible</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 10).map(p => {
                  const isBelowMin = p.stock < p.minStock;
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color, #222)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-main, #111)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '10px 10px', color: 'var(--text-dark, #fff)', fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: '10px 10px', color: 'var(--text-muted, #888)' }}>{p.barcode || '—'}</td>
                      <td style={{ padding: '10px 10px', textAlign: 'right', color: 'var(--text-muted, #888)' }}>{p.minStock} u.</td>
                      <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 700, color: isBelowMin ? 'var(--color-danger, #dc2626)' : 'var(--color-orange-red, #f97316)' }}>{p.stock} u.</td>
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
