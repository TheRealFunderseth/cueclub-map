'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { createClient } from '@supabase/supabase-js';
import { createRoot } from 'react-dom/client';
import { MapPin, Beer, Table2, ExternalLink, ThumbsUp, X } from 'lucide-react';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function PopupContent({ bar, votes, onVote, onClose }: any) {
  const freePoolDays = [
    'monday','tuesday','wednesday','thursday','friday','saturday','sunday'
  ].filter(day => bar[`free_pool_${day}`]);
  const isLiveTable = bar.live_table === true;

  return (
    <div className="relative">
      {isLiveTable && (
        <div className="absolute inset-0 rounded-xl ring-4 ring-red-600 z-30 pointer-events-none" />
      )}
      <div className={`relative z-10 max-w-[260px] p-4 space-y-3 text-sm text-gray-800 bg-white rounded-xl border ${isLiveTable ? 'border-red-600' : 'border-transparent'}`}>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
        <div className={`flex items-start gap-2 pr-6 font-semibold leading-tight ${bar.name.length > 22 ? 'text-base' : 'text-lg'}`}>
          🎱 <span className="break-words">{bar.name}</span>
        </div>
        {isLiveTable && (
          <div className="text-red-600 font-bold text-sm">📍 Live table tonight @ 8p!</div>
        )}
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="w-4 h-4 mt-0.5" />
          <span>{bar.address}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Table2 className="w-4 h-4" />
          <span>{bar.num_tables ?? '?'} tables</span>
        </div>
        {bar.guinness && (
          <div className="flex items-center gap-2 text-green-700">
            <Beer className="w-4 h-4" />
            <span>Guinness on draft</span>
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
          <a
            href={bar.z}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
          >
            Visit Website <ExternalLink className="w-4 h-4" />
          </a>
        )}
        <button
          onClick={onVote}
          className="w-full mt-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-3 py-2 rounded-lg transition"
        >
          <ThumbsUp className="w-4 h-4" />
          Upvote <span className="ml-1 bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs">{votes}</span>
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  const [bars, setBars] = useState<any[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [guinnessFilter, setGuinnessFilter] = useState('');
  const [showFreePoolTonightOnly, setShowFreePoolTonightOnly] = useState(false);
  const [liveTableOnly, setLiveTableOnly] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showList, setShowList] = useState(false);
  const [selectedBar, setSelectedBar] = useState<any | null>(null);

  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  // fetch bars + votes
  useEffect(() => {
    supabase.from('bars').select('*')
      .then(({ data, error }) => error ? console.error(error) : setBars(data!));
    supabase.from('votes').select('*')
      .then(({ data, error }) => {
        if (error) return console.error(error);
        const m: Record<string, number> = {};
        data!.forEach(r => m[r.bar_name] = r.count);
        setVotes(m);
      });
  }, []);

  // render markers
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    document.querySelectorAll('.marker').forEach(el => el.remove());

    bars
      .filter(bar => {
        const nameMatch = bar.name.toLowerCase().includes(filter.toLowerCase());
        const tblMatch = tableFilter === '' ||
          (tableFilter === '3+' ? bar.num_tables >= 3 : bar.num_tables === +tableFilter);
        const guinMatch = guinnessFilter === '' ||
          (guinnessFilter === 'yes' ? bar.guinness : !bar.guinness);
        const freeTonightMatch = !showFreePoolTonightOnly || bar[`free_pool_${today}`] === true;
        const liveMatch = !liveTableOnly || bar.live_table === true;
        return nameMatch && tblMatch && guinMatch && freeTonightMatch && liveMatch;
      })
      .forEach(bar => {
        if (typeof bar.lat !== 'number' || typeof bar.long !== 'number') return;
        const el = document.createElement('div');
        el.className = 'marker';
        el.innerHTML = bar.live_table ? '📣' : '🎱';
        el.style.fontSize = '24px';
        el.style.cursor = 'pointer';

        const popupNode = document.createElement('div');
        const popup = new mapboxgl.Popup({ closeButton: false }).setDOMContent(popupNode);

        new mapboxgl.Marker(el)
          .setLngLat([bar.long, bar.lat])
          .setPopup(popup)
          .addTo(map);

        el.addEventListener('click', () => {
          const zoom = map.getZoom();
          const offset = 100 / Math.pow(2, zoom - 12);
          const pt = map.project([bar.long, bar.lat]);
          pt.y -= offset;
          map.easeTo({
            center: map.unproject(pt),
            zoom: 13,
            duration: 400
          });

          let root: any = (popupNode as any)._reactRoot;
          if (!root) {
            root = createRoot(popupNode);
            (popupNode as any)._reactRoot = root;
          }
          root.render(<PopupContent bar={bar} votes={votes[bar.name] || 0}
            onVote={() => voteBar(bar.name)} onClose={() => popup.remove()} />);
        });
      });
  }, [
    bars, votes, filter, tableFilter, guinnessFilter,
    showFreePoolTonightOnly, liveTableOnly, today
  ]);

  // initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-122.431297, 37.773972],
      zoom: 12
    });
    mapRef.current = map;
    map.on('error', e => console.error(e));
    return () => map.remove();
  }, []);

  const voteBar = async (barName: string) => {
    if (localStorage.getItem(`voted_${barName}`)) {
      return alert('Already voted!');
    }
    const { error } = await supabase.rpc('increment_vote', { bar: barName });
    if (error) return alert('Failed to vote!');
    setVotes(v => ({ ...v, [barName]: (v[barName] || 0) + 1 }));
    localStorage.setItem(`voted_${barName}`, 'true');
  };

  return (
    <>
      {/* HEADER */}
      <div className="absolute z-10 top-4 left-4 right-4 bg-white bg-opacity-80 backdrop-blur-sm px-4 py-3 rounded-xl shadow">
        {/* Row 1: logo + mobile toggle + desktop search */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/cueclublogo.png" alt="Cue Club logo" className="w-14 h-14" />
            <div>
              <div className="text-xl font-bold">Cue Club</div>
              <div className="text-sm text-gray-600">The best pool bars in San Francisco</div>
            </div>
          </div>
          <button
            className="md:hidden px-3 py-1.5 bg-blue-600 text-white rounded-md"
            onClick={() => setMobileOpen(o => !o)}
          >
            {mobileOpen ? 'Close ▲' : 'Filters ▼'}
          </button>
          <div className="hidden md:block w-64">
            <input
              type="text"
              placeholder="Search bars…"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Row 2: filters & list toggle */}
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <select
            value={tableFilter}
            onChange={e => setTableFilter(e.target.value)}
            className="h-9 px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
          >
            <option value="">No. of Tables</option>
            <option value="1">1 Table</option>
            <option value="2">2 Tables</option>
            <option value="3+">3+ Tables</option>
          </select>

          <div className="flex items-center gap-2">
            <span>📣 Live table</span>
            <button
              onClick={() => setLiveTableOnly(v => !v)}
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                liveTableOnly ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                liveTableOnly ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span>🍺 Guinness</span>
            <button
              onClick={() => setGuinnessFilter(f => (f === 'yes' ? '' : 'yes'))}
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                guinnessFilter === 'yes' ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                guinnessFilter === 'yes' ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span>🎯 Free pool tonight</span>
            <button
              onClick={() => setShowFreePoolTonightOnly(v => !v)}
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                showFreePoolTonightOnly ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                showFreePoolTonightOnly ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Bars list toggle at far right */}
          <div className="ml-auto">
            <button
              onClick={() => { setShowList(open => !open); setSelectedBar(null); }}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-md shadow text-sm font-medium"
            >
              ≡ Bars
            </button>
          </div>
        </div>
      </div>

