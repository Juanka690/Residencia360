import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PageShell({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          {description ? <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  );
}
