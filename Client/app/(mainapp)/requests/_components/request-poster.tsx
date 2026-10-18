import type { ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Droplet,
  Droplets,
  Heart,
  HeartHandshake,
  Hospital,
  Layers,
  Loader2,
  MapPin,
  Phone,
  StickyNote,
  UserRound,
  Zap,
  Activity,
} from "lucide-react";
import type { BloodUrgency } from "@/api/requests.api";
import {
  BLOOD_GROUP_LABELS,
  COMPONENT_LABELS,
  STATUS_LABELS,
  URGENCY_LABELS,
  type RequestPosterData,
} from "../_lib/request-form";
import { cn } from "@/lib/utils";
import { LocationMapView } from "@/components/location/location-map-view";

const URGENCY_PILL_TEXT: Record<BloodUrgency, string> = {
  EMERGENCY: "text-red-600",
  WITHIN_24_HOURS: "text-amber-600",
  SCHEDULED: "text-blue-600",
};

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="ml-auto truncate text-xs font-semibold text-slate-800">
        {value ?? "—"}
      </span>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  iconTint,
  title,
  children,
  className,
}: {
  icon: typeof MapPin;
  iconTint: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-rose-100/80 bg-white/80 p-3.5 shadow-sm backdrop-blur-sm",
        className
      )}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md",
            iconTint
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <p className="text-xs font-bold tracking-wide text-slate-800">{title}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

interface RequestPosterProps {
  data: RequestPosterData;
  /** When provided, the "I Want to Help" pill becomes a real button. */
  onRespond?: () => void;
  respondPending?: boolean;
  responded?: boolean;
}

/**
 * Poster-style rendering of a blood request — shown as the preview before
 * publishing and as the shareable view from the requests list.
 */
