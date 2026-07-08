import { useState, useEffect } from 'react';

const STORAGE_KEY_CLOSINGS = 'stockmaster-cash';
const STORAGE_KEY_OPENING = 'stockmaster-cash-opening';
const STORAGE_KEY_SALES = 'stockmaster-cash-sales';
const STORAGE_KEY_EXPENSES = 'stockmaster-expenses';

interface CashClosing {
  opening: number;
  sales: number;
  expected: number;
  declared: number;
  difference: number;
  date: string;
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
  cashClosings: CashClosing[];
  addClosing: (closing: CashClosing) => void;
  openCash: (amount: number) => void;
  closeCash: (declared: number) => { difference: number };
  showExpenseModal: boolean;
  setShowExpenseModal: (v: boolean) => void;
  addExpense: (amount: number, reason: string) => void;
}

export function useCashRegister(): UseCashRegisterReturn {
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashOpening, setCashOpening] = useState(0);
  const [cashOpeningDate, setCashOpeningDate] = useState<string | null>(null);
  const [cashSalesTotal, setCashSalesTotal] = useState(0);
  const [declaredAmount, setDeclaredAmount] = useState(0);
  const [cashClosings, setCashClosings] = useState<CashClosing[]>([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  useEffect(() => {
    const savedClosings = localStorage.getItem(STORAGE_KEY_CLOSINGS);
    if (savedClosings) setCashClosings(JSON.parse(savedClosings));

    const savedOpening = localStorage.getItem(STORAGE_KEY_OPENING);
    if (savedOpening) {
      const data = JSON.parse(savedOpening);
      if (new Date(data.date).toDateString() === new Date().toDateString()) {
        setCashOpening(data.amount);
        setCashOpeningDate(data.date);
      }
    }

    const savedCashSales = localStorage.getItem(STORAGE_KEY_SALES);
    if (savedCashSales) setCashSalesTotal(parseFloat(savedCashSales));
  }, []);

  const isTodayOpen = cashOpeningDate != null && new Date(cashOpeningDate).toDateString() === new Date().toDateString();

  const openCash = (amount: number) => {
    const data = { amount, date: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY_OPENING, JSON.stringify(data));
    setCashOpeningDate(data.date);
    setCashSalesTotal(0);
    localStorage.setItem(STORAGE_KEY_SALES, '0');
    setShowCashModal(false);
  };

  const closeCash = (declared: number) => {
    const expected = cashOpening + cashSalesTotal;
    const diff = declared - expected;
    const closing: CashClosing = {
      opening: cashOpening, sales: cashSalesTotal, expected,
      declared, difference: diff, date: new Date().toISOString(),
    };
    const updated = [...cashClosings, closing];
    setCashClosings(updated);
    localStorage.setItem(STORAGE_KEY_CLOSINGS, JSON.stringify(updated));
    localStorage.removeItem(STORAGE_KEY_OPENING);
    setCashOpening(0);
    setCashOpeningDate(null);
    setDeclaredAmount(0);
    setShowCashModal(false);
    return { difference: diff };
  };

  const addClosing = (closing: CashClosing) => {
    const updated = [...cashClosings, closing];
    setCashClosings(updated);
    localStorage.setItem(STORAGE_KEY_CLOSINGS, JSON.stringify(updated));
  };

  const addExpense = (amount: number, reason: string) => {
    const expenses = JSON.parse(localStorage.getItem(STORAGE_KEY_EXPENSES) || '[]');
    expenses.push({ amount, reason, date: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(expenses));
    setShowExpenseModal(false);
  };

  return {
    showCashModal, setShowCashModal,
    cashOpening, setCashOpening,
    cashSalesTotal, setCashSalesTotal,
    declaredAmount, setDeclaredAmount,
    isTodayOpen,
    cashClosings, addClosing,
    openCash, closeCash,
    showExpenseModal, setShowExpenseModal,
    addExpense,
  };
}
