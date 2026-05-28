import { ResetPasswordForm } from "@/app/(auth)/auth/reset-password/[token]/reset-password-form";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <ResetPasswordForm token={token} />
    </main>
  );
}
