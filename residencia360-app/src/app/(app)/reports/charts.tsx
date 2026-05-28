"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const STATUS_COLORS = ["#1d4ed8", "#0ea5e9", "#22c55e", "#f97316", "#ef4444", "#8b5cf6"];

export function VisitsTimelineChart({ data }: { data: { date: string; visits: number }[] }) {
  if (data.length === 0) {
    return <EmptyState message="Sin visitas en el rango seleccionado." />;
  }
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 16, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Line type="monotone" dataKey="visits" stroke="#1d4ed8" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusBarChart({ title, data }: { title?: string; data: { name: string; value: number }[] }) {
  if (data.length === 0) {
    return <EmptyState message={`Sin datos${title ? ` de ${title}` : ""}.`} />;
  }
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 16, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="value">
            {data.map((_, idx) => (
              <Cell key={idx} fill={STATUS_COLORS[idx % STATUS_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PriorityPieChart({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) {
    return <EmptyState message="Sin PQRS para graficar prioridades." />;
  }
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label>
            {data.map((_, idx) => (
              <Cell key={idx} fill={STATUS_COLORS[idx % STATUS_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">{message}</div>
  );
}
