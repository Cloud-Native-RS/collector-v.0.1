import PDFDocument from 'pdfkit';
import { DeliveryNote, DeliveryItem } from '@prisma/client';

export async function generatePdf(deliveryNote: DeliveryNote & { items: DeliveryItem[] }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on('error', reject);

    // Header
    doc.fontSize(20).text('Delivery Note', { align: 'center' });
    doc.moveDown();

    // Delivery Note Details
    doc.fontSize(12);
    doc.text(`Delivery Number: ${deliveryNote.deliveryNumber}`, { continued: true });
    doc.text(`Date: ${deliveryNote.createdAt.toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();

    doc.text(`Order ID: ${deliveryNote.orderId}`);
    doc.text(`Customer ID: ${deliveryNote.customerId}`);
    doc.moveDown();

    // Status
    doc.fontSize(14);
    doc.text(`Status: ${deliveryNote.status}`, { underline: true });
    doc.moveDown();

    if (deliveryNote.trackingNumber) {
      doc.text(`Tracking Number: ${deliveryNote.trackingNumber}`);
      doc.moveDown();
    }

    if (deliveryNote.shippedAt) {
      doc.text(`Shipped At: ${deliveryNote.shippedAt.toLocaleString()}`);
    }

    if (deliveryNote.deliveredAt) {
      doc.text(`Delivered At: ${deliveryNote.deliveredAt.toLocaleString()}`);
    }

    doc.moveDown();
    doc.moveDown();

    // Items Table Header
    doc.fontSize(12);
    doc.text('Items:', { underline: true });
    doc.moveDown(0.5);

    // Table headers
    const tableTop = doc.y;
    doc.fontSize(10);
    doc.text('Description', 50, tableTop, { width: 300 });
    doc.text('Quantity', 350, tableTop, { width: 100 });
    doc.text('Unit', 450, tableTop, { width: 100 });

    // Draw line under headers
    doc.moveTo(50, doc.y + 10).lineTo(550, doc.y + 10).stroke();

    // Items rows
    let y = doc.y + 20;
    deliveryNote.items.forEach((item, index) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      doc.text(item.description, 50, y, { width: 300 });
      doc.text(item.quantity.toString(), 350, y, { width: 100 });
      doc.text(item.unit || 'pcs', 450, y, { width: 100 });
      y += 20;
    });

    doc.end();
  });
}

