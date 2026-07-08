import { useEffect, useMemo, useRef, useState } from "react";
import { FiCrosshair, FiMapPin, FiNavigation, FiSearch } from "react-icons/fi";
import "./OpenStreetMapAddressPicker.css";

const VIETNAM_VIEWBOX = "102.14441,23.393395,109.46932,8.179066";
const DEFAULT_MAP_CENTER = {
  lat: 10.7769,
  lng: 106.7009,
};

const buildMapUrl = (lat, lng, showMarker = true) => {
  const latitude = Number(lat || DEFAULT_MAP_CENTER.lat);
  const longitude = Number(lng || DEFAULT_MAP_CENTER.lng);
  const delta = 0.026;
  const bbox = [
    longitude - delta,
    latitude - delta,
    longitude + delta,
    latitude + delta,
  ].join(",");
  const marker = showMarker ? `&marker=${latitude},${longitude}` : "";
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${marker}`;
};

const normalizeAddressResult = (item) => ({
  label: item.display_name,
  lat: Number(item.lat),
  lng: Number(item.lon),
});

export default function OpenStreetMapAddressPicker({
  value,
  lat,
  lng,
  onChange,
  disabled = false,
  variant = "profile",
  compact = false,
  placeholder = "Tìm địa chỉ giao hàng",
}) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchError, setSearchError] = useState("");
  const searchIdRef = useRef(0);
  const hasSelectedLocation = Boolean(lat && lng);
  const mapUrl = useMemo(() => buildMapUrl(lat, lng, hasSelectedLocation), [lat, lng, hasSelectedLocation]);
  const hasQuery = query.trim().length >= 3;
  const shouldShowResults = isFocused && hasQuery && (results.length > 0 || isSearching || searchError);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    if (disabled) return undefined;

    const text = query.trim();
    if (text.length < 3) {
      setResults([]);
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      const searchId = searchIdRef.current + 1;
      searchIdRef.current = searchId;
      setIsSearching(true);
      setSearchError("");

      try {
        const params = new URLSearchParams({
          format: "jsonv2",
          addressdetails: "1",
          countrycodes: "vn",
          limit: "6",
          viewbox: VIETNAM_VIEWBOX,
          bounded: "1",
          q: text,
        });
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
          headers: {
            "Accept-Language": "vi",
          },
        });
        const data = await response.json();
        if (searchIdRef.current === searchId) {
          setResults(Array.isArray(data) ? data.map(normalizeAddressResult) : []);
        }
      } catch {
        if (searchIdRef.current === searchId) {
          setResults([]);
          setSearchError("Không tìm được địa chỉ. Vui lòng thử từ khóa khác.");
        }
      } finally {
        if (searchIdRef.current === searchId) {
          setIsSearching(false);
        }
      }
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [disabled, query, value]);

  const handleInputChange = (nextValue) => {
    setQuery(nextValue);
    onChange(nextValue, { lat: null, lng: null });
  };

  const handleSelect = (result) => {
    setQuery(result.label);
    setResults([]);
    setSearchError("");
    onChange(result.label, { lat: result.lat, lng: result.lng });
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation || disabled) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextLat = position.coords.latitude;
        const nextLng = position.coords.longitude;

        try {
          const params = new URLSearchParams({
            format: "jsonv2",
            lat: String(nextLat),
            lon: String(nextLng),
            addressdetails: "1",
          });
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
            headers: {
              "Accept-Language": "vi",
            },
          });
          const data = await response.json();
          const address = data?.display_name || `${nextLat.toFixed(6)}, ${nextLng.toFixed(6)}`;
          setQuery(address);
          setResults([]);
          onChange(address, { lat: nextLat, lng: nextLng });
        } catch {
          const fallbackAddress = `${nextLat.toFixed(6)}, ${nextLng.toFixed(6)}`;
          setQuery(fallbackAddress);
          onChange(fallbackAddress, { lat: nextLat, lng: nextLng });
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setSearchError("Không thể lấy vị trí hiện tại. Hãy kiểm tra quyền định vị của trình duyệt.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  return (
    <div className={`osm-address-picker osm-${variant} ${compact ? "osm-compact" : ""} ${disabled ? "disabled" : ""}`}>
      <div className="osm-picker-heading">
        <span><FiMapPin /> Bản đồ giao hàng</span>
        <strong>Chọn vị trí giao hàng</strong>
        <p>Tìm địa chỉ hoặc dùng định vị để đặt ghim giao hàng chính xác.</p>
      </div>

      <div className="osm-search-area">
        <div className="osm-search-row">
          <div className={`osm-input-wrap ${isFocused ? "focused" : ""}`}>
            <span className="osm-input-icon"><FiSearch /></span>
            <input
              type="text"
              value={query}
              disabled={disabled}
              placeholder={placeholder}
              onFocus={() => setIsFocused(true)}
              onBlur={() => window.setTimeout(() => setIsFocused(false), 160)}
              onChange={(event) => handleInputChange(event.target.value)}
            />
          </div>
          <button
            type="button"
            className="osm-action-btn"
            disabled={disabled}
            onClick={() => setIsFocused(true)}
          >
            <FiSearch /> <span className="osm-action-label">Tìm</span>
          </button>
          <button
            type="button"
            className={`osm-action-btn locate ${isLocating ? "loading" : ""}`}
            disabled={disabled || isLocating || !navigator.geolocation}
            onClick={handleUseCurrentLocation}
            title="Dùng vị trí hiện tại"
          >
            {isLocating ? <span className="osm-spinner" /> : <FiCrosshair />} <span className="osm-action-label">Định vị</span>
          </button>
        </div>

        {shouldShowResults && (
          <div className="osm-results">
            {isSearching && <div className="osm-result muted"><span className="osm-mini-spinner" />Đang tìm địa chỉ...</div>}
            {!isSearching && searchError && <div className="osm-result muted">{searchError}</div>}
            {!isSearching && !searchError && results.length === 0 && <div className="osm-result muted">Không có gợi ý phù hợp.</div>}
            {results.map((result) => (
              <button type="button" key={`${result.lat}-${result.lng}-${result.label}`} onMouseDown={() => handleSelect(result)}>
                <FiMapPin />
                <span>{result.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="osm-map-card">
        <div className="osm-map-preview">
          <iframe title="Bản đồ địa chỉ đã chọn" src={mapUrl} loading="lazy" />
        </div>
        <div className="osm-map-caption">
          {hasSelectedLocation ? (
            <span><FiNavigation /> Ghim đã chọn: {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}</span>
          ) : (
            <span><FiNavigation /> Bản đồ mặc định khu vực TP.HCM. Hãy tìm địa chỉ để đặt ghim.</span>
          )}
        </div>
      </div>
    </div>
  );
}
