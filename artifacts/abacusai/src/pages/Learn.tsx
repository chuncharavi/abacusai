import { useState, useEffect, useCallback } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useStartSession, useCompleteSession, useGetAIHint, Problem } from '@workspace/api-client-react';
import { useAuth } from '@/hooks/use-auth';
import { AbacusBoard } from '@/components/AbacusBoard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, Lightbulb, Play, ArrowRight, CheckCircle2, XCircle, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

export default function Learn() {
  const [, params] = useRoute('/learn/:level');
  const level = parseInt(params?.level || '1', 10);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const startSessionMut = useStartSession();
  const completeSessionMut = useCompleteSession();
  const getAIHintMut = useGetAIHint();

  const [sessionData, setSessionData] = useState<{ sessionId: string, problems: Problem[] } | null>(null);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [abacusValue, setAbacusValue] = useState(0);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [wrongAnswers, setWrongAnswers] = useState<number[]>([]); // wrong answers for current problem
  const [showHint, setShowHint] = useState(false);
  const [hintData, setHintData] = useState<{hint: string, encouragement: string} | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState(0);

  const startPractice = useCallback(() => {
    startSessionMut.mutate({ data: { level } }, {
      onSuccess: (data) => {
        setSessionData(data);
        setCurrentProblemIndex(0);
        setResults([]);
        setAbacusValue(0);
        setStudentAnswer('');
        setStartTime(Date.now());
        setHintsUsed(0);
        setShowHint(false);
        setHintData(null);
        setWrongAnswers([]);
      },
      onError: (err) => {
        if (err.error && err.error.includes("upgrade")) {
           setLocation('/upgrade');
        }
      }
    });
  }, [level, startSessionMut, setLocation]);

  useEffect(() => {
    startPractice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRequestHint = () => {
    if (!sessionData) return;
    const currentProblem = sessionData.problems[currentProblemIndex];
    
    setHintsUsed(prev => prev + 1);
    setShowHint(true);
    
    getAIHintMut.mutate({
      data: {
        studentAge: user?.age ?? 10,
        level,
        problem: currentProblem.question,
        wrongAnswers: wrongAnswers,
      }
    }, {
      onSuccess: (data) => {
        setHintData(data);
      }
    });
  };

  const handleSubmitAnswer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sessionData || !studentAnswer) return;

    const currentProblem = sessionData.problems[currentProblemIndex];
    const parsed = parseInt(studentAnswer, 10);
    const isCorrect = parsed === currentProblem.answer;

    if (!isCorrect) {
      // Track wrong answer so AI hint knows what the student tried
      setWrongAnswers(prev => [...prev, parsed]);
      setStudentAnswer('');
      return; // Stay on same problem — let student try again or ask for hint
    }

    const newResults = [...results, {
      question: currentProblem.question,
      answer: currentProblem.answer,
      studentAnswer: parsed,
      correct: true,
    }];

    setResults(newResults);
    
    if (currentProblemIndex < sessionData.problems.length - 1) {
      setCurrentProblemIndex(prev => prev + 1);
      setStudentAnswer('');
      setAbacusValue(0);
      setShowHint(false);
      setHintData(null);
      setWrongAnswers([]);
    } else {
      // Session complete
      const duration = Math.floor((Date.now() - startTime) / 1000);
      completeSessionMut.mutate({
        data: {
          sessionId: sessionData.sessionId,
          problems: newResults,
          duration,
          hintsUsed
        }
      }, {
        onSuccess: (data) => {
          if (data.accuracy >= 80) {
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 }
            });
          }
        }
      });
    }
  };

  if (!sessionData && startSessionMut.isPending) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading session...</div>;
  }

  if (completeSessionMut.isSuccess && completeSessionMut.data) {
    const result = completeSessionMut.data;
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-8 animate-in zoom-in duration-500">
        <h1 className="text-4xl font-heading font-bold">Session Complete!</h1>
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <p className="text-muted-foreground font-bold text-sm">Score</p>
              <p className="text-4xl font-bold text-primary mt-2">{result.score}</p>
            </CardContent>
          </Card>
          <Card className="bg-secondary/10 border-secondary/20">
            <CardContent className="p-6">
              <p className="text-muted-foreground font-bold text-sm">Accuracy</p>
              <p className="text-4xl font-bold text-secondary mt-2">{result.accuracy}%</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-6">
              <p className="text-muted-foreground font-bold text-sm">XP Earned</p>
              <p className="text-4xl font-bold text-amber-500 mt-2">+{result.xpEarned}</p>
            </CardContent>
          </Card>
        </div>
        
        {result.newLevel && (
          <div className="bg-gradient-to-r from-primary to-accent text-white p-6 rounded-2xl shadow-xl">
            <h3 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
              <Trophy className="w-8 h-8" /> Level Up!
            </h3>
            <p>You have advanced to Level {result.newLevel}. Amazing work!</p>
          </div>
        )}

        <div className="flex justify-center gap-4 pt-8">
          <Button size="lg" variant="outline" onClick={() => setLocation('/dashboard')}>
            Back to Dashboard
          </Button>
          <Button size="lg" onClick={startPractice} className="gap-2">
            <Play className="w-4 h-4 fill-current" /> Play Again
          </Button>
        </div>
      </div>
    );
  }

  if (!sessionData) return null;

  const currentProblem = sessionData.problems[currentProblemIndex];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-muted-foreground">
          Level {level} <span className="mx-2">•</span> Problem {currentProblemIndex + 1} of {sessionData.problems.length}
        </h2>
        <div className="font-mono text-xl font-bold px-4 py-2 bg-card rounded-xl shadow-sm border">
          Score: {results.filter(r => r.correct).length * 100}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-stretch">
        {/* Problem Card */}
        <Card className={`flex-1 shadow-lg bg-gradient-to-br from-card to-primary/5 transition-colors ${wrongAnswers.length > 0 ? 'border-destructive/50' : 'border-primary/20'}`}>
          <CardContent className="p-8 flex flex-col justify-center items-center h-full min-h-[300px]">
            <div className="text-5xl md:text-7xl font-bold font-mono tracking-widest text-center mb-8">
              {currentProblem.question}
            </div>
            {wrongAnswers.length > 0 && (
              <div className="flex items-center gap-2 text-destructive text-sm font-semibold mb-4">
                <XCircle className="w-4 h-4" />
                Not quite! You tried: {wrongAnswers.join(', ')} — try again or ask for a hint
              </div>
            )}
            <form onSubmit={handleSubmitAnswer} className="w-full max-w-xs flex gap-3">
              <Input 
                autoFocus
                type="number" 
                placeholder="Answer..." 
                className={`text-2xl text-center h-14 rounded-full border-2 font-bold shadow-inner ${wrongAnswers.length > 0 ? 'border-destructive/50 focus-visible:ring-destructive' : 'focus-visible:ring-primary'}`}
                value={studentAnswer}
                onChange={(e) => setStudentAnswer(e.target.value)}
              />
              <Button type="submit" size="icon" className="h-14 w-14 rounded-full shadow-lg shrink-0">
                <ArrowRight className="w-6 h-6" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Abacus Board */}
        <div className="flex-[1.5] w-full bg-card rounded-3xl p-6 shadow-lg border flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-muted-foreground flex items-center gap-2">
              Virtual Abacus
            </h3>
            <div className="font-mono font-bold text-2xl text-primary bg-primary/10 px-4 py-1 rounded-lg">
              {abacusValue}
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <AbacusBoard 
              mode="interactive" 
              value={abacusValue} 
              onValueChange={setAbacusValue}
              theme="kids"
            />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex justify-center gap-4">
        <Button 
          variant="outline" 
          size="lg" 
          className="rounded-full shadow-sm gap-2 h-12 px-6 bg-card"
          onClick={handleRequestHint}
          disabled={showHint || getAIHintMut.isPending}
        >
          <Lightbulb className="w-5 h-5 text-amber-500" />
          Need a hint?
        </Button>
        <Button 
          variant="outline" 
          size="lg" 
          className="rounded-full shadow-sm h-12 w-12 p-0 bg-card text-primary hover:text-primary hover:bg-primary/10"
        >
          <Mic className="w-5 h-5" />
        </Button>
      </div>

      {/* AI Hint Box */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg z-50 px-4"
          >
            <Card className="shadow-2xl border-primary bg-background/95 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="bg-primary/20 p-3 rounded-full shrink-0 h-min">
                    <Lightbulb className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    {getAIHintMut.isPending || !hintData ? (
                      <p className="animate-pulse font-medium">AI Tutor is thinking...</p>
                    ) : (
                      <>
                        <p className="font-bold text-lg mb-2">{hintData.hint}</p>
                        <p className="text-muted-foreground italic text-sm">{hintData.encouragement}</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
