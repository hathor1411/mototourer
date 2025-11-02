import { LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

export default function ElevationChart({ data }) {
  if (!data || data.length === 0) return null;

  const chartData = data.map((elevation, i) => ({
    index: i,
    elevation,
  }));

  return (
    <LineChart width={300} height={100} data={chartData}>
      <XAxis dataKey="index" hide />
      <YAxis hide domain={['auto', 'auto']} />
      <Tooltip />
      <Line type="monotone" dataKey="elevation" stroke="#0077ff" dot={false} />
    </LineChart>
  );
}
