import { NotificationView } from "../_components/notification-view";

interface NotificationPageProps {
  params: Promise<{ requestId: string }>;
}

export default async function NotificationPage({
  params,
}: NotificationPageProps) {
  const { requestId } = await params;
  return <NotificationView requestId={requestId} />;
}
