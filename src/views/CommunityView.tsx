import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  RotateCw, 
  BarChart3, 
  Youtube, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Tag, 
  Globe2,
  TrendingUp,
  DollarSign,
  Search
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  fetchCommunityVideos, 
  syncYouTubeRSS, 
  updateVideoStatus, 
  CommunityVideo 
} from '../services/CommunityService';

// Official Sovereign Channel ID for House of Daraja
const CHANNEL_ID = "UC8O2_6f6tX9_K6kX_Y0I_XQ"; 

export default function CommunityView() {
  const { user, profile, isAdmin } = useAuth();
  const isContributor = profile?.role === 'contributor' || profile?.role === 'admin' || isAdmin;
  
  const [videos, setVideos] = useState<CommunityVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<CommunityVideo | null>(null);

  const categories = ["Dandali", "Zare Global", "Co-Creators"];

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await fetchCommunityVideos(isContributor);
    setVideos(data);
    setLoading(false);
  }, [isContributor]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSync = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      await syncYouTubeRSS(CHANNEL_ID, user.uid);
      await loadData();
    } catch (error) {
      console.error("Community_Archive: Sync protocol terminated.", error);
    } finally {
      setSyncing(false);
    }
  };

  const handleStatusUpdate = async (videoId: string, status: CommunityVideo['status']) => {
    try {
      const success = await updateVideoStatus(videoId, status);
      if (success === true) {
        await loadData();
        if (selectedVideo?.youtubeId === videoId) {
          setSelectedVideo(prev => prev ? { ...prev, status } : null);
        }
      }
    } catch (error) {
      console.error("Community_Archive: Editorial update failed.", error);
    }
  };

  const filteredVideos = videos.filter(v => {
    const matchesFilter = activeFilter === 'All' || v.category === activeFilter;
    const matchesSearch = v.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.ai_metadata?.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Inject monetization slots every 4 items
  const displayItems: { type: 'video' | 'ad'; data?: CommunityVideo; id?: string }[] = [];
  filteredVideos.forEach((video, index) => {
    displayItems.push({ type: 'video', data: video });
    if ((index + 1) % 4 === 0) {
      displayItems.push({ type: 'ad', id: `ad-${index}` });
    }
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-navy pb-40 overflow-y-auto no-scrollbar"
    >
      {/* Cinematic Media Hero */}
      <section className="relative h-[65vh] flex flex-col justify-end p-12 overflow-hidden">
         <div className="absolute inset-0 z-0">
            <img 
               src="https://picsum.photos/seed/media_os/1920/1080?blur=5" 
               alt="Community Archive" 
               className="w-full h-full object-cover grayscale brightness-50 contrast-125"
               referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent"></div>
         </div>
         
         <div className="relative z-10 max-w-4xl space-y-10">
            <div className="flex items-center gap-4 text-gold">
               <div className="p-3 bg-gold/10 rounded-full border border-gold/40 animate-pulse">
                  <Youtube className="w-8 h-8" />
               </div>
               <span className="text-[10px] uppercase font-black tracking-[0.6em] text-gold-light">Sovereign_Media_OS.v2</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-serif text-text italic tracking-tighter leading-none uppercase">
               The <br/> <span className="text-gold">Collective</span>
            </h1>
            <p className="text-xl font-serif text-text/40 italic max-w-xl leading-relaxed">
               The decentralized repository of House of Daraja's visual narratives, cultural broadcasts, and co-creator artifacts.
            </p>
         </div>
      </section>

      {/* Sovereign Control Panel (Contributor/Admin only) */}
      {isContributor && (
        <section className="px-12 -mt-12 relative z-30">
           <div className="luxury-card p-10 bg-surface/50 border-gold/30 flex flex-col md:flex-row justify-between items-center gap-8 backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.5)] !rounded-[2.5rem]">
              <div className="flex items-center gap-6">
                 <div className="p-5 bg-gold/10 rounded-2xl border border-gold/20">
                    <RotateCw className={`w-8 h-8 text-gold ${syncing ? 'animate-spin' : ''}`} />
                 </div>
                 <div className="space-y-1">
                    <h3 className="text-xl font-serif text-text italic">Editorial Management Module</h3>
                    <p className="text-[9px] uppercase font-black text-gold/40 tracking-[0.3em]">
                      {profile?.role?.toUpperCase()} STATUS VERIFIED // {videos.filter(v => v.status === 'pending').length} PENDING REVIEW
                    </p>
                 </div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={handleSync}
                  disabled={syncing}
                  className="luxury-button !py-4 !px-10 text-[9px] font-black tracking-[0.4em]"
                >
                  {syncing ? 'SYNCING...' : 'SYNC RSS INFERENCE'}
                </button>
              </div>
           </div>
        </section>
      )}

      {/* Analytics & Categorization */}
      <section className="px-12 mt-24 space-y-16">
         <motion.div 
           initial="hidden"
           animate="visible"
           variants={{
             visible: { transition: { staggerChildren: 0.1 } }
           }}
           className="grid grid-cols-1 md:grid-cols-3 gap-8"
         >
            {categories.map(cat => (
               <motion.div 
                 key={cat}
                 variants={{
                   hidden: { opacity: 0, y: 20 },
                   visible: { opacity: 1, y: 0 }
                 }}
                 className="luxury-card p-10 bg-surface/30 space-y-6 group cursor-pointer hover:bg-gold/[0.02] transition-all !rounded-[2rem] border-text/5"
               >
                  <div className="flex justify-between items-center">
                     <span className="text-[10px] uppercase font-black text-text/20 tracking-[0.4em]">{cat}</span>
                     <BarChart3 className="w-5 h-5 text-gold/20 group-hover:text-gold transition-colors" />
                  </div>
                  <div className="flex items-baseline gap-4">
                    <p className="text-5xl font-serif text-text italic">{videos.filter(v => v.category === cat).length}</p>
                    <span className="text-[10px] uppercase font-black text-gold/40 tracking-widest">Nodes</span>
                  </div>
               </motion.div>
            ))}
         </motion.div>

         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-text/10 pb-6">
            <div className="flex gap-10 overflow-x-auto no-scrollbar items-center w-full md:w-auto">
               {['All', ...categories].map(cat => (
                  <button 
                    key={cat} onClick={() => setActiveFilter(cat)}
                    className={`text-[10px] uppercase font-black tracking-[0.3em] transition-all flex-shrink-0 relative py-2 ${activeFilter === cat ? 'text-gold' : 'text-text/20 hover:text-text'}`}
                  >
                     {cat}
                     {activeFilter === cat && (
                       <motion.div layoutId="filter-pill" className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gold" />
                     )}
                  </button>
               ))}
            </div>
            <div className="flex bg-text/5 p-3 rounded-2xl border border-text/5 w-full md:w-64 focus-within:border-gold/30 transition-all">
               <Search className="w-4 h-4 text-text/20 mr-3" />
               <input 
                 type="text" 
                 placeholder="Search Archive..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="bg-transparent border-none outline-none text-text font-mono text-[10px] w-full placeholder:text-text/10"
               />
            </div>
         </div>
      </section>

      {/* Archival Grid with Monetization Nodes */}
      <section className="px-12 mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
         {loading ? (
            <div className="col-span-full py-40 text-center space-y-6">
               <div className="w-16 h-16 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto opacity-40"></div>
               <p className="text-[10px] uppercase font-black tracking-[0.5em] text-text/20 italic">Synchronizing with Archive Nodes...</p>
            </div>
         ) : (
           displayItems.map((item, i) => {
             if (item.type === 'ad') {
               return (
                 <motion.div 
                   key={item.id}
                   initial={{ opacity: 0, scale: 0.95 }}
                   whileInView={{ opacity: 1, scale: 1 }}
                   className="luxury-card p-12 bg-gold/[0.03] border-gold/10 flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden !rounded-[3rem]"
                 >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-[80px]"></div>
                    <div className="p-4 bg-gold/10 rounded-full border border-gold/40">
                       <DollarSign className="w-6 h-6 text-gold" />
                    </div>
                    <div className="space-y-4">
                       <h4 className="text-xl font-serif text-text italic">Sponsorship Node</h4>
                       <p className="text-[10px] uppercase font-black text-text/20 tracking-widest leading-loose">
                         Manifest your artifacts on the global sovereign feed. <br/> Access restricted to partner nodes.
                       </p>
                    </div>
                    <button className="text-[9px] font-black uppercase text-gold tracking-[0.4em] hover:text-text transition-colors">INITIATE PARTNERSHIP</button>
                 </motion.div>
               );
             }

             const video = item.data as CommunityVideo;
             return (
               <motion.div 
                 key={video.youtubeId} 
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.6 }}
                 className={`luxury-card group flex flex-col h-full bg-navy/40 hover:bg-surface/50 transition-all border-text/5 hover:border-gold/30 !rounded-[2.5rem] overflow-hidden ${selectedVideo?.youtubeId === video.youtubeId ? 'ring-2 ring-gold shadow-[0_0_60px_rgba(var(--gold-rgb),0.2)]' : ''}`}
                 onClick={() => setSelectedVideo(video)}
               >
                  <div className="aspect-[16/10] relative overflow-hidden">
                     <img 
                        src={video.thumbnail} 
                        alt={video.title} 
                        className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000"
                        referrerPolicy="no-referrer"
                     />
                     <div className="absolute inset-0 flex items-center justify-center bg-navy/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="p-8 bg-gold text-navy rounded-full shadow-[0_0_60px_rgba(212,175,55,0.4)] transform scale-50 group-hover:scale-100 transition-transform duration-500">
                           <Play className="w-8 h-8 fill-current ml-1" />
                        </div>
                     </div>
                     
                     {/* Editorial Status Badge */}
                     {isContributor && (
                       <div className={`absolute top-6 left-6 px-4 py-2 rounded-full border backdrop-blur-xl flex items-center gap-2 ${
                         video.status === 'published' ? 'bg-green-500/10 border-green-500/30 text-green-500' :
                         video.status === 'pending' ? 'bg-gold/10 border-gold/30 text-gold' :
                         'bg-red-500/10 border-red-500/30 text-red-500'
                       }`}>
                          {video.status === 'published' ? <CheckCircle className="w-3 h-3" /> :
                           video.status === 'pending' ? <Clock className="w-3 h-3" /> :
                           <XCircle className="w-3 h-3" />}
                          <span className="text-[8px] font-black uppercase tracking-widest">{video.status}</span>
                       </div>
                     )}

                     <div className="absolute bottom-6 left-6 luxury-card !px-5 !py-2 !rounded-full bg-navy/80 backdrop-blur-xl border-text/10 shadow-2xl">
                        <span className="text-[8px] font-black tracking-[0.3em] uppercase text-gold">
                           {video.category}
                        </span>
                     </div>
                  </div>

                  <div className="p-10 space-y-6 flex flex-col justify-between flex-grow">
                     <h3 className="text-xl md:text-2xl font-serif text-text italic group-hover:text-gold transition-colors leading-tight">
                        {video.title}
                     </h3>
                     
                     {/* AI Smart Insight Snippet */}
                     {video.ai_metadata?.summary && (
                       <p className="text-sm text-text/40 italic font-serif leading-relaxed line-clamp-2 border-l-2 border-gold/20 pl-4">
                         "{video.ai_metadata.summary}"
                       </p>
                     )}

                     <div className="flex justify-between items-end border-t border-text/5 pt-8">
                        <div className="space-y-2">
                           <p className="text-[8px] uppercase font-black tracking-[0.4em] text-text/20 italic">Archived Sync</p>
                           <p className="text-xs font-mono text-text/40 tracking-wider">[{new Date(video.publishedAt).toLocaleDateString()}]</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gold/20 group-hover:text-gold transition-all group-hover:translate-x-2" />
                     </div>
                  </div>
               </motion.div>
             );
           })
         )}
      </section>

      {/* Full-Screen Archival Detail Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-8 md:p-20 bg-navy/95 backdrop-blur-2xl overflow-y-auto"
          >
             <div className="w-full max-w-6xl luxury-card bg-surface/50 border-text/10 overflow-hidden !rounded-[3rem] shadow-[0_100px_200px_rgba(0,0,0,0.8)] relative">
                <button 
                  onClick={() => setSelectedVideo(null)}
                  className="absolute top-8 right-8 p-4 bg-navy/60 hover:bg-navy rounded-full border border-text/5 text-text transition-all group z-[100] hidden lg:flex"
                >
                   <XCircle className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-2 lg:h-[80vh]">
                   {/* Media Pane */}
                   <div className="relative aspect-video lg:aspect-auto h-full overflow-hidden bg-black flex items-center justify-center">
                      <iframe 
                        className="w-full h-full lg:absolute lg:inset-0"
                        src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1`}
                        title={selectedVideo.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      <button 
                        onClick={() => setSelectedVideo(null)}
                        className="absolute top-8 left-8 p-4 bg-navy/60 hover:bg-navy rounded-full border border-text/5 text-text transition-all group z-[70] lg:hidden"
                      >
                         <XCircle className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                      </button>
                   </div>

                   {/* Information Pane */}
                   <div className="p-12 md:p-16 space-y-12 overflow-y-auto no-scrollbar max-h-[90vh]">
                      <div className="space-y-6">
                         <div className="flex items-center gap-4 text-gold">
                            <Tag className="w-4 h-4" />
                            <span className="text-[10px] uppercase font-black tracking-[0.4em]">{selectedVideo.category}</span>
                         </div>
                         <h2 className="text-4xl md:text-5xl font-serif text-text italic leading-tight">{selectedVideo.title}</h2>
                         
                         {/* Multilingual Protocol Display */}
                         {selectedVideo.ai_metadata?.multilingual_titles && (
                            <div className="grid grid-cols-1 gap-4 pt-6">
                               {selectedVideo.ai_metadata.multilingual_titles.hausa && (
                                 <div className="flex items-center gap-6 p-4 bg-text/5 rounded-2xl border border-text/5">
                                    <Globe2 className="w-4 h-4 text-gold/40" />
                                    <p className="text-sm font-serif italic text-text/60">Hausa: {selectedVideo.ai_metadata.multilingual_titles.hausa}</p>
                                 </div>
                               )}
                            </div>
                         )}
                      </div>

                      <div className="space-y-8 border-b border-text/5 pb-12">
                         <div className="space-y-4">
                            <h4 className="text-[10px] uppercase font-black text-gold/40 tracking-[0.4em]">Leema_Intelligence_Summary</h4>
                            <p className="text-lg font-serif italic text-text/80 leading-relaxed">
                               {selectedVideo.ai_metadata?.summary || "Enrichment protocol pending high-fidelity classification."}
                            </p>
                         </div>

                         <div className="space-y-4">
                            <h4 className="text-[10px] uppercase font-black text-gold/40 tracking-[0.4em]">Cultural_Context_Ledger</h4>
                            <p className="text-sm text-text/40 leading-relaxed italic font-serif">
                               {selectedVideo.ai_metadata?.cultural_context || "Heritage context nodes remain encrypted."}
                            </p>
                         </div>

                         <div className="flex flex-wrap gap-3">
                            {selectedVideo.ai_metadata?.tags?.map(tag => (
                               <span key={tag} className="px-4 py-1.5 bg-text/5 border border-text/5 rounded-full text-[9px] font-black uppercase text-text/40 tracking-widest group cursor-default hover:border-gold/20 hover:text-gold transition-all">
                                  #{tag}
                               </span>
                            ))}
                         </div>
                      </div>

                      {/* Editorial Interface Node */}
                      {isContributor && (
                         <div className="space-y-10 bg-gold/[0.03] p-10 rounded-[2.5rem] border border-gold/20">
                            <h4 className="text-[10px] uppercase font-black text-gold tracking-[0.6em] text-center">Editorial_Workflow_Controller</h4>
                            <div className="flex flex-col gap-4">
                               {selectedVideo.status !== 'published' && (
                                 <button 
                                   onClick={() => handleStatusUpdate(selectedVideo.youtubeId, 'published')}
                                   className="luxury-button !bg-gold !text-navy w-full !py-6 text-[10px] font-black tracking-[0.5em]"
                                 >
                                    AUTHORIZE PUBLICATION
                                 </button>
                               )}
                               {selectedVideo.status !== 'rejected' && (
                                 <button 
                                   onClick={() => handleStatusUpdate(selectedVideo.youtubeId, 'rejected')}
                                   className="luxury-button-outline w-full !py-6 text-[10px] font-black tracking-[0.5em] !text-red-500 !border-red-500/20"
                                 >
                                    REJECT ARTIFACT
                                 </button>
                               )}
                               <p className="text-[8px] uppercase font-black text-text/20 text-center tracking-[0.3em]">
                                 Synced By Identity: {selectedVideo.syncedBy}
                               </p>
                            </div>
                         </div>
                      )}
                      
                      <div className="text-center pt-8">
                         <p className="text-[8px] uppercase font-black tracking-[0.8em] text-text/10">ARCHIVAL_NODE_ENDPOINT::{selectedVideo.youtubeId}</p>
                      </div>
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Inscription */}
      <section className="px-12 mt-40 text-center opacity-10 pb-20">
         <p className="text-[8px] uppercase font-black tracking-[0.8em] text-text italic">
           Media_OS_Sovereign_v2.0 // YouTube_RSS_Engine // Leema_AI_Enrichment // House_of_Daraja
         </p>
      </section>
    </motion.div>
  );
}
