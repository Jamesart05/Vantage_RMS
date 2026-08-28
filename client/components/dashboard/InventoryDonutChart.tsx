"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

export interface InventorySplitSlice {
  name: string;
  value: number;
  color: string;
}

export function InventoryDonutChart({ data }: { data: InventorySplitSlice[] }) {
  return (
    <div className="h-[170px] px-3 pb-3 pt-1">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={2}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid #E4EAE7" }} />
          <Legend wrapperStyle={{ fontSize: 11 }} iconSize={9} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
