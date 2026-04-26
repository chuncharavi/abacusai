import { useState } from 'react';
import {
  useCreateSubscription,
  useVerifyPayment,
  CreateSubscriptionBodyPlan,
  CreateSubscriptionBodyBillingCycle,
  useGetSubscriptionStatus,
} from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayPaymentResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: string, callback: () => void): void;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-checkout-js')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export default function Subscription() {
  const queryClient = useQueryClient();
  const { data: currentSub, isLoading } = useGetSubscriptionStatus();
  const createSubMut = useCreateSubscription();
  const verifyMut = useVerifyPayment();
  const [billingCycle, setBillingCycle] = useState<CreateSubscriptionBodyBillingCycle>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = async (plan: CreateSubscriptionBodyPlan) => {
    setIsProcessing(true);

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast({ title: 'Error', description: 'Could not load payment gateway. Please try again.', variant: 'destructive' });
      setIsProcessing(false);
      return;
    }

    createSubMut.mutate(
      { data: { plan, billingCycle } },
      {
        onSuccess: (orderData) => {
          const options: RazorpayOptions = {
            key: orderData.keyId,
            amount: orderData.amount,
            currency: orderData.currency,
            name: 'AbacusAI',
            description: `${plan} Plan — ${billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}`,
            order_id: orderData.orderId,
            prefill: {},
            theme: { color: '#6366f1' },
            modal: {
              ondismiss: () => {
                setIsProcessing(false);
                toast({ title: 'Payment cancelled', description: 'You can upgrade anytime.' });
              },
            },
            handler: (response: RazorpayPaymentResponse) => {
              verifyMut.mutate(
                {
                  data: {
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                    plan,
                    billingCycle,
                  },
                },
                {
                  onSuccess: () => {
                    setIsProcessing(false);
                    toast({
                      title: '🎉 Payment Successful!',
                      description: `You are now on the ${plan} plan. Enjoy unlimited access!`,
                    });
                    queryClient.invalidateQueries({ queryKey: ['/v1/subscription/status'] });
                  },
                  onError: () => {
                    setIsProcessing(false);
                    toast({
                      title: 'Verification Failed',
                      description: 'Payment received but verification failed. Contact support with your payment ID.',
                      variant: 'destructive',
                    });
                  },
                }
              );
            },
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        },
        onError: () => {
          setIsProcessing(false);
          toast({ title: 'Error', description: 'Failed to create payment order. Please try again.', variant: 'destructive' });
        },
      }
    );
  };

  if (isLoading || !currentSub) return <div className="p-8">Loading plans...</div>;

  const isUpgrading = isProcessing || createSubMut.isPending || verifyMut.isPending;

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
              ₹0
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
              ₹{billingCycle === 'monthly' ? '399' : '291'}
              <span className="text-sm text-muted-foreground ml-1 font-normal">/mo</span>
            </div>
            {billingCycle === 'yearly' && (
              <p className="text-sm text-green-500 font-medium mt-1">Billed ₹3,499 yearly — save ₹1,289</p>
            )}
          </CardHeader>
          <CardContent className="flex-1 mt-6">
            <ul className="space-y-3">
              {[
                'All Levels (1-5)',
                'Unlimited daily sessions',
                'AI-powered hints & tutoring',
                'Detailed parent reports',
                'All premium themes',
                'Weekly Leaderboard access',
              ].map((feature, i) => (
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
              disabled={isUpgrading || currentSub.plan === 'STAR'}
            >
              {currentSub.plan === 'STAR'
                ? 'Active ✓'
                : isUpgrading
                ? 'Processing...'
                : 'Upgrade to Star'}
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
