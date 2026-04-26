import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, TrendingUp, Zap, Clock, ShieldCheck, AlertCircle, Plus, X, Globe, Loader2, Check, Camera, Database, Upload } from 'lucide-react';
import { translateProductContent, SUPPORTED_LANGUAGES } from '../services/TranslationService';
import { registerArtifact, fetchVendorProducts } from '../services/ProductService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { uploadToDrive, openPicker } from '../services/GoogleDriveService';

export default function VendorDashboardView() {
  const { user } = useAuth();
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'details' | 'review'>('details');
  const [newArtifact, setNewArtifact] = useState({ 
    title: '', 
    category: 'Heritage' as any, 
    value: '', 
    description: 'A premium luxury artifact crafted with Sahelian precision.',
    stock: '1',
    driveFiles: [] as { id: string; name: string; type: string; url: string }[]
  });
  const [generatedTranslations, setGeneratedTranslations] = useState<Record<string, { title: string; description: string; confidence: number }>>({});

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setIsUploading(true);
      const uploadPromises = Array.from(files).map(async file => {
        try {
          const driveFile = await uploadToDrive(file);
          return {
            id: driveFile.id,
            name: driveFile.name,
            type: file.type,
            url: driveFile.webContentLink
          };
        } catch (err) {
          toast.error(`Failed to upload ${file.name}`);
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      const validResults = results.filter(r => r !== null) as any[];
      
      setNewArtifact(prev => ({
        ...prev,
        driveFiles: [...prev.driveFiles, ...validResults]
      }));
      setIsUploading(false);
      toast.success('Media Archival Complete');
    }
  };

  const handlePickerSelect = async () => {
    try {
      await openPicker((selectedFiles: any[]) => {
        const driveFiles = selectedFiles.map(f => ({
          id: f.id,
          name: f.name,
          type: f.mimeType,
          url: f.url
        }));
        setNewArtifact(prev => ({
          ...prev,
          driveFiles: [...prev.driveFiles, ...driveFiles]
        }));
        toast.success('Archive Nodes Linked');
      });
    } catch (err) {
      toast.error('GAPI Error');
    }
  };

  const startTranslationProtocol = async () => {
    setIsTranslating(true);
    
    const translations: Record<string, any> = {};
    const targetLangs = SUPPORTED_LANGUAGES.filter(l => l.code !== 'en');

    for (const lang of targetLangs) {
      const result = await translateProductContent(newArtifact.title, newArtifact.description, lang.code);
      translations[lang.code] = result;
    }

    setGeneratedTranslations(translations);
    setIsTranslating(false);
    setCurrentStep('review');
  };

  const finalizeRegistration = async () => {
    if (!user) return;
    setIsSubmitting(true);
    
    try {
      const productId = await registerArtifact({
        title: newArtifact.title,
        description: newArtifact.description,
        price: parseFloat(newArtifact.value),
        category: newArtifact.category,
        stock: parseInt(newArtifact.stock),
        vendorId: user.uid,
        status: 'active',
        media: newArtifact.driveFiles.map(f => f.url),
        driveMedia: newArtifact.driveFiles,
        translations: generatedTranslations as any,
        tags: [newArtifact.category.toLowerCase(), 'sahelian', 'luxury']
      });

      if (productId) {
        toast.success("Artifact Sovereign Data Link Created Successfully");
        setIsAddingProduct(false);
        setCurrentStep('details');
        setNewArtifact({ 
          title: '', 
          category: 'Heritage', 
          value: '', 
          description: 'A premium luxury artifact crafted with Sahelian precision.',
          stock: '1',
          driveFiles: []
        });
        setGeneratedTranslations({});
      }
    } catch (error) {
      toast.error("Registration Protocol Failure");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = [
    { label: 'Network Reach', value: '4.2k', icon: TrendingUp },
    { label: 'Active Vaults', value: '156', icon: Package },
    { label: 'Drop Urgency', value: 'High', icon: Zap },
  ];

  const recentActivity = [
    { id: '1', action: 'Accreditation Renewal', status: 'Verified', time: '2h ago' },
    { id: '2', action: 'Marketplace Inbound', status: 'Processing', time: '5h ago' },
    { id: '3', action: 'Artifact Upload', status: 'Pending Review', time: '1d ago' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="pt-12 pb-32 px-6 max-w-7xl mx-auto space-y-12"
    >
      <header className="flex flex-col md:flex-row justify-between items-end gap-8">
        <div>
           <span className="text-micro block">Vendor_Console v1.0</span>
           <h1 className="text-display text-white italic">Merchant <span className="italic text-gold">Console</span></h1>
        </div>
        <div className="flex gap-4">
          <button 
             onClick={() => setIsAddingProduct(true)}
             className="flex items-center gap-3 bg-white text-navy px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-gold transition-colors"
          >
             <Plus className="w-4 h-4" /> Register Artifact
          </button>
          <div className="hidden md:flex items-center gap-4 bg-gold/10 border border-gold/20 px-6 py-3 rounded-full">
             <ShieldCheck className="w-4 h-4 text-gold" />
             <span className="text-[10px] font-black uppercase text-gold tracking-widest">Accredited Node</span>
          </div>
        </div>
      </header>

      {/* Artifact Registration Modal */}
      <AnimatePresence>
        {isAddingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddingProduct(false)}
                className="absolute inset-0 bg-navy/80 backdrop-blur-sm"
             ></motion.div>
             <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative z-10 w-full max-w-lg luxury-card p-12 bg-surface shadow-2xl border-gold/20"
             >
                <div className="flex justify-between items-center mb-10">
                   <h2 className="text-3xl font-serif text-white italic">
                     {currentStep === 'details' ? 'Artifact Inbound' : 'Linguistic Review'}
                   </h2>
                   <button onClick={() => {
                       setIsAddingProduct(false);
                       setCurrentStep('details');
                   }} className="text-white/20 hover:text-white"><X className="w-6 h-6" /></button>
                </div>
                
                <div className="space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
                   {currentStep === 'details' ? (
                     <>
                       <div className="space-y-2">
                          <label className="text-micro">Archive Title</label>
                          <input 
                            className="w-full bg-navy border border-white/5 rounded-xl px-6 py-4 text-sm text-white focus:border-gold outline-none"
                            placeholder="e.g. Imperial Silk Kaftan"
                            value={newArtifact.title}
                            onChange={(e) => setNewArtifact({ ...newArtifact, title: e.target.value })}
                            disabled={isTranslating}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-micro">Description</label>
                          <textarea 
                            className="w-full bg-navy border border-white/5 rounded-xl px-6 py-4 text-sm text-white focus:border-gold outline-none h-32 resize-none"
                            placeholder="Describe the artifact's provenance..."
                            value={newArtifact.description}
                            onChange={(e) => setNewArtifact({ ...newArtifact, description: e.target.value })}
                            disabled={isTranslating}
                          />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-micro">Category</label>
                             <select 
                               className="w-full bg-navy border border-white/5 rounded-xl px-4 py-4 text-sm text-white focus:border-gold outline-none appearance-none"
                               value={newArtifact.category}
                               onChange={(e) => setNewArtifact({ ...newArtifact, category: e.target.value as any })}
                               disabled={isTranslating}
                             >
                                <option value="Heritage">Heritage</option>
                                <option value="Streetwear">Streetwear</option>
                                <option value="Marketplace">Marketplace</option>
                                <option value="Accessories">Accessories</option>
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-micro">Initial Stock</label>
                             <input 
                               type="number"
                               className="w-full bg-navy border border-white/5 rounded-xl px-4 py-4 text-sm text-white focus:border-gold outline-none"
                               placeholder="1"
                               value={newArtifact.stock}
                               onChange={(e) => setNewArtifact({ ...newArtifact, stock: e.target.value })}
                               disabled={isTranslating}
                             />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-micro">Reserve Value (₦)</label>
                          <input 
                            className="w-full bg-navy border border-white/5 rounded-xl px-4 py-4 text-sm text-white focus:border-gold outline-none"
                            placeholder="₦"
                            value={newArtifact.value}
                            onChange={(e) => setNewArtifact({ ...newArtifact, value: e.target.value })}
                            disabled={isTranslating}
                          />
                       </div>

                       <div className="space-y-4">
                          <div className="flex justify-between items-end">
                             <label className="text-micro">Artifact Media (Images/Videos)</label>
                             <button 
                                onClick={handlePickerSelect}
                                type="button"
                                className="text-[8px] uppercase font-black text-gold/60 hover:text-gold flex items-center gap-1 transition-colors"
                             >
                                <Database className="w-3 h-3" />
                                Link from Archive
                             </button>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                             {newArtifact.driveFiles.map((file, i) => (
                                <div key={i} className="aspect-square rounded-xl overflow-hidden border border-white/5 group relative">
                                   <img src={file.url} className="w-full h-full object-cover" />
                                   <button 
                                      onClick={() => setNewArtifact({ ...newArtifact, driveFiles: newArtifact.driveFiles.filter((_, idx) => idx !== i) })}
                                      className="absolute top-1 right-1 p-1 bg-navy/80 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="w-2 h-2 text-white" />
                                    </button>
                                </div>
                             ))}
                             {isUploading && (
                                <div className="aspect-square rounded-xl border border-gold/10 bg-gold/5 flex items-center justify-center animate-pulse">
                                   <Loader2 className="w-4 h-4 text-gold animate-spin" />
                                </div>
                             )}
                             <label className="aspect-square rounded-xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-gold/20 transition-all text-white/10 hover:text-gold">
                                <Camera className="w-4 h-4" />
                                <span className="text-[7px] font-black uppercase">Capture</span>
                                <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleImageUpload} />
                             </label>
                          </div>
                       </div>

                       <button 
                         onClick={startTranslationProtocol}
                         disabled={isTranslating || !newArtifact.title}
                         className="luxury-button w-full mt-8 disabled:opacity-50 disabled:cursor-not-allowed group"
                       >
                         {isTranslating ? (
                           <span className="flex items-center gap-2">
                             <Loader2 className="w-4 h-4 animate-spin text-navy" />
                             AI Sovereignty Exchange Active...
                           </span>
                         ) : (
                           <span className="flex items-center gap-2">
                             <Globe className="w-4 h-4 text-navy group-hover:rotate-45 transition-transform" />
                             Submit to Multilingual Protocol
                           </span>
                         )}
                       </button>
                       {isTranslating && (
                         <p className="text-[8px] uppercase font-black text-gold/60 text-center tracking-widest animate-pulse">
                           Synchronizing linguistic resonance across the Sahelian network
                         </p>
                       )}
                     </>
                   ) : (
                     <div className="space-y-8">
                       {Object.entries(generatedTranslations).map(([lang, trans]) => {
                         const langName = SUPPORTED_LANGUAGES.find(l => l.code === lang)?.name || lang;
                         return (
                           <div key={lang} className="p-6 bg-navy/50 border border-white/5 rounded-2xl space-y-4">
                              <div className="flex justify-between items-center">
                                 <span className="text-micro text-gold">{langName} Output</span>
                                 <div className="flex items-center gap-2">
                                    <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                                       <div 
                                         className="h-full bg-gold transition-all duration-1000" 
                                         style={{ width: `${(trans.confidence || 0.9) * 100}%` }}
                                       ></div>
                                    </div>
                                    <span className="text-[8px] font-black text-white/40">{((trans.confidence || 0.9) * 100).toFixed(0)}% Quality</span>
                                 </div>
                              </div>
                              <input 
                                className="w-full bg-transparent border-b border-white/5 py-2 text-sm text-white focus:border-gold outline-none italic font-serif"
                                value={trans.title}
                                onChange={(e) => setGeneratedTranslations({
                                   ...generatedTranslations,
                                   [lang]: { ...trans, title: e.target.value }
                                })}
                              />
                              <textarea 
                                className="w-full bg-transparent border-b border-white/5 py-2 text-xs text-white/60 focus:border-gold outline-none h-20 resize-none font-serif"
                                value={trans.description}
                                onChange={(e) => setGeneratedTranslations({
                                   ...generatedTranslations,
                                   [lang]: { ...trans, description: e.target.value }
                                })}
                              />
                           </div>
                         );
                       })}
                       <div className="pt-4 flex gap-4 pb-8">
                          <button 
                            onClick={() => setCurrentStep('details')}
                            className="luxury-button-outline flex-1"
                          >
                            Refine Details
                          </button>
                          <button 
                            onClick={finalizeRegistration}
                            className="luxury-button flex-1"
                          >
                            Authorize Entry
                          </button>
                       </div>
                     </div>
                   )}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((item, i) => (
          <div key={i} className="luxury-card p-10 bg-surface/50 space-y-6">
             <div className="flex justify-between items-start">
                <item.icon className="w-5 h-5 text-gold" />
                <span className="text-[9px] uppercase font-black text-white/20">Metric_0{i+1}</span>
             </div>
             <div>
                <p className="text-4xl font-serif text-white">{item.value}</p>
                <p className="text-micro mt-2">{item.label}</p>
             </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
         <section className="lg:w-[61.8%] space-y-8">
            <h3 className="text-micro">Active Node Controls</h3>
            <div className="luxury-card p-12 bg-gold/5 border-gold/10 flex flex-col items-center text-center gap-8">
               <div className="p-6 bg-gold/10 rounded-full animate-pulse border border-gold/20">
                  <Zap className="w-12 h-12 text-gold font-black" />
               </div>
               <div className="space-y-4">
                  <h4 className="text-2xl font-serif text-white uppercase italic">Initialize Flash Drop</h4>
                  <p className="text-body text-sm max-w-md mx-auto">
                     Broadcast a limited-time acquisition window to the elite decentralized network. 
                     Urgency increases status conversion.
                  </p>
               </div>
               <button className="luxury-button !mx-0">Configure Drop Protocol</button>
            </div>
         </section>

         <section className="lg:w-[38.2%] space-y-8">
            <h3 className="text-micro">Recent Node Activity</h3>
            <div className="space-y-4">
               {recentActivity.map((activity) => (
                  <div key={activity.id} className="p-6 bg-surface border border-white/5 rounded-2xl flex items-center justify-between group hover:border-gold/20 transition-all">
                     <div className="space-y-2">
                        <p className="text-xs font-bold text-white uppercase tracking-tighter">{activity.action}</p>
                        <div className="flex items-center gap-3">
                           <Clock className="w-3 h-3 text-white/20" />
                           <span className="text-[9px] text-white/40 uppercase font-black">{activity.time}</span>
                        </div>
                     </div>
                     <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full border ${activity.status === 'Verified' ? 'text-green-500 border-green-500/20 bg-green-500/5' : 'text-gold border-gold/20 bg-gold/5'}`}>
                        {activity.status}
                     </span>
                  </div>
               ))}
            </div>
            <div className="p-8 bg-navy border border-white/5 rounded-2xl flex gap-4">
               <AlertCircle className="w-5 h-5 text-white/20 flex-shrink-0" />
               <p className="text-[9px] leading-relaxed text-white/40 uppercase font-black tracking-widest">
                  System Notice: Ensure your artisan biometrics are updated by EOM to maintain elite status.
               </p>
            </div>
         </section>
      </div>
    </motion.div>
  );
}
