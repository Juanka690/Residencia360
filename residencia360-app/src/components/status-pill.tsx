import { Badge } from "@/components/ui/badge";
import { PQRS_STATUS_STYLES, RESERVATION_STATUS_STYLES, VISIT_STATUS_STYLES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function VisitStatusPill({ status }: { status: keyof typeof VISIT_STATUS_STYLES }) {
  return <Badge className={cn("rounded-full px-3 py-1", VISIT_STATUS_STYLES[status])}>{status}</Badge>;
}

export function PqrsStatusPill({ status }: { status: keyof typeof PQRS_STATUS_STYLES }) {
  return <Badge className={cn("rounded-full px-3 py-1", PQRS_STATUS_STYLES[status])}>{status}</Badge>;
}

export function ReservationStatusPill({ status }: { status: keyof typeof RESERVATION_STATUS_STYLES }) {
  return <Badge className={cn("rounded-full px-3 py-1", RESERVATION_STATUS_STYLES[status])}>{status}</Badge>;
}
