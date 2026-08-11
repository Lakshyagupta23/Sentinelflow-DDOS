import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Globe, Server, User, MapPin, TrendingUp, Download, Share2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Spinner } from "@/components/ui/spinner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ScatterChart, Scatter } from "recharts";

export default function AttackForensics() {
  const attacksQuery = trpc.attacks.list.useQuery({ limit: 50 });
  const topIpsQuery = trpc.vectors.topIps.useQuery({ limit: 15 });
  const topUrlsQuery = trpc.vectors.topUrls.useQuery({ limit: 15 });
  const topCountriesQuery = trpc.vectors.topCountries.useQuery({ limit: 10 });

  const selectedAttack = attacksQuery.data?.[0];

  const timelineData = attacksQuery.data?.map((attack: any) => ({
    name: new Date(attack.startTime).toLocaleTimeString(),
    duration: attack.duration ? attack.duration / 60 : 0,
    traffic: parseFloat(String(attack.peakTraffic || 0)),
  })) || [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in-up">
          <h1 className="text-4xl font-bold text-gradient mb-2">Attack Forensics</h1>
          <p className="text-muted-foreground">Deep-dive analysis and forensic investigation of detected attacks</p>
        </div>

        {/* Attack Timeline */}
        <Card className="card-elevated animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent" />
                Attack Timeline
              </CardTitle>
              <CardDescription>Historical attack incidents with duration and peak traffic</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            {attacksQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="traffic" stroke="#06b6d4" strokeWidth={2} dot={{ fill: "#06b6d4", r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No attack data available</div>
            )}
          </CardContent>
        </Card>

        {/* Forensic Details Tabs */}
        <Tabs defaultValue="vectors" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="vectors" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              <Globe className="w-4 h-4 mr-2" />
              Attack Vectors
            </TabsTrigger>
            <TabsTrigger value="sources" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              <Server className="w-4 h-4 mr-2" />
              Source IPs
            </TabsTrigger>
            <TabsTrigger value="targets" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              <TrendingUp className="w-4 h-4 mr-2" />
              Target URLs
            </TabsTrigger>
            <TabsTrigger value="geo" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              <MapPin className="w-4 h-4 mr-2" />
              Geographic
            </TabsTrigger>
          </TabsList>

          {/* Attack Vectors */}
          <TabsContent value="vectors" className="space-y-6 animate-fade-in-up">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Attack Vector Distribution</CardTitle>
                <CardDescription>Breakdown of attack types detected</CardDescription>
              </CardHeader>
              <CardContent>
                {attacksQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {["volumetric", "protocol", "application_layer"].map((type, idx) => {
                      const typeLabel = type === "volumetric" ? "Volumetric" : type === "protocol" ? "Protocol" : "Application-layer";
                      const count = attacksQuery.data?.filter((a: any) => a.type === type).length || 0;
                      const total = attacksQuery.data?.length || 1;
                      const percentage = Math.round((count / total) * 100);
                      return (
                        <div key={idx} className="animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-foreground">{typeLabel}</span>
                            <Badge className="bg-accent/20 text-accent border-accent/30">{count} attacks</Badge>
                          </div>
                          <div className="w-full bg-border rounded-full h-3 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{percentage}% of attacks</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Source IPs */}
          <TabsContent value="sources" className="space-y-6 animate-fade-in-up">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Top Source IPs</CardTitle>
                <CardDescription>Most frequent attack sources</CardDescription>
              </CardHeader>
              <CardContent>
                {topIpsQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : topIpsQuery.data && topIpsQuery.data.length > 0 ? (
                  <div className="space-y-3">
                    {topIpsQuery.data.map((ip: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-accent/50 transition-all duration-300 group animate-fade-in-up" style={{ animationDelay: `${idx * 30}ms` }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Server className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{ip.ip}</p>
                            <p className="text-sm text-muted-foreground">{ip.country || "Unknown"}</p>
                          </div>
                        </div>
                        <Badge className="bg-red-100 text-red-900 border-red-300">{ip.count} attacks</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No IP data available</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Target URLs */}
          <TabsContent value="targets" className="space-y-6 animate-fade-in-up">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Top Target URLs</CardTitle>
                <CardDescription>Most frequently targeted endpoints</CardDescription>
              </CardHeader>
              <CardContent>
                {topUrlsQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : topUrlsQuery.data && topUrlsQuery.data.length > 0 ? (
                  <div className="space-y-3">
                    {topUrlsQuery.data.map((url: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-accent/50 transition-all duration-300 group animate-fade-in-up" style={{ animationDelay: `${idx * 30}ms` }}>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <Globe className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{url.url}</p>
                            <p className="text-sm text-muted-foreground">{url.method || "GET"}</p>
                          </div>
                        </div>
                        <Badge className="bg-orange-100 text-orange-900 border-orange-300 flex-shrink-0">{url.count} hits</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No URL data available</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Geographic */}
          <TabsContent value="geo" className="space-y-6 animate-fade-in-up">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Geographic Origin</CardTitle>
                <CardDescription>Attack sources by country</CardDescription>
              </CardHeader>
              <CardContent>
                {topCountriesQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : topCountriesQuery.data && topCountriesQuery.data.length > 0 ? (
                  <div className="space-y-3">
                    {topCountriesQuery.data.map((country: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-accent/50 transition-all duration-300 group animate-fade-in-up" style={{ animationDelay: `${idx * 30}ms` }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <MapPin className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{country.country}</p>
                            <p className="text-sm text-muted-foreground">{country.region || "Unknown region"}</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-900 border-green-300">{country.count} attacks</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No geographic data available</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Selected Attack Details */}
        {selectedAttack && (
          <Card className="card-elevated animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Attack Details</span>
                <Badge className={`badge-${selectedAttack.severity.toLowerCase()}`}>{selectedAttack.severity}</Badge>
              </CardTitle>
              <CardDescription>Detailed information about the selected attack</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Attack Type</p>
                    <p className="font-semibold text-foreground">{selectedAttack.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Start Time</p>
                    <p className="font-semibold text-foreground">{new Date(selectedAttack.startTime).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Duration</p>
                    <p className="font-semibold text-foreground">{selectedAttack.duration ? `${Math.round(selectedAttack.duration / 60)} minutes` : "Ongoing"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Peak Traffic</p>
                    <p className="font-semibold text-foreground">{selectedAttack.peakTraffic} Gbps</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <Badge className={`badge-${selectedAttack.status.toLowerCase()}`}>{selectedAttack.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Affected Endpoints</p>
                    <p className="font-semibold text-foreground">Multiple endpoints</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
