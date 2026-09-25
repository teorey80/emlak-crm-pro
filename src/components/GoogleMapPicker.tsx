import React, { useEffect, useRef, useState } from 'react';

type Coordinates = { lat: number; lng: number };
type MapClickEvent = { latLng?: { lat: () => number; lng: () => number } };
type GeocodeResult = { formatted_address: string; geometry: { location: { lat: () => number; lng: () => number } } };
type MapApi = {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => {
    setCenter: (position: Coordinates) => void;
    addListener: (name: string, callback: (event: MapClickEvent) => void) => { remove: () => void };
  };
  Marker: new (options: Record<string, unknown>) => {
    setPosition: (position: Coordinates) => void;
    addListener: (name: string, callback: (event: MapClickEvent) => void) => { remove: () => void };
  };
  Geocoder: new () => { geocode: (request: { address?: string; location?: Coordinates; region?: string }, callback: (results: GeocodeResult[] | null, status: string) => void) => void };
};

declare global {
  interface Window { google?: { maps: MapApi } }
}

let mapsLoader: Promise<MapApi> | null = null;
function loadMaps(): Promise<MapApi> {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (mapsLoader) return mapsLoader;
  const key = import.meta.env.VITE_GOOGLE_API_KEY;
  if (!key) return Promise.reject(new Error('Google Haritalar API anahtarı eksik.'));
  mapsLoader = new Promise((resolve, reject) => {
    const callbackName = `emlakMapsReady${Date.now()}`;
    const scope = window as unknown as Record<string, unknown>;
    const script = document.createElement('script');
    const cleanup = () => { delete scope[callbackName]; };
    scope[callbackName] = () => {
      cleanup();
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error('Harita yüklenemedi.'));
    };
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=${callbackName}&language=tr&region=TR`;
    script.async = true;
    script.onerror = () => { cleanup(); mapsLoader = null; reject(new Error('Google Haritalar yüklenemedi.')); };
    document.head.appendChild(script);
  });
  return mapsLoader;
}

interface GoogleMapPickerProps {
  coordinates: Coordinates;
  onChange: (value: Coordinates, address?: string) => void;
}

export async function geocodeAddress(address: string): Promise<{ coordinates: Coordinates; address: string }> {
  const api = await loadMaps();
  return new Promise((resolve, reject) => new api.Geocoder().geocode({ address, region: 'TR' }, (results, status) => {
    if (status !== 'OK' || !results?.[0]) { reject(new Error('Adres bulunamadı. Daha ayrıntılı bir adres deneyin.')); return; }
    const result = results[0];
    resolve({ coordinates: { lat: result.geometry.location.lat(), lng: result.geometry.location.lng() }, address: result.formatted_address });
  }));
}

const GoogleMapPicker: React.FC<GoogleMapPickerProps> = ({ coordinates, onChange }) => {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<InstanceType<MapApi['Map']> | null>(null);
  const marker = useRef<InstanceType<MapApi['Marker']> | null>(null);
  const onChangeRef = useRef(onChange);
  const [error, setError] = useState('');
  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;
    let mapListener: { remove: () => void } | null = null;
    let dragListener: { remove: () => void } | null = null;
    loadMaps().then(api => {
      if (cancelled || !element.current) return;
      const createdMap = new api.Map(element.current, { center: coordinates, zoom: 16, mapTypeControl: false, streetViewControl: false });
      const createdMarker = new api.Marker({ map: createdMap, position: coordinates, draggable: true, title: 'Seçilen konum' });
      map.current = createdMap;
      marker.current = createdMarker;
      const update = (event: MapClickEvent) => {
        if (!event.latLng) return;
        const selected = { lat: event.latLng.lat(), lng: event.latLng.lng() };
        createdMarker.setPosition(selected);
        onChangeRef.current(selected);
        new api.Geocoder().geocode({ location: selected }, (results, status) => {
          if (status === 'OK' && results?.[0]) onChangeRef.current(selected, results[0].formatted_address);
        });
      };
      mapListener = createdMap.addListener('click', update);
      dragListener = createdMarker.addListener('dragend', update);
    }).catch(error => !cancelled && setError(error instanceof Error ? error.message : 'Harita açılmadı.'));
    return () => { cancelled = true; mapListener?.remove(); dragListener?.remove(); map.current = null; marker.current = null; };
  }, []);

  useEffect(() => {
    map.current?.setCenter(coordinates);
    marker.current?.setPosition(coordinates);
  }, [coordinates.lat, coordinates.lng]);

  return <div className="relative h-80 bg-gray-100 dark:bg-slate-800">
    <div ref={element} className="h-full w-full" role="application" aria-label="Konum seçmek için haritaya tıklayın veya işareti sürükleyin" />
    {error && <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-red-700 bg-red-50">{error} Google Cloud'da Maps JavaScript API'yi etkinleştirin.</div>}
  </div>;
};

export default GoogleMapPicker;
