"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ReferenceLine } from "recharts";
import { Activity, AlertTriangle, MessageSquare, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";

// Mock Data
const featureData = [
  { feature: "Battery Life", positive: 65, neutral: 10, negative: 25 },
  { feature: "Display Quality", positive: 85, neutral: 10, negative: 5 },
  { feature: "Camera", positive: 90, neutral: 5, negative: 5 },
  { feature: "Build Quality", positive: 70, neutral: 15, negative: 15 },
  { feature: "Software", positive: 50, neutral: 20, negative: 30 },
];

const trendData = Array.from({ length: 15 }).map((_, i) => ({
  batch: \`Batch \${i + 1}\`,
  negativeRate: i === 12 ? 45 : 10 + Math.random() * 5,
  isAnomaly: i === 12
}));

const mockAlerts = [
  { id: 1, feature: "Battery Life", severity: "critical", msg: "Complaints reached 45% (up from 12%). Likely a systemic batch issue.", time: "10m ago" },
  { id: 2, feature: "Software", severity: "high", msg: "Negative mentions rose to 30%. Monitor closely.", time: "2h ago" },
];

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">Loading Engine...</div>;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-200 p-8 font-sans selection:bg-purple-500/30">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header section w/ Glassmorphism */}
        <header className="flex justify-between items-end pb-6 border-b border-white/5 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 blur-[100px] -z-10" />
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Xenon Intelligence
            </h1>
            <p className="text-slate-400 font-medium">Real-time NLP telemetry & anomaly detection</p>
          </div>
          <div className="flex items-center space-x-3 text-sm font-semibold tracking-wide">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400">PIPELINE ACTIVE</span>
          </div>
        </header>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Total Reviews" value="1,284" sub="Last 30 days" icon={<MessageSquare className="w-5 h-5 text-blue-400" />} />
          <MetricCard title="Avg Sentiment" value="78%" sub="+2.5% from last week" icon={<Activity className="w-5 h-5 text-emerald-400" />} />
          <MetricCard title="Active Alerts" value="2" sub="Requires attention" icon={<AlertTriangle className="w-5 h-5 text-rose-400" />} highlight />
          <MetricCard title="Anomaly Z-Score" value="2.4σ" sub="Peak observed today" icon={<TrendingUp className="w-5 h-5 text-purple-400" />} />
        </div>

        {/* 60/40 Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Feature Sentiment Chart (60%) */}
          <Card className="lg:col-span-8 bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/[0.07] transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white">Sentiment by Feature</CardTitle>
              <CardDescription className="text-slate-400">Extracted securely via Claude API</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={featureData} layout="vertical" margin={{ left: 100, right: 30 }}>
                    <XAxis type="number" domain={[0, 100]} tickFormatter={v => \`\${v}%\`} stroke="#555" />
                    <YAxis type="category" dataKey="feature" width={100} stroke="#aaa" tickLine={false} axisLine={false} />
                    <Tooltip 
                      formatter={(v: number) => \`\${v}%\`} 
                      contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333', color: '#fff', borderRadius: '8px' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="positive" stackId="a" fill="#10B981" name="Positive" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="neutral" stackId="a" fill="#64748B" name="Neutral" />
                    <Bar dataKey="negative" stackId="a" fill="#EF4444" name="Negative" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Alert Feed (40%) */}
          <Card className="lg:col-span-4 bg-white/5 border-white/10 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white flex items-center justify-between">
                <span>Systemic Alerts</span>
                <Badge variant="destructive" className="bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 font-mono tracking-wider ml-2">2 NEW</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockAlerts.map(alert => (
                <div key={alert.id} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all group cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <Badge className={alert.severity === 'critical' ? 'bg-rose-500 hover:bg-rose-600 border-none' : 'bg-amber-500 hover:bg-amber-600 border-none'}>
                      {alert.feature}
                    </Badge>
                    <span className="text-xs text-slate-500 font-mono">{alert.time}</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed font-medium">{alert.msg}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Full width trend line chart */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/[0.06] transition-all">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-white">Trend Volatility (Z-Score Timeline)</CardTitle>
                <CardDescription className="text-slate-400">Rolling window comparison of battery_life negative sentiment</CardDescription>
              </div>
              <Badge variant="outline" className="text-purple-400 border-purple-500/30 bg-purple-500/10 px-3 py-1 font-mono text-xs">Z-SCORE {'>'} 2.0 ANOMALY</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="batch" stroke="#555" tickLine={false} axisLine={false} />
                  <YAxis stroke="#555" tickLine={false} axisLine={false} tickFormatter={v => \`\${v}%\`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333', color: '#fff', borderRadius: '8px', border: '1px solid #333' }}
                    formatter={(val: number) => [\`\${val.toFixed(1)}%\`, "Negative Pct"]} 
                    labelStyle={{ color: '#aaa', marginBottom: '8px', display: 'block' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="negativeRate" 
                    stroke="#8B5CF6" 
                    strokeWidth={3}
                    dot={{ fill: '#8B5CF6', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 8, fill: '#C084FC', stroke: '#fff', strokeWidth: 2 }}
                  />
                  <ReferenceLine x="Batch 13" stroke="#EF4444" strokeDasharray="3 3">
                  </ReferenceLine>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, sub, icon, highlight = false }: any) {
  return (
    <Card className={\`border-white/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 \${highlight ? 'bg-gradient-to-br from-rose-500/10 to-orange-500/5 shadow-[0_0_30px_-5px_rgba(244,63,94,0.3)] border-rose-500/20' : 'bg-white/5 hover:bg-white/10'}\`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative overflow-hidden">
        <CardTitle className="text-sm font-medium text-slate-400 z-10">{title}</CardTitle>
        <div className="z-10">{icon}</div>
        {highlight && <div className="absolute -top-10 -right-10 w-20 h-20 bg-rose-500/20 blur-2xl rounded-full" />}
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-extrabold text-white tracking-tight">{value}</div>
        <p className={\`text-xs mt-1 font-medium \${highlight ? 'text-rose-400' : 'text-slate-500'}\`}>{sub}</p>
      </CardContent>
    </Card>
  );
}
