import { ClerkProvider } from '@clerk/nextjs';
import { Anton, JetBrains_Mono } from 'next/font/google';
import './globals.css';

// Grotesca pesada para títulos + monoespaciada para el chrome (look "terminal")
const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-heading' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata = {
  title: 'Payments App — BuscaloYA',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es" className={`${anton.variable} ${mono.variable}`}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
