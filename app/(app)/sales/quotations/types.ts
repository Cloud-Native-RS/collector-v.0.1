export type EditorDoc = {
  type: string;
  content: Array<{
    type: string;
    content?: Array<{
      type: string;
      text?: string;
      marks?: Array<{
        type: string;
        attrs?: {
          href?: string;
        };
      }>;
    }>;
  }>;
};

export type LineItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  vat?: number;
};

export type Template = {
  logo_url?: string;
  invoice_no_label: string;
  issue_date_label: string;
  due_date_label: string;
  date_format: string;
  from_label: string;
  customer_label: string;
  description_label: string;
  quantity_label: string;
  price_label: string;
  total_label: string;
  vat_label: string;
  tax_label: string;
  payment_label: string;
  note_label: string;
  include_vat: boolean;
  include_tax: boolean;
  tax_rate: number;
};

export type TemplateProps = {
  invoice_number: string;
  issue_date: string;
  due_date: string;
  template: Template;
  line_items: LineItem[];
  customer_details?: JSON;
  from_details?: JSON;
  payment_details?: JSON;
  note_details?: JSON;
  currency: string;
  customer_name?: string;
  width?: number;
  height?: number;
};
