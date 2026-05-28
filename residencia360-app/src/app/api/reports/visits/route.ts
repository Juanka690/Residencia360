import Papa from "papaparse";
import { NextRequest, NextResponse } from "next/server";

import { getVisitsExportRows } from "@/server/services/reports";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filters = {
    startDate: searchParams.get("startDate") ?? undefined,
    endDate: searchParams.get("endDate") ?? undefined,
    towerId: searchParams.get("towerId") ?? undefined,
    visitStatus: searchParams.get("visitStatus") ?? undefined,
  };

  const rows = await getVisitsExportRows(filters, 1000, 1);
  const csv = Papa.unparse(rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="visitas-residencia360.csv"',
    },
  });
}
