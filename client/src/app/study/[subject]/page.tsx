import { Suspense } from 'react';
import { StudyContent } from './StudyClient';

export const dynamic = 'force-dynamic';

export default async function StudyPage({ searchParams }: { searchParams: Promise<any> }) {
  const resolvedParams = await searchParams;
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white font-bold animate-pulse">학습 데이터를 불러오는 중...</p>
        </div>
      </div>
    }>
      <StudyContent searchParamsProps={resolvedParams} />
    </Suspense>
  );
}
