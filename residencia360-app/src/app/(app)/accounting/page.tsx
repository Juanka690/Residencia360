import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/page-shell";
import { currency, formatDate } from "@/lib/utils";
import { requirePath } from "@/server/auth/session";
import { getAccountingView } from "@/server/services/accounting";
import { PaymentReviewActions, PaymentSupportForm } from "@/app/(app)/accounting/payment-form";

export default async function AccountingPage() {
  const user = await requirePath("/accounting");
  const data = await getAccountingView(user.role, user.apartmentId);

  if (Array.isArray(data)) {
    return (
      <div className="space-y-6">
        <PageShell title="Validacion de pagos" description="Revision manual de soportes y control del estado de cuenta de la unidad.">
          <div className="space-y-4">
            {data.map((account) => (
              <div key={account.id} className="rounded-2xl border border-border bg-white p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-medium">{account.apartment.tower.name} · {account.apartment.number}</p>
                    <p className="text-sm text-muted-foreground">Saldo: {currency(account.balance)} · Mora: {currency(account.overdueAmount)}</p>
                  </div>
                  <Badge variant={account.status === "IN_ARREARS" ? "danger" : "success"}>{account.status}</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  {account.payments.map((payment) => (
                    <div key={payment.id} className="rounded-2xl border border-border p-3">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="font-medium">{payment.reference}</p>
                          <p className="text-sm text-muted-foreground">{currency(payment.amount)} · {formatDate(payment.paidAt)}</p>
                        </div>
                        <PaymentReviewActions paymentId={payment.id} actorId={user.id} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </PageShell>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageShell title="Estado de cuenta" description="Consulta saldos, vencimientos y registra soportes de pago para validacion administrativa.">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Saldo total</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{currency(data?.balance ?? 0)}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Por vencer</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{currency(data?.dueAmount ?? 0)}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Mora</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{currency(data?.overdueAmount ?? 0)}</CardContent>
          </Card>
        </div>
        <div className="mt-6 space-y-3">
          {data?.charges.map((charge) => (
            <div key={charge.id} className="rounded-2xl border border-border bg-white p-4">
              <p className="font-medium">{charge.concept}</p>
              <p className="text-sm text-muted-foreground">{charge.periodLabel} · vence {formatDate(charge.dueDate)} · {currency(charge.amount)}</p>
            </div>
          ))}
        </div>
      </PageShell>
      <Card>
        <CardHeader>
          <CardTitle>Cargar soporte de pago</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentSupportForm apartmentId={user.apartmentId!} actorId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
