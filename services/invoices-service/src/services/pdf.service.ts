import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';

/**
 * Generate PDF invoice from template
 */
export class PDFService {
  async generateInvoicePDF(invoice: any): Promise<Buffer> {
    // Load template
    const templatePath = process.env.PDF_TEMPLATE_PATH || './templates/invoice.hbs';
    const templateContent = await fs.readFile(path.join(process.cwd(), templatePath), 'utf-8');
    
    // Compile template
    const template = Handlebars.compile(templateContent);
    
    // Prepare data
    const data = {
      invoice,
      date: new Date().toLocaleDateString(),
    };

    // Render HTML
    const html = template(data);

    // Generate PDF
    const browser = await puppeteer.launch({ headless: true });
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

    await browser.close();

    return Buffer.from(pdf);
  }

  /**
   * Get invoice as base64
   */
  async generateInvoiceBase64(invoice: any): Promise<string> {
    const pdf = await this.generateInvoicePDF(invoice);
    return pdf.toString('base64');
  }
}

