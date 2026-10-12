import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'space-web | Spacecraft Telemetry Anomaly Detection System',
  description: 'Mission Control Aerospace Telemetry Monitoring & Supervised Anomaly Detection Ground Station for NASA SMAP and MSL Missions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#050811] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}

