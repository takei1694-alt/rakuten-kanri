const API_URL = '/api/gas';
```

## 具体的な操作

1. 1行目の先頭をクリック
2. 1行目全体を選択（`Ctrl + Shift + End` で行末まで、または手動で選択）
3. 以下をコピーして貼り付け：
```
const API_URL = '/api/gas';
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
  period: string;
  startDate: string;
  endDate: string;
  sales: number;
  orders: number;
  avgOrderValue: number;
  profit: number;
  profitRate: number;
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
  impressions: number;
  clicks: number;
  adCost: number;
  sales: number;
  orders: number;
  days: number;
  avgImpressions: number;
  avgClicks: number;
  avgAdCost: number;
  avgSales: number;
  ctr: number;
  cpc: number;
  cvr: number;
  roas: number;
}

export interface DailyKeywordData {
  date: string;
  total: {
    impressions: number;
    clicks: number;
    adCost: number;
    sales: number;
    orders: number;
    ctr: number;
    cpc: number;
    cvr: number;
    roas: number;
  };
  keywords: {
    keyword: string;
    impressions: number;
    clicks: number;
    adCost: number;
    sales: number;
    orders: number;
    ctr: number;
    cpc: number;
    cvr: number;
    roas: number;
  }[];
}

export interface SeoKeywordData {
  keyword: string;
  rankings: Record<string, number>;
}

async function fetchApi<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(API_URL);
  url.searchParams.set('action', action);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.success && data.error) {
    throw new Error(data.error);
  }
  
  return data;
}

export async function getSummary(period: Period, startDate?: string, endDate?: string): Promise<SummaryData> {
  const params: Record<string, string> = { period };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  
  const response = await fetchApi<{ success: boolean; data: SummaryData }>('summary', params);
  return response.data;
}

export async function getProducts(period: Period, startDate?: string, endDate?: string): Promise<ProductData[]> {
  const params: Record<string, string> = { period };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  
  const response = await fetchApi<{ success: boolean; data: ProductData[] }>('products', params);
  return response.data;
}

export async function getProductDetail(productId: string, period: Period, startDate?: string, endDate?: string): Promise<ProductDetailData> {
  const params: Record<string, string> = { productId, period };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  
  const response = await fetchApi<{ success: boolean; data: ProductDetailData }>('product', params);
  return response.data;
}

export async function getKeywords(productId: string, period: Period, startDate?: string, endDate?: string): Promise<KeywordData[]> {
  const params: Record<string, string> = { productId, period };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  
  const response = await fetchApi<{ success: boolean; data: KeywordData[] }>('keywords', params);
  return response.data;
}

export async function getKeywordsDaily(productId: string, period: Period, startDate?: string, endDate?: string): Promise<{ keywords: string[]; data: DailyKeywordData[] }> {
  const params: Record<string, string> = { productId, period };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  
  const response = await fetchApi<{ success: boolean; keywords: string[]; data: DailyKeywordData[] }>('keywordsDaily', params);
  return { keywords: response.keywords, data: response.data };
}

export async function getSeoData(productId: string): Promise<{ dates: string[]; data: SeoKeywordData[] }> {
  const response = await fetchApi<{ success: boolean; dates: string[]; data: SeoKeywordData[] }>('seo', { productId });
  return { dates: response.dates, data: response.data };
}

export function formatCurrency(value: number): string {
  return '¥' + value.toLocaleString('ja-JP');
}

export function formatPercent(value: number): string {
  return value.toFixed(1) + '%';
}

export function formatNumber(value: number): string {
  return value.toLocaleString('ja-JP');
}
