import React, {
  useState, useEffect, useRef, useCallback,
  createContext, useContext, useMemo, Suspense
} from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, FileText, Activity,
  Heart, UserCheck, UserX, Trophy, Bed, Wind, Pill,
  AlertTriangle, TrendingUp, Lock, Plus, Trash2,
  Download, Bell, Settings, CheckCircle, X,
  Edit3, Save, Filter, Share2, Link,
  GripVertical, Eye, EyeOff, Search,
  ChevronRight, BarChart2, Zap, Shield,
  ClipboardList, Cpu, Info, FileDown,
  Calendar, Clock, RefreshCw, RotateCcw
} from 'lucide-react';
import { ErrorBoundary } from './components/ui/ErrorBoundary.jsx';
import { usePatients }   from './hooks/usePatients.js';
import { useAllocation } from './hooks/useAllocation.js';

// ════════════════════════════════════════════════════════
// NAVIGATION CONFIG  — algorithms hidden from user
// ════════════════════════════════════════════════════════
const NAV = [
  { id: 'overview',   label: 'Overview',            icon: LayoutDashboard },
  { id: 'patients',   label: 'Patient Management',  icon: Users },
  { id: 'resources',  label: 'Resource Planning',   icon: Bed },
  { id: 'allocation', label: 'Allocation Results',  icon: ClipboardList },
  { id: 'insights',   label: 'System Insights',     icon: BarChart2 },
  { id: 'reports',    label: 'Reports & Export',    icon: FileText },
];

const PAGE_META = {
  overview:   { title: 'Clinical Overview',         desc: 'Real-time allocation status and resource utilization' },
  patients:   { title: 'Patient Management',        desc: 'Register and manage patient resource requirements' },
  resources:  { title: 'Resource Planning',         desc: 'Configure ICU, ventilator and medication capacity' },
  allocation: { title: 'Allocation Results',        desc: 'Optimised patient-resource allocation outcomes' },
  insights:   { title: 'System Insights',           desc: 'Allocation efficiency and performance analytics' },
  reports:    { title: 'Reports & Export',          desc: 'Generate clinical reports and data exports' },
};

const CONDITION_CONFIG = {
  Critical: { pill: 'critical', label: 'Critical',  priority: 4 },
  Severe:   { pill: 'warning',  label: 'Severe',    priority: 3 },
  Moderate: { pill: 'stable',   label: 'Moderate',  priority: 2 },
  Stable:   { pill: 'success',  label: 'Stable',    priority: 1 },
};

