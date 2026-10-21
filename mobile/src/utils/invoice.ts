import { formatMoney, type OrderLineSnapshot } from "../model";
import { jsPDF } from "jspdf";

export type InvoiceDetails = {
  orderNumber: string;
  placedAt: string;
  status: string;
  storeName: string;
  storePhone?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  fulfilment: "delivery" | "pickup";
  paymentMethod: string;
  paymentStatus: string;
  lines: OrderLineSnapshot[];
  total: number;
  subtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  deliveryFee?: number;
};

const formatPdfMoney = (amount: number) =>
  `INR ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

export const buildInvoiceHtml = (invoice: InvoiceDetails) => {
  const itemRows = invoice.lines
    .map(
      (line) => `
        <tr>
          <td>${escapeHtml(line.name)}${line.unit ? `<span class="unit"> · ${escapeHtml(line.unit)}</span>` : ""}</td>
          <td class="number">${line.quantity}</td>
          <td class="number">${formatMoney(line.price)}</td>
          <td class="number">${formatMoney(line.price * line.quantity)}</td>
        </tr>`,
    )
    .join("");
  const customerDetails = [invoice.customerEmail, invoice.customerPhone]
    .filter((detail): detail is string => Boolean(detail))
    .map((detail) => `<div>${escapeHtml(detail)}</div>`)
    .join("");
  const breakdown = [
    invoice.subtotal === undefined
      ? ""
      : `<div class="total-row"><span>Subtotal</span><span>${formatMoney(invoice.subtotal)}</span></div>`,
    invoice.discountAmount
      ? `<div class="total-row"><span>Discount</span><span>−${formatMoney(invoice.discountAmount)}</span></div>`
      : "",
    invoice.taxAmount === undefined
      ? ""
      : `<div class="total-row"><span>Tax</span><span>${formatMoney(invoice.taxAmount)}</span></div>`,
    invoice.deliveryFee === undefined
      ? ""
      : `<div class="total-row"><span>Delivery</span><span>${formatMoney(invoice.deliveryFee)}</span></div>`,
  ].join("");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Invoice ${escapeHtml(invoice.orderNumber)}</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; padding: 36px; color: #1c2b20; font: 14px Arial, sans-serif; }
      main { max-width: 760px; margin: 0 auto; }
      header { display: flex; justify-content: space-between; gap: 24px; padding-bottom: 24px; border-bottom: 2px solid #3a8f52; }
      h1 { margin: 0 0 6px; color: #287142; font-size: 28px; }
      h2 { margin: 0 0 10px; color: #287142; font-size: 14px; text-transform: uppercase; letter-spacing: .06em; }
      p { margin: 4px 0; color: #58665c; line-height: 1.5; }
      .invoice-meta { text-align: right; }
      .details { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; padding: 24px 0; }
      .unit { color: #68766c; }
      table { width: 100%; border-collapse: collapse; }
      th { padding: 10px 8px; background: #edf5ef; color: #287142; text-align: left; }
      td { padding: 12px 8px; border-bottom: 1px solid #e4e9e5; }
      .number { text-align: right; white-space: nowrap; }
      .total { margin: 20px 0 0 auto; width: min(100%, 320px); }
      .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
      .grand-total { margin-top: 4px; padding-top: 12px; border-top: 2px solid #3a8f52; color: #1c2b20; font-size: 18px; font-weight: 700; }
      footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e4e9e5; color: #68766c; font-size: 12px; text-align: center; }
      @media print { body { padding: 0; } }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div>
          <h1>aasPass</h1>
          <p>Order invoice</p>
        </div>
        <div class="invoice-meta">
          <h1>INVOICE</h1>
          <p><strong>Order:</strong> ${escapeHtml(invoice.orderNumber)}</p>
          <p><strong>Date:</strong> ${escapeHtml(invoice.placedAt)}</p>
          <p><strong>Status:</strong> ${escapeHtml(invoice.status)}</p>
        </div>
      </header>
      <section class="details">
        <div>
          <h2>Sold by</h2>
          <p><strong>${escapeHtml(invoice.storeName)}</strong></p>
          ${invoice.storePhone ? `<p>${escapeHtml(invoice.storePhone)}</p>` : ""}
        </div>
        <div>
          <h2>Customer</h2>
          <p><strong>${escapeHtml(invoice.customerName)}</strong></p>
          ${customerDetails}
          <p>${invoice.fulfilment === "delivery" ? "Delivery order" : "Store pickup"}</p>
        </div>
      </section>
      <table>
        <thead>
          <tr><th>Item</th><th class="number">Qty</th><th class="number">Unit price</th><th class="number">Amount</th></tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <section class="total">
        <div class="total-row"><span>Payment</span><span>${escapeHtml(invoice.paymentMethod)} · ${escapeHtml(invoice.paymentStatus)}</span></div>
        ${breakdown}
        <div class="total-row grand-total"><span>Total</span><span>${formatMoney(invoice.total)}</span></div>
      </section>
      <footer>Generated from your aasPass order details. This invoice was created on your device.</footer>
    </main>
  </body>
</html>`;
};

