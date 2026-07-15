export const initialPatients = [
  { id: 1, name: "Arjun Sharma", age: 67, condition: "Critical", survivalScore: 9, icu: 2, ventilator: 1, medicine: 3 },
  { id: 2, name: "Priya Patel", age: 45, condition: "Severe", survivalScore: 7, icu: 1, ventilator: 1, medicine: 2 },
  { id: 3, name: "Rohan Gupta", age: 34, condition: "Moderate", survivalScore: 5, icu: 1, ventilator: 0, medicine: 2 },
  { id: 4, name: "Ananya Reddy", age: 72, condition: "Critical", survivalScore: 8, icu: 2, ventilator: 1, medicine: 4 },
  { id: 5, name: "Vikram Singh", age: 55, condition: "Stable", survivalScore: 4, icu: 1, ventilator: 0, medicine: 1 }
];
export const scenarios = {
  normal: { name: "Normal Load", icu: 6, ventilator: 4, medicine: 10, icon: "Activity" },
  surge: { name: "Surge Crisis", icu: 3, ventilator: 2, medicine: 5, icon: "AlertTriangle" },
  ample: { name: "Ample Resources", icu: 10, ventilator: 8, medicine: 15, icon: "TrendingUp" },
  lockdown: { name: "Lockdown Scarcity", icu: 2, ventilator: 1, medicine: 3, icon: "Lock" }
};
export const conditionColors = {
  Critical: { bg: 'var(--danger-bg)', text: 'var(--danger)' },
  Severe: { bg: 'var(--warning-bg)', text: 'var(--warning)' },
  Moderate: { bg: 'var(--info-bg)', text: 'var(--info)' },
  Stable: { bg: 'var(--success-bg)', text: 'var(--success)' }
};