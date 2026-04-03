import { Order } from "@/lib/types";

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatName(order: Order): string {
  return [order.patientFirstName, order.patientMiddleName, order.patientLastName, order.patientSuffix].filter(Boolean).join(" ");
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDob(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

const sharedStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #1a1a1a;
    line-height: 1.5;
    padding: 40px;
    max-width: 900px;
    margin: 0 auto;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
  }
  th, td {
    padding: 8px 12px;
    text-align: left;
    font-size: 13px;
  }
  th {
    background-color: #f4f4f5;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 0.5px;
    color: #52525b;
    border-bottom: 2px solid #d4d4d8;
  }
  td {
    border-bottom: 1px solid #e4e4e7;
  }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  @media print {
    body { padding: 20px; }
    .no-print { display: none; }
  }
`;

export function generateEncounterForm(order: Order): string {
  const lineItemsRows = order.lineItems
    .map(
      (item) => `
      <tr>
        <td>${item.productName}</td>
        <td>${item.hcpcsCode}</td>
        <td>${item.vendor}</td>
        <td class="text-center">${item.quantity}</td>
        <td class="text-right">${formatCurrency(item.unitCost)}</td>
        <td class="text-right">${formatCurrency(item.billableAmount)}</td>
        <td class="text-right">${formatCurrency(item.patientResponsibility)}</td>
        <td class="text-right">${formatCurrency(item.margin)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Encounter Form - ${order.id}</title>
  <style>
    ${sharedStyles}
    .header {
      border-bottom: 3px solid #18181b;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .header h1 {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 2px;
      color: #18181b;
      margin-bottom: 2px;
    }
    .header .company {
      font-size: 14px;
      color: #52525b;
      font-weight: 500;
    }
    .badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-status {
      background-color: #f4f4f5;
      color: #3f3f46;
      border: 1px solid #d4d4d8;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .info-section {
      background: #fafafa;
      border: 1px solid #e4e4e7;
      border-radius: 6px;
      padding: 16px;
    }
    .info-section h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #71717a;
      margin-bottom: 8px;
      font-weight: 600;
    }
    .info-section p {
      font-size: 13px;
      margin-bottom: 4px;
      color: #27272a;
    }
    .info-section p strong {
      display: inline-block;
      width: 120px;
      color: #52525b;
      font-weight: 500;
    }
    .totals-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin: 20px 0;
    }
    .total-box {
      background: #fafafa;
      border: 1px solid #e4e4e7;
      border-radius: 6px;
      padding: 12px 16px;
      text-align: center;
    }
    .total-box .label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #71717a;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .total-box .value {
      font-size: 18px;
      font-weight: 700;
      color: #18181b;
    }
    .notes-section {
      margin: 24px 0;
      padding: 16px;
      background: #fafafa;
      border: 1px solid #e4e4e7;
      border-radius: 6px;
    }
    .notes-section h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #71717a;
      margin-bottom: 8px;
      font-weight: 600;
    }
    .notes-section p {
      font-size: 13px;
      color: #3f3f46;
      white-space: pre-wrap;
    }
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 2px solid #e4e4e7;
      text-align: center;
      font-size: 11px;
      color: #a1a1aa;
    }
    .footer strong {
      color: #71717a;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>ENCOUNTER FORM</h1>
    <div class="company">MedSupply Distribution Co.</div>
  </div>

  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
    <div>
      <span style="font-size: 13px; color: #52525b;">Order ID:</span>
      <span style="font-size: 15px; font-weight: 700; margin-left: 6px;">${order.id}</span>
    </div>
    <div>
      <span style="font-size: 13px; color: #52525b;">Date:</span>
      <span style="font-size: 13px; font-weight: 500; margin-left: 6px;">${formatDate(order.createdAt)}</span>
    </div>
    <div>
      <span class="badge badge-status">${order.status}</span>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-section">
      <h3>Patient Information</h3>
      <p><strong>Name:</strong> ${formatName(order)}</p>
      <p><strong>Date of Birth:</strong> ${formatDob(order.patientDob)}</p>
      <p><strong>Address:</strong> ${order.patientAddress}</p>
    </div>
    <div class="info-section">
      <h3>Insurance Information</h3>
      <p><strong>Payer:</strong> ${order.isSelfPay ? "Self-Pay" : order.insurancePayer}</p>
      <p><strong>Self-Pay:</strong> ${order.isSelfPay ? "Yes" : "No"}</p>
      ${order.shippingAddress !== order.patientAddress ? `<p><strong>Ship To:</strong> ${order.shippingAddress}</p>` : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th>HCPCS</th>
        <th>Vendor</th>
        <th class="text-center">Qty</th>
        <th class="text-right">Unit Cost</th>
        <th class="text-right">Billable</th>
        <th class="text-right">Patient Resp.</th>
        <th class="text-right">Margin</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemsRows}
    </tbody>
  </table>

  <div class="totals-grid">
    <div class="total-box">
      <div class="label">Total Cost</div>
      <div class="value">${formatCurrency(order.totalCost)}</div>
    </div>
    <div class="total-box">
      <div class="label">Total Billable</div>
      <div class="value">${formatCurrency(order.totalBillable)}</div>
    </div>
    <div class="total-box">
      <div class="label">Patient Responsibility</div>
      <div class="value">${formatCurrency(order.totalPatientResponsibility)}</div>
    </div>
    <div class="total-box">
      <div class="label">Total Margin</div>
      <div class="value">${formatCurrency(order.totalMargin)}</div>
    </div>
  </div>

  ${
    order.notes
      ? `
  <div class="notes-section">
    <h3>Notes</h3>
    <p>${order.notes}</p>
  </div>`
      : ""
  }

  <div class="footer">
    <strong>Internal Use Only</strong> &mdash; Generated ${formatDate(new Date().toISOString())}
  </div>
</body>
</html>`;
}

export function generatePatientInvoice(order: Order): string {
  const lineItemsRows = order.lineItems
    .map(
      (item) => `
      <tr>
        <td>${item.productName}</td>
        <td>${item.hcpcsCode}</td>
        <td class="text-center">${item.quantity}</td>
        <td class="text-right">${formatCurrency(item.patientResponsibility)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Patient Invoice - ${order.id}</title>
  <style>
    ${sharedStyles}
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #18181b;
      padding-bottom: 20px;
      margin-bottom: 28px;
    }
    .header-left h1 {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 2px;
      color: #18181b;
      margin-bottom: 4px;
    }
    .header-left .company {
      font-size: 14px;
      font-weight: 600;
      color: #3f3f46;
    }
    .header-left .address {
      font-size: 12px;
      color: #71717a;
      margin-top: 2px;
    }
    .header-right {
      text-align: right;
    }
    .header-right .invoice-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #71717a;
      font-weight: 600;
    }
    .header-right .invoice-value {
      font-size: 14px;
      font-weight: 600;
      color: #18181b;
    }
    .bill-to {
      background: #fafafa;
      border: 1px solid #e4e4e7;
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 24px;
      max-width: 360px;
    }
    .bill-to h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #71717a;
      margin-bottom: 8px;
      font-weight: 600;
    }
    .bill-to p {
      font-size: 13px;
      color: #27272a;
      margin-bottom: 2px;
    }
    .summary {
      margin: 24px 0;
      display: flex;
      justify-content: flex-end;
    }
    .summary-table {
      width: 300px;
    }
    .summary-table tr td {
      padding: 6px 12px;
      font-size: 13px;
    }
    .summary-table .subtotal td {
      border-bottom: 1px solid #e4e4e7;
      color: #52525b;
    }
    .summary-table .total td {
      font-size: 16px;
      font-weight: 700;
      color: #18181b;
      padding-top: 10px;
    }
    .payment-section {
      margin: 32px 0;
      text-align: center;
    }
    .pay-online {
      display: inline-block;
      background: #18181b;
      color: #ffffff;
      padding: 12px 32px;
      border-radius: 6px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    .pay-online:hover {
      background: #27272a;
    }
    .pay-online-label {
      font-size: 12px;
      color: #71717a;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      font-weight: 600;
    }
    .instructions {
      margin: 32px 0;
      padding: 20px;
      background: #fafafa;
      border: 1px solid #e4e4e7;
      border-radius: 6px;
    }
    .instructions h3 {
      font-size: 13px;
      font-weight: 600;
      color: #27272a;
      margin-bottom: 10px;
    }
    .instructions p {
      font-size: 12px;
      color: #52525b;
      margin-bottom: 6px;
      line-height: 1.6;
    }
    .footer {
      margin-top: 48px;
      padding-top: 16px;
      border-top: 2px solid #e4e4e7;
      text-align: center;
      font-size: 11px;
      color: #a1a1aa;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>PATIENT INVOICE</h1>
      <div class="company">MedSupply Distribution Co.</div>
      <div class="address">1234 Healthcare Blvd, Suite 100<br>San Francisco, CA 94102</div>
    </div>
    <div class="header-right">
      <div style="margin-bottom: 8px;">
        <div class="invoice-label">Invoice Number</div>
        <div class="invoice-value">${order.id}</div>
      </div>
      <div>
        <div class="invoice-label">Invoice Date</div>
        <div class="invoice-value">${formatDate(order.createdAt)}</div>
      </div>
    </div>
  </div>

  <div class="bill-to">
    <h3>Bill To</h3>
    <p style="font-weight: 600;">${formatName(order)}</p>
    <p>${order.patientAddress}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th>HCPCS Code</th>
        <th class="text-center">Qty</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemsRows}
    </tbody>
  </table>

  <div class="summary">
    <table class="summary-table">
      <tr class="subtotal">
        <td>Subtotal</td>
        <td class="text-right">${formatCurrency(order.totalPatientResponsibility)}</td>
      </tr>
      <tr class="total">
        <td>Total Due</td>
        <td class="text-right">${formatCurrency(order.totalPatientResponsibility)}</td>
      </tr>
    </table>
  </div>

  ${
    order.stripePaymentLink
      ? `
  <div class="payment-section">
    <div class="pay-online-label">Pay Online</div>
    <a href="${order.stripePaymentLink}" class="pay-online" target="_blank">
      Pay ${formatCurrency(order.totalPatientResponsibility)} Online
    </a>
    <div style="margin-top: 8px; font-size: 11px; color: #a1a1aa;">
      Secure payment powered by Stripe
    </div>
  </div>`
      : ""
  }

  <div class="instructions">
    <h3>Payment Instructions</h3>
    ${
      order.stripePaymentLink
        ? `<p>You may pay online using the link above for fastest processing.</p>`
        : ""
    }
    <p>For questions about this invoice, please contact our billing department at billing@medsupply.com or call (800) 555-0199.</p>
    <p>Please reference your invoice number <strong>${order.id}</strong> with any correspondence.</p>
    <p>Payment is due within 30 days of the invoice date.</p>
  </div>

  <div class="footer">
    MedSupply Distribution Co. &mdash; Thank you for your business
  </div>
</body>
</html>`;
}
