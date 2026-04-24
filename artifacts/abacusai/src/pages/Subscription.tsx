import { useState } from 'react';
import { useCreateSubscription, CreateSubscriptionBodyPlan, CreateSubscriptionBodyBillingCycle, useGetSubscriptionStatus } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Star, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Subscription() {
  const { data: currentSub, isLoading } = useGetSubscriptionStatus();
  const createSubMut = useCreateSubscription();
  const [billingCycle, setBillingCycle] = useState<CreateSubscriptionBodyBillingCycle>('monthly');
  const { toast } = useToast();

  const handleUpgrade = (plan: CreateSubscriptionBodyPlan) => {
    createSubMut.mutate({
      data: {
        plan,
        billingCycle
      }
    }, {
      onSuccess: (data) => {
        // In a real app, this would initialize Razorpay
        // For now, we mock the success
        toast({
          title: "Order Created",
          description: `Order ID: ${data.orderId}. Proceeding to payment...`,
        });
        
        // Mocking successful payment completion after a delay
        setTimeout(() => {
          toast({
            title: "Payment Successful",
            description: `You are now subscribed to the ${plan} plan!`,
            variant: "default"
          });
          window.location.reload(); // Quick refresh to update state
        }, 1500);
      },
      onError: (err) => {
        toast({
          title: "Error",
          description: "Failed to initiate payment",
          variant: "destructive"
        });
      }
    });
  };

  if (isLoading || !currentSub) return <div className="p-8">Loading plans...</div>;

  return (
    <div className="max-w-5xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-heading font-bold">Unlock Your Full Potential</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Get unlimited practice sessions, advanced AI tutoring, and access to all levels.
        </p>

        <div className="inline-flex bg-muted p-1 rounded-full mt-8">
          <button 
            className={`px-6 py-2 rounded-full font-bold text-sm transition-colors ${billingCycle === 'monthly' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button 
            className={`px-6 py-2 rounded-full font-bold text-sm transition-colors ${billingCycle === 'yearly' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setBillingCycle('yearly')}
          >
            Yearly <span className="text-green-500 ml-1">Save 20%</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-stretch max-w-3xl mx-auto w-full">
        {/* FREE */}
        <Card className="flex flex-col border-border/50 shadow-sm relative overflow-hidden">
          {currentSub.plan === 'FREE' && (
            <div className="absolute top-0 right-0 bg-muted text-muted-foreground text-xs font-bold px-3 py-1 rounded-bl-xl">
              CURRENT PLAN
            </div>
          )}
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-muted-foreground">Free</CardTitle>
            <div className="mt-4 flex justify-center items-baseline text-4xl font-bold">
              $0
              <span className="text-sm text-muted-foreground ml-1 font-normal">/mo</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 mt-6">
            <ul className="space-y-3">
              {['Levels 1-2 only', '10 sessions / day', 'Basic tracking', 'Standard abacus theme'].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" disabled>
              {currentSub.plan === 'FREE' ? 'Current Plan' : 'Free Tier'}
            </Button>
          </CardFooter>
        </Card>

        {/* STAR */}
        <Card className="flex flex-col border-primary shadow-xl relative overflow-hidden transform md:-translate-y-4">
          <div className="absolute top-0 inset-x-0 bg-primary text-primary-foreground text-center text-xs font-bold py-1">
            MOST POPULAR
          </div>
          {currentSub.plan === 'STAR' && (
            <div className="absolute top-6 right-0 bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1 rounded-bl-xl z-10">
              ACTIVE
            </div>
          )}
          <CardHeader className="text-center pb-2 pt-10">
            <div className="flex justify-center mb-2">
              <Star className="w-8 h-8 text-primary fill-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">Star Student</CardTitle>
            <div className="mt-4 flex justify-center items-baseline text-5xl font-bold text-foreground">
              ${billingCycle === 'monthly' ? '9' : '7.20'}
              <span className="text-sm text-muted-foreground ml-1 font-normal">/mo</span>
            </div>
            {billingCycle === 'yearly' && <p className="text-sm text-green-500 font-medium mt-1">Billed $86.40 yearly</p>}
          </CardHeader>
          <CardContent className="flex-1 mt-6">
            <ul className="space-y-3">
              {['All Levels (1-5)', 'Unlimited daily sessions', 'AI-powered hints & tutoring', 'Detailed parent reports', 'All premium themes', 'Weekly Leaderboard access'].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full font-bold h-12 shadow-lg" 
              onClick={() => handleUpgrade('STAR')}
              disabled={createSubMut.isPending || currentSub.plan === 'STAR'}
            >
              {currentSub.plan === 'STAR' ? 'Active' : 'Upgrade to Star'}
            </Button>
          </CardFooter>
        </Card>

      </div>
      
      <div className="text-center text-sm text-muted-foreground mt-8">
        Payments securely processed via Razorpay. Cancel anytime.
      </div>
    </div>
  );
}
