import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import api from '../api.js';

const rfqSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  deadline: z.string().min(1, 'Deadline is required'),
  items: z.array(z.object({
    item_name: z.string().min(1, 'Item name is required'),
    description: z.string().optional(),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    target_price: z.number().min(0.01, 'Target price must be greater than 0'),
  })).min(1, 'At least one item is required'),
});

export default function RFQForm({ onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(rfqSchema),
    defaultValues: {
      items: [{ item_name: '', description: '', quantity: 1, target_price: 1.00 }],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      await api.post('/api/rfqs/', data);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create RFQ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 lg:p-8 rounded-3xl border border-slate-800/60 shadow-2xl space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 border-b border-slate-800/40 pb-4">
        <div className="h-10 w-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 border border-brand-500/15">
          <FileText size={20} />
        </div>
        <div>
          <h3 className="font-display font-extrabold text-lg text-white tracking-tight">Create Request for Quotation (RFQ)</h3>
          <p className="text-xs text-slate-400">Specify details and target prices for required items</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* RFQ General details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RFQ Title *</label>
            <input 
              {...register('title')} 
              placeholder="e.g. Office Laptops & Monitors Upgrade" 
              className="input-premium"
            />
            {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deadline Date *</label>
            <input 
              {...register('deadline')} 
              type="date"
              className="input-premium"
            />
            {errors.deadline && <p className="text-xs text-red-400">{errors.deadline.message}</p>}
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RFQ Description *</label>
            <textarea 
              {...register('description')} 
              placeholder="Provide context, required specifications, and compliance terms..." 
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 text-sm resize-none"
            />
            {errors.description && <p className="text-xs text-red-400">{errors.description.message}</p>}
          </div>
        </div>

        {/* Nested RFQ items wizard */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-t border-slate-800/40 pt-6">
            <h4 className="text-xs font-bold text-brand-400 uppercase tracking-widest">Line Items</h4>
            <button
              type="button"
              onClick={() => append({ item_name: '', description: '', quantity: 1, target_price: 1.00 })}
              className="py-1.5 px-3 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 border border-brand-500/15 transition-all"
            >
              <Plus size={12} /> Add Line Item
            </button>
          </div>

          {errors.items?.root && <p className="text-xs text-red-400">{errors.items.root.message}</p>}

          <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-slate-950/30 border border-slate-800/60 rounded-2xl relative group">
                <div className="md:col-span-4 space-y-1">
                  <label className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Item Name *</label>
                  <input 
                    {...register(`items.${index}.item_name`)} 
                    placeholder="e.g. Dell XPS 15" 
                    className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                  />
                  {errors.items?.[index]?.item_name && <p className="text-[10px] text-red-400">{errors.items[index].item_name.message}</p>}
                </div>

                <div className="md:col-span-4 space-y-1">
                  <label className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Description</label>
                  <input 
                    {...register(`items.${index}.description`)} 
                    placeholder="Specs/Warranty" 
                    className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Qty *</label>
                  <input 
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })} 
                    type="number" 
                    min={1}
                    className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                  />
                  {errors.items?.[index]?.quantity && <p className="text-[10px] text-red-400">{errors.items[index].quantity.message}</p>}
                </div>

                <div className="md:col-span-2 space-y-1 relative pr-8">
                  <label className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Target Price *</label>
                  <input 
                    {...register(`items.${index}.target_price`, { valueAsNumber: true })} 
                    type="number" 
                    step="0.01"
                    min="0.01"
                    className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                  />
                  {errors.items?.[index]?.target_price && <p className="text-[10px] text-red-400">{errors.items[index].target_price.message}</p>}
                  
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="absolute right-0 bottom-2 text-slate-500 hover:text-red-400 p-1.5 transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 border-t border-slate-800/40 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary-premium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-premium disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Publish RFQ
          </button>
        </div>
      </form>
    </div>
  );
}
