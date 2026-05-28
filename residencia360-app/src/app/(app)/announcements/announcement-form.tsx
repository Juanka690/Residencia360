"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createAnnouncementAction } from "@/server/actions/announcements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload, type UploadedFile } from "@/components/file-upload";
import { BUCKETS } from "@/lib/supabase-storage";

const schema = z.object({
  title: z.string().min(4),
  summary: z.string().min(8),
  content: z.string().min(20),
  audience: z.enum(["WHOLE_COMMUNITY", "TOWER", "BLOCK"]),
  towerId: z.string().optional(),
  critical: z.boolean().default(false),
});

type FormValues = z.input<typeof schema>;

export function AnnouncementForm({
  actorId,
  towers,
}: {
  actorId: string;
  towers: { id: string; name: string }[];
}) {
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      summary: "",
      content: "",
      audience: "WHOLE_COMMUNITY",
      towerId: "",
      critical: false,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createAnnouncementAction(
        {
          ...values,
          critical: Boolean(values.critical),
          attachments: attachments.map((a) => ({
            fileName: a.fileName,
            fileUrl: a.publicUrl ?? a.path,
          })),
        },
        actorId,
      );
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setAttachments([]);
      form.reset();
    });
  });

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label>Titulo</Label>
        <Input {...form.register("title")} />
      </div>
      <div className="space-y-2">
        <Label>Resumen</Label>
        <Input {...form.register("summary")} />
      </div>
      <div className="space-y-2">
        <Label>Contenido</Label>
        <Textarea {...form.register("content")} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Audiencia</Label>
          <Select defaultValue="WHOLE_COMMUNITY" onValueChange={(value) => form.setValue("audience", value as FormValues["audience"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="WHOLE_COMMUNITY">Toda la unidad</SelectItem>
              <SelectItem value="TOWER">Por torre</SelectItem>
              <SelectItem value="BLOCK">Bloque</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Torre</Label>
          <Select onValueChange={(value) => form.setValue("towerId", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Opcional" />
            </SelectTrigger>
            <SelectContent>
              {towers.map((tower) => (
                <SelectItem key={tower.id} value={tower.id}>
                  {tower.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Archivos adjuntos</Label>
        <FileUpload
          bucket={BUCKETS.ANNOUNCEMENTS}
          pathPrefix="announcements"
          buttonLabel="Adjuntar archivo"
          onUploaded={(file) => setAttachments((prev) => [...prev, file])}
          onCleared={() => setAttachments([])}
        />
        {attachments.length > 0 ? (
          <ul className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 space-y-1">
            {attachments.map((a) => (
              <li key={a.path} className="flex items-center justify-between gap-2">
                <span>{a.fileName}</span>
                <button
                  type="button"
                  className="text-rose-600 hover:underline"
                  onClick={() => setAttachments((prev) => prev.filter((p) => p.path !== a.path))}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register("critical")} />
        Marcar como comunicado critico
      </label>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Publicando..." : "Publicar anuncio"}
      </Button>
    </form>
  );
}
