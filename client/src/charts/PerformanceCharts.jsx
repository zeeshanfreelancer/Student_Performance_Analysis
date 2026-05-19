import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function SubjectBarChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="marks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="average" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AttendanceLineChart({ data = [] }) {
  const formatted = data.map((d) => ({
    name: `${d._id?.month}/${d._id?.year}`,
    present: d.present,
    absent: d.absent,
    late: d.late,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} />
        <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} />
        <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function GradePieChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function GrowthAreaChart({ data = [] }) {
  const formatted = data.map((d) => ({
    name: `${d._id?.month}/${d._id?.year}`,
    count: d.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function AttendanceHeatmap({ calendar = [] }) {
  const statusColors = {
    present: 'bg-green-500',
    absent: 'bg-red-500',
    late: 'bg-yellow-500',
    leave: 'bg-blue-500',
  };

  return (
    <div className="grid grid-cols-7 gap-1">
      {calendar.slice(0, 28).map((item, i) => (
        <div
          key={i}
          title={`${item.date}: ${item.status}`}
          className={`aspect-square rounded ${statusColors[item.status] || 'bg-gray-200 dark:bg-gray-700'}`}
        />
      ))}
    </div>
  );
}
