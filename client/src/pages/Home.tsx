import { Building2, ChevronRight, KeyRound, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useDeferredValue, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PublicLayout from "@/components/PublicLayout";
import { useCollege } from "@/contexts/CollegeContext";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const [, setLocation] = useLocation();
  const { college, selectCollege, clearCollege } = useCollege();
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query.trim());
  const { data: matches, isFetching } = trpc.colleges.search.useQuery({ query: deferred });
  useEffect(() => { if (college) setQuery(college.name); }, [college?.id]);
  const choose = (item: { id: number; name: string; code: string }) => { selectCollege(item); setQuery(item.name); };
  return <PublicLayout>
    <main>
      <section className="relative isolate overflow-hidden bg-[#e9ece7] py-16 sm:py-24">
        <div className="absolute inset-0 -z-10 opacity-75" style={{ backgroundImage: "radial-gradient(circle at 14% 18%, rgba(232,197,105,.55), transparent 26%), radial-gradient(circle at 87% 75%, rgba(144,190,168,.46), transparent 28%)" }} />
        <div className="container grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#b8891d]/25 bg-white/70 px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em] text-[#856310]"><Sparkles className="h-3.5 w-3.5" /> College support, made clear</div>
            <p className="mt-8 font-serif text-2xl font-semibold tracking-[-.03em] text-[#b8891d]">WELCOME</p>
            <h1 className="mt-2 font-serif text-5xl font-semibold leading-[1.04] tracking-[-.05em] text-[#102a43] sm:text-6xl">Find your college. <span className="text-[#b8891d]">Find your answer.</span></h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#486581]">Search using your college name or its 10-character campus code to open the right helpdesk.</p>
            <div className="relative mt-8 max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-[#7e97aa]" />
              <Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search college name or 10-character code" className="h-13 border-[#102a43]/15 bg-white pl-12 text-base shadow-[0_14px_30px_-24px_rgba(16,42,67,.55)]" aria-label="Search colleges" />
              {query && <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-[#102a43]/10 bg-white shadow-[0_24px_50px_-30px_rgba(16,42,67,.45)]">
                {isFetching ? <p className="p-5 text-sm text-[#5c7590]">Finding colleges…</p> : matches?.length ? matches.map(item => <button type="button" key={item.id} onClick={() => choose(item)} className="flex w-full items-center gap-3 border-b border-[#102a43]/8 px-5 py-4 text-left last:border-0 hover:bg-[#fdfbf4]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e9ece7] text-[#b8891d]"><Building2 className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-[#102a43]">{item.name}</strong><span className="mt-1 block font-mono text-xs font-semibold text-[#856310]">{item.code}{item.location ? ` · ${item.location}` : ""}</span></span><ChevronRight className="h-4 w-4 text-[#a3b3c0]" /></button>) : <p className="p-5 text-sm text-[#5c7590]">No college matched that name or code. Ask a campus administrator to create its helpdesk.</p>}
              </div>}
            </div>
            {college && <div className="mt-6 flex flex-wrap items-center gap-3"><span className="inline-flex items-center gap-2 rounded-xl border border-[#5b9279]/25 bg-white/70 px-3 py-2 text-sm font-semibold text-[#35556f]"><ShieldCheck className="h-4 w-4 text-[#5b9279]" /> {college.name} <span className="font-mono text-xs text-[#856310]">{college.code}</span></span><button onClick={clearCollege} className="text-sm font-semibold text-[#5c7590] hover:text-[#102a43]">Change college</button></div>}
            <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Button size="lg" disabled={!college} onClick={() => setLocation("/help")} className="gap-2 bg-[#102a43] text-white hover:bg-[#163b5c]">Open app <ChevronRight className="h-4 w-4" /></Button><Link href="/admin"><Button size="lg" variant="outline" className="gap-2 border-[#102a43]/20 bg-white/70 text-[#102a43] hover:bg-white"><KeyRound className="h-4 w-4" /> Run as administrator</Button></Link></div>
          </div>
          <aside className="rounded-[2rem] bg-[#102a43] p-7 text-white shadow-[0_30px_70px_-30px_rgba(16,42,67,.65)] sm:p-9"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-[#e8c569]"><Building2 className="h-5 w-5" /></span><h2 className="mt-7 font-serif text-3xl font-semibold">One helpdesk, tailored to each campus.</h2><p className="mt-4 text-sm leading-7 text-white/70">Students can browse guidance, submit an enquiry, or track a request without an account. Campus teams maintain their own topics, areas, answers, and visual instructions.</p><div className="mt-8 space-y-4 border-t border-white/10 pt-6 text-sm"><p><span className="mr-3 font-serif text-xl text-[#e8c569]">01</span> Search and choose your college</p><p><span className="mr-3 font-serif text-xl text-[#e8c569]">02</span> Follow its support guide</p><p><span className="mr-3 font-serif text-xl text-[#e8c569]">03</span> Raise or track a request</p></div></aside>
        </div>
      </section>
    </main>
  </PublicLayout>;
}
