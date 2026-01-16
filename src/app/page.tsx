'use client';
import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import PeriodSelector from '@/components/PeriodSelector';
import SummaryCards from '@/components/SummaryCards';
import ProductTable from '@/components/ProductTable';
import { Period, SummaryData, ProductData, RecentOrderData, getSummary, getProducts, getRecentOrders, formatCurrency, formatPercent, formatNumber } from '@/lib/api';

// タブの定義（7タブに変更）
const TABS = [
  { id: 'realtime', name: 'リアルタイム' },
  { id: 'products', name: '商品一覧' },
  { id: 'sales', name: '売上利益' },
  { id: 'ads', name: '広告' },
  { id: 'seo', name: 'SEO' },
  { id: 'inventory', name: '在庫' },
  { id: 'unlisted', name: '未出品' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>('realtime');
  const [period, setPeriod] = useState<Period>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, productsData, recentOrdersData] = await Promise.all([
  getSummary(period, period === 'custom' ? startDate : undefined, period === 'custom' ? endDate : undefined),
  getProducts(period, period === 'custom' ? startDate : undefined, period === 'custom' ? endDate : undefined),
  getRecentOrders(),
]);
setSummary(summaryData);
setProducts(productsData);
setRecentOrders(recentOrdersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate]);

  useEffect(() => {
    if (period === 'custom') {
      if (startDate && endDate) {
        fetchData();
      }
    } else {
      fetchData();
    }
  }, [period, startDate, endDate, fetchData]);

  const filteredProducts = products.filter(product => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      product.productId.toLowerCase().includes(query) ||
      (product.productName && product.productName.toLowerCase().includes(query))
    );
  });

  // タブコンテンツのレンダリング
  const renderTabContent = () => {
    switch (activeTab) {
      case 'realtime':
        return <RealtimeTab orders={recentOrders} />;
      case 'products':
        return <ProductTable products={filteredProducts} loading={loading} period={period} />;
      case 'sales':
        return <SalesTab products={filteredProducts} />;
      case 'ads':
        return <AdsTab />;
      case 'seo':
        return <SeoTab />;
      case 'inventory':
        return <InventoryTab />;
      case 'unlisted':
        return <UnlistedTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-gray-600">楽天市場の売上・利益データを確認できます</p>
        </div>

        <PeriodSelector
          value={period}
          onChange={setPeriod}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <SummaryCards data={summary} loading={loading} />
            
            {/* タブナビゲーション */}
            <div className="mt-8 border-b border-gray-200">
              <nav className="-mb-px flex space-x-1 overflow-x-auto">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors
                      ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* 検索バー（商品一覧タブのみ表示） */}
            {(activeTab === 'products' || activeTab === 'sales') && (
              <div className="mt-6 mb-4">
                <input
                  type="text"
                  placeholder="商品ID・商品名で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* タブコンテンツ */}
            <div className="mt-4">
              {renderTabContent()}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// ==========================================
// リアルタイムタブ
// ==========================================
function RealtimeTab({ orders }: { orders: RecentOrderData[] }) {
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">📡 リアルタイム（直近1週間）</h3>
        <p className="text-gray-500 text-center py-8">注文データがありません</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">📡 最新注文（直近1週間） - {orders.length}件</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">日付</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">商品名</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">SKU</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">個数</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">売上</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">手数料</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">クーポン</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">ポイント</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">原価</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">送料</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">利益</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">利益率</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order, index) => (
              <tr key={`${order.orderId}-${index}`} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-600">{order.orderDate}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.productName}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{order.skuInfo || '-'}</td>
                <td className="px-4 py-3 text-sm text-right">{formatNumber(order.quantity)}</td>
                <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(order.sales)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">{formatCurrency(order.rakutenFee)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">{formatCurrency(order.coupon)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">{formatCurrency(order.points)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">{formatCurrency(order.cost)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">{formatCurrency(order.shipping)}</td>
                <td className={`px-4 py-3 text-sm text-right font-medium ${order.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(order.profit)}
                </td>
                <td className={`px-4 py-3 text-sm text-right ${order.profitRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(order.profitRate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 売上利益タブ
// ==========================================
function SalesTab({ products }: { products: ProductData[] }) {
  const [sortBy, setSortBy] = useState<'sales' | 'profit' | 'profitRate'>('sales');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const sortedProducts = [...products].sort((a, b) => {
    let aVal = 0, bVal = 0;
    if (sortBy === 'sales') {
      aVal = a.sales || 0;
      bVal = b.sales || 0;
    } else if (sortBy === 'profit') {
      aVal = a.profit || 0;
      bVal = b.profit || 0;
    } else if (sortBy === 'profitRate') {
      aVal = a.profitRate || 0;
      bVal = b.profitRate || 0;
    }
    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
  });

  const handleSort = (column: 'sales' | 'profit' | 'profitRate') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ column }: { column: 'sales' | 'profit' | 'profitRate' }) => (
    <span className="ml-1">
      {sortBy === column ? (sortOrder === 'desc' ? '▼' : '▲') : '▽'}
    </span>
  );

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品名</th>
            <th 
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('sales')}
            >
              売上<SortIcon column="sales" />
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">件数</th>
            <th 
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('profit')}
            >
              利益<SortIcon column="profit" />
            </th>
            <th 
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('profitRate')}
            >
              利益率<SortIcon column="profitRate" />
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedProducts.map((product) => (
            <tr key={product.productId} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900">{product.productName || product.productId}</div>
                <div className="text-sm text-gray-500">{product.productId}</div>
              </td>
              <td className="px-6 py-4 text-right">¥{(product.sales || 0).toLocaleString()}</td>
              <td className="px-6 py-4 text-right">{product.orders || 0}件</td>
              <td className="px-6 py-4 text-right text-green-600">¥{(product.profit || 0).toLocaleString()}</td>
              <td className="px-6 py-4 text-right text-green-600">{(product.profitRate || 0).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ==========================================
// 広告タブ
// ==========================================
function AdsTab() {
  const [subTab, setSubTab] = useState<'all' | 'keywords'>('all');
  const [viewMode, setViewMode] = useState<'daily' | 'average'>('daily');

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* サブタブ */}
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => setSubTab('all')}
          className={`px-4 py-2 rounded-lg ${subTab === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
        >
          広告全体
        </button>
        <button
          onClick={() => setSubTab('keywords')}
          className={`px-4 py-2 rounded-lg ${subTab === 'keywords' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
        >
          キーワード別
        </button>
      </div>

      {/* 表示切り替え */}
      <div className="flex space-x-2 mb-4">
        <span className="text-gray-500">表示:</span>
        <button
          onClick={() => setViewMode('average')}
          className={`px-3 py-1 rounded ${viewMode === 'average' ? 'bg-gray-800 text-white' : 'bg-gray-200'}`}
        >
          平均
        </button>
        <button
          onClick={() => setViewMode('daily')}
          className={`px-3 py-1 rounded ${viewMode === 'daily' ? 'bg-gray-800 text-white' : 'bg-gray-200'}`}
        >
          日別
        </button>
      </div>

      {/* コンテンツ */}
      <div className="text-center text-gray-400 py-8">
        🚧 {subTab === 'all' ? '広告全体' : 'キーワード別'}データを表示予定<br />
        （{viewMode === 'daily' ? '日別' : '平均'}表示）
      </div>
    </div>
  );
}

// ==========================================
// SEOタブ
// ==========================================
function SeoTab() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">🔍 SEO順位</h3>
      <p className="text-gray-500">全商品のSEO順位を一覧表示</p>
      <div className="text-center text-gray-400 py-8">
        🚧 SEO順位データを表示予定
      </div>
    </div>
  );
}

// ==========================================
// 在庫タブ
// ==========================================
function InventoryTab() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">📦 在庫管理</h3>
      <p className="text-gray-500">全商品の在庫状況を一覧表示（アラート付き）</p>
      <div className="text-center text-gray-400 py-8">
        🚧 在庫データを表示予定
      </div>
    </div>
  );
}

// ==========================================
// 未出品タブ
// ==========================================
function UnlistedTab() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">📋 未出品商品</h3>
      <p className="text-gray-500">未出品商品の管理</p>
      <div className="text-center text-gray-400 py-8">
        🚧 未出品商品管理を表示予定
      </div>
    </div>
  );
}
