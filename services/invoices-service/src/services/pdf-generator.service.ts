import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import { Invoice } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

export class PDFGeneratorService {
  private templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  /**
   * Generate PDF invoice
   */
  async generateInvoicePDF(invoice: Invoice & { lineItems: any[] }): Promise<Buffer> {
    const html = await this.renderInvoiceTemplate(invoice);
    return this.htmlToPDF(html);
  }

  /**
   * Render invoice HTML template
   */
  private async renderInvoiceTemplate(invoice: Invoice & { lineItems: any[] }): Promise<string> {
    const templatePath = path.join(__dirname, '../../templates/invoice.hbs');
    
    let template = this.templateCache.get('invoice');
    
    if (!template) {
      try {
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        template = Handlebars.compile(templateContent);
        this.templateCache.set('invoice', template);
      } catch (error) {
        // Fallback to default template
        template = Handlebars.compile(this.getDefaultTemplate());
      }
    }

    const data = {
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate.toLocaleDateString(),
      dueDate: invoice.dueDate.toLocaleDateString(),
      customerId: invoice.customerId,
      subtotal: Number(invoice.subtotal).toFixed(2),
      taxTotal: Number(invoice.taxTotal).toFixed(2),
      discountTotal: Number(invoice.discountTotal).toFixed(2),
      grandTotal: Number(invoice.grandTotal).toFixed(2),
      currency: invoice.currency,
      lineItems: invoice.lineItems.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity).toFixed(2),
        unitPrice: Number(item.unitPrice).toFixed(2),
        taxPercent: Number(item.taxPercent).toFixed(2),
        totalPrice: Number(item.totalPrice).toFixed(2),
      })),
      status: invoice.status,
    };

    return template(data);
  }

  /**
   * Convert HTML to PDF using Puppeteer
   */
  private async htmlToPDF(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  /**
   * Default invoice template
   */
  private getDefaultTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    .invoice-number { font-size: 24px; font-weight: bold; }
    .details { margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    .total-section { text-align: right; margin-top: 20px; }
    .total-row { font-weight: bold; font-size: 18px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>INVOICE</h1>
    <div class="invoice-number">Invoice #{{invoiceNumber}}</div>
  </div>
  
  <div class="details">
    <p><strong>Issue Date:</strong> {{issueDate}}</p>
    <p><strong>Due Date:</strong> {{dueDate}}</p>
    <p><strong>Customer ID:</strong> {{customerId}}</p>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Quantity</th>
        <th>Unit Price</th>
        <th>Tax %</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      {{#each lineItems}}
      <tr>
        <td>{{description}}</td>
        <td>{{quantity}}</td>
        <td>{{unitPrice}} {{../currency}}</td>
        <td>{{taxPercent}}%</td>
        <td>{{totalPrice}} {{../currency}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
  
  <div class="total-section">
    <p>Subtotal: {{subtotal}} {{currency}}</p>
    <p>Tax: {{taxTotal}} {{currency}}</p>
    <p>Discount: {{discountTotal}} {{currency}}</p>
    <p class="total-row">Grand Total: {{grandTotal}} {{currency}}</p>
  </div>
  
  <div style="margin-top: 40px;">
    <p><strong>Status:</strong> {{status}}</p>
  </div>
</body>
</html>
    `;
  }
}

