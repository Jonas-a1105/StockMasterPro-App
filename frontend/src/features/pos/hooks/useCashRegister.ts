import { useState, useEffect, useCallback } from 'react';
import { api } from '@shared/lib/http/client';
import { useToast } from '@contexts/ToastContext';

interface CashClosing {
  opening: number;
  sales: number;
  expenses: number;
  expected: number;
  declared: number;
  difference: number;
  date: string;
  id?: string;
}

interface UseCashRegisterReturn {
  showCashModal: boolean;
  setShowCashModal: (v: boolean) => void;
  cashOpening: number;
  setCashOpening: (v: number) => void;
  cashSalesTotal: number;
  setCashSalesTotal: (v: number) => void;
  declaredAmount: number;
  setDeclaredAmount: (v: number) => void;
  isTodayOpen: boolean;
  currentSessionId: string | null;
  cashClosings: CashClosing[];
  addClosing: (closing: CashClosing) => void;
  openCash: (amount: number) => Promise<void>;
  closeCash: (declared: number) => Promise<{ difference: number }>;
  showExpenseModal: boolean;
  setShowExpenseModal: (v: boolean) => void;
  addExpense: (amount: number, reason: string) => Promise<void>;
}

export function useCashRegister(): UseCashRegisterReturn {
  const { showToast } = useToast();
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashOpening, setCashOpening] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [cashSalesTotal, setCashSalesTotal] = useState(0);
  const [cashExpensesTotal, setCashExpensesTotal] = useState(0);
  const [declaredAmount, setDeclaredAmount] = useState(0);
  const [cashClosings, setCashClosings] = useState<CashClosing[]>([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const session = await api.getCurrentCashSession();
        if (session && session.status === 'open') {
          setCurrentSessionId(session.id);
          setCashOpening(Number(session.openingBalance));

          const txns = await api.getCashSessionTransactions(session.id);
          const sales = txns.filter((t: any) => t.type === 'sale').reduce((s: number, t: any) => s + Number(t.amount), 0);
          const expenses = txns.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + Number(t.amount), 0);
          setCashSalesTotal(sales);
          setCashExpensesTotal(expenses);
        }
      } catch {
        // No open session - normal
      }
    })();

    (async () => {
      try {
        const sessions = await api.getCashSessions();
        setCashClosings(
          (sessions || [])
            .filter((s: any) => s.status === 'closed')
            .map((s: any) => ({
              opening: Number(s.openingBalance),
              sales: 0,
              expenses: 0,
              expected: Number(s.closingBalance),
              declared: Number(s.actualBalance),
              difference: Number(s.difference),
              date: s.closedAt || s.createdAt,
              id: s.id,
            }))
        );
      } catch {
        // Silent
      }
    })();
  }, []);

  const isTodayOpen = currentSessionId != null;

  const refreshSession = useCallback(async () => {
    try {
      const session = await api.getCurrentCashSession();
      if (session && session.status === 'open') {
        setCurrentSessionId(session.id);
        setCashOpening(Number(session.openingBalance));
        const txns = await api.getCashSessionTransactions(session.id);
        const sales = txns.filter((t: any) => t.type === 'sale').reduce((s: number, t: any) => s + Number(t.amount), 0);
        const expenses = txns.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + Number(t.amount), 0);
        setCashSalesTotal(sales);
        setCashExpensesTotal(expenses);
      }
    } catch {
      // No open session
    }
  }, []);

  const openCash = async (amount: number) => {
    try {
      const session = await api.openCashSession({ openingBalance: amount });
      setCurrentSessionId(session.id);
      setCashOpening(amount);
      setCashSalesTotal(0);
      setCashExpensesTotal(0);
      setShowCashModal(false);
      showToast('Caja abierta correctamente', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al abrir caja', 'error');
    }
  };

  const closeCash = async (declared: number) => {
    if (!currentSessionId) return { difference: 0 };
    try {
      await api.closeCashSession(currentSessionId, { actualBalance: declared });
      const expected = cashOpening + cashSalesTotal - cashExpensesTotal;
      const diff = declared - expected;
      const closing: CashClosing = {
        opening: cashOpening, sales: cashSalesTotal, expenses: cashExpensesTotal,
        expected, declared, difference: diff, date: new Date().toISOString(),
      };
      setCashClosings(prev => [...prev, closing]);
      setCurrentSessionId(null);
      setCashOpening(0);
      setCashSalesTotal(0);
      setCashExpensesTotal(0);
      setDeclaredAmount(0);
      setShowCashModal(false);
      showToast('Caja cerrada correctamente', 'success');
      return { difference: diff };
    } catch (err: any) {
      showToast(err.message || 'Error al cerrar caja', 'error');
      return { difference: 0 };
    }
  };

  const addClosing = (closing: CashClosing) => {
    setCashClosings(prev => [...prev, closing]);
  };

  const addExpense = async (amount: number, reason: string) => {
    if (!currentSessionId) return;
    try {
      await api.addCashTransaction(currentSessionId, { amount, type: 'expense', description: reason });
      setCashExpensesTotal(prev => prev + amount);
      setShowExpenseModal(false);
      showToast('Gasto registrado', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al registrar gasto', 'error');
    }
  };

  return {
    showCashModal, setShowCashModal,
    cashOpening, setCashOpening,
    cashSalesTotal: cashSalesTotal - cashExpensesTotal,
    setCashSalesTotal,
    declaredAmount, setDeclaredAmount,
    isTodayOpen,
    currentSessionId,
    cashClosings, addClosing,
    openCash, closeCash,
    showExpenseModal, setShowExpenseModal,
    addExpense,
  };
}
