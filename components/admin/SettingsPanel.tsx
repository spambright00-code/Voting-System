import React, { useState, useEffect } from 'react';
import { ElectionSettings } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Save, Smartphone } from 'lucide-react';

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
    <Card title="General Configuration">
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Election Title</label>
          <input 
            className="w-full p-3 border rounded-lg"
            value={form.electionTitle}
            onChange={e => setForm({...form, electionTitle: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
          <input 
            className="w-full p-3 border rounded-lg"
            value={form.organizationName}
            onChange={e => setForm({...form, organizationName: e.target.value})}
          />
        </div>
        
        <div className="border-t pt-4">
           <h4 className="text-md font-semibold mb-4 flex items-center"><Smartphone className="w-4 h-4 mr-2" /> SMS Gateway</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
               <input type="password" className="w-full p-2 border rounded" value={form.smsApiKey || ''} onChange={e => setForm({...form, smsApiKey: e.target.value})} />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Sender ID</label>
               <input className="w-full p-2 border rounded" value={form.smsSenderId || ''} onChange={e => setForm({...form, smsSenderId: e.target.value})} />
             </div>
           </div>
        </div>

        <Button type="submit" isLoading={isLoading}><Save className="w-4 h-4 mr-2" /> Save Changes</Button>
      </form>
    </Card>
  );
};