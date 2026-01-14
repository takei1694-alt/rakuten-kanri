'use client';
import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import PeriodSelector from '@/components/PeriodSelector';
import SummaryCards from '@/components/SummaryCards';
import ProductTable from '@/components/ProductTable';
import { Period, SummaryData, ProductData, getSummary, getProducts } from '@/lib/api';

// タブの定義
const TABS = [
  { id: 'products', name: '商品一覧' },
  { id: 'sales', name: '売上利益' },
  { id: 'ads', name: '広告全体' },
  { id: 'keywords', name: 'キーワード別' },
  { id: 'seo', name: 'SEO' },
  { id: 'inventory', name: '在庫' },
  { id: 'tasks', name: 'タスク' },
  { id: 'memos', name: 'メモ' },
  { id: 'actions', name: '自社施策' },
  { id: 'competitors', name: '競合変化' },
  { id: 'unlisted', name: '未出品' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>('products');
  const [period, setPeriod] = useState<Period>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, productsData] = await Promise.all([
        getSummary(period, period === 'custom' ? startDate : undefined, period === 'custom' ? endDate : undefined),
        getProducts(period, period === 'custom' ? startDate : undefined, period === 'custom' ? endDate : undefined),
      ]);
      setSummary(summaryData);
      setProducts(productsData);
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
      case 'products':
        return <ProductTable products={filteredProducts} loading={loading} period={period} />;
      case 'sales':
        return <ComingSoon title="売上利益" />;
      case 'ads':
        return <ComingSoon title="広告全体" />;
      case 'keywords':
        return <ComingSoon title="キーワード別" />;
      case 'seo':
        return <ComingSoon title="SEO順位" />;
      case 'inventory':
        return <ComingSoon title="在庫管理" />;
      case 'tasks':
        return <ComingSoon title="タスク管理" />;
      case 'memos':
        return <ComingSoon title="メモ" />;
      case 'actions':
        return <ComingSoon title="自社施策" />;
      case 'competitors':
        return <ComingSoon title="競合変化" />;
      case 'unlisted':
        return <ComingSoon title="未出品商品" />;
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

            {/* 検索バー */}
            <div className="mt-6 mb-4">
              <input
                type="text"
                placeholder="商品ID・商品名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

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

// 準備中コンポーネント
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-8 text-center">
      <div className="text-gray-400 text-5xl mb-4">🚧</div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-gray-500">この機能は準備中です</p>
    </div>
  );
}
