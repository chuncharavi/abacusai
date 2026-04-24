import { useState } from 'react';
import { AbacusBoard } from '@/components/AbacusBoard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Link } from 'wouter';
import { ArrowRight, Brain, Star, Trophy, Users, Zap, Shield, BarChart3, Sparkles, Check, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

const FEATURES = [
  {
    icon: Brain,
    title: "AI-Powered Hints",
    description: "Claude AI analyzes your mistakes and gives personalised guidance — no more guessing what went wrong.",
    color: "text-primary bg-primary/10",
  },
  {
    icon: BarChart3,
    title: "Adaptive Difficulty",
    description: "Problems automatically adjust to your level so you're always challenged, never overwhelmed.",
    color: "text-accent bg-accent/10",
  },
  {
    icon: Trophy,
    title: "Gamified Learning",
    description: "Earn XP, unlock badges, climb the leaderboard, and maintain daily streaks that keep you coming back.",
    color: "text-secondary bg-secondary/10",
  },
  {
    icon: Zap,
    title: "5 Learning Levels",
    description: "Progress from single-digit addition all the way to multi-column mental arithmetic — at your own pace.",
    color: "text-primary bg-primary/10",
  },
  {
    icon: Users,
    title: "Parent & Teacher Dashboards",
    description: "Monitor progress, review session reports, and manage multiple students — all from one place.",
    color: "text-accent bg-accent/10",
  },
  {
    icon: Shield,
    title: "Safe for Kids",
    description: "No ads, no distractions. A calm, focused learning environment designed for children aged 5 and up.",
    color: "text-secondary bg-secondary/10",
  },
];

const PLANS = [
  {
    name: "Free",
    monthlyPrice: "₹0",
    yearlyPrice: "₹0",
    monthlyPeriod: "forever",
    yearlyPeriod: "forever",
    yearlySaving: null as string | null,
    description: "Get started with the basics",
    features: [
      "3 sessions per day",
      "Levels 1 & 2",
      "Basic progress tracking",
      "1 student profile",
    ],
    cta: "Start for Free",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Star",
    monthlyPrice: "₹299",
    yearlyPrice: "₹2,490",
    monthlyPeriod: "per month",
    yearlyPeriod: "per year",
    yearlySaving: "Save ₹1,098 · 2 months free!",
    description: "The full AbacusAI experience",
    features: [
      "Unlimited sessions",
      "All 5 levels",
      "AI-powered hints",
      "Full leaderboard access",
      "Detailed progress reports",
      "Parent dashboard",
      "Up to 3 student profiles",
    ],
    cta: "Start Star Plan",
    href: "/signup",
    highlighted: true,
  },
];

const TESTIMONIALS = [
  {
    name: "Priya Mehta",
    role: "Parent of 8-year-old",
    avatar: "PM",
    quote: "My daughter went from struggling with multiplication to doing 3-digit sums in her head — in just 6 weeks! AbacusAI made it feel like a game, not homework.",
  },
  {
    name: "Rajan Nair",
    role: "Mathematics Teacher, Delhi",
    avatar: "RN",
    quote: "I use the Star plan for my entire coaching batch. The teacher dashboard saves me hours every week and the students are genuinely excited to practise.",
  },
  {
    name: "Aisha Khan",
    role: "Parent of 11-year-old",
    avatar: "AK",
    quote: "The AI hints are brilliant — they don't just give the answer but explain exactly where my son went wrong. His confidence in maths has skyrocketed.",
  },
  {
    name: "Suresh Iyer",
    role: "Parent of 6-year-old",
    avatar: "SI",
    quote: "We tried several apps but AbacusAI is the only one she actually asks to use. The beads are interactive and the streak system keeps her motivated every day.",
  },
];

export default function Landing() {
  const [demoValue, setDemoValue] = useState(12345);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="px-6 py-4 flex items-center justify-between bg-background/80 backdrop-blur-md sticky top-0 z-50 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground p-2 rounded-xl">
            <Brain className="w-6 h-6" />
          </div>
          <span className="font-heading font-bold text-2xl text-primary tracking-tight">AbacusAI</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 font-medium text-muted-foreground">
          <button onClick={() => scrollTo('features')} className="hover:text-primary transition-colors">Features</button>
          <button onClick={() => scrollTo('pricing')} className="hover:text-primary transition-colors">Pricing</button>
          <button onClick={() => scrollTo('testimonials')} className="hover:text-primary transition-colors">Testimonials</button>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="font-bold">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button className="font-bold shadow-lg shadow-primary/20 rounded-full px-6">Sign up</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 px-6 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm">
              <Star className="w-4 h-4" />
              <span>The #1 AI-powered abacus app</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-heading font-bold leading-tight text-foreground">
              Master mental math with <span className="text-primary">AbacusAI</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              A beautifully designed learning game for kids and adults. Learn the ancient art of the abacus with modern AI guidance, smart hints, and adaptive difficulty.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="rounded-full px-8 text-lg font-bold shadow-xl shadow-primary/30 h-14">
                  Start learning for free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <button onClick={() => scrollTo('features')} className="text-muted-foreground hover:text-primary font-bold transition-colors flex items-center gap-1">
                See how it works <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Social proof numbers */}
            <div className="flex gap-8 pt-2">
              <div>
                <div className="text-2xl font-heading font-bold text-foreground">10,000+</div>
                <div className="text-sm text-muted-foreground">Students learning</div>
              </div>
              <div>
                <div className="text-2xl font-heading font-bold text-foreground">4.9★</div>
                <div className="text-sm text-muted-foreground">Average rating</div>
              </div>
              <div>
                <div className="text-2xl font-heading font-bold text-foreground">500+</div>
                <div className="text-sm text-muted-foreground">Teachers onboard</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 blur-3xl -z-10 rounded-[3rem]" />
            <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-heading font-bold text-xl">Interactive Demo</h3>
                  <p className="text-sm text-muted-foreground">Try moving the beads!</p>
                </div>
                <div className="text-3xl font-mono font-bold text-primary tracking-wider bg-primary/10 px-4 py-2 rounded-xl">
                  {demoValue.toLocaleString()}
                </div>
              </div>
              <AbacusBoard
                mode="interactive"
                value={demoValue}
                onValueChange={setDemoValue}
                theme="kids"
              />
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-6 bg-muted/40">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16 space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Why AbacusAI?</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground">
                Everything you need to master the abacus
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Combining ancient wisdom with modern AI — we make abacus learning fast, fun, and effective for every learner.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <Card className="h-full border-border/50 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 ${feature.color}`}>
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <CardTitle className="text-xl font-heading">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16 space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/20 text-secondary-foreground font-bold text-sm">
                <Trophy className="w-4 h-4" />
                <span>Simple Pricing</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground">
                Start free, upgrade when ready
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                No hidden fees, no long-term contracts. Cancel anytime.
              </p>
            </motion.div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-10">
              <button
                onClick={() => setBilling('monthly')}
                className={`text-sm font-semibold transition-colors ${billing === 'monthly' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling(billing === 'monthly' ? 'yearly' : 'monthly')}
                className="relative w-12 h-6 rounded-full bg-primary transition-colors focus:outline-none"
                aria-label="Toggle billing period"
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${
                    billing === 'yearly' ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
              <button
                onClick={() => setBilling('yearly')}
                className={`text-sm font-semibold transition-colors ${billing === 'yearly' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Yearly
                <span className="ml-2 inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                  Save 30%
                </span>
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-stretch max-w-3xl mx-auto">
              {PLANS.map((plan, i) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex"
                >
                  <Card className={`flex flex-col w-full relative overflow-hidden transition-shadow ${
                    plan.highlighted
                      ? 'border-primary shadow-2xl shadow-primary/20 scale-105'
                      : 'border-border/50 shadow-sm hover:shadow-md'
                  }`}>
                    {plan.highlighted && (
                      <div className="absolute top-0 inset-x-0 bg-primary text-primary-foreground text-center text-sm font-bold py-1.5">
                        Most Popular
                      </div>
                    )}
                    <CardHeader className={plan.highlighted ? 'pt-10' : ''}>
                      <CardTitle className="text-2xl font-heading">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="pt-2">
                        <span className="text-4xl font-heading font-bold text-foreground">
                          {billing === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          /{billing === 'yearly' ? plan.yearlyPeriod : plan.monthlyPeriod}
                        </span>
                      </div>
                      {billing === 'yearly' && plan.yearlySaving && (
                        <p className="text-xs font-semibold text-green-600 mt-1">{plan.yearlySaving}</p>
                      )}
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-6">
                      <ul className="space-y-3 flex-1">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-primary flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Link href={plan.href}>
                        <Button
                          className={`w-full font-bold rounded-xl h-11 ${plan.highlighted ? 'shadow-lg shadow-primary/30' : ''}`}
                          variant={plan.highlighted ? 'default' : 'outline'}
                        >
                          {plan.cta}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-24 px-6 bg-muted/40">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16 space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm">
                <Star className="w-4 h-4" />
                <span>Loved by families & teachers</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground">
                What our learners say
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join thousands of students and educators who've transformed maths learning with AbacusAI.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <Card className="h-full border-border/50 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-6 space-y-4">
                      <Quote className="w-8 h-8 text-primary/40" />
                      <p className="text-base leading-relaxed text-foreground/80 italic">"{t.quote}"</p>
                      <div className="flex items-center gap-3 pt-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center flex-shrink-0">
                          {t.avatar}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-foreground">{t.name}</div>
                          <div className="text-xs text-muted-foreground">{t.role}</div>
                        </div>
                        <div className="ml-auto flex gap-0.5">
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} className="w-3.5 h-3.5 fill-secondary text-secondary" />
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative bg-primary rounded-3xl p-12 text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent opacity-90" />
              <div className="relative z-10 space-y-6">
                <h2 className="text-4xl md:text-5xl font-heading font-bold text-white">
                  Ready to start your journey?
                </h2>
                <p className="text-xl text-white/80 max-w-xl mx-auto">
                  Join 10,000+ students already mastering mental math. Free forever — no credit card needed.
                </p>
                <Link href="/signup">
                  <Button size="lg" variant="secondary" className="rounded-full px-10 text-lg font-bold h-14 shadow-2xl">
                    Get started for free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
              <Brain className="w-4 h-4" />
            </div>
            <span className="font-heading font-bold text-lg text-primary">AbacusAI</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 AbacusAI. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
