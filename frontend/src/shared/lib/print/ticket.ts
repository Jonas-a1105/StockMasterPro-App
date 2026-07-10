interface TicketSale {
  id: string;
  createdAt: string | Date;
  total: number;
  paymentMethod?: string;
  items?: Array<{
    product?: { name?: string };
    name?: string;
    quantity: number;
    price: number;
    subtotal?: number;
    total?: number;
  }>;
  customer?: { name?: string } | null;
  discount?: number;
  taxRate?: number;
}

export function printTicket(sale: TicketSale): void {
  const itemsHtml = (sale.items || []).map(i =>
    `<tr><td style="padding:4px 6px">${i.product?.name || i.name || 'Producto'}</td><td style="padding:4px 6px;text-align:center">${i.quantity}</td><td style="padding:4px 6px;text-align:right">$${Number(i.price).toFixed(2)}</td><td style="padding:4px 6px;text-align:right">$${Number(i.subtotal || i.total || i.price * i.quantity).toFixed(2)}</td></tr>`
  ).join('');

  const ticketHtml = `
<div style="font-family:'Courier New',Courier,monospace;max-width:320px;margin:auto;background:#fff;padding:20px;color:#000">
  <h2 style="text-align:center;margin:0 0 4px;font-size:18px">StockMaster Pro</h2>
  <p style="text-align:center;margin:0 0 16px;font-size:11px;color:#666">${new Date(sale.createdAt).toLocaleString()}</p>
  <p style="text-align:center;margin:0 0 16px;font-size:11px;color:#666">#${String(sale.id).slice(0,8).toUpperCase()}</p>
  ${sale.customer?.name ? `<p style="font-size:12px;margin:0 0 8px">Cliente: ${sale.customer.name}</p>` : ''}
  <hr style="border-top:1px dashed #999;margin:8px 0" />
  <table style="width:100%;font-size:12px;border-collapse:collapse">
    <tr><th style="padding:4px 6px;text-align:left">Producto</th><th style="padding:4px 6px;text-align:center">Cnt</th><th style="padding:4px 6px;text-align:right">P/U</th><th style="padding:4px 6px;text-align:right">Total</th></tr>
    ${itemsHtml}
  </table>
  <hr style="border-top:1px dashed #999;margin:8px 0" />
  ${sale.discount ? `<div style="text-align:right;font-size:13px;margin:2px 0">Descuento: -$${Number(sale.discount).toFixed(2)}</div>` : ''}
  ${sale.taxRate ? `<div style="text-align:right;font-size:13px;margin:2px 0">IVA: ${(Number(sale.taxRate)*100).toFixed(0)}%</div>` : ''}
  <div style="text-align:right;font-size:16px;font-weight:bold;margin-top:6px">Total: $${Number(sale.total).toFixed(2)}</div>
  ${sale.paymentMethod ? `<p style="text-align:center;font-size:12px;color:#666;margin:8px 0 0">Método: ${sale.paymentMethod}</p>` : ''}
  <p style="text-align:center;font-size:11px;color:#999;margin-top:16px">¡Gracias por su compra!</p>
</div>`;

  const w = window.open('', '_blank', 'width=400,height=600');
  if (!w) return;
  w.document.write(`
    <html>
    <head>
      <title>Comprobante - StockMaster Pro</title>
      <style>
        body{background:#f1f5f9;margin:0;padding:25px;display:flex;flex-direction:column;align-items:center;font-family:system-ui,sans-serif}
        .actions{display:flex;gap:10px;margin-bottom:20px;width:100%;max-width:340px}
        .btn{flex:1;padding:10px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;text-align:center;border:none}
        .btn-print{background:#16a34a;color:#fff}
        .btn-close{background:#cbd5e1;color:#333}
        .ticket{background:#fff;border:1px dashed #aaa;border-radius:8px;padding:20px;width:100%;max-width:340px;box-sizing:border-box}
        @media print{.actions{display:none}body{background:#fff;padding:0}.ticket{border:none;box-shadow:none;padding:0;max-width:100%}}
      </style>
    </head>
    <body>
      <div class="actions">
        <button class="btn btn-print" onclick="window.print()">Imprimir</button>
        <button class="btn btn-close" onclick="window.close()">Cerrar</button>
      </div>
      <div class="ticket">${ticketHtml}</div>
    </body>
    </html>
  `);
  w.document.close();
  w.focus();
}
