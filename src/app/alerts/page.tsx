import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AlertsPage() {
  const alerts = [
    { id: 1, feature: "Battery Life", severity: "critical", msg: "Complaints reached 45% (up from 12%). Likely a systemic batch issue. Recommended action: audit battery supply chain.", current: 45, prev: 12 },
    { id: 2, feature: "Software", severity: "high", msg: "Negative mentions rose to 30%. Monitor closely.", current: 30, prev: 15 },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-200 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-white/10 pb-6">
          <h1 className="text-3xl font-bold text-white">Active Alerts</h1>
          <p className="text-slate-400">Manage and resolve anomaly detections</p>
        </header>
        
        <div className="space-y-4">
          {alerts.map(alert => (
            <Card key={alert.id} className="bg-white/5 border-white/10 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Badge className={alert.severity === 'critical' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-amber-500 hover:bg-amber-600'}>
                    {alert.feature}
                  </Badge>
                  <span className="text-sm font-mono text-rose-400 bg-rose-500/10 px-2 py-1 rounded">
                    {alert.prev}% ➔ {alert.current}%
                  </span>
                </div>
                <Button variant="outline" className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10">Mark Resolved</Button>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 font-medium">{alert.msg}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
