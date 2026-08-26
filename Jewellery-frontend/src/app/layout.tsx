// src/app/layout.tsx
// Root layout with Bluish theme & high-contrast typography

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'JEWELLERY — Terrain Jewellery',
  description:
    'Turn a meaningful place on Earth into a unique terrain pendant. Handcrafted jewellery from real landscape data.',
  keywords: ['terrain jewellery', 'custom pendant', 'handcrafted', 'landscape jewellery'],
  openGraph: {
    title: 'JEWELLERY — Terrain Jewellery',
    description: 'Turn a meaningful place on Earth into a unique terrain pendant.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..700&family=Playfair+Display:ital,wght@0,400..700;1,400..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
