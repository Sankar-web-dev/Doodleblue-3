import { RequirePermission } from "../../_components/require-permission";
import { RequestForm } from "../_components/request-form";

export default function CreateRequestPage() {
  return (
    <RequirePermission
      resource="requests"
      action="create"
      message="You don't have permission to create blood requests."
    >
      <RequestForm mode="create" />
    </RequirePermission>
  );
}
