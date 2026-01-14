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
            <div className="mt-8">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="商品ID・商品名で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <ProductTable products={filteredProducts} loading={loading} period={period} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
