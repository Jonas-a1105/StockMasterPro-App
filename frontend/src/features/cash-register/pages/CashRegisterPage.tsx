import { useState, useEffect } from 'react';
import { api } from '@shared/lib/http/client';
import { useToast } from '@contexts/ToastContext';
import { Modal } from '@shared/ui/Modal';
import { LoadingDots } from '@shared/ui/LoadingDots';
import { KpiGrid } from '@features/shared-ui/KpiGrid';
import { Toolbar } from '@features/shared-ui/Toolbar';
import { TabNav } from '@shared/ui/TabNav';
import { SkeletonTablePage } from '@shared/ui/Skeleton';
import { useTheme } from '@contexts/ThemeContext';
import { Wallet, DollarSign, ArrowUpRight, ArrowDownRight, History } from 'lucide-react';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import styles from './CashRegisterPage.module.css';

export function CashRegisterPage() {
  const { showToast } = useToast();
  const { formatPrice } = useExchangeRate();
  const { config } = useTheme();
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [currentSession, setCurrentSession] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState(0);
  const [declaredAmount, setDeclaredAmount] = useState(0);
  const [txnAmount, setTxnAmount] = useState(0);
  const [txnType, setTxnType] = useState<'income' | 'expense'>('income');
  const [txnDesc, setTxnDesc] = useState('');

  const loadData = async () => {
    try {
      const [sessionsData] = await Promise.all([api.getCashSessions()]);
      setSessions(sessionsData || []);

      let session: any = null;
      try {
        session = await api.getCurrentCashSession();
      } catch {
        /* none */
      }
      setCurrentSession(session && session.status === 'open' ? session : null);

      if (session && session.status === 'open') {
        const txns = await api.getCashSessionTransactions(session.id);
        setTransactions(txns || []);
      } else {
        setTransactions([]);
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpen = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.openCashSession({ openingBalance: openingAmount });
      setShowOpenModal(false);
      showToast('Caja abierta correctamente', 'success');
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSession) return;
    setError('');
    setSaving(true);
    try {
      await api.closeCashSession(currentSession.id, { actualBalance: declaredAmount });
      setShowCloseModal(false);
      showToast('Caja cerrada correctamente', 'success');
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSession) return;
    setError('');
    setSaving(true);
    try {
      await api.addCashTransaction(currentSession.id, {
        amount: txnAmount,
        type: txnType,
        description: txnDesc,
      });
      setShowTxnModal(false);
      setTxnAmount(0);
      setTxnDesc('');
      showToast('Movimiento registrado', 'success');
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <SkeletonTablePage />;

  const txnIncome = currentSession
    ? transactions
        .filter((t: any) => t.type === 'income' || t.type === 'sale')
        .reduce((s: number, t: any) => s + Number(t.amount), 0)
    : 0;
  const txnExpense = currentSession
    ? transactions
        .filter((t: any) => t.type === 'expense')
        .reduce((s: number, t: any) => s + Number(t.amount), 0)
    : 0;
  const expectedClose = currentSession
    ? Number(currentSession.openingBalance) + txnIncome - txnExpense
    : 0;

  return (
    <>
      <Toolbar
        addBtn={
          currentSession
            ? undefined
            : {
                label: 'Abrir Caja',
                onClick: () => {
                  setOpeningAmount(0);
                  setError('');
                  setShowOpenModal(true);
                },
              }
        }
      />

      <KpiGrid
        kpis={[
          {
            label: 'Estado',
            value: currentSession ? 'Abierta' : 'Cerrada',
            icon: Wallet,
            color: currentSession ? 'var(--color-success)' : 'var(--color-text-muted)',
          },
          {
            label: 'Fondo Inicial',
            value: formatPrice(currentSession ? Number(currentSession.openingBalance) : 0),
            icon: DollarSign,
            color: 'var(--color-primary)',
          },
          {
            label: 'Ingresos',
            value: formatPrice(txnIncome),
            icon: ArrowUpRight,
            color: 'var(--color-success)',
          },
          {
            label: 'Egresos',
            value: formatPrice(txnExpense),
            icon: ArrowDownRight,
            color: 'var(--color-danger)',
          },
          {
            label: 'Esperado en Caja',
            value: formatPrice(expectedClose),
            icon: Wallet,
            color: 'var(--color-warning)',
          },
        ]}
      />

      <TabNav
        tabs={[
          { key: 'active', label: 'Turno Activo' },
          { key: 'history', label: 'Historial de Turnos' },
        ]}
        active={tab}
        onChange={(k) => setTab(k as any)}
      />

      {tab === 'active' ? (
        currentSession ? (
          <div className={styles.sessionCard}>
            <div className={styles.sessionHeader}>
              <span className={styles.sessionBadgeOpen}>Turno abierto</span>
              <span className={styles.sessionDate}>
                Desde {new Date(currentSession.openedAt).toLocaleString()}
              </span>
            </div>
            {currentSession.notes && <p className={styles.sessionNotes}>{currentSession.notes}</p>}

            <div className={styles.txnActions}>
              <button
                className={styles.actionBtn}
                onClick={() => {
                  setTxnAmount(0);
                  setTxnType('income');
                  setTxnDesc('');
                  setError('');
                  setShowTxnModal(true);
                }}
              >
                + Ingreso
              </button>
              <button
                className={styles.actionBtnDanger}
                onClick={() => {
                  setTxnAmount(0);
                  setTxnType('expense');
                  setTxnDesc('');
                  setError('');
                  setShowTxnModal(true);
                }}
              >
                - Egreso
              </button>
              <button
                className={styles.actionBtnClose}
                onClick={() => {
                  setDeclaredAmount(expectedClose);
                  setError('');
                  setShowCloseModal(true);
                }}
              >
                Cerrar Turno
              </button>
            </div>

            {transactions.length > 0 && (
              <div className={styles.txnTable}>
                <h4>Movimientos</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Monto</th>
                      <th>Descripción</th>
                      <th>Hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t: any) => (
                      <tr key={t.id}>
                        <td>
                          <span
                            className={`${styles.txnTypeBadge} ${t.type === 'expense' ? styles.txnExpense : t.type === 'income' ? styles.txnIncome : styles.txnSale}`}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td
                          className={
                            t.type === 'expense' ? styles.amountNegative : styles.amountPositive
                          }
                        >
                          {t.type === 'expense' ? '-' : '+'}
                          {formatPrice(Number(t.amount))}
                        </td>
                        <td>{t.description}</td>
                        <td className={styles.txnTime}>
                          {new Date(t.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Wallet size={48} />
            <p>No hay ningún turno de caja abierto</p>
            <button
              className={styles.openBtn}
              onClick={() => {
                setOpeningAmount(0);
                setError('');
                setShowOpenModal(true);
              }}
            >
              Abrir Caja
            </button>
          </div>
        )
      ) : (
        <div className={styles.historyList}>
          {sessions.length === 0 ? (
            <div className={styles.emptyState}>
              <History size={48} />
              <p>No hay turnos registrados</p>
            </div>
          ) : (
            sessions.map((s: any) => (
              <div key={s.id} className={styles.historyCard}>
                <div className={styles.historyHeader}>
                  <span
                    className={
                      s.status === 'open' ? styles.sessionBadgeOpen : styles.sessionBadgeClosed
                    }
                  >
                    {s.status === 'open' ? 'Abierto' : 'Cerrado'}
                  </span>
                  <span className={styles.historyDate}>
                    {new Date(s.openedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.historyDetails}>
                  <span>Apertura: {formatPrice(Number(s.openingBalance))}</span>
                  {s.closingBalance !== null && (
                    <span>Cierre: {formatPrice(Number(s.closingBalance))}</span>
                  )}
                  {s.difference !== null && (
                    <span
                      className={
                        Number(s.difference) >= 0 ? styles.diffPositive : styles.diffNegative
                      }
                    >
                      Diferencia: {formatPrice(Number(s.difference))}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Modal open={showOpenModal} onClose={() => setShowOpenModal(false)} title="Abrir Caja">
        <form onSubmit={handleOpen}>
          <div className={styles.formFields}>
            {error && <div className={styles.error}>{error}</div>}
            <label>Monto de apertura ($) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={openingAmount || ''}
              onChange={(e) => setOpeningAmount(Number(e.target.value))}
              required
              autoFocus
            />
          </div>
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => setShowOpenModal(false)}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.saveBtn} disabled={saving || openingAmount < 0}>
              {saving ? <LoadingDots /> : 'Abrir'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={showCloseModal} onClose={() => setShowCloseModal(false)} title="Cierre de Caja">
        {currentSession && (
          <form onSubmit={handleClose}>
            <div className={styles.formFields}>
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.summaryRow}>
                <span>Apertura</span>
                <span>{formatPrice(Number(currentSession.openingBalance))}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Ingresos</span>
                <span>+{formatPrice(txnIncome)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Egresos</span>
                <span>-{formatPrice(txnExpense)}</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                <span>Esperado</span>
                <span>{formatPrice(expectedClose)}</span>
              </div>
              <label>Dinero contado *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={declaredAmount || ''}
                onChange={(e) => setDeclaredAmount(Number(e.target.value))}
                required
                autoFocus
              />
              {declaredAmount > 0 && (
                <div className={`${styles.summaryRow} ${styles.summaryDiff}`}>
                  <span>Diferencia</span>
                  <span
                    className={
                      declaredAmount >= expectedClose ? styles.diffPositive : styles.diffNegative
                    }
                  >
                    {formatPrice(declaredAmount - expectedClose)}
                  </span>
                </div>
              )}
            </div>
            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setShowCloseModal(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={styles.saveBtn}
                disabled={saving || declaredAmount < 0}
              >
                {saving ? <LoadingDots /> : 'Cerrar Caja'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={showTxnModal}
        onClose={() => setShowTxnModal(false)}
        title="Registrar Movimiento"
      >
        <form onSubmit={handleAddTransaction}>
          <div className={styles.formFields}>
            {error && <div className={styles.error}>{error}</div>}
            <label>Tipo *</label>
            <select value={txnType} onChange={(e) => setTxnType(e.target.value as any)}>
              <option value="income">Ingreso</option>
              <option value="expense">Egreso</option>
            </select>
            <label>Monto ($) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={txnAmount || ''}
              onChange={(e) => setTxnAmount(Number(e.target.value))}
              required
            />
            <label>Descripción *</label>
            <input
              type="text"
              value={txnDesc}
              onChange={(e) => setTxnDesc(e.target.value)}
              required
              placeholder="Ej: Pago a proveedor, retiro..."
            />
          </div>
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => setShowTxnModal(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={saving || !txnAmount || !txnDesc}
            >
              {saving ? <LoadingDots /> : 'Registrar'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
