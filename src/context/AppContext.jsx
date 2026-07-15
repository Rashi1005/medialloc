

import { useState, useCallback, useEffect, useMemo, useRef, createContext, useContext } from 'react';
import { initialPatients as INITIAL_PATIENTS, scenarios as SCENARIOS } from '../data/initialPatients';
import { useKnapsackWorker } from './useKnapsackWorker';
import { buildBacktrackTree, getComplexityMetrics } from '../algorithms/knapsack';

// ── URL state encode/decode ────────────────────────────────────────────────────
function encodeState(patients, capacity, scenario) {
  try {
    const payload = { p: patients, c: capacity, s: scenario };
    return btoa(encodeURIComponent(JSON.stringify(payload)));
  } catch { return null; }
}

function decodeState(hash) {
  try {
    const raw = hash.startsWith('#state=') ? hash.slice(7) : null;
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(atob(raw)));
  } catch { return null; }
}

// ── Undo/Redo stack hook ───────────────────────────────────────────────────────
function useUndoRedo(initial) {
  const [stack, setStack] = useState({ past: [], present: initial, future: [] });

  const set = useCallback((newPresent) => {
    setStack(s => ({
      past: [...s.past.slice(-49), s.present],   // keep last 50
      present: typeof newPresent === 'function' ? newPresent(s.present) : newPresent,
      future: [],
    }));
  }, []);

  const undo = useCallback(() => {
    setStack(s => {
      if (s.past.length === 0) return s;
      const previous = s.past[s.past.length - 1];
      return { past: s.past.slice(0, -1), present: previous, future: [s.present, ...s.future] };
    });
  }, []);

  const redo = useCallback(() => {
    setStack(s => {
      if (s.future.length === 0) return s;
      const next = s.future[0];
      return { past: [...s.past, s.present], present: next, future: s.future.slice(1) };
    });
  }, []);

  return {
    patients: stack.present,
    setPatients: set,
    undo,
    redo,
    canUndo: stack.past.length > 0,
    canRedo: stack.future.length > 0,
  };
}

// ── Context ────────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Load from URL if present
  const urlState = useMemo(() => decodeState(window.location.hash), []);

  const [activeTab, setActiveTab]             = useState('dashboard');
  const [currentScenario, setCurrentScenario] = useState(urlState?.s || 'normal');
  const [capacity, setCapacity]               = useState(urlState?.c || { icu: 6, ventilator: 4, medicine: 10 });

  const {
    patients, setPatients,
    undo, redo, canUndo, canRedo,
  } = useUndoRedo(urlState?.p || INITIAL_PATIENTS);

  // Sync capacity when scenario changes (only when user explicitly picks scenario)
  const scenarioRef = useRef(currentScenario);
  useEffect(() => {
    if (currentScenario !== scenarioRef.current) {
      scenarioRef.current = currentScenario;
      const s = SCENARIOS[currentScenario];
      setCapacity({ icu: s.icu, ventilator: s.ventilator, medicine: s.medicine });
    }
  }, [currentScenario]);

  // ── DP via Web Worker ──
  const { solution: rawSolution, computing } = useKnapsackWorker(patients, capacity);

  // Always ensure selectedIndices is an array
  const solution = { ...rawSolution, selectedIndices: Array.isArray(rawSolution.selectedIndices) ? rawSolution.selectedIndices : [] };

  // ── Derived memos ──
  const backtrackingResult = useMemo(
    () => buildBacktrackTree(patients, capacity, Math.min(4, patients.length)),
    [patients, capacity]
  );

  const complexity = useMemo(
    () => getComplexityMetrics(patients.length, capacity.icu, capacity.ventilator, capacity.medicine),
    [patients.length, capacity]
  );

  // ── Patient mutations ──
  const addPatient = useCallback((patient) => {
    setPatients(prev => [...prev, { ...patient, id: Date.now() }]);
  }, [setPatients]);

  const removePatient = useCallback((id) => {
    setPatients(prev => prev.filter(p => p.id !== id));
  }, [setPatients]);

  const updatePatient = useCallback((id, updates) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, [setPatients]);

  const reorderPatients = useCallback((fromIdx, toIdx) => {
    setPatients(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return arr;
    });
  }, [setPatients]);

  // ── Capacity ──
  const updateCapacity = useCallback((key, value) => {
    setCapacity(prev => ({ ...prev, [key]: value }));
  }, []);

  // ── Helpers ──
  const isAllocated = useCallback(
    (idx) => solution.selectedIndices.includes(idx),
    [solution.selectedIndices]
  );

  // ── URL sharing ──
  const getShareableURL = useCallback(() => {
    const encoded = encodeState(patients, capacity, currentScenario);
    if (!encoded) return window.location.href;
    return `${window.location.origin}${window.location.pathname}#state=${encoded}`;
  }, [patients, capacity, currentScenario]);

  return (
    <AppContext.Provider value={{
      // State
      patients, activeTab, setActiveTab,
      currentScenario, setCurrentScenario,
      capacity, updateCapacity,
      // Solution
      solution, computing,
      // Derived
      backtrackingResult, complexity,
      // Patient actions
      addPatient, removePatient, updatePatient, reorderPatients,
      isAllocated,
      // Undo/Redo
      undo, redo, canUndo, canRedo,
      // Sharing
      getShareableURL,
      // Scenarios meta
      scenarios: SCENARIOS,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);