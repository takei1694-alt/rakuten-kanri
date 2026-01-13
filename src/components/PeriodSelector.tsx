'use client';

import { Period } from '@/lib/api';

interface PeriodSelectorProps {
  value: Period;
  onChange: (period: Period) => void;
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
}

const periods: { value: Period; label: string }[] = [
  { value: 'week', label: '1週間' },
  { value: '2weeks', label: '2週間' },
  { value: 'month', label: '1ヶ月' },
  { value: '3months', label: '3ヶ月' },
  { value: 'year', label: '1年' },
  { value: 'custom', label: 'カスタム' },
];

export default function PeriodSelector({
  value,
  onChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: PeriodSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-gray-500 mr-2">期間:</span>
      
      <div className="flex flex-wrap gap-2">
        {periods.map((period) => (
          <button
            key={period.value}
            onClick={() => onChange(period.value)}
            className={`period-button ${value === period.value ? 'active' : ''}`}
          >
            {period.label}
          </button>
        ))}
      </div>
      
      {value === 'custom' && onStartDateChange && onEndDateChange && (
        <div className="flex items-center gap-2 ml-4">
          <input
            type="date"
            value={startDate || ''}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <span className="text-gray-400">〜</span>
          <input
            type="date"
            value={endDate || ''}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
      )}
    </div>
  );
}
