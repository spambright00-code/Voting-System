import React, { useState } from 'react';
import { Candidate, ElectionPhase } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SUBCOUNTIES } from '../../constants';
import { Trash2, UploadCloud, ImageIcon, AlertCircle } from 'lucide-react';
// Assuming services are at root/services
// If src/services exists, typescript might resolve relative to root if configured, but relative paths are safer
import { addCandidateToDb, deleteCandidateFromDb } from '../../services/supabaseService'; 

interface CandidateManagementProps {
  candidates: Candidate[];
  electionPhase: ElectionPhase;
  onRefresh: () => void;
  onAdd?: (candidate: Omit<Candidate, 'id'>) => void;
  onDelete?: (id: string) => void;
}

export const CandidateManagement: React.FC<CandidateManagementProps> = ({ 
  candidates, 
  electionPhase, 
  onRefresh,
  onAdd,
  onDelete
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    position: 'Chairperson',
    party: '',
    avatarUrl: '',
    subCounty: 'All'
  });

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCandidate(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.name) return;
    
    setIsLoading(true);
    try {
      const candidateData = {
        ...newCandidate,
        avatarUrl: newCandidate.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(newCandidate.name)}&background=random`
      };

      if (onAdd) {
        onAdd(candidateData);
      } else {
        if (editingId) {
          alert("Edit not implemented in this version. Please delete and recreate.");
        } else {
          await addCandidateToDb(candidateData);
        }
      }
      
      onRefresh();
      setNewCandidate({ name: '', position: 'Chairperson', party: '', avatarUrl: '', subCounty: 'All' });
    } catch (error) {
      console.error(error);
      alert("Failed to save candidate.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(!window.confirm("Delete this candidate?")) return;
    try {
      if (onDelete) {
        onDelete(id);
      } else {
        await deleteCandidateFromDb(id);
      }
      onRefresh();
    } catch (e) {
      alert("Failed to delete");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      <div className="lg:col-span-1">
        <Card title={editingId ? "Edit Candidate" : "Add New Candidate"} className="sticky top-24">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Candidate Name</label>
              <input 
                type="text" required
                value={newCandidate.name}
                onChange={(e) => setNewCandidate({...newCandidate, name: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                disabled={electionPhase !== ElectionPhase.SETUP}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <select
                value={newCandidate.position}
                onChange={(e) => setNewCandidate({...newCandidate, position: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                disabled={electionPhase !== ElectionPhase.SETUP}
              >
                <option value="Chairperson">Chairperson</option>
                <option value="Treasurer">Treasurer</option>
                <option value="Secretary">Secretary</option>
                <option value="Sub-County Representative">Sub-County Representative</option>
              </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Sub-County</label>
               <select
                value={newCandidate.subCounty}
                onChange={(e) => setNewCandidate({...newCandidate, subCounty: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                disabled={electionPhase !== ElectionPhase.SETUP}
               >
                 <option value="All">All (General)</option>
                 {SUBCOUNTIES.map(sc => <option key={sc} value={sc}>{sc}</option>)}
               </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Party / Slogan</label>
              <input 
                type="text" required
                value={newCandidate.party}
                onChange={(e) => setNewCandidate({...newCandidate, party: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                disabled={electionPhase !== ElectionPhase.SETUP}
              />
            </div>
            
            {/* Avatar Upload */}
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
               <div className="flex items-center space-x-4">
                 {newCandidate.avatarUrl ? (
                   <img src={newCandidate.avatarUrl} alt="Preview" className="w-12 h-12 rounded-full object-cover border" />
                 ) : (
                   <div className="w-12 h-12 rounded-full bg-gray-100 border flex items-center justify-center"><ImageIcon className="w-6 h-6 text-gray-400" /></div>
                 )}
                 <label className={`flex-1 cursor-pointer flex items-center justify-center px-4 py-2 border rounded-lg shadow-sm text-sm font-medium bg-white hover:bg-gray-50 ${electionPhase !== ElectionPhase.SETUP ? 'opacity-50' : ''}`}>
                   <UploadCloud className="w-4 h-4 mr-2" /> {newCandidate.avatarUrl ? 'Change' : 'Upload'}
                   <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={electionPhase !== ElectionPhase.SETUP} />
                 </label>
               </div>
            </div>

            <Button type="submit" fullWidth variant="primary" disabled={electionPhase !== ElectionPhase.SETUP || isLoading}>
              {isLoading ? 'Saving...' : (editingId ? 'Update Candidate' : 'Add Candidate')}
            </Button>

            {electionPhase !== ElectionPhase.SETUP && (
               <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-100 rounded text-xs text-red-600">
                 <AlertCircle className="w-4 h-4 flex-shrink-0" /> Modify in SETUP phase.
               </div>
            )}
          </form>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-6">
         {Array.from(new Set(candidates.map(c => c.position))).map(position => (
           <Card key={position} title={position}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50/50">
                {candidates.filter(c => c.position === position).map(candidate => (
                   <div key={candidate.id} className="bg-white rounded-lg border shadow-sm p-4 relative group">
                      {electionPhase === ElectionPhase.SETUP && (
                        <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                           <button onClick={() => handleDelete(candidate.id)} className="p-1.5 bg-white text-red-600 border rounded shadow-sm"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      )}
                      <div className="flex items-center space-x-3">
                        <img src={candidate.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover border" />
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{candidate.name}</h4>
                          <p className="text-xs text-gray-500">{candidate.party}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full">{candidate.subCounty || 'All'}</span>
                        </div>
                      </div>
                   </div>
                ))}
              </div>
           </Card>
         ))}
      </div>
    </div>
  );
};