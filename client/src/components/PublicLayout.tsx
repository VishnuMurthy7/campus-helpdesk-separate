import { Link, useLocation } from "wouter";
import { BookOpenCheck, CircleUserRound, Menu, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/help", label: "Find help" },
  { href: "/submit", label: "Submit a request" },
  { href: "/track", label: "Track request" },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f6f2] text-[#102a43]">
      <header className="sticky top-0 z-40 border-b border-[#102a43]/8 bg-[#f7f6f2]/90 backdrop-blur-xl">
        <div className="container flex h-[76px] items-center justify-between gap-5">
          <Link href="/" className="group flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#102a43] text-[#e8c569] shadow-sm transition-transform duration-200 group-hover:-rotate-3">
              <BookOpenCheck className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <span className="leading-tight">
              <span className="block font-serif text-lg font-semibold tracking-tight">CampAssist</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#5c7590]">Answers, made simple</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            {links.map(link => (
              <Link key={link.href} href={link.href} className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${location === link.href ? "bg-[#e9ece7] text-[#102a43]" : "text-[#486581] hover:bg-[#e9ece7] hover:text-[#102a43]"}`}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/admin" className="hidden sm:block">
              <Button variant="ghost" className="gap-2 text-[#486581] hover:bg-[#e9ece7] hover:text-[#102a43]">
                <ShieldCheck className="h-4 w-4" />
                Admin
              </Button>
            </Link>
            <Link href="/help">
              <Button className="hidden bg-[#102a43] px-4 text-white shadow-none hover:bg-[#163b5c] sm:flex">
                Get help
              </Button>
            </Link>
            <Link href="/help" className="sm:hidden" aria-label="Open help">
              <Button variant="ghost" size="icon" className="text-[#102a43]"><Menu className="h-5 w-5" /></Button>
            </Link>
          </div>
        </div>
      </header>
      {children}
      <footer className="border-t border-[#102a43]/10 bg-white">
        <div className="container flex flex-col gap-3 py-7 text-sm text-[#5c7590] sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2"><CircleUserRound className="h-4 w-4 text-[#b8891d]" /> CampAssist is here to guide you.</p>
          <div className="flex gap-5 text-xs font-semibold uppercase tracking-[0.12em]">
            <Link href="/track" className="hover:text-[#102a43]">Track a request</Link>
            <Link href="/admin" className="hover:text-[#102a43]">Staff access</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
