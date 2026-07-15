import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useKnapsack — manages DP table animation state
 * Encapsulates play/pause/step/reset/speed logic
 */
export function useKnapsack(patients, capacity) {
  const [step, setStep]       = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed]     = useState(80);   // ms per cell
  const [completed, setCompleted] = useState(new Set());

  const intervalRef = useRef(null);
  const stepsRef    = useRef([]);

  // Rebuild step list when patients/capacity change
  useEffect(() => {
    const steps = [];
    // The actual DP is 4D: N × W × V × M — track all combinations for accurate progress
    for (let i = 1; i <= patients.length; i++)
      for (let j = 0; j <= capacity.icu; j++)
        for (let v = 0; v <= capacity.ventilator; v++)
          for (let m = 0; m <= capacity.medicine; m++)
            steps.push({ i, j, v, m });
    stepsRef.current = steps;
    // Reset
    clearInterval(intervalRef.current);
    setStep(0);
    setRunning(false);
    setCompleted(new Set());
  }, [patients, capacity]);

  // Cleanup on unmount
  useEffect(() => () => clearInterval(intervalRef.current), []);

  const goToStep = useCallback((target) => {
    const nc = new Set();
    for (let k = 0; k < target; k++) {
      const s = stepsRef.current[k];
      if (s) nc.add(`${s.i}-${s.j}-${s.v}-${s.m}`);
    }
    setCompleted(nc);
    setStep(target);
  }, []);

  const play = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(true);
    let cur = step;
    intervalRef.current = setInterval(() => {
      if (cur >= stepsRef.current.length) {
        clearInterval(intervalRef.current);
        setRunning(false);
        return;
      }
      const s = stepsRef.current[cur];
      setCompleted(prev => new Set([...prev, `${s.i}-${s.j}-${s.v}-${s.m}`]));
      setStep(prev => prev + 1);
      cur++;
    }, speed);
  }, [step, speed]);

  const pause = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    clearInterval(intervalRef.current);
    setCompleted(new Set());
    setStep(0);
    setRunning(false);
  }, []);

  const stepForward = useCallback(() => {
    goToStep(Math.min(stepsRef.current.length, step + 1));
  }, [step, goToStep]);

  const stepBack = useCallback(() => {
    goToStep(Math.max(0, step - 1));
  }, [step, goToStep]);

  const totalSteps = stepsRef.current.length;
  const progress   = totalSteps > 0 ? Math.round((step / totalSteps) * 100) : 0;
  const currentCell = stepsRef.current[step - 1] || null;
  const isDone     = step >= totalSteps && totalSteps > 0;

  return {
    step, running, speed, setSpeed,
    completed, currentCell,
    totalSteps, progress, isDone,
    play, pause, reset, stepForward, stepBack,
  };
}