// ════════════════════════════════════════════════════════
// TOAST
// ════════════════════════════════════════════════════════
const ToastCtx = createContext(null);
const useToast = () => useContext(ToastCtx);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3800);
  }, []);
  const remove = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);
  const iconMap = { success: CheckCircle, error: AlertTriangle, warning: AlertTriangle, info: Info };
  const colorMap = { success: '#43A047', error: '#EF5350', warning: '#FF8F00', info: '#1976D2' };

  return (
    <ToastCtx.Provider value={add}>
      {children}
      <div className="toast-container">
        <AnimatePresence>
          {toasts.map(t => {
            const Icon = iconMap[t.type] || CheckCircle;
            return (
              <motion.div key={t.id} className={`toast toast--${t.type}`}
                initial={{ opacity: 0, y: 14, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}>
                <Icon size={15} style={{ color: colorMap[t.type], flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{t.msg}</span>
                <button onClick={() => remove(t.id)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex' }}>
                  <X size={13} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
};

// ════════════════════════════════════════════════════════
// PRIMITIVES
// ════════════════════════════════════════════════════════
const StatusPill = ({ children, variant = 'stable', dot = false, pulse = false }) => (
  <span className={`status-pill status-pill--${variant}`}>
    {dot && <span className={`status-dot${pulse ? ' status-dot--pulse' : ''}`} />}
    {children}
  </span>
);

const Btn = ({ children, variant = 'primary', icon: Icon, onClick, disabled, fullWidth, type = 'button', size, title }) => (
  <motion.button type={type}
    whileHover={disabled ? {} : { scale: 1.01 }}
    whileTap={disabled ? {} : { scale: 0.98 }}
    onClick={onClick} disabled={disabled} title={title}
    className={`btn btn--${variant}${size === 'sm' ? ' btn--sm' : ''}`}
    style={{ width: fullWidth ? '100%' : 'auto' }}>
    {Icon && <Icon size={size === 'sm' ? 13 : 15} />}
    {children}
  </motion.button>
);

const ProgressBar = ({ value, max, color = 'var(--blue)', label, showValues = true }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const fillColor = pct >= 100 ? 'var(--critical)' : pct >= 85 ? 'var(--warning-mid)' : color;
  return (
    <div className="progress-wrap">
      {(label || showValues) && (
        <div className="progress-header">
          {label && <span className="progress-header__label">{label}</span>}
          {showValues && <span className="progress-header__value">{value}/{max}</span>}
        </div>
      )}
      <div className="progress-track">
        <motion.div className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.4,0,0.2,1] }}
          style={{ background: fillColor }} />
      </div>
    </div>
  );
};

const Slider = ({ label, value, min, max, onChange, icon: Icon, color = 'var(--blue)' }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {Icon && <Icon size={14} style={{ color }} />}
          <span className="field-label" style={{ margin: 0 }}>{label}</span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', background: 'var(--surface-3)', padding: '2px 10px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>{value}</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        style={{ background: `linear-gradient(to right, ${color} ${pct}%, var(--surface-3) ${pct}%)` }} />
    </div>
  );
};

const CountUp = ({ value, duration = 700 }) => {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current, diff = value - start;
    if (!diff) return;
    const t0 = performance.now();
    const tick = now => {
      const p = Math.min((now - t0) / duration, 1);
      setDisplay(Math.round(start + diff * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
      else prev.current = value;
    };
    requestAnimationFrame(tick);
  }, [value, duration]);
  return <span>{display}</span>;
};

const Skeleton = ({ h = 16, w = '100%', style = {} }) => (
  <div className="skeleton" style={{ height: h, width: w, ...style }} />
);

// ════════════════════════════════════════════════════════
// GAUGE — circular resource ring
// ════════════════════════════════════════════════════════
const Gauge = ({ value, max, color, label, icon: Icon, unit = '' }) => {
  const r = 38, circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const ringColor = pct >= 1 ? 'var(--critical)' : pct >= 0.85 ? 'var(--warning-mid)' : color;
  return (
    <div className="gauge-wrap">
      <div style={{ position: 'relative', width: 88, height: 88 }}>
        <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="44" cy="44" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="7" />
          <motion.circle cx="44" cy="44" r={r} fill="none"
            stroke={ringColor} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ * (1 - pct) }}
            transition={{ duration: 1.1, ease: [0.4,0,0.2,1] }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          {Icon && <Icon size={13} style={{ color: ringColor }} />}
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            {Math.round(pct * 100)}%
          </span>
        </div>
      </div>
      <div className="gauge-label">{label}</div>
      <div className="gauge-sub">{value}{unit} / {max}{unit}</div>
    </div>
  );
};

// ════════════════════════════════════════════════════════
// METRIC CARD
// ════════════════════════════════════════════════════════
const MetricCard = ({ label, value, sub, icon: Icon, iconBg, iconColor, accentColor, delay = 0 }) => (
  <motion.div className="metric-card"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay }}
    style={{ borderTop: `3px solid ${accentColor}` }}>
    <div className="metric-card__label">{label}</div>
    <div className="metric-card__value">
      {typeof value === 'number' ? <CountUp value={value} /> : value}
    </div>
    {sub && <div className="metric-card__sub">{sub}</div>}
    {Icon && (
      <div className="metric-card__icon" style={{ background: iconBg }}>
        <Icon size={20} style={{ color: iconColor }} />
      </div>
    )}
    <div className="metric-card__accent-bar" style={{ background: accentColor }} />
  </motion.div>
);

// ════════════════════════════════════════════════════════
// SIDEBAR
// ════════════════════════════════════════════════════════
const Sidebar = () => {
  const { activeTab, setActiveTab, solution, patients, computing } = useApp();
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar__logo">
        <div className="sidebar__logo-mark">
          <div className="sidebar__logo-icon">
            <Heart size={20} color="#fff" fill="#fff" />
          </div>
          <div>
            <div className="sidebar__logo-name">MediAlloc</div>
          </div>
        </div>
        <div className="sidebar__logo-sub">Resource Management System</div>
      </div>

      {/* Nav */}
      <nav className="sidebar__nav">
        <div className="sidebar__section-label">Clinical Modules</div>
        {NAV.map(item => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <motion.button key={item.id}
              onClick={() => setActiveTab(item.id)}
              whileHover={{ x: 2 }}
              className={`nav-item${isActive ? ' nav-item--active' : ''}`}>
              <Icon size={17} className="nav-item__icon" />
              {item.label}
            </motion.button>
          );
        })}
      </nav>

      {/* Footer status */}
      <div className="sidebar__footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <motion.div
              animate={{ opacity: computing ? [1, 0.3, 1] : 1 }}
              transition={{ duration: 1.2, repeat: computing ? Infinity : 0 }}
              style={{ width: 7, height: 7, borderRadius: '50%', background: computing ? '#FF8F00' : '#43A047' }} />
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
              {computing ? 'Optimising…' : 'System Active'}
            </span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Patients', value: patients.length, color: '#5BA4F5' },
            { label: 'Allocated', value: solution.selectedIndices.length, color: '#43A047' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '8px 10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: s.color, fontFamily: 'var(--font-sans)' }}>
                <CountUp value={s.value} />
              </div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

// ════════════════════════════════════════════════════════
// HEADER
// ════════════════════════════════════════════════════════
const Header = ({ onShare }) => {
  const { activeTab, solution, patients, computing, undo, redo, canUndo, canRedo } = useApp();
  const toast = useToast();
  const meta = PAGE_META[activeTab] || PAGE_META.overview;
  const { efficiency } = useAllocation(patients, solution, {});

  return (
    <header className="header">
      <div className="header__left">
        <h1>{meta.title}</h1>
        <p>{meta.desc}</p>
      </div>
      <div className="header__right">
        {/* Live efficiency badge */}
        <div style={{ display: 'flex', align: 'center', gap: 8, padding: '7px 14px', background: 'var(--blue-ultra)', border: '1px solid var(--border-blue)', borderRadius: 'var(--r-md)', marginRight: 4 }}>
          <Zap size={14} style={{ color: 'var(--blue)', alignSelf: 'center' }} />
          <div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>Allocation Score</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem', color: efficiency >= 80 ? 'var(--success)' : efficiency >= 50 ? 'var(--warning)' : 'var(--critical)' }}>
              {efficiency}% · {solution.maxScore} pts
            </div>
          </div>
        </div>
        {computing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 'var(--r-md)', fontSize: '0.78rem', color: 'var(--warning)' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <RefreshCw size={13} />
            </motion.div>
            Optimising…
          </div>
        )}
        <Btn variant="ghost" icon={RotateCcw} onClick={undo} disabled={!canUndo} size="sm" title="Undo" />
        <Btn variant="ghost" icon={Share2} onClick={() => { onShare(); toast('Link copied to clipboard', 'success'); }} size="sm" title="Share" />
        <button className="btn btn--ghost btn--icon" title="Notifications">
          <Bell size={16} />
        </button>
        <button className="btn btn--ghost btn--icon" title="Settings">
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
};

// ════════════════════════════════════════════════════════
// OVERVIEW PAGE
// ════════════════════════════════════════════════════════
const Overview = () => {
  const { patients, solution, capacity, computing } = useApp();
  const { maxScore, selectedIndices, resourceUsage, deferred, criticalDeferred, efficiency, totalPossibleScore, isAllocated } = useAllocation(patients, solution, capacity);

  return (
    <div>
      {/* Critical alert */}
      <AnimatePresence>
        {criticalDeferred.length > 0 && !computing && (
          <motion.div className="alert-banner alert-banner--critical"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>{criticalDeferred.length} critical patient{criticalDeferred.length > 1 ? 's' : ''} not allocated</strong>
              <div style={{ fontSize: '0.8rem', marginTop: 2, opacity: 0.85 }}>
                Insufficient resources for: {criticalDeferred.map(p => p.name).join(', ')}. Consider adjusting capacity.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metrics */}
      {computing ? (
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="metric-card" style={{ borderTop: '3px solid var(--border)' }}>
              <Skeleton h={10} w="50%" style={{ marginBottom: 12 }} />
              <Skeleton h={32} w="60%" style={{ marginBottom: 8 }} />
              <Skeleton h={10} w="40%" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid-4" style={{ marginBottom: 24 }}>
          <MetricCard label="Total Patients"   value={patients.length}                          sub="Registered"          icon={Users}     iconBg="var(--blue-pale)"    iconColor="var(--blue)"     accentColor="var(--blue)"     delay={0} />
          <MetricCard label="Allocated"        value={selectedIndices.length}                   sub="Receiving resources"  icon={UserCheck} iconBg="var(--success-pale)" iconColor="var(--success)"  accentColor="var(--success)"  delay={0.07} />
          <MetricCard label="Pending Review"   value={patients.length - selectedIndices.length} sub="Resource constraints" icon={UserX}     iconBg="var(--critical-pale)" iconColor="var(--critical)" accentColor="var(--critical)" delay={0.14} />
          <MetricCard label="Optimality Score" value={maxScore}                                 sub={`${efficiency}% efficiency`} icon={Trophy} iconBg="var(--teal-pale)" iconColor="var(--teal)" accentColor="var(--teal)" delay={0.21} />
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Resource Utilisation */}
        <div className="card card--blue-top">
          <div className="card__header">
            <div className="card__title"><Bed size={16} style={{ color: 'var(--blue)' }} />Resource Utilisation</div>
            <StatusPill variant="teal" dot>Live</StatusPill>
          </div>
          <div className="card__body">
            <div className="grid-3" style={{ marginBottom: 22 }}>
              <Gauge value={resourceUsage.icu}        max={capacity.icu}        color="var(--blue)"     label="ICU Beds"    icon={Bed}  />
              <Gauge value={resourceUsage.ventilator} max={capacity.ventilator} color="var(--teal)"     label="Ventilators" icon={Wind} />
              <Gauge value={resourceUsage.medicine}   max={capacity.medicine}   color="var(--success)"  label="Medicines"   icon={Pill} />
            </div>
            <div className="divider" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <ProgressBar value={resourceUsage.icu}        max={capacity.icu}        label="ICU Beds"    color="var(--blue)" />
              <ProgressBar value={resourceUsage.ventilator} max={capacity.ventilator} label="Ventilators" color="var(--teal)" />
              <ProgressBar value={resourceUsage.medicine}   max={capacity.medicine}   label="Medicines"   color="var(--success)" />
            </div>
          </div>
        </div>

        {/* Allocation summary */}
        <div className="card card--teal-top">
          <div className="card__header">
            <div className="card__title"><Activity size={16} style={{ color: 'var(--teal)' }} />Allocation Summary</div>
          </div>
          <div className="card__body">
            {/* Efficiency bar */}
            <div style={{ padding: '14px 16px', background: 'var(--blue-ultra)', borderRadius: 'var(--r-md)', marginBottom: 18, border: '1px solid var(--border-blue)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-body)' }}>Optimisation Efficiency</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: efficiency >= 80 ? 'var(--success)' : efficiency >= 50 ? 'var(--warning)' : 'var(--critical)' }}>{efficiency}%</span>
              </div>
              <ProgressBar value={efficiency} max={100} color="var(--blue)" showValues={false} />
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 5 }}>
                Score {maxScore} of {totalPossibleScore} possible survival points
              </div>
            </div>

            {/* Patient allocation cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Allocated', count: selectedIndices.length, color: 'var(--success)', bg: 'var(--success-pale)' },
                { label: 'Pending',   count: patients.length - selectedIndices.length, color: 'var(--critical)', bg: 'var(--critical-pale)' },
              ].map(s => (
                <div key={s.label} style={{ padding: '14px', background: s.bg, borderRadius: 'var(--r-md)', border: `1px solid ${s.color}22`, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color, lineHeight: 1 }}><CountUp value={s.count} /></div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div className="divider" />
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Shield size={12} style={{ color: 'var(--teal)' }} />
                Allocation computed using 0/1 Multi-Dimensional Knapsack optimisation to maximise survival scores within all resource constraints.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Patient status list */}
      <div className="card">
        <div className="card__header">
          <div className="card__title"><ClipboardList size={16} style={{ color: 'var(--blue)' }} />Patient Status</div>
          <div style={{ display: 'flex', gap: 7 }}>
            <StatusPill variant="allocated" dot>{selectedIndices.length} Allocated</StatusPill>
            {patients.length - selectedIndices.length > 0 && (
              <StatusPill variant="deferred" dot>{patients.length - selectedIndices.length} Pending</StatusPill>
            )}
          </div>
        </div>
        {patients.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Users size={24} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p style={{ fontWeight: 600, color: 'var(--text-body)' }}>No patients registered</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>Add patients via Patient Management</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Age</th>
                <th>Condition</th>
                <th>Survival Score</th>
                <th>ICU</th>
                <th>Ventilator</th>
                <th>Medicine</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p, idx) => {
                const allocated = isAllocated(idx);
                const cfg = CONDITION_CONFIG[p.condition] || CONDITION_CONFIG.Stable;
                return (
                  <motion.tr key={p.id}
                    className={allocated ? 'row--allocated' : 'row--deferred'}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.04 }}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                    <td>{p.age}</td>
                    <td><StatusPill variant={cfg.pill}>{p.condition}</StatusPill></td>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>{p.survivalScore}/10</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{p.icu}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{p.ventilator}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{p.medicine}</td>
                    <td><StatusPill variant={allocated ? 'allocated' : 'deferred'} dot pulse={!allocated && p.condition === 'Critical'}>{allocated ? 'Allocated' : 'Pending'}</StatusPill></td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════
// PATIENT MANAGEMENT
// ════════════════════════════════════════════════════════
const PatientManagement = () => {
  const { patients, addPatient, removePatient, updatePatient, reorderPatients, isAllocated } = useApp();
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', age: '', condition: 'Moderate', survivalScore: 5, icu: 1, ventilator: 0, medicine: 1 });
  const { filtered, search, setSearch, sortBy, setSortBy, filterCondition, setFilterCondition } = usePatients(patients);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const dragIdx = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.name.trim() || !form.age) return;
    addPatient({ ...form, age: parseInt(form.age) });
    toast(`${form.name} registered successfully`, 'success');
    setForm({ name: '', age: '', condition: 'Moderate', survivalScore: 5, icu: 1, ventilator: 0, medicine: 1 });
    setShowForm(false);
  };

  const handleRemove = p => { removePatient(p.id); toast(`${p.name} removed from registry`, 'warning'); };
  const startEdit = p => { setEditingId(p.id); setEditData({ ...p }); };
  const saveEdit  = () => { updatePatient(editingId, { ...editData, age: parseInt(editData.age) }); toast('Patient record updated', 'success'); setEditingId(null); };

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }} />
          <input className="field-input" placeholder="Search patients…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
        </div>
        <select className="field-input" value={filterCondition} onChange={e => setFilterCondition(e.target.value)} style={{ width: 'auto' }}>
          {['All','Critical','Severe','Moderate','Stable'].map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="field-input" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: 'auto' }}>
          <option value="score">Sort: Survival Score</option>
          <option value="condition">Sort: Severity</option>
          <option value="name">Sort: Name A–Z</option>
        </select>
        <div style={{ marginLeft: 'auto' }}>
          <Btn variant="primary" icon={Plus} onClick={() => setShowForm(true)}>Register Patient</Btn>
        </div>
      </div>

      {/* Add Patient Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div className="modal-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}>
            <motion.div className="modal"
              initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}>
              <div className="modal__header">
                <div className="modal__title"><Plus size={18} style={{ color: 'var(--blue)' }} />Register New Patient</div>
                <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={18} /></button>
              </div>
              <div className="modal__body">
                <form onSubmit={handleSubmit}>
                  <div className="grid-2" style={{ gap: 14, marginBottom: 14 }}>
                    <div>
                      <label className="field-label">Full Name *</label>
                      <input className="field-input" type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Arjun Sharma" required />
                    </div>
                    <div>
                      <label className="field-label">Age *</label>
                      <input className="field-input" type="number" value={form.age} onChange={e => setForm({...form, age: e.target.value})} placeholder="e.g. 45" min={1} max={120} required />
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label className="field-label">Medical Condition *</label>
                    <select className="field-input" value={form.condition} onChange={e => setForm({...form, condition: e.target.value})}>
                      {['Critical','Severe','Moderate','Stable'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginBottom: 4 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Resource Requirements</div>
                    <Slider label="Survival Priority Score (1–10)" value={form.survivalScore} min={1} max={10} onChange={v => setForm({...form,survivalScore:v})} icon={Heart} color="var(--critical)" />
                    <Slider label="ICU Beds Required"              value={form.icu}           min={0} max={5}  onChange={v => setForm({...form,icu:v})}           icon={Bed}   color="var(--blue)" />
                    <Slider label="Ventilators Required"           value={form.ventilator}    min={0} max={3}  onChange={v => setForm({...form,ventilator:v})}    icon={Wind}  color="var(--teal)" />
                    <Slider label="Medication Units"               value={form.medicine}      min={0} max={8}  onChange={v => setForm({...form,medicine:v})}      icon={Pill}  color="var(--success)" />
                  </div>
                  <div className="modal__footer" style={{ margin: '0 -24px -22px', padding: '14px 24px' }}>
                    <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
                    <Btn variant="primary" icon={Plus} type="submit">Register Patient</Btn>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Patient Table */}
      <div className="card">
        <div className="card__header">
          <div className="card__title"><Users size={16} style={{ color: 'var(--blue)' }} />Registered Patients <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>({filtered.length})</span></div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Drag rows to reorder</div>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ fontWeight: 600, color: 'var(--text-body)' }}>{patients.length === 0 ? 'No patients registered' : 'No results match your filter'}</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>{patients.length === 0 ? 'Click "Register Patient" to add the first patient' : 'Try adjusting your search or filter criteria'}</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 32 }}></th>
                <th>Patient</th>
                <th>Age</th>
                <th>Condition</th>
                <th>Priority Score</th>
                <th>ICU</th>
                <th>Vent.</th>
                <th>Med.</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map(p => {
                  const allocated = isAllocated(p._origIdx);
                  const cfg = CONDITION_CONFIG[p.condition] || CONDITION_CONFIG.Stable;
                  const isEditing = editingId === p.id;
                  return (
                    <motion.tr key={p.id}
                      className={allocated ? 'row--allocated' : 'row--deferred'}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      draggable
                      onDragStart={e => { dragIdx.current = p._origIdx; e.dataTransfer.effectAllowed = 'move'; }}
                      onDragOver={e => { e.preventDefault(); setDragOver(p._origIdx); }}
                      onDrop={e => { e.preventDefault(); if (dragIdx.current !== null && dragIdx.current !== p._origIdx) { reorderPatients(dragIdx.current, p._origIdx); toast('Order updated', 'info'); } dragIdx.current = null; setDragOver(null); }}
                      onDragEnd={() => { dragIdx.current = null; setDragOver(null); }}
                      style={{ opacity: dragOver === p._origIdx ? 0.5 : 1, cursor: 'grab', outline: dragOver === p._origIdx ? '2px dashed var(--blue)' : 'none' }}>
                      <td style={{ color: 'var(--text-faint)', paddingLeft: 14 }}><GripVertical size={14} /></td>
                      {isEditing ? (
                        <>
                          <td><input className="field-input" value={editData.name} onChange={e => setEditData({...editData,name:e.target.value})} style={{ padding: '5px 8px', fontSize: '0.82rem' }} /></td>
                          <td><input className="field-input" type="number" value={editData.age} onChange={e => setEditData({...editData,age:e.target.value})} style={{ padding: '5px 8px', fontSize: '0.82rem', width: 60 }} /></td>
                          <td>
                            <select className="field-input" value={editData.condition} onChange={e => setEditData({...editData,condition:e.target.value})} style={{ padding: '5px 8px', fontSize: '0.82rem' }}>
                              {['Critical','Severe','Moderate','Stable'].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </td>
                          <td><input className="field-input" type="number" min={1} max={10} value={editData.survivalScore} onChange={e => setEditData({...editData,survivalScore:parseInt(e.target.value)})} style={{ padding: '5px 8px', fontSize: '0.82rem', width: 60 }} /></td>
                          <td><input className="field-input" type="number" min={0} max={5} value={editData.icu} onChange={e => setEditData({...editData,icu:parseInt(e.target.value)})} style={{ padding: '5px 8px', fontSize: '0.82rem', width: 55 }} /></td>
                          <td><input className="field-input" type="number" min={0} max={3} value={editData.ventilator} onChange={e => setEditData({...editData,ventilator:parseInt(e.target.value)})} style={{ padding: '5px 8px', fontSize: '0.82rem', width: 55 }} /></td>
                          <td><input className="field-input" type="number" min={0} max={8} value={editData.medicine} onChange={e => setEditData({...editData,medicine:parseInt(e.target.value)})} style={{ padding: '5px 8px', fontSize: '0.82rem', width: 55 }} /></td>
                          <td></td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <Btn variant="primary" icon={Save} onClick={saveEdit} size="sm">Save</Btn>
                              <Btn variant="ghost" icon={X} onClick={() => setEditingId(null)} size="sm">Cancel</Btn>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                          <td>{p.age}</td>
                          <td><StatusPill variant={cfg.pill}>{p.condition}</StatusPill></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 6, background: 'var(--surface-3)', borderRadius: 'var(--r-full)', overflow: 'hidden', border: '1px solid var(--border)', maxWidth: 60 }}>
                                <div style={{ height: '100%', width: `${p.survivalScore * 10}%`, background: p.survivalScore >= 8 ? 'var(--critical)' : p.survivalScore >= 6 ? 'var(--warning-mid)' : 'var(--blue)', borderRadius: 'var(--r-full)' }} />
                              </div>
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.82rem' }}>{p.survivalScore}</span>
                            </div>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center' }}>{p.icu}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center' }}>{p.ventilator}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center' }}>{p.medicine}</td>
                          <td><StatusPill variant={allocated ? 'allocated' : 'deferred'} dot pulse={!allocated && p.condition === 'Critical'}>{allocated ? 'Allocated' : 'Pending'}</StatusPill></td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <Btn variant="ghost" icon={Edit3} onClick={() => startEdit(p)} size="sm" title="Edit" />
                              <Btn variant="danger" icon={Trash2} onClick={() => handleRemove(p)} size="sm" title="Remove" />
                            </div>
                          </td>
                        </>
                      )}
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════
// RESOURCE PLANNING
// ════════════════════════════════════════════════════════
const SCENARIOS = {
  normal:   { name: 'Standard Operations', desc: 'Regular hospital capacity',      icu: 6,  ventilator: 4, medicine: 10, color: 'var(--blue)',     icon: Activity },
  surge:    { name: 'Mass Casualty Event',  desc: 'Emergency overflow capacity',   icu: 3,  ventilator: 2, medicine: 5,  color: 'var(--critical)', icon: AlertTriangle },
  ample:    { name: 'Full Capacity',        desc: 'Maximum resources available',   icu: 10, ventilator: 8, medicine: 15, color: 'var(--success)',  icon: TrendingUp },
  lockdown: { name: 'Scarcity Protocol',    desc: 'Severe resource constraints',   icu: 2,  ventilator: 1, medicine: 3,  color: 'var(--warning)',  icon: Lock },
};

