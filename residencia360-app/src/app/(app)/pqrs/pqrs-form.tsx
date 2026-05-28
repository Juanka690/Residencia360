"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createPqrsAction, updatePqrsStatusAction } from "@/server/actions/pqrs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  category: z.string().min(3),
  subject: z.string().min(6),
  description: z.string().min(20),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  apartmentId: z.string().min(1),
  attachmentName: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function PqrsForm({ residentId, apartmentId }: { residentId: string; apartmentId: string }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: "",
      subject: "",
      description: "",
      priority: "MEDIUM",
      apartmentId,
      attachmentName: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createPqrsAction(values, residentId);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(`${result.message} ${result.ticketNumber}`);
      form.reset({
        ...form.getValues(),
        category: "",
        subject: "",
        description: "",
        priority: "MEDIUM",
        attachmentName: "",
      });
    });
  });

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Input {...form.register("category")} />
        </div>
        <div className="space-y-2">
          <Label>Prioridad</Label>
          <Select defaultValue="MEDIUM" onValueChange={(value) => form.setValue("priority", value as FormValues["priority"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Baja</SelectItem>
              <SelectItem value="MEDIUM">Media</SelectItem>
              <SelectItem value="HIGH">Alta</SelectItem>
              <SelectItem value="CRITICAL">Critica</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Asunto</Label>
        <Input {...form.register("subject")} />
      </div>
      <div className="space-y-2">
        <Label>Descripcion</Label>
        <Textarea {...form.register("description")} />
      </div>
      <div className="space-y-2">
        <Label>Adjunto opcional</Label>
        <Input placeholder="evidencia-humedad.jpg" {...form.register("attachmentName")} />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Radicando..." : "Crear PQRS"}
      </Button>
    </form>
  );
}

export function PqrsStatusActions({ pqrsId, actorId }: { pqrsId: string; actorId: string }) {
  const [finalResponse, setFinalResponse] = useState("");
  const [evidenceFileName, setEvidenceFileName] = useState("");
  const [isPending, startTransition] = useTransition();

  const run = (status: "IN_PROGRESS" | "RESOLVED" | "CLOSED") =>
    startTransition(async () => {
      const result = await updatePqrsStatusAction(pqrsId, status, actorId, finalResponse, evidenceFileName);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      if (status !== "IN_PROGRESS") {
        setFinalResponse("");
        setEvidenceFileName("");
      }
    });

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label>Respuesta final</Label>
          <Textarea
            value={finalResponse}
            onChange={(event) => setFinalResponse(event.target.value)}
            placeholder="Describe la gestion realizada, el resultado y la evidencia disponible."
          />
        </div>
        <div className="space-y-2">
          <Label>Nombre de evidencia</Label>
          <Input
            value={evidenceFileName}
            onChange={(event) => setEvidenceFileName(event.target.value)}
            placeholder="cierre-pqrs-0001.pdf"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => run("IN_PROGRESS")}>
          En proceso
        </Button>
        <Button size="sm" disabled={isPending} onClick={() => run("RESOLVED")}>
          Resolver
        </Button>
        <Button size="sm" variant="ghost" disabled={isPending} onClick={() => run("CLOSED")}>
          Cerrar con evidencia
        </Button>
      </div>
    </div>
  );
}
