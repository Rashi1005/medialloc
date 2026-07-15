import { useState, useEffect } from 'react';
import { solveKnapsack } from '../algorithms/knapsack';
// Use env variable with localhost fallback for flexibility across environments
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export function useAllocation(patients, caps) {
  const [result, setResult] = useState({});
  useEffect(() => {
    if (!patients || !patients.length) return;
    fetch(`${API_BASE}/api/algorithm/solve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caps, patient_ids: patients.map(p => p.id) })
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setResult(data))
      .catch(() => {
        // fallback: client-side knapsack (already statically imported — no async needed)
        setResult(solveKnapsack(patients, caps));
      });
  }, [patients, caps]);

  const allocated = result.allocated || [];
  const deferred = result.deferred || [];
  const totalPossibleScore = result.totalPossibleScore || 0;
  const efficiency = result.efficiency || 0;
  const usedIcu = result.usedIcu || 0;
  const usedVent = result.usedVent || 0;
  const usedMeds = result.usedMeds || 0;
  const maxScore = result.maxScore || 0;
  const dpTable2d = result.dpTable2d || [];
  const backtrackNodes = result.backtrackNodes || [];
  const complexity = result.complexity || {};

  return {
    allocated,
    deferred,
    totalPossibleScore,
    efficiency,
    usedIcu,
    usedVent,
    usedMeds,
    maxScore,
    dpTable2d,
    backtrackNodes,
    complexity,
    result,
  };
}