'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react'
import mapboxgl, { Marker, Popup } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { createClient } from '@supabase/supabase-js'
import { Root, createRoot } from 'react-dom/client'
import Header from './components/Header'
import { MapPin, Table2, Beer, ExternalLink, ThumbsUp, X } from 'lucide-react'

// Ensure the Mapbox access token is set.
if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
  throw new Error("Mapbox token is not set in environment variables.");
}
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Define the type for a bar object for better type safety
interface Bar {
  id: number;
  name: string;
  address: string;
  lat: number;
  long: number;
  num_tables: number;
  guinness: boolean;
  live_table: boolean;
  z?: string; // Website URL is optional
  free_pool_monday?: boolean;
  free_pool_tuesday?: boolean;
  free_pool_wednesday?: boolean;
  free_pool_thursday?: boolean;
  free_pool_friday?: boolean;
  free_pool_saturday?: boolean;
  free_pool_sunday?: boolean;
  [key: string]: any; // Allow for dynamic property access
}


// Popup content component
function PopupContent({ bar, votes, onVote, onClose }: { bar: Bar, votes: number, onVote: () => void, onClose: () => void }) {
  const freePoolDays = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
    .filter(day => bar[`free_pool_${day}`])
  const isLive = bar.live_table === true

  return (
    <div className={`max-w-[260px] p-4 space-y-3 text-sm bg-white rounded-xl shadow-lg font-sans ${isLive ? 'ring-4 ring-red-500' : 'ring-1 ring-gray-300'}`}>
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
        <div className="font-semibold text-lg break-words">{isLive ? '📣' : '🎱'} {bar.name}</div>
        {isLive && (
          <div className="text-red-600 font-bold text-sm flex items-center gap-1">
            📍 Live table tonight!
          </div>
        )}
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bar.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-700"
          >{bar.address}</a>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Table2 className="w-4 h-4" /> <span>{bar.num_tables ?? '?'} tables</span>
        </div>
        {bar.guinness && (
          <div className="flex items-center gap-2 text-green-700">
            <Beer className="w-4 h-4" /> <span>Guinness on draft</span>
          </div>
        )}
        {freePoolDays.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {freePoolDays.map(day => (
              <span key={day} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full capitalize">
                {day}
              </span>
            ))}
          </div>
        )}
        {bar.z && (
          <a href={bar.z} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
            Visit Website <ExternalLink className="w-4 h-4" />
          </a>
        )}
        <button
          onClick={onVote}
          className="w-full mt-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-3 py-2 rounded-lg"
        >
          <ThumbsUp className="w-4 h-4" /> Upvote <span className="ml-1 bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs">{votes}</span>
        </button>
    </div>
  )
}

