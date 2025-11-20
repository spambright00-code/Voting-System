
import React, { useState, useRef, useEffect } from 'react';
import { Voter, VoterStatus, ElectionPhase } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Search, CheckCircle, RefreshCw, Trash2, Download, UserPlus, Upload, X, Edit } from 'lucide-react';
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
       <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex gap-2">
           <Button onClick={openAddModal} className="h-10 text-sm">
             <UserPlus className="w-4 h-4 mr-2" /> Add Voter
           </Button>
           <Button variant="outline" onClick={triggerFileSelect} className="h-10 text-sm">
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
         <Button variant="outline" onClick={downloadCSV} className="h-10 text-sm text-gray-600">
           <Download className="w-4 h-4 mr-2" /> Export Data
         </Button>
       </div>

       <Card className="overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  className="pl-10 pr-4 py-2 w-full border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Search by Name or ID..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
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

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Voter Details</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVoters.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                       No voters found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredVoters.map(voter => (
                    <tr key={voter.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-indigo-900">{voter.membershipId}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">{voter.name}</div>
                        <div className="text-xs text-gray-500">{voter.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600">Ward: <span className="font-medium">{voter.ward}</span></div>
                        <div className="text-xs text-gray-400">{voter.county}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-full shadow-sm
                          ${voter.status === VoterStatus.VOTED ? 'bg-green-100 text-green-800 border border-green-200' : 
                            voter.status === VoterStatus.VERIFIED ? 'bg-blue-100 text-blue-800 border border-blue-200' : 
                            'bg-gray-100 text-gray-800 border border-gray-200'}`}>
                          {voter.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                         <div className="flex justify-end gap-2">
                           {electionPhase === ElectionPhase.SETUP && (
                             <>
                               <button onClick={() => openEditModal(voter)} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded transition-colors" title="Edit Details">
                                 <Edit className="w-4 h-4" />
                               </button>
                               <button onClick={() => handleAction(voter.id, 'DELETE')} className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors" title="Delete">
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             </>
                           )}
                           {voter.status === VoterStatus.UNVERIFIED && (
                             <button onClick={() => handleAction(voter.id, 'VERIFY')} className="text-green-600 hover:bg-green-50 p-1.5 rounded transition-colors" title="Manual Verify">
                               <CheckCircle className="w-4 h-4" />
                             </button>
                           )}
                           {voter.status === VoterStatus.VERIFIED && (
                             <button onClick={() => handleAction(voter.id, 'RESET')} className="text-orange-600 hover:bg-orange-50 p-1.5 rounded transition-colors" title="Reset Status">
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
       </Card>

       {/* Add/Edit Modal Overlay */}
       {isModalOpen && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <h3 className="text-lg font-bold text-gray-800">
                   {modalMode === 'ADD' ? 'Register New Voter' : 'Edit Voter Details'}
                 </h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                   <X className="w-5 h-5" />
                 </button>
               </div>
               
               <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Membership ID</label>
                     <input 
                       required
                       className="w-full p-2 border border-gray-300 rounded-lg text-sm uppercase"
                       value={formData.membershipId}
                       onChange={e => setFormData({...formData, membershipId: e.target.value})}
                       placeholder="MEM..."
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                     <input 
                       required
                       className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                       value={formData.phone}
                       onChange={e => setFormData({...formData, phone: e.target.value})}
                       placeholder="+254..."
                     />
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                   <input 
                     required
                     className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                     value={formData.name}
                     onChange={e => setFormData({...formData, name: e.target.value})}
                     placeholder="John Doe"
                   />
                 </div>

                 <div className="grid grid-cols-3 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Ward</label>
                     <input 
                       className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                       value={formData.ward}
                       onChange={e => setFormData({...formData, ward: e.target.value})}
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Constituency</label>
                     <input 
                       className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                       value={formData.constituency}
                       onChange={e => setFormData({...formData, constituency: e.target.value})}
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
                     <input 
                       className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                       value={formData.county}
                       onChange={e => setFormData({...formData, county: e.target.value})}
                     />
                   </div>
                 </div>

                 <div className="pt-4 flex gap-3">
                   <Button type="button" variant="outline" fullWidth onClick={() => setIsModalOpen(false)}>Cancel</Button>
                   <Button type="submit" fullWidth>
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
