"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { fmtNGN } from "@/lib/format";

export interface WeeklyPoint {
  week: string;
  value: number;
}

export function RevenueBarChart({ data }: { data: WeeklyPoint[] }) {
  return (
    <div className="h-[170px] px-3 pb-3 pt-1">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
          <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${v / 1000000}M`} width={44} />
          <Tooltip formatter={(v: number) => fmtNGN(v)} contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid #E4EAE7" }} />
          <Bar dataKey="value" fill="#147A52" radius={[6, 6, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
