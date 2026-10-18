"use client";

import { useEffect, useRef } from "react";
import type * as LeafletTypes from "leaflet";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "./location-config";

interface OpenStreetMapProps {
  latitude?: number | null;
  longitude?: number | null;
  draggable?: boolean;
  onLocationChange?: (lat: number, lng: number) => void;
  className?: string;
  zoom?: number;
}

export function OpenStreetMap({
  latitude,
  longitude,
  draggable = true,
  onLocationChange,
  className = "h-44 w-full",
  zoom = DEFAULT_MAP_ZOOM,
}: OpenStreetMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletTypes.Map | null>(null);
  const markerRef = useRef<LeafletTypes.Marker | null>(null);

  const hasCoords =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude);

  const centerLat = hasCoords ? latitude! : DEFAULT_MAP_CENTER.lat;
  const centerLng = hasCoords ? longitude! : DEFAULT_MAP_CENTER.lng;

  const onLocationChangeRef = useRef(onLocationChange);
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  });

  const initConfigRef = useRef({
    centerLat,
    centerLng,
    zoom: hasCoords ? 15 : zoom,
    draggable,
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    let isMounted = true;

    import("leaflet").then((leafletModule) => {
      const L = leafletModule.default || leafletModule;
      if (!isMounted || !mapContainerRef.current || mapInstanceRef.current) return;

      const {
        centerLat: initLat,
        centerLng: initLng,
        zoom: initZoom,
        draggable: isDraggable,
      } = initConfigRef.current;

      const map = L.map(mapContainerRef.current, {
        center: [initLat, initLng],
        zoom: initZoom,
        zoomControl: true,
        attributionControl: false,
      });

      // 100% Free OpenStreetMap standard tiles (No watermarks, no API keys needed)
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Invalidate map size so it calculates bounds properly
      setTimeout(() => {
        if (isMounted && map) {
          map.invalidateSize();
        }
      }, 200);

      // Custom branded pin icon
      const customIcon = L.divIcon({
        className: "bg-transparent",
        html: `
          <div style="position: relative; width: 34px; height: 34px; transform: translate(-50%, -100%);">
            <div style="background: linear-gradient(135deg, #e11d48, #be123c); width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.35); border: 2.5px solid #ffffff;">
              <svg style="transform: rotate(45deg); width: 16px; height: 16px; color: white;" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      });

      // Marker
      const marker = L.marker([initLat, initLng], {
        draggable: isDraggable,
        icon: customIcon,
      }).addTo(map);

      if (isDraggable) {
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onLocationChangeRef.current?.(pos.lat, pos.lng);
        });
      }

      // Map click to move pin
      map.on("click", (e: LeafletTypes.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        onLocationChangeRef.current?.(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markerRef.current = null;
    };
  }, []);

  // Sync coords if changed from outside
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current || !hasCoords) return;

    const currentMarkerPos = markerRef.current.getLatLng();
    if (
      Math.abs(currentMarkerPos.lat - latitude!) > 0.0001 ||
      Math.abs(currentMarkerPos.lng - longitude!) > 0.0001
    ) {
      markerRef.current.setLatLng([latitude!, longitude!]);
      mapInstanceRef.current.panTo([latitude!, longitude!]);
    }
  }, [latitude, longitude, hasCoords]);

  return <div ref={mapContainerRef} className={className} />;
}
