"use client";

import { TicketModulePage } from "@/components/tickets/TicketModulePage";
import { itSupport } from "@/lib/it-support";

export default function ITSupportPage() {
  return (
    <TicketModulePage
      moduleId="it-support"
      title="IT Support"
      subtitle="Report technical issues and track IT requests"
      client={itSupport}
    />
  );
}
