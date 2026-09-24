import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="stat-card">
      <h3>{label}</h3>
      <p>{value}</p>
    </div>
  );
}

export default StatCard;
