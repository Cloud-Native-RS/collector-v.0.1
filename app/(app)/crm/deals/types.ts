export type DealStage = "lead" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost";

export interface Deal {
  id: string;
  dealNumber: string;
  title: string;
  description?: string;
  value: number;
  probability: number;
  stage: DealStage;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  wonAt?: string;
  lostAt?: string;
  lostReason?: string;
  customerId?: string;
  leadId?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