export function RequestPoster({
  data,
  onRespond,
  respondPending,
  responded,
}: RequestPosterProps) {
  const groupLabel =
    BLOOD_GROUP_LABELS[data.bloodGroup] ?? String(data.bloodGroup);
  const fulfilled = data.unitsFulfilled ?? 0;
  const progress = Math.min(
    100,
    Math.round((fulfilled / Math.max(1, data.unitsRequired)) * 100)
  );

  return (
    <section className="relative isolate w-full overflow-hidden rounded-2xl border border-rose-200/70 bg-gradient-to-br from-rose-50 via-[#ffe5e8] to-rose-200 shadow-xl shadow-rose-200/40">
      {/* Background decorations */}
      <div className="pointer-events-none absolute -right-12 top-10 -z-10 size-64 rounded-full bg-rose-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-10 -z-10 size-56 rounded-full bg-white/70 blur-3xl" />
      <div className="pointer-events-none absolute right-20 top-0 -z-10 size-36 rounded-full bg-white/40 blur-2xl" />

      {/* Hero — text + hands illustration */}
      <div className="relative min-h-[240px] px-5 pt-5 sm:min-h-[270px] sm:px-6">
        <div className="relative z-10 w-[62%]">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-3 py-2 text-[11px] font-bold shadow-sm backdrop-blur-sm sm:text-xs",
              URGENCY_PILL_TEXT[data.urgency]
            )}
          >
            <Zap size={15} fill="currentColor" />
            {data.requestType === "RECIPIENT"
              ? `${URGENCY_LABELS[data.urgency]} Patient Appeal`
              : `${URGENCY_LABELS[data.urgency]} Blood Request`}
          </div>

          <h1 className="mt-5 flex flex-col text-[clamp(2.2rem,4.5vw,3.4rem)] font-black leading-[0.92] tracking-[-0.055em]">
            <span className="bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">
              Blood
            </span>
            <span className="mt-1 text-slate-950">Required</span>
          </h1>

          <p className="mt-4 text-sm font-medium leading-6 text-slate-600">
            Your small act of kindness
            <br />
            can save a life{" "}
            <Heart
              className="inline-block size-4 text-rose-500"
              fill="currentColor"
            />
          </p>
        </div>

        {/* Decorative blood drop and hands */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-4%] top-4 h-[230px] w-[52%] sm:right-0 sm:top-3 sm:h-[255px]"
        >
          {/* Floating hearts */}
          <Heart
            className="absolute left-[8%] top-[14%] size-6 rotate-[-15deg] animate-bounce text-rose-500"
            fill="currentColor"
            strokeWidth={1.5}
          />
          <Heart
            className="absolute left-0 top-[58%] size-7 rotate-12 text-rose-500"
            fill="currentColor"
            strokeWidth={1.5}
          />
          <Heart
            className="absolute right-[5%] top-[38%] size-4 rotate-12 text-rose-400"
            fill="currentColor"
          />

          {/* Handwritten message */}
          <div className="absolute right-2 top-0 z-10 rotate-[-9deg] text-center font-serif text-xs font-bold italic leading-tight text-red-600 sm:right-3 sm:text-sm">
            Donate
            <br />
            Blood
            <br />
            Save Lives
            <Heart
              className="ml-1 inline size-3 text-rose-500"
              fill="currentColor"
            />
          </div>

          {/* SVG illustration */}
          <svg
            viewBox="0 0 270 290"
            className="absolute inset-0 h-full w-full overflow-visible drop-shadow-[0_12px_12px_rgba(185,0,38,0.16)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient
                id="bloodDrop"
                x1="90"
                y1="20"
                x2="190"
                y2="180"
              >
                <stop offset="0%" stopColor="#ff858d" />
                <stop offset="42%" stopColor="#f01435" />
                <stop offset="100%" stopColor="#ad0028" />
              </linearGradient>
              <linearGradient
                id="skin"
                x1="65"
                y1="145"
                x2="180"
                y2="250"
              >
                <stop offset="0%" stopColor="#ffe8dc" />
                <stop offset="100%" stopColor="#efa18e" />
              </linearGradient>
            </defs>

            {/* Decorative orbit */}
            <path
              d="M66 170 C8 126 34 77 73 91 C98 99 108 122 119 139"
              stroke="#fb536b"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M192 139 C213 109 245 100 251 127 C257 151 229 169 205 184"
              stroke="#fb536b"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Left hand */}
            <path
              d="M111 232 C98 222 87 210 78 192 L60 158
                C56 150 60 144 67 147 C74 151 84 170 92 180
                L83 153 C80 144 86 140 92 146 L110 174
                L104 151 C102 143 110 140 115 147
                L131 174 L137 193 L143 224 Z"
              fill="url(#skin)"
              stroke="#e89c88"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {/* Right hand */}
            <path
              d="M158 231 C174 221 186 208 194 190 L210 157
                C214 149 210 144 203 147 C197 150 188 169 180 181
                L189 153 C192 145 186 141 180 147 L163 175
                L169 152 C171 144 163 140 158 147
                L143 175 L138 196 L133 224 Z"
              fill="url(#skin)"
              stroke="#e89c88"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {/* Blood drop */}
            <path
              d="M135 12 C121 44 83 91 83 133
                C83 170 106 193 135 193
                C164 193 187 170 187 133
                C187 91 149 44 135 12Z"
              fill="url(#bloodDrop)"
              stroke="#ff9aa5"
              strokeWidth="2"
            />

            {/* Glossy highlight */}
            <path
              d="M128 39 C108 77 99 105 100 132
                C101 150 110 162 120 167"
              stroke="white"
              strokeOpacity=".75"
              strokeWidth="8"
              strokeLinecap="round"
            />

            {/* Medical cross */}
            <rect x="128" y="91" width="14" height="53" fill="white" />
            <rect x="109" y="110" width="52" height="14" fill="white" />

            {/* Wrist highlights */}
            <path
              d="M94 209 Q112 219 127 211 L139 242 Q118 253 101 239Z"
              fill="#ffc7b7"
              opacity=".85"
            />
            <path
              d="M177 209 Q158 219 143 211 L131 242 Q152 253 169 239Z"
              fill="#ffc7b7"
              opacity=".85"
            />
          </svg>
        </div>
      </div>

      {/* Fulfillment Progress Banner */}
      {(data.unitsFulfilled ?? 0) > 0 && (
        <div className="relative z-10 mx-5 mt-2 rounded-xl border border-emerald-200 bg-emerald-50/90 p-3 shadow-xs sm:mx-6">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-950">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {data.unitsFulfilled} of {data.unitsRequired} units fulfilled
            </span>
            <span className="font-bold text-emerald-700">
              {Math.max(0, data.unitsRequired - (data.unitsFulfilled ?? 0))} still needed
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-emerald-200/60">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.round(((data.unitsFulfilled ?? 0) / data.unitsRequired) * 100))}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="relative z-10 grid grid-cols-2 gap-2 px-5 pt-3 sm:grid-cols-4 sm:px-6">
        <div className="flex flex-col items-center gap-1 rounded-xl border border-rose-100/80 bg-white/80 px-2 py-3 text-center shadow-sm backdrop-blur-sm">
          <Droplet className="h-6 w-6 fill-red-600 text-red-600" />
          <p className="font-display text-xl font-black text-rose-950">
            {groupLabel}
          </p>
          <p className="text-[10px] font-medium text-muted-foreground">
            Blood Group
          </p>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl border border-rose-100/80 bg-white/80 px-2 py-3 text-center shadow-sm backdrop-blur-sm">
          <Droplets className="h-6 w-6 text-red-600" />
          <p className="font-display text-xl font-black text-rose-950">
            {(data.unitsFulfilled ?? 0) > 0
              ? Math.max(0, data.unitsRequired - (data.unitsFulfilled ?? 0))
              : data.unitsRequired}
          </p>
          <p className="text-[10px] font-medium text-muted-foreground">
            {(data.unitsFulfilled ?? 0) > 0 ? "Units Needed" : "Units Required"}
          </p>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl border border-rose-100/80 bg-white/80 px-2 py-3 text-center shadow-sm backdrop-blur-sm">
          <Layers className="h-6 w-6 text-red-600" />
          <p className="font-display text-sm font-black leading-5 text-rose-950">
            {COMPONENT_LABELS[data.component] ?? data.component}
          </p>
          <p className="text-[10px] font-medium text-muted-foreground">
            Component
          </p>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl border border-rose-100/80 bg-white/80 px-2 py-3 text-center shadow-sm backdrop-blur-sm">
          <Clock className="h-6 w-6 text-red-600" />
          <p className="font-display text-sm font-black leading-5 text-rose-950">
            {URGENCY_LABELS[data.urgency]}
          </p>
          <p className="text-[10px] font-medium text-muted-foreground">
            Urgency
          </p>
        </div>
      </div>

      {/* Date cards */}
      <div className="relative z-10 grid grid-cols-1 gap-2 px-5 pt-2 sm:grid-cols-2 sm:px-6">
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-100/80 bg-white/80 px-3.5 py-2.5 shadow-sm backdrop-blur-sm">
          <CalendarDays className="h-4 w-4 shrink-0 text-red-600" />
          <div>
            <p className="text-[10px] font-medium text-muted-foreground">
              Required By
            </p>
            <p className="text-xs font-bold text-slate-800">
              {formatDate(data.requiredBy)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-100/80 bg-white/80 px-3.5 py-2.5 shadow-sm backdrop-blur-sm">
          <CalendarDays className="h-4 w-4 shrink-0 text-red-600" />
          <div>
            <p className="text-[10px] font-medium text-muted-foreground">
              Request Expires On
            </p>
            <p className="text-xs font-bold text-slate-800">
              {formatDate(data.expiresAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Patient + Hospital cards */}
      <div className="relative z-10 grid grid-cols-1 gap-2 px-5 pt-2 sm:grid-cols-2 sm:px-6">
        <SectionCard
          icon={UserRound}
          iconTint="bg-rose-100 text-rose-600"
          title="Patient Details"
        >
          <InfoRow icon={UserRound} label="Name" value={data.patientName} />
          <InfoRow
            icon={Clock}
            label="Age"
            value={
              data.patientAge != null ? `${data.patientAge} years` : undefined
            }
          />
          <InfoRow
            icon={HeartHandshake}
            label="Relationship"
            value={data.relationshipToPatient}
          />
          <InfoRow
            icon={Activity}
            label="Reason / Condition"
            value={data.reason}
          />
        </SectionCard>

        <SectionCard
          icon={MapPin}
          iconTint="bg-red-100 text-red-600"
          title="Hospital & Location"
        >
          <InfoRow
            icon={Hospital}
            label="Hospital / Venue"
            value={data.hospitalName}
          />
          <InfoRow icon={MapPin} label="Address" value={data.hospitalAddress} />
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            <InfoRow icon={MapPin} label="Pincode" value={data.pincode} />
            <InfoRow icon={MapPin} label="City" value={data.city} />
            <InfoRow icon={MapPin} label="District" value={data.district} />
            <InfoRow icon={MapPin} label="State" value={data.state} />
          </div>
          {(data.latitude || data.longitude || data.hospitalAddress) && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <LocationMapView
                latitude={data.latitude}
                longitude={data.longitude}
                title={data.hospitalName ?? "Hospital Location"}
                address={data.hospitalAddress || [data.city, data.state].filter(Boolean).join(", ")}
                height="h-28"
              />
            </div>
          )}
        </SectionCard>
      </div>

      {/* Contact + Notes */}
      <div className="relative z-10 grid grid-cols-1 gap-2 px-5 pt-2 sm:grid-cols-2 sm:px-6">
        <SectionCard
          icon={Phone}
          iconTint="bg-emerald-100 text-emerald-600"
          title="Contact Person"
        >
          <InfoRow icon={UserRound} label="Name" value={data.contactName} />
          <InfoRow icon={Phone} label="Phone" value={data.contactPhone} />
        </SectionCard>

        <SectionCard
          icon={StickyNote}
          iconTint="bg-violet-100 text-violet-600"
          title="Additional Notes"
        >
          <p className="text-xs leading-relaxed text-muted-foreground">
            {data.notes ?? "—"}
          </p>
        </SectionCard>
      </div>

      {/* Fulfilment progress */}
      {fulfilled > 0 && (
        <div className="relative z-10 px-5 pt-3 sm:px-6">
          <div className="h-2 w-full overflow-hidden rounded-full bg-rose-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-center text-[11px] font-medium text-muted-foreground">
            {fulfilled} of {data.unitsRequired} units collected
          </p>
        </div>
      )}

      {/* Footer banner */}
      <div className="relative z-10 mt-4 flex items-center justify-between gap-3 bg-gradient-to-r from-red-700 via-red-600 to-rose-600 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
            <HeartHandshake className="h-5 w-5 text-white" />
          </span>
          <div>
            <p className="font-display text-sm font-bold text-white">
              Be a Hero. Donate Blood. Save Lives.
            </p>
            <p className="text-[11px] text-white/80">
              {data.institutionName
                ? `${data.institutionName} · Every drop counts.`
                : data.patientName
                ? `Appeal for ${data.patientName} · Every drop counts.`
                : data.creatorName
                ? `Appeal by ${data.creatorName} · Every drop counts.`
                : "Every drop counts."}
              {data.status && data.status !== "OPEN"
                ? ` · ${STATUS_LABELS[data.status]}`
                : ""}
            </p>
          </div>
        </div>
        {onRespond ? (
          <button
            type="button"
            onClick={onRespond}
            disabled={respondPending || responded}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-red-600 shadow-md transition-transform hover:scale-[1.03] active:scale-95 disabled:cursor-not-allowed disabled:opacity-80"
          >
            {respondPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : null}
            {responded ? "Response Sent" : "I Want to Help"}
            {!responded && !respondPending && (
              <ArrowRight className="h-3.5 w-3.5" />
            )}
            {responded && <CheckCircle2 className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-red-600 shadow-md">
            I Want to Help
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>

      {/* Heartbeat decoration */}
      <div className="pointer-events-none absolute bottom-16 right-2 z-0 text-rose-400/60">
        <Activity size={64} strokeWidth={1.2} />
      </div>
    </section>
  );
}
