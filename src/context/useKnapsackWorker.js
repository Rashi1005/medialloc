import { useEffect, useRef, useState } from 'react';

export function useKnapsackWorker(patients, capacity) {
  const [solution, setSolution] = useState({
    maxScore: 0, selectedIndices: [], dpTable2D: [[0]],
    resourceUsage: { icu: 0, ventilator: 0, medicine: 0 }
  });
  const [computing, setComputing] = useState(false);
  const workerRef = useRef(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../algorithms/knapsack.worker.js', import.meta.url),
      { type: 'module' }
    );
    workerRef.current.onmessage = ({ data }) => {
      setSolution(data);
      setComputing(false);
    };
    return () => workerRef.current?.terminate();
  }, []);

  useEffect(() => {
    setComputing(true);
    workerRef.current?.postMessage({ patients, capacity });
  }, [patients, capacity]);

  return { solution, computing };
}
