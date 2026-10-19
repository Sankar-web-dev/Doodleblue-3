import { RequirePermission } from "../../../_components/require-permission";
import { EditRequestForm } from "../../_components/edit-request-form";

interface EditRequestPageProps {
  params: Promise<{ requestId: string }>;
}

export default async function EditRequestPage({
  params,
}: EditRequestPageProps) {
  const { requestId } = await params;
  return (
    <RequirePermission
      resource="requests"
      action="update"
      message="You don't have permission to edit blood requests."
    >
      <EditRequestForm requestId={requestId} />
    </RequirePermission>
  );
}
