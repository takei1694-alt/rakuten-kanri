'use client';

import { useRouter } from 'next/navigation';
import { ProductData, formatCurrency, formatPercent, formatNumber } from '@/lib/api';

interface ProductTableProps {
  products: ProductData[];
  loading: boolean;
  period: string;
}

export default function ProductTable({ products, loading, period }: ProductTableProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="h-5 bg-gray-200 rounded loading-pulse w-32"></div>
        </div>
        <div className="divide-y divide-gray-100">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="p-4 flex gap-4">
              <div className="h-4 bg-gray-200 rounded loading-pulse w-24"></div>
              <div className="h-4 bg-gray-200 rounded loading-pulse w-32"></div>
              <div className="h-4 bg-gray-200 rounded loading-pulse w-20"></div>
              <div className="h-4 bg-gray-200 rounded loading-pulse w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const handleRowClick = (productId: string) => {
    router.push(`/product/${encodeURIComponent(productId)}?period=${period}`);
  };

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">商品一覧 ({products.length}件)</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>商品名</th>
              <th className="text-right">売上</th>
              <th className="text-right">件数</th>
              <th className="text-right">利益</th>
              <th className="text-right">利益率</th>
              <th className="text-right">広告費</th>
              <th className="text-right">ROAS</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr 
                key={product.productId}
                onClick={() => handleRowClick(product.productId)}
                className="cursor-pointer"
              >
                <td>
                  <div>
                    <p className="font-medium text-gray-900 truncate max-w-xs">
                      {product.productName || product.productId}
                    </p>
                    <p className="text-xs text-gray-500">{product.productId}</p>
                  </div>
                </td>
                <td className="text-right font-medium">{formatCurrency(product.sales)}</td>
                <td className="text-right">{formatNumber(product.orders)}件</td>
                <td className={`text-right font-medium ${product.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(product.profit)}
                </td>
                <td className={`text-right ${product.profitRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatPercent(product.profitRate)}
                </td>
                <td className="text-right">{formatCurrency(product.adCost)}</td>
                <td className={`text-right font-medium ${product.roas >= 100 ? 'text-emerald-600' : product.roas > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                  {product.roas > 0 ? formatPercent(product.roas) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
