import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation | Sehat Guftagu',
  description: 'User guide and help documentation for Sehat Guftagu',
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {children}
    </div>
  );
}
