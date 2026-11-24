"use client";

import { TicketModulePage } from "@/components/tickets/TicketModulePage";
import { hrHelpdesk } from "@/lib/hr-helpdesk";

export default function HRHelpDeskPage() {
  return (
    <TicketModulePage
      moduleId="hr-helpdesk"
      title="HR Help Desk"
      subtitle="Ask HR questions and track employee queries"
      client={hrHelpdesk}
    />
  );
}
