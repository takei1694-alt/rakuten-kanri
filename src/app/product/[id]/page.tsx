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
  InventoryData,
  getProductDetail,
  getKeywords,
  getKeywordsDaily,
  getSeoData,
  getInventory,
  formatCurrency,
  formatPercent,
  formatNumber,
} from '@/lib/api';

type TabType = 'sales' | 'sku' | 'seo' | 'ads' | 'inventory' | 'tasks' | 'memos' | 'actions' | 'competitors';

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
  const [inventory, setInventory] = useState<InventoryData[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adsViewMode, setAdsViewMode] = useState<'daily' | 'average'>('daily');
  const [splitMode, setSplitMode] = useState(false);
  const [rightTab, setRightTab] = useState<TabType>('ads');
  const [splitPosition, setSplitPosition] = useState(50);

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
      
      const seo = await getSeoData(productId, period, period === 'custom' ? startDate : undefined, period === 'custom' ? endDate : undefined);
      setSeoData(seo);
      const inv = await getInventory(productId);
      setInventory(inv);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [productId, period, startDate, endDate]);

  const fetchAdsData = useCallback(async () => {
    if (activeTab !== 'ads' && rightTab !== 'ads') return;
    
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
        const kwDaily = await getKeywordsDaily(
          productId,
          period,
          period === 'custom' ? startDate : undefined,
          period === 'custom' ? endDate : undefined
        );
        setKeywordsDaily(kwDaily);
      }
    } catch (err) {
      console.error('広告データ取得エラー:', err);
    }
  }, [productId, period, startDate, endDate, activeTab, rightTab, adsViewMode]);

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

  // タブコンテンツを描画する関数
  function renderTabContent(tab: TabType) {
    switch (tab) {
      case 'sales':
        return detail ? <SalesTab detail={detail} /> : null;
      case 'sku':
        return detail ? <SkuTab skuList={detail.skuList} /> : null;
      case 'seo':
        return seoData ? <SeoTab data={seoData} /> : null;
      case 'ads':
        return (
          <AdsTab
            viewMode={adsViewMode}
            onViewModeChange={setAdsViewMode}
            keywords={keywords}
            keywordsDaily={keywordsDaily}
          />
        );
     case 'inventory':
        return <InventoryTab inventory={inventory} />;
      case 'tasks':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">✅ タスク</h3>
            <p className="text-gray-500">この商品のタスク管理</p>
            <div className="text-center text-gray-400 py-8">🚧 準備中</div>
          </div>
        );
      case 'memos':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">📝 メモ</h3>
            <p className="text-gray-500">この商品のメモ</p>
            <div className="text-center text-gray-400 py-8">🚧 準備中</div>
          </div>
        );
      case 'actions':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">🎯 自社施策</h3>
            <p className="text-gray-500">この商品の施策履歴</p>
            <div className="text-center text-gray-400 py-8">🚧 準備中</div>
          </div>
        );
      case 'competitors':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">👀 競合</h3>
            <p className="text-gray-500">この商品の競合情報</p>
            <div className="text-center text-gray-400 py-8">🚧 準備中</div>
          </div>
        );
      default:
        return null;
    }
  }

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
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          一覧に戻る
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {detail?.productName || productId}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{productId}</p>
        </div>

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

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-1 items-center">
            {[
              { id: 'sales', label: '売上' },
              { id: 'sku', label: 'SKU' },
              { id: 'seo', label: 'SEO' },
              { id: 'ads', label: '広告' },
              { id: 'inventory', label: '在庫' },
              { id: 'tasks', label: 'タスク' },
              { id: 'memos', label: 'メモ' },
              { id: 'actions', label: '自社施策' },
              { id: 'competitors', label: '競合' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
            <button
              onClick={() => setSplitMode(!splitMode)}
              className={`ml-4 px-3 py-1 text-sm rounded ${splitMode ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
            >
              {splitMode ? '✕ 分割解除' : '⫽ 2画面分割'}
            </button>
          </nav>
        </div>

        {!splitMode ? (
          <div>
            {renderTabContent(activeTab)}
          </div>
        ) : (
          <div className="flex gap-2">
            <div style={{ width: `${splitPosition}%` }} className="min-w-[200px]">
              <div className="mb-2">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value as TabType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="sales">売上</option>
                  <option value="sku">SKU</option>
                  <option value="seo">SEO</option>
                  <option value="ads">広告</option>
                  <option value="inventory">在庫</option>
                  <option value="tasks">タスク</option>
                  <option value="memos">メモ</option>
                  <option value="actions">自社施策</option>
                  <option value="competitors">競合</option>
                </select>
              </div>
              {renderTabContent(activeTab)}
            </div>

            <div
              className="w-2 bg-gray-300 hover:bg-blue-400 cursor-col-resize rounded flex-shrink-0"
              onMouseDown={(e) => {
                e.preventDefault();
                const startX = e.clientX;
                const startPos = splitPosition;
                const onMouseMove = (e: MouseEvent) => {
                  const diff = e.clientX - startX;
                  const containerWidth = window.innerWidth * 0.8;
                  const newPos = startPos + (diff / containerWidth) * 100;
                  setSplitPosition(Math.max(20, Math.min(80, newPos)));
                };
                const onMouseUp = () => {
                  document.removeEventListener('mousemove', onMouseMove);
                  document.removeEventListener('mouseup', onMouseUp);
                };
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
              }}
            />

            <div style={{ width: `${100 - splitPosition}%` }} className="min-w-[200px]">
              <div className="mb-2">
                <select
                  value={rightTab}
                  onChange={(e) => setRightTab(e.target.value as TabType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="sales">売上</option>
                  <option value="sku">SKU</option>
                  <option value="seo">SEO</option>
                  <option value="ads">広告</option>
                  <option value="inventory">在庫</option>
                  <option value="tasks">タスク</option>
                  <option value="memos">メモ</option>
                  <option value="actions">自社施策</option>
                  <option value="competitors">競合</option>
                </select>
              </div>
              {renderTabContent(rightTab)}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SalesTab({ detail }: { detail: ProductDetailData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
function InventoryTab({ inventory }: { inventory: InventoryData[] }) {
  if (inventory.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">📦 在庫</h3>
        <p className="text-gray-500 text-center py-8">在庫データがありません</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">在庫一覧 ({inventory.length}件)</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>バリエーション</th>
              <th className="text-right">総在庫</th>
              <th className="text-right">現在庫</th>
              <th className="text-right">出荷中</th>
              <th className="text-right">発注中</th>
              <th className="text-right">単価</th>
              <th className="text-right">在庫金額</th>
              <th>更新日</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item.skuId}>
                <td className="font-medium">{item.skuId}</td>
                <td className="text-gray-600">{item.skuInfo || '-'}</td>
                <td className="text-right">{formatNumber(item.totalStock)}</td>
                <td className={`text-right font-medium ${item.currentStock <= 5 ? 'text-red-600' : item.currentStock <= 10 ? 'text-amber-600' : ''}`}>
                  {formatNumber(item.currentStock)}
                </td>
                <td className="text-right">{formatNumber(item.shippingStock)}</td>
                <td className="text-right">{formatNumber(item.orderedStock)}</td>
                <td className="text-right">{formatCurrency(item.unitCost)}</td>
                <td className="text-right">{formatCurrency(item.stockValue)}</td>
                <td className="text-gray-500">{item.lastUpdated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
