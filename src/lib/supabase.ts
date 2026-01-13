import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// 期間に応じた日付範囲を取得
function getDateRange(period: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();
  
  switch (period) {
    case 'week':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '2week':
      startDate.setDate(endDate.getDate() - 14);
      break;
    case 'month':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case '3month':
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 7);
  }
  
  return { startDate, endDate };
}

// 日付をYYYY-MM-DD形式に変換
function formatDateForQuery(date: Date): string {
  return date.toISOString().split('T')[0];
}

// 商品サマリーを取得（トップページ用）
export async function getProductsSummary(period: string) {
  const { startDate, endDate } = getDateRange(period);
  
  const { data, error } = await supabase
    .from('orders')
    .select('product_id, product_name, sales, profit, profit_rate')
    .gte('order_date', formatDateForQuery(startDate))
    .lte('order_date', formatDateForQuery(endDate));
  
  if (error) throw error;
  
  // 商品ごとに集計
  const productMap = new Map();
  
  data?.forEach(row => {
    const id = row.product_id;
    if (!productMap.has(id)) {
      productMap.set(id, {
        productId: id,
        productName: row.product_name || id,
        sales: 0,
        profit: 0,
        orders: 0
      });
    }
    const product = productMap.get(id);
    product.sales += row.sales || 0;
    product.profit += row.profit || 0;
    product.orders += 1;
  });
  
  const products = Array.from(productMap.values());
  products.sort((a, b) => b.sales - a.sales);
  
  const totalSales = products.reduce((sum, p) => sum + p.sales, 0);
  const totalProfit = products.reduce((sum, p) => sum + p.profit, 0);
  const totalOrders = products.reduce((sum, p) => sum + p.orders, 0);
  
  return {
    summary: {
      totalSales,
      totalProfit,
      totalOrders,
      productCount: products.length
    },
    products
  };
}

// 商品詳細を取得
export async function getProductDetail(productId: string, period: string) {
  const { startDate, endDate } = getDateRange(period);
  
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('product_id', productId)
    .gte('order_date', formatDateForQuery(startDate))
    .lte('order_date', formatDateForQuery(endDate));
  
  if (error) throw error;
  
  let sales = 0, profit = 0, orders = 0;
  let rakutenFee = 0, coupon = 0, points = 0, cost = 0, shipping = 0;
  const skuMap = new Map();
  
  data?.forEach(row => {
    sales += row.sales || 0;
    profit += row.profit || 0;
    orders += 1;
    rakutenFee += row.rakuten_fee || 0;
    coupon += row.coupon || 0;
    points += row.points || 0;
    cost += row.cost || 0;
    shipping += row.shipping || 0;
    
    // SKU集計
    const skuId = row.sku_id || 'unknown';
    if (!skuMap.has(skuId)) {
      skuMap.set(skuId, {
        skuId,
        skuInfo: row.sku_info || '',
        sales: 0,
        profit: 0,
        orders: 0
      });
    }
    const sku = skuMap.get(skuId);
    sku.sales += row.sales || 0;
    sku.profit += row.profit || 0;
    sku.orders += 1;
  });
  
  const skuList = Array.from(skuMap.values()).map(sku => ({
    ...sku,
    profitRate: sku.sales > 0 ? (sku.profit / sku.sales) * 100 : 0,
    totalStock: 0,
    currentStock: 0
  }));
  
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
