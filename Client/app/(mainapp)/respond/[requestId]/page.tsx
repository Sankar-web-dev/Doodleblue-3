import { RequirePermission } from "../../_components/require-permission";
import { RespondView } from "../_components/respond-view";

interface RespondPageProps {
  params: Promise<{ requestId: string }>;
}

export default async function RespondPage({ params }: RespondPageProps) {
  const { requestId } = await params;
  return (
    <RequirePermission
      resource="responses"
      action="create"
      message="You don't have permission to respond to blood requests."
    >
      <RespondView requestId={requestId} />
    </RequirePermission>
  );
}
