import type { Metadata } from 'next';
import { Cormorant_Garamond, Source_Sans_3, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-source-sans',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'The AI Scientist',
  description: 'From hypothesis to runnable experiment plan — powered by multi-agent AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${cormorant.variable} ${sourceSans.variable} ${jetbrains.variable} h-full antialiased`}
      style={{ background: 'var(--bg)' }}
    >
      <body
        className="min-h-full flex flex-col"
        style={{
          fontFamily: 'var(--font-source-sans), sans-serif',
          background: 'var(--bg)',
          color: 'var(--text-primary)',
        }}
      >
        {children}
      </body>
    </html>
  );
}
