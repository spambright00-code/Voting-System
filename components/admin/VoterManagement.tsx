import React, { useState } from 'react';
import { Voter, VoterStatus, ElectionPhase } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Search, CheckCircle, RefreshCw, Trash2, Download } from 'lucide-react';
import { updateVoterStatus, deleteVoterFromDb } from '../../services/supabaseService';

interface VoterManagementProps {
  voters: Voter[];
  electionPhase: ElectionPhase;
  onRefresh: () => void;
  onVerify?: (id: string) => void;
  onReset?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const VoterManagement: React.FC<VoterManagementProps> = ({ 
  voters, 
  electionPhase, 
  onRefresh,
  onVerify,
  onReset,
  onDelete
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VoterStatus | 'ALL'>('ALL');

  const filteredVoters = voters.filter(v => {
    const matchesSearch = 
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      v.membershipId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAction = async (id: string, action: 'VERIFY' | 'RESET' | 'DELETE') => {
    try {
      if (action === 'VERIFY') {
        if (onVerify) {
          onVerify(id);
          return;
        }
        await updateVoterStatus(id, VoterStatus.VERIFIED);
      }
      if (action === 'RESET') {
        if (onReset) {
          onReset(id);
          return;
        }
        await updateVoterStatus(id, VoterStatus.UNVERIFIED);
      }
      if (action === 'DELETE') {
        if(!window.confirm("Delete voter?")) return;
        if (onDelete) {
          onDelete(id);
          return;
        }
        await deleteVoterFromDb(id);
      }
      onRefresh();
    } catch (error) {
      console.error(error);
      alert("Action failed");
    }
  };

  const downloadCSV = () => {
     const headers = ["MembershipID", "Name", "Phone", "Status"];
     const rows = filteredVoters.map(v => [v.membershipId, v.name, v.phone, v.status].join(","));
     const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", "voters.csv");
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
       <Card className="overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  className="pl-10 pr-4 py-2 w-full border rounded-lg text-sm"
                  placeholder="Search name or ID..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="border rounded-lg px-3 py-2 text-sm bg-white"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
              >
                <option value="ALL">All Status</option>
                <option value={VoterStatus.UNVERIFIED}>Unverified</option>
                <option value={VoterStatus.VERIFIED}>Verified</option>
                <option value={VoterStatus.VOTED}>Voted</option>
              </select>
            </div>
            <Button variant="outline" onClick={downloadCSV} className="text-xs h-9"><Download className="w-3 h-3 mr-2" /> Export</Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Voter</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVoters.map(voter => (
                  <tr key={voter.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">{voter.membershipId}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{voter.name}</div>
                      <div className="text-xs text-gray-500">{voter.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full 
                        ${voter.status === VoterStatus.VOTED ? 'bg-green-100 text-green-800' : 
                          voter.status === VoterStatus.VERIFIED ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {voter.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                       <div className="flex justify-end gap-2">
                         {electionPhase === ElectionPhase.SETUP && (
                           <button onClick={() => handleAction(voter.id, 'DELETE')} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                         )}
                         {voter.status === VoterStatus.UNVERIFIED && (
                           <button onClick={() => handleAction(voter.id, 'VERIFY')} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><CheckCircle className="w-4 h-4" /></button>
                         )}
                         {voter.status === VoterStatus.VERIFIED && (
                           <button onClick={() => handleAction(voter.id, 'RESET')} className="text-orange-600 hover:bg-orange-50 p-1 rounded"><RefreshCw className="w-4 h-4" /></button>
                         )}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
       </Card>
    </div>
  );
};