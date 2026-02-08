import { redirect } from 'next/navigation';

export default function TenantHomePage({
  params,
}: {
  params: { tenantId: string };
}) {
  redirect(`/${params.tenantId}/dashboard`);
}
