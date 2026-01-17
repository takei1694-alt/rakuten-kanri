'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  getSummary, 
  getProducts, 
  getRecentOrders,
  getInventoryForecast,
  SummaryData, 
  ProductData, 
  RecentOrderData,
  InventoryForecastData
} from '@/lib/api';

// Period型を定義
type Period = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom';

// フォーマット関数
const formatCurrency = (value: number): string => {
  return `¥${value.toLocaleString()}`;
};

const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export default function Home() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrderData[]>([]);
  const [inventoryForecast, setInventoryForecast] = useState<InventoryForecastData[]>([]);
  const [inventorySearch, setInventorySearch] = useState('');
  const [showCheckOnly, setShowCheckOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('thisMonth');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'realtime' | 'inventory'>('summary');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryData, productsData, recentOrdersData, forecastData] = await Promise.all([
        getSummary(period as any, period === 'custom' ? startDate : undefined, period === 'custom' ? endDate : undefined),
        getProducts(period as any, period === 'custom' ? startDate : undefined, period === 'custom' ? endDate : undefined),
        getRecentOrders(),
        getInventoryForecast(),
      ]);
      setSummary(summaryData);
      setProducts(productsData);
      setRecentOrders(recentOrdersData);
      setInventoryForecast(forecastData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period, startDate, endDate]);

  const renderContent = () => {
    if (activeTab === 'realtime') {
      return <RealtimeTab orders={recentOrders} />;
    }
    if (activeTab === 'inventory') {
      return (
        <InventoryTab 
          data={inventoryForecast} 
          search={inventorySearch}
          setSearch={setInventorySearch}
          showCheckOnly={showCheckOnly}
          setShowCheckOnly={setShowCheckOnly}
        />
      );
    }
    return (
      <>
        <SummaryCards summary={summary} />
        <ProductsTable products={products} />
      </>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">📊 楽天売上管理ダッシュボード</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'summary'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📈 サマリー
            </button>
            <button
              onClick={() => setActiveTab('realtime')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'realtime'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📡 リアルタイム
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'inventory'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📦 在庫予測
            </button>
          </nav>
        </div>

        {/* Period Filter (only for summary tab) */}
        {activeTab === 'summary' && (
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <div className="flex flex-wrap items-center gap-4">
              <label className="text-sm font-medium text-gray-700">期間:</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as Period)}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="today">今日</option>
                <option value="yesterday">昨日</option>
                <option value="thisWeek">今週</option>
                <option value="lastWeek">先週</option>
                <option value="thisMonth">今月</option>
                <option value="lastMonth">先月</option>
                <option value="custom">カスタム</option>
              </select>
              {period === 'custom' && (
                <>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                  <span className="text-gray-500">〜</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </>
              )}
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                更新
              </button>
            </div>
          </div>
        )}

        {renderContent()}
      </main>
    </div>
  );
}

