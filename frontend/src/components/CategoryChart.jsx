import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const palette = ['#6366f1', '#f97316', '#10b981', '#ef4444', '#facc15', '#8b5cf6', '#22d3ee', '#fb7185', '#a855f7'];

function CategoryChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="chart-card">No expense breakdown available yet.</div>;
  }

  return (
    <div className="chart-card">
      <h2>Expense Breakdown</h2>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie data={data} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={110} label />
          {data.map((entry, index) => (
            <Cell key={entry.category} fill={palette[index % palette.length]} />
          ))}
          <Tooltip formatter={(value) => `₹ ${Number(value).toLocaleString()}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default CategoryChart;
