import { ScreeningView } from "../../_components/screening-view";

interface ScreeningPageProps {
  params: Promise<{ requestId: string }>;
}

export default async function ScreeningPage({ params }: ScreeningPageProps) {
  const { requestId } = await params;
  return <ScreeningView requestId={requestId} />;
}
