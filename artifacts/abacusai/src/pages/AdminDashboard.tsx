import { useGetAdminStats, useGetRevenueStats, useListUsers } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Users, DollarSign, Crown, Activity } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: revenue, isLoading: revenueLoading } = useGetRevenueStats();
  const { data: usersData, isLoading: usersLoading } = useListUsers({ limit: 10 });

  if (statsLoading || revenueLoading || usersLoading || !stats || !revenue || !usersData) {
    return <div className="p-8 flex justify-center">Loading admin data...</div>;
  }

  const subscriptionData = [
    { name: 'Free', value: stats.freeUsers, color: 'hsl(var(--muted-foreground))' },
    { name: 'Star', value: stats.starUsers, color: 'hsl(var(--primary))' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">Platform Admin</h1>
        <p className="text-muted-foreground mt-1 text-lg">System overview and revenue metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-6 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-primary/20 p-3 rounded-xl text-primary">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-green-500 bg-green-100 px-2 py-1 rounded-md">+12%</span>
            </div>
            <p className="text-sm text-muted-foreground font-bold">Total Users</p>
            <p className="text-3xl font-bold text-foreground">{stats.totalUsers.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-500/20 p-3 rounded-xl text-green-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-green-500 bg-green-100 px-2 py-1 rounded-md">+8%</span>
            </div>
            <p className="text-sm text-muted-foreground font-bold">Monthly Recurring Revenue</p>
            <p className="text-3xl font-bold text-foreground">${revenue.mrr.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-amber-500/20 p-3 rounded-xl text-amber-600">
                <Crown className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">{stats.activeSubscriptions} total</span>
            </div>
            <p className="text-sm text-muted-foreground font-bold">Paid Subscriptions</p>
            <p className="text-3xl font-bold text-foreground">{((stats.activeSubscriptions / stats.totalUsers) * 100).toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-accent/20 p-3 rounded-xl text-accent">
                <Activity className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-bold">Avg Daily Sessions</p>
            <p className="text-3xl font-bold text-foreground">{stats.avgDailyActiveSessions.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Revenue History</CardTitle>
            <CardDescription>Monthly revenue growth</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue.monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis dataKey="month" tickFormatter={(val) => {
                  const [y, m] = val.split('-');
                  const date = new Date(parseInt(y), parseInt(m)-1);
                  return date.toLocaleDateString(undefined, { month: 'short' });
                }} />
                <YAxis tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  formatter={(val: number) => [`$${val.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
            <CardDescription>Current active users by plan</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subscriptionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {subscriptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full flex justify-center gap-4 mt-4">
              {subscriptionData.map(plan => (
                <div key={plan.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }} />
                  <span className="font-bold">{plan.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Plan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersData.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-bold">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <span className="bg-muted px-2 py-1 rounded-md text-xs font-bold">
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {user.subscription ? (
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${user.subscription.plan === 'FREE' ? 'bg-slate-100 text-slate-600' : 'bg-primary/10 text-primary'}`}>
                        {user.subscription.plan}
                      </span>
                    ) : '-'}
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
