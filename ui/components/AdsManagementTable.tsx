
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, ChevronLeft, ChevronRight, AlertCircle, 
  Trash2, Ban, Eye, MousePointerClick, CheckCircle,
  ShieldAlert, ArrowLeft, Store, MessageSquare, Layers, Tag,
  AlertTriangle
} from 'lucide-react';
import { MerchantAd } from '../../config/types';
import { updateAdStatus, bulkSuspendAds, removeAdEntries } from '../../features/admin/admin.service';

interface AdsManagementTableProps {
  ads: MerchantAd[];
  isLoading: boolean;
  onRefresh: () => void;
  onBack?: () => void; 
  storeName?: string;
  onNotification: (type: 'success' | 'error', msg: string) => void;
}

const ITEMS_PER_PAGE = 10;

const AdsManagementTable: React.FC<AdsManagementTableProps> = ({ ads, isLoading, onRefresh, onBack, storeName, onNotification }) => {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set());
  
  // Local State for Immediate UI Deletion
  const [localDeletedIds, setLocalDeletedIds] = useState<Set<string>>(new Set());
  
  // Modal State
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'delete'>('suspend');
  const [actionReason, setActionReason] = useState('policy_violation');
  const [actionDetails, setActionDetails] = useState('');
  const [targetAdId, setTargetAdId] = useState<string | null>(null);

  // Filter out locally deleted items immediately
  const activeAdsList = ads.filter(ad => !ad.isDeleted && ad.status !== 'deleted' && !localDeletedIds.has(ad.id));

  const filteredAds = activeAdsList.filter(ad => {
    const matchesSearch = 
      (ad.merchantName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
      (ad.title?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' ? true : ad.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredAds.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentAds = filteredAds.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const toggleSelectAll = () => {
    if (selectedAds.size === currentAds.length) {
      setSelectedAds(new Set());
    } else {
      setSelectedAds(new Set(currentAds.map(ad => ad.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedAds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedAds(newSet);
  };

  const openActionModal = (type: 'suspend' | 'delete', id?: string) => {
    setActionType(type);
    if (id) setTargetAdId(id);
    else setTargetAdId(null); 
    
    // Default reason - reset
    setActionReason('policy_violation');
    setActionDetails('');
    setShowActionModal(true);
  };

  const handleActionSubmit = async () => {
    const ids = targetAdId ? [targetAdId] : Array.from(selectedAds);
    
    if (ids.length === 0) return;

    // Reason is now required for BOTH suspend and delete
    const reasonText = `Reason: ${actionReason}. Details: ${actionDetails}`;

    if (actionType === 'suspend') {
        const result = await bulkSuspendAds(ids, reasonText);
        if (result.success) {
            onNotification('success', 'Ad suspended and merchant notified.');
            
            setLocalDeletedIds(prev => {
                const next = new Set(prev);
                ids.forEach(id => next.add(id));
                return next;
            });

            if (!targetAdId) setSelectedAds(new Set());
            setShowActionModal(false);
            onRefresh();
        } else {
            onNotification('error', `Failed to suspend: ${result.message}`);
        }
    } else {
        // DELETE ACTION - Now uses Soft Delete with Reason
        const result = await removeAdEntries(ids, reasonText);
        
        if (result.success) {
            onNotification('success', 'Ad removed and merchant notified.');
            
            setLocalDeletedIds(prev => {
                const next = new Set(prev);
                ids.forEach(id => next.add(id));
                return next;
            });
            
            if (!targetAdId) setSelectedAds(new Set());
            setShowActionModal(false);
            
            setTimeout(onRefresh, 500); 
        } else {
            onNotification('error', `Failed to delete: ${result.message}`);
        }
    }
  };

  const handleApprove = async (id: string) => {
      const success = await updateAdStatus(id, 'active');
      if (success) {
          onNotification('success', 'Ad approved successfully!');
          onRefresh();
      } else {
          onNotification('error', 'Failed to update ad status.');
      }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'active': return <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black uppercase tracking-wider">Active</span>;
        case 'pending_review': return <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-wider">Pending</span>;
        case 'suspended': return <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-black uppercase tracking-wider">Suspended</span>;
        case 'paused': return <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-black uppercase tracking-wider">Paused</span>;
        default: return <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-black uppercase tracking-wider">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {onBack && (
        <div className="flex items-center gap-4 mb-2">
            <button onClick={onBack} className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-nabih-purple hover:text-white hover:border-nabih-purple transition-all shadow-sm group">
                <ArrowLeft size={20} className="group-hover:scale-110 transition-transform rotate-180" /> 
            </button>
            <div>
                <h3 className="text-xl font-black text-nabih-slate flex items-center gap-2">
                    <Store className="text-nabih-merchant" />
                    {storeName || 'Merchant Store'}
                </h3>
                <p className="text-xs font-bold text-gray-400">Managing Ads for this merchant</p>
            </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative group w-full md:w-80">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-nabih-purple transition-colors" size={18} />
                <input 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by Ad Title..." 
                    className="w-full pr-12 pl-4 py-3 bg-gray-50 border-transparent rounded-xl font-bold text-sm outline-none focus:bg-white focus:border-nabih-purple focus:ring-4 focus:ring-nabih-purple/5 transition-all" 
                />
            </div>
            <div className="relative">
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none bg-gray-50 px-6 py-3 rounded-xl font-bold text-sm text-gray-600 outline-none focus:bg-white focus:border-nabih-purple focus:ring-4 focus:ring-nabih-purple/5 pr-10 cursor-pointer"
                >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="suspended">Suspended</option>
                    <option value="paused">Paused</option>
                </select>
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
        </div>
        
        <AnimatePresence>
            {selectedAds.size > 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="flex items-center gap-3 bg-slate-800 text-white px-4 py-2 rounded-xl shadow-lg"
                >
                    <span className="text-xs font-bold">{selectedAds.size} Selected</span>
                    <div className="h-4 w-px bg-white/20" />
                    <button onClick={() => openActionModal('suspend')} className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors text-amber-400">
                        <Ban size={14} /> Suspend
                    </button>
                    <button onClick={() => openActionModal('delete')} className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors text-red-400">
                        <Trash2 size={14} /> Delete
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                    <th className="p-6 text-center w-16">
                        <input 
                            type="checkbox" 
                            checked={currentAds.length > 0 && selectedAds.size === currentAds.length} 
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded border-gray-300 text-nabih-purple focus:ring-nabih-purple accent-nabih-purple cursor-pointer" 
                        />
                    </th>
                    <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-wider text-right">Ad Details</th>
                    <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-wider text-center">Type</th>
                    <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-wider text-right">Date</th>
                    <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-wider text-center">Status</th>
                    <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-wider text-center">Metrics</th>
                    <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-wider text-center">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                    <tr><td colSpan={7} className="p-12 text-center text-gray-400 font-bold">Loading Ads...</td></tr>
                ) : currentAds.length === 0 ? (
                    <tr><td colSpan={7} className="p-12 text-center text-gray-400 font-bold">No ads found matching your search.</td></tr>
                ) : (
                    currentAds.map(ad => (
                        <tr key={ad.id} className={`hover:bg-gray-50/80 transition-colors ${selectedAds.has(ad.id) ? 'bg-nabih-purple/5' : ''}`}>
                            <td className="p-6 text-center">
                                <input 
                                    type="checkbox" 
                                    checked={selectedAds.has(ad.id)} 
                                    onChange={() => toggleSelectOne(ad.id)}
                                    className="w-4 h-4 rounded border-gray-300 text-nabih-purple focus:ring-nabih-purple accent-nabih-purple cursor-pointer" 
                                />
                            </td>
                            <td className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                                        <img src={ad.imageUrl} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="max-w-xs">
                                        <h4 className="font-bold text-nabih-slate text-sm line-clamp-1">{ad.title}</h4>
                                        <p className="text-xs text-gray-400 line-clamp-1">{ad.category}</p>
                                        {ad.rejectionReason && (
                                            <div className="mt-1 flex items-center gap-1 text-[10px] text-red-500 font-bold">
                                                <AlertCircle size={10} /> {ad.rejectionReason}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td className="p-6 text-center">
                                {ad.entryType === 'campaign' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-nabih-purple/10 text-nabih-purple text-[10px] font-black uppercase">
                                        <Layers size={10} /> Campaign
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-500 text-[10px] font-black uppercase">
                                        <Tag size={10} /> Single
                                    </span>
                                )}
                            </td>
                            <td className="p-6 text-right">
                                <span className="text-xs font-bold text-gray-500">{new Date(ad.createdAt).toLocaleDateString()}</span>
                            </td>
                            <td className="p-6 text-center">
                                {getStatusBadge(ad.status)}
                            </td>
                            <td className="p-6">
                                <div className="flex justify-center gap-4 text-xs font-bold text-gray-500">
                                    <div className="flex flex-col items-center" title="Impressions">
                                        <Eye size={14} className="mb-1 text-nabih-purple" />
                                        {ad.impressions}
                                    </div>
                                    <div className="flex flex-col items-center" title="Clicks">
                                        <MousePointerClick size={14} className="mb-1 text-blue-500" />
                                        {ad.clicks}
                                    </div>
                                </div>
                            </td>
                            <td className="p-6">
                                <div className="flex items-center justify-center gap-2">
                                    {ad.status === 'pending_review' && (
                                        <button onClick={() => handleApprove(ad.id)} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Approve">
                                            <CheckCircle size={16} />
                                        </button>
                                    )}
                                    {ad.status !== 'suspended' && (
                                        <button onClick={() => openActionModal('suspend', ad.id)} className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-600 hover:text-white transition-all shadow-sm" title="Suspend">
                                            <Ban size={16} />
                                        </button>
                                    )}
                                    <button onClick={() => openActionModal('delete', ad.id)} className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm" title="Delete & Notify">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
        
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">
                Showing {currentAds.length} of {filteredAds.length} results
            </span>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hover:border-nabih-purple hover:text-nabih-purple transition-all"
                >
                    <ChevronRight size={16} className="rotate-180" />
                </button>
                <span className="text-sm font-black text-nabih-slate px-2">{currentPage} / {totalPages || 1}</span>
                <button 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hover:border-nabih-purple hover:text-nabih-purple transition-all"
                >
                    <ChevronLeft size={16} className="rotate-180" />
                </button>
            </div>
        </div>
      </div>

      <AnimatePresence>
        {showActionModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowActionModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-2xl z-[110]">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${actionType === 'delete' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
                            {actionType === 'delete' ? <Trash2 size={32} /> : <ShieldAlert size={32} />}
                        </div>
                        <h3 className="text-2xl font-black text-nabih-slate">
                            {actionType === 'delete' ? 'Delete & Notify' : 'Suspend Ad'}
                        </h3>
                        <p className="text-xs font-bold text-gray-400 mt-1">
                            {targetAdId 
                                ? (actionType === 'delete' ? 'This will remove the ad but keep it visible to merchant with reason.' : 'This will pause the ad immediately.') 
                                : `${actionType === 'delete' ? 'Removing' : 'Suspending'} ${selectedAds.size} ads.`}
                        </p>
                    </div>

                    <div className="space-y-4">
                        {/* REASON INPUTS - REQUIRED FOR BOTH ACTIONS */}
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-gray-400 tracking-wider">Reason</label>
                            <select 
                                value={actionReason} 
                                onChange={(e) => setActionReason(e.target.value)} 
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-nabih-slate focus:bg-white focus:border-nabih-purple outline-none appearance-none cursor-pointer"
                            >
                                <option value="policy_violation">Policy Violation (مخالفة السياسة)</option>
                                <option value="inappropriate_content">Inappropriate Content (محتوى غير لائق)</option>
                                <option value="misleading">Misleading Information (معلومات مضللة)</option>
                                <option value="quality_issue">Quality Issue (جودة منخفضة)</option>
                                <option value="other">Other (أخرى)</option>
                            </select>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-2">
                                <MessageSquare size={12} /> {actionType === 'delete' ? 'Reason for Removal' : 'Message to Merchant'}
                            </label>
                            <textarea 
                                value={actionDetails} 
                                onChange={(e) => setActionDetails(e.target.value)} 
                                placeholder={actionType === 'delete' ? "Why is this ad being removed? (Visible to merchant)" : "Explain why this ad is being suspended..."}
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-nabih-slate focus:bg-white focus:border-nabih-purple outline-none min-h-[100px]"
                            />
                        </div>

                        {actionType === 'delete' && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 font-bold text-[10px] flex items-start gap-2">
                                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                <div>
                                    Warning: The merchant will see this as "REMOVED" with your message. It will be hidden from consumers.
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 mt-8">
                        <button onClick={() => setShowActionModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-xl font-black text-sm hover:bg-gray-200 transition-all">Cancel</button>
                        <button onClick={handleActionSubmit} className={`flex-1 py-4 text-white rounded-xl font-black text-sm shadow-lg transition-all ${actionType === 'delete' ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'}`}>
                            Confirm {actionType === 'delete' ? 'Remove' : 'Suspend'}
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdsManagementTable;
