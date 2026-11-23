/**
 * Generates the official Thalir Boutique Tax Invoice & Order Receipt message
 * for WhatsApp and SMS dispatch.
 */

export function formatTaxInvoiceReceipt(order, options = {}) {
  if (!order) return '';

  const customerName = order.customer?.fullName || order.customer_name || order.customerName || 'Customer';
  const orderId = order.orderId || order.id || `TB-${Date.now().toString().slice(-6)}`;
  
  const formattedDate = new Date(order.timestamp || order.created_at || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const awbNumber = order.awb || `TB-EXP-${String(orderId).replace(/[^0-9]/g, '').slice(-6) || '216511'}`;

  // Formulate items list
  const items = order.items || [];
  const itemsText = items.map((it, idx) => {
    const pCode = it.product_code || it.code || it.productCode || it.id || '';
    const name = it.productName || it.product_name || it.name || 'Saree';
    const color = it.color || 'Standard';
    const qty = it.qty || 1;
    const rate = Number(it.price || it.unit_price || 0).toLocaleString('en-IN');
    return `${idx + 1}. *${name}* ${pCode ? `[${pCode}]` : ''}\n   Color: ${color} | Qty: ${qty} | Rate: ₹${rate}`;
  }).join('\n\n') || '1. Ethnic Boutique Apparel';

  const subtotal = Number(order.pricing?.subtotal || order.subtotal || order.grandTotal || 0).toLocaleString('en-IN');
  const deliveryFee = Number(
    order.pricing?.deliveryFee ?? order.pricing?.deliveryCharge ?? order.delivery_charge ?? (order.pricing?.shipping === 0 ? 0 : 30)
  ).toLocaleString('en-IN');
  const grandTotal = Number(order.pricing?.grandTotal || order.grand_total || order.total_amount || 0).toLocaleString('en-IN');

  const paymentStatus = options.paymentStatus || (
    order.status === 'Payment Confirmed' || order.status === 'Dispatched' || order.status === 'Delivered'
      ? 'Prepaid / Verified'
      : (order.status || 'Pending Verification')
  );

  const address = order.customer?.address || order.delivery_address || 'Address on file';
  const city = order.customer?.city || order.city || 'Komarapalayam';
  const pincode = order.customer?.pincode || order.pincode || '638183';
  const addressLine = `${address}, ${city} - ${pincode}`.replace(/,\s*,/g, ',');

  const boutiquePhone = options.phone || '+91 6382218590';
  const forSms = options.forSms || false;

  return `*THALIR BOUTIQUE - TAX INVOICE & ORDER RECEIPT*

Dear *${customerName}*,
Thank you for shopping with Thalir Boutique! Here are your official order & delivery details:

*Invoice #:* #${orderId}
*Date:* ${formattedDate}
*AWB Tracking #:* ${awbNumber}

*Items Ordered:*
${itemsText}

*Subtotal:* ₹${subtotal}
*Courier Delivery:* ₹${deliveryFee}
*Grand Total:* ₹${grandTotal} (Incl. 5% GST)
*Payment Status:* ${paymentStatus}

*Delivery Address:*
${addressLine}

For any styling advice or queries, contact us at ${boutiquePhone}.
*Thalir Boutique - Handcrafted Elegance*`;
}
