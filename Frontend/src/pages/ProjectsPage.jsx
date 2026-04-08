import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Leaf, Zap, Eye } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const API_BASE_URL = 'http://localhost:8000';
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
mapboxgl.accessToken = MAPBOX_TOKEN;

const STATUS_COLORS = {
  'In Progress': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Active':      'bg-[#11ccf5]/20 text-[#11ccf5] border-[#11ccf5]/30',
  'Completed':   'bg-green-500/20 text-green-400 border-green-500/30',
  'Pending':     'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

function mapProjectToUi(project) {
  let parsed = {};
  try {
    parsed = project?.description ? JSON.parse(project.description) : {};
  } catch {
    parsed = {};
  }
  const country = parsed?.country || '';
  const state = parsed?.state || '';
  const region = [state, country].filter(Boolean).join(', ') || project.description || '—';

  return {
    id: project.id,
    name: project.name,
    region,
    status: 'In Progress',
    carbon: 0,
    biodiversity: 0,
    lastUpdated: project.created_at
      ? new Date(project.created_at).toLocaleDateString()
      : '—',
  };
}

const ProjectsPage = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newStateName, setNewStateName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [mapPickerError, setMapPickerError] = useState(null);
  const [creating, setCreating] = useState(false);

  const mapPickerRef = React.useRef(null);
  const mapPickerInstanceRef = React.useRef(null);
  const markerRef = React.useRef(null);

  const statuses = ['All', 'Active', 'In Progress', 'Completed', 'Pending'];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(q) || (p.region || '').toLowerCase().includes(q);
    const matchFilter = filter === 'All' || p.status === filter;
    return matchSearch && matchFilter;
  });
  }, [projects, search, filter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setApiError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/projects`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.detail || `Request failed (${res.status})`);
        }
        const data = await res.json();
        const uiProjects = Array.isArray(data) ? data.map(mapProjectToUi) : [];
        if (!cancelled) setProjects(uiProjects);
      } catch (e) {
        if (!cancelled) setApiError(e.message || 'Failed to load projects');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isCreateOpen || !mapPickerRef.current || mapPickerInstanceRef.current) return;

    const map = new mapboxgl.Map({
      container: mapPickerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [78.9629, 22.5937],
      zoom: 3,
    });
    mapPickerInstanceRef.current = map;

    map.on('click', async (e) => {
      const lng = e.lngLat.lng;
      const lat = e.lngLat.lat;
      setSelectedCoords([lng, lat]);
      setMapPickerError(null);

      if (!markerRef.current) {
        markerRef.current = new mapboxgl.Marker({ color: '#11ccf5' }).setLngLat([lng, lat]).addTo(map);
      } else {
        markerRef.current.setLngLat([lng, lat]);
      }

      try {
        const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=region,place,country&access_token=${MAPBOX_TOKEN}`;
        const res = await fetch(geocodeUrl);
        const data = await res.json();
        const features = Array.isArray(data?.features) ? data.features : [];

        const countryFeature = features.find((f) => Array.isArray(f?.place_type) && f.place_type.includes('country'));
        const regionFeature = features.find((f) => Array.isArray(f?.place_type) && f.place_type.includes('region'));

        if (countryFeature?.text) setNewCountry(countryFeature.text);
        if (regionFeature?.text) setNewStateName(regionFeature.text);
      } catch {
        setMapPickerError('Could not fetch state/country from map click.');
      }
    });

    return () => {
      if (mapPickerInstanceRef.current) {
        mapPickerInstanceRef.current.remove();
        mapPickerInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isCreateOpen]);

  async function handleCreateProject(e) {
    e?.preventDefault?.();
    if (!newName.trim()) return;
    if (!newCountry.trim()) {
      setApiError('Country is required.');
      return;
    }
    if (!selectedCoords) {
      setApiError('Click on the map to pick project location.');
      return;
    }

    setCreating(true);
    setApiError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          description: JSON.stringify({
            country: newCountry.trim(),
            state: newStateName.trim() || null,
            center: selectedCoords,
            notes: newDescription.trim() || null,
          }),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail || `Create failed (${res.status})`);
      }

      // Refresh the list from the server.
      const refreshed = await fetch(`${API_BASE_URL}/api/projects`).then((r) => r.json());
      const uiProjects = Array.isArray(refreshed) ? refreshed.map(mapProjectToUi) : [];
      setProjects(uiProjects);

      setIsCreateOpen(false);
      setNewName('');
      setNewCountry('');
      setNewStateName('');
      setNewDescription('');
      setSelectedCoords(null);
    } catch (e2) {
      setApiError(e2.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex-1 p-6 h-full overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Geo Projects</h1>
          <p className="text-gray-500 text-sm mt-1">
            {loading ? 'Loading…' : `${projects.length} active restoration sites`}
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center space-x-2 px-5 py-2.5 bg-[#11ccf5] text-black rounded-xl font-bold text-sm hover:bg-[#11ccf5]/90 transition-all shadow-[0_4px_20px_rgba(17,204,245,0.3)]"
        >
          <span>+ New Project</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 flex items-center space-x-3 bg-[#05080a] border border-white/5 rounded-xl px-4 py-3">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by project name or region..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent flex-1 text-sm text-white outline-none placeholder-gray-600"
          />
        </div>
        <div className="flex gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === s
                  ? 'bg-[#11ccf5] text-black'
                  : 'bg-[#05080a] border border-white/5 text-gray-500 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-[#05080a] border border-white/5 rounded-2xl p-6 hover:border-[#11ccf5]/30 transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${STATUS_COLORS[project.status]}`}>
                {project.status}
              </span>
              <span className="text-[10px] text-gray-600">{project.lastUpdated}</span>
            </div>

            <h3 className="text-white font-black text-lg mb-1 group-hover:text-[#11ccf5] transition-colors">
              {project.name}
            </h3>
            <p className="text-gray-500 text-sm mb-5">{project.region}</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/30 rounded-xl p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Leaf className="w-3.5 h-3.5 text-[#11ccf5]" />
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Carbon</span>
                </div>
                <p className="text-white font-black text-lg">{project.carbon}%</p>
                <div className="w-full bg-white/5 rounded-full h-1 mt-2">
                  <div className="bg-[#11ccf5] h-1 rounded-full" style={{ width: `${project.carbon}%` }} />
                </div>
              </div>
              <div className="bg-black/30 rounded-xl p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Zap className="w-3.5 h-3.5 text-[#ff3d5f]" />
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Bio</span>
                </div>
                <p className="text-white font-black text-lg">{project.biodiversity}%</p>
                <div className="w-full bg-white/5 rounded-full h-1 mt-2">
                  <div className="bg-[#ff3d5f] h-1 rounded-full" style={{ width: `${project.biodiversity}%` }} />
                </div>
              </div>
            </div>

            <button className="w-full mt-4 flex items-center justify-center space-x-2 py-2 border border-white/5 rounded-xl text-gray-500 hover:text-[#11ccf5] hover:border-[#11ccf5]/30 text-sm font-bold transition-all">
              <Eye className="w-4 h-4" />
              <span>View Details</span>
            </button>
          </motion.div>
        ))}
      </div>

      {apiError && (
        <div className="mt-6 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          {apiError}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 text-gray-600">
          <Filter className="w-10 h-10 mx-auto mb-4 opacity-30" />
          <p className="font-bold">No projects match your search</p>
        </div>
      )}

      {/* Create Project Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg max-h-[90vh] bg-[#05080a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-white font-black text-lg">Create New Project</h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-gray-400 hover:text-white px-2 py-1 rounded-lg"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="flex-1 min-h-0 flex flex-col">
              <div className="px-6 py-5 space-y-4 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Project Name</label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                    placeholder="e.g. Amazon Rainforest Reforestation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Country</label>
                  <input
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                    placeholder="e.g. India"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">State (auto from map click)</label>
                  <input
                    value={newStateName}
                    onChange={(e) => setNewStateName(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                    placeholder="Will auto-fill after map click"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Pick project location on map</label>
                  <div ref={mapPickerRef} className="w-full h-56 rounded-xl border border-white/10 overflow-hidden" />
                  {selectedCoords && (
                    <p className="text-xs text-gray-400 mt-2">
                      Selected: {selectedCoords[1].toFixed(5)}, {selectedCoords[0].toFixed(5)}
                    </p>
                  )}
                  {mapPickerError && <p className="text-xs text-red-400 mt-2">{mapPickerError}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Notes</label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none min-h-[90px]"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="flex gap-3 p-6 pt-4 border-t border-white/5 bg-[#05080a] sticky bottom-0">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-white/10 rounded-xl text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="flex-1 px-4 py-2.5 bg-[#11ccf5] text-black rounded-xl font-bold hover:bg-[#11ccf5]/90 disabled:opacity-50"
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
