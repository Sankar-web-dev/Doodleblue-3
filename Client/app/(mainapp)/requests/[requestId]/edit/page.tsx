import { EditRequestForm } from "../../_components/edit-request-form";

interface EditRequestPageProps {
  params: Promise<{ requestId: string }>;
}

export default async function EditRequestPage({
  params,
}: EditRequestPageProps) {
  const { requestId } = await params;
  return <EditRequestForm requestId={requestId} />;
}
