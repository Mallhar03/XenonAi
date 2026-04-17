import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        <header className="pb-6 border-b border-white/5 space-y-2">
          <Skeleton className="h-10 w-64 bg-white/10" />
          <Skeleton className="h-5 w-96 bg-white/5" />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl bg-white/5" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-8 h-[400px] rounded-xl bg-white/5" />
          <Skeleton className="lg:col-span-4 h-[400px] rounded-xl bg-white/5" />
        </div>
        
        <Skeleton className="h-[350px] w-full rounded-xl bg-white/5" />
      </div>
    </div>
  );
}
