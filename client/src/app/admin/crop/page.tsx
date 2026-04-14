import { Suspense } from "react";
import { CropToolContent } from "./CropToolClient";

export const dynamic = 'force-dynamic';

export default function CropTool({ searchParams }: { searchParams: any }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    }>
      <CropToolContent searchParamsProps={searchParams} />
    </Suspense>
  );
}
