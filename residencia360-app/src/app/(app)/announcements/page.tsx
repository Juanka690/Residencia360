import { BellRing } from "lucide-react";

import { AnnouncementForm } from "@/app/(app)/announcements/announcement-form";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { requirePath } from "@/server/auth/session";
import { listAnnouncements } from "@/server/services/announcements";

export default async function AnnouncementsPage() {
  const user = await requirePath("/announcements");
  const [announcements, towers] = await Promise.all([
    listAnnouncements(user.role, user.towerId),
    db.tower.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageShell title="Anuncios y comunicados" description="Publica mensajes segmentados, alertas criticas y comunicados programados.">
        <div className="grid gap-4 lg:grid-cols-2">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className={announcement.critical ? "border-amber-300 bg-amber-50/70" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <BellRing className="h-4 w-4 text-primary" />
                    {announcement.title}
                  </CardTitle>
                  {announcement.critical ? <Badge variant="warning">Critico</Badge> : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm font-medium">{announcement.summary}</p>
                <p className="text-sm text-muted-foreground">{announcement.content}</p>
                <div className="text-xs text-muted-foreground">
                  Publicado por {announcement.createdBy.firstName} · {formatDateTime(announcement.publishAt)} · {announcement.tower?.name ?? "Toda la unidad"}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageShell>
      {(user.role === "ADMIN" || user.role === "BOARD") ? (
        <Card>
          <CardHeader>
            <CardTitle>Nuevo anuncio</CardTitle>
          </CardHeader>
          <CardContent>
            <AnnouncementForm actorId={user.id} towers={towers} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
