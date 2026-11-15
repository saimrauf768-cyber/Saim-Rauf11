import { FormEvent, useState } from 'react';
import { LogOut, Shield, UserCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export function AuthPage() {
  const {
    user,
    isAdmin,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    signOutUser,
    navigate,
  } = useStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogle = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Google sign-in was cancelled or failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        await registerWithEmail(name, email, password);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('operation-not-allowed')) {
        setErrorMsg(
          'Email/Password provider is not enabled yet in Firebase Authentication Console. Use "Continue with Google" below for immediate verified sign-in, or enable Email/Password under Authentication → Sign-in method.'
        );
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-8 py-16">
        <div className="bg-[#111114] border border-zinc-800 rounded-lg p-8 space-y-6">
          <div className="flex items-center gap-3">
            <UserCheck className="w-7 h-7 text-[#D4AF37]" />
            <div>
              <p className="text-xs uppercase tracking-widest text-[#D4AF37]">
                Signed In
              </p>
              <h1 className="font-display text-3xl text-[#F4F4F5]">
                {user.displayName || user.email}
              </h1>
            </div>
          </div>

          <div className="p-4 bg-[#09090B] border border-zinc-800 rounded-md text-sm space-y-1.5">
            <p className="text-zinc-300">
              Email: <span className="text-zinc-100">{user.email}</span>
            </p>
            <p className="text-zinc-400 text-xs">
              Verification: {user.emailVerified ? 'Verified Account' : 'Verification Pending'} · Role:{' '}
              <span className="text-[#D4AF37]">
                {isAdmin ? 'Store Administrator' : 'Client Member'}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('orders')}
              className="px-5 py-2.5 bg-[#D4AF37] text-[#09090B] text-xs font-semibold rounded-md"
            >
              My Orders
            </button>
            <button
              type="button"
              onClick={() => navigate('wishlist')}
              className="px-5 py-2.5 border border-zinc-700 text-zinc-200 text-xs font-semibold rounded-md"
            >
              Saved Wishlist
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => navigate('admin')}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-zinc-100 text-[#09090B] text-xs font-semibold rounded-md"
              >
                <Shield className="w-3.5 h-3.5" />
                Open Admin Dashboard
              </button>
            )}
            <button
              type="button"
              onClick={signOutUser}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs text-zinc-400 hover:text-red-400 ml-auto"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
      <div className="bg-[#111114] border border-zinc-800 rounded-lg p-8 space-y-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]">
            SAIM CLOTHES Client Portal
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#F4F4F5] mt-1.5">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h1>
          <p className="text-xs text-zinc-400 mt-2">
            Access order history, sync your wishlist, or enter the Admin Dashboard.
          </p>
        </div>

        {/* Recommended Google Sign-In */}
        <button
          type="button"
          disabled={loading}
          onClick={handleGoogle}
          className="w-full py-3 px-4 bg-[#F4F4F5] hover:bg-white text-[#09090B] text-sm font-semibold rounded-md transition-colors disabled:opacity-50"
        >
          Continue with Google
        </button>

        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex-1 h-px bg-zinc-800" />
          <span>or email</span>
          <span className="flex-1 h-px bg-zinc-800" />
        </div>

        <div className="grid grid-cols-2 p-1 bg-[#09090B] border border-zinc-800 rounded-md">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-2 text-xs font-medium rounded transition-colors ${
              mode === 'login'
                ? 'bg-[#D4AF37] text-[#09090B]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`py-2 text-xs font-medium rounded transition-colors ${
              mode === 'register'
                ? 'bg-[#D4AF37] text-[#09090B]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Saim Rauf"
                className="w-full px-3.5 py-2.5 bg-[#09090B] border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          )}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 bg-[#09090B] border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3.5 py-2.5 bg-[#09090B] border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-red-300 bg-red-950/40 border border-red-900 p-3 rounded-md">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#D4AF37] hover:bg-[#E2C258] text-[#09090B] text-xs font-semibold rounded-md transition-colors disabled:opacity-50"
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
              ? 'Sign In with Email'
              : 'Create Client Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
