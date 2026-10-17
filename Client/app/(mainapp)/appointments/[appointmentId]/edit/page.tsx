import { EditAppointmentView } from "../../_components/edit-appointment-view";

interface EditAppointmentPageProps {
  params: Promise<{ appointmentId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EditAppointmentPage({
  params,
  searchParams,
}: EditAppointmentPageProps) {
  const { appointmentId } = await params;
  const sp = await searchParams;
  const str = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  return (
    <EditAppointmentView
      appointmentId={appointmentId}
      requestId={str(sp.request) ?? ""}
      donorName={str(sp.name) ?? ""}
    />
  );
}
