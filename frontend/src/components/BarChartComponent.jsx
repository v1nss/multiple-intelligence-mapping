import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const COLORS = ['#4F46E5', '#0891B2', '#059669', '#D97706', '#DC2626', '#7C3AED', '#DB2777', '#16A34A', '#6366F1'];

export default function BarChartComponent({ data, title, dataKey = 'score', nameKey = 'name', color }) {
  const chartData = data.map(item => ({
    name: item[nameKey] || item.strand || item.domain || item.career,
    value: typeof item[dataKey] === 'number' ? Math.round(item[dataKey] * 100) : item[dataKey],
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      {title && <h3 className="text-base font-semibold text-gray-900 mb-3">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: '#475569' }} />
          <Tooltip formatter={(value) => [`${value}%`, 'Score']} contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
            {chartData.map((_, index) => (
              <Cell key={index} fill={color || COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
