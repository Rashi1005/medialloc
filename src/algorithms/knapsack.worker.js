// src/algorithms/knapsack.worker.js
self.onmessage = ({ data: { patients, capacity } }) => {
  const { icu: W, ventilator: V, medicine: M } = capacity;
  const N = patients.length;

  if (N === 0) {
    self.postMessage({
      maxScore: 0, selectedIndices: [], dpTable2D: [[0]],
      resourceUsage: { icu: 0, ventilator: 0, medicine: 0 },
      dpOptimalCells: []
    });
    return;
  }

  const dp = Array(N + 1).fill(null).map(() =>
    Array(W + 1).fill(null).map(() =>
      Array(V + 1).fill(null).map(() => Array(M + 1).fill(0))
    )
  );

  for (let i = 1; i <= N; i++) {
    const { icu, ventilator, medicine, survivalScore } = patients[i - 1];
    for (let w = 0; w <= W; w++)
      for (let v = 0; v <= V; v++)
        for (let m = 0; m <= M; m++) {
          dp[i][w][v][m] = dp[i - 1][w][v][m];
          if (w >= icu && v >= ventilator && m >= medicine)
            dp[i][w][v][m] = Math.max(dp[i][w][v][m], dp[i-1][w-icu][v-ventilator][m-medicine] + survivalScore);
        }
  }

  // Traceback selected patients
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

  // 2D DP table (ICU dimension only — for visualization)
  const dpTable2D = Array(N + 1).fill(null).map(() => Array(W + 1).fill(0));
  for (let i = 1; i <= N; i++) {
    for (let j = 0; j <= W; j++) {
      dpTable2D[i][j] = dpTable2D[i - 1][j];
      if (j >= patients[i - 1].icu)
        dpTable2D[i][j] = Math.max(dpTable2D[i][j], dpTable2D[i - 1][j - patients[i - 1].icu] + patients[i - 1].survivalScore);
    }
  }

  // Compute optimal path cells in 2D table for highlight
  // We trace back through the 2D projection
  const dpOptimalCells = [];
  let tw = W;
  for (let i = N; i >= 1; i--) {
    dpOptimalCells.push(`${i}-${tw}`);
    if (tw >= patients[i-1].icu && dpTable2D[i][tw] === dpTable2D[i-1][tw - patients[i-1].icu] + patients[i-1].survivalScore
        && dpTable2D[i][tw] !== dpTable2D[i-1][tw]) {
      tw -= patients[i - 1].icu;
    }
  }

  const resourceUsage = selectedIndices.reduce((acc, idx) => ({
    icu: acc.icu + patients[idx].icu,
    ventilator: acc.ventilator + patients[idx].ventilator,
    medicine: acc.medicine + patients[idx].medicine
  }), { icu: 0, ventilator: 0, medicine: 0 });

  self.postMessage({ maxScore: dp[N][W][V][M], selectedIndices, dpTable2D, resourceUsage, dpOptimalCells });
};