import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
 title: 'NEURO ARCADE | 脳をめぐる3分の冒険',
 description: '脳の地図、神経の信号、記憶カード。遊んで脳科学の基礎を覚えるNeuroLabの入門ゲーム。',
 icons: { icon: '/icon.svg' },
};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
 return <html lang="ja"><body>{children}</body></html>;
}
