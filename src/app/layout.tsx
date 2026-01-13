import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '楽天管理ダッシュボード',
  description: '楽天市場の売上・広告・在庫を一元管理',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
