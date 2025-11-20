
import React, { useState, useRef, useEffect } from 'react';
import { Voter, VoterStatus, ElectionPhase } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Search, CheckCircle, RefreshCw, Trash2, Download, UserPlus, Upload, X, Edit, Filter } from 'lucide-react';
import { updateVoterStatus, deleteVoterFromDb, updateVoterDetails, addVoterToDb, mapVoter } from '../../services/supabaseService';
import { supabase } from '../../lib/supabase';

interface VoterManagementProps {
  voters: Voter[];
  electionPhase: ElectionPhase;
  onRefresh: () => void;
  onVerify?: (id: string) => void;
  onReset?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAdd?: (voter: Omit<Voter, 'id' | 'status'>) => void;
  onEdit?: (id: string, updates: Partial<Voter>) => void;
  onBulkImport?: (voters: Omit<Voter, 'id' | 'status'>[]) => void;
}

export const VoterManagement: React.FC<VoterManagementProps> = ({ 
  voters, 
  electionPhase, 
  onRefresh,
  onVerify,
  onReset,
  onDelete,
  onAdd,
  onEdit,
  onBulkImport
}) => {
  // Local state for real-time updates
  const [displayVoters, setDisplayVoters] = useState<Voter[]>(voters);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VoterStatus | 'ALL'>('ALL');
  
  // Sync props to state when props change (e.g. parent refresh)
  useEffect(() => {
    setDisplayVoters(voters);
  }, [voters]);

  // Real-time Subscription
  useEffect(() => {
    const channel = supabase
      .channel('realtime_voters_management')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voters' }, (payload: any) => {
         if (payload.eventType === 'INSERT') {
             setDisplayVoters(prev => {
                 if (prev.some(v => v.id === payload.new.id)) return prev;
                 return [...prev, mapVoter(payload.new)];
             });
         } else if (payload.eventType === 'UPDATE') {
             setDisplayVoters(prev => prev.map(v => v.id === payload.new.id ? mapVoter(payload.new) : v));
         } else if (payload.eventType === 'DELETE') {
             setDisplayVoters(prev => prev.filter(v => v.id !== payload.old.id));
         }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [editingVoterId, setEditingVoterId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    membershipId: '',
    name: '',
    phone: '',
    ward: '',
    constituency: '',
    county: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredVoters = displayVoters.filter(v => {
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

  // --- Modal Handlers ---

  const openAddModal = () => {
    setModalMode('ADD');
    setFormData({ membershipId: '', name: '', phone: '', ward: '', constituency: '', county: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (voter: Voter) => {
    setModalMode('EDIT');
    setEditingVoterId(voter.id);
    setFormData({
      membershipId: voter.membershipId,
      name: voter.name,
      phone: voter.phone,
      ward: voter.ward,
      constituency: voter.constituency,
      county: voter.county
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === 'ADD') {
        if (onAdd) {
          onAdd(formData);
        } else {
          await addVoterToDb(formData);
        }
      } else if (modalMode === 'EDIT' && editingVoterId) {
        if (onEdit) {
          onEdit(editingVoterId, formData);
        } else {
          await updateVoterDetails(editingVoterId, formData);
        }
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (error) {
      console.error("Failed to save voter", error);
      alert("Failed to save voter details.");
    }
  };

  // --- Bulk Import ---

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;
      
      // Simple CSV Parsing
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length < 2) return; // Header + 1 row minimum

      // Assume Header: MembershipID, Name, Phone, Ward, Constituency, County
      // Or just parse by index for simplicity in this demo
      const newVoters = lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.trim());
        if (cols.length < 3) return null; // minimal validation
        return {
          membershipId: cols[0],
          name: cols[1],
          phone: cols[2],
          ward: cols[3] || '',
          constituency: cols[4] || '',
          county: cols[5] || ''
        };
      }).filter(v => v !== null) as Omit<Voter, 'id' | 'status'>[];

      if (newVoters.length > 0 && onBulkImport) {
        onBulkImport(newVoters);
        alert(`Successfully imported ${newVoters.length} voters.`);
        onRefresh();
      } else {
        alert("No valid voters found in CSV.");
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const downloadCSV = () => {
     const headers = ["MembershipID", "Name", "Phone", "Ward", "Constituency", "County", "Status"];
     const rows = filteredVoters.map(v => [v.membershipId, v.name, v.phone, v.ward, v.constituency, v.county, v.status].join(","));
     const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", "voters_export.csv");
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 relative animate-fade-in">
       {/* Action Toolbar */}
       <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white/50">
         <div className="flex gap-2">
           <Button onClick={openAddModal} className="h-10 text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 shadow-md rounded-xl">
             <UserPlus className="w-4 h-4 mr-2" /> Add Voter
           </Button>
           <Button variant="outline" onClick={triggerFileSelect} className="h-10 text-sm rounded-xl bg-white">
             <Upload className="w-4 h-4 mr-2" /> Import CSV
           </Button>
           <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".csv" 
              onChange={handleFileUpload} 
           />
         </div>
         <Button variant="outline" onClick={downloadCSV} className="h-10 text-sm text-slate-600 rounded-xl bg-white">
           <Download className="w-4 h-4 mr-2" /> Export Data
         </Button>
       </div>

       <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/50">
            <div className="flex flex-1 gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  className="pl-10 pr-4 py-2.5 w-full border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-shadow focus:shadow-md"
                  placeholder="Search by Name or ID..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="relative">
                 <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                 <select 
                    className="pl-10 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer hover:bg-slate-50"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                  >
                    <option value="ALL">All Status</option>
                    <option value={VoterStatus.UNVERIFIED}>Unverified</option>
                    <option value={VoterStatus.VERIFIED}>Verified</option>
                    <option value={VoterStatus.VOTED}>Voted</option>
                  </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Identity</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-slate-50">
                {filteredVoters.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-slate-400 text-sm">
                       <div className="flex flex-col items-center justify-center">
                         <Search className="w-8 h-8 mb-2 opacity-20" />
                         <p>No voters found matching your filters.</p>
                       </div>
                    </td>
                  </tr>
                ) : (
                  filteredVoters.map((voter, idx) => (
                    <tr key={voter.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center">
                            <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs mr-3 border border-slate-200">
                               {voter.name.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                              {voter.membershipId}
                            </span>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-900">{voter.name}</div>
                        <div className="text-xs text-slate-500 font-medium">{voter.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-700 font-medium">{voter.ward}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wide">{voter.county}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full shadow-sm border
                          ${voter.status === VoterStatus.VOTED ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                            voter.status === VoterStatus.VERIFIED ? 'bg-violet-100 text-violet-700 border-violet-200' : 
                            'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {voter.status === VoterStatus.VOTED && <CheckCircle className="w-3 h-3 mr-1" />}
                          {voter.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                         <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           {electionPhase === ElectionPhase.SETUP && (
                             <>
                               <button onClick={() => openEditModal(voter)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors" title="Edit Details">
                                 <Edit className="w-4 h-4" />
                               </button>
                               <button onClick={() => handleAction(voter.id, 'DELETE')} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Delete">
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             </>
                           )}
                           {voter.status === VoterStatus.UNVERIFIED && (
                             <button onClick={() => handleAction(voter.id, 'VERIFY')} className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-colors" title="Manual Verify">
                               <CheckCircle className="w-4 h-4" />
                             </button>
                           )}
                           {voter.status === VoterStatus.VERIFIED && (
                             <button onClick={() => handleAction(voter.id, 'RESET')} className="text-amber-600 hover:bg-amber-50 p-2 rounded-lg transition-colors" title="Reset Status">
                               <RefreshCw className="w-4 h-4" />
                             </button>
                           )}
                         </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
       </div>

       {/* Add/Edit Modal Overlay */}
       {isModalOpen && (
         <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
               <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <h3 className="text-lg font-bold text-slate-900">
                   {modalMode === 'ADD' ? 'Register New Voter' : 'Edit Voter Details'}
                 </h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200/50 transition-colors">
                   <X className="w-5 h-5" />
                 </button>
               </div>
               
               <form onSubmit={handleModalSubmit} className="p-6 space-y-5">
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Membership ID</label>
                     <input 
                       required
                       className="w-full p-3 border border-slate-200 rounded-xl text-sm uppercase font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                       value={formData.membershipId}
                       onChange={e => setFormData({...formData, membershipId: e.target.value})}
                       placeholder="MEM..."
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                     <input 
                       required
                       className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                       value={formData.phone}
                       onChange={e => setFormData({...formData, phone: e.target.value})}
                       placeholder="+254..."
                     />
                   </div>
                 </div>

                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                   <input 
                     required
                     className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                     value={formData.name}
                     onChange={e => setFormData({...formData, name: e.target.value})}
                     placeholder="John Doe"
                   />
                 </div>

                 <div className="grid grid-cols-3 gap-3">
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ward</label>
                     <input 
                       className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                       value={formData.ward}
                       onChange={e => setFormData({...formData, ward: e.target.value})}
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Constituency</label>
                     <input 
                       className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                       value={formData.constituency}
                       onChange={e => setFormData({...formData, constituency: e.target.value})}
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">County</label>
                     <input 
                       className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                       value={formData.county}
                       onChange={e => setFormData({...formData, county: e.target.value})}
                     />
                   </div>
                 </div>

                 <div className="pt-4 flex gap-3">
                   <Button type="button" variant="outline" fullWidth onClick={() => setIsModalOpen(false)} className="rounded-xl h-12">Cancel</Button>
                   <Button type="submit" fullWidth className="rounded-xl h-12 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
                     {modalMode === 'ADD' ? 'Add Voter' : 'Save Changes'}
                   </Button>
                 </div>
               </form>
            </div>
         </div>
       )}
    </div>
  );
};
