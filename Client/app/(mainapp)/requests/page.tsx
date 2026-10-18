import { RequestsView } from "./_components/requests-view";

interface RequestsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RequestsPage({ searchParams }: RequestsPageProps) {
  const params = await searchParams;
  const initialResponsesRequestId =
    typeof params.responses === "string" ? params.responses : undefined;

  return <RequestsView initialResponsesRequestId={initialResponsesRequestId} />;
}
