// src/algorithms/knapsack.js
export function solveKnapsack(patients, capacity) {
  const { icu: W, ventilator: V, medicine: M } = capacity;
  const N = patients.length;
  if (N === 0) return { maxScore: 0, selectedIndices: [], dpTable2D: [[0]], resourceUsage: { icu: 0, ventilator: 0, medicine: 0 } };
  const dp = Array(N + 1).fill(null).map(() =>
    Array(W + 1).fill(null).map(() =>
      Array(V + 1).fill(null).map(() => Array(M + 1).fill(0))
    )
  );
  for (let i = 1; i <= N; i++) {
    const { icu, ventilator, medicine, survivalScore } = patients[i - 1];
    for (let w = 0; w <= W; w++) {
      for (let v = 0; v <= V; v++) {
        for (let m = 0; m <= M; m++) {
          dp[i][w][v][m] = dp[i - 1][w][v][m];
          if (w >= icu && v >= ventilator && m >= medicine) {
            dp[i][w][v][m] = Math.max(dp[i][w][v][m], dp[i - 1][w - icu][v - ventilator][m - medicine] + survivalScore);
          }
        }
      }
    }
  }
  const selectedIndices = [];
  let w = W, v = V, m = M;
  for (let i = N; i >= 1; i--) {
    if (dp[i][w][v][m] !== dp[i - 1][w][v][m]) {
      selectedIndices.push(i - 1);
      w -= patients[i - 1].icu;
      v -= patients[i - 1].ventilator;
      m -= patients[i - 1].medicine;
    }
  }
  selectedIndices.reverse();
  const resourceUsage = selectedIndices.reduce((acc, idx) => ({
    icu: acc.icu + patients[idx].icu,
    ventilator: acc.ventilator + patients[idx].ventilator,
    medicine: acc.medicine + patients[idx].medicine
  }), { icu: 0, ventilator: 0, medicine: 0 });
  const dpTable2D = Array(N + 1).fill(null).map(() => Array(W + 1).fill(0));
  for (let i = 1; i <= N; i++) {
    for (let w = 0; w <= W; w++) {
      dpTable2D[i][w] = dpTable2D[i - 1][w];
      if (w >= patients[i - 1].icu) {
        dpTable2D[i][w] = Math.max(dpTable2D[i][w], dpTable2D[i - 1][w - patients[i - 1].icu] + patients[i - 1].survivalScore);
      }
    }
  }
  return { maxScore: dp[N][W][V][M], selectedIndices, dpTable2D, resourceUsage };
}

export function buildBacktrackTree(patients, capacity, maxDepth = 4) {
  const { icu: W, ventilator: V, medicine: M } = capacity;
  let nodeId = 0, bestScore = 0, bestPath = [];
  function buildNode(idx, usedICU, usedVent, usedMeds, score, path) {
    const currentId = nodeId++;
    const isPruned = usedICU > W || usedVent > V || usedMeds > M;
    const isLeaf = idx >= patients.length || idx >= maxDepth;
    if (!isPruned && isLeaf && score > bestScore) {
      bestScore = score;
      bestPath = [...path];
    }
    const node = {
      id: currentId,
      patientName: idx < patients.length ? patients[idx].name.split(' ')[0] : 'End',
      score, isPruned, isLeaf, isOptimal: false, children: []
    };
    if (!isPruned && !isLeaf && idx < patients.length) {
      const p = patients[idx];
      node.children.push(buildNode(idx + 1, usedICU + p.icu, usedVent + p.ventilator, usedMeds + p.medicine, score + p.survivalScore, [...path, true]));
      node.children.push(buildNode(idx + 1, usedICU, usedVent, usedMeds, score, [...path, false]));
    }
    return node;
  }
  const tree = buildNode(0, 0, 0, 0, 0, []);
  function markOptimal(node, path = []) {
    const isOnPath = path.length <= bestPath.length && path.every((v, i) => v === bestPath[i]);
    if (isOnPath) node.isOptimal = true;
    node.children.forEach((child, i) => markOptimal(child, [...path, i === 0]));
  }
  markOptimal(tree);
  return { tree, bestScore, totalNodes: nodeId };
}

export function getComplexityMetrics(N, W, V, M) {
  const dpOps = N * W * V * M;
  const bfOps = Math.pow(2, N);
  return {
    dp: { time: `O(${N}×${W}×${V}×${M}) = ${dpOps.toLocaleString()} ops`, space: `${(dpOps * 8 / 1024).toFixed(2)} KB`, operations: dpOps },
    bruteForce: { time: `O(2^${N}) = ${bfOps.toLocaleString()} ops`, space: `O(${N})`, operations: bfOps },
    greedy: { time: `O(${N} log ${N}) = ${Math.ceil(N * Math.log2(N || 1))} ops`, space: `O(${N})`, operations: Math.ceil(N * Math.log2(N || 1)) },
    speedup: dpOps > 0 ? (bfOps / dpOps).toFixed(2) : 'N/A'
  };
}
