import { RespondView } from "../_components/respond-view";

interface RespondPageProps {
  params: Promise<{ requestId: string }>;
}

export default async function RespondPage({ params }: RespondPageProps) {
  const { requestId } = await params;
  return <RespondView requestId={requestId} />;
}
