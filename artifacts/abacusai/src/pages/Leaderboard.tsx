import { useGetLeaderboard, useGetSubscriptionStatus } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Medal, Crown, Flame, Lock } from 'lucide-react';

export default function Leaderboard() {
  const { data: subStatus, isLoading: subLoading } = useGetSubscriptionStatus();
  const { data: leaderboard, isLoading: lbLoading } = useGetLeaderboard();

  if (subLoading || lbLoading) {
    return <div className="p-8 flex justify-center">Loading leaderboard...</div>;
  }

  // Gate feature for FREE users
  if (subStatus?.plan === 'FREE') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 shadow-xl border-primary/20 bg-gradient-to-b from-card to-primary/5">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-heading font-bold mb-4">Premium Feature</h2>
          <p className="text-muted-foreground mb-8">
            The weekly leaderboard is available exclusively for Star plan members. Upgrade to compete with students worldwide!
          </p>
          <Link href="/subscription">
            <Button className="w-full font-bold h-12 shadow-lg">Unlock Leaderboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!leaderboard) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex justify-center p-4 bg-primary/10 rounded-full text-primary mb-2">
          <Crown className="w-12 h-12" />
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground">Global Leaderboard</h1>
        <p className="text-muted-foreground text-lg">Top AbacusAI students this week. Resets every Sunday!</p>
      </div>

      <div className="bg-card rounded-3xl shadow-xl border overflow-hidden">
        {/* Top 3 Podium (Optional enhancement for later, simplified for now) */}
        
        <div className="divide-y">
          {leaderboard.map((entry, index) => {
            const isTop3 = index < 3;
            return (
              <div 
                key={entry.studentId} 
                className={`p-4 sm:p-6 flex items-center justify-between gap-4 transition-colors hover:bg-muted/50 ${index === 0 ? 'bg-amber-500/5 hover:bg-amber-500/10' : ''}`}
              >
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full font-bold text-lg
                    ${index === 0 ? 'bg-amber-400 text-white shadow-lg shadow-amber-400/30' : 
                      index === 1 ? 'bg-slate-300 text-slate-700 shadow-md' : 
                      index === 2 ? 'bg-orange-400 text-white shadow-md' : 
                      'bg-muted text-muted-foreground'}`}
                  >
                    {index === 0 ? <Crown className="w-6 h-6" /> : `#${entry.rank}`}
                  </div>
                  
                  <div>
                    <h3 className={`font-bold text-lg sm:text-xl ${index === 0 ? 'text-amber-600 dark:text-amber-500' : ''}`}>
                      {entry.name}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">Lvl {entry.level}</span>
                      <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500" /> {entry.streak}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-mono font-bold text-xl sm:text-2xl text-foreground">{entry.xp.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">XP</p>
                </div>
              </div>
            );
          })}
          
          {leaderboard.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              No entries on the leaderboard yet this week. Be the first!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