{/* RIGHT-SIDEBAR */}
<div
  className={`
    fixed top-0 right-0 h-full w-80 bg-white shadow-lg z-20
    transform transition-transform duration-300
    ${showList ? 'translate-x-0' : 'translate-x-full'}
  `}
>
  {/* header */}
  <div className="px-4 py-3 border-b flex justify-between items-center">
    <h2 className="text-xl font-bold">
      {selectedBar ? selectedBar.name : 'All Bars'}
    </h2>
    <button
      onClick={() =>
        selectedBar ? setSelectedBar(null) : setShowList(false)
      }
      className="text-gray-500 hover:text-gray-700"
    >
      <X className="w-6 h-6" />
    </button>
  </div>

  {selectedBar ? (
    <div className="p-4 overflow-auto space-y-6 h-full">
      {/* ‣ Name */}
      <div className="text-2xl font-bold">{selectedBar.name}</div>
      {/* ‣ Address */}
      <div className="flex items-center text-gray-700">
        <MapPin className="w-5 h-5 mr-2" />
        {selectedBar.address}
      </div>
      {/* ‣ Tables */}
      <div className="flex items-center text-gray-700">
        <Table2 className="w-5 h-5 mr-2" />
        <strong>{selectedBar.num_tables ?? '?'}</strong> tables
      </div>
      {/* ‣ Guinness */}
      <div className="flex items-center">
        <Beer className="w-5 h-5 mr-2" />
        {selectedBar.guinness
          ? <span className="font-semibold text-green-700">On draft</span>
          : <span className="text-gray-500">None</span>}
      </div>
      {/* ‣ Free-pool days */}
      <div>
        <h3 className="font-semibold text-gray-600 mb-1">Free pool days</h3>
        <div className="flex flex-wrap gap-2">
          {['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
            .filter(d => selectedBar[`free_pool_${d}`])
            .map(day => (
              <span
                key={day}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full capitalize"
              >
                {day}
              </span>
            ))}
        </div>
      </div>
      {/* ‣ Website */}
      {selectedBar.z && (
        <a
          href={selectedBar.z}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
        >
          <ExternalLink className="w-5 h-5" />
          Visit website
        </a>
      )}
      {/* ‣ Upvote */}
      <button
        onClick={() => voteBar(selectedBar.name)}
        className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-3 py-2 rounded-lg transition"
      >
        <ThumbsUp className="w-5 h-5" /> Upvote
        <span className="ml-1 bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs">
          {votes[selectedBar.name] || 0}
        </span>
      </button>
    </div>
  ) : (
    <ul className="overflow-auto h-full p-4 space-y-4">
      {bars.map(bar => (
        <li
          key={bar.id ?? bar.name}
          className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => {
            // 1) fly to it
            mapRef.current?.flyTo({
              center: [bar.long, bar.lat],
              zoom: 13,
              duration: 400
            });
            // 2) show only this bar
            setSelectedBar(bar);
            setShowList(true);
          }}
        >
          <div className="font-semibold">{bar.name}</div>
          <div className="text-xs text-gray-500 mb-2">{bar.address}</div>
          <div className="flex items-center text-xs text-gray-700 gap-3">
            <span className="flex items-center gap-1">
              <Table2 className="w-4 h-4" /> {bar.num_tables} tables
            </span>
            {bar.guinness && (
              <span className="flex items-center gap-1 text-green-700">
                <Beer className="w-4 h-4" /> Guinness
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mt-2 text-[10px]">
            {['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
              .filter(d => bar[`free_pool_${d}`])
              .map(day => (
                <span
                  key={day}
                  className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full capitalize"
                >
                  {day}
                </span>
              ))}
          </div>
        </li>
      ))}
    </ul>
  )}
</div>

      {/* MAP */}
      <div ref={mapContainerRef} className="w-full h-screen" />

      {/* FOOTER */}
      <div className="fixed bottom-[1cm] right-4 z-30">
        <a
          href="https://forms.gle/scXknFS944K3pHC18"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-bold px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md shadow-lg drop-shadow-lg"
        >
          + register a new bar
        </a>
      </div>
    </>
  );
}
