export type StockStatus = "in_stock" | "on_order" | "out_of_stock";

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  sku: string;
  title: string;
  slug: string;
  category: string;
  categorySlug: string;
  subcategory?: string;
  price: number | null;
  currency: "RUB";
  stock: StockStatus;
  stockLabel: string;
  specs: ProductSpec[];
  specsRaw: string;
  description: string;
  image?: string;
}

export interface Category {
  name: string;
  slug: string;
  count: number;
  image?: string;
  description: string;
  seoText: string;
}

export interface City {
  slug: string;
  name: string;
  title: string;
  text: string;
  delivery: string;
}

export interface QuoteItem {
  sku: string;
  title: string;
  quantity: number;
}

export interface LeadPayload {
  name: string;
  phone: string;
  city: string;
  message: string;
  items: QuoteItem[];
  source?: string;
  utm?: Record<string, string>;
}
