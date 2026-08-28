"use client";

import { useRef, useState, useEffect } from "react";
import { Zap, Send, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getDashboardOverview, listSales, listProducts } from "@/lib/queries";
import { fmtNGN, toNumber } from "@/lib/format";

const AI_SUGGESTIONS = [
  "What products should I reorder?",
  "Which customer owes me money?",
  "What sold best this month?",
  "Show low stock items.",
  "Summarize today's sales.",
];

interface Msg {
  from: "ai" | "me";
  text: string;
}

/**
 * There's no LLM on the backend yet — these handlers answer the standard
 * BusinessOS prompts by pulling real numbers from the API instead of an
 * actual model. Swap this out once a real AI endpoint exists.
 */
async function answer(question: string): Promise<string> {
  const q = question.toLowerCase();

  if (q.includes("reorder") || q.includes("low stock")) {
    const overview = await getDashboardOverview();
    if (overview.lowStock.count === 0) return "Nothing needs reordering right now — all products are above their minimum stock level.";
    const list = overview.lowStock.items
      .slice(0, 5)
      .map((i) => `${i.product.name} (${i.quantity} left, min ${i.reorderLevel})`)
      .join(", ");
    return `You have ${overview.lowStock.count} product${overview.lowStock.count === 1 ? "" : "s"} at or below their reorder level: ${list}.`;
  }

  if (q.includes("owes") || q.includes("customer")) {
    const sales = await listSales();
    const balances = new Map<string, number>();
    for (const sale of sales.rows) {
      if (sale.status === "CANCELLED" || sale.paymentStatus === "PAID") continue;
      const name = sale.customerName?.trim() || "Walk-in customer";
      balances.set(name, (balances.get(name) ?? 0) + toNumber(sale.total));
    }
    const sorted = Array.from(balances.entries()).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return "No customers currently owe you money — every recorded sale is fully paid.";
    return `The customers with the largest outstanding balances are: ${sorted
      .slice(0, 3)
      .map(([name, amount]) => `${name} (${fmtNGN(amount)})`)
      .join(", ")}.`;
  }

  if (q.includes("sold best") || q.includes("top") || q.includes("best")) {
    const overview = await getDashboardOverview();
    if (overview.topProducts.length === 0) return "No sales have been recorded yet, so there's no top product to report.";
    return `Your top performer recently is ${overview.topProducts[0].name} (${fmtNGN(overview.topProducts[0].revenue)} in revenue)${
      overview.topProducts[1] ? `, followed by ${overview.topProducts[1].name}` : ""
    }.`;
  }

  if (q.includes("summar") || q.includes("today")) {
    const overview = await getDashboardOverview();
    return `Today's sales total ${fmtNGN(overview.kpis.todaySales)}, with ${fmtNGN(overview.kpis.weeklyRevenue)} in revenue over the last 7 days.`;
  }

  const [overview, products] = await Promise.all([getDashboardOverview(), listProducts()]);
  return `Here's a quick snapshot: ${fmtNGN(overview.kpis.todaySales)} in sales today, ${overview.lowStock.count} product${
    overview.lowStock.count === 1 ? "" : "s"
  } low on stock, and ${products.rows.length} products in your catalog. Ask me about reordering, top sellers, or outstanding balances for more detail.`;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Msg[]>([
    { from: "ai", text: "Hi — I'm your BusinessOS assistant. Ask me anything about sales, stock, or customers and I'll pull real numbers from your account." },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [messages, thinking]);

  async function ask(question: string) {
    if (!question.trim() || thinking) return;
    setMessages((m) => [...m, { from: "me", text: question }]);
    setThinking(true);
    try {
      const text = await answer(question);
      setMessages((m) => [...m, { from: "ai", text }]);
    } catch {
      setMessages((m) => [...m, { from: "ai", text: "I couldn't reach your business data just now — try again in a moment." }]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
      <Card padded>
        <p className="mb-2.5 text-[14.5px] font-bold">Try asking</p>
        <div className="flex flex-col gap-2">
          {AI_SUGGESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => ask(q)}
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-left text-[12.5px] font-medium text-ink-soft hover:border-brand-500 hover:text-ink dark:border-white/10"
            >
              {q}
            </button>
          ))}
        </div>
      </Card>
      <Card padded>
        <div ref={threadRef} className="flex max-h-[420px] min-h-[380px] flex-col gap-4 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`flex max-w-[86%] gap-2.5 ${m.from === "me" ? "ml-auto flex-row-reverse" : ""}`}>
              <div
                className={`flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg text-white ${
                  m.from === "ai" ? "bg-brand-700" : "bg-ink-soft"
                }`}
              >
                {m.from === "ai" ? <Zap className="h-[15px] w-[15px]" /> : <span className="text-[11px] font-bold">Me</span>}
              </div>
              <div
                className={`rounded-xl px-3.5 py-3 text-[13.5px] leading-relaxed ${
                  m.from === "me" ? "bg-brand-700 text-white" : "bg-[#F6F9F7] dark:bg-white/5"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex max-w-[86%] gap-2.5">
              <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg bg-brand-700 text-white">
                <Zap className="h-[15px] w-[15px]" />
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-[#F6F9F7] px-3.5 py-3 text-[13px] text-ink-muted dark:bg-white/5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking your data…
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 flex gap-2.5 border-t border-slate-200 pt-4 dark:border-white/10">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                ask(input);
                setInput("");
              }
            }}
            placeholder="Ask about your business…"
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[13.5px] outline-none dark:border-white/10 dark:bg-transparent"
          />
          <Button
            variant="primary"
            disabled={thinking}
            onClick={() => {
              ask(input);
              setInput("");
            }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