export const downloadInvoicePdf = async (invoice: InvoiceDetails) => {
  const pdf = new jsPDF({ format: "a4", unit: "pt" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 44;
  const contentWidth = pageWidth - margin * 2;
  const right = pageWidth - margin;
  let y = margin;

  const drawTableHeader = () => {
    pdf.setFillColor(237, 245, 239);
    pdf.rect(margin, y - 15, contentWidth, 25, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(40, 113, 66);
    pdf.text("ITEM", margin + 8, y);
    pdf.text("QTY", 365, y, { align: "right" });
    pdf.text("UNIT PRICE", 453, y, { align: "right" });
    pdf.text("AMOUNT", right - 8, y, { align: "right" });
    y += 18;
  };

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(24);
  pdf.setTextColor(40, 113, 66);
  pdf.text("aasPass", margin, y + 4);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(88, 102, 92);
  pdf.text("Order invoice", margin, y + 20);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.setTextColor(40, 113, 66);
  pdf.text("INVOICE", right, y + 4, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(65, 76, 68);
  pdf.text(`Order: ${invoice.orderNumber}`, right, y + 21, { align: "right" });
  pdf.text(`Date: ${invoice.placedAt}`, right, y + 35, { align: "right" });
  pdf.text(`Status: ${invoice.status}`, right, y + 49, { align: "right" });

  y += 72;
  pdf.setDrawColor(58, 143, 82);
  pdf.setLineWidth(1.5);
  pdf.line(margin, y, right, y);
  y += 24;

  const columnWidth = (contentWidth - 32) / 2;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(40, 113, 66);
  pdf.text("SOLD BY", margin, y);
  pdf.text("CUSTOMER", margin + columnWidth + 32, y);
  y += 16;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(28, 43, 32);
  const storeLines = pdf.splitTextToSize(invoice.storeName, columnWidth);
  pdf.text(storeLines, margin, y);
  const customerX = margin + columnWidth + 32;
  const customerLines = pdf.splitTextToSize(invoice.customerName, columnWidth);
  pdf.text(customerLines, customerX, y);
  y += Math.max(storeLines.length, customerLines.length) * 13;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(88, 102, 92);
  const sellerDetails = [
    invoice.storePhone,
    invoice.fulfilment === "delivery" ? "Delivery order" : "Store pickup",
  ].filter((value): value is string => Boolean(value));
  const customerDetails = [
    invoice.customerEmail,
    invoice.customerPhone,
    invoice.fulfilment === "delivery" ? "Delivery order" : "Store pickup",
  ].filter((value): value is string => Boolean(value));
  const sellerLines = sellerDetails.flatMap((line) => pdf.splitTextToSize(line, columnWidth));
  const buyerLines = customerDetails.flatMap((line) => pdf.splitTextToSize(line, columnWidth));
  pdf.text(sellerLines, margin, y);
  pdf.text(buyerLines, customerX, y);
  y += Math.max(sellerLines.length, buyerLines.length) * 13 + 22;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(40, 113, 66);
  pdf.text("ITEMS", margin, y);
  y += 18;
  drawTableHeader();

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(28, 43, 32);
  for (const line of invoice.lines) {
    const description = `${line.name}${line.unit ? ` · ${line.unit}` : ""}`;
    const descriptionLines = pdf.splitTextToSize(description, 245);
    const rowHeight = Math.max(27, descriptionLines.length * 13 + 12);
    if (y + rowHeight > pageHeight - margin - 105) {
      pdf.addPage();
      y = margin + 20;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(40, 113, 66);
      pdf.text("ITEMS (CONTINUED)", margin, y);
      y += 18;
      drawTableHeader();
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(28, 43, 32);
    }

    pdf.text(descriptionLines, margin + 8, y + 2);
    pdf.text(String(line.quantity), 365, y + 2, { align: "right" });
    pdf.text(formatPdfMoney(line.price), 453, y + 2, { align: "right" });
    pdf.text(formatPdfMoney(line.price * line.quantity), right - 8, y + 2, { align: "right" });
    y += rowHeight;
    pdf.setDrawColor(228, 233, 229);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y - 7, right, y - 7);
  }

  const summaryRows = [
    ["Payment", `${invoice.paymentMethod} · ${invoice.paymentStatus}`],
    ...(invoice.subtotal === undefined ? [] : [["Subtotal", formatPdfMoney(invoice.subtotal)]]),
    ...(invoice.discountAmount ? [["Discount", `-${formatPdfMoney(invoice.discountAmount)}`]] : []),
    ...(invoice.taxAmount === undefined ? [] : [["Tax", formatPdfMoney(invoice.taxAmount)]]),
    ...(invoice.deliveryFee === undefined ? [] : [["Delivery", formatPdfMoney(invoice.deliveryFee)]]),
  ];
  const summaryHeight = summaryRows.length * 18 + 38;
  if (y + summaryHeight > pageHeight - margin - 24) {
    pdf.addPage();
    y = margin + 20;
  }

  y += 8;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(65, 76, 68);
  for (const [label, value] of summaryRows) {
    pdf.text(label, right - 210, y);
    pdf.text(value, right, y, { align: "right" });
    y += 18;
  }

  pdf.setDrawColor(58, 143, 82);
  pdf.setLineWidth(1.5);
  pdf.line(right - 210, y - 6, right, y - 6);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.setTextColor(28, 43, 32);
  pdf.text("TOTAL", right - 210, y + 12);
  pdf.text(formatPdfMoney(invoice.total), right, y + 12, { align: "right" });

  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(104, 118, 108);
    pdf.text(
      `Generated from your aasPass order details · Page ${page} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 22,
      { align: "center" },
    );
  }

  const safeOrderNumber = invoice.orderNumber.replace(/[^a-zA-Z0-9_-]/g, "-");
  const downloadUrl = URL.createObjectURL(pdf.output("blob"));
  const downloadLink = document.createElement("a");
  downloadLink.href = downloadUrl;
  downloadLink.download = `aasPass-invoice-${safeOrderNumber}.pdf`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
};
