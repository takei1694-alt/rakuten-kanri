import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// 型定義
// ==========================================

export type Period = 'week' | '2weeks' | 'month' | '3months' | 'year' | 'custom';

export interface SummaryData {
  period: string;
  startDate: string;
  endDate: string;
  updatedAt: string;
  sales: number;
  orders: number;
  avgOrderValue: number;
  rakutenFee: number;
  coupon: number;
  points: number;
  cost: number;
  shipping: number;
  adCost: number;
  adSales: number;
  adOrders: number;
  roas: number;
  profit: number;
  profitRate: number;
  fromCache?: boolean;
}

export interface ProductData {
  productId: string;
  productName: string;
  sales: number;
  orders: number;
  profit: number;
  profitRate: number;
  adCost: number;
  adSales: number;
  roas: number;
  rakutenFee: number;
  coupon: number;
  points: number;
  cost: number;
  shipping: number;
}

export interface SkuData {
  skuId: string;
  skuInfo: string;
  sales: number;
  orders: number;
  profit: number;
  profitRate: number;
  totalStock: number;
  currentStock: number;
}

export interface ProductDetailData {
  productId: string;
  productName: string;
  sales: number;
  orders: number;
  profit: number;
  profitRate: number;
  avgOrderValue: number;
  rakutenFee: number;
  coupon: number;
  points: number;
  cost: number;
  shipping: number;
  adCost: number;
  adSales: number;
  adOrders: number;
  roas: number;
  skuList: SkuData[];
}

export interface KeywordData {
  keyword: string;
  sales: number;
  orders: number;
  cpc: number;
  cvr: number;
  roas: number;
  impressions: number;
  clicks: number;
  cost: number;
}

export interface DailyKeywordData {
  date: string;
  keywords: string[];
  data: KeywordData[];
}

export interface SeoKeywordData {
  keyword: string;
  rankings: { [date: string]: number };
}

// ==========================================
// ユーティリティ関数
// ==========================================

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ja-JP').format(value);
}

export function formatPercent(value: number): string {
  return value.toFixed(1) + '%';
}

