import { useGetClassStats, useGetClassStudents } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Users, GraduationCap, Trophy, BarChart3, Flame } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function TeacherDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetClassStats();
  const { data: students, isLoading: studentsLoading } = useGetClassStudents();

  if (statsLoading || studentsLoading || !stats || !students) {
    return <div className="p-8 flex justify-center">Loading class data...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">Teacher Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-lg">Class overview and student performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-primary/20 p-4 rounded-2xl text-primary">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-bold">Total Students</p>
              <p className="text-3xl font-bold text-primary">{stats.totalStudents}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-secondary/10 border-secondary/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-secondary/20 p-4 rounded-2xl text-secondary">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-bold">Class Average Accuracy</p>
              <p className="text-3xl font-bold text-secondary">{stats.avgAccuracy}%</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-accent/10 border-accent/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-accent/20 p-4 rounded-2xl text-accent">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-bold">Average Level</p>
              <p className="text-3xl font-bold text-accent">Level {stats.avgLevel}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-muted-foreground" />
              Level Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.levelDistribution}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis dataKey="level" tickFormatter={(val) => `Level ${val}`} />
                <YAxis />
                <Tooltip 
                  formatter={(val: number) => [val, 'Students']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topPerformers.map((student, i) => (
                <div key={student.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-slate-200 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-primary/10 text-primary'}`}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.xp} XP</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-500">{student.weeklyAccuracy}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Student Roster</CardTitle>
          <CardDescription>Manage and monitor your students</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>XP</TableHead>
                <TableHead>Streak</TableHead>
                <TableHead>Weekly Accuracy</TableHead>
                <TableHead>Last Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-bold">{student.name}</TableCell>
                  <TableCell>
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-bold">
                      Level {student.level}
                    </span>
                  </TableCell>
                  <TableCell>{student.xp}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-orange-500" />
                      {student.streak}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={student.weeklyAccuracy >= 80 ? 'text-green-600 font-bold' : student.weeklyAccuracy >= 60 ? 'text-amber-600 font-bold' : 'text-red-600 font-bold'}>
                      {student.weeklyAccuracy}%
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(student.lastActive).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
