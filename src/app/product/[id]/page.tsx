'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import PeriodSelector from '@/components/PeriodSelector';
import {
  Period,
  ProductDetailData,
  KeywordData,
  DailyKeywordData,
  SeoKeywordData,
  getProductDetail,
  getKeywords,
  getKeywordsDaily,
  getSeoData,
  formatCurrency,
  formatPercent,
  formatNumber,
} from '@/lib/api';

type TabType = 'sales' | 'sku' | 'seo' | 'ads';

export default function ProductDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const productId = decodeURIComponent(params.id as string);
  const initialPeriod = (searchParams.get('period') as Period) || 'month';
  
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('sales');
  
  const [detail, setDetail] = useState<ProductDetailData | null>(null);
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [keywordsDaily, setKeywordsDaily] = useState<{ keywords: string[]; data: DailyKeywordData[] } | null>(null);
  const [seoData, setSeoData] = useState<{ dates: string[]; data: SeoKeywordData[] } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adsViewMode, setAdsViewMode] = useState<'daily' | 'average'>('daily');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const detailData = await getProductDetail(
        productId, 
        period,
        period === 'custom' ? startDate : undefined, 
        period === 'custom' ? endDate : undefined
      );
      setDetail(detailData);
      
      // SEOデータは期間に関係なく取得
    const seoRaw = await getSeoData(productId);
        const seoFormatted = {
          dates: seoRaw.map(item => item.searchDate),
          data: seoRaw.map(item => ({
            keyword: item.keyword,
            currentRank: item.currentRank,
            previousRank: item.previousRank,
            rankChange: item.rankChange,
            searchDate: item.searchDate,
          }))
        };
        setSeoData(seoFormatted);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [productId, period, startDate, endDate]);

  const fetchAdsData = useCallback(async () => {
    if (activeTab !== 'ads') return;
    
    try {
      if (adsViewMode === 'average') {
        const kw = await getKeywords(
          productId,
          period,
          period === 'custom' ? startDate : undefined,
          period === 'custom' ? endDate : undefined
        );
        setKeywords(kw);
      } else {
    const kwDailyRaw = await getKeywordsDaily(
          productId,
          period,
          period === 'custom' ? startDate : undefined,
          period === 'custom' ? endDate : undefined
        );
        const kwDailyFormatted = {
          keywords: Array.from(new Set(kwDailyRaw.map(item => item.keyword))),
          data: kwDailyRaw
        };
        setKeywordsDaily(kwDailyFormatted);
      }
    } catch (err) {
      console.error('広告データ取得エラー:', err);
    }
  }, [productId, period, startDate, endDate, activeTab, adsViewMode]);

  useEffect(() => {
    if (period === 'custom') {
      if (startDate && endDate) {
        fetchData();
      }
    } else {
      fetchData();
    }
  }, [period, startDate, endDate, fetchData]);

  useEffect(() => {
    fetchAdsData();
  }, [fetchAdsData]);

  if (loading && !detail) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-32 mb-8"></div>
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 戻るボタン */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          一覧に戻る
        </button>

        {/* 商品名 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {detail?.productName || productId}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{productId}</p>
        </div>

        {/* 期間選択 */}
        <div className="mb-6">
          <PeriodSelector
            value={period}
            onChange={setPeriod}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* タブ */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-1">
            {[
              { id: 'sales', label: '売上' },
              { id: 'sku', label: 'SKU' },
              { id: 'seo', label: 'SEO' },
              { id: 'ads', label: '広告' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* タブコンテンツ */}
        {activeTab === 'sales' && detail && (
          <SalesTab detail={detail} />
        )}
        
        {activeTab === 'sku' && detail && (
          <SkuTab skuList={detail.skuList} />
        )}
        
        {activeTab === 'seo' && seoData && (
          <SeoTab data={seoData} />
        )}
        
        {activeTab === 'ads' && (
          <AdsTab
            viewMode={adsViewMode}
            onViewModeChange={setAdsViewMode}
            keywords={keywords}
            keywordsDaily={keywordsDaily}
          />
        )}
      </main>
    </div>
  );
}

