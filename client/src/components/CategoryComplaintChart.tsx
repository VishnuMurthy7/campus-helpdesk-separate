import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { BarChart3 } from "lucide-react";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { trpc } from "@/lib/trpc";

const chartConfig = {
  total: { label: "Requests", color: "#b8891d" },
} satisfies ChartConfig;

export default function CategoryComplaintChart() {
  const { data: stats, isLoading } = trpc.admin.stats.useQuery();
  const data = stats?.categoryBreakdown.filter(item => item.total > 0) ?? [];

  return <section className="mt-7 rounded-2xl border border-[#102a43]/10 bg-white p-6 shadow-[0_18px_38px_-32px_rgba(16,42,67,.42)]"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#b8891d]">Category insights</p><h3 className="mt-1 font-serif text-2xl font-semibold text-[#102a43]">Complaint volume by category</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-[#5c7590]">Compare the number of complaints and enquiries assigned to each campus topic.</p></div><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e9ece7] text-[#b8891d]"><BarChart3 className="h-5 w-5" /></span></div>{isLoading ? <div className="mt-7 h-72 animate-pulse rounded-xl bg-[#f7f6f2]" /> : data.length ? <ChartContainer config={chartConfig} className="mt-7 h-72 w-full"><BarChart accessibilityLayer data={data} layout="vertical" margin={{ left: 8, right: 38, top: 4, bottom: 4 }}><CartesianGrid horizontal={false} strokeDasharray="3 3" /><YAxis dataKey="name" type="category" width={105} tickLine={false} axisLine={false} className="text-xs" /><XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} /><ChartTooltip cursor={{ fill: "rgba(184, 137, 29, .08)" }} content={<ChartTooltipContent hideLabel />} /><Bar dataKey="total" fill="var(--color-total)" radius={[0, 7, 7, 0]}><LabelList dataKey="total" position="right" className="fill-[#35556f] text-xs font-bold" /></Bar></BarChart></ChartContainer> : <div className="mt-7 rounded-xl bg-[#f7f6f2] p-6 text-sm leading-6 text-[#5c7590]">No requests have been categorized yet. This chart will update as public submissions arrive.</div>}</section>;
}
