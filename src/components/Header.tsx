'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">楽天管理</h1>
              <p className="text-xs text-gray-500">ダッシュボード</p>
            </div>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link 
              href="/" 
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              商品一覧
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
