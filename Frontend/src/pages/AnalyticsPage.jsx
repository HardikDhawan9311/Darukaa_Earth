import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { TrendingUp, TrendingDown, Leaf, Zap, Globe, Activity } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://darukaa-earth-backend.onrender.com';
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

const donutOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#05080a', titleColor: '#11ccf5', bodyColor: '#fff' } },
  cutout: '72%',
};

const AnalyticsPage = () => {
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [analyticsRows, setAnalyticsRows] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [carbonScore, setCarbonScore] = useState('0.50');
  const [biodiversityIndex, setBiodiversityIndex] = useState('0.50');
  const [saving, setSaving] = useState(false);
  const [formMessage, setFormMessage] = useState('');

  async function loadAllAnalyticsData(cancelled = false) {
    try {
      const [projectsRes, sitesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/projects`),
        fetch(`${API_BASE_URL}/api/sites`),
      ]);
      const projectsData = projectsRes.ok ? await projectsRes.json() : [];
      const sitesData = sitesRes.ok ? await sitesRes.json() : [];
      if (cancelled) return;

      const safeProjects = Array.isArray(projectsData) ? projectsData : [];
      const safeSites = Array.isArray(sitesData) ? sitesData : [];
      setProjects(safeProjects);
      setSites(safeSites);

      if (!selectedProjectId && safeProjects.length > 0) {
        setSelectedProjectId(String(safeProjects[0].id));
      }

      const allRows = [];
      await Promise.all(
        safeSites.map(async (s) => {
          try {
            const res = await fetch(`${API_BASE_URL}/api/analytics/${s.id}`);
            const data = res.ok ? await res.json() : [];
            (Array.isArray(data) ? data : []).forEach((row) =>
              allRows.push({ ...row, site_name: s.name, project_id: s.project_id })
            );
          } catch {
            // Ignore one site failure, keep page usable
          }
        })
      );
      if (!cancelled) setAnalyticsRows(allRows);
    } catch {
      if (!cancelled) {
        setProjects([]);
        setSites([]);
        setAnalyticsRows([]);
      }
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadAllAnalyticsData(cancelled);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSites = useMemo(() => {
    if (!selectedProjectId) return sites;
    return sites.filter((s) => String(s.project_id) === String(selectedProjectId));
  }, [sites, selectedProjectId]);

  useEffect(() => {
    const exists = filteredSites.some((s) => String(s.id) === String(selectedSiteId));
    if (!exists) {
      setSelectedSiteId(filteredSites[0] ? String(filteredSites[0].id) : '');
    }
  }, [filteredSites, selectedSiteId]);

  async function handleAddAnalytics(e) {
    e.preventDefault();
    setFormMessage('');

    const siteIdNum = Number(selectedSiteId);
    const carbonNum = Number(carbonScore);
    const bioNum = Number(biodiversityIndex);

    if (!siteIdNum) {
      setFormMessage('Please select a site.');
      return;
    }
    if (Number.isNaN(carbonNum) || carbonNum < 0 || carbonNum > 1) {
      setFormMessage('Carbon score must be between 0 and 1.');
      return;
    }
    if (Number.isNaN(bioNum) || bioNum < 0 || bioNum > 1) {
      setFormMessage('Biodiversity index must be between 0 and 1.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: siteIdNum,
          carbon_score: carbonNum,
          biodiversity_index: bioNum,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail || `Failed to add analytics (${res.status})`);
      }
      setFormMessage('Analytics saved successfully.');
      await loadAllAnalyticsData(false);
    } catch (err) {
      setFormMessage(err?.message || 'Failed to save analytics.');
    } finally {
      setSaving(false);
    }
  }

  const avgCarbon = useMemo(() => {
    if (!analyticsRows.length) return 0;
    const sum = analyticsRows.reduce((acc, r) => acc + Number(r.carbon_score || 0), 0);
    return Math.round((sum / analyticsRows.length) * 100);
  }, [analyticsRows]);

  const avgBio = useMemo(() => {
    if (!analyticsRows.length) return 0;
    const sum = analyticsRows.reduce((acc, r) => acc + Number(r.biodiversity_index || 0), 0);
    return Math.round((sum / analyticsRows.length) * 100);
  }, [analyticsRows]);

  const lineData = useMemo(() => {
    const sorted = [...analyticsRows].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );
    return {
      labels: sorted.map((_, i) => `${i + 1}`),
      datasets: [{
        label: 'Carbon Sequestered (%)',
        data: sorted.map((r) => Math.round(Number(r.carbon_score || 0) * 100)),
        borderColor: '#11ccf5',
        backgroundColor: 'rgba(17,204,245,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#11ccf5',
      }],
    };
  }, [analyticsRows]);

  const barData = useMemo(() => {
    const sorted = [...analyticsRows].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );
    return {
      labels: sorted.map((_, i) => `${i + 1}`),
      datasets: [{
        label: 'Biodiversity (%)',
        data: sorted.map((r) => Math.round(Number(r.biodiversity_index || 0) * 100)),
        backgroundColor: (ctx) => (ctx.dataIndex % 2 === 0 ? '#11ccf5' : 'rgba(255,61,95,0.5)'),
        borderRadius: 8,
      }],
    };
  }, [analyticsRows]);

  const donutData = useMemo(() => {
    const projectMap = new Map();
    sites.forEach((s) => {
      projectMap.set(s.id, s.project_id);
    });
    const projectNames = new Map(projects.map((p) => [p.id, p.name]));
    const counts = new Map();
    analyticsRows.forEach((r) => {
      const projectId = projectMap.get(r.site_id) ?? r.project_id;
      const name = projectNames.get(projectId) || `Project ${projectId ?? 'N/A'}`;
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    const labels = Array.from(counts.keys());
    const values = Array.from(counts.values());
    const total = values.reduce((a, b) => a + b, 0) || 1;
    const perc = values.map((v) => Math.round((v / total) * 100));
    return {
      labels,
      datasets: [{
        data: perc,
        backgroundColor: ['#11ccf5', '#a855f7', '#22c55e', '#ff3d5f', '#f59e0b', '#06b6d4'],
        borderWidth: 0,
        hoverOffset: 4,
      }],
    };
  }, [analyticsRows, projects, sites]);

  const kpis = [
    { label: 'Total Projects', value: `${projects.length}`, change: '', up: true, color: '#11ccf5', icon: Leaf },
    { label: 'Biodiversity Index', value: `${avgBio}%`, change: '', up: true, color: '#22c55e', icon: Globe },
    { label: 'Avg Carbon/Site', value: `${avgCarbon}%`, change: '', up: avgCarbon >= 50, color: '#ff3d5f', icon: Activity },
    { label: 'Analytics Records', value: `${analyticsRows.length}`, change: '', up: true, color: '#a855f7', icon: Zap },
  ];

  return (
  <div className="h-full overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: 'none' }}>
    {/* Header */}
    <div>
      <h1 className="text-3xl font-black text-white tracking-tight">Analytics</h1>
      <p className="text-gray-500 text-sm mt-1">Live environmental impact metrics</p>
    </div>

    {/* Add Analytics */}
    <form onSubmit={handleAddAnalytics} className="bg-[#05080a] border border-white/5 rounded-2xl p-5">
      <h4 className="text-white font-black mb-4">Add Analytics</h4>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Project</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white outline-none"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Site</label>
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white outline-none"
          >
            {filteredSites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Carbon (0-1)</label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={carbonScore}
            onChange={(e) => setCarbonScore(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Biodiversity (0-1)</label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={biodiversityIndex}
            onChange={(e) => setBiodiversityIndex(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white outline-none"
          />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-[#11ccf5] text-black font-bold text-sm disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Analytics'}
        </button>
        {formMessage && <p className="text-xs text-gray-400">{formMessage}</p>}
      </div>
    </form>

    {/* KPI Cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((k, i) => (
        <motion.div
          key={k.label}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
          className="bg-[#05080a] border border-white/5 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <k.icon className="w-5 h-5" style={{ color: k.color }} />
            <span className={`flex items-center text-[10px] font-bold ${k.up ? 'text-green-400' : 'text-red-400'}`}>
              {k.up ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {k.change || 'live'}
            </span>
          </div>
          <p className="text-2xl font-black text-white">{k.value}</p>
          <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{k.label}</p>
        </motion.div>
      ))}
    </div>

    {/* Charts Row */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Carbon Trend */}
      <div className="lg:col-span-2 bg-[#05080a] border border-white/5 rounded-2xl p-6">
        <h4 className="text-white font-black mb-1">Carbon Sequestration Trend</h4>
        <p className="text-gray-500 text-xs mb-5">Recorded carbon values from database</p>
        <div className="h-52">
          <Line data={lineData} options={CHART_CONFIG} />
        </div>
      </div>

      {/* Regional Split */}
      <div className="bg-[#05080a] border border-white/5 rounded-2xl p-6">
        <h4 className="text-white font-black mb-1">Regional Distribution</h4>
        <p className="text-gray-500 text-xs mb-5">Distribution by project</p>
        <div className="h-36">
          <Doughnut data={donutData} options={donutOpts} />
        </div>
        <div className="mt-4 space-y-2">
          {(donutData.labels || []).map((label, i) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: donutData.datasets[0].backgroundColor[i] }} />
                <span className="text-xs text-gray-400">{label}</span>
              </div>
              <span className="text-xs text-white font-bold">{donutData.datasets[0].data[i] || 0}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Bar + Per-site table */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="bg-[#05080a] border border-white/5 rounded-2xl p-6">
        <h4 className="text-white font-black mb-1">Regional Growth</h4>
        <p className="text-gray-500 text-xs mb-5">Recorded biodiversity values from database</p>
        <div className="h-44">
          <Bar data={barData} options={CHART_CONFIG} />
        </div>
      </div>

      <div className="bg-[#05080a] border border-white/5 rounded-2xl p-6">
        <h4 className="text-white font-black mb-4">Per-Site Performance</h4>
        <div className="space-y-3">
          {sites.map((s) => {
            const rows = analyticsRows.filter((r) => Number(r.site_id) === Number(s.id));
            const carbon = rows.length
              ? Math.round((rows.reduce((acc, r) => acc + Number(r.carbon_score || 0), 0) / rows.length) * 100)
              : 0;
            const bio = rows.length
              ? Math.round((rows.reduce((acc, r) => acc + Number(r.biodiversity_index || 0), 0) / rows.length) * 100)
              : 0;
            return (
            <div key={s.id} className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm text-white font-bold truncate">{s.name}</p>
                <p className="text-[10px] text-gray-500">Project ID: {s.project_id}</p>
              </div>
              <div className="flex items-center space-x-3 flex-shrink-0">
                <div className="text-right">
                  <p className="text-xs text-[#11ccf5] font-bold">{carbon}%</p>
                  <p className="text-[10px] text-gray-600">Carbon</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#ff3d5f] font-bold">{bio}%</p>
                  <p className="text-[10px] text-gray-600">Bio</p>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      </div>
    </div>
  </div>
  );
};

export default AnalyticsPage;
