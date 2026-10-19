import { RequirePermission } from "../../_components/require-permission";
import { ScheduleView } from "../_components/schedule-view";

interface CreateAppointmentPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CreateAppointmentPage({
  searchParams,
}: CreateAppointmentPageProps) {
  const params = await searchParams;
  const str = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  return (
    <RequirePermission
      resource="appointments"
      action="create"
      message="You don't have permission to schedule appointments."
    >
      <ScheduleView
        requestId={str(params.request) ?? ""}
        donorProfileId={str(params.donor) ?? ""}
        donorName={str(params.name) ?? ""}
      />
    </RequirePermission>
  );
}