// サマリーカード
function SummaryCards({ summary }: { summary: SummaryData | null }) {
  if (!summary) return null;

 const cards = [
  { label: '売上', value: formatCurrency(summary.sales), color: 'blue' },
  { label: '注文数', value: formatNumber(summary.orders), color: 'green' },
  { label: '利益', value: formatCurrency(summary.profit), color: summary.profit >= 0 ? 'green' : 'red' },
  { label: '利益率', value: formatPercent(summary.profitRate), color: summary.profitRate >= 0 ? 'green' : 'red' },
];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">{card.label}</p>
          <p className={`text-2xl font-bold text-${card.color}-600`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}

// 商品テーブル
function ProductsTable({ products }: { products: ProductData[] }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">商品別売上</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">商品名</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">売上</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">数量</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">利益</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">利益率</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.productId} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                  <Link href={`/products/${product.productId}`} className="text-blue-600 hover:underline">
                    {product.productName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-right">{formatCurrency(product.sales)}</td>
                <td className="px-4 py-3 text-sm text-right">{formatNumber(product.quantity)}</td>
                <td className={`px-4 py-3 text-sm text-right ${product.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(product.profit)}
                </td>
                <td className={`px-4 py-3 text-sm text-right ${product.profitRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(product.profitRate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// リアルタイムタブ
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

// 在庫予測タブ
function InventoryTab({ 
  data, 
  search, 
  setSearch,
  showCheckOnly,
  setShowCheckOnly
}: { 
  data: InventoryForecastData[]; 
  search: string;
  setSearch: (value: string) => void;
  showCheckOnly: boolean;
  setShowCheckOnly: (value: boolean) => void;
}) {
  // フィルタリング
  const filteredData = data.filter(item => {
    const matchesSearch = search === '' || 
      item.skuId.toLowerCase().includes(search.toLowerCase()) ||
      item.productName.toLowerCase().includes(search.toLowerCase()) ||
      item.skuInfo.toLowerCase().includes(search.toLowerCase());
    const matchesCheck = !showCheckOnly || item.checkFlag;
    return matchesSearch && matchesCheck;
  });

  // 在庫月数の色分け
  const getStockMonthColor = (months: number | null, isWarehouse: boolean): string => {
    if (months === null) return '';
    const threshold1 = isWarehouse ? 1 : 1.7;
    const threshold2 = 2;
    if (months < threshold1) return 'bg-red-100 text-red-800';
    if (months < threshold2) return 'bg-yellow-100 text-yellow-800';
    return '';
  };

  const formatStockMonths = (value: number | null): string => {
    if (value === null) return '-';
    return value.toFixed(1);
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">📦 在庫予測</h3>
        <p className="text-gray-500 text-center py-8">在庫データがありません</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-semibold text-gray-900">📦 在庫予測 - {filteredData.length}件</h3>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="SKU・商品名で検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm w-64"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showCheckOnly}
                onChange={(e) => setShowCheckOnly(e.target.checked)}
                className="rounded"
              />
              要チェックのみ
            </label>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">SKU</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">SKU情報</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 bg-blue-50">総在庫</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 bg-green-50">倉庫</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 bg-blue-50">総/週</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 bg-green-50">倉/週</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 bg-blue-50">総/1M</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 bg-green-50">倉/1M</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 bg-blue-50">総/3M</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 bg-green-50">倉/3M</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">✓</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-3 py-3 text-sm font-medium text-gray-900">{item.skuId}</td>
                <td className="px-3 py-3 text-sm text-gray-600">{item.skuInfo || '-'}</td>
                <td className="px-3 py-3 text-sm text-right bg-blue-50">{formatNumber(item.totalStock)}</td>
                <td className="px-3 py-3 text-sm text-right bg-green-50">{formatNumber(item.warehouseStock)}</td>
                <td className={`px-3 py-3 text-sm text-right bg-blue-50 ${getStockMonthColor(item.stockMonthsTotalWeekly, false)}`}>
                  {formatStockMonths(item.stockMonthsTotalWeekly)}
                </td>
                <td className={`px-3 py-3 text-sm text-right bg-green-50 ${getStockMonthColor(item.stockMonthsWarehouseWeekly, true)}`}>
                  {formatStockMonths(item.stockMonthsWarehouseWeekly)}
                </td>
                <td className={`px-3 py-3 text-sm text-right bg-blue-50 ${getStockMonthColor(item.stockMonthsTotal1m, false)}`}>
                  {formatStockMonths(item.stockMonthsTotal1m)}
                </td>
                <td className={`px-3 py-3 text-sm text-right bg-green-50 ${getStockMonthColor(item.stockMonthsWarehouse1m, true)}`}>
                  {formatStockMonths(item.stockMonthsWarehouse1m)}
                </td>
                <td className={`px-3 py-3 text-sm text-right bg-blue-50 ${getStockMonthColor(item.stockMonthsTotal3m, false)}`}>
                  {formatStockMonths(item.stockMonthsTotal3m)}
                </td>
                <td className={`px-3 py-3 text-sm text-right bg-green-50 ${getStockMonthColor(item.stockMonthsWarehouse3m, true)}`}>
                  {formatStockMonths(item.stockMonthsWarehouse3m)}
                </td>
                <td className="px-3 py-3 text-sm text-center">
                  {item.checkFlag && <span className="text-orange-500">⚠️</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
