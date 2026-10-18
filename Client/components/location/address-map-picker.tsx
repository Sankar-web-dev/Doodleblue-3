"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  CheckCircle2,
  Compass,
  Crosshair,
  Loader2,
  MapPin,
  Maximize2,
  Minimize2,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { OpenStreetMap } from "./open-street-map";
import {
  extractFromNominatim,
  ExtractedAddressData,
  NominatimItem,
} from "./location-config";

export interface AddressMapPickerProps {
  id?: string;
  placeholder?: string;
  value?: string;
  latitude?: number | null;
  longitude?: number | null;
  onChangeAddress?: (val: string) => void;
  onLocationSelect: (data: ExtractedAddressData) => void;
  className?: string;
  label?: string;
  helperText?: string;
  showMapByDefault?: boolean;
}

interface SuggestionItem {
  id: string;
  title: string;
  subtitle: string;
  data: ExtractedAddressData;
}

export function AddressMapPicker({
  id = "address-input",
  placeholder = "Search address, landmark, or hospital…",
  value = "",
  latitude,
  longitude,
  onChangeAddress,
  onLocationSelect,
  className = "",
  helperText,
  showMapByDefault = true,
}: AddressMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [prevValue, setPrevValue] = useState(value);
  const [query, setQuery] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setQuery(value);
  }

  const [showMap, setShowMap] = useState(showMapByDefault);
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasCoords =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude);

  // Free OpenStreetMap Nominatim search (No API key, No billing required)
  const fetchSuggestions = useCallback(async (text: string) => {
    if (!text || text.trim().length < 2) {
      setSuggestions([]);
      setIsDropdownOpen(false);
      return;
    }

    setIsSearching(true);
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q=${encodeURIComponent(
          text
        )}`
      );
      if (resp.ok) {
        const data = (await resp.json()) as NominatimItem[];
        const results: SuggestionItem[] = data.map((item: NominatimItem) => {
          const extracted = extractFromNominatim(item);
          return {
            id: String(item.place_id),
            title: extracted.addressLine || item.display_name.split(",")[0],
            subtitle:
              [extracted.city, extracted.state, extracted.pincode]
                .filter(Boolean)
                .join(", ") || item.display_name,
            data: extracted,
          };
        });
        setSuggestions(results);
        setIsDropdownOpen(results.length > 0);
      }
    } catch {
      // Ignore network aborts
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search on typing
  useEffect(() => {
    if (!query || query === value) return;
    const timer = setTimeout(() => {
      fetchSuggestions(query);
    }, 350);
    return () => clearTimeout(timer);
  }, [query, value, fetchSuggestions]);

  // Select suggestion
  const handleSelectSuggestion = (item: SuggestionItem) => {
    setIsDropdownOpen(false);
    setQuery(item.title);
    onChangeAddress?.(item.title);
    onLocationSelect(item.data);
    setShowMap(true);
    toast.success("Location and coordinates captured!");
  };

  // Reverse geocoding when pin is moved or map is clicked
  const handleLocationChange = useCallback(
    async (lat: number, lng: number) => {
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
        );
        if (resp.ok) {
          const item = await resp.json();
          const extracted = extractFromNominatim(item);
          setQuery(extracted.addressLine || item.display_name.split(",")[0]);
          onChangeAddress?.(
            extracted.addressLine || item.display_name.split(",")[0]
          );
          onLocationSelect(extracted);
          toast.success("Location pinned accurately!");
          return;
        }
      } catch {
        // Fallback
      }
      onLocationSelect({
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lng.toFixed(6)),
      });
    },
    [onChangeAddress, onLocationSelect]
  );

  // GPS Locate me
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setShowMap(true);
        handleLocationChange(lat, lng);
      },
      (err) => {
        setIsLocating(false);
        toast.error(`Could not get GPS location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div ref={containerRef} className={`space-y-2 relative ${className}`}>
      {/* Search Input Bar with Controls */}
      <div className="relative flex items-center">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        <Input
          id={id}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChangeAddress?.(e.target.value);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsDropdownOpen(true);
          }}
          placeholder={placeholder}
          className="pl-9 pr-24 text-xs h-9 bg-background focus-visible:ring-primary"
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isSearching && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground mr-1" />
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-primary gap-1"
            title="Use current GPS location"
          >
            {isLocating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Crosshair className="h-3.5 w-3.5 text-primary" />
            )}
            <span className="hidden sm:inline">Locate</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowMap((prev) => !prev)}
            className="h-7 px-1.5 text-muted-foreground hover:text-foreground"
            title={showMap ? "Hide map" : "Show map"}
          >
            {showMap ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {isDropdownOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-border bg-popover/95 p-1 shadow-lg backdrop-blur-md">
          {suggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectSuggestion(item)}
              className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Search className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground truncate">
                  {item.title}
                </p>
                {item.subtitle && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    {item.subtitle}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Lat/Lng Badge Indicator */}
      {hasCoords && (
        <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-muted-foreground px-1">
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] py-0 px-2 font-mono gap-1"
            >
              <CheckCircle2 className="h-3 w-3" />
              Lat: {latitude?.toFixed(4)}, Lng: {longitude?.toFixed(4)}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              Click or drag marker on map to adjust exact point
            </span>
          </div>
        </div>
      )}

      {/* Helper text */}
      {helperText && !hasCoords && (
        <p className="text-[11px] text-muted-foreground">{helperText}</p>
      )}

      {/* Free OpenStreetMap Box */}
      {showMap && (
        <div className="relative overflow-hidden rounded-xl border border-border/70 shadow-xs">
          <OpenStreetMap
            latitude={latitude}
            longitude={longitude}
            draggable={true}
            onLocationChange={handleLocationChange}
            className="h-44 w-full"
          />
          <div className="absolute bottom-1.5 left-2 z-[400] rounded-md bg-background/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-medium text-muted-foreground shadow-xs flex items-center gap-1 pointer-events-none">
            <Compass className="h-3 w-3 text-primary" />
            Click or drag marker to set exact location
          </div>
        </div>
      )}
    </div>
  );
}
