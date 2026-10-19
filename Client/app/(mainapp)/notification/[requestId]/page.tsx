import { RequirePermission } from "../../_components/require-permission";
import { NotificationView } from "../_components/notification-view";

interface NotificationPageProps {
  params: Promise<{ requestId: string }>;
}

export default async function NotificationPage({
  params,
}: NotificationPageProps) {
  const { requestId } = await params;
  return (
    <RequirePermission
      resource="requests"
      action="read"
      message="You don't have permission to view blood requests."
    >
      <NotificationView requestId={requestId} />
    </RequirePermission>
  );
}
