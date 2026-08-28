"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { fmtNGN } from "@/lib/format";

export interface SalesTrendPoint {
  date: string;
  total: number;
}

export function SalesTrendChart({ data }: { data: SalesTrendPoint[] }) {
  const chartData = data.map((d) => ({
    day: new Date(d.date).toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
    value: d.total,
  }));

  return (
    <div className="h-[220px] px-3 pb-3 pt-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#147A52" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#147A52" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="currentColor" className="text-slate-200 dark:text-white/10" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} interval={2} />
          <YAxis
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₦${v / 1000}k`}
            width={48}
          />
          <Tooltip
            formatter={(v: number) => fmtNGN(v)}
            contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid #E4EAE7" }}
          />
          <Area type="monotone" dataKey="value" stroke="#147A52" strokeWidth={2.5} fill="url(#salesFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
