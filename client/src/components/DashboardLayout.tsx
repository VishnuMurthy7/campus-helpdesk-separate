import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { BookOpenCheck, FileText, LayoutDashboard, LogOut, PanelLeft, Settings2, Users } from "lucide-react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/admin" },
  { icon: FileText, label: "Requests", path: "/admin/requests" },
  { icon: BookOpenCheck, label: "Knowledge base", path: "/admin/knowledge" },
  { icon: Settings2, label: "Campus topics", path: "/admin/topics" },
  { icon: Users, label: "Users", path: "/admin/users" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return <div className="flex min-h-screen items-center justify-center bg-[#f7f6f2] p-6"><div className="w-full max-w-md rounded-2xl border border-[#102a43]/10 bg-white p-8 text-center shadow-[0_18px_45px_-32px_rgba(16,42,67,.5)]"><span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#102a43] text-[#e8c569]"><BookOpenCheck className="h-6 w-6" /></span><h1 className="mt-6 font-serif text-2xl font-semibold">Administrator access</h1><p className="mt-3 text-sm leading-6 text-[#5c7590]">Sign in with your authorized campus account to access the helpdesk workspace.</p><Button onClick={() => startLogin()} className="mt-7 w-full bg-[#102a43] text-white hover:bg-[#163b5c]">Sign in securely</Button></div></div>;
  return <SidebarProvider><DashboardContent>{children}</DashboardContent></SidebarProvider>;
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth(); const [location, setLocation] = useLocation(); const isMobile = useIsMobile(); const { toggleSidebar } = useSidebar();
  const active = menuItems.find(item => item.path === location) ?? menuItems[0];
  return <><Sidebar collapsible="icon" className="border-r border-[#102a43]/10 bg-[#102a43] text-white"><SidebarHeader className="h-[76px] border-b border-white/10 p-3"><div className="flex items-center gap-3 px-1"><button onClick={toggleSidebar} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-[#e8c569] hover:bg-white/15" aria-label="Toggle navigation"><PanelLeft className="h-4 w-4" /></button><div className="min-w-0 group-data-[collapsible=icon]:hidden"><p className="font-serif text-base font-semibold leading-none">Campus Helpdesk</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[.14em] text-[#a6b9c8]">Administration</p></div></div></SidebarHeader><SidebarContent className="gap-0 px-2 py-4"><SidebarMenu>{menuItems.map(item => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={location === item.path} onClick={() => setLocation(item.path)} tooltip={item.label} className="h-10 text-white/70 hover:bg-white/10 hover:text-white data-[active=true]:bg-[#e8c569] data-[active=true]:text-[#102a43]"><item.icon className="h-4 w-4" /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarContent><SidebarFooter className="border-t border-white/10 p-3"><DropdownMenu><DropdownMenuTrigger asChild><button className="flex w-full items-center gap-3 rounded-lg p-1 text-left hover:bg-white/10 focus:outline-none"><Avatar className="h-9 w-9 border border-white/15"><AvatarFallback className="bg-[#e8c569] text-xs font-bold text-[#102a43]">{user?.name?.charAt(0).toUpperCase() || "A"}</AvatarFallback></Avatar><div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-sm font-medium">{user?.name || "Administrator"}</p><p className="mt-0.5 truncate text-xs text-white/55">Campus administrator</p></div></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-48"><DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu></SidebarFooter></Sidebar><SidebarInset className="bg-[#f7f6f2]"><header className="flex h-[76px] items-center justify-between border-b border-[#102a43]/10 bg-[#f7f6f2]/90 px-5 backdrop-blur sm:px-8"><div className="flex items-center gap-3">{isMobile && <SidebarTrigger className="h-9 w-9 rounded-lg border border-[#102a43]/10 bg-white" />}<div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#b8891d]">Campus workspace</p><h1 className="mt-0.5 font-serif text-xl font-semibold tracking-tight">{active.label}</h1></div></div><div className="hidden items-center gap-2 text-xs font-semibold text-[#5c7590] sm:flex"><span className="h-2 w-2 rounded-full bg-[#5b9279]" /> Staff access protected</div></header><main className="min-h-[calc(100vh-76px)] p-5 sm:p-8">{children}</main></SidebarInset></>;
}
