"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileText, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-200 p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="border-b border-white/10 pb-6">
          <h1 className="text-3xl font-bold text-white">Ingestion Pipeline</h1>
          <p className="text-slate-400">Upload CSV / JSON reviews for analysis</p>
        </header>

        <Card className="bg-white/5 border-white/10 backdrop-blur-md border-dashed border-2">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-blue-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <UploadCloud className="w-8 h-8 text-blue-400" />
            </div>
            <CardTitle className="text-xl text-white">Drag & drop files here</CardTitle>
            <CardDescription className="text-slate-400">Supports CSV or JSON files entirely up to 50MB</CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-8 pt-4">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8">
              Browse Files
            </Button>
          </CardContent>
        </Card>

        {/* Live Feed Toggle - required for phase 9 */}
        <Card className="bg-gradient-to-r from-purple-500/10 to-transparent border-purple-500/20 mt-8 backdrop-blur-md">
           <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-1">
                <h3 className="font-semibold text-white">Live Data Synthesis</h3>
                <p className="text-sm text-slate-400">Simulate streaming data from production logs into the pipeline via SSE</p>
              </div>
              <Button onClick={() => setIsUploading(!isUploading)} className={isUploading ? "bg-rose-500 hover:bg-rose-600 text-white" : "bg-purple-600 hover:bg-purple-700 text-white"}>
                {isUploading ? "Stop Data Stream" : "Start Live Feed"}
              </Button>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
