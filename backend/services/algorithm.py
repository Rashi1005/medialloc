
import math
from datetime import datetime, timezone
from typing import List, Dict, Any

def normalize(p: Dict) -> Dict:
    """
    Normalize patient field names.
    Frontend uses: survivalScore, ventilator, medicine
    Backend needs: survival, vent, meds
    """
    return {
        "id":        str(p.get("id", p.get("_id", ""))),
        "name":      p.get("name", ""),
        "age":       p.get("age", 0),
        "condition": p.get("condition", ""),
        "survival":  p.get("survival",  p.get("survivalScore", 0)),
        "icu":       p.get("icu", 0),
        "vent":      p.get("vent",      p.get("ventilator", 0)),
        "meds":      p.get("meds",      p.get("medicine", 0)),
        "order":     p.get("order", 0),
    }

# 4D Knapsack DP
async def solve_knapsack(patients: List[Dict], caps: Dict[str, int]) -> Dict[str, Any]:
    # Normalize all patients first
    patients = [normalize(p) for p in patients]

    # Normalize caps too — frontend may send ventilator/medicine
    caps = {
        "icu":  caps.get("icu", 6),
        "vent": caps.get("vent", caps.get("ventilator", 4)),
        "meds": caps.get("meds", caps.get("medicine", 10)),
    }

    n = len(patients)
    W, V, M = caps['icu'], caps['vent'], caps['meds']

    dp = [
        [
            [
                [0 for _ in range(M + 1)]
                for _ in range(V + 1)
            ]
            for _ in range(W + 1)
        ]
        for _ in range(n + 1)
    ]

    totalPossibleScore = sum(p['survival'] for p in patients)
    dpOperations = 0

    # Fill DP table
    for i in range(1, n + 1):
        p = patients[i - 1]
        for w in range(W + 1):
            for v in range(V + 1):
                for m in range(M + 1):
                    dpOperations += 1
                    dp[i][w][v][m] = dp[i - 1][w][v][m]  # exclude
                    if w >= p['icu'] and v >= p['vent'] and m >= p['meds']:
                        include = (
                            dp[i-1][w - p['icu']][v - p['vent']][m - p['meds']]
                            + p['survival']
                        )
                        if include > dp[i][w][v][m]:
                            dp[i][w][v][m] = include

    # Traceback to find selected patients
    w, v, m = W, V, M
    allocated = []
    deferred  = []
    usedIcu = usedVent = usedMeds = 0

    for i in range(n, 0, -1):
        p = patients[i - 1]
        if (w >= p['icu'] and v >= p['vent'] and m >= p['meds'] and
            dp[i][w][v][m] == dp[i-1][w-p['icu']][v-p['vent']][m-p['meds']] + p['survival']):
            allocated.append(p)
            usedIcu  += p['icu']
            usedVent += p['vent']
            usedMeds += p['meds']
            w -= p['icu']
            v -= p['vent']
            m -= p['meds']
        else:
            deferred.append(p)

    allocated = list(reversed(allocated))
    deferred  = list(reversed(deferred))

    maxScore   = dp[n][W][V][M]
    efficiency = round((maxScore / totalPossibleScore) * 100, 2) if totalPossibleScore else 0

    bruteForceOps       = 2 ** n
    speedup             = round(bruteForceOps / dpOperations, 2) if dpOperations else 1
    combinationsChecked = bruteForceOps

    # 2D DP table (ICU dimension only — for frontend visualization)
    dpTable2d = [[0] * (W + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        p = patients[i - 1]
        for ww in range(W + 1):
            dpTable2d[i][ww] = dpTable2d[i - 1][ww]
            if ww >= p['icu']:
                val = dpTable2d[i - 1][ww - p['icu']] + p['survival']
                if val > dpTable2d[i][ww]:
                    dpTable2d[i][ww] = val

    # Backtracking tree (first 4 patients, max 80 nodes)
    backtrackNodes = []

    def build_tree(idx, rem_w, rem_v, rem_m, path, score, parentId, depth):
        if depth > 4 or len(backtrackNodes) >= 80:
            return
        feasible = rem_w >= 0 and rem_v >= 0 and rem_m >= 0
        isLeaf   = idx >= min(4, len(patients))
        node_id  = f"{idx}-{rem_w}-{rem_v}-{rem_m}-{score}"

        backtrackNodes.append({
            "id":       node_id,
            "depth":    depth,
            "score":    score,
            "usedIcu":  W - rem_w,
            "usedVent": V - rem_v,
            "usedMeds": M - rem_m,
            "feasible": feasible,
            "isLeaf":   isLeaf,
            "path":     path.copy(),
            "parentId": parentId,
        })

        if isLeaf or not feasible:
            return

        p = patients[idx]
        # Branch 1: Include patient
        if rem_w >= p['icu'] and rem_v >= p['vent'] and rem_m >= p['meds']:
            build_tree(
                idx + 1,
                rem_w - p['icu'], rem_v - p['vent'], rem_m - p['meds'],
                path + [p['id']],
                score + p['survival'],
                node_id, depth + 1
            )
        # Branch 2: Exclude patient
        build_tree(idx + 1, rem_w, rem_v, rem_m, path, score, node_id, depth + 1)

    build_tree(0, W, V, M, [], 0, None, 0)

    return {
        "maxScore":           maxScore,
        "totalPossibleScore": totalPossibleScore,
        "efficiency":         efficiency,
        "allocated":          allocated,
        "deferred":           deferred,
        "usedIcu":            usedIcu,
        "usedVent":           usedVent,
        "usedMeds":           usedMeds,
        "dpTable2d":          dpTable2d,
        "backtrackNodes":     backtrackNodes,
        "complexity": {
            "n":                   n,
            "W":                   W,
            "V":                   V,
            "M":                   M,
            "dpOperations":        dpOperations,
            "bruteForceOps":       bruteForceOps,
            "speedup":             speedup,
            "combinationsChecked": combinationsChecked,
        },
        "computedAt": datetime.now(timezone.utc).isoformat(),
    }

async def get_presets():
    return [
        {"name": "Standard Operations", "key": "normal",   "caps": {"icu": 6,  "vent": 4, "meds": 10}},
        {"name": "Mass Casualty Event", "key": "surge",    "caps": {"icu": 3,  "vent": 2, "meds": 5}},
        {"name": "Full Capacity",       "key": "ample",    "caps": {"icu": 10, "vent": 8, "meds": 15}},
        {"name": "Scarcity Protocol",   "key": "lockdown", "caps": {"icu": 2,  "vent": 1, "meds": 3}},
    ]
