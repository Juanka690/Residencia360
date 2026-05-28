"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table";
import { VisitStatusPill } from "@/components/status-pill";
import { formatDateTime } from "@/lib/utils";
import { listVisitsPage } from "@/server/services/visits";

type VisitRow = Awaited<ReturnType<typeof listVisitsPage>>["rows"][number];

const columns: ColumnDef<VisitRow>[] = [
  {
    header: "Codigo",
    accessorKey: "code",
    cell: ({ row }) => (
      <Link className="font-medium text-primary hover:underline" href={`/visitors/${row.original.id}`}>
        {row.original.code}
      </Link>
    ),
  },
  {
    header: "Visitante",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.visitor.fullName}</p>
        <p className="text-xs text-muted-foreground">{row.original.visitor.document}</p>
      </div>
    ),
  },
  {
    header: "Apartamento",
    cell: ({ row }) => `${row.original.apartment.tower.name} - ${row.original.apartment.number}`,
  },
  {
    header: "Horario",
    cell: ({ row }) => formatDateTime(row.original.scheduledStart),
  },
  {
    header: "Estado",
    cell: ({ row }) => <VisitStatusPill status={row.original.status} />,
  },
];

export function VisitorsTable({ visits }: { visits: VisitRow[] }) {
  return <DataTable columns={columns} data={visits} searchPlaceholder="Buscar por codigo, visitante o apartamento..." />;
}
