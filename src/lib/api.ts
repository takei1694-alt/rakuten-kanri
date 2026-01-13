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

export interface ProductDetailData {
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
  dailyData?: Array<{
    date: string;
    sales: number;
    orders: number;
    profit: number;
  }>;
}

export interface SkuStockData {
  productId: string;
  productName: string;
  skuId: string;
  skuName: string;
  stock: number;
  salesPerDay: number;
  stockDays: number;
}

export interface SeoRankingData {
  productId: string;
  productName: string;
  keyword: string;
  currentRank: number;
  previousRank: number;
  rankChange: number;
  searchDate: string;
}

export interface SeoKeywordData {
  keyword: string;
  currentRank: number;
  previousRank: number;
  rankChange: number;
  searchDate: string;
}

export interface AdsDailyData {
  date: string;
  productId: string;
  productName: string;
  keyword: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cost: number;
  sales: number;
  orders: number;
  cvr: number;
  roas: number;
}

export interface DailyKeywordData {
  date: string;
  keyword: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cost: number;
  sales: number;
  orders: number;
  cvr: number;
  roas: number;
}

export interface AdsAverageData {
  productId: string;
  productName: string;
  keyword: string;
  avgImpressions: number;
  avgClicks: number;
  avgCtr: number;
  avgCpc: number;
  avgCost: number;
  avgSales: number;
  avgOrders: number;
  avgCvr: number;
  avgRoas: number;
  totalCost: number;
  totalSales: number;
  totalOrders: number;
}

export interface KeywordData {
  keyword: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cost: number;
  sales: number;
  orders: number;
  cvr: number;
  roas: number;
}

async function fetchApi<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  const searchParams = new URLSearchParams({ action, ...params });
  const url = `${API_URL}?${searchParams.toString()}`;

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Unknown error');
  }
  
  return data.data;
}

export async function getSummary(period: Period = 'month', startDate?: string, endDate?: string): Promise<SummaryData> {
  const params: Record<string, string> = { period };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  return fetchApi<SummaryData>('summary', params);
}

export async function getProducts(period: Period = 'month', startDate?: string, endDate?: string): Promise<ProductData[]> {
  const params: Record<string, string> = { period };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  return fetchApi<ProductData[]>('products', params);
}

export async function getProductDetail(productId: string, period: Period = 'month'): Promise<ProductDetailData> {
  return fetchApi<ProductDetailData>('productDetail', { productId, period });
}

export async function getSkuStock(productId?: string): Promise<SkuStockData[]> {
  const params: Record<string, string> = {};
  if (productId) params.productId = productId;
  return fetchApi<SkuStockData[]>('skuStock', params);
}

export async function getSeoData(productId?: string): Promise<SeoRankingData[]> {
  const params: Record<string, string> = {};
  if (productId) params.productId = productId;
  return fetchApi<SeoRankingData[]>('seoRanking', params);
}

export async function getProductSeoData(productId: string): Promise<SeoKeywordData[]> {
  return fetchApi<SeoKeywordData[]>('seoRanking', { productId });
}

export async function getKeywordsDaily(productId?: string, days?: number): Promise<AdsDailyData[]> {
  const params: Record<string, string> = {};
  if (productId) params.productId = productId;
  if (days) params.days = days.toString();
  return fetchApi<AdsDailyData[]>('adsDaily', params);
}

export async function getProductKeywordsDaily(productId: string, days?: number): Promise<DailyKeywordData[]> {
  const params: Record<string, string> = { productId };
  if (days) params.days = days.toString();
  return fetchApi<DailyKeywordData[]>('adsDaily', params);
}

export async function getKeywords(productId?: string): Promise<AdsAverageData[]> {
  const params: Record<string, string> = {};
  if (productId) params.productId = productId;
  return fetchApi<AdsAverageData[]>('adsAverage', params);
}

export async function getProductKeywords(productId: string): Promise<KeywordData[]> {
  return fetchApi<KeywordData[]>('adsAverage', { productId });
}
