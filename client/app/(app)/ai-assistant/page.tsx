import { PageHeader } from "@/components/ui/PageHeader";
import { ChatPanel } from "@/components/ai/ChatPanel";
import { PAGE_META } from "@/lib/nav";

export default function AiAssistantPage() {
  return (
    <>
      <PageHeader title={PAGE_META["ai-assistant"].title} desc={PAGE_META["ai-assistant"].desc} />
      <ChatPanel />
    </>
  );
}
