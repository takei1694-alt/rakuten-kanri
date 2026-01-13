const API_URL = '/api/gas';

// 型定義
export type Period = 'week' | '2weeks' | 'month' | '3months' | 'year' | 'custom';

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

export interface SeoKeywordData {
  keyword: string;
  currentRank: number;
  previousRank: number;
  rankChange: number;
  searchDate: string;
}

// API呼び出し用の内部型
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// 汎用API呼び出し関数
async function fetchApi<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  const searchParams = new URLSearchParams({ action, ...params });
  const url = `${API_URL}?${searchParams.toString()}`;

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const result: ApiResponse<T> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Unknown error');
  }
  
  return result.data;
}

// 商品詳細を取得
export async function getProductDetail(
  productId: string,
  period: Period = 'month',
  startDate?: string,
  endDate?: string
): Promise<ProductDetailData> {
  const params: Record<string, string> = { productId, period };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  return fetchApi<ProductDetailData>('productDetail', params);
}

// キーワードデータ（平均）を取得
export async function getKeywords(
  productId?: string,
  period?: Period,
  startDate?: string,
  endDate?: string
): Promise<KeywordData[]> {
  const params: Record<string, string> = {};
  if (productId) params.productId = productId;
  if (period) params.period = period;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  return fetchApi<KeywordData[]>('adsAverage', params);
}

// キーワードデータ（日別）を取得
export async function getKeywordsDaily(
  productId?: string,
  period?: Period,
  startDate?: string,
  endDate?: string
): Promise<DailyKeywordData[]> {
  const params: Record<string, string> = {};
  if (productId) params.productId = productId;
  if (period) params.period = period;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  return fetchApi<DailyKeywordData[]>('adsDaily', params);
}

// SEOデータを取得
export async function getSeoData(productId: string): Promise<SeoKeywordData[]> {
  return fetchApi<SeoKeywordData[]>('seoRanking', { productId });
}

// ユーティリティ関数
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ja-JP').format(value);
}
