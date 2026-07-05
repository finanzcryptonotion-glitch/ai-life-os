import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import FloatingAssistant from '@/components/FloatingAssistant';

export const metadata: Metadata = {
  title: 'AI Life OS',
  description: 'Your Personal Operating System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#000', color: '#fff', margin: 0 }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: 'auto', background: '#000' }}>
          {children}
        </main>
        <FloatingAssistant />
      </body>
    </html>
  );
}
