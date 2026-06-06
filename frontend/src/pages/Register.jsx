import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Mail, Lock, Phone, Building, MapPin, Loader2, ArrowRight } from 'lucide-react';
import api from '../api.js';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  role: z.enum(['admin', 'manager', 'vendor']),
  company_name: z.string().min(1, 'Company name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State/Province is required'),
  country: z.string().min(1, 'Country is required'),
  additional_info: z.string().optional(),
});

export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'vendor',
    }
  });

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/register/', data);
      // Automatically redirect to login page
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.username?.[0] || err.response?.data?.detail || 'Registration failed. Try a different username.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-y-auto bg-dark-950 mesh-bg py-12 px-4 relative font-sans flex items-start justify-center">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-brand-600/5 blur-[120px]" />
      <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-indigo-600/5 blur-[120px]" />

      <div className="w-full max-w-2xl glass-panel p-8 rounded-3xl border border-slate-800/60 shadow-2xl relative z-10">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-3xl font-bold font-display text-white tracking-tight">Register Company</h2>
          <p className="text-slate-400 text-sm">Join VendorBridge to streamline your procurement operations</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Account Credentials */}
          <div className="border-b border-slate-800/40 pb-5">
            <h3 className="text-sm font-semibold text-brand-400 uppercase tracking-wider mb-4">Account Login Credentials</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-300">Username *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input {...register('username')} placeholder="johndoe" className="w-full pl-10 pr-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm" />
                </div>
                {errors.username && <p className="text-xs text-red-400">{errors.username.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input {...register('email')} placeholder="john@example.com" className="w-full pl-10 pr-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm" />
                </div>
                {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input {...register('password')} type="password" placeholder="••••••••" className="w-full pl-10 pr-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm" />
                </div>
                {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="border-b border-slate-800/40 pb-5">
            <h3 className="text-sm font-semibold text-brand-400 uppercase tracking-wider mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-300">First Name *</label>
                <input {...register('first_name')} placeholder="John" className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm" />
                {errors.first_name && <p className="text-xs text-red-400">{errors.first_name.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">Last Name *</label>
                <input {...register('last_name')} placeholder="Doe" className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm" />
                {errors.last_name && <p className="text-xs text-red-400">{errors.last_name.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">Primary Phone *</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input {...register('phone')} placeholder="+1 (555) 000-0000" className="w-full pl-10 pr-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm" />
                </div>
                {errors.phone && <p className="text-xs text-red-400">{errors.phone.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">System Role *</label>
                <select {...register('role')} className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500 text-sm">
                  <option value="vendor">Vendor (Supplier Account)</option>
                  <option value="manager">Manager (Approval Account)</option>
                  <option value="admin">Admin (Procurement Admin)</option>
                </select>
                {errors.role && <p className="text-xs text-red-400">{errors.role.message}</p>}
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div>
            <h3 className="text-sm font-semibold text-brand-400 uppercase tracking-wider mb-4">Company Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs text-slate-300">Company Name *</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input {...register('company_name')} placeholder="Acme Logistics Inc." className="w-full pl-10 pr-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm" />
                </div>
                {errors.company_name && <p className="text-xs text-red-400">{errors.company_name.message}</p>}
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-xs text-slate-300">Street Address *</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input {...register('address')} placeholder="123 Corporate Way" className="w-full pl-10 pr-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm" />
                </div>
                {errors.address && <p className="text-xs text-red-400">{errors.address.message}</p>}
              </div>

              <div className="grid grid-cols-3 md:col-span-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">City *</label>
                  <input {...register('city')} placeholder="New York" className="w-full px-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm" />
                  {errors.city && <p className="text-xs text-red-400">{errors.city.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300">State / Prov *</label>
                  <input {...register('state')} placeholder="NY" className="w-full px-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm" />
                  {errors.state && <p className="text-xs text-red-400">{errors.state.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Country *</label>
                  <input {...register('country')} placeholder="USA" className="w-full px-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm" />
                  {errors.country && <p className="text-xs text-red-400">{errors.country.message}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Additional Information / Category Description</label>
              <textarea {...register('additional_info')} placeholder="Describe your primary products or services..." rows={3} className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm resize-none" />
            </div>
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
                Register Account <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-8 text-sm text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