function getDateRange(period: Period, startDate?: string, endDate?: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  if (period === 'custom' && startDate && endDate) {
    return { start: new Date(startDate), end: new Date(endDate) };
  }

  switch (period) {
    case 'week':
      start.setDate(end.getDate() - 7);
      break;
    case '2weeks':
      start.setDate(end.getDate() - 14);
      break;
    case 'month':
      start.setMonth(end.getMonth() - 1);
      break;
    case '3months':
      start.setMonth(end.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(end.getFullYear() - 1);
      break;
    default:
      start.setDate(end.getDate() - 7);
  }

  return { start, end };
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ==========================================
// API関数
// ==========================================

export async function getSummary(period: Period, startDate?: string, endDate?: string): Promise<SummaryData> {
  const { start, end } = getDateRange(period, startDate, endDate);

  const { data, error } = await supabase
    .from('orders')
    .select('sales, profit, rakuten_fee, coupon, points, cost, shipping')
    .gte('order_date', formatDate(start))
    .lte('order_date', formatDate(end));

  if (error) throw error;

  let sales = 0, profit = 0, orders = 0;
  let rakutenFee = 0, coupon = 0, points = 0, cost = 0, shipping = 0;

  data?.forEach(row => {
    sales += row.sales || 0;
    profit += row.profit || 0;
    orders += 1;
    rakutenFee += row.rakuten_fee || 0;
    coupon += row.coupon || 0;
    points += row.points || 0;
    cost += row.cost || 0;
    shipping += row.shipping || 0;
  });

  return {
    period,
    startDate: formatDate(start),
    endDate: formatDate(end),
    updatedAt: new Date().toISOString(),
    sales,
    orders,
    avgOrderValue: orders > 0 ? sales / orders : 0,
    rakutenFee,
    coupon,
    points,
    cost,
    shipping,
    adCost: 0,
    adSales: 0,
    adOrders: 0,
    roas: 0,
    profit,
    profitRate: sales > 0 ? (profit / sales) * 100 : 0,
    fromCache: false
  };
}

export async function getProducts(period: Period, startDate?: string, endDate?: string): Promise<ProductData[]> {
  const { start, end } = getDateRange(period, startDate, endDate);

  const { data, error } = await supabase
    .from('orders')
    .select('product_id, product_name, sales, profit, rakuten_fee, coupon, points, cost, shipping')
    .gte('order_date', formatDate(start))
    .lte('order_date', formatDate(end));

  if (error) throw error;

  const productMap = new Map<string, ProductData>();

  data?.forEach(row => {
    const id = row.product_id;
    if (!productMap.has(id)) {
      productMap.set(id, {
        productId: id,
        productName: row.product_name || id,
        sales: 0,
        orders: 0,
        profit: 0,
        profitRate: 0,
        adCost: 0,
        adSales: 0,
        roas: 0,
        rakutenFee: 0,
        coupon: 0,
        points: 0,
        cost: 0,
        shipping: 0
      });
    }
    const product = productMap.get(id)!;
    product.sales += row.sales || 0;
    product.profit += row.profit || 0;
    product.orders += 1;
    product.rakutenFee += row.rakuten_fee || 0;
    product.coupon += row.coupon || 0;
    product.points += row.points || 0;
    product.cost += row.cost || 0;
    product.shipping += row.shipping || 0;
  });

  const products = Array.from(productMap.values());
  products.forEach(p => {
    p.profitRate = p.sales > 0 ? (p.profit / p.sales) * 100 : 0;
  });
  products.sort((a, b) => b.sales - a.sales);

  return products;
}

export async function getProductDetail(productId: string, period: Period, startDate?: string, endDate?: string): Promise<ProductDetailData> {
  const { start, end } = getDateRange(period, startDate, endDate);

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('product_id', productId)
    .gte('order_date', formatDate(start))
    .lte('order_date', formatDate(end));

  if (error) throw error;

  let sales = 0, profit = 0, orders = 0;
  let rakutenFee = 0, coupon = 0, points = 0, cost = 0, shipping = 0;
  const skuMap = new Map<string, SkuData>();

  data?.forEach(row => {
    sales += row.sales || 0;
    profit += row.profit || 0;
    orders += 1;
    rakutenFee += row.rakuten_fee || 0;
    coupon += row.coupon || 0;
    points += row.points || 0;
    cost += row.cost || 0;
    shipping += row.shipping || 0;

    const skuId = row.sku_id || 'unknown';
    if (!skuMap.has(skuId)) {
      skuMap.set(skuId, {
        skuId,
        skuInfo: row.sku_info || '',
        sales: 0,
        orders: 0,
        profit: 0,
        profitRate: 0,
        totalStock: 0,
        currentStock: 0
      });
    }
    const sku = skuMap.get(skuId)!;
    sku.sales += row.sales || 0;
    sku.profit += row.profit || 0;
    sku.orders += 1;
  });

  const skuList = Array.from(skuMap.values());
  skuList.forEach(sku => {
    sku.profitRate = sku.sales > 0 ? (sku.profit / sku.sales) * 100 : 0;
  });

  return {
    productId,
    productName: data?.[0]?.product_name || productId,
    sales,
    orders,
    profit,
    profitRate: sales > 0 ? (profit / sales) * 100 : 0,
    avgOrderValue: orders > 0 ? sales / orders : 0,
    rakutenFee,
    coupon,
    points,
    cost,
    shipping,
    adCost: 0,
    adSales: 0,
    adOrders: 0,
    roas: 0,
    skuList
  };
}

export async function getKeywords(productId: string, period: Period, startDate?: string, endDate?: string): Promise<KeywordData[]> {
  // キーワードデータはまだSupabaseに移行していないため、空配列を返す
  return [];
}

export async function getKeywordsDaily(productId: string, period: Period, startDate?: string, endDate?: string): Promise<DailyKeywordData | null> {
  // キーワード日別データはまだSupabaseに移行していないため、nullを返す
  return null;
}

export async function getSeoData(productId: string, period: Period, startDate?: string, endDate?: string): Promise<{ dates: string[]; data: SeoKeywordData[] } | null> {
  // SEOデータはまだSupabaseに移行していないため、nullを返す
  return null;
}
