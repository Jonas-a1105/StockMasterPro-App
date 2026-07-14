// src/features/fiscal/pages/FiscalPage/FiscalPage.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  Stack,
  Text,
  TabNav,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Badge,
  Select,
  Input,
  Button
} from '@shared/ui';
import { SkeletonTablePage } from '@shared/ui/Skeleton';
import { useTheme } from '@contexts/ThemeContext';
import { getWithholdings, getFiscalBooks } from '../../api/fiscal.api';
import styles from './FiscalPage.module.css';

export function FiscalPage() {
  const { config } = useTheme();
  const [tab, setTab] = useState('retenciones');
  const [withholdings, setWithholdings] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookType, setBookType] = useState<'ventas' | 'compras'>('ventas');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'retenciones') {
        setWithholdings(await getWithholdings());
      } else {
        setBooks(
          await getFiscalBooks(bookType, dateRange.start || undefined, dateRange.end || undefined)
        );
      }
    } catch {
      // Control de errores silencioso preservado
    } finally {
      setLoading(false);
    }
  }, [tab, bookType, dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const tabs = [
    { key: 'retenciones', label: 'Retenciones', icon: null },
    { key: 'libros', label: 'Libros Fiscales', icon: null },
  ];

  if (loading) {
    return <SkeletonTablePage rows={8} cols={6} kpi={0} />;
  }

  // Opciones estructuradas para el componente abstracto Select
  const bookTypeOptions = [
    { value: 'ventas', label: 'Libro de Ventas' },
    { value: 'compras', label: 'Libro de Compras' },
  ];

  return (
    <Stack className={styles.pageContainer} gap="4">
      <Text variant="h2" className="fontWeight700">Fiscal Venezuela</Text>

      <TabNav tabs={tabs} activeTab={tab} onTabChange={setTab} />

      {tab === 'retenciones' && (
        <Stack gap="4">
          <Stack direction="row" className="itemsCenter gap3">
            <Text variant="h3" className="fontWeight600">Retenciones Registradas</Text>
          </Stack>

          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Tipo</TableHeaderCell>
                <TableHeaderCell>Proveedor</TableHeaderCell>
                <TableHeaderCell className="textRight">Base</TableHeaderCell>
                <TableHeaderCell className="textCenter">Tasa</TableHeaderCell>
                <TableHeaderCell className="textRight">Monto</TableHeaderCell>
                <TableHeaderCell>Factura</TableHeaderCell>
                <TableHeaderCell>Fecha</TableHeaderCell>
                <TableHeaderCell>Estado</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {withholdings.map((w: any) => (
                <TableRow key={w.id}>
                  <TableCell>
                    <Badge variant={w.type === 'iva' ? 'info' : 'warning'}>
                      {w.type === 'iva' ? 'IVA' : 'ISLR'}
                    </Badge>
                  </TableCell>
                  <TableCell>{w.supplier?.name || 'N/A'}</TableCell>
                  <TableCell className="textRight">${Number(w.baseAmount).toFixed(2)}</TableCell>
                  <TableCell className="textCenter">{Number(w.rate).toFixed(1)}%</TableCell>
                  <TableCell className="textRight fontWeight600">${Number(w.amount).toFixed(2)}</TableCell>
                  <TableCell>{w.invoiceNumber || '-'}</TableCell>
                  <TableCell>{w.createdAt ? new Date(w.createdAt).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <Badge variant="success">{w.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {withholdings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="textCenter p4 textMuted">
                    No hay retenciones registradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Stack>
      )}

      {tab === 'libros' && (
        <Stack gap="4">
          <Stack direction="row" className="itemsCenter justifyBetween flexWrap gap3">
            <Stack direction="row" className="itemsCenter gap2">
              <Text variant="label">Tipo:</Text>
              <Select
                value={bookType}
                onChange={(value) => setBookType(value as any)}
                options={bookTypeOptions}
              />
            </Stack>

            <Stack direction="row" className="itemsCenter gap2 flexWrap">
              <Text variant="label">Desde:</Text>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))}
              />
              <Text variant="label">Hasta:</Text>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))}
              />
            </Stack>

            <Button variant="primary" onClick={loadData}>
              Consultar
            </Button>
          </Stack>

          <Table>
            <TableHead>
              <TableRow>
                {bookType === 'ventas' ? (
                  <>
                    <TableHeaderCell>Factura</TableHeaderCell>
                    <TableHeaderCell>Fecha</TableHeaderCell>
                    <TableHeaderCell>Cliente</TableHeaderCell>
                    <TableHeaderCell>RIF/CI</TableHeaderCell>
                    <TableHeaderCell className="textRight">Subtotal</TableHeaderCell>
                    <TableHeaderCell className="textRight">IVA</TableHeaderCell>
                    <TableHeaderCell className="textRight">Dto.</TableHeaderCell>
                    <TableHeaderCell className="textRight">Total</TableHeaderCell>
                  </>
                ) : (
                  <>
                    <TableHeaderCell>Compra</TableHeaderCell>
                    <TableHeaderCell>Fecha</TableHeaderCell>
                    <TableHeaderCell>Proveedor</TableHeaderCell>
                    <TableHeaderCell>RIF</TableHeaderCell>
                    <TableHeaderCell className="textRight">Total</TableHeaderCell>
                    <TableHeaderCell className="textRight">Ret. IVA</TableHeaderCell>
                    <TableHeaderCell className="textRight">Ret. ISLR</TableHeaderCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {books.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={bookType === 'ventas' ? 8 : 7} className="textCenter p4 textMuted">
                    No hay datos en el período seleccionado
                  </TableCell>
                </TableRow>
              ) : (
                books.map((r: any, idx: number) => (
                  <TableRow key={idx}>
                    {bookType === 'ventas' ? (
                      <>
                        <TableCell className="fontMonospace">{r.invoiceNumber}</TableCell>
                        <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                        <TableCell>{r.customerName}</TableCell>
                        <TableCell>{r.customerTaxId}</TableCell>
                        <TableCell className="textRight">${r.subtotal.toFixed(2)}</TableCell>
                        <TableCell className="textRight">${r.tax.toFixed(2)}</TableCell>
                        <TableCell className="textRight">${r.discount.toFixed(2)}</TableCell>
                        <TableCell className="textRight fontWeight700">${r.total.toFixed(2)}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="fontMonospace">{r.invoiceNumber}</TableCell>
                        <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                        <TableCell>{r.supplierName}</TableCell>
                        <TableCell>{r.supplierTaxId}</TableCell>
                        <TableCell className="textRight">${r.total.toFixed(2)}</TableCell>
                        <TableCell className="textRight">${r.ivaWithholding.toFixed(2)}</TableCell>
                        <TableCell className="textRight">${r.islrWithholding.toFixed(2)}</TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Stack>
      )}
    </Stack>
  );
}