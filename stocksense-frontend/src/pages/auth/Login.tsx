import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, LogIn, ArrowRight } from 'lucide-react';
import TextField from '../../components/forms/TextField';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { error } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // FOR HACKATHON DEMO: We will bypass actual API if it fails or simulate success.
      // In a real app we'd await login(email, password);
      
      // Let's mock a successful login for the hackathon demo if no backend is running
      try {
        await login(email, password);
      } catch (err) {
        console.warn('Backend login failed, mocking success for demo purposes...', err);
        localStorage.setItem('accessToken', 'mock_token');
        localStorage.setItem('refreshToken', 'mock_refresh');
        localStorage.setItem('user', JSON.stringify({
          id: 1,
          name: 'Demo Admin',
          email: email || 'admin@stocksense.com',
          role: 'MANAGER'
        }));
        // Reload to force auth context to pick up the mocked local storage
        window.location.href = '/';
        return;
      }
      
      navigate('/');
    } catch (err: any) {
      error('Login failed', err.message || 'Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back</h2>
        <p className="mt-2 text-sm text-gray-500">
          Enter your credentials to access your inventory
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        <TextField
          label="Email Address"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@stocksense.com"
          className="transition-all duration-200"
        />

        <div className="space-y-1">
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <div className="flex justify-end">
            <button
              type="button"
              className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              Forgot password?
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full flex justify-center py-2.5 text-sm font-semibold"
          size="lg"
          loading={isLoading}
          icon={<LogIn className="w-4 h-4 mr-2" />}
        >
          Sign in to Dashboard
        </Button>
      </form>

      <div className="mt-8 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Demo Access</span>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Just reviewing the UI? Click sign in with any credentials.
        </p>
      </div>
    </div>
  );
}
