import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ReviewQueue() {
  const reviews = [
    { id: "1", text: "Oh wow, 2 hours of battery life. Absolutely revolutionary technology.", lang: "en", flag: "Sarcastic", reason: "Sarcasm flag applied based on extreme contrast." },
    { id: "2", text: "Product arrived. It's okay.", lang: "en", flag: "Ambiguous", reason: "Unable to determine strong sentiment." },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-200 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="border-b border-white/10 pb-6">
          <h1 className="text-3xl font-bold text-white">Review Queue</h1>
          <p className="text-slate-400">Human validation for ambiguous or sarcastic reviews</p>
        </header>

        <Card className="bg-white/5 border-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">Pending Validation (2)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviews.map(r => (
              <div key={r.id} className="p-4 border border-white/10 rounded-xl bg-white/[0.02]">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex space-x-2 items-center">
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">{r.flag}</Badge>
                    <Badge variant="outline" className="text-xs text-slate-500 border-white/10">{r.lang.toUpperCase()}</Badge>
                  </div>
                </div>
                <p className="text-slate-200 indent-0 mb-2 italic">"{r.text}"</p>
                <p className="text-xs text-slate-500 mb-4">Reason: {r.reason}</p>
                
                <div className="flex space-x-3">
                  <Button size="sm" className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">Approve Positive</Button>
                  <Button size="sm" className="bg-rose-500/20 text-rose-400 hover:bg-rose-500/30">Approve Negative</Button>
                  <Button size="sm" variant="outline" className="border-white/10 text-slate-400">Mark Neutral</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
