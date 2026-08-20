import { useEffect, useState, type ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { BookOpenCheck, FileText, LayoutDashboard, LockKeyhole, LogOut, Monitor, PanelLeft, Settings2, Users } from "lucide-react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const menuItems = [{ icon: LayoutDashboard, label: "Overview", path: "/admin" }, { icon: FileText, label: "Requests", path: "/admin/requests" }, { icon: BookOpenCheck, label: "Knowledge base", path: "/admin/knowledge" }, { icon: Settings2, label: "Campus topics", path: "/admin/topics" }, { icon: Users, label: "Users", path: "/admin/users" }];

function useDesktopWorkspace() {
  const [isDesktop, setDesktop] = useState<boolean | null>(null);
  useEffect(() => {
    const update = () => setDesktop(window.matchMedia("(min-width: 1024px)").matches && !/(android.*mobile|iphone|ipad|tablet|mobile)/i.test(navigator.userAgent));
    update(); window.addEventListener("resize", update); return () => window.removeEventListener("resize", update);
  }, []);
  return isDesktop;
}

function DesktopOnlyScreen() {
  return <div className="grid min-h-screen place-items-center bg-[#f7f6f2] p-6"><div className="w-full max-w-md rounded-2xl border border-[#102a43]/10 bg-white p-8 text-center shadow-[0_18px_45px_-32px_rgba(16,42,67,.5)]"><span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#102a43] text-[#e8c569]"><Monitor className="h-6 w-6" /></span><p className="mt-6 text-xs font-bold uppercase tracking-[.14em] text-[#b8891d]">Private workspace</p><h1 className="mt-2 font-serif text-2xl font-semibold">Administrator access is desktop-only.</h1><p className="mt-3 text-sm leading-6 text-[#5c7590]">For security and full management controls, open Campus Helpdesk from a desktop or laptop computer. Phones and tablets can use the public help portal.</p><Button asChild className="mt-7 bg-[#102a43] text-white hover:bg-[#163b5c]"><a href="/">Open public helpdesk</a></Button></div></div>;
}

function PasswordGate() {
  const [password, setPassword] = useState(""); const utils = trpc.useUtils();
  const verify = trpc.adminGate.verify.useMutation({ onSuccess: () => { setPassword(""); utils.adminGate.status.invalidate(); }, onError: () => setPassword("") });
  return <div className="flex min-h-screen items-center justify-center bg-[#f7f6f2] p-6"><form onSubmit={event => { event.preventDefault(); verify.mutate({ password }); }} className="w-full max-w-md rounded-2xl border border-[#102a43]/10 bg-white p-8 text-center shadow-[0_18px_45px_-32px_rgba(16,42,67,.5)]"><span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#102a43] text-[#e8c569]"><LockKeyhole className="h-6 w-6" /></span><h1 className="mt-6 font-serif text-2xl font-semibold">Private administrator check</h1><p className="mt-3 text-sm leading-6 text-[#5c7590]">Enter the private administrator password to unlock this desktop workspace.</p><Input value={password} onChange={event => setPassword(event.target.value)} type="password" autoComplete="current-password" className="mt-6" placeholder="Administrator password" aria-label="Administrator password" required /><Button type="submit" disabled={verify.isPending} className="mt-4 w-full bg-[#102a43] text-white hover:bg-[#163b5c]">{verify.isPending ? "Verifying…" : "Unlock administrator workspace"}</Button>{verify.error && <p className="mt-3 text-sm text-[#8a2f36]">{verify.error.message}</p>}</form></div>;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const isDesktop = useDesktopWorkspace(); const { loading, user } = useAuth(); const verification = trpc.adminGate.status.useQuery(undefined, { enabled: Boolean(user && user.role === "admin" && isDesktop) });
  if (isDesktop === null || loading) return <DashboardLayoutSkeleton />;
  if (!isDesktop) return <DesktopOnlyScreen />;
  if (!user) return <div className="flex min-h-screen items-center justify-center bg-[#f7f6f2] p-6"><div className="w-full max-w-md rounded-2xl border border-[#102a43]/10 bg-white p-8 text-center shadow-[0_18px_45px_-32px_rgba(16,42,67,.5)]"><span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#102a43] text-[#e8c569]"><BookOpenCheck className="h-6 w-6" /></span><h1 className="mt-6 font-serif text-2xl font-semibold">Run as administrator</h1><p className="mt-3 text-sm leading-6 text-[#5c7590]">Sign in with your authorized campus account, then complete the private password check.</p><Button onClick={() => startLogin()} className="mt-7 w-full bg-[#102a43] text-white hover:bg-[#163b5c]">Sign in securely</Button></div></div>;
  if (user.role !== "admin") return <div className="grid min-h-screen place-items-center bg-[#f7f6f2] p-6"><div className="max-w-md rounded-2xl border border-[#102a43]/10 bg-white p-8 text-center"><h1 className="font-serif text-2xl font-semibold">Administrator permission required</h1><p className="mt-3 text-sm leading-6 text-[#5c7590]">This account is not permitted to run the administrator workspace.</p><Button asChild className="mt-6 bg-[#102a43] text-white"><a href="/">Return to public helpdesk</a></Button></div></div>;
  if (verification.isLoading) return <DashboardLayoutSkeleton />;
  if (!verification.data?.verified) return <PasswordGate />;
  return <SidebarProvider><DashboardContent>{children}</DashboardContent></SidebarProvider>;
}

function DashboardContent({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth(); const [location, setLocation] = useLocation(); const { toggleSidebar } = useSidebar(); const gateLogout = trpc.adminGate.logout.useMutation(); const active = menuItems.find(item => item.path === location) ?? menuItems[0];
  const signOut = async () => { await gateLogout.mutateAsync(); await logout(); };
  return <><Sidebar collapsible="icon" className="border-r border-[#102a43]/10 bg-[#102a43] text-white"><SidebarHeader className="h-[76px] border-b border-white/10 p-3"><div className="flex items-center gap-3 px-1"><button onClick={toggleSidebar} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-[#e8c569] hover:bg-white/15" aria-label="Toggle navigation"><PanelLeft className="h-4 w-4" /></button><div className="min-w-0 group-data-[collapsible=icon]:hidden"><p className="font-serif text-base font-semibold leading-none">Campus Helpdesk</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[.14em] text-[#a6b9c8]">Administration</p></div></div></SidebarHeader><SidebarContent className="gap-0 px-2 py-4"><SidebarMenu>{menuItems.map(item => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={location === item.path} onClick={() => setLocation(item.path)} tooltip={item.label} className="h-10 text-white/70 hover:bg-white/10 hover:text-white data-[active=true]:bg-[#e8c569] data-[active=true]:text-[#102a43]"><item.icon className="h-4 w-4" /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarContent><SidebarFooter className="border-t border-white/10 p-3"><DropdownMenu><DropdownMenuTrigger asChild><button className="flex w-full items-center gap-3 rounded-lg p-1 text-left hover:bg-white/10 focus:outline-none"><Avatar className="h-9 w-9 border border-white/15"><AvatarFallback className="bg-[#e8c569] text-xs font-bold text-[#102a43]">{user?.name?.charAt(0).toUpperCase() || "A"}</AvatarFallback></Avatar><div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-sm font-medium">{user?.name || "Administrator"}</p><p className="mt-0.5 truncate text-xs text-white/55">Campus administrator</p></div></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-48"><DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu></SidebarFooter></Sidebar><SidebarInset className="bg-[#f7f6f2]"><header className="flex h-[76px] items-center justify-between border-b border-[#102a43]/10 bg-[#f7f6f2]/90 px-5 backdrop-blur sm:px-8"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#b8891d]">Campus workspace</p><h1 className="mt-0.5 font-serif text-xl font-semibold tracking-tight">{active.label}</h1></div><div className="hidden items-center gap-2 text-xs font-semibold text-[#5c7590] sm:flex"><span className="h-2 w-2 rounded-full bg-[#5b9279]" /> Private desktop access</div></header><main className="min-h-[calc(100vh-76px)] p-5 sm:p-8">{children}</main></SidebarInset></>;
}
