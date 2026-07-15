# 🏥 MediAlloc — Hospital Resource Allocation System

[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)


MediAlloc is a web-based simulation and visualization tool that solves the critical real-world problem of allocating limited hospital resources — ICU beds, ventilators, and medicines — to patients in a way that **maximizes total survival score** using the **0/1 Multi-Dimensional Knapsack Algorithm**.

---

## 🎯 Problem Statement

During medical emergencies, hospitals face a hard combinatorial optimization problem:

- **N patients**, each requiring specific ICU beds, ventilators, and medicines
- **Fixed capacity**: W ICU beds, V ventilators, M medicine units
- **Survival scores** (1–10) representing urgency and treatment benefit
- **Goal**: Maximize total survival score without exceeding resource capacity

This is the **0/1 Multi-Dimensional Knapsack Problem** — an NP-hard combinatorial optimization problem.

---

## ✨ Features

| Module | Description | Algorithm |
|--------|-------------|-----------|
| 📊 **Dashboard** | Real-time allocation overview, scenario simulator | Knapsack Output |
| 👥 **Patient Registry** | Add/remove patients with resource requirements | DP Input |
| 📈 **DP Table Visualizer** | Animated cell-by-cell DP table filling | 0/1 Knapsack DP |
| 🌳 **Backtracking Explorer** | Decision tree with pruning visualization | Backtracking |
| ⚡ **Complexity Panel** | Algorithm comparison with live metrics | Analysis |
| 📄 **Report Generator** | Exportable allocation reports | Summary |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Rashi1005/medialloc.git

# Navigate to project
cd medialloc

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Icons**: Lucide React
- **Fonts**: Inter + JetBrains Mono

---

## 📁 Project Structure

```
medialloc/
├── src/
│   ├── algorithms/
│   │   ├── knapsack.js          # 4D DP algorithm
│   │   └── backtracking.js      # Tree generation
│   ├── components/
│   │   ├── layout/              # Sidebar, Header, Layout
│   │   ├── dashboard/           # Stats, Scenarios, Sliders
## 🏃‍♂️ How to Run (Frontend & Backend)

### 1. Start the Backend (API Server)

```bash
cd backend
python -m venv venv  # Create virtual environment (optional)
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
Backend runs at: http://localhost:8000

### 2. Start the Frontend (React App)

```bash
cd ..  # If inside backend folder
npm install
npm run dev
```
Frontend runs at: http://localhost:3000 or http://localhost:5173

│   │   ├── visualization/       # DP Table, Backtracking Tree
│   │   ├── analysis/            # Complexity Panel
│   │   ├── report/              # Report Generator
│   │   └── ui/                  # Reusable components
│   ├── context/
│   │   └── AppContext.jsx       # Global state
│   ├── data/
│   │   └── initialPatients.js   # Sample data
│   └── styles/
│       └── index.css            # Global styles
├── package.json
└── vite.config.js
```

---

## 🧮 Algorithm Details

### Dynamic Programming Recurrence

```
dp[i][w][v][m] = max(
  dp[i-1][w][v][m],                                          // Exclude
  dp[i-1][w-icu[i]][v-vent[i]][m-med[i]] + survival[i]       // Include
)
```

### Complexity Analysis

| Algorithm | Time | Space | Optimal? |
|-----------|------|-------|----------|
| Brute Force | O(2^N) | O(N) | ✅ |
| Backtracking | O(2^N) | O(N) | ✅ |
| **DP (Used)** | **O(N×W×V×M)** | **O(N×W×V×M)** | ✅ |
| Greedy | O(N log N) | O(N) | ❌ |

---
