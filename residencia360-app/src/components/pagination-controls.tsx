import Link from "next/link";

import { Button } from "@/components/ui/button";

export function PaginationControls({
  pathname,
  page,
  totalPages,
  searchParams = {},
}: {
  pathname: string;
  page: number;
  totalPages: number;
  searchParams?: Record<string, string | undefined>;
}) {
  const buildHref = (nextPage: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    params.set("page", String(nextPage));
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Button asChild variant="outline" size="sm" disabled={page <= 1}>
        <Link href={buildHref(Math.max(page - 1, 1))}>Anterior</Link>
      </Button>
      <span className="text-sm text-muted-foreground">
        Pagina {page} de {Math.max(totalPages, 1)}
      </span>
      <Button asChild variant="outline" size="sm" disabled={page >= totalPages}>
        <Link href={buildHref(Math.min(page + 1, totalPages))}>Siguiente</Link>
      </Button>
    </div>
  );
}