const ResourcePlanning = () => {
  const { capacity, updateCapacity, currentScenario, setCurrentScenario } = useApp();
  return (
    <div>
      <div className="grid-2">
        {/* Capacity sliders */}
        <div className="card card--blue-top">
          <div className="card__header">
            <div className="card__title"><Bed size={16} style={{ color: 'var(--blue)' }} />Capacity Configuration</div>
          </div>
          <div className="card__body">
            <div style={{ marginBottom: 8 }}>
              <Slider label="ICU Beds Available"      value={capacity.icu}        min={1} max={20} onChange={v => updateCapacity('icu', v)}        icon={Bed}  color="var(--blue)" />
              <Slider label="Ventilators Available"   value={capacity.ventilator} min={1} max={15} onChange={v => updateCapacity('ventilator', v)} icon={Wind} color="var(--teal)" />
              <Slider label="Medication Units (daily)" value={capacity.medicine}  min={1} max={25} onChange={v => updateCapacity('medicine', v)}   icon={Pill} color="var(--success)" />
            </div>
            <div style={{ padding: '12px 14px', background: 'var(--blue-ultra)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-blue)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>Current Configuration</div>
              <div style={{ display: 'flex', gap: 16 }}>
                {[{ label: 'ICU Beds', value: capacity.icu }, { label: 'Ventilators', value: capacity.ventilator }, { label: 'Medicines', value: capacity.medicine }].map(s => (
                  <div key={s.label}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--blue)' }}>{s.value}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scenario presets */}
        <div className="card">
          <div className="card__header">
            <div className="card__title"><ClipboardList size={16} style={{ color: 'var(--blue)' }} />Operational Scenarios</div>
          </div>
          <div className="card__body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(SCENARIOS).map(([key, s]) => {
                const isActive = currentScenario === key;
                const Icon = s.icon;
                return (
                  <motion.button key={key} onClick={() => setCurrentScenario(key)}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', border: `1px solid ${isActive ? s.color : 'var(--border)'}`, background: isActive ? `${s.color}0D` : 'var(--surface-2)', cursor: 'pointer', textAlign: 'left', transition: 'all var(--t-base)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 'var(--r-sm)', background: isActive ? `${s.color}18` : 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={16} style={{ color: isActive ? s.color : 'var(--text-muted)' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: isActive ? s.color : 'var(--text-primary)' }}>{s.name}</div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.desc}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 10, fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: isActive ? s.color : 'var(--text-muted)' }}>
                        <span>ICU {s.icu}</span>
                        <span>Vent {s.ventilator}</span>
                        <span>Med {s.medicine}</span>
                      </div>
                      {isActive && <ChevronRight size={14} style={{ color: s.color }} />}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════
// ALLOCATION RESULTS
// ════════════════════════════════════════════════════════
const AllocationResults = () => {
  const { patients, solution, capacity } = useApp();
  const { maxScore, selectedIndices, resourceUsage, allocated, deferred, efficiency, totalPossibleScore, isAllocated } = useAllocation(patients, solution, capacity);

  return (
    <div>
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <MetricCard label="Allocated Patients"  value={allocated.length}  sub="Resource assignment confirmed" icon={UserCheck} iconBg="var(--success-pale)" iconColor="var(--success)" accentColor="var(--success)" delay={0} />
        <MetricCard label="Pending Assignment"  value={deferred.length}   sub="Awaiting resource availability" icon={UserX}     iconBg="var(--critical-pale)" iconColor="var(--critical)" accentColor="var(--critical)" delay={0.07} />
        <MetricCard label="Optimality Score"    value={`${efficiency}%`}  sub={`${maxScore} of ${totalPossibleScore} survival pts`} icon={Trophy} iconBg="var(--teal-pale)" iconColor="var(--teal)" accentColor="var(--teal)" delay={0.14} />
      </div>

      <div className="grid-2">
        {/* Allocated */}
        <div className="card" style={{ borderTop: '3px solid var(--success)' }}>
          <div className="card__header">
            <div className="card__title" style={{ color: 'var(--success)' }}><UserCheck size={16} />Allocated Patients ({allocated.length})</div>
          </div>
          <div className="card__body" style={{ padding: 0 }}>
            {allocated.length === 0 ? (
              <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>No allocations yet</div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Patient</th><th>Condition</th><th>Score</th><th>Resources Used</th></tr></thead>
                <tbody>
                  {allocated.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td><StatusPill variant={CONDITION_CONFIG[p.condition]?.pill || 'stable'}>{p.condition}</StatusPill></td>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{p.survivalScore}</span></td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        ICU ×{p.icu} · Vent ×{p.ventilator} · Med ×{p.medicine}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Deferred */}
        <div className="card" style={{ borderTop: '3px solid var(--critical)' }}>
          <div className="card__header">
            <div className="card__title" style={{ color: 'var(--critical)' }}><UserX size={16} />Pending Assignment ({deferred.length})</div>
          </div>
          <div className="card__body" style={{ padding: 0 }}>
            {deferred.length === 0 ? (
              <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>All patients allocated</div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Patient</th><th>Condition</th><th>Score</th><th>Requirements</th></tr></thead>
                <tbody>
                  {deferred.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td><StatusPill variant={CONDITION_CONFIG[p.condition]?.pill || 'stable'}>{p.condition}</StatusPill></td>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{p.survivalScore}</span></td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        ICU ×{p.icu} · Vent ×{p.ventilator} · Med ×{p.medicine}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Resource usage summary */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card__header">
          <div className="card__title"><BarChart2 size={16} style={{ color: 'var(--blue)' }} />Resource Consumption Summary</div>
        </div>
        <div className="card__body">
          <div className="grid-3" style={{ gap: 28 }}>
            <ProgressBar value={resourceUsage.icu}        max={capacity.icu}        label="ICU Beds"    color="var(--blue)" />
            <ProgressBar value={resourceUsage.ventilator} max={capacity.ventilator} label="Ventilators" color="var(--teal)" />
            <ProgressBar value={resourceUsage.medicine}   max={capacity.medicine}   label="Medicine"    color="var(--success)" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════
// SYSTEM INSIGHTS  — algorithm facts in medical language
// ════════════════════════════════════════════════════════
const SystemInsights = () => {
  const { patients, solution, capacity, complexity } = useApp();
  const { efficiency, totalPossibleScore, maxScore } = useAllocation(patients, solution, capacity);
  const { dp, bruteForce, speedup } = complexity;

  const insights = [
    { label: 'Optimisation Method',    value: '0/1 Knapsack — Multi-dimensional',           note: 'Guarantees globally optimal allocation' },
    { label: 'Solution Quality',       value: 'Globally Optimal',                           note: 'Every feasible solution was evaluated' },
    { label: 'Computation Efficiency', value: `${speedup}× faster than brute force`,        note: `${dp.operations.toLocaleString()} ops vs ${bruteForce.operations.toLocaleString()}` },
    { label: 'Patients Evaluated',     value: `${patients.length} patients`,                note: `${Math.pow(2, patients.length).toLocaleString()} possible combinations considered` },
    { label: 'Resource Dimensions',    value: '3 simultaneous constraints',                 note: 'ICU beds, ventilators, and medication' },
    { label: 'Score Achieved',         value: `${maxScore} / ${totalPossibleScore} points`, note: `${efficiency}% of maximum possible survival score` },
  ];

  return (
    <div>
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <MetricCard label="Efficiency Rating"     value={`${efficiency}%`}                             sub="Allocation optimality"           icon={Zap}       iconBg="var(--blue-pale)"    iconColor="var(--blue)"     accentColor="var(--blue)"     delay={0}    />
        <MetricCard label="Computation Speedup"   value={`${speedup}×`}                               sub="vs. brute-force search"          icon={Cpu}       iconBg="var(--teal-pale)"    iconColor="var(--teal)"     accentColor="var(--teal)"     delay={0.07} />
        <MetricCard label="Combinations Checked"  value={Math.pow(2, patients.length).toLocaleString()} sub="Patient assignment permutations" icon={BarChart2}  iconBg="var(--success-pale)" iconColor="var(--success)"  accentColor="var(--success)"  delay={0.14} />
      </div>

      <div className="grid-2">
        {/* Allocation insights */}
        <div className="card card--blue-top">
          <div className="card__header">
            <div className="card__title"><Shield size={16} style={{ color: 'var(--blue)' }} />Allocation Engine Performance</div>
          </div>
          <div className="card__body">
            {insights.map((item, i) => (
              <div key={i} className="insight-row">
                <div>
                  <div className="insight-row__label">{item.label}</div>
                  {item.note && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{item.note}</div>}
                </div>
                <div className="insight-row__value" style={{ textAlign: 'right', maxWidth: '40%' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works — clinical language */}
        <div className="card">
          <div className="card__header">
            <div className="card__title"><Info size={16} style={{ color: 'var(--blue)' }} />How Allocation Works</div>
          </div>
          <div className="card__body">
            {[
              { step: '01', title: 'Patient Registration',      desc: 'Each patient is registered with their required ICU beds, ventilators, and medication alongside a survival priority score (1–10).' },
              { step: '02', title: 'Constraint Modelling',      desc: 'Available hospital resources are configured as hard constraints — the system must never exceed these limits.' },
              { step: '03', title: 'Optimisation Run',          desc: 'A polynomial-time algorithm evaluates all possible patient combinations to find the assignment that maximises total survival scores.' },
              { step: '04', title: 'Results & Reporting',       desc: 'Allocated patients receive confirmed resource assignments. Pending patients are flagged for review when capacity increases.' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
                <div style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.7rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>{s.step}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: 3 }}>{s.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════
// REPORTS & EXPORT
// ════════════════════════════════════════════════════════
const Reports = () => {
  const { patients, solution, capacity, complexity, getShareableURL } = useApp();
  const toast = useToast();
  const { maxScore, resourceUsage, allocated, deferred, efficiency, totalPossibleScore } = useAllocation(patients, solution, capacity);
  const reportRef = useRef(null);

  const generateTXT = () => {
    const r = `MEDIALLOC — CLINICAL RESOURCE ALLOCATION REPORT
==============================================
Date: ${new Date().toLocaleString()}
Institution: Hospital Resource Management System

EXECUTIVE SUMMARY
-----------------
Total Patients Registered:  ${patients.length}
Patients Allocated:         ${allocated.length}
Patients Pending:           ${deferred.length}
Optimality Score:           ${maxScore} / ${totalPossibleScore} (${efficiency}% efficiency)

RESOURCE UTILISATION
--------------------
ICU Beds:    ${resourceUsage.icu} / ${capacity.icu} used (${capacity.icu > 0 ? ((resourceUsage.icu/capacity.icu)*100).toFixed(1) : 0}%)
Ventilators: ${resourceUsage.ventilator} / ${capacity.ventilator} used (${capacity.ventilator > 0 ? ((resourceUsage.ventilator/capacity.ventilator)*100).toFixed(1) : 0}%)
Medication:  ${resourceUsage.medicine} / ${capacity.medicine} units used (${capacity.medicine > 0 ? ((resourceUsage.medicine/capacity.medicine)*100).toFixed(1) : 0}%)

ALLOCATED PATIENTS
------------------
${allocated.map(p => `  ✓ ${p.name.padEnd(20)} | ${p.condition.padEnd(10)} | Score: ${p.survivalScore} | ICU: ${p.icu}, Vent: ${p.ventilator}, Med: ${p.medicine}`).join('\n') || '  None'}

PENDING ALLOCATION
------------------
${deferred.map(p => `  ○ ${p.name.padEnd(20)} | ${p.condition.padEnd(10)} | Score: ${p.survivalScore} | ICU: ${p.icu}, Vent: ${p.ventilator}, Med: ${p.medicine}`).join('\n') || '  None'}

ALGORITHM PERFORMANCE
---------------------
Method:             Multi-Dimensional Knapsack Optimisation
Computation (DP):   ${complexity.dp.operations.toLocaleString()} operations
Brute Force (est.): ${complexity.bruteForce.operations.toLocaleString()} operations
Speedup Factor:     ${complexity.speedup}×

==============================================
Generated by MediAlloc Resource Management System`.trim();
    const blob = new Blob([r], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: `medialloc-report-${Date.now()}.txt` }).click();
    URL.revokeObjectURL(url);
    toast('Clinical report exported', 'success');
  };

  const generateCSV = () => {
    const rows = [
      'Patient Name,Status,Condition,Age,Survival Score,ICU Required,Ventilators Required,Medication Required',
      ...allocated.map(p => `${p.name},Allocated,${p.condition},${p.age},${p.survivalScore},${p.icu},${p.ventilator},${p.medicine}`),
      ...deferred.map(p =>  `${p.name},Pending,${p.condition},${p.age},${p.survivalScore},${p.icu},${p.ventilator},${p.medicine}`),
    ].join('\n');
    const blob = new Blob([rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: `medialloc-patients-${Date.now()}.csv` }).click();
    URL.revokeObjectURL(url);
    toast('CSV data exported', 'success');
  };

  const generatePDF = async () => {
    toast('Preparing PDF report…', 'info');
    try {
      const { default: jsPDF }       = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      const el = reportRef.current;
      if (!el) return;
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#FFFFFF', logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW  = pdf.internal.pageSize.getWidth();
      const pageH  = pdf.internal.pageSize.getHeight();
      const margin = 12;
      // Header
      pdf.setFillColor(21, 101, 192);
      pdf.rect(0, 0, pageW, 16, 'F');
      pdf.setFontSize(11); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(255,255,255);
      pdf.text('MediAlloc — Clinical Resource Allocation Report', margin, 10.5);
      pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(200,220,255);
      pdf.text(`Generated: ${new Date().toLocaleString()}   |   Patients: ${patients.length}   |   Efficiency: ${efficiency}%`, margin, 20);
      // Content
      const imgW = pageW - margin * 2;
      const imgH = (canvas.height / canvas.width) * imgW;
      let yPos = 24, remaining = imgH;
      const usableH = pageH - yPos - margin;
      if (remaining <= usableH) {
        pdf.addImage(imgData, 'PNG', margin, yPos, imgW, imgH);
      } else {
        let srcY = 0;
        while (remaining > 0) {
          const sliceH  = Math.min(usableH, remaining);
          const sc      = document.createElement('canvas');
          sc.width      = canvas.width;
          sc.height     = (sliceH / imgH) * canvas.height;
          sc.getContext('2d').drawImage(canvas, 0, srcY * (canvas.height / imgH), canvas.width, sc.height, 0, 0, canvas.width, sc.height);
          pdf.addImage(sc.toDataURL('image/png'), 'PNG', margin, yPos, imgW, sliceH);
          remaining -= sliceH; srcY += sliceH;
          if (remaining > 0) { pdf.addPage(); yPos = margin; }
        }
      }
      const total = pdf.getNumberOfPages();
      for (let pg = 1; pg <= total; pg++) {
        pdf.setPage(pg);
        pdf.setFontSize(7); pdf.setTextColor(150,170,200);
        pdf.text(`MediAlloc Resource Management System  ·  Page ${pg} of ${total}  ·  Confidential`, margin, pageH - 5);
      }
      pdf.save(`medialloc-clinical-report-${Date.now()}.pdf`);
      toast('PDF report exported successfully', 'success');
    } catch (err) {
      console.error(err);
      toast('PDF export failed — please try again', 'error');
    }
  };

  const copyShareURL = () => {
    const url = getShareableURL();
    navigator.clipboard.writeText(url).catch(() => {});
    toast('Shareable link copied to clipboard', 'success');
  };

  return (
    <div>
      {/* Export actions */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card__header">
          <div className="card__title"><FileText size={16} style={{ color: 'var(--blue)' }} />Export Options</div>
        </div>
        <div className="card__body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { label: 'PDF Report',    sub: 'Full clinical report with charts', icon: FileDown,  color: 'var(--blue)',    action: generatePDF,    variant: 'primary' },
              { label: 'Text Report',   sub: 'Plain text summary (.txt)',         icon: FileText,  color: 'var(--teal)',    action: generateTXT,    variant: 'secondary' },
              { label: 'Patient Data',  sub: 'Spreadsheet export (.csv)',         icon: Download,  color: 'var(--success)', action: generateCSV,    variant: 'secondary' },
              { label: 'Share Link',    sub: 'Copy shareable URL with state',     icon: Link,      color: 'var(--warning)', action: copyShareURL,    variant: 'secondary' },
            ].map(opt => (
              <button key={opt.label} onClick={opt.action}
                style={{ padding: '16px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', cursor: 'pointer', textAlign: 'left', transition: 'all var(--t-base)', display: 'flex', flexDirection: 'column', gap: 8 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = opt.color; e.currentTarget.style.background = 'var(--blue-ultra)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-2)'; }}>
                <opt.icon size={20} style={{ color: opt.color }} />
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{opt.label}</div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{opt.sub}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Report preview */}
      <div ref={reportRef}>
        <div className="grid-4" style={{ marginBottom: 20 }}>
          <MetricCard label="Allocated"  value={allocated.length} icon={UserCheck} iconBg="var(--success-pale)" iconColor="var(--success)" accentColor="var(--success)" delay={0} />
          <MetricCard label="Pending"    value={deferred.length}  icon={UserX}     iconBg="var(--critical-pale)" iconColor="var(--critical)" accentColor="var(--critical)" delay={0.05} />
          <MetricCard label="Score"      value={maxScore}         icon={Trophy}    iconBg="var(--teal-pale)"    iconColor="var(--teal)"    accentColor="var(--teal)"    delay={0.1} />
          <MetricCard label="Efficiency" value={`${efficiency}%`} icon={Zap}       iconBg="var(--blue-pale)"    iconColor="var(--blue)"    accentColor="var(--blue)"    delay={0.15} />
        </div>

        <div className="grid-2" style={{ marginBottom: 20 }}>
          {[
            { title: `Allocated Patients (${allocated.length})`, list: allocated, color: 'var(--success)', borderTop: 'var(--success)' },
            { title: `Pending Assignment (${deferred.length})`,  list: deferred,  color: 'var(--critical)', borderTop: 'var(--critical)' },
          ].map(s => (
            <div key={s.title} className="card" style={{ borderTop: `3px solid ${s.borderTop}` }}>
              <div className="card__header"><div className="card__title" style={{ color: s.color }}>{s.title}</div></div>
              <div className="card__body" style={{ padding: 0 }}>
                {s.list.length === 0 ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>None</div> : (
                  <table className="data-table">
                    <thead><tr><th>Patient</th><th>Condition</th><th>Score</th><th>Resources</th></tr></thead>
                    <tbody>
                      {s.list.map(p => (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 600 }}>{p.name}</td>
                          <td><StatusPill variant={CONDITION_CONFIG[p.condition]?.pill || 'stable'}>{p.condition}</StatusPill></td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{p.survivalScore}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ICU ×{p.icu} · Vent ×{p.ventilator} · Med ×{p.medicine}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card__header"><div className="card__title"><BarChart2 size={16} style={{ color: 'var(--blue)' }} />Resource Utilisation</div></div>
          <div className="card__body">
            <div className="grid-3" style={{ gap: 28 }}>
              <ProgressBar value={resourceUsage.icu}        max={capacity.icu}        label="ICU Beds"    color="var(--blue)" />
              <ProgressBar value={resourceUsage.ventilator} max={capacity.ventilator} label="Ventilators" color="var(--teal)" />
              <ProgressBar value={resourceUsage.medicine}   max={capacity.medicine}   label="Medication"  color="var(--success)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════
// ONBOARDING
// ════════════════════════════════════════════════════════
const Onboarding = ({ onDone }) => {
  const [step, setStep] = useState(0);
  const steps = [
    { icon: Heart,       title: 'Welcome to MediAlloc',        desc: 'A clinical resource allocation system that uses advanced optimisation to assign ICU beds, ventilators and medication to patients — maximising total survival outcomes.' },
    { icon: Bed,         title: 'Configure Resources',          desc: 'Set your hospital\'s available ICU beds, ventilators and medication units under Resource Planning. Choose from preset operational scenarios like Mass Casualty Event.' },
    { icon: Users,       title: 'Register Patients',           desc: 'Add patients with their medical conditions and required resources. Each patient receives a survival priority score from 1–10 for the optimisation engine.' },
    { icon: ClipboardList, title: 'Review Allocation Results', desc: 'The system automatically computes the optimal assignment of resources to patients, ensuring maximum survival score within your resource constraints.' },
    { icon: BarChart2,   title: 'Monitor Performance',         desc: 'System Insights shows allocation efficiency, computation performance, and explains how the optimisation engine works in clinical language.' },
  ];
  const s = steps[step];
  const Icon = s.icon;

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div className="modal" style={{ maxWidth: 480 }}
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}>
        <div style={{ background: 'var(--blue)', padding: '24px 24px 20px' }}>
          <div style={{ width: 52, height: 52, borderRadius: 'var(--r-md)', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Icon size={26} color="#fff" />
          </div>
          <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '1.15rem', letterSpacing: '-0.02em' }}>{s.title}</h2>
        </div>
        <div className="modal__body">
          <p style={{ color: 'var(--text-body)', lineHeight: 1.7, fontSize: '0.9rem' }}>{s.desc}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
            {steps.map((_, i) => (
              <button key={i} onClick={() => setStep(i)}
                className="onboard-step-dot"
                style={{ background: i === step ? 'var(--blue)' : 'var(--border-strong)', width: i === step ? 20 : 7, height: 7 }} />
            ))}
          </div>
        </div>
        <div className="modal__footer">
          <button onClick={onDone} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem', textDecoration: 'underline' }}>Skip</button>
          <div style={{ flex: 1 }} />
          {step > 0 && <Btn variant="ghost" onClick={() => setStep(s => s - 1)}>Back</Btn>}
          <Btn variant="primary" onClick={step === steps.length - 1 ? onDone : () => setStep(s => s + 1)}>
            {step === steps.length - 1 ? 'Get Started' : 'Next'}
          </Btn>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════
function AppInner() {
  const { activeTab, setActiveTab, undo, redo, canUndo, canRedo, getShareableURL } = useApp();
  const [showOnboard, setShowOnboard] = useState(() => !localStorage.getItem('medialloc_v3_toured'));

  const handleShare = useCallback(() => {
    const url = getShareableURL();
    navigator.clipboard.writeText(url).catch(() => {});
  }, [getShareableURL]);

  const finishOnboard = () => {
    localStorage.setItem('medialloc_v3_toured', '1');
    setShowOnboard(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const map = { '1': 'overview', '2': 'patients', '3': 'resources', '4': 'allocation', '5': 'insights', '6': 'reports' };
    const handler = e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') { setShowOnboard(false); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); return; }
      if (map[e.key]) setActiveTab(map[e.key]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setActiveTab, undo, redo]);

  const renderPage = () => {
    const pages = {
      overview:   <Overview />,
      patients:   <PatientManagement />,
      resources:  <ResourcePlanning />,
      allocation: <AllocationResults />,
      insights:   <SystemInsights />,
      reports:    <Reports />,
    };
    return pages[activeTab] || <Overview />;
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Header onShare={handleShare} />
        <main className="page-body">
          <ErrorBoundary key={activeTab}>
            <AnimatePresence mode="wait">
              <motion.div key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}>
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
        </main>
      </div>
      <AnimatePresence>
        {showOnboard && <Onboarding onDone={finishOnboard} />}
      </AnimatePresence>
      <style>{`
        select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236B7FA3' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 28px !important; }
        @media (max-width: 1024px) { .grid-4 { grid-template-columns: repeat(2,1fr); } }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </AppProvider>
  );
}