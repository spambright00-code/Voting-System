
import React, { useState } from 'react';
import { Candidate, ElectionPhase } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { SUBCOUNTIES } from '../../../constants';
import { Trash2, UploadCloud, ImageIcon, AlertCircle, Edit, Plus } from 'lucide-react';
import { addCandidateToDb, deleteCandidateFromDb } from '../../services/supabaseService';

interface CandidateManagementProps {
  candidates: Candidate[];
  electionPhase: ElectionPhase;
  onRefresh: () => void;
  onAdd?: (candidate: Omit<Candidate, 'id'>) => void;
  onEdit?: (id: string, updates: Omit<Candidate, 'id'>) => void;
  onDelete?: (id: string) => void;
}

export const CandidateManagement: React.FC<CandidateManagementProps> = ({ 
  candidates, 
  electionPhase, 
  onRefresh,
  onAdd,
  onEdit,
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

  const handleEditClick = (candidate: Candidate) => {
    setEditingId(candidate.id);
    setNewCandidate({
      name: candidate.name,
      position: candidate.position,
      party: candidate.party,
      avatarUrl: candidate.avatarUrl,
      subCounty: candidate.subCounty || 'All'
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewCandidate({ name: '', position: 'Chairperson', party: '', avatarUrl: '', subCounty: 'All' });
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

      if (editingId) {
        if (onEdit) {
          onEdit(editingId, candidateData);
        } else {
          alert("Edit not implemented in DB mode directly here.");
        }
      } else {
        if (onAdd) {
          onAdd(candidateData);
        } else {
          await addCandidateToDb(candidateData);
        }
      }
      
      onRefresh();
      handleCancelEdit();
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      <div className="lg:col-span-1">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-xl shadow-slate-200/50 sticky top-24">
          <div className="flex items-center gap-3 mb-6">
             <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
               <Plus className="w-5 h-5" />
             </div>
             <h3 className="text-lg font-bold text-slate-900">{editingId ? "Edit Candidate" : "Add New Candidate"}</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Form Fields */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Candidate Name</label>
              <input 
                type="text" required
                value={newCandidate.name}
                onChange={(e) => setNewCandidate({...newCandidate, name: e.target.value})}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                disabled={electionPhase !== ElectionPhase.SETUP}
                placeholder="e.g. Jane Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Position</label>
              <div className="relative">
                <select
                  value={newCandidate.position}
                  onChange={(e) => setNewCandidate({...newCandidate, position: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  disabled={electionPhase !== ElectionPhase.SETUP}
                >
                  <option value="Chairperson">Chairperson</option>
                  <option value="Treasurer">Treasurer</option>
                  <option value="Secretary">Secretary</option>
                  <option value="Sub-County Representative">Sub-County Representative</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sub-County</label>
               <div className="relative">
                 <select
                  value={newCandidate.subCounty}
                  onChange={(e) => setNewCandidate({...newCandidate, subCounty: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  disabled={electionPhase !== ElectionPhase.SETUP}
                 >
                   <option value="All">All (General)</option>
                   {SUBCOUNTIES.map(sc => <option key={sc} value={sc}>{sc}</option>)}
                 </select>
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
               </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Party / Slogan</label>
              <input 
                type="text" required
                value={newCandidate.party}
                onChange={(e) => setNewCandidate({...newCandidate, party: e.target.value})}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                disabled={electionPhase !== ElectionPhase.SETUP}
                placeholder="e.g. Progressive Teachers"
              />
            </div>
            
            {/* Avatar Upload */}
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Photo</label>
               <div className="flex items-center space-x-4">
                 {newCandidate.avatarUrl ? (
                   <div className="relative">
                     <img src={newCandidate.avatarUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md" />
                     <div className="absolute inset-0 rounded-full border border-slate-200"></div>
                   </div>
                 ) : (
                   <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner"><ImageIcon className="w-6 h-6 text-slate-400" /></div>
                 )}
                 <label className={`flex-1 cursor-pointer flex flex-col items-center justify-center px-4 py-3 border border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-slate-400 transition-all ${electionPhase !== ElectionPhase.SETUP ? 'opacity-50' : ''}`}>
                   <UploadCloud className="w-5 h-5 text-slate-400 mb-1" /> 
                   <span className="text-xs font-bold text-slate-600">{newCandidate.avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
                   <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={electionPhase !== ElectionPhase.SETUP} />
                 </label>
               </div>
            </div>

            <div className="flex gap-3 pt-2">
                {editingId && (
                    <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={isLoading} className="flex-1 rounded-xl h-12 border-slate-200">
                        Cancel
                    </Button>
                )}
                <Button type="submit" fullWidth variant="primary" disabled={electionPhase !== ElectionPhase.SETUP || isLoading} className="flex-1 rounded-xl h-12 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
                  {isLoading ? 'Saving...' : (editingId ? 'Update Candidate' : 'Add Candidate')}
                </Button>
            </div>

            {electionPhase !== ElectionPhase.SETUP && (
               <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 leading-relaxed">
                 <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" /> 
                 Candidates can only be added or modified during the SETUP phase.
               </div>
            )}
          </form>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-8">
         {Array.from(new Set(candidates.map(c => c.position))).map(position => (
           <div key={position} className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/50 shadow-lg shadow-slate-200/50 overflow-hidden">
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800 text-lg">{position}</h3>
                 <span className="text-xs font-medium bg-white px-2 py-1 rounded border border-slate-200 text-slate-500">
                    {candidates.filter(c => c.position === position).length} candidates
                 </span>
              </div>
              
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {candidates.filter(c => c.position === position).map(candidate => (
                   <div key={candidate.id} className="bg-white rounded-2xl border border-slate-100 p-4 relative group hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex items-center gap-4">
                      {electionPhase === ElectionPhase.SETUP && (
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur rounded-lg p-1 shadow-sm border border-slate-100">
                           <button onClick={() => handleEditClick(candidate)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"><Edit className="w-3 h-3" /></button>
                           <button onClick={() => handleDelete(candidate.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      )}
                      
                      <div className="relative flex-shrink-0">
                         <img src={candidate.avatarUrl} alt="" className="w-16 h-16 rounded-2xl object-cover shadow-sm border border-slate-100 bg-slate-50" />
                      </div>
                      
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-base truncate">{candidate.name}</h4>
                        <p className="text-xs text-slate-500 font-medium truncate mb-2">{candidate.party}</p>
                        <span className="inline-flex px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wide rounded-md border border-slate-200">
                          {candidate.subCounty || 'All'}
                        </span>
                      </div>
                   </div>
                ))}
                {candidates.filter(c => c.position === position).length === 0 && (
                   <div className="col-span-full text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-2xl">
                      No candidates for this position yet.
                   </div>
                )}
              </div>
           </div>
         ))}
      </div>
    </div>
  );
};
