'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react'
import { createRoot, Root } from 'react-dom/client';
import { MapPin, Table2, Beer, ExternalLink, ThumbsUp, X, List, Menu } from 'lucide-react'

// Import libraries directly from NPM packages
import mapboxgl from 'mapbox-gl';
import { createClient } from '@supabase/supabase-js';

// --- Type Definitions ---
interface Bar {
  id: number;
  name: string;
  address: string;
  lat: number;
  long: number;
  num_tables: number;
  guinness: boolean;
  live_table: boolean;
  z?: string;
  free_pool_monday?: boolean;
  free_pool_tuesday?: boolean;
  free_pool_wednesday?: boolean;
  free_pool_thursday?: boolean;
  free_pool_friday?: boolean;
  free_pool_saturday?: boolean;
  free_pool_sunday?: boolean;
  [key: string]: any;
}

interface Vote {
    bar_name: string;
    count: number;
}

// --- Reusable Toggle Switch Component ---
function ToggleSwitch({ label, checked, onChange }: { label: string, checked: boolean, onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
      <div className="relative">
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'transform translate-x-4' : ''}`}></div>
      </div>
      <span>{label}</span>
    </label>
  );
}


// --- Sub-Components ---
function Header({
  filter, onFilterChange,
  tableFilter, onTableFilterChange,
  guinnessFilter, onGuinnessFilterChange,
  freePoolTonightOnly, onFreePoolTonightToggle,
  liveTableOnly, onLiveTableToggle,
  setShowList,
  children,
  headerRef
}: {
  filter: string, onFilterChange: (val: string) => void,
  tableFilter: string, onTableFilterChange: (val: string) => void,
  guinnessFilter: boolean, onGuinnessFilterChange: (val: boolean) => void,
  freePoolTonightOnly: boolean, onFreePoolTonightToggle: (val: boolean) => void,
  liveTableOnly: boolean, onLiveTableToggle: (val: boolean) => void,
  mobileOpen: boolean, setMobileOpen: (val: boolean) => void,
  setShowList: (val: boolean | ((s: boolean) => boolean)) => void,
  children: React.ReactNode,
  headerRef: React.RefObject<HTMLElement>
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header ref={headerRef} className="bg-white p-4 shadow-lg relative z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/cueclublogo.png" alt="Cue Club SF Logo" className="h-20 w-20" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Cue Club SF</h1>
            <p className="text-sm text-gray-500">The best pool bars in San Francisco</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              id="search-bar-name-desktop"
              name="search-bar-name-desktop"
              placeholder="Search by name..."
              value={filter}
              onChange={(e) => onFilterChange(e.target.value)}
              onFocus={() => setShowList(true)}
              className="p-2 border rounded-md w-48 text-sm"
            />
            {filter && (
              <button onClick={() => onFilterChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {children}
        </div>
        
        <div className="md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-md hover:bg-gray-100">
                <Menu className="w-6 h-6 text-gray-700" />
            </button>
        </div>
      </div>

      <div className="hidden md:flex mt-4 flex-wrap items-center gap-x-6 gap-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <span>No. of tables</span>
          <select value={tableFilter} onChange={e => onTableFilterChange(e.target.value)} className="p-2 border rounded-md text-sm">
            <option value="">Any</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3+">3+</option>
          </select>
        </div>
        <ToggleSwitch label="Live table tonight" checked={liveTableOnly} onChange={onLiveTableToggle} />
        <ToggleSwitch label="Guinness on draft" checked={guinnessFilter} onChange={onGuinnessFilterChange} />
        <ToggleSwitch label="Free pool tonight" checked={freePoolTonightOnly} onChange={onFreePoolTonightToggle} />
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden mt-4 border-t pt-4">
            <div className="flex flex-col gap-4">
                <div className="relative">
                    <input
                      type="text"
                      id="search-bar-name-mobile"
                      name="search-bar-name-mobile"
                      placeholder="Search by name..."
                      value={filter}
                      onChange={(e) => onFilterChange(e.target.value)}
                      onFocus={() => setShowList(true)}
                      className="p-2 border rounded-md w-full text-sm"
                    />
                    {filter && (
                      <button onClick={() => onFilterChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <span>No. of tables</span>
                  <select value={tableFilter} onChange={e => onTableFilterChange(e.target.value)} className="p-2 border rounded-md text-sm">
                    <option value="">Any</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3+">3+</option>
                  </select>
                </div>
                <ToggleSwitch label="Live table tonight" checked={liveTableOnly} onChange={onLiveTableToggle} />
                <ToggleSwitch label="Guinness on draft" checked={guinnessFilter} onChange={onGuinnessFilterChange} />
                <ToggleSwitch label="Free pool tonight" checked={freePoolTonightOnly} onChange={onFreePoolTonightToggle} />
                <div className="mt-2">{children}</div>
            </div>
        </div>
      )}
    </header>
  );
}

function PopupContent({ bar, votes, onVote, onClose }: { bar: Bar, votes: number, onVote: () => void, onClose: () => void }) {
  const freePoolDays = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
    .filter(day => bar[`free_pool_${day}`]);
  const isLive = bar.live_table === true;

  return (
    <div className={`max-w-[260px] p-4 space-y-3 text-sm bg-white rounded-xl shadow-lg font-sans ${isLive ? 'ring-4 ring-red-500' : 'ring-1 ring-gray-300'}`}>
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 z-10">
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
  );
}

// --- Main Page Component ---
export default function HomePage() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  // --- State Management ---
  const [isLoading, setIsLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [supabase, setSupabase] = useState<any>(null);
  const [bars, setBars] = useState<Bar[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<string>('');
  const [tableFilter, setTableFilter] = useState<string>('');
  const [guinnessFilter, setGuinnessFilter] = useState<boolean>(false);
  const [showFreePoolTonightOnly, setShowFreePoolTonightOnly] = useState<boolean>(false);
  const [liveTableOnly, setLiveTableOnly] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [showList, setShowList] = useState(true);
  const [barsInView, setBarsInView] = useState<Bar[]>([]);
  const [activeBarId, setActiveBarId] = useState<number | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  // --- Refs for Imperative APIs ---
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const headerRef = useRef<HTMLElement>(null);
  const popupRef = useRef<any>(null);
  const popupRootRef = useRef<Root | null>(null);


  // --- Memoized Filtering Logic ---
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

  // --- ROBUST INITIALIZATION EFFECT ---
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const supabaseClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        setSupabase(supabaseClient);

        const barsResponse = await supabaseClient.from('bars').select('*');
        if (barsResponse.error) throw barsResponse.error;
        
        const votesResponse = await supabaseClient.from('votes').select('*');
        if (votesResponse.error) throw votesResponse.error;

        setBars(barsResponse.data as Bar[] || []);
        const voteCounts: Record<string, number> = {};
        (votesResponse.data as Vote[])?.forEach((r: Vote) => (voteCounts[r.bar_name] = r.count));
        setVotes(voteCounts);

        if (mapContainerRef.current) {
          mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
          const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [-122.431297, 37.773972],
            zoom: 12,
          });
          mapRef.current = map;

          popupRef.current = new mapboxgl.Popup({ 
            closeButton: false, 
            offset: 30,
            anchor: 'bottom' 
          });

          map.addControl(new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserHeading: true
          }));
        }

      } catch (error: any) {
        console.error("Failed to initialize the application:", error);
        setInitializationError(error.message || "An unknown error occurred during startup.");
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // --- Layout Effect for Header Height ---
  useEffect(() => {
    if (window.innerWidth < 768) {
        setShowList(false);
    }
    const updateHeaderHeight = () => {
        if (headerRef.current) {
            setHeaderHeight(headerRef.current.offsetHeight);
        }
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);


  // --- Map Viewport Update Effect ---
  useEffect(() => {
    if (isLoading || initializationError || !mapRef.current) return;

    const map = mapRef.current;
    const updateBarsInView = () => {
        const bounds = map.getBounds();
        const visibleBars = filteredBars.filter(bar => 
            bounds.contains([bar.long, bar.lat])
        );
        setBarsInView(visibleBars);
    };
    
    map.on('moveend', updateBarsInView);
    if (map.isStyleLoaded()) {
      updateBarsInView();
    } else {
      map.on('load', updateBarsInView);
    }

    return () => {
        if(map.getStyle()) {
            map.off('moveend', updateBarsInView);
            map.off('load', updateBarsInView);
        }
    };
  }, [isLoading, initializationError, filteredBars]);

  // --- Event Handlers ---
  const handleVote = async (barName: string) => {
    if (!supabase) return;
    if (localStorage.getItem(`voted_${barName}`)) return;
    
    await supabase.rpc('increment_vote', { bar: barName });
    setVotes(v => ({ ...v, [barName]: (v[barName] || 0) + 1 }));
    localStorage.setItem(`voted_${barName}`, 'true');
  }

  const voteBar = (barName: string) => {
    handleVote(barName);
  };

  const showPopup = (bar: Bar) => {
    const map = mapRef.current;
    const popup = popupRef.current;
    if (!map || !popup || !bar) return;

    if (popupRootRef.current) {
        popupRootRef.current.unmount();
    }

    const popupNode = document.createElement('div');
    popupRootRef.current = createRoot(popupNode);

    popupRootRef.current.render(
        <PopupContent 
          bar={bar} 
          votes={votes[bar.name] || 0} 
          onVote={() => voteBar(bar.name)} 
          onClose={() => {
            popup.remove();
            setActiveBarId(null);
          }}
        />
    );

    popup
        .setLngLat([bar.long, bar.lat])
        .setDOMContent(popupNode)
        .addTo(map);

    const currentZoom = map.getZoom();
    const targetZoom = Math.max(currentZoom, 14);
    
    const isMobile = window.innerWidth < 768;
    const flyToPadding = {
        top: isMobile ? headerHeight + 20 : 0,
        bottom: 0,
        left: 0,
        right: !isMobile && showList ? 320 : 0
    };

    map.flyTo({
        center: [bar.long, bar.lat],
        zoom: targetZoom,
        duration: 1200,
        padding: flyToPadding
    });
  };

  const handleMarkerClick = (bar: Bar) => {
    if (activeBarId === bar.id) {
      popupRef.current.remove();
      setActiveBarId(null);
    } else {
      showPopup(bar);
      setActiveBarId(bar.id);
    }
  };

  // --- Marker Management Effect ---
  useEffect(() => {
    if (isLoading || initializationError || !mapRef.current) return;
    const map = mapRef.current;

    Object.keys(markersRef.current).forEach(markerId => {
      if (!filteredBars.some(bar => bar.id === +markerId)) {
        markersRef.current[markerId].remove();
        delete markersRef.current[markerId];
      }
    });

    filteredBars.forEach(bar => {
      if (markersRef.current[bar.id]) {
        markersRef.current[bar.id].getElement().innerHTML = bar.live_table ? '📣' : '🎱';
        return;
      }
      
      if (typeof bar.lat !== 'number' || typeof bar.long !== 'number') return;
      
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.cursor = 'pointer';
      el.style.fontSize = '24px';
      el.innerHTML = bar.live_table ? '📣' : '🎱';

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        handleMarkerClick(bar);
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([bar.long, bar.lat])
        .addTo(map);
      
      markersRef.current[bar.id] = marker;
    });

  }, [isLoading, initializationError, filteredBars]);


  // --- Sidebar Sorting Logic ---
  const barsToDisplay = filter ? filteredBars : barsInView;
  const sortedBarsToDisplay = useMemo(() => {
    if (!activeBarId) {
        return barsToDisplay;
    }
    const selectedBar = barsToDisplay.find(bar => bar.id === activeBarId);
    if (!selectedBar) {
        return barsToDisplay;
    }
    const otherBars = barsToDisplay.filter(bar => bar.id !== activeBarId);
    return [selectedBar, ...otherBars];
  }, [barsToDisplay, activeBarId]);


  // --- Render Logic ---
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col">
      <style>{`
        .mapboxgl-popup-tip { display: none !important; }
        .mapboxgl-popup-content { padding: 0; background: transparent; box-shadow: none; }
      `}</style>
      
        <Header
          headerRef={headerRef}
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
            className="flex-shrink-0 text-sm font-medium px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 shadow-sm flex items-center gap-2"
            onClick={() => setShowList(s => !s)}
          >
            <List className="w-4 h-4" />
            <span>{showList ? 'Hide List' : 'Show List'}</span>
          </button>
        </Header>

      <main className="flex-grow relative">
        {isLoading ? (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="text-gray-700 text-2xl font-semibold animate-pulse">Racking 'em up...</div>
          </div>
        ) : initializationError ? (
          <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-[100] p-4">
            <div className="text-center">
              <h2 className="text-xl font-bold text-red-700 mb-2">Application Error</h2>
              <p className="text-red-600">{initializationError}</p>
              <p className="text-gray-500 mt-2">Please check that the required scripts are included in your HTML file and are not being blocked.</p>
            </div>
          </div>
        ) : (
          <>
            <div 
              className={`fixed right-4 w-80 bg-white rounded-xl shadow-lg z-40 transform transition-transform duration-300 ${
                showList ? 'translate-x-0' : 'translate-x-[calc(100%+1rem)]'
              }`}
              style={{
                  top: headerHeight ? `${headerHeight + 16}px` : '10rem',
                  height: headerHeight ? `calc(100vh - ${headerHeight + 32}px)` : 'calc(100vh - 12rem)'
              }}
            >
              <ul className="overflow-y-auto h-full p-4 space-y-4">
                {sortedBarsToDisplay.length > 0 ? (
                  sortedBarsToDisplay.map(bar => {
                    const isSelected = activeBarId === bar.id;
                    const isLive = bar.live_table;
                    
                    let ringClass = '';
                    if (isSelected) {
                        ringClass = isLive ? 'ring-4 ring-red-500' : 'ring-4 ring-blue-500';
                    } else if (isLive) {
                        ringClass = 'ring-2 ring-red-400';
                    }

                    return (
                      <li
                        key={bar.id}
                        className={`bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:bg-gray-50 transition-all cursor-pointer ${ringClass}`}
                        onClick={() => handleMarkerClick(bar)}
                      >
                        <div className="font-semibold">{bar.name}</div>
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
                  })
                ) : (
                    <div className="text-center text-gray-500 p-8">
                        <p>No bars match your current filters.</p>
                    </div>
                )}
              </ul>
            </div>
            <div ref={mapContainerRef} className="w-full h-full" />
          </>
        )}
      </main>

      <a
        href="https://forms.gle/RgaPjc3eYhankmUg8"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 md:bottom-4 left-4 z-50 inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-md shadow-sm text-white bg-orange-700 hover:bg-orange-800"
      >
        + Register Bar
      </a>
    </div>
  )
}
