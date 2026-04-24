import { useState } from 'react';
import { useRegister, RegisterBodyRole } from '@workspace/api-client-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link, useLocation } from 'wouter';
import { Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<RegisterBodyRole>(RegisterBodyRole.STUDENT);
  const [age, setAge] = useState('');
  
  const { login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const registerMutation = useRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({ 
      data: { 
        name, 
        email, 
        password, 
        role,
        age: age ? parseInt(age, 10) : undefined
      } 
    }, {
      onSuccess: (data) => {
        login(data.token);
        // Redirect based on role
        if (role === 'PARENT') setLocation('/parent');
        else if (role === 'TEACHER') setLocation('/teacher');
        else setLocation('/dashboard');
      },
      onError: (error) => {
        toast({
          title: "Registration Failed",
          description: (error.data as any)?.message || error.message || "An error occurred",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 py-12">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-2xl text-primary">
              <Brain className="w-8 h-8" />
            </div>
          </div>
          <CardTitle className="text-3xl font-heading font-bold">Create an account</CardTitle>
          <CardDescription>
            Join AbacusAI to start your learning journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">I am a...</Label>
              <Select value={role} onValueChange={(val) => setRole(val as RegisterBodyRole)}>
                <SelectTrigger data-testid="select-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RegisterBodyRole.STUDENT}>Student</SelectItem>
                  <SelectItem value={RegisterBodyRole.PARENT}>Parent</SelectItem>
                  <SelectItem value={RegisterBodyRole.TEACHER}>Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {role === RegisterBodyRole.STUDENT && (
              <div className="space-y-2">
                <Label htmlFor="age">Age (Optional)</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="8"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  data-testid="input-age"
                  min="4"
                  max="99"
                />
              </div>
            )}
            <Button
              type="submit"
              className="w-full font-bold shadow-lg mt-6"
              disabled={registerMutation.isPending}
              data-testid="button-signup"
            >
              {registerMutation.isPending ? "Creating account..." : "Sign up"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center">
          <div className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
