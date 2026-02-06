
import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation, Loader2, Map as MapIcon, Globe, Sparkles } from 'lucide-react';
import L from 'leaflet';
import { db } from '../db';

interface Place {
  id: string | number;
  name: string;
  category: string;
  lat: number;
  lng: number;
  isAI?: boolean;
}

const PLACES_DATA: Place[] = [
  { id: 1, name: 'রাজবাড়ী সদর হাসপাতাল', category: 'hospital', lat: 23.7635, lng: 89.6468 },
  { id: 2, name: 'রাজবাড়ী সদর থানা', category: 'police', lat: 23.7588, lng: 89.6495 },
  { id: 3, name: 'রাজবাড়ী ফায়ার সার্ভিস', category: 'emergency', lat: 23.7542, lng: 89.6550 },
];

const MapView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [aiPlaces, setAiPlaces] = useState<Place[]>([]);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance) return;
    const rajbariCenter: [number, number] = [23.7571, 89.6508];
    const map = L.map(mapRef.current, { center: rajbariCenter, zoom: 13, zoomControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    setMapInstance(map);
    setLoading(false);
    return () => { map.remove(); };
  }, []);

  useEffect(() => {
    if (!mapInstance || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();
    const allPlaces = [...PLACES_DATA, ...aiPlaces];
    
    allPlaces.forEach(place => {
      L.marker([place.lat, place.lng])
        .bindPopup(`<b style="font-family: 'Hind Siliguri'">${place.name}</b><br><small>${place.category}</small>`)
        .addTo(markersLayerRef.current!);
    });

    if (allPlaces.length > 0) {
      const bounds = L.latLngBounds(allPlaces.map(p => [p.lat, p.lng]));
      mapInstance.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [mapInstance, aiPlaces]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const response = await db.callAI({
        contents: `রাজবাড়ী জেলার "${query}" এর ভৌগোলিক স্থানাঙ্ক (Lat, Lng) বের করুন। উত্তরটি JSON অ্যারেতে দিন। ফিল্ড: name, lat, lng, category।`,
        systemInstruction: "আপনি একজন ম্যাপ স্পেশালিস্ট। কেবল JSON রিটার্ন করুন।"
      });
      const results = db.extractJSON(response.text) || [];
      setAiPlaces(results.map((r: any, idx: number) => ({ ...r, id: `ai-${idx}`, isAI: true })));
    } catch (error) {
      alert("দুঃখিত, স্থানটি খুঁজে পাওয়া যায়নি।");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="p-6 animate-slide-up pb-32">
      <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white mb-8 shadow-2xl">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <MapIcon className="w-8 h-8" /> ম্যাপ এক্সপ্লোরার
        </h2>
        <p className="text-xs text-indigo-100 mt-1 opacity-80 uppercase tracking-widest font-bold">Puter AI Powered Search</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden premium-shadow border border-slate-100 dark:border-slate-800 mb-8 h-[400px] relative z-10">
        {(loading || isSearching) && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 dark:bg-slate-950/80 z-20">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-indigo-300" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ম্যাপে খুঁজুন (যেমন: বাজার, স্কুল...)" 
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] py-5 pl-16 pr-8 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-lg font-medium"
          />
        </div>
      </form>
    </div>
  );
};

export default MapView;
