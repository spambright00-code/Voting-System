
import React, { useState, useEffect } from 'react';
import { ElectionSettings } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Save, Smartphone, Globe, Lock } from 'lucide-react';

interface SettingsPanelProps {
  settings: ElectionSettings;
  onUpdate: (s: ElectionSettings) => Promise<void>;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onUpdate }) => {
  const [form, setForm] = useState(settings);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => setForm(settings), [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await onUpdate(form);
    setIsLoading(false);
    alert("Settings Saved");
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
           <h3 className="text-lg font-bold text-slate-900">System Configuration</h3>
           <p className="text-sm text-slate-500">Manage election metadata and integrations</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* General Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
               <Globe className="w-4 h-4" /> General Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Election Title</label>
                <input 
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                  value={form.electionTitle}
                  onChange={e => setForm({...form, electionTitle: e.target.value})}
                  placeholder="e.g. Annual General Election 2024"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Organization Name</label>
                <input 
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                  value={form.organizationName}
                  onChange={e => setForm({...form, organizationName: e.target.value})}
                  placeholder="e.g. Teachers Welfare Association"
                />
              </div>
            </div>
          </div>
          
          <div className="w-full h-px bg-slate-100"></div>

          {/* SMS Section */}
          <div className="space-y-4">
             <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
               <Smartphone className="w-4 h-4" /> SMS Gateway Configuration
             </h4>
             <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-bold text-indigo-900 mb-2">API Key</label>
                   <div className="relative">
                     <input 
                       type="password" 
                       className="w-full p-3 border border-indigo-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow pr-10" 
                       value={form.smsApiKey || ''} 
                       onChange={e => setForm({...form, smsApiKey: e.target.value})} 
                       placeholder="Enter provider API key"
                     />
                     <Lock className="w-4 h-4 text-indigo-300 absolute right-3 top-1/2 -translate-y-1/2" />
                   </div>
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-indigo-900 mb-2">Sender ID</label>
                   <input 
                     className="w-full p-3 border border-indigo-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" 
                     value={form.smsSenderId || ''} 
                     onChange={e => setForm({...form, smsSenderId: e.target.value})} 
                     placeholder="e.g. MobiPoll"
                   />
                 </div>
               </div>
               <p className="text-xs text-indigo-600 mt-3 font-medium">
                 These credentials are used for sending OTPs. If left blank, the system will use simulation mode.
               </p>
             </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" isLoading={isLoading} className="rounded-xl h-12 px-8 bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-900/20">
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
