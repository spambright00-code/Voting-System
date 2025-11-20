
import React from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  adminPassInput: string;
  setAdminPassInput: (value: string) => void;
  handleAdminLogin: (e: React.FormEvent) => void;
  errorMsg: string;
  navigateTo: (view: 'HOME') => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  adminPassInput,
  setAdminPassInput,
  handleAdminLogin,
  errorMsg,
  navigateTo
}) => {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <Card className="max-w-md w-full shadow-xl" title="Administrator Access">
        <form onSubmit={handleAdminLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Access Password</label>
            <input
              type="password"
              className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 p-3 border transition-all"
              value={adminPassInput}
              onChange={(e) => setAdminPassInput(e.target.value)}
              placeholder="Enter admin password..."
            />
          </div>
          {errorMsg && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex items-center"><AlertCircle className="w-4 h-4 mr-2"/> {errorMsg}</p>}
          <div className="flex flex-col gap-3">
            <Button type="submit" fullWidth className="h-12 bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-900/20">Login</Button>
            <Button type="button" variant="outline" fullWidth onClick={() => navigateTo('HOME')} className="h-12">Back to Home</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
