import { createTicketClient } from "./tickets";

export * from "./ticket-types";
export type { TicketQuery } from "./tickets";

export const hrHelpdesk = createTicketClient("/hr-helpdesk");
