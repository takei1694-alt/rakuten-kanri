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
  ctr: number;
  roas: number;
  impressions: number;
  clicks: number;
  cost: number;
  adCost: number;
}

export interface DailyKeywordData {
  date: string;
  keywords: KeywordData[];
  total: KeywordData;
}

export interface SeoKeywordData {
  keyword: string;
  rankings: { [date: string]: number };
}

export interface InventoryData {
  skuId: string;
  skuInfo: string;
  productName: string;
  totalStock: number;
  currentStock: number;
  shippingStock: number;
  orderedStock: number;
  unitCost: number;
  stockValue: number;
  lastUpdated: string;
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
  return [];
}

export async function getKeywordsDaily(productId: string, period: Period, startDate?: string, endDate?: string): Promise<{ keywords: string[]; data: DailyKeywordData[] } | null> {
  return null;
}

export async function getSeoData(productId: string, period: Period, startDate?: string, endDate?: string): Promise<{ dates: string[]; data: SeoKeywordData[] } | null> {
  return null;
}

export async function getInventory(productId: string): Promise<InventoryData[]> {
  const { data, error } = await supabase
    .from('inventory')
    .select('sku_id, sku_info, product_name, total_stock, current_stock, shipping_stock, ordered_stock, unit_cost, stock_value, last_updated')
    .eq('product_id', productId)
    .order('sku_id');

  if (error) throw error;

  return (data || []).map(row => ({
    skuId: row.sku_id || '',
    skuInfo: row.sku_info || '',
    productName: row.product_name || '',
    totalStock: row.total_stock || 0,
    currentStock: row.current_stock || 0,
    shippingStock: row.shipping_stock || 0,
    orderedStock: row.ordered_stock || 0,
    unitCost: row.unit_cost || 0,
    stockValue: row.stock_value || 0,
    lastUpdated: row.last_updated || ''
  }));
}
// ==========================================
// リアルタイム（最新注文）
// ==========================================

export interface RecentOrderData {
  orderId: string;
  orderDate: string;
  productId: string;
  productName: string;
  skuInfo: string;
  quantity: number;
  sales: number;
  rakutenFee: number;
  coupon: number;
  points: number;
  cost: number;
  shipping: number;
  profit: number;
  profitRate: number;
}
export async function getRecentOrders(): Promise<RecentOrderData[]> {
  // 直近1週間の日付を計算
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const startDate = oneWeekAgo.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .gte('order_date', startDate)
    .order('order_date', { ascending: false });

  if (error) {
    console.error('getRecentOrders error:', error);
    return [];
  }

  return (data || []).map(row => ({
    orderId: row.order_id || row.id || '',
    orderDate: row.order_date || '',
    productId: row.product_id || '',
    productName: row.product_name || '',
    skuInfo: row.sku_info || '',
    quantity: row.quantity || 1,
    sales: row.sales || 0,
    rakutenFee: row.rakuten_fee || 0,
    coupon: row.coupon || 0,
    points: row.points || 0,
    cost: row.cost || 0,
    shipping: row.shipping || 0,
    profit: row.profit || 0,
    profitRate: row.sales > 0 ? (row.profit / row.sales) * 100 : 0
  }));
}
