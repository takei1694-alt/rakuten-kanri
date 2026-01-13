'use client';

import { SummaryData, formatCurrency, formatPercent, formatNumber } from '@/lib/api';

interface SummaryCardsProps {
  data: SummaryData | null;
  loading: boolean;
}

export default function SummaryCards({ data, loading }: SummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card p-4">
            <div className="h-4 bg-gray-200 rounded loading-pulse mb-2 w-16"></div>
            <div className="h-6 bg-gray-200 rounded loading-pulse w-24"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    { label: '売上', value: formatCurrency(data.sales), color: 'text-gray-900' },
    { label: '注文件数', value: formatNumber(data.orders) + '件', color: 'text-gray-900' },
    { label: '利益', value: formatCurrency(data.profit), color: data.profit >= 0 ? 'text-emerald-600' : 'text-red-600' },
    { label: '利益率', value: formatPercent(data.profitRate), color: data.profitRate >= 0 ? 'text-emerald-600' : 'text-red-600' },
    { label: '広告費', value: formatCurrency(data.adCost), color: 'text-gray-900' },
    { label: 'ROAS', value: formatPercent(data.roas), color: data.roas >= 100 ? 'text-emerald-600' : 'text-amber-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <div key={index} className="card p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">{card.label}</p>
          <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
