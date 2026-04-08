import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import ProjectCard from '../components/dashboard/ProjectCard';
import MapboxContainer from '../components/dashboard/MapboxContainer';
import AnalyticsStream from '../components/dashboard/AnalyticsStream';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler, ArcElement,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://darukaa-earth-backend.onrender.com';
const DEFAULT_COORDS = [78.9629, 22.5937];
const CHART_CONFIG = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#05080a',
      titleColor: '#11ccf5',
      bodyColor: '#fff',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      padding: 12,
      displayColors: false,
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#4b5563', font: { size: 10 } } },
    y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { display: false } },
  },
};

function parseDescription(description) {
  try {
    return description ? JSON.parse(description) : {};
  } catch {
    return {};
  }
}

const AdminDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [analyticsBySite, setAnalyticsBySite] = useState({});
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [projectsRes, sitesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/projects`),
          fetch(`${API_BASE_URL}/api/sites`),
        ]);
        const projectsData = projectsRes.ok ? await projectsRes.json() : [];
        const sitesData = sitesRes.ok ? await sitesRes.json() : [];
        if (cancelled) return;

        const mappedProjects = (Array.isArray(projectsData) ? projectsData : []).map((p) => {
          const meta = parseDescription(p.description);
          const center = Array.isArray(meta.center) && meta.center.length === 2 ? meta.center : DEFAULT_COORDS;
          return {
            id: p.id,
            name: p.name,
            region: [meta.state, meta.country].filter(Boolean).join(', ') || '—',
            status: 'Active',
            carbon: 0,
            biodiversity: 0,
            lastUpdated: p.created_at ? new Date(p.created_at).toLocaleDateString() : '—',
            coords: center,
          };
        });

        setProjects(mappedProjects);
        setSites(Array.isArray(sitesData) ? sitesData : []);
        if (mappedProjects.length > 0) setSelectedProject(mappedProjects[0]);

        const siteList = Array.isArray(sitesData) ? sitesData : [];
        const analyticsMap = {};
        await Promise.all(
          siteList.map(async (s) => {
            try {
              const res = await fetch(`${API_BASE_URL}/api/analytics/${s.id}`);
              const data = res.ok ? await res.json() : [];
              analyticsMap[s.id] = Array.isArray(data) ? data : [];
            } catch {
              analyticsMap[s.id] = [];
            }
          })
        );
        if (!cancelled) setAnalyticsBySite(analyticsMap);
      } catch {
        if (!cancelled) {
          setProjects([]);
          setSites([]);
          setAnalyticsBySite({});
          setSelectedProject(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedProjectSites = useMemo(
    () => (selectedProject ? sites.filter((s) => Number(s.project_id) === Number(selectedProject.id)) : []),
    [sites, selectedProject]
  );

  const projectAnalytics = useMemo(
    () =>
      selectedProjectSites.flatMap((s) =>
        Array.isArray(analyticsBySite[s.id]) ? analyticsBySite[s.id] : []
      ),
    [selectedProjectSites, analyticsBySite]
  );

  const avgCarbon = useMemo(() => {
    if (!projectAnalytics.length) return 0;
    const sum = projectAnalytics.reduce((acc, a) => acc + Number(a.carbon_score || 0), 0);
    return Math.round((sum / projectAnalytics.length) * 100);
  }, [projectAnalytics]);

  const avgBio = useMemo(() => {
    if (!projectAnalytics.length) return 0;
    const sum = projectAnalytics.reduce((acc, a) => acc + Number(a.biodiversity_index || 0), 0);
    return Math.round((sum / projectAnalytics.length) * 100);
  }, [projectAnalytics]);

  const stats = [
    { label: 'Projects', value: `${projects.length}`, color: '#11ccf5', sub: 'Loaded from database' },
    { label: 'Active Sites', value: `${sites.length}`, color: '#a855f7', sub: 'Mapped polygons in database' },
    { label: 'Avg Carbon', value: `${avgCarbon}%`, color: '#11ccf5', sub: 'From analytics table' },
    { label: 'Avg Biodiversity', value: `${avgBio}%`, color: '#22c55e', sub: 'From analytics table' },
  ];

  const lineData = {
    labels: projectAnalytics.map((_, i) => `${i + 1}`),
    datasets: [{
      label: 'Carbon Yield',
      data: projectAnalytics.map((a) => Math.round(Number(a.carbon_score || 0) * 100)),
      borderColor: '#11ccf5',
      backgroundColor: 'rgba(17,204,245,0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: '#11ccf5',
    }],
  };

  const barData = {
    labels: projectAnalytics.map((_, i) => `${i + 1}`),
    datasets: [{
      label: 'Biodiversity',
      data: projectAnalytics.map((a) => Math.round(Number(a.biodiversity_index || 0) * 100)),
      backgroundColor: (ctx) => ctx.dataIndex % 2 === 0 ? '#11ccf5' : 'rgba(255,61,95,0.2)',
      borderRadius: 8,
    }],
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: 'none' }}>
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[#05080a] border border-white/5 rounded-2xl px-5 py-4"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{s.label}</p>
            <p className="text-2xl font-black text-white" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-gray-600 mt-1">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Section */}
      <div className="flex flex-col 2xl:flex-row gap-6 items-stretch">
        {/* LEFT: Projects List */}
        <div className="w-full 2xl:w-[340px] flex-shrink-0 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white tracking-tight">Geo Projects</h3>
            <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black uppercase text-gray-500 tracking-wider">
              Active Portfolio
            </span>
          </div>
          <div className="max-h-[520px] overflow-y-auto pr-1 space-y-3" style={{ scrollbarWidth: 'none' }}>
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isSelected={selectedProject?.id === project.id}
                onClick={() => setSelectedProject(project)}
              />
            ))}
          </div>
        </div>

        {/* CENTER: Map */}
        <div className="w-full flex-1 min-w-0 h-[520px] min-h-[520px] relative">
          <MapboxContainer
            coords={selectedProject?.coords || DEFAULT_COORDS}
            loading={false}
            persistedSites={selectedProjectSites}
          />
        </div>

        {/* RIGHT: Analytics */}
        <div className="w-full 2xl:w-[420px] flex-shrink-0">
          <AnalyticsStream
            lineData={lineData}
            barData={barData}
            chartConfig={CHART_CONFIG}
            selectedProject={selectedProject || { name: 'No Project Selected' }}
            avgCarbon={avgCarbon}
            avgBio={avgBio}
            siteCount={selectedProjectSites.length}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
