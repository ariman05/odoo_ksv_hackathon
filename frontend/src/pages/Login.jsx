import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import api from '../api.js';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);
    try {
      // Get JWT Tokens
      const tokenRes = await api.post('/api/auth/token/', data);
      localStorage.setItem('token', tokenRes.data.access);
      localStorage.setItem('refresh', tokenRes.data.refresh);

      // Fetch User Profile details
      const userRes = await api.get('/api/auth/me/');
      localStorage.setItem('user', JSON.stringify(userRes.data));

      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-dark-950 mesh-bg px-4 relative overflow-hidden font-sans">
      {/* Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-brand-600/10 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 h-96 w-96 rounded-full bg-indigo-600/10 blur-[120px]" />

      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-slate-800/60 shadow-2xl relative z-10">
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 items-center justify-center shadow-lg shadow-brand-500/20 mb-2">
            <span className="font-display font-bold text-white text-xl">V</span>
          </div>
          <h2 className="text-3xl font-bold font-display text-white tracking-tight">Welcome Back</h2>
          <p className="text-slate-400 text-sm">Enter your credentials to access the portal</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Username</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                {...register('username')}
                type="text"
                placeholder="Enter username"
                className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
            {errors.username && <p className="text-xs text-red-400 mt-1">{errors.username.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
            {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover-scale shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:pointer-events-none mt-6"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                Sign In <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-8 text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
            Register Company
          </Link>
        </div>
      </div>
    </div>
  );
}
