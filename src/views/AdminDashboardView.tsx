import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  Users, 
  BarChart3, 
  CheckCircle, 
  XCircle, 
  Clock, 
  UserPlus, 
  Film,
  Search,
  Activity,
  Server,
  Lock,
  Cpu,
  Coins,
  TrendingDown,
  TrendingUp,
  History
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  fetchAllUsers, 
  updateUserRole, 
  fetchPlatformAnalytics, 
  fetchConnectionLogs, 
  fetchSystemLogs,
  fetchEconomyMetrics
} from '../services/GovernanceService';
import { fetchCommunityVideos, updateVideoStatus, CommunityVideo } from '../services/CommunityService';
import { UserProfile } from '../types';

export default function AdminDashboardView() {
  const { profile, isAdmin } = useAuth();
  const analyticsPlaceholder = { totalCitizens: 0, totalArchivedMedia: 0, pendingModeration: 0 };
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pendingVideos, setPendingVideos] = useState<CommunityVideo[]>([]);
  const [connectionLogs, setConnectionLogs] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [economyMetrics, setEconomyMetrics] = useState<any>(null);
  const [analytics, setAnalytics] = useState(analyticsPlaceholder);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'governance' | 'moderation' | 'analytics' | 'economy'>('governance');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    const [userData, videoData, analyticsData, connections, sLogs, ecoData] = await Promise.all([
      fetchAllUsers(),
      fetchCommunityVideos(true),
      fetchPlatformAnalytics(),
      fetchConnectionLogs(),
      fetchSystemLogs(),
      fetchEconomyMetrics()
    ]);
    
    setUsers(userData);
    setPendingVideos(videoData.filter((v: any) => v.status === 'pending'));
    setAnalytics(analyticsData);
    setConnectionLogs(connections);
    setSystemLogs(sLogs);
    setEconomyMetrics(ecoData);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, loadData]);

  const handleRoleUpdate = async (userId: string, currentRole: string, currentTier: string) => {
    const nextRole = currentRole === 'citizen' ? 'contributor' : currentRole === 'contributor' ? 'admin' : 'citizen';
    const tiers = ['Citizen', 'Gold', 'Platinum', 'Diamond Elite', 'Elder'];
    const currentTierIndex = tiers.indexOf(currentTier);
    const nextTier = currentTierIndex === -1 ? 'Citizen' : tiers[(currentTierIndex + 1) % tiers.length];

    if (window.confirm(`Escalate identity to ${nextRole.toUpperCase()} with status: ${nextTier.toUpperCase()}?`)) {
      const success = await updateUserRole(userId, nextRole as any, nextTier);
      
      if (success) {
        showToast(`Identity Reclassified: ${userId.slice(-4)} → ${nextTier.toUpperCase()}`);
        loadData();
      }
    }
  };

  const handleMediaModeration = async (videoId: string, status: 'published' | 'rejected') => {
    const success = await updateVideoStatus(videoId, status);
    if (success === true) {
      showToast(`Archive Synchronized: ${videoId.slice(-4)} → ${status.toUpperCase()}`);
      loadData();
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy p-6">
        <div className="luxury-card p-12 text-center space-y-6 max-w-md">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto animate-pulse" />
          <h2 className="text-2xl font-serif text-text italic">Protocol Denied</h2>
          <p className="text-sm text-text/40 leading-relaxed">
            Unauthorized identity detected. Root access to the House of Daraja kernel is restricted to high-tier administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="pt-12 pb-32 px-6 max-w-7xl mx-auto space-y-12"
    >
      <header className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-text/5 pb-12">
        <div>
           <span className="text-micro block text-red-500 mb-2">Authenticated: {profile?.displayName}</span>
           <h1 className="text-display text-text italic">Daraja <span className="italic text-gold">Governance</span></h1>
        </div>
        <div className="flex flex-wrap gap-4">
           {['governance', 'moderation', 'analytics', 'economy'].map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab as any)}
               className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                 activeTab === tab 
                   ? 'bg-gold text-navy shadow-lg shadow-gold/20' 
                   : 'bg-text/5 text-text/40 hover:bg-text/10'
               }`}
             >
               {tab}
             </button>
           ))}
        </div>
      </header>

      {/* Analytics Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="luxury-card p-10 bg-surface/50 border-text/5 flex items-center gap-6">
           <div className="p-4 bg-gold/10 rounded-2xl border border-gold/20">
              <Users className="w-6 h-6 text-gold" />
           </div>
           <div>
              <p className="text-3xl font-serif text-text">{analytics.totalCitizens}</p>
              <p className="text-micro text-text/40 uppercase">Total Citizens</p>
           </div>
        </div>
        <div className="luxury-card p-10 bg-surface/50 border-text/5 flex items-center gap-6">
           <div className="p-4 bg-gold/10 rounded-2xl border border-gold/20">
              <Film className="w-6 h-6 text-gold" />
           </div>
           <div>
              <p className="text-3xl font-serif text-text">{analytics.totalArchivedMedia}</p>
              <p className="text-micro text-text/40 uppercase">Archived Artifacts</p>
           </div>
        </div>
        <div className="luxury-card p-10 bg-surface/50 border-red-500/20 flex items-center gap-6">
           <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
              <Clock className="w-6 h-6 text-red-500" />
           </div>
           <div>
              <p className="text-3xl font-serif text-text">{analytics.pendingModeration}</p>
              <p className="text-micro text-red-500/60 uppercase">Pending Review</p>
           </div>
        </div>
      </div>

      {loading ? (
        <div className="py-32 flex justify-center">
          <div className="w-12 h-12 border-2 border-gold/20 border-t-gold rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-12">
          {activeTab === 'governance' && (
            <section className="space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h3 className="text-micro">Identity & Privilege Management</h3>
                  <p className="text-[10px] text-text/20 uppercase font-black mt-1">Manage jurisdictions and sovereign status tiers</p>
                </div>
                <div className="flex bg-text/5 p-3 rounded-2xl border border-text/5 w-full md:w-64 focus-within:border-gold/30 transition-all">
                  <Search className="w-4 h-4 text-text/20 mr-3" />
                  <input 
                    type="text" 
                    placeholder="Search Identies..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent border-none outline-none text-text font-mono text-[10px] w-full placeholder:text-text/10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredUsers.map((u) => (
                  <div key={u.uid} className="p-8 bg-surface border border-text/5 rounded-3xl flex items-center justify-between group hover:border-gold/30 transition-all shadow-xl">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-gold/5 flex items-center justify-center border border-gold/10">
                        <Users className="w-6 h-6 text-gold/40" />
                      </div>
                      <div>
                        <h4 className="text-lg font-serif text-text italic">{u.displayName}</h4>
                        <div className="flex gap-3 mt-1">
                          <span className="text-[8px] uppercase font-black tracking-widest text-gold bg-gold/10 px-2 py-0.5 rounded">{u.statusTier}</span>
                          <span className={`text-[8px] uppercase font-black tracking-widest px-2 py-0.5 rounded ${
                            u.role === 'admin' ? 'bg-red-500/10 text-red-500' : 
                            u.role === 'contributor' ? 'bg-blue-500/10 text-blue-500' : 
                            'bg-text/5 text-text/40'
                          }`}>
                            {u.role}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRoleUpdate(u.uid, u.role, u.statusTier)}
                      className="p-3 text-text/20 hover:text-gold hover:bg-gold/10 rounded-xl transition-all"
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'moderation' && (
            <section className="space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h3 className="text-micro">Media Ingestion Pipeline</h3>
                  <p className="text-[10px] text-red-500 uppercase font-black mt-1">
                    {pendingVideos.length} Artifacts Awaiting Review
                  </p>
                </div>
                {pendingVideos.length > 1 && (
                  <button 
                    onClick={async () => {
                      if (window.confirm("Authorize all pending artifacts for global publication?")) {
                        await Promise.all(pendingVideos.map(v => updateVideoStatus(v.youtubeId, 'published')));
                        showToast(`Archival Bulk Sync: ${pendingVideos.length} Nodes Authorized`);
                        loadData();
                      }
                    }}
                    className="px-8 py-3 bg-gold text-navy rounded-full text-[9px] font-black uppercase tracking-[0.3em] shadow-xl hover:scale-105 transition-all"
                  >
                    Authorize All Nodes
                  </button>
                )}
              </div>
              {pendingVideos.length === 0 ? (
                <div className="py-24 text-center luxury-card bg-surface/30">
                  <CheckCircle className="w-12 h-12 text-gold/20 mx-auto mb-4" />
                  <p className="text-sm text-text/40 italic">All artifacts have been chronicled. Digital silence maintained.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingVideos.map((video) => (
                    <div key={video.youtubeId} className="p-8 bg-surface border border-text/5 rounded-3xl flex flex-col md:flex-row items-center gap-8 group hover:border-gold/20 transition-all">
                      <div className="w-full md:w-32 aspect-video rounded-xl overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                        <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 space-y-2">
                         <h4 className="text-lg font-serif text-text italic">{video.title}</h4>
                         <p className="text-[9px] text-text/40 uppercase font-black tracking-widest">{video.category} • Synced: {new Date(video.publishedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => handleMediaModeration(video.youtubeId, 'published')}
                          className="px-6 py-3 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-navy rounded-full text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" /> Authorize
                        </button>
                        <button 
                          onClick={() => handleMediaModeration(video.youtubeId, 'rejected')}
                          className="px-6 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-navy rounded-full text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'analytics' && (
             <section className="space-y-12">
                <div className="flex justify-between items-center border-b border-text/5 pb-8">
                   <h3 className="text-micro">System Performance & Global Activity</h3>
                   <div className="flex gap-4">
                      <div className="px-4 py-2 bg-green-500/10 rounded-lg flex items-center gap-2">
                         <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                         <span className="text-[8px] font-black uppercase text-green-500 tracking-widest">Kernel_Stable</span>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                   {[
                      { icon: Activity, label: 'Neural Flux', val: '98.4%', trend: '+0.2%' },
                      { icon: Server, label: 'Node Uptime', val: '99.99%', trend: 'Nominal' },
                      { icon: Lock, label: 'Secure Links', val: '1,240', trend: '+12' },
                      { icon: Cpu, label: 'Sync Speed', val: '12ms', trend: 'Ultra' }
                   ].map((stat, i) => (
                      <div key={i} className="luxury-card p-8 bg-surface/30 border-text/5 group hover:border-gold/20 transition-all">
                         <div className="flex justify-between items-start mb-4">
                            <stat.icon className="w-4 h-4 text-gold/40 group-hover:text-gold transition-colors" />
                            <span className="text-[8px] text-green-500 font-mono">{stat.trend}</span>
                         </div>
                         <motion.p 
                            animate={{ opacity: [0.7, 1, 0.7] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
                            className="text-2xl font-serif text-text h-8"
                         >
                            {stat.val}
                         </motion.p>
                         <p className="text-micro text-text/20 uppercase mt-1">{stat.label}</p>
                      </div>
                   ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                   <div className="luxury-card p-10 bg-navy/50 space-y-8 border-text/5">
                      <div className="flex justify-between items-center text-text/40">
                        <h4 className="font-black text-[10px] uppercase tracking-widest">Revenue Flow (DRS Tokens)</h4>
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <div className="flex items-end gap-3 h-48 px-2">
                         {[40, 70, 45, 90, 65, 120, 80, 55, 95, 70].map((h, i) => (
                           <div 
                             key={i} 
                             className="flex-1 bg-gradient-to-t from-gold/5 via-gold/10 to-gold/30 hover:to-gold transition-all cursor-crosshair rounded-t-lg group relative" 
                             style={{ height: `${(h / 120) * 100}%` }}
                           >
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gold text-navy text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {h} DRS
                              </div>
                           </div>
                         ))}
                      </div>
                      <div className="flex justify-between text-[8px] font-black text-text/10 uppercase tracking-widest">
                         <span>Epoch Start</span>
                         <span>Current Node</span>
                      </div>
                   </div>
                   <div className="luxury-card p-10 bg-navy/50 space-y-8 border-text/5">
                      <div className="flex justify-between items-center text-text/40">
                        <h4 className="font-black text-[10px] uppercase tracking-widest">Real-time Kernel Activity (Handshakes)</h4>
                        <Server className="w-4 h-4" />
                      </div>
                      <div className="space-y-4 font-mono text-[9px] max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                         {connectionLogs.map((log, i) => (
                          <div key={log.id} className="flex gap-4 items-start border-b border-text/5 pb-3">
                             <span className="text-gold/40">[{log.timestamp ? new Date(log.timestamp.toDate()).toLocaleTimeString() : 'Pending'}]</span>
                             <p className="text-gold/60 uppercase italic">
                               Handshake synchronization: Node #{log.fromId?.slice(-4)} → Node #{log.toId?.slice(-4)} [{log.status}]
                             </p>
                          </div>
                         ))}
                         {connectionLogs.length === 0 && <p className="text-text/10 italic">No handshake signals detected...</p>}
                      </div>
                   </div>

                   <div className="luxury-card p-10 bg-black/50 space-y-8 border-red-500/10">
                      <div className="flex justify-between items-center text-red-500/40">
                        <h4 className="font-black text-[10px] uppercase tracking-widest">Sovereign Exception Log (Breaches & Errors)</h4>
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div className="space-y-4 font-mono text-[9px] max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                         {systemLogs.map((log, i) => (
                          <div key={log.id} className="flex gap-4 items-start border-b border-text/2 pb-3">
                             <span className={log.level === 'critical' ? 'text-red-500' : 'text-orange-500'}>[{log.level.toUpperCase()}]</span>
                             <div>
                                <p className="text-text font-bold">{log.message}</p>
                                <p className="text-text/40 mt-1 whitespace-pre-wrap">{typeof log.context === 'string' ? log.context : JSON.stringify(log.context, null, 2)}</p>
                             </div>
                          </div>
                         ))}
                         {systemLogs.length === 0 && <p className="text-text/10 italic">No security exceptions chronicled. Kernel integrity maintained.</p>}
                      </div>
                   </div>
                </div>
             </section>
          )}

          {activeTab === 'economy' && (
             <section className="space-y-12">
                <div className="flex justify-between items-center border-b border-text/5 pb-8">
                   <div>
                      <h3 className="text-micro">LEE Token Economy Kernel</h3>
                      <p className="text-[10px] text-gold uppercase font-black mt-1">Autonomous burn & reward synchronization logs</p>
                   </div>
                   <button 
                     onClick={() => loadData()}
                     className="p-3 bg-gold/10 text-gold rounded-full border border-gold/20 hover:bg-gold hover:text-navy transition-all"
                   >
                      <Activity className="w-5 h-5" />
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="luxury-card p-10 bg-surface/30 border-gold/20 space-y-4">
                      <div className="flex justify-between">
                         <Coins className="w-6 h-6 text-gold" />
                         <TrendingUp className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                         <p className="text-3xl font-serif text-text">{(economyMetrics?.totalRewarded || 0).toLocaleString()} LEE</p>
                         <p className="text-micro text-text/40 uppercase">Total Minted/Rewarded</p>
                      </div>
                   </div>
                   <div className="luxury-card p-10 bg-surface/30 border-red-500/20 space-y-4">
                      <div className="flex justify-between">
                         <Coins className="w-6 h-6 text-red-500" />
                         <TrendingDown className="w-4 h-4 text-red-500" />
                      </div>
                      <div>
                         <p className="text-3xl font-serif text-text">{(economyMetrics?.totalBurned || 0).toLocaleString()} LEE</p>
                         <p className="text-micro text-red-500/60 uppercase">Total Burnt (Deflation)</p>
                      </div>
                   </div>
                   <div className="luxury-card p-10 bg-surface/30 border-blue-500/20 space-y-4">
                      <div className="flex justify-between">
                         <Activity className="w-6 h-6 text-blue-500" />
                         <span className="text-[10px] font-black text-blue-400">Yield_Active</span>
                      </div>
                      <div>
                         <p className="text-3xl font-serif text-text">{(economyMetrics?.totalStaked || 0).toLocaleString()} LEE</p>
                         <p className="text-micro text-blue-500/60 uppercase">Total Staked (Locked)</p>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                   <div className="luxury-card p-10 bg-surface/30 border-gold/20 space-y-2">
                       <p className="text-micro opacity-40 uppercase">Economic Health</p>
                       <p className={`text-2xl font-serif ${(economyMetrics?.netCirculationChange || 0) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {economyMetrics?.netCirculationChange > 0 ? 'Expansionary' : 'Deflationary'}
                       </p>
                   </div>
                </div>

                <div className="luxury-card p-12 bg-navy/50 border-text/5 space-y-10">
                   <div className="flex items-center gap-4">
                      <History className="w-5 h-5 text-gold/40" />
                      <h4 className="text-[10px] uppercase font-black tracking-widest text-text/60">Monetary Log Stream</h4>
                   </div>
                   <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                      {economyMetrics?.recentTransactions?.map((tx: any) => (
                         <div key={tx.id} className="flex items-center justify-between p-6 bg-surface/20 rounded-2xl border border-text/5 hover:border-gold/30 transition-all">
                            <div className="flex items-center gap-6">
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                                  tx.type.includes('burn') || tx.type.includes('subsidy') ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-green-500/10 border-green-500/20 text-green-500'
                               }`}>
                                  {tx.type.includes('burn') ? <TrendingDown className="w-4 h-4" /> : <Coins className="w-4 h-4" />}
                               </div>
                               <div>
                                  <p className="text-sm font-serif italic text-text">{tx.metadata?.reason || tx.type.replace('_', ' ').toUpperCase()}</p>
                                  <p className="text-[9px] font-black uppercase text-text/20 tracking-widest">User_{tx.userId?.slice(-6)} • {new Date(tx.timestamp?.toDate()).toLocaleString()}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className={`text-xl font-serif italic ${
                                  tx.type.includes('burn') || tx.type.includes('subsidy') ? 'text-red-500' : 'text-gold'
                               }`}>
                                  {tx.type.includes('burn') || tx.type.includes('subsidy') ? '-' : '+'}{tx.leeAmount || 0} LEE
                               </p>
                            </div>
                         </div>
                      ))}
                      {(!economyMetrics?.recentTransactions || economyMetrics.recentTransactions.length === 0) && (
                         <div className="py-20 text-center opacity-20">
                            <Coins className="w-12 h-12 mx-auto mb-4" />
                            <p className="text-sm italic">No economic activity detected in the current epoch.</p>
                         </div>
                      )}
                   </div>
                </div>
             </section>
          )}
        </div>
      )}
      
      {/* Haptic Action Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 bg-gold text-navy rounded-2xl shadow-[0_20px_50px_rgba(212,175,55,0.3)] flex items-center gap-4 min-w-[320px]"
          >
             <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
             </div>
             <div className="flex-1">
                <p className="text-[8px] uppercase font-black tracking-[0.4em] opacity-40">Governance_Signal</p>
                <p className="text-[11px] font-bold uppercase tracking-widest">{toast}</p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
