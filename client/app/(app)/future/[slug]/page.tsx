import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { FUTURE_MODULE_META } from "@/lib/nav";
import { FutureNotifyButton } from "@/components/future/FutureNotifyButton";

export function generateStaticParams() {
  return Object.keys(FUTURE_MODULE_META).map((slug) => ({ slug }));
}

export default function FutureModulePage({ params }: { params: { slug: string } }) {
  const meta = FUTURE_MODULE_META[params.slug];
  if (!meta) notFound();

  return (
    <>
      <div className="mb-1.5 flex items-center gap-1.5 text-[12.5px] text-ink-muted">
        <span>BusinessOS</span>
        <span className="text-slate-300 dark:text-white/20">/</span>
        <span className="font-semibold text-ink dark:text-slate-100">{meta.title}</span>
      </div>
      <Card>
        <div className="flex flex-col items-center gap-3.5 px-5 py-[70px] text-center">
          <svg width="76" height="76" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="18" stroke="#1E9E6B" strokeWidth="2" opacity="0.35" />
            <circle cx="20" cy="20" r="12" stroke="#147A52" strokeWidth="2" opacity="0.6" />
            <circle cx="20" cy="20" r="5.5" fill="#0F4C3A" />
          </svg>
          <h2 className="m-0 text-xl font-extrabold">{meta.title} is on the roadmap</h2>
          <p className="max-w-[420px] text-[12.5px] text-ink-muted">
            BusinessOS is built to grow with you. Once you&rsquo;re ready to expand beyond core retail &amp; distribution
            operations, {meta.title} will plug into the same navigation, roles and reporting you already use — no
            re-learning required. {meta.desc}
          </p>
          <FutureNotifyButton moduleTitle={meta.title} />
        </div>
      </Card>
    </>
  );
}
