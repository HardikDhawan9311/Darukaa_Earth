import React, { useEffect, useState } from 'react';
import MapboxContainer from '../components/dashboard/MapboxContainer';
import ProjectCard from '../components/dashboard/ProjectCard';

const API_BASE_URL = 'http://localhost:8000';
const DEFAULT_COORDS = [78.9629, 22.5937];

function mapBackendProjectForViewer(project) {
  let parsed = {};
  try {
    parsed = project?.description ? JSON.parse(project.description) : {};
  } catch {
    parsed = {};
  }

  const center = Array.isArray(parsed?.center) && parsed.center.length === 2 ? parsed.center : DEFAULT_COORDS;
  const country = parsed?.country || '';
  const state = parsed?.state || '';

  return {
    id: project.id,
    name: project.name,
    coords: center,
    region: [state, country].filter(Boolean).join(', ') || country || '—',
    status: 'Active',
    carbon: 0,
    biodiversity: 0,
    lastUpdated: project.created_at ? new Date(project.created_at).toLocaleDateString() : '—',
  };
}

const MapViewer = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [panelOpen, setPanelOpen] = useState(true);


  const [siteName, setSiteName] = useState('');
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [viewerProjects, setViewerProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [draftPointCount, setDraftPointCount] = useState(0);
  const [completeDrawingTrigger, setCompleteDrawingTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/projects`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.detail || `Failed to load projects (${res.status})`);
        }
        const data = await res.json();
        if (cancelled) return;

        const list = Array.isArray(data) ? data : [];
        const mapped = list.map(mapBackendProjectForViewer);
        setViewerProjects(mapped);
      } catch (e) {
        if (cancelled) return;
        setSaveError(e?.message || 'Failed to load backend projects');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/sites`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.detail || `Failed to load sites (${res.status})`);
        }
        const data = await res.json();
        if (!cancelled) setSites(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setSaveError(e?.message || 'Failed to load sites');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handlePolygonComplete(drawnRingCoords) {
    setSaveError(null);

    if (!selectedProject?.id) {
      throw new Error('Select a project before creating a site.');
    }
    if (!siteName.trim()) {
      throw new Error('Enter a site name before saving.');
    }
    if (!drawnRingCoords || drawnRingCoords.length < 3) {
      throw new Error('Polygon needs at least 3 points.');
    }

    setSaving(true);
    try {
      setSaveError(null);
      const res = await fetch(`${API_BASE_URL}/api/sites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject.id,
          name: siteName.trim(),
          // Backend expects [lon, lat] ring coords; it will auto-close/validate.
          coordinates: drawnRingCoords,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail || `Failed to create site (${res.status})`);
      }

      const created = await res.json();
      setSites((prev) => [...prev, created]);
      setSelectedSiteId(created?.id ?? null);

      setSiteName('');
      setDrawingEnabled(false);
      return created;
    } catch (e) {
      setSaveError(e?.message || 'Failed to create site');
      throw e;
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSelectedSite() {
    if (!selectedSiteId) return;
    if (!window.confirm('Delete selected site polygon?')) return;

    setDeleting(true);
    setSaveError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/sites/${selectedSiteId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail || `Failed to delete site (${res.status})`);
      }
      setSites((prev) => prev.filter((s) => s.id !== selectedSiteId));
      setSelectedSiteId(null);
    } catch (e) {
      setSaveError(e?.message || 'Failed to delete site');
    } finally {
      setDeleting(false);
    }
  }

  const sitesForSelectedProject = selectedProject?.id
    ? sites.filter((s) => Number(s.project_id) === Number(selectedProject.id))
    : sites;

  const selectedSite = sites.find((s) => s.id === selectedSiteId);

  useEffect(() => {
    const existsInProject = sitesForSelectedProject.some((s) => s.id === selectedSiteId);
    if (!existsInProject) setSelectedSiteId(null);
  }, [sites, selectedSiteId, sitesForSelectedProject]);

  function handleFinishDrawing() {
    if (!drawingEnabled) return;
    setCompleteDrawingTrigger((n) => n + 1);
  }

  function handleCancelDrawing() {
    setDrawingEnabled(false);
    setDraftPointCount(0);
  }

  return (
    <div className="relative h-full w-full">
      {/* Full-screen Map */}
      <div className="absolute inset-0">
        <MapboxContainer
          coords={selectedProject?.coords || DEFAULT_COORDS}
          loading={false}
          fullscreen
          enablePolygonDraw={drawingEnabled}
          onPolygonComplete={handlePolygonComplete}
          completeDrawingTrigger={completeDrawingTrigger}
          onDraftPointCountChange={setDraftPointCount}
          onDrawError={(msg) => setSaveError(msg)}
          persistedSites={sitesForSelectedProject}
          selectedSiteId={selectedSiteId}
          onSiteClick={setSelectedSiteId}
        />
      </div>

      {/* Floating Side Panel */}
      <div
        className={`absolute top-6 left-6 bottom-6 z-20 transition-all duration-300 ${
          panelOpen ? 'w-[320px]' : 'w-14'
        }`}
      >
        <div className="h-full bg-[#05080a]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
          {/* Panel Toggle */}
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="flex items-center justify-between px-4 py-4 border-b border-white/5 hover:bg-white/5 transition-all"
          >
            {panelOpen && (
              <div>
                <p className="text-[10px] text-[#11ccf5] font-black uppercase tracking-widest">Site Navigator</p>
                <p className="text-white font-bold text-sm">{viewerProjects.length} locations</p>
              </div>
            )}
            <div className={`w-6 h-6 flex items-center justify-center text-gray-400 ${!panelOpen && 'mx-auto'}`}>
              {panelOpen ? '◀' : '▶'}
            </div>
          </button>

          {panelOpen && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ scrollbarWidth: 'none' }}>
              {viewerProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isSelected={selectedProject?.id === project.id}
                  onClick={() =>
                    setSelectedProject((prev) =>
                      prev?.id === project.id ? null : project
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {!selectedProject && (
        <div className="absolute top-6 right-6 z-[220] bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 w-[360px] shadow-2xl">
          <p className="text-[11px] font-bold text-gray-300 mb-1">No Project Selected</p>
          <p className="text-xs text-gray-500">
            Select a project from the navigator to create a new site. Existing sites are still visible on the map.
          </p>
        </div>
      )}

      {/* Create Site Overlay (only when project selected) */}
      {selectedProject && (
      <div className="absolute top-6 right-6 z-[220] bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 w-[360px] shadow-2xl">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-[10px] text-[#11ccf5] font-black uppercase tracking-widest mb-1">
              Create New Site
            </p>
            <p className="text-white font-bold text-sm">
              {drawingEnabled
                ? `Drawing: ${draftPointCount} point(s) added`
                : 'Drawing is off'}
            </p>
          </div>
          <button
            onClick={() => setDrawingEnabled((v) => !v)}
            className="px-3 py-2 rounded-xl bg-[#11ccf5] text-black font-bold text-xs hover:bg-[#11ccf5]/90 disabled:opacity-50"
            disabled={!viewerProjects.length}
          >
            {drawingEnabled ? 'Stop' : saving ? 'Saving...' : 'Draw Site'}
          </button>
        </div>

        <div className="space-y-3">
          {saveError && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              {saveError}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-gray-300 mb-1">Project</label>
            <div className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white">
              {selectedProject.name}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-300 mb-1">Site Name</label>
            <input
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="e.g. Coastal Wetland Zone"
              className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white outline-none"
            />
          </div>

          <div className="text-[10px] text-gray-500 leading-relaxed">
            Use Draw Site, click points on map, then Finish Drawing to save.
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-300 mb-1">Select Site</label>
            <select
              value={selectedSiteId ?? ''}
              onChange={(e) => setSelectedSiteId(Number(e.target.value))}
              disabled={!sitesForSelectedProject.length}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white outline-none disabled:opacity-50"
            >
              {sitesForSelectedProject.length === 0 ? (
                <option value="">No sites for this project</option>
              ) : (
                sitesForSelectedProject.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleFinishDrawing}
              disabled={!drawingEnabled || saving || draftPointCount < 3}
              className="px-3 py-2 rounded-xl border border-[#11ccf5]/40 text-[#11ccf5] hover:bg-[#11ccf5]/10 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Finish Drawing'}
            </button>
            <button
              type="button"
              onClick={handleCancelDrawing}
              disabled={!drawingEnabled}
              className="px-3 py-2 rounded-xl border border-white/20 text-gray-300 hover:bg-white/5 disabled:opacity-50"
            >
              Cancel Drawing
            </button>
          </div>
          <button
            type="button"
            onClick={handleDeleteSelectedSite}
            disabled={!selectedSiteId || deleting}
            className="w-full px-3 py-2 rounded-xl border border-red-500/30 text-red-300 hover:bg-red-500/10 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : selectedSiteId ? 'Delete Selected Site' : 'Select a Site Polygon to Delete'}
          </button>
          {selectedSite && (
            <div className="text-[11px] text-gray-400">
              Selected site: <span className="text-white">{selectedSite.name}</span>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Bottom Info Bar */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center space-x-3">
        <div className="bg-[#05080a]/95 backdrop-blur-xl border border-white/10 rounded-xl px-5 py-3 border-l-4 border-l-[#11ccf5]">
          <p className="text-[10px] text-[#11ccf5] font-black uppercase tracking-widest">Focused Site</p>
          <p className="text-white font-bold">{selectedProject?.name || 'All Sites'}</p>
          <p className="text-gray-500 text-xs">{selectedProject?.region || 'No project selected'}</p>
        </div>
      </div>
    </div>
  );
};

export default MapViewer;
