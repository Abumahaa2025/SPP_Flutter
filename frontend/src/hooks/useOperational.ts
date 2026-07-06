import { useCallback, useEffect, useMemo, useState } from 'react';

import type { MaintenanceTicket, OperationalEvent, PendingAction } from '@/src/types/operational';
import {
  createMaintenanceTicket,
  onMaintenanceAssigned,
  onMaintenanceClosed,
  onMaintenanceOpened,
} from '@/src/utils/operational-flow-engine';
import {
  loadOperational,
  removePendingAction,
  subscribeOperational,
  upsertTicket,
} from '@/src/utils/operational-store';

export function useOperational() {
  const [, bump] = useState(0);
  useEffect(() => subscribeOperational(() => bump((n) => n + 1)), []);

  const [state, setState] = useState({
    events: [] as OperationalEvent[],
    tickets: [] as MaintenanceTicket[],
    pendingActions: [] as PendingAction[],
  });
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    const s = await loadOperational();
    setState(s);
    setReady(true);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const openTicket = useCallback(async (
    unitId: string,
    title: string,
    tenantId?: string,
    description?: string,
    unitNumber?: string,
    extras?: {
      category?: MaintenanceTicket['category'];
      priority?: MaintenanceTicket['priority'];
      technicianName?: string;
      media?: MaintenanceTicket['media'];
    },
  ) => {
    const ticket = await createMaintenanceTicket(unitId, title, tenantId, description, extras);
    await onMaintenanceOpened(ticket, unitNumber);
    if (extras?.technicianName) await onMaintenanceAssigned(ticket, extras.technicianName);
    await reload();
    return ticket;
  }, [reload]);

  const assignTicket = useCallback(async (ticketId: string, techName: string) => {
    const s = await loadOperational();
    const ticket = s.tickets.find((t) => t.id === ticketId);
    if (!ticket) return;
    const next: MaintenanceTicket = {
      ...ticket,
      status: 'assigned',
      technicianName: techName,
      updatedAt: new Date().toISOString(),
    };
    await upsertTicket(next);
    await onMaintenanceAssigned(next, techName);
    await reload();
  }, [reload]);

  const updateTicketStatus = useCallback(async (
    ticketId: string,
    status: MaintenanceTicket['status'],
    note?: string,
    unitNumber?: string,
    extras?: { media?: MaintenanceTicket['media']; rating?: number; workflowStep?: MaintenanceTicket['workflowStep'] },
  ) => {
    const s = await loadOperational();
    const ticket = s.tickets.find((t) => t.id === ticketId);
    if (!ticket) return;
    const notes = note ? [...ticket.notes, note] : ticket.notes;
    const mergedMedia = extras?.media?.length
      ? [...(ticket.media ?? []), ...extras.media]
      : ticket.media;
    const next: MaintenanceTicket = {
      ...ticket,
      status,
      notes,
      media: mergedMedia,
      rating: extras?.rating ?? ticket.rating,
      workflowStep: extras?.workflowStep ?? ticket.workflowStep,
      updatedAt: new Date().toISOString(),
      closedAt: status === 'closed' ? new Date().toISOString() : ticket.closedAt,
    };
    await upsertTicket(next);
    if (status === 'closed') await onMaintenanceClosed(next, unitNumber);
    await reload();
  }, [reload]);

  const approveAction = useCallback(async (id: string) => {
    await removePendingAction(id);
    await reload();
  }, [reload]);

  const dismissAction = useCallback(async (id: string) => {
    await removePendingAction(id);
    await reload();
  }, [reload]);

  const recentEvents = useMemo(() => state.events.slice(0, 8), [state.events]);
  const openTickets = useMemo(
    () => state.tickets.filter((t) => t.status !== 'closed'),
    [state.tickets],
  );

  return {
    ready,
    events: state.events,
    tickets: state.tickets,
    pendingActions: state.pendingActions,
    recentEvents,
    openTickets,
    openTicket,
    assignTicket,
    updateTicketStatus,
    approveAction,
    dismissAction,
    reload,
  };
}
