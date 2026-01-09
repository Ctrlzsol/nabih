
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  getAllUsers, getAllAds, getGlobalSearchHistory, 
  deleteUserAccount, toggleUserRole, updateUserProfile
} from '../../features/admin/admin.service';
import { UserProfile, MerchantAd } from '../../config/types';
import { 
  Users, Store, LayoutGrid, Activity, LogOut, Search, 
  Trash2, Shield, LayoutDashboard, MapPin, 
  Edit2, Save, X, Lock, Clock, Tag,
  PieChart as PieChartIcon, Download, Globe, TrendingUp, Megaphone, ArrowRight, UserCheck, AlertTriangle, CheckCircle, ShieldAlert, ChevronLeft, ChevronRight, Eye, Phone, Mail
} from 'lucide-react';
import { NabihLogo } from '../components/NabihLogo';
import { useAppStore } from '../../stores/app.store';
import { COUNTRIES } from '../../config/countries';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend, CartesianGrid
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AdsManagementTable from '../components/AdsManagementTable';

// --- STABLE SUB-COMPONENT FOR USERS TABLE ---
const UsersTable = ({ 
    userList, 
    isMerchantTable, 
    onGeneratePDF, 
    isGeneratingPDF, 
    onRoleToggle, 
    onEdit, 
    onDelete 
}: { 
    userList: UserProfile[], 
    isMerchantTable: boolean, 
    onGeneratePDF: () => void, 
    isGeneratingPDF: boolean,
    onRoleToggle: (user: UserProfile, role: string, currentStatus: boolean) => void,
    onEdit: (u: UserProfile) => void,
    onDelete: (id: string) => void
}) => {
    return (
        <div className="space-y-4">
            <div className="flex justify-end mb-4">
                <button onClick={onGeneratePDF} disabled={isGeneratingPDF} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-wait ${isMerchantTable ? 'bg-nabih-merchant text-white hover:bg-nabih-merchantAccent' : 'bg-nabih-purple text-white hover:bg-nabih-accent'}`}>
                    {isGeneratingPDF ? <Clock className="animate-spin" size={16} /> : <Download size={16} />} {isGeneratingPDF ? 'جاري التجهيز...' : 'تصدير القائمة (PDF)'}
                </button>
            </div>
            <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-right">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                    <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-wider">{isMerchantTable ? 'المتجر / التاجر' : 'المستخدم'}</th>
                    {isMerchantTable && <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-wider">تفاصيل المتجر</th>}
                    <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-wider">الصلاحيات</th>
                    <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-wider">الاتصال</th>
                    <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-wider">إجراءات</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {userList.length === 0 ? (
                        <tr><td colSpan={5} className="p-12 text-center text-gray-400 font-bold">{isMerchantTable ? 'لا يوجد تجار مسجلين حالياً مطابقين للبحث' : 'لا يوجد مستخدمين أفراد مطابقين للبحث'}</td></tr>
                    ) : userList.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50/80 transition-colors group">
                                <td className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl ${isMerchantTable ? 'bg-nabih-merchant text-white' : 'bg-nabih-purple/5 text-nabih-purple'} flex items-center justify-center font-black text-lg`}>
                                    {(isMerchantTable ? (u.storeName || u.name || '?') : (u.name || '?')).charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-bold text-nabih-slate text-base mb-1 flex items-center gap-2">
                                            {isMerchantTable ? (u.storeName || u.name || 'Unknown Store') : (u.name || 'Unknown User')}
                                            {u.roles?.includes('merchant') && u.roles?.includes('individual') && (<span className="text-[9px] bg-gradient-to-r from-nabih-purple to-nabih-merchant text-white px-2 py-0.5 rounded-full font-black">HYBRID</span>)}
                                        </div>
                                        {isMerchantTable && <div className="text-xs text-gray-400 font-bold">{u.name}</div>}
                                        <div className="text-xs text-gray-400 font-bold flex items-center gap-1 bg-gray-100 w-fit px-2 py-0.5 rounded-md mt-1"><MapPin size={10} /> {COUNTRIES.find(c => c.id === u.country)?.ar || u.country}</div>
                                    </div>
                                </div>
                                </td>
                                {isMerchantTable && (
                                    <td className="p-6">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-xs font-bold text-nabih-slate bg-gray-100 px-2 py-1 rounded w-fit">CR: {u.crNumber || 'N/A'}</span>
                                            <span className="text-xs font-bold text-gray-400 flex items-center gap-1"><Tag size={12} /> {u.storeCategory || 'General'}</span>
                                        </div>
                                    </td>
                                )}
                                <td className="p-6">
                                    <div className="flex flex-col gap-2">
                                        {[{ id: 'admin', label: 'Admin', color: 'text-nabih-purple' }, { id: 'merchant', label: 'Merchant', color: 'text-emerald-600' }, { id: 'individual', label: 'User', color: 'text-blue-600' }].map(role => (
                                            <label key={role.id} className="flex items-center gap-3 cursor-pointer select-none hover:bg-gray-100 p-2 rounded-lg transition-colors w-full border border-transparent hover:border-gray-200">
                                                <input 
                                                    type="checkbox" 
                                                    checked={u.roles?.includes(role.id as any) || false} 
                                                    onChange={() => onRoleToggle(u, role.id, u.roles?.includes(role.id as any) || false)} 
                                                    className="w-4 h-4 rounded border-gray-300 text-nabih-purple focus:ring-nabih-purple accent-nabih-purple" 
                                                />
                                                <span className={`text-xs font-bold ${role.color}`}>{role.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-sm font-bold text-gray-600">{u.email}</span>
                                        <span className="text-xs font-bold text-gray-400" dir="ltr">{u.phone || '-'}</span>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => onEdit(u)} className="p-2.5 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit2 size={18} /></button>
                                        <button onClick={() => onDelete(u.id)} className="p-2.5 text-red-500 bg-red-50 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        )
                    )}
                </tbody>
                </table>
            </div>
        </div>
    );
};

const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { actions } = useAppStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'merchants' | 'user-analytics' | 'ads' | 'analytics'>('overview');
  
  // --- SYNCHRONIZED STATS STATE ---
  const [dashboardStats, setDashboardStats] = useState({ 
      individuals: 0, 
      merchants: 0, 
      ads: 0,
      admins: 0
  });

  // Table Data States (For Lists & Charts)
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [ads, setAds] = useState<MerchantAd[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  
  // Chart Data States
  const [growthData, setGrowthData] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Merchant Ads Drill-down State
  const [selectedMerchantForAds, setSelectedMerchantForAds] = useState<UserProfile | null>(null);
  
  // Pagination State for Merchants Table
  const [merchantPage, setMerchantPage] = useState(1);
  const MERCHANTS_PER_PAGE = 10;

  // Edit User/Merchant State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Confirmation Modal State
  const [pendingRoleAction, setPendingRoleAction] = useState<{ user: UserProfile, role: string, currentStatus: boolean } | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  // Reload Trigger
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // --- 1. CORE DATA FETCHING (Unified Logic) ---
  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        console.log("AdminDashboard: Starting Data Sync...");

        try {
            const [usersData, adsData, historyData] = await Promise.all([
                getAllUsers(),
                getAllAds(),
                getGlobalSearchHistory()
            ]);
            
            const safeUsers = usersData || [];
            const safeAds = adsData || [];
            const safeHistory = historyData || [];

            setUsers(safeUsers);
            setAds(safeAds);
            setHistory(safeHistory);

            const individualCount = safeUsers.filter(u => u.roles?.includes('individual') || u.role === 'individual' || (!u.roles?.includes('merchant') && !u.roles?.includes('admin'))).length;
            const merchantCount = safeUsers.filter(u => u.roles?.includes('merchant') || u.role === 'merchant').length;
            const adminCount = safeUsers.filter(u => u.roles?.includes('admin') || u.role === 'admin').length;
            const activeAdsCount = safeAds.filter(a => !a.isDeleted && a.status === 'active').length;

            setDashboardStats({
                individuals: individualCount,
                merchants: merchantCount,
                ads: activeAdsCount,
                admins: adminCount
            });

            // PREPARE GROWTH CHART DATA
            const last7Days = Array.from({length: 7}, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return d.toISOString().split('T')[0];
            });

            const chartData = last7Days.map(dateStr => {
                const dayUsers = safeUsers.filter(u => u.createdAt && u.createdAt.startsWith(dateStr)).length;
                const dayAds = safeAds.filter(a => a.createdAt && a.createdAt.startsWith(dateStr)).length;
                const daySearches = safeHistory.filter(h => h.timestamp && h.timestamp.startsWith(dateStr)).length;
                
                return {
                    name: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
                    users: dayUsers,
                    ads: dayAds,
                    searches: daySearches
                };
            });
            setGrowthData(chartData);

        } catch (err) {
            console.error("AdminDashboard Data Sync Error:", err);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [reloadTrigger]);

  // --- ANALYTICS DATA CALCULATION ---
  const analyticsCalculations = useMemo(() => {
      const userDemographics = [
          { name: 'أفراد (Individuals)', value: dashboardStats.individuals, color: '#3B82F6' },
          { name: 'تجار (Merchants)', value: dashboardStats.merchants, color: '#10B981' },
          { name: 'إدارة (Admins)', value: dashboardStats.admins, color: '#1D1D1F' }
      ];

      const termCounts: Record<string, number> = {};
      history.forEach(h => {
          if (!h.query) return;
          const term = h.query.toLowerCase().trim();
          termCounts[term] = (termCounts[term] || 0) + 1;
      });
      const topTerms = Object.entries(termCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 7);

      const countryCounts: Record<string, number> = {};
      history.forEach(h => {
          const c = h.country || 'Unknown';
          countryCounts[c] = (countryCounts[c] || 0) + 1;
      });
      const topCountries = Object.entries(countryCounts)
          .map(([code, value]) => ({ 
              name: COUNTRIES.find(c => c.id === code)?.ar || code, 
              value 
          }))
          .sort((a, b) => b.value - a.value);

      return {
          userDemographics,
          topTerms,
          topCountries,
          totalSearches: history.length
      };
  }, [dashboardStats, history]);

  const showNotification = (type: 'success' | 'error', msg: string) => {
      setNotification({ type, msg });
      setTimeout(() => setNotification(null), 3000);
  };

  // --- ACTIONS ---
  const generatePDF = (type: 'users' | 'merchants') => {
      setIsGeneratingPDF(true);
      const doc = new jsPDF();
      
      const title = type === 'merchants' ? 'Merchants List' : 'Users List';
      doc.setFontSize(16);
      doc.text(title, 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 26);

      const tableColumn = type === 'merchants' 
          ? ["Store", "Contact", "Email", "Phone", "Status"] 
          : ["Name", "Email", "Role", "Country", "Status"];
      
      const tableRows: any[] = [];
      const data = type === 'merchants' ? filteredMerchants : filteredIndividualUsers;

      data.forEach(u => {
          const rowData = type === 'merchants' 
              ? [u.storeName || '-', u.name || '-', u.email || '-', u.phone || '-', u.status || '-']
              : [u.name || '-', u.email || '-', u.roles?.join(', ') || '-', u.country || '-', u.status || '-'];
          tableRows.push(rowData);
      });

      autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 30,
      });

      doc.save(`nabih_${type}_report.pdf`);
      setIsGeneratingPDF(false);
  };

  const handleOpenEdit = (user: UserProfile) => {
      setEditingUser(user);
      setEditForm({ name: user.name, phone: user.phone, country: user.country || 'JO', email: user.email, password: '' });
      setShowEditModal(true);
  };
  
  const handleSaveUser = async () => {
      if (!editingUser) return;
      await updateUserProfile(editingUser.id, editForm);
      setShowEditModal(false); 
      setEditingUser(null);
      setReloadTrigger(prev => prev + 1);
  };
  
  // 1. Initial Click Handler - Just Sets State for Modal
  const handleRoleToggleRequest = (user: UserProfile, role: string, currentStatus: boolean) => {
      setPendingRoleAction({ user, role, currentStatus });
  };

  // 2. Confirmed Action Handler - Executes Logic
  const confirmRoleChange = async () => {
      if (!pendingRoleAction) return;
      
      const { user, role, currentStatus } = pendingRoleAction;
      const newStatus = !currentStatus;
      const userId = user.id;

      setPendingRoleAction(null); // Close modal immediately

      // Optimistic UI Update
      setUsers(prevUsers => prevUsers.map(u => {
          if (u.id === userId) {
              let newRoles = u.roles ? [...u.roles] : [];
              if (newStatus) {
                  if (!newRoles.includes(role as any)) newRoles.push(role as any);
              } else {
                  newRoles = newRoles.filter(r => r !== role);
              }
              
              let primaryRole = 'individual';
              if (newRoles.includes('admin')) primaryRole = 'admin';
              else if (newRoles.includes('merchant')) primaryRole = 'merchant';

              return { ...u, roles: newRoles, role: primaryRole as any };
          }
          return u;
      }));

      try {
          // Perform backend update
          const result = await toggleUserRole(userId, role, newStatus);
          
          if (!result.success) {
              // Failure case: Reload to revert UI state
              console.error("Role update failed:", result.message);
              setReloadTrigger(prev => prev + 1);
              showNotification('error', `فشل التعديل: ${result.message}`);
          } else {
              // Success case: Show notification
              showNotification('success', 'تم تحديث صلاحيات المستخدم بنجاح ومزامنتها مع النظام.');
              // Slight delay to allow DB sync before refresh, if needed
              setTimeout(() => setReloadTrigger(prev => prev + 1), 500); 
          }
      } catch (err: any) {
          console.error("Role update threw error:", err);
          setReloadTrigger(prev => prev + 1);
          showNotification('error', `حدث خطأ غير متوقع: ${err.message || err}`);
      }
  };

  const refreshData = () => {
      setReloadTrigger(prev => prev + 1);
  };

  // --- FILTERS ---
  const filteredIndividualUsers = useMemo(() => users.filter(u => {
    const isIndividual = u.roles?.includes('individual') || u.roles?.includes('consumer') || !u.roles || u.roles.length === 0;
    if (!isIndividual) return false;
    return (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
  }), [users, searchTerm]);

  const filteredMerchants = useMemo(() => users.filter(u => {
     const isMerchant = u.roles?.includes('merchant');
     if (!isMerchant) return false;
     return (u.storeName || '').toLowerCase().includes(searchTerm.toLowerCase()) || (u.name || '').toLowerCase().includes(searchTerm.toLowerCase());
  }), [users, searchTerm]);

  // PAGINATION FOR ADS TAB MERCHANTS
  const merchantsTotalPages = Math.ceil(filteredMerchants.length / MERCHANTS_PER_PAGE);
  const merchantStartIndex = (merchantPage - 1) * MERCHANTS_PER_PAGE;
  const currentMerchantsForAds = filteredMerchants.slice(merchantStartIndex, merchantStartIndex + MERCHANTS_PER_PAGE);

  useEffect(() => {
    setMerchantPage(1);
  }, [searchTerm, activeTab]);

  const SidebarItem = ({ id, icon: Icon, label }: any) => (
    <button onClick={() => { setActiveTab(id); setSearchTerm(''); setSelectedMerchantForAds(null); }}
      className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all font-bold text-sm mb-2 group ${activeTab === id ? 'bg-nabih-purple text-white shadow-lg' : 'text-nabih-slate/50 hover:bg-white hover:text-nabih-purple'}`}>
      <div className="flex items-center gap-4"><Icon size={20} /><span>{label}</span></div>
    </button>
  );

  const StatCard = ({ title, value, sub, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:shadow-lg transition-all">
       <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${color} opacity-10 group-hover:scale-125 transition-transform`} />
       <div>
          <p className="text-nabih-slate/40 font-bold text-xs uppercase tracking-widest mb-1">{title}</p>
          <h3 className="text-3xl font-[1000] text-nabih-slate min-h-[40px] flex items-center">
             {value}
          </h3>
          {sub && <p className="text-[10px] font-bold text-emerald-500 mt-2 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">{sub}</p>}
       </div>
       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${color} shadow-lg shadow-${color.replace('bg-', '')}/30`}><Icon size={20} /></div>
    </div>
  );

  return (
    <div dir="rtl" className="flex min-h-screen bg-[#F5F5F7] font-body text-right overflow-hidden">
      
      {/* NOTIFICATIONS */}
      <AnimatePresence>
          {notification && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`fixed top-12 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl shadow-2xl z-[200] font-black text-sm flex items-center gap-4
                    ${notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}
                `}
              >
                  {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                  {notification.msg}
              </motion.div>
          )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-l border-gray-200 flex flex-col p-6 z-20 shadow-xl shrink-0 h-screen sticky top-0">
        <div className="flex items-center gap-3 px-2 mb-10 mt-2">
           <NabihLogo size={24} />
           <div className="flex flex-col"><span className="text-2xl font-[1000] text-nabih-slate tracking-tight">نبيه <span className="text-nabih-purple">إدارة</span></span></div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
          <SidebarItem id="overview" icon={LayoutDashboard} label="لوحة النمو" />
          <SidebarItem id="users" icon={Users} label="سجل الأفراد" />
          <SidebarItem id="merchants" icon={Store} label="سجل التجار" />
          <SidebarItem id="user-analytics" icon={UserCheck} label="تحليلات المستخدمين" />
          <SidebarItem id="ads" icon={LayoutGrid} label="إدارة الإعلانات" />
          <SidebarItem id="analytics" icon={Activity} label="التحليلات الذكية" />
        </nav>
        <div className="pt-6 border-t border-gray-100">
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-6 py-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-all"><LogOut size={20} /> تسجيل الخروج</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen relative overflow-hidden">
        {/* TOP HEADER */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-24 shrink-0 flex items-center justify-between px-10 z-10 sticky top-0">
          <div>
             <h1 className="text-3xl font-[1000] text-nabih-slate tracking-tight">
                 {activeTab === 'overview' && 'نظرة عامة ومؤشرات الأداء'}
                 {activeTab === 'users' && 'قاعدة بيانات الأفراد'}
                 {activeTab === 'merchants' && 'قاعدة بيانات التجار'}
                 {activeTab === 'user-analytics' && 'تحليلات قاعدة المستخدمين'}
                 {activeTab === 'ads' && 'مركز التحكم بالإعلانات'}
                 {activeTab === 'analytics' && 'تحليلات سلوك البحث'}
             </h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="relative group">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-nabih-purple transition-colors" size={18} />
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="بحث في البيانات..." className="pr-12 pl-4 py-3 bg-gray-100 border-transparent rounded-xl w-72 font-bold text-sm outline-none focus:bg-white focus:border-nabih-purple focus:ring-4 focus:ring-nabih-purple/5 transition-all" />
            </div>
            <div className="px-4 py-2 bg-slate-800 text-white rounded-xl border border-slate-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg"><Shield size={12} className="text-emerald-400" /> SUPER ADMIN</div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-10 pb-32 pt-10">
            <div className="max-w-8xl mx-auto space-y-8">
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <StatCard 
                                icon={Users} 
                                title="إجمالي المستخدمين" 
                                value={dashboardStats.individuals} 
                                sub="المسجلين في النظام (الأفراد)" 
                                color="bg-blue-600" 
                            />
                            <StatCard 
                                icon={Store} 
                                title="سجل التجار" 
                                value={dashboardStats.merchants} 
                                sub="عدد المتاجر (تجار)" 
                                color="bg-nabih-merchant" 
                            />
                            <StatCard 
                                icon={LayoutGrid} 
                                title="الإعلانات النشطة" 
                                value={dashboardStats.ads} 
                                sub="في جميع المناطق" 
                                color="bg-emerald-600" 
                            />
                            <StatCard icon={Megaphone} title="الحملات" value={0} sub="الحملات الترويجية" color="bg-nabih-purple" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                                <h3 className="text-lg font-black text-nabih-slate mb-6">نشاط المنصة (آخر 7 أيام)</h3>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={growthData}>
                                            <defs>
                                                <linearGradient id="colorSearches" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#2E0249" stopOpacity={0.1}/>
                                                    <stop offset="95%" stopColor="#2E0249" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                            <Area type="monotone" dataKey="searches" stroke="#2E0249" strokeWidth={3} fillOpacity={1} fill="url(#colorSearches)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                                <h3 className="text-lg font-black text-nabih-slate mb-6">الإعلانات الجديدة (آخر 7 أيام)</h3>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={growthData}>
                                            <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                            <Tooltip cursor={{fill: '#f5f5f7'}} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                            <Bar dataKey="ads" fill="#5D4037" radius={[6, 6, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Using the Stable Sub-Component */}
                {activeTab === 'users' && (
                    <UsersTable 
                        userList={filteredIndividualUsers} 
                        isMerchantTable={false} 
                        onGeneratePDF={() => generatePDF('users')}
                        isGeneratingPDF={isGeneratingPDF}
                        onRoleToggle={handleRoleToggleRequest}
                        onEdit={handleOpenEdit}
                        onDelete={(id) => { if(confirm('حذف هذا الحساب نهائياً؟')) deleteUserAccount(id).then(refreshData) }}
                    />
                )}
                {activeTab === 'merchants' && (
                    <UsersTable 
                        userList={filteredMerchants} 
                        isMerchantTable={true} 
                        onGeneratePDF={() => generatePDF('merchants')}
                        isGeneratingPDF={isGeneratingPDF}
                        onRoleToggle={handleRoleToggleRequest}
                        onEdit={handleOpenEdit}
                        onDelete={(id) => { if(confirm('حذف هذا الحساب نهائياً؟')) deleteUserAccount(id).then(refreshData) }}
                    />
                )}
                
                {/* USER ANALYTICS TAB */}
                {activeTab === 'user-analytics' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard 
                                icon={Users} 
                                title="أفراد فقط" 
                                value={dashboardStats.individuals} 
                                sub="حسابات الأفراد (من جدول Profiles)" 
                                color="bg-blue-600" 
                            />
                            <StatCard 
                                icon={Store} 
                                title="تجار فقط" 
                                value={dashboardStats.merchants} 
                                sub="حسابات التجار (من جدول Merchants)" 
                                color="bg-nabih-merchant" 
                            />
                            <StatCard 
                                icon={Shield} 
                                title="الإدارة" 
                                value={dashboardStats.admins} 
                                sub="حسابات الإدارة (Admins)" 
                                color="bg-slate-800" 
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col">
                                <h3 className="text-lg font-black text-nabih-slate mb-6 flex items-center gap-2">
                                    <PieChartIcon size={20} className="text-nabih-purple" /> توزيع المستخدمين
                                </h3>
                                <div className="flex-1 min-h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={analyticsCalculations.userDemographics}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={80}
                                                outerRadius={110}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {analyticsCalculations.userDemographics.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col">
                                <h3 className="text-lg font-black text-nabih-slate mb-6 flex items-center gap-2">
                                    <TrendingUp size={20} className="text-emerald-500" /> النمو (تسجيلات جديدة - أفراد)
                                </h3>
                                <div className="flex-1 min-h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={growthData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)'}} />
                                            <Bar dataKey="users" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={30} />
                                            </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
                
                {/* ADS MANAGEMENT TAB - NEW TABLE LAYOUT */}
                {activeTab === 'ads' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        {!selectedMerchantForAds ? (
                            /* VIEW 1: MERCHANT LIST AS TABLE */
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div>
                                        <h3 className="text-xl font-black text-nabih-slate mb-1">إدارة إعلانات المتاجر</h3>
                                        <p className="text-xs text-gray-400 font-bold">عرض جميع المتاجر المسجلة (قم باختيار المتجر لعرض الإعلانات)</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-nabih-purple/10 text-nabih-purple rounded-xl">
                                            <LayoutGrid size={24} />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
                                    <table className="w-full text-right">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-wider">معلومات المتجر</th>
                                                <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-wider">بيانات الاتصال</th>
                                                <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-wider text-center">حالة الإعلانات</th>
                                                <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-wider text-center">حالة الحساب</th>
                                                <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-wider text-center">إجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {currentMerchantsForAds.length === 0 ? (
                                                <tr><td colSpan={5} className="p-12 text-center text-gray-400 font-bold">لا يوجد متاجر مطابقة للبحث</td></tr>
                                            ) : (
                                                currentMerchantsForAds.map(merchant => {
                                                    // STRICT COUNT: active and NOT deleted
                                                    const merchantAdsAll = ads.filter(a => a.merchantId === merchant.id && !a.isDeleted && a.status !== 'deleted');
                                                    const activeAdsCount = merchantAdsAll.filter(a => a.status === 'active').length;
                                                    const pendingAdsCount = merchantAdsAll.filter(a => ['pending', 'pending_review', 'suspended', 'paused'].includes(a.status)).length;
                                                    
                                                    return (
                                                        <tr key={merchant.id} className="hover:bg-gray-50/80 transition-colors group cursor-pointer" onClick={() => setSelectedMerchantForAds(merchant)}>
                                                            <td className="p-6">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 bg-nabih-merchant rounded-xl flex items-center justify-center text-white text-sm font-black shadow-sm">
                                                                        {(merchant.storeName || merchant.name || '?').charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-bold text-nabih-slate text-base">
                                                                            {merchant.storeName || 'No Name Set'}
                                                                        </div>
                                                                        <div className="text-xs text-gray-400 font-bold">{merchant.name}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="p-6">
                                                                <div className="flex flex-col gap-1.5">
                                                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                                                        <Phone size={12} className="text-nabih-merchant" />
                                                                        <span dir="ltr">{merchant.phone || '-'}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                                                        <Mail size={12} className="text-nabih-merchant" />
                                                                        <span>{merchant.email}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="p-6 text-center">
                                                                <div className="flex flex-col gap-1.5 items-center justify-center">
                                                                    {merchantAdsAll.length > 0 ? (
                                                                        <>
                                                                            {activeAdsCount > 0 && (
                                                                                <span className="px-3 py-1 rounded-lg text-xs font-black bg-emerald-100 text-emerald-600 w-full max-w-[100px]">
                                                                                    {activeAdsCount} نشط
                                                                                </span>
                                                                            )}
                                                                            {pendingAdsCount > 0 && (
                                                                                <span className="px-3 py-1 rounded-lg text-xs font-black bg-amber-100 text-amber-600 w-full max-w-[100px] animate-pulse">
                                                                                    {pendingAdsCount} معلق/متوقف
                                                                                </span>
                                                                            )}
                                                                            {activeAdsCount === 0 && pendingAdsCount === 0 && (
                                                                                <span className="px-3 py-1 rounded-lg text-xs font-black bg-gray-100 text-gray-400 w-full max-w-[100px]">
                                                                                    {merchantAdsAll.length} (غير نشط)
                                                                                </span>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <span className="px-3 py-1 rounded-lg text-xs font-black bg-gray-50 text-gray-300">
                                                                            لا يوجد
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-6 text-center">
                                                                {merchant.status === 'active' || merchant.status === 'approved' ? (
                                                                    <span className="flex items-center justify-center gap-1 text-xs font-bold text-emerald-600">
                                                                        <CheckCircle size={12} /> موثوق
                                                                    </span>
                                                                ) : (
                                                                    <span className="flex items-center justify-center gap-1 text-xs font-bold text-amber-500">
                                                                        <Clock size={12} /> قيد المراجعة
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="p-6 text-center">
                                                                <button onClick={(e) => { e.stopPropagation(); setSelectedMerchantForAds(merchant); }} className="px-4 py-2 bg-nabih-purple/10 text-nabih-purple rounded-xl text-xs font-black hover:bg-nabih-purple hover:text-white transition-all shadow-sm">
                                                                    إدارة الإعلانات
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                    
                                    {/* Pagination */}
                                    <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-400">
                                            عرض {currentMerchantsForAds.length} من أصل {filteredMerchants.length} متجر
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => setMerchantPage(prev => Math.max(1, prev - 1))} 
                                                disabled={merchantPage === 1}
                                                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hover:border-nabih-purple hover:text-nabih-purple transition-all"
                                            >
                                                <ChevronRight size={16} className="rotate-180" />
                                            </button>
                                            <span className="text-sm font-black text-nabih-slate px-2">{merchantPage} / {merchantsTotalPages || 1}</span>
                                            <button 
                                                onClick={() => setMerchantPage(prev => Math.min(merchantsTotalPages, prev + 1))} 
                                                disabled={merchantPage === merchantsTotalPages || merchantsTotalPages === 0}
                                                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hover:border-nabih-purple hover:text-nabih-purple transition-all"
                                            >
                                                <ChevronLeft size={16} className="rotate-180" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* VIEW 2: ADS TABLE FOR SELECTED MERCHANT */
                            <AdsManagementTable 
                                ads={ads.filter(ad => ad.merchantId === selectedMerchantForAds.id)} 
                                isLoading={loading} 
                                onRefresh={refreshData} 
                                onBack={() => setSelectedMerchantForAds(null)}
                                storeName={selectedMerchantForAds.storeName}
                                onNotification={showNotification} // Pass notification handler
                            />
                        )}
                    </motion.div>
                )}

                {/* SMART ANALYTICS TAB */}
                {activeTab === 'analytics' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                            <div>
                                <h3 className="text-xl font-black text-nabih-slate mb-1">تحليل كلمات البحث</h3>
                                <p className="text-xs text-gray-400 font-bold">أكثر الكلمات بحثاً في المنصة</p>
                            </div>
                            <div className="p-3 bg-nabih-purple/10 text-nabih-purple rounded-xl">
                                <Activity size={24} />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                                <h4 className="text-sm font-black text-nabih-slate uppercase tracking-widest mb-6">Top Search Terms</h4>
                                {analyticsCalculations.topTerms.length > 0 ? (
                                    <div className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart layout="vertical" data={analyticsCalculations.topTerms} margin={{ left: 20, right: 20 }}>
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} cursor={{fill: '#f5f5f7'}} />
                                                <Bar dataKey="value" fill="#2E0249" radius={[0, 6, 6, 0]} barSize={24} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="h-40 flex items-center justify-center text-gray-300 font-bold">لا توجد بيانات بحث كافية</div>
                                )}
                            </div>

                            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                                <h4 className="text-sm font-black text-nabih-slate uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Globe size={16} /> الدول الأكثر نشاطاً
                                </h4>
                                <div className="space-y-4">
                                    {analyticsCalculations.topCountries.length > 0 ? (
                                        analyticsCalculations.topCountries.slice(0, 6).map((c, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm border border-gray-100">
                                                        {i + 1}
                                                    </div>
                                                    <span className="font-bold text-nabih-slate">{c.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-nabih-gold" style={{ width: `${(c.value / analyticsCalculations.totalSearches) * 100}%` }} />
                                                    </div>
                                                    <span className="text-xs font-black text-nabih-slate/50 w-8 text-left">{c.value}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-12 text-center text-gray-300 font-bold">لا توجد بيانات جغرافية كافية</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </main>
      </div>
      {/* Modals omitted for brevity - logic preserved */}
      <AnimatePresence>
        {/* ROLE CHANGE CONFIRMATION MODAL */}
        {pendingRoleAction && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPendingRoleAction(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-sm bg-white p-8 rounded-[2.5rem] shadow-2xl border border-nabih-border text-center overflow-hidden">
                    <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <ShieldAlert size={36} />
                    </div>
                    <h3 className="text-2xl font-black text-nabih-slate mb-3">تأكيد تغيير الصلاحية</h3>
                    <p className="text-sm font-bold text-gray-500 leading-relaxed mb-8">
                        هل أنت متأكد من {pendingRoleAction.currentStatus ? 'سحب' : 'منح'} صلاحية 
                        <span className="text-nabih-purple font-black mx-1 uppercase">{pendingRoleAction.role}</span> 
                        للمستخدم 
                        <span className="text-nabih-slate font-black mx-1">{pendingRoleAction.user.name}</span>؟
                        <br/>
                        <span className="text-xs text-red-400 mt-2 block">سيتم تحديث قاعدة البيانات فوراً.</span>
                    </p>
                    <div className="flex gap-4">
                        <button onClick={() => setPendingRoleAction(null)} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-black text-sm hover:bg-gray-200 transition-all">إلغاء</button>
                        <button onClick={confirmRoleChange} className="flex-1 py-3 bg-nabih-purple text-white rounded-xl font-black text-sm shadow-lg hover:bg-nabih-accent transition-all">تأكيد التغيير</button>
                    </div>
                </motion.div>
            </div>
        )}

        {showEditModal && editingUser && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white p-8 rounded-[2.5rem] shadow-2xl max-h-[90vh] overflow-y-auto z-[110]">
                    <div className="flex justify-between items-center mb-8 sticky top-0 bg-white z-10 py-2">
                        <h3 className="text-2xl font-black text-nabih-slate">تعديل بيانات {editingUser.roles?.includes('merchant') ? 'التاجر' : 'المستخدم'}</h3>
                        <button onClick={() => setShowEditModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"><X size={20} /></button>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500">الاسم الكامل / اسم المتجر</label>
                            <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-nabih-slate focus:bg-white focus:border-nabih-purple outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500">البريد الإلكتروني</label>
                            <input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-nabih-slate focus:bg-white focus:border-nabih-purple outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500">رقم الهاتف</label>
                            <input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-nabih-slate focus:bg-white focus:border-nabih-purple outline-none transition-all text-left" dir="ltr" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 flex items-center gap-2"><Lock size={12} /> تعيين كلمة مرور جديدة</label>
                            <input type="password" value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} placeholder="اترك الحقل فارغاً للإبقاء على القديمة" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-nabih-slate focus:bg-white focus:border-nabih-purple outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500">الدولة</label>
                            <select value={editForm.country} onChange={e => setEditForm({...editForm, country: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-nabih-slate focus:bg-white focus:border-nabih-purple outline-none transition-all appearance-none cursor-pointer">
                                {COUNTRIES.map(c => <option key={c.id} value={c.id}>{c.ar}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-4 sticky bottom-0 bg-white py-2 z-10">
                        <button onClick={handleSaveUser} className="flex-1 py-4 bg-nabih-purple text-white rounded-xl font-black shadow-lg hover:bg-nabih-accent transition-all flex items-center justify-center gap-2">
                            <Save size={18} /> حفظ التغييرات
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
