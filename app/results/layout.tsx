import Header from '@/components/Header';
import { getResultsMetadata } from '@/lib/metadata';

export const metadata = getResultsMetadata();

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
