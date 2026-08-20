import { Link } from "wouter";
import { ArrowRight, BookOpenCheck, CheckCircle2, Clock3, MessageSquarePlus, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import PublicLayout from "@/components/PublicLayout";

const iconNames: Record<string, typeof BookOpenCheck> = {
  CircleHelp: BookOpenCheck,
  Landmark: ShieldCheck,
  Search,
};

export default function Home() {
  const { data: categories, isLoading } = trpc.catalog.categories.useQuery();

  return (
    <PublicLayout>
      <main>
        <section className="relative isolate overflow-hidden border-b border-[#102a43]/10 bg-[#e9ece7]">
          <div className="absolute inset-0 -z-10 opacity-80" style={{ backgroundImage: "radial-gradient(circle at 16% 20%, rgba(232,197,105,.5), transparent 28%), radial-gradient(circle at 83% 70%, rgba(144,190,168,.48), transparent 28%)" }} />
          <div className="container grid min-h-[560px] items-center gap-12 py-16 lg:grid-cols-[1.1fr_.9fr] lg:py-20">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#b8891d]/25 bg-white/70 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#856310]">
                <Sparkles className="h-3.5 w-3.5" /> Campus support, at your pace
              </div>
              <h1 className="font-serif text-5xl font-semibold leading-[1.04] tracking-[-0.045em] text-[#102a43] sm:text-6xl lg:text-7xl">
                Clear answers for every <span className="text-[#b8891d]">campus day.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-[#486581]">
                Find practical guidance, raise a request when you need to, and follow its progress—without creating an account.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/help"><Button size="lg" className="w-full gap-2 bg-[#102a43] px-6 text-white shadow-[0_10px_25px_-12px_rgba(16,42,67,.8)] hover:bg-[#163b5c] sm:w-auto">Browse campus help <ArrowRight className="h-4 w-4" /></Button></Link>
                <Link href="/track"><Button size="lg" variant="outline" className="w-full border-[#102a43]/20 bg-white/65 px-6 text-[#102a43] hover:bg-white sm:w-auto">Track a request</Button></Link>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-[#35556f]">
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#5b9279]" /> No sign-up required</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#5b9279]" /> Private tracking ID</span>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md lg:ml-auto">
              <div className="absolute -inset-7 rounded-[2.5rem] border border-white/60 bg-white/25 -rotate-6" />
              <div className="relative rounded-[2rem] border border-white/80 bg-[#102a43] p-6 shadow-[0_30px_70px_-30px_rgba(16,42,67,.65)]">
                <div className="flex items-center justify-between border-b border-white/15 pb-5"><span className="font-serif text-xl font-semibold text-white">How can we help?</span><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e8c569] text-[#102a43]"><BookOpenCheck className="h-5 w-5" /></span></div>
                {["Choose a campus topic", "Select a focused area", "Get a direct answer"].map((step, index) => <div key={step} className="flex items-center gap-4 border-b border-white/10 py-5 last:border-0"><span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-sm font-bold text-[#e8c569]">0{index + 1}</span><p className="font-medium text-white">{step}</p><ArrowRight className="ml-auto h-4 w-4 text-white/40" /></div>)}
                <div className="mt-3 rounded-xl bg-white/10 p-4 text-sm leading-6 text-[#d8e1e8]"><span className="font-semibold text-[#e8c569]">Still need help?</span> Send a request directly to the campus team.</div>
              </div>
            </div>
          </div>
        </section>

        <section className="container py-16 sm:py-20">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#b8891d]">Start here</p><h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#102a43] sm:text-4xl">Explore campus support</h2></div>
            <Link href="/help" className="group inline-flex items-center gap-2 text-sm font-bold text-[#102a43]">View all help topics <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-44 animate-pulse rounded-2xl bg-[#e9ece7]" />) : categories?.slice(0, 6).map(category => {
              const Icon = iconNames[category.icon] ?? BookOpenCheck;
              return <Link key={category.id} href="/help" className="group rounded-2xl border border-[#102a43]/10 bg-white p-6 shadow-[0_12px_35px_-28px_rgba(16,42,67,.45)] transition-all duration-200 hover:-translate-y-1 hover:border-[#b8891d]/35 hover:shadow-[0_18px_35px_-22px_rgba(16,42,67,.3)]"><div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e9ece7] text-[#b8891d]"><Icon className="h-5 w-5" /></span><ArrowRight className="h-5 w-5 text-[#97aabd] transition-transform group-hover:translate-x-1 group-hover:text-[#b8891d]" /></div><h3 className="mt-8 font-serif text-xl font-semibold text-[#102a43]">{category.name}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-[#5c7590]">{category.description || "Explore answers and next steps for this campus service."}</p></Link>;
            })}
          </div>
        </section>

        <section className="border-y border-[#102a43]/10 bg-white"><div className="container grid gap-8 py-12 md:grid-cols-3"><div className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e9ece7] text-[#b8891d]"><Search className="h-5 w-5" /></span><div><h3 className="font-semibold">Find the right answer</h3><p className="mt-1 text-sm leading-6 text-[#5c7590]">Follow a short, guided path through campus information.</p></div></div><div className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e9ece7] text-[#b8891d]"><MessageSquarePlus className="h-5 w-5" /></span><div><h3 className="font-semibold">Raise a request</h3><p className="mt-1 text-sm leading-6 text-[#5c7590]">When an answer is not enough, let the right team know.</p></div></div><div className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e9ece7] text-[#b8891d]"><Clock3 className="h-5 w-5" /></span><div><h3 className="font-semibold">Stay in the loop</h3><p className="mt-1 text-sm leading-6 text-[#5c7590]">Use your private tracking ID to check for progress.</p></div></div></div></section>
      </main>
    </PublicLayout>
  );
}
