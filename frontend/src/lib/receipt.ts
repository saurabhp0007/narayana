import { Order } from '@/types';
import { customerOrderStatusLabel } from './orderStatus';

const SHOP_NAME = 'Narayana Enterprise';
const SHOP_TAGLINE = 'narayanenterprise.in';

interface ReceiptMeta {
  txnid?: string;
  paymentMode?: string;
  bankRefNum?: string;
}

const esc = (v: unknown): string =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c] as string));

const inr = (n: number): string =>
  `₹${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d?: string): string =>
  d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const PAYMENT_LABEL: Record<string, string> = {
  cod: 'Cash on Delivery',
  payu: 'Online (PayU)',
};
const PAYMENT_STATUS_LABEL: Record<string, string> = {
  not_required: '—',
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
};

function receiptHtml(order: Order, meta: ReceiptMeta): string {
  const rows = order.items
    .map((item) => {
      const unit = item.discountPrice || item.price;
      return `<tr>
        <td>${esc(item.productName)}${item.sku ? `<div class="muted">${esc(item.sku)}</div>` : ''}</td>
        <td>${esc(item.size || '—')}</td>
        <td class="num">${item.quantity}</td>
        <td class="num">${inr(unit)}</td>
        <td class="num">${inr(unit * item.quantity)}</td>
      </tr>`;
    })
    .join('');

  const customer =
    order.customerName || order.contactEmail || (order.userId ? 'Registered customer' : 'Guest');
  const isGuest = !order.userId;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Receipt ${esc(order.orderId)}</title>
<style>
  * { box-sizing: border-box; }
  body { font: 13px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #111; margin: 0; padding: 32px; background: #f5f5f5; }
  .sheet { max-width: 720px; margin: 0 auto; background: #fff; padding: 40px; border: 1px solid #e5e5e5; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 24px; }
  .brand { font-size: 20px; font-weight: 700; letter-spacing: .5px; }
  .muted { color: #666; font-size: 11px; }
  h1 { font-size: 15px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  .block h2 { font-size: 11px; text-transform: uppercase; letter-spacing: .5px; color: #666; margin: 0 0 6px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 20px; }
  th, td { text-align: left; padding: 8px 6px; border-bottom: 1px solid #eee; vertical-align: top; }
  th { font-size: 10px; text-transform: uppercase; letter-spacing: .5px; color: #666; border-bottom: 1px solid #111; }
  td.num, th.num { text-align: right; white-space: nowrap; }
  .totals { margin-left: auto; width: 260px; }
  .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
  .totals .grand { border-top: 2px solid #111; margin-top: 6px; padding-top: 8px; font-weight: 700; font-size: 15px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; background: #eee; }
  .paid { background: #d1fae5; color: #065f46; }
  .foot { margin-top: 28px; padding-top: 16px; border-top: 1px solid #eee; color: #666; font-size: 11px; }
  .actions { max-width: 720px; margin: 0 auto 16px; text-align: right; }
  .actions button { font: inherit; padding: 8px 16px; border: 1px solid #111; background: #111; color: #fff; border-radius: 6px; cursor: pointer; }
  @media print { body { padding: 0; background: #fff; } .sheet { border: 0; padding: 0; } .actions { display: none; } }
</style>
</head>
<body>
  <div class="actions"><button onclick="window.print()">Print / Save PDF</button></div>
  <div class="sheet">
    <div class="top">
      <div>
        <div class="brand">${SHOP_NAME}</div>
        <div class="muted">${SHOP_TAGLINE}</div>
      </div>
      <div style="text-align:right">
        <h1>Receipt</h1>
        <div class="muted">${esc(order.orderId)}</div>
        <div class="muted">${fmtDate(order.createdAt)}</div>
      </div>
    </div>

    <div class="grid">
      <div class="block">
        <h2>Billed To</h2>
        <div>${esc(customer)}${isGuest ? ' <span class="muted">(guest)</span>' : ''}</div>
        ${order.contactEmail ? `<div class="muted">${esc(order.contactEmail)}</div>` : ''}
        ${order.contactPhone ? `<div class="muted">${esc(order.contactPhone)}</div>` : ''}
      </div>
      <div class="block">
        <h2>Ship To</h2>
        <div>${esc(order.shippingAddress || '—')}</div>
      </div>
      <div class="block">
        <h2>Order Status</h2>
        <div><span class="badge">${esc(customerOrderStatusLabel(order.status))}</span></div>
      </div>
      <div class="block">
        <h2>Payment</h2>
        <div>${esc(PAYMENT_LABEL[order.paymentMethod || 'cod'] || order.paymentMethod || '—')}
          ${
            order.paymentStatus
              ? ` · <span class="badge ${order.paymentStatus === 'paid' ? 'paid' : ''}">${esc(
                  PAYMENT_STATUS_LABEL[order.paymentStatus] || order.paymentStatus,
                )}</span>`
              : ''
          }
        </div>
        ${meta.txnid || order.txnid ? `<div class="muted">Txn: ${esc(meta.txnid || order.txnid)}</div>` : ''}
        ${meta.paymentMode ? `<div class="muted">Mode: ${esc(meta.paymentMode)}</div>` : ''}
        ${meta.bankRefNum ? `<div class="muted">Bank Ref: ${esc(meta.bankRefNum)}</div>` : ''}
        ${order.paidAt ? `<div class="muted">Paid: ${fmtDate(order.paidAt)}</div>` : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th><th>Size</th><th class="num">Qty</th><th class="num">Unit</th><th class="num">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="totals">
      <div><span>Subtotal</span><span>${inr(order.subtotal)}</span></div>
      ${order.discount > 0 ? `<div><span>Discount</span><span>-${inr(order.discount)}</span></div>` : ''}
      <div><span>Shipping</span><span>Free</span></div>
      <div class="grand"><span>Total</span><span>${inr(order.totalAmount)}</span></div>
    </div>

    ${order.notes ? `<div class="foot"><strong>Notes:</strong> ${esc(order.notes)}</div>` : ''}
    <div class="foot">Thank you for shopping with ${SHOP_NAME}. This is a computer-generated receipt.</div>
  </div>
</body>
</html>`;
}

export function printOrderReceipt(order: Order, meta: ReceiptMeta = {}): void {
  const win = window.open('', '_blank', 'width=820,height=960');
  if (!win) {
    alert('Please allow pop-ups to print the receipt.');
    return;
  }
  win.document.open();
  win.document.write(receiptHtml(order, meta));
  win.document.close();
}
