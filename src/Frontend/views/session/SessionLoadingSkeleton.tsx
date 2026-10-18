export function SessionLoadingSkeleton() {
  return (
    <div className="flex h-full min-h-[600px] items-center justify-center rounded-3xl border border-slate-800 bg-slate-950">
      <div className="w-full max-w-5xl space-y-6 px-6 py-8">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="h-4 w-24 animate-pulse rounded-full bg-slate-800" />
            <div className="h-7 w-64 animate-pulse rounded-full bg-slate-800" />
          </div>
          <div className="h-10 w-28 animate-pulse rounded-2xl bg-slate-800" />
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="h-[420px] animate-pulse rounded-[2rem] bg-slate-900" />
          <div className="space-y-4">
            <div className="h-32 animate-pulse rounded-[1.75rem] bg-slate-900" />
            <div className="h-32 animate-pulse rounded-[1.75rem] bg-slate-900" />
            <div className="h-32 animate-pulse rounded-[1.75rem] bg-slate-900" />
          </div>
        </div>
      </div>
    </div>
  );
}
