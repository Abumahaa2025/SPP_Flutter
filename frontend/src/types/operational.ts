/** Operational layer — events, tickets, pending approvals (additive on Property OS). */



export type OperationalActor = 'owner' | 'tenant' | 'technician' | 'employee' | 'system';



export type OperationalEventKind =

  | 'tenant_added'

  | 'contract_ended'

  | 'payment_recorded'

  | 'maintenance_opened'

  | 'maintenance_assigned'

  | 'maintenance_closed'

  | 'notification_prepared'

  | 'renewal_suggested'

  | 'setup_completed';



export type OperationalEvent = {

  id: string;

  kind: OperationalEventKind;

  at: string;

  actor: OperationalActor;

  summaryKey: string;

  summaryParams?: Record<string, string>;

  relatedUnitId?: string;

  relatedTenantId?: string;

  relatedTicketId?: string;

};



export type MaintenanceTicketStatus = 'open' | 'assigned' | 'in_progress' | 'closed';



export type MaintenanceTicket = {

  id: string;

  unitId: string;

  tenantId?: string;

  title: string;

  description?: string;

  status: MaintenanceTicketStatus;

  technicianName?: string;

  createdAt: string;

  updatedAt: string;

  closedAt?: string;

  notes: string[];

};



export type PendingActionKind =

  | 'approve_whatsapp'

  | 'approve_renewal'

  | 'approve_technician'

  | 'approve_owner_alert';



export type PendingAction = {

  id: string;

  kind: PendingActionKind;

  labelKey: string;

  labelParams?: Record<string, string>;

  createdAt: string;

  payload?: Record<string, string>;

};


