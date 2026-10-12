import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SpaceWeb | Spacecraft Telemetry Anomaly Detection',
  description: 'Clean and simple telemetry monitoring and anomaly detection for spacecraft missions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