// 売上タブ
function SalesTab({ detail }: { detail: ProductDetailData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 売上系 */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-500 mb-4">📊 売上系</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">売上</p>
            <p className="text-xl font-bold">{formatCurrency(detail.sales)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">注文件数</p>
            <p className="text-xl font-bold">{formatNumber(detail.orders)}件</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">客単価</p>
            <p className="text-xl font-bold">{formatCurrency(detail.avgOrderValue)}</p>
          </div>
        </div>
      </div>

      {/* 利益系 */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-500 mb-4">💰 利益系</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">利益</p>
            <p className={`text-xl font-bold ${detail.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(detail.profit)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">利益率</p>
            <p className={`text-xl font-bold ${detail.profitRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatPercent(detail.profitRate)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">原価</p>
            <p className="text-xl font-bold">{formatCurrency(detail.cost)}</p>
          </div>
        </div>
      </div>

      {/* 費用系 */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-500 mb-4">💸 費用系</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">楽天手数料</p>
            <p className="text-lg font-semibold">{formatCurrency(detail.rakutenFee)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">クーポン</p>
            <p className="text-lg font-semibold">{formatCurrency(detail.coupon)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">ポイント</p>
            <p className="text-lg font-semibold">{formatCurrency(detail.points)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">送料</p>
            <p className="text-lg font-semibold">{formatCurrency(detail.shipping)}</p>
          </div>
        </div>
      </div>

      {/* 広告系 */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-500 mb-4">📢 広告系</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">広告費</p>
            <p className="text-xl font-bold">{formatCurrency(detail.adCost)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">広告売上</p>
            <p className="text-xl font-bold">{formatCurrency(detail.adSales)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">ROAS</p>
            <p className={`text-xl font-bold ${detail.roas >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {formatPercent(detail.roas)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">広告件数</p>
            <p className="text-xl font-bold">{formatNumber(detail.adOrders)}件</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// SKUタブ
function SkuTab({ skuList }: { skuList: ProductDetailData['skuList'] }) {
  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">SKU一覧 ({skuList.length}件)</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>バリエーション</th>
              <th className="text-right">売上</th>
              <th className="text-right">件数</th>
              <th className="text-right">利益</th>
              <th className="text-right">利益率</th>
              <th className="text-right">総在庫</th>
              <th className="text-right">現在庫</th>
            </tr>
          </thead>
          <tbody>
            {skuList.map((sku) => (
              <tr key={sku.skuId}>
                <td className="font-medium">{sku.skuId}</td>
                <td className="text-gray-600">{sku.skuInfo || '-'}</td>
                <td className="text-right font-medium">{formatCurrency(sku.sales)}</td>
                <td className="text-right">{formatNumber(sku.orders)}件</td>
                <td className={`text-right font-medium ${sku.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(sku.profit)}
                </td>
                <td className={`text-right ${sku.profitRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatPercent(sku.profitRate)}
                </td>
                <td className="text-right">{formatNumber(sku.totalStock)}</td>
                <td className={`text-right font-medium ${sku.currentStock <= 10 ? 'text-red-600' : ''}`}>
                  {formatNumber(sku.currentStock)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// SEOタブ
function SeoTab({ data }: { data: { dates: string[]; data: SeoKeywordData[] } }) {
  const recentDates = data.dates.slice(-7);
  
  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">キーワード順位 ({data.data.length}件)</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>キーワード</th>
              {recentDates.map((date) => (
                <th key={date} className="text-center">{date}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.data.map((keyword) => (
              <tr key={keyword.keyword}>
                <td className="font-medium">{keyword.keyword}</td>
                {recentDates.map((date) => {
                  const rank = keyword.rankings[date];
                  return (
                    <td key={date} className="text-center">
                      {rank ? (
                        <span className={`font-medium ${rank <= 10 ? 'text-emerald-600' : rank <= 30 ? 'text-amber-600' : 'text-gray-600'}`}>
                          {rank}位
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 広告タブ
function AdsTab({
  viewMode,
  onViewModeChange,
  keywords,
  keywordsDaily,
}: {
  viewMode: 'daily' | 'average';
  onViewModeChange: (mode: 'daily' | 'average') => void;
  keywords: KeywordData[];
  keywordsDaily: { keywords: string[]; data: DailyKeywordData[] } | null;
}) {
  const [selectedKeyword, setSelectedKeyword] = useState<string>('all');

  return (
    <div>
      {/* 表示切替 */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => onViewModeChange('daily')}
            className={`period-button ${viewMode === 'daily' ? 'active' : ''}`}
          >
            日別
          </button>
          <button
            onClick={() => onViewModeChange('average')}
            className={`period-button ${viewMode === 'average' ? 'active' : ''}`}
          >
            平均
          </button>
        </div>

        {viewMode === 'daily' && keywordsDaily && (
          <select
            value={selectedKeyword}
            onChange={(e) => setSelectedKeyword(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">全キーワード</option>
            {keywordsDaily.keywords.map((kw) => (
              <option key={kw} value={kw}>{kw}</option>
            ))}
          </select>
        )}
      </div>

      {/* 日別表示 */}
      {viewMode === 'daily' && keywordsDaily && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>日付</th>
                  <th className="text-right">表示回数</th>
                  <th className="text-right">CTR</th>
                  <th className="text-right">クリック数</th>
                  <th className="text-right">CPC</th>
                  <th className="text-right">実績額</th>
                  <th className="text-right">売上</th>
                  <th className="text-right">件数</th>
                  <th className="text-right">CVR</th>
                  <th className="text-right">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {keywordsDaily.data.map((day) => {
                  const data = selectedKeyword === 'all' 
                    ? day.total 
                    : day.keywords.find(k => k.keyword === selectedKeyword) || day.total;
                  
                  return (
                    <tr key={day.date}>
                      <td className="font-medium">{day.date}</td>
                      <td className="text-right">{formatNumber(data.impressions)}</td>
                      <td className="text-right">{formatPercent(data.ctr)}</td>
                      <td className="text-right">{formatNumber(data.clicks)}</td>
                      <td className="text-right">{formatCurrency(data.cpc)}</td>
                      <td className="text-right">{formatCurrency(data.adCost)}</td>
                      <td className="text-right font-medium">{formatCurrency(data.sales)}</td>
                      <td className="text-right">{formatNumber(data.orders)}件</td>
                      <td className="text-right">{formatPercent(data.cvr)}</td>
                      <td className={`text-right font-medium ${data.roas >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {formatPercent(data.roas)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 平均表示 */}
      {viewMode === 'average' && keywords.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>キーワード</th>
                  <th className="text-right">表示回数</th>
                  <th className="text-right">CTR</th>
                  <th className="text-right">クリック数</th>
                  <th className="text-right">CPC</th>
                  <th className="text-right">実績額</th>
                  <th className="text-right">売上</th>
                  <th className="text-right">件数</th>
                  <th className="text-right">CVR</th>
                  <th className="text-right">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((kw) => (
                  <tr key={kw.keyword}>
                    <td className="font-medium">{kw.keyword}</td>
                    <td className="text-right">{formatNumber(kw.impressions)}</td>
                    <td className="text-right">{formatPercent(kw.ctr)}</td>
                    <td className="text-right">{formatNumber(kw.clicks)}</td>
                    <td className="text-right">{formatCurrency(kw.cpc)}</td>
                    <td className="text-right">{formatCurrency(kw.adCost)}</td>
                    <td className="text-right font-medium">{formatCurrency(kw.sales)}</td>
                    <td className="text-right">{formatNumber(kw.orders)}件</td>
                    <td className="text-right">{formatPercent(kw.cvr)}</td>
                    <td className={`text-right font-medium ${kw.roas >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {formatPercent(kw.roas)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
