import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transcodes SDK — Next.js 15',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
