export const DEFAULT_MAP_CENTER = {
  lat: 13.0827,
  lng: 80.2707, // Default fallback (Chennai)
};

export const DEFAULT_MAP_ZOOM = 14;

export interface ExtractedAddressData {
  addressLine?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  formattedAddress?: string;
}

export interface NominatimItem {
  place_id?: number | string;
  lat: string | number;
  lon: string | number;
  display_name: string;
  address?: Record<string, string>;
}

/**
 * Normalizes OpenStreetMap / Nominatim geocoded results into standardized profile/request fields
 */
export function extractFromNominatim(item: NominatimItem): ExtractedAddressData {
  const addr = item.address || {};
  const lat = typeof item.lat === "number" ? item.lat : parseFloat(item.lat);
  const lng = typeof item.lon === "number" ? item.lon : parseFloat(item.lon);

  const addressLine =
    [
      addr.hospital || addr.amenity || addr.building || addr.house_number,
      addr.road || addr.street,
      addr.suburb || addr.neighbourhood,
    ]
      .filter(Boolean)
      .join(", ") || (item.display_name ? item.display_name.split(",")[0] : "");

  const city =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.suburb ||
    "";
  const district = addr.state_district || addr.county || city || "";
  const state = addr.state || "";
  const pincode = addr.postcode || "";

  return {
    addressLine,
    city,
    district,
    state,
    pincode,
    latitude: Number(lat.toFixed(6)),
    longitude: Number(lng.toFixed(6)),
    formattedAddress: item.display_name || addressLine,
  };
}
