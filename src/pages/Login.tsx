import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PosCard } from '@/components/ui/pos-card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShoppingCart, User, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isLoggedIn, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isLoggedIn) {
      navigate(isAdmin ? '/admin' : '/cashier');
    }
  }, [isLoggedIn, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username || !password) {
      setError('Please enter both username and password');
      setIsLoading(false);
      return;
    }

    const success = login(username, password);
    
    if (success) {
      toast({
        title: "Login successful",
        description: "Welcome to the POS system!",
      });
      // Navigation will be handled by useEffect
    } else {
      setError('Invalid username or password');
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const handleDemoLogin = (role: 'admin' | 'cashier') => {
    setUsername(role);
    setPassword(role === 'admin' ? 'admin123' : 'cashier123');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-secondary-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary text-primary-foreground p-3 rounded-full">
              <ShoppingCart className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">TINDAHAN POS SYSTEM</h1>
          <p className="text-muted-foreground mt-2">Point of Sale System</p>
        </div>

        {/* Login Form */}
        <PosCard>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Username</span>
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full"
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center space-x-2">
                <Lock className="h-4 w-4" />
                <span>Password</span>
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3 text-center">
              Demo Credentials:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('admin')}
                className="text-xs"
              >
                Admin Login
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('cashier')}
                className="text-xs"
              >
                Cashier Login
              </Button>
            </div>
            <div className="mt-2 text-xs text-muted-foreground text-center">
              <p>Admin: admin / admin123</p>
              <p>Cashier: cashier / cashier123</p>
            </div>
          </div>
        </PosCard>
      </div>
    </div>
  );
};

export default Login;