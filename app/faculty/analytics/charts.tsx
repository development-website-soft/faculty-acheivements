'use client'
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts'


export default function Charts({ rows }:{ rows: Array<{ label:string; total:number; research:number; university:number; community:number; teaching:number }> }){
return (
<div className="grid gap-6 md:grid-cols-2">
<div className="rounded-2xl border bg-white p-3">
<div className="text-sm font-medium mb-2">Total by Cycle</div>
<div style={{ width: '100%', height: 280 }}>
<ResponsiveContainer>
<LineChart data={rows} margin={{ left: 8, right: 8, top: 10, bottom: 10 }}>
<CartesianGrid strokeDasharray="3 3" />
<XAxis dataKey="label" />
<YAxis />
<Tooltip />
<Legend />
<Line type="monotone" dataKey="total" />
</LineChart>
</ResponsiveContainer>
</div>
</div>
<div className="rounded-2xl border bg-white p-3">
<div className="text-sm font-medium mb-2">Section Breakdown (Stacked)</div>
<div style={{ width: '100%', height: 280 }}>
<ResponsiveContainer>
<BarChart data={rows} margin={{ left: 8, right: 8, top: 10, bottom: 10 }}>
<CartesianGrid strokeDasharray="3 3" />
<XAxis dataKey="label" />
<YAxis />
<Tooltip />
<Legend />
<Bar dataKey="research" stackId="a" />
<Bar dataKey="university" stackId="a" />
<Bar dataKey="community" stackId="a" />
<Bar dataKey="teaching" stackId="a" />
</BarChart>
</ResponsiveContainer>
</div>
</div>
</div>
)
}