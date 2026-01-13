'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import PeriodSelector from '@/components/PeriodSelector';
import SummaryCards from '@/components/SummaryCards';
import ProductTable from '@/components/ProductTable';
import { Period, SummaryData, ProductData, getSummary, getProducts } from '@/lib/api';

export default function HomePage() {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* サマリーカード */}
        <div className="mb-6">
          <SummaryCards data={summary} loading={loading} />
        </div>

        {/* 期間表示 */}
        {summary && !loading && (
          <div className="mb-4 text-sm text-gray-500">
            期間: {summary.startDate} 〜 {summary.endDate}
            {summary.fromCache && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                キャッシュ
              </span>
            )}
          </div>
        )}

        {/* 検索 */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="商品名・商品IDで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* 商品テーブル */}
        <ProductTable 
          products={filteredProducts} 
          loading={loading} 
          period={period}
        />
      </main>
    </div>
  );
}
