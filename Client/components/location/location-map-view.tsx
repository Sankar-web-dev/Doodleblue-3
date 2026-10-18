"use client";

import { ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OpenStreetMap } from "./open-street-map";

interface LocationMapViewProps {
  latitude?: number | null;
  longitude?: number | null;
  title?: string;
  address?: string | null;
  className?: string;
  height?: string;
}

export function LocationMapView({
  latitude,
  longitude,
  title,
  address,
  className = "",
  height = "h-48",
}: LocationMapViewProps) {
  const hasCoords =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude);

  const mapUrl = hasCoords
    ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`
    : address
      ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`
      : null;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border/70 bg-card shadow-xs ${className}`}
    >
      <div className={`w-full ${height} bg-muted/30`}>
        <OpenStreetMap
          latitude={latitude}
          longitude={longitude}
          draggable={false}
          className={`w-full ${height}`}
          zoom={hasCoords ? 15 : 13}
        />
      </div>

      {/* Footer bar with details and Maps link */}
      <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-background/95 p-2.5 px-3 text-xs">
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 truncate">
            {title && (
              <p className="font-bold text-foreground text-xs truncate">
                {title}
              </p>
            )}
            {address && (
              <p className="text-[11px] text-muted-foreground truncate">
                {address}
              </p>
            )}
            {hasCoords && (
              <p className="text-[10px] font-mono text-muted-foreground">
                {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
              </p>
            )}
          </div>
        </div>

        {mapUrl && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 shrink-0 gap-1 text-[11px]"
            asChild
          >
            <a href={mapUrl} target="_blank" rel="noopener noreferrer">
              View on Map
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
