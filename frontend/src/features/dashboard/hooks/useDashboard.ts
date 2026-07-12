import { useState, useEffect, useMemo } from 'react';
import { getDailySummary, getDashboardProducts, getDashboardSales } from '../api/dashboard.api';

function groupSalesByDate(sales: any[]) {
  const map: Record<string, number> = {};
  sales.forEach((s) => {
    const date = s.createdAt?.split('T')[0];
    if (date) {
      map[date] = (map[date] || 0) + s.total;
    }
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([date, total]) => ({ date: date.slice(5), total: Math.round(total * 100) / 100 }));
}

function getBestSellers(sales: any[], products: any[]) {
  const productCount: Record<string, { name: string; qty: number; total: number }> = {};
  sales.forEach((s) => {
    (s.items || []).forEach((item: any) => {
      const prod = products.find((p) => p.id === item.productId);
      const name = prod?.name || item.productName || 'Producto Eliminado';
      if (!productCount[name]) productCount[name] = { name, qty: 0, total: 0 };
      productCount[name].qty += item.quantity;
      productCount[name].total += item.subtotal;
    });
  });
  return Object.values(productCount)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
}

function getNetProfit(sales: any[]) {
  return sales.reduce((sum, s) => {
    const cost = (s.items || []).reduce((c: number, i: any) => c + (i.cost || 0) * i.quantity, 0);
    return sum + (s.total - cost);
  }, 0);
}

export interface DashboardData {
  summary: { total: number; count: number };
  products: any[];
  sales: any[];
  loading: boolean;
}

export function useDashboard() {
  const [summary, setSummary] = useState({ total: 0, count: 0 });
  const [products, setProducts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDailySummary()
        .then(setSummary)
        .catch(() => {}),
      getDashboardProducts()
        .then(setProducts)
        .catch(() => {}),
      getDashboardSales(100)
        .then(setSales)
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const lowStockProducts = useMemo(() => products.filter((p) => p.stock <= p.minStock), [products]);

  const recentActivity = useMemo(() => {
    const items: { title: string; desc: string; time: string; color: string }[] = [];
    const now = Date.now();
    sales.slice(0, 4).forEach((s) => {
      const diff = now - new Date(s.createdAt).getTime();
      const mins = Math.floor(diff / 60000);
      const time =
        mins < 60
          ? `Hace ${mins} min`
          : mins < 1440
            ? `Hace ${Math.floor(mins / 60)} hr`
            : `Hace ${Math.floor(mins / 1440)} día${Math.floor(mins / 1440) > 1 ? 's' : ''}`;
      items.push({
        title: `Venta registrada ${s.invoiceNumber ? `#${s.invoiceNumber}` : ''}`,
        desc: `Total $${(s.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · ${s.paymentMethod || 'Caja Central'}`,
        time,
        color: '#22c55e',
      });
    });
    lowStockProducts.slice(0, 3).forEach((p) => {
      items.push({
        title: `Alerta: Stock Mínimo - ${p.name}`,
        desc: `Producto '${p.name}' alcanzó el límite de resguardo.`,
        time: 'Reciente',
        color: '#f97316',
      });
    });
    return items;
  }, [sales, lowStockProducts]);

  const totalStock = useMemo(() => products.reduce((sum, p) => sum + p.stock, 0), [products]);
  const salesChartData = useMemo(() => groupSalesByDate(sales), [sales]);
  const bestSellers = useMemo(() => getBestSellers(sales, products), [sales, products]);

  const bestSellersData = useMemo(() => {
    const totalQty = bestSellers.reduce((sum, p) => sum + p.qty, 0);
    return {
      items: bestSellers.map((p) => ({
        ...p,
        share: totalQty > 0 ? Math.round((p.qty / totalQty) * 100) : 0,
      })),
      totalQty,
    };
  }, [bestSellers]);

  const netProfit = useMemo(() => getNetProfit(sales), [sales]);

  const todaySales = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return sales.filter((s) => s.createdAt?.startsWith(today));
  }, [sales]);

  return {
    summary,
    products,
    sales,
    loading,
    lowStockProducts,
    recentActivity,
    totalStock,
    salesChartData,
    bestSellersData,
    netProfit,
    todaySales,
  };
}