// Main page component
export default function HomePage() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

  // State
  const [bars, setBars] = useState<Bar[]>([])
  const [votes, setVotes] = useState<Record<string, number>>({})
  const [filter, setFilter] = useState<string>('')
  const [tableFilter, setTableFilter] = useState<string>('')
  const [guinnessFilter, setGuinnessFilter] = useState<boolean>(false)
  const [showFreePoolTonightOnly, setShowFreePoolTonightOnly] = useState<boolean>(false)
  const [liveTableOnly, setLiveTableOnly] = useState<boolean>(false)
  const [mobileOpen, setMobileOpen] = useState<boolean>(false)
  const [showList, setShowList] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeBarId, setActiveBarId] = useState<number | null>(null);
  const [barsInView, setBarsInView] = useState<Bar[]>([]);
  const [barToSelect, setBarToSelect] = useState<Bar | null>(null);

  // Refs
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const markerRefs = useRef<Record<string, mapboxgl.Marker>>({})
  const popupRootRefs = useRef<Record<string, Root>>({})
  const activePopupRef = useRef<mapboxgl.Popup | null>(null);
  const barsRef = useRef(bars);
  barsRef.current = bars;

  // Memoized filtered bars list
  const filteredBars = useMemo(() => {
    return bars.filter(bar => {
      const nameMatch = bar.name.toLowerCase().includes(filter.toLowerCase());
      const tblMatch = tableFilter === '' ? true : tableFilter === '3+' ? bar.num_tables >= 3 : bar.num_tables === +tableFilter;
      const guinMatch = !guinnessFilter || bar.guinness;
      const freeMatch = !showFreePoolTonightOnly || bar[`free_pool_${today}`];
      const liveMatch = !liveTableOnly || bar.live_table;
      return nameMatch && tblMatch && guinMatch && freeMatch && liveMatch;
    });
  }, [bars, filter, tableFilter, guinnessFilter, showFreePoolTonightOnly, liveTableOnly, today]);

  // Fetch data from Supabase
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      supabase.from('bars').select('*'),
      supabase.from('votes').select('*')
    ]).then(([{ data: barsData, error: barsError }, { data: votesData, error: votesError }]) => {
      if (barsError) console.error('Error fetching bars:', barsError);
      else setBars(barsData as Bar[] || []);

      if (votesError) console.error('Error fetching votes:', votesError);
      else {
        const counts: Record<string, number> = {};
        votesData?.forEach(r => (counts[r.bar_name] = r.count));
        setVotes(counts);
      }
      setIsLoading(false);
    });
  }, []);

  // Initialize map and event listeners
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-122.431297, 37.773972],
      zoom: 12,
    });
    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  // Render markers and handle popups
  useEffect(() => {
    const map = mapRef.current;
    if (!map || isLoading) return;

    Object.values(markerRefs.current).forEach(m => m.remove());
    markerRefs.current = {};

    filteredBars.forEach(bar => {
      if (typeof bar.lat !== 'number' || typeof bar.long !== 'number') return;
      
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.cursor = 'pointer';
      el.style.fontSize = '24px';
      el.innerHTML = bar.live_table ? '📣' : '🎱';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([bar.long, bar.lat])
        .addTo(map);
      
      markerRefs.current[bar.id] = marker;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setActiveBarId(prevId => prevId === bar.id ? null : bar.id);
      });
    });

    if (activePopupRef.current) {
        activePopupRef.current.remove();
        activePopupRef.current = null;
    }

    if (activeBarId) {
        const activeBar = bars.find(b => b.id === activeBarId);
        if (activeBar) {
            const popupNode = document.createElement('div');
            if (!popupRootRefs.current[activeBar.id]) {
                popupRootRefs.current[activeBar.id] = createRoot(popupNode);
            }

            const popup = new mapboxgl.Popup({ closeButton: false, offset: 25 })
                .setLngLat([activeBar.long, activeBar.lat])
                .setDOMContent(popupNode)
                .addTo(map);
            
            activePopupRef.current = popup;

            popupRootRefs.current[activeBar.id].render(
                <PopupContent bar={activeBar} votes={votes[activeBar.name] || 0} onVote={() => voteBar(activeBar.name)} onClose={() => setActiveBarId(null)} />
            );

            const currentZoom = map.getZoom();
            const targetZoom = Math.max(currentZoom, 14);
            map.flyTo({
                center: [activeBar.long, activeBar.lat],
                zoom: targetZoom,
                duration: 1200,
                padding: { top: 300 } 
            });
        }
    }

  }, [filteredBars, activeBarId, isLoading]);

  // Update bars in view when map moves
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateBarsInView = () => {
        const bounds = map.getBounds();
        if (bounds) {
            const visibleBars = filteredBars.filter(bar => 
                bounds.contains([bar.long, bar.lat])
            );
            setBarsInView(visibleBars);
        }
    };
    
    map.on('moveend', updateBarsInView);
    map.on('load', updateBarsInView);

    return () => {
        map.off('moveend', updateBarsInView);
        map.off('load', updateBarsInView);
    };
  }, [filteredBars]);

  // Handle voting for a bar
  const voteBar = async (barName: string) => {
    if (localStorage.getItem(`voted_${barName}`)) {
        console.log('Already voted for this bar.');
        return;
    }
    const { error } = await supabase.rpc('increment_vote', { bar: barName });
    if (error) {
        console.error('Failed to vote:', error);
        return;
    }
    setVotes(v => ({ ...v, [barName]: (v[barName] || 0) + 1 }));
    localStorage.setItem(`voted_${barName}`, 'true');
  }

  return (
    <>
      <style>{`
        .mapboxgl-popup-tip {
          display: none !important;
        }
        .mapboxgl-popup-content {
          padding: 0;
          background: transparent;
          box-shadow: none;
        }
      `}</style>
      <div className="relative z-50">
        <Header
          filter={filter}
          onFilterChange={setFilter}
          tableFilter={tableFilter}
          onTableFilterChange={setTableFilter}
          guinnessFilter={guinnessFilter}
          onGuinnessFilterChange={setGuinnessFilter}
          freePoolTonightOnly={showFreePoolTonightOnly}
          onFreePoolTonightToggle={setShowFreePoolTonightOnly}
          liveTableOnly={liveTableOnly}
          onLiveTableToggle={setLiveTableOnly}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          setShowList={setShowList}
        >
          <button
            className="flex-shrink-0 text-xs px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 shadow"
            onClick={() => setShowList(!showList)}
          >
            {showList ? 'Hide List' : 'Show List'}
          </button>
        </Header>
      </div>

      <div className={`fixed top-28 md:top-40 right-4 h-[calc(100vh-8rem)] md:h-[calc(100vh-11rem)] w-80 bg-white rounded-xl shadow-lg z-40 transform transition-transform duration-300 ${
        showList ? 'translate-x-0' : 'translate-x-[calc(100%+1rem)]'
      }`}>
        <ul className="overflow-y-auto h-full p-4 space-y-4">
          {(filter ? filteredBars : barsInView)
            .map(bar => {
              const isSelected = activeBarId === bar.id;
              const isLive = bar.live_table;
              return (
                <li
                  key={bar.id}
                  className={`bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-all cursor-pointer ${isLive ? 'ring-2 ring-red-500' : ''} ${isSelected ? 'ring-4 ring-blue-500' : ''}`}
                  onClick={() => setActiveBarId(bar.id)}
                >
                  <div className="font-semibold">{bar.name}</div>
                  {/* ✅ FIX: Added "Live table tonight!" text for live bars in the sidebar */}
                  {isLive && (
                    <div className="text-red-600 font-bold text-xs flex items-center gap-1 mt-1">
                      📍 Live table tonight!
                    </div>
                  )}
                  <div className="text-xs text-gray-500 my-2">{bar.address}</div>
                  <div className="flex items-center text-xs text-gray-700 gap-3">
                    <span className="flex items-center gap-1"><Table2 className="w-4 h-4" />{' '}{bar.num_tables ?? '?'} tables</span>
                    {bar.guinness && <span className="flex items-center gap-1 text-green-700"><Beer className="w-4 h-4" /> Guinness</span>}
                  </div>
                </li>
              )
            })}
        </ul>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-white flex items-center justify-center z-[100]">
          <div className="text-gray-700 text-2xl font-semibold animate-pulse">Racking 'em up...</div>
        </div>
      )}

      <div ref={mapContainerRef} className="w-full h-screen" />

      <a
        href="https://forms.gle/RgaPjc3eYhankmUg8"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 left-4 z-50 inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600"
      >
        + Register Bar
      </a>
    </>
  )
}
