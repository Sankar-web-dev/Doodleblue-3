import { RequirePermission } from "../../../_components/require-permission";
import { ScreeningView } from "../../_components/screening-view";

interface ScreeningPageProps {
  params: Promise<{ requestId: string }>;
}

export default async function ScreeningPage({ params }: ScreeningPageProps) {
  const { requestId } = await params;
  return (
    <RequirePermission
      resource="donations"
      action="update"
      message="You don't have permission to manage donation screening."
    >
      <ScreeningView requestId={requestId} />
    </RequirePermission>
  );
}
