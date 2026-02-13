import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Tooltip,
} from 'recharts';

export default function RadarChartComponent({ data, title, color = '#4F46E5' }) {
  const chartData = data.map(item => ({
    domain: item.domain,
    score: Math.round(item.normalized_score * 100),
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      {title && <h3 className="text-base font-semibold text-gray-900 mb-3">{title}</h3>}
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="domain" tick={{ fontSize: 11, fill: '#475569' }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <Tooltip formatter={(value) => [`${value}%`, 'Score']} contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px' }} />
          <Radar name="Score" dataKey="score" stroke={color} fill={color} fillOpacity={0.25} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
