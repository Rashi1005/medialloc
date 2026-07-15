import { useState, useMemo } from 'react';

// Use env variable with localhost fallback for flexibility across environments
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
const conditionPriority = { Critical: 4, Severe: 3, Moderate: 2, Stable: 1 };

export function usePatients(patients) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [filterCondition, setFilterCondition] = useState('All');

  const filtered = useMemo(() => {
    return patients
      .map((p, idx) => ({ ...p, _origIdx: idx }))
      .filter(p => {
        const matchSearch =
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.condition.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filterCondition === 'All' || p.condition === filterCondition;
        return matchSearch && matchFilter;
      })
      .sort((a, b) => {
        // Use survivalScore (frontend field name) for sorting
        if (sortBy === 'score')     return (b.survivalScore ?? b.survival ?? 0) - (a.survivalScore ?? a.survival ?? 0);
        if (sortBy === 'condition') return (conditionPriority[b.condition] || 0) - (conditionPriority[a.condition] || 0);
        if (sortBy === 'name')      return a.name.localeCompare(b.name);
        return 0;
      });
  }, [patients, search, sortBy, filterCondition]);

  const stats = useMemo(() => ({
    total: patients.length,
    critical: patients.filter(p => p.condition === 'Critical').length,
    severe: patients.filter(p => p.condition === 'Severe').length,
    moderate: patients.filter(p => p.condition === 'Moderate').length,
    stable: patients.filter(p => p.condition === 'Stable').length,
    // Use survivalScore (frontend field name); fall back to survival (backend field) if needed
    avgScore: patients.length > 0
      ? (patients.reduce((s, p) => s + (p.survivalScore ?? p.survival ?? 0), 0) / patients.length).toFixed(1)
      : 0,
  }), [patients]);

  // CRUD API functions
  const addPatient = async (patient) => {
    try {
      const res = await fetch(`${API_BASE}/api/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patient)
      });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      return { ...patient, id: Date.now().toString() };
    }
  };

  const updatePatient = async (id, updates) => {
    try {
      const res = await fetch(`${API_BASE}/api/patients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      return { id, ...updates };
    }
  };

  const deletePatient = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/patients/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      return true;
    } catch {
      return false;
    }
  };

  const reorderPatients = async (orderArr) => {
    try {
      const res = await fetch(`${API_BASE}/api/patients/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderArr)
      });
      if (!res.ok) throw new Error();
      return true;
    } catch {
      return false;
    }
  };

  return {
    filtered,
    stats,
    search, setSearch,
    sortBy, setSortBy,
    filterCondition, setFilterCondition,
    addPatient,
    updatePatient,
    deletePatient,
    reorderPatients,
  };
}