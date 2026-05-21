import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, TrendingUp, Zap, Clock, ShieldCheck, AlertCircle, Plus, X, Globe, Loader2, Check, Camera, Database, Upload, Trash2, Edit2, ChevronRight, BarChart3, User, MapPin, Award, BookOpen, Coins } from 'lucide-react';
import { translateProductContent, SUPPORTED_LANGUAGES } from '../services/TranslationService';
import { registerArtifact, fetchVendorProducts, updateArtifact, deleteArtifact, updateArtifactStock } from '../services/ProductService';
import { fetchVendorProfile, updateVendorProfile } from '../services/VendorService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { uploadToDropbox, openPicker } from '../services/DropboxService';
import { Product, Vendor } from '../types';

export default function VendorDashboardView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'profile'>('overview');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState<Product | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [vendorProducts, setVendorProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [vendorProfile, setVendorProfile] = useState<Vendor | null>(null);
  const { profile } = useAuth();
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [currentStep, setCurrentStep] = useState<'details' | 'review'>('details');
  const [newArtifact, setNewArtifact] = useState({ 
    title: '', 
    category: 'Heritage' as any, 
    value: '', 
    description: 'A premium luxury artifact crafted with Sahelian precision.',
    stock: '1',
    vaultMedia: [] as { id: string; name: string; type: string; url: string }[]
  });
  const [generatedTranslations, setGeneratedTranslations] = useState<Record<string, { title: string; description: string; confidence: number }>>({});

  const loadProducts = useCallback(async () => {
    if (!user) return;
    setIsLoadingProducts(true);
    try {
      const products = await fetchVendorProducts(user.uid);
      setVendorProducts(products);
    } catch (err) {
      toast.error("Failed to fetch inventory archive");
    } finally {
      setIsLoadingProducts(false);
    }
  }, [user]);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setIsLoadingProfile(true);
    try {
      const profileData = await fetchVendorProfile(user.uid);
      if (profileData) {
        setVendorProfile(profileData);
      } else {
        // Create initial profile if doesn't exist
        const initialProfile: Omit<Vendor, 'id'> = {
          name: user.displayName || 'Unnamed Artisan',
          description: 'A dedicated artisan preserving Sahelian heritage.',
          location: 'Sahelian Hub',
          rating: 4.8,
          specialty: 'Sahelian Couture',
          accreditationLevel: 'Gold'
        };
        setVendorProfile({ id: user.uid, ...initialProfile });
      }
    } catch (error) {
      console.error("Profile Retrieval Failure:", error);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadProducts();
      loadProfile();
    }
  }, [user, loadProducts, loadProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !vendorProfile) return;
    setIsSavingProfile(true);
    try {
      await updateVendorProfile(user.uid, vendorProfile);
      toast.success("Artisan Profile Synchronized");
    } catch (error) {
      toast.error("Profile Sync Failure");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to de-list this artifact? This action is irreversible.")) return;
    
    try {
      await deleteArtifact(productId, user?.uid);
      setVendorProducts(prev => prev.filter(p => p.id !== productId));
      toast.success("Artifact De-listed from Sovereign Network");
    } catch (err) {
      toast.error("Deletion Protocol Failed");
    }
  };

  const handleUpdateStock = async (productId: string, delta: number) => {
    const product = vendorProducts.find(p => p.id === productId);
    if (!product) return;
    
    const newStock = Math.max(0, product.stock + delta);
    try {
      await updateArtifactStock(productId, newStock);
      setVendorProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
      toast.success(`Stock level updated: ${newStock}`);
    } catch (err) {
      toast.error("Stock Synchronization Failed");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setIsUploading(true);
      const uploadPromises = Array.from(files).map(async file => {
        try {
          const dropboxFile = await uploadToDropbox(file);
          return {
            id: dropboxFile.id,
            name: dropboxFile.name,
            type: file.type,
            url: dropboxFile.webContentLink
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
        vaultMedia: [...prev.vaultMedia, ...validResults]
      }));
      setIsUploading(false);
      toast.success('Media Archival Complete');
    }
  };

  const handlePickerSelect = async () => {
    try {
      await openPicker((selectedFiles: any[]) => {
        const vaultMedia = selectedFiles.map(f => ({
          id: f.id,
          name: f.name,
          type: f.mimeType || 'application/octet-stream',
          url: f.webViewLink
        }));
        setNewArtifact(prev => ({
          ...prev,
          vaultMedia: [...prev.vaultMedia, ...vaultMedia]
        }));
        toast.success('Archive Nodes Linked');
      });
    } catch (err) {
      toast.error('Dropbox Error');
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
      if (isEditingProduct) {
        await updateArtifact(isEditingProduct.id, {
          title: newArtifact.title,
          description: newArtifact.description,
          price: parseFloat(newArtifact.value),
          category: newArtifact.category,
          stock: parseInt(newArtifact.stock),
          vaultMedia: newArtifact.vaultMedia,
          media: newArtifact.vaultMedia.map(f => f.url),
          translations: generatedTranslations as any
        });
        toast.success("Artifact Sovereign Data Link Updated");
      } else {
        await registerArtifact({
          title: newArtifact.title,
          description: newArtifact.description,
          price: parseFloat(newArtifact.value),
          category: newArtifact.category,
          stock: parseInt(newArtifact.stock),
          vendorId: user.uid,
          status: 'active',
          media: newArtifact.vaultMedia.map(f => f.url),
          vaultMedia: newArtifact.vaultMedia,
          translations: generatedTranslations as any,
          tags: [newArtifact.category.toLowerCase(), 'sahelian', 'luxury']
        });
        toast.success("Artifact Sovereign Data Link Created Successfully");
      }

      setIsAddingProduct(false);
      loadProducts(); // Fresh ledger ingestion
      setCurrentStep('details');
      setIsEditingProduct(null);
      setNewArtifact({ 
        title: '', 
        category: 'Heritage', 
        value: '', 
        description: 'A premium luxury artifact crafted with Sahelian precision.',
        stock: '1',
        vaultMedia: []
      });
      setGeneratedTranslations({});
    } catch (error) {
      toast.error("Network Protocol Failure");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = [
    { label: 'Network Reach', value: '4.2k', icon: TrendingUp },
    { label: 'Asset Vaults', value: vendorProducts.length.toString(), icon: Package },
    { label: 'LEE Earnings', value: (profile?.leeBalance || 0).toLocaleString(), icon: Coins },
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
           <span className="text-micro block">Vendor_Console v1.1.0</span>
           <h1 className="text-display text-text italic">Merchant <span className="italic text-gold">Console</span></h1>
        </div>
        <div className="flex gap-4">
          <button 
             onClick={() => {
                setNewArtifact({ 
                  title: '', 
                  category: 'Heritage', 
                  value: '', 
                  description: 'A premium luxury artifact crafted with Sahelian precision.',
                  stock: '1',
                  vaultMedia: []
                });
                setIsEditingProduct(null);
                setCurrentStep('details');
                setIsAddingProduct(true);
             }}
             className="flex items-center gap-3 bg-text text-navy px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-gold transition-colors"
          >
             <Plus className="w-4 h-4" /> Register Artifact
          </button>
          <div className="hidden md:flex items-center gap-4 bg-gold/10 border border-gold/20 px-6 py-3 rounded-full">
             <ShieldCheck className="w-4 h-4 text-gold" />
             <span className="text-[10px] font-black uppercase text-gold tracking-widest">Accredited Node</span>
          </div>
        </div>
      </header>

      {/* Sovereign Navigation */}
      <div className="flex border-b border-text/5 gap-8 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Consensus Overview', icon: BarChart3 },
          { id: 'inventory', label: 'Asset Ledger', icon: Package },
          { id: 'profile', label: 'Artisan Profile', icon: User }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 py-4 px-2 text-[10px] font-black uppercase tracking-widest transition-all relative flex-shrink-0 ${
              activeTab === tab.id ? 'text-gold' : 'text-text/40 hover:text-text'
            }`}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTabBadge"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' ? (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {stats.map((item, i) => (
                <div key={i} className="luxury-card p-10 bg-surface/50 space-y-6">
                  <div className="flex justify-between items-start">
                      <item.icon className="w-5 h-5 text-gold" />
                      <span className="text-[9px] uppercase font-black text-text/20">Metric_0{i+1}</span>
                  </div>
                  <div>
                      <p className="text-4xl font-serif text-text">{item.value}</p>
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
                        <h4 className="text-2xl font-serif text-text uppercase italic">Initialize Flash Drop</h4>
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
                        <div key={activity.id} className="p-6 bg-surface border border-text/5 rounded-2xl flex items-center justify-between group hover:border-gold/20 transition-all">
                          <div className="space-y-2">
                              <p className="text-xs font-bold text-text uppercase tracking-tighter">{activity.action}</p>
                              <div className="flex items-center gap-3">
                                <Clock className="w-3 h-3 text-text/20" />
                                <span className="text-[9px] text-text/40 uppercase font-black">{activity.time}</span>
                              </div>
                          </div>
                          <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full border ${activity.status === 'Verified' ? 'text-green-500 border-green-500/20 bg-green-500/5' : 'text-gold border-gold/20 bg-gold/5'}`}>
                              {activity.status}
                          </span>
                        </div>
                    ))}
                  </div>
                  <div className="p-8 bg-navy border border-text/5 rounded-2xl flex gap-4">
                    <AlertCircle className="w-5 h-5 text-text/20 flex-shrink-0" />
                    <p className="text-[9px] leading-relaxed text-text/40 uppercase font-black tracking-widest">
                        System Notice: Ensure your artisan biometrics are updated by EOM to maintain elite status.
                    </p>
                  </div>
              </section>
            </div>
          </motion.div>
        ) : activeTab === 'inventory' ? (
          <motion.div
            key="inventory"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-micro">Sovereign Asset Ledger</h3>
              <div className="flex items-center gap-4">
                <span className="text-[9px] font-black uppercase text-gold tracking-widest">{vendorProducts.length} Artifacts Archived</span>
                <button onClick={loadProducts} className="p-2 hover:bg-gold/10 rounded-full transition-colors">
                  <Clock className={`w-4 h-4 text-gold ${isLoadingProducts ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {isLoadingProducts ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="luxury-card aspect-[4/5] animate-pulse bg-gold/5" />
                ))}
              </div>
            ) : vendorProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {vendorProducts.map((product) => (
                  <div key={product.id} className="luxury-card bg-surface/50 group overflow-hidden border-text/5 hover:border-gold/20 transition-all flex flex-col">
                    <div className="aspect-[4/3] relative overflow-hidden bg-navy">
                      {product.media?.[0] ? (
                        <img 
                          src={product.media[0]} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          alt={product.title}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-20">
                           <Package className="w-12 h-12" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4 bg-navy/80 backdrop-blur-md px-3 py-1 rounded-full border border-gold/20">
                        <span className="text-[8px] font-black text-gold uppercase tracking-widest">{product.category}</span>
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start">
                        <h4 className="text-lg font-serif italic text-text truncate pr-4">{product.title}</h4>
                        <p className="text-gold font-serif">₦{product.price.toLocaleString()}</p>
                      </div>

                      <div className="p-4 bg-navy/50 rounded-xl border border-text/5 flex items-center justify-between mt-auto">
                        <div className="space-y-1">
                          <p className="text-[8px] uppercase font-black text-text/40 tracking-widest">In Stock</p>
                          <p className="text-lg font-serif text-text">{product.stock}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleUpdateStock(product.id, -1)}
                            className="w-8 h-8 rounded-lg bg-text/5 hover:bg-gold/20 flex items-center justify-center transition-colors"
                          >
                            -
                          </button>
                          <button 
                            onClick={() => handleUpdateStock(product.id, 1)}
                            className="w-8 h-8 rounded-lg bg-text/5 hover:bg-gold/20 flex items-center justify-center transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button 
                          onClick={() => {
                            setNewArtifact({
                              title: product.title,
                              category: product.category,
                              value: product.price.toString(),
                              description: product.description,
                              stock: product.stock.toString(),
                              vaultMedia: product.vaultMedia || []
                            });
                            setIsEditingProduct(product);
                            setCurrentStep('details');
                            setIsAddingProduct(true);
                          }}
                          className="flex-1 px-4 py-2 bg-text text-navy text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-gold transition-colors flex items-center justify-center gap-2"
                        >
                          <Edit2 className="w-3 h-3" /> Edit Mode
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="px-4 py-2 border border-red-500/20 text-red-500 text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-red-500/5 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-32 flex flex-col items-center justify-center text-center space-y-6 bg-gold/5 rounded-3xl border border-dashed border-gold/10">
                <Package className="w-12 h-12 text-gold opacity-20" />
                <div className="space-y-2">
                  <h4 className="text-xl font-serif italic text-text">Archive Vacant</h4>
                  <p className="text-[10px] uppercase font-black text-text/40 tracking-widest">No artifacts registered to your merchant node.</p>
                </div>
                <button 
                  onClick={() => {
                    setNewArtifact({ 
                      title: '', 
                      category: 'Heritage', 
                      value: '', 
                      description: 'A premium luxury artifact crafted with Sahelian precision.',
                      stock: '1',
                      vaultMedia: []
                    });
                    setIsEditingProduct(null);
                    setCurrentStep('details');
                    setIsAddingProduct(true);
                  }}
                  className="luxury-button"
                >
                  Initiate First Registration
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-12"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1 space-y-8">
                <div className="luxury-card p-10 bg-surface/50 text-center space-y-6">
                  <div className="w-32 h-32 rounded-full border-2 border-gold/20 p-2 mx-auto relative group">
                    <div className="w-full h-full rounded-full bg-navy flex items-center justify-center overflow-hidden">
                      {user?.photoURL ? (
                        <img src={user.photoURL} className="w-full h-full object-cover" alt="Profile" />
                      ) : (
                        <User className="w-12 h-12 text-gold opacity-20" />
                      )}
                    </div>
                    <button className="absolute bottom-0 right-0 p-2 bg-text text-navy rounded-full hover:bg-gold transition-colors">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif text-text italic">{vendorProfile?.name}</h2>
                    <p className="text-micro mt-2 text-gold tracking-widest uppercase">{vendorProfile?.accreditationLevel} Artisan</p>
                  </div>
                  <div className="flex justify-center gap-6 pt-4 border-t border-text/5">
                    <div className="text-center">
                      <p className="text-lg font-serif text-text">{vendorProfile?.rating}</p>
                      <p className="text-[7px] uppercase font-black text-text/40">Rating</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-serif text-text">{vendorProducts.length}</p>
                      <p className="text-[7px] uppercase font-black text-text/40">Artifacts</p>
                    </div>
                  </div>
                </div>

                <div className="luxury-card p-8 bg-gold/5 border-gold/10 space-y-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-gold" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-gold text-text">Sovereign Badge Status</span>
                  </div>
                  <p className="text-[9px] leading-relaxed text-text/60 italic">
                    "Your node is currently synchronized with the global luxury protocol. Maintain 98.4% uptime to preserve status."
                  </p>
                </div>
              </div>

              <div className="lg:col-span-2">
                <form onSubmit={handleUpdateProfile} className="luxury-card p-12 bg-surface/50 space-y-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-serif italic text-text">Merchant Data Fields</h3>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-text/20" />
                      <span className="text-[8px] font-black text-text/20 uppercase">Last Sync: Today</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-micro flex items-center gap-2">
                        <User className="w-3 h-3 text-gold" /> Artisan Identity
                      </label>
                      <input 
                        className="w-full bg-navy border border-text/5 rounded-xl px-6 py-4 text-sm text-text focus:border-gold outline-none"
                        value={vendorProfile?.name || ''}
                        onChange={(e) => setVendorProfile(prev => prev ? {...prev, name: e.target.value} : null)}
                        placeholder="Public Merchant Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-micro flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-gold" /> Creative Node Location
                      </label>
                      <input 
                        className="w-full bg-navy border border-text/5 rounded-xl px-6 py-4 text-sm text-text focus:border-gold outline-none"
                        value={vendorProfile?.location || ''}
                        onChange={(e) => setVendorProfile(prev => prev ? {...prev, location: e.target.value} : null)}
                        placeholder="e.g. Lagos Creative District"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-micro flex items-center gap-2">
                        <Award className="w-3 h-3 text-gold" /> Primary Specialty
                      </label>
                      <input 
                        className="w-full bg-navy border border-text/5 rounded-xl px-6 py-4 text-sm text-text focus:border-gold outline-none"
                        value={vendorProfile?.specialty || ''}
                        onChange={(e) => setVendorProfile(prev => prev ? {...prev, specialty: e.target.value} : null)}
                        placeholder="e.g. Hand-Dyed Silks"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-micro flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3 text-gold" /> Accreditation Master Tier
                      </label>
                      <select 
                        className="w-full bg-navy border border-text/5 rounded-xl px-4 py-4 text-sm text-text focus:border-gold outline-none appearance-none"
                        value={vendorProfile?.accreditationLevel}
                        onChange={(e) => setVendorProfile(prev => prev ? {...prev, accreditationLevel: e.target.value as any} : null)}
                      >
                         <option value="Gold">Gold Tier</option>
                         <option value="Platinum">Platinum Elite</option>
                         <option value="Master">Master Artisan</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-micro flex items-center gap-2">
                      <BookOpen className="w-3 h-3 text-gold" /> Brand Provenance Statement
                    </label>
                    <textarea 
                      className="w-full bg-navy border border-text/5 rounded-xl px-6 py-4 text-sm text-text focus:border-gold outline-none h-40 resize-none font-serif italic"
                      value={vendorProfile?.description || ''}
                      onChange={(e) => setVendorProfile(prev => prev ? {...prev, description: e.target.value} : null)}
                      placeholder="Articulate your artisan journey..."
                    />
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit"
                      disabled={isSavingProfile}
                      className="luxury-button w-full md:w-auto md:px-12 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isSavingProfile ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Encrypting Data...
                        </>
                      ) : (
                        <>
                          Authorize Synchronization
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                   <h2 className="text-3xl font-serif text-text italic">
                     {isEditingProduct ? 'Update Artifact' : currentStep === 'details' ? 'Artifact Inbound' : 'Linguistic Review'}
                   </h2>
                   <button onClick={() => {
                       setIsAddingProduct(false);
                       setIsEditingProduct(null);
                       setCurrentStep('details');
                   }} className="text-text/20 hover:text-text"><X className="w-6 h-6" /></button>
                </div>
                
                <div className="space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
                   {currentStep === 'details' ? (
                     <>
                       <div className="space-y-2">
                          <label className="text-micro">Archive Title</label>
                          <input 
                            className="w-full bg-navy border border-text/5 rounded-xl px-6 py-4 text-sm text-text focus:border-gold outline-none"
                            placeholder="e.g. Imperial Silk Kaftan"
                            value={newArtifact.title}
                            onChange={(e) => setNewArtifact({ ...newArtifact, title: e.target.value })}
                            disabled={isTranslating}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-micro">Description</label>
                          <textarea 
                            className="w-full bg-navy border border-text/5 rounded-xl px-6 py-4 text-sm text-text focus:border-gold outline-none h-32 resize-none"
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
                               className="w-full bg-navy border border-text/5 rounded-xl px-4 py-4 text-sm text-text focus:border-gold outline-none appearance-none"
                               value={newArtifact.category}
                               onChange={(e) => setNewArtifact({ ...newArtifact, category: e.target.value as any })}
                               disabled={isTranslating}
                             >
                                <option value="Heritage">Heritage</option>
                                <option value="Streetwear">Streetwear</option>
                                <option value="Marketplace">Marketplace</option>
                                <option value="Accessories">Accessories</option>
                                <option value="Materials">Materials</option>
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-micro">Inventory Stock</label>
                             <input 
                               type="number"
                               className="w-full bg-navy border border-text/5 rounded-xl px-4 py-4 text-sm text-text focus:border-gold outline-none"
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
                            className="w-full bg-navy border border-text/5 rounded-xl px-4 py-4 text-sm text-text focus:border-gold outline-none"
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
                             {newArtifact.vaultMedia.map((file, i) => (
                                <div key={i} className="aspect-square rounded-xl overflow-hidden border border-text/5 group relative">
                                   <img src={file.url} className="w-full h-full object-cover" />
                                   <button 
                                      onClick={() => setNewArtifact({ ...newArtifact, vaultMedia: newArtifact.vaultMedia.filter((_, idx) => idx !== i) })}
                                      className="absolute top-1 right-1 p-1 bg-navy/80 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="w-2 h-2 text-text" />
                                    </button>
                                </div>
                             ))}
                             {isUploading && (
                                <div className="aspect-square rounded-xl border border-gold/10 bg-gold/5 flex items-center justify-center animate-pulse">
                                   <Loader2 className="w-4 h-4 text-gold animate-spin" />
                                </div>
                             )}
                             <label className="aspect-square rounded-xl border-2 border-dashed border-text/5 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-gold/20 transition-all text-text/10 hover:text-gold">
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
                             Synchronizing Linguistic Resonance...
                           </span>
                         ) : (
                           <span className="flex items-center gap-2">
                             <Globe className="w-4 h-4 text-navy group-hover:rotate-45 transition-transform" />
                             {isEditingProduct ? 'Update AI Translations' : 'Proceed to Multilingual Protocol'}
                           </span>
                         )}
                       </button>
                     </>
                   ) : (
                     <div className="space-y-8">
                       {Object.entries(generatedTranslations).map(([lang, trans]) => {
                         const langName = SUPPORTED_LANGUAGES.find(l => l.code === lang)?.name || lang;
                         return (
                            <div key={lang} className="p-6 bg-navy/50 border border-text/5 rounded-2xl space-y-4">
                              <div className="flex justify-between items-center">
                                 <span className="text-micro text-gold">{langName} Output</span>
                                 <div className="flex items-center gap-2">
                                    <div className="w-24 h-1 bg-text/5 rounded-full overflow-hidden">
                                       <div 
                                         className="h-full bg-gold transition-all duration-1000" 
                                         style={{ width: `${(trans.confidence || 0.9) * 100}%` }}
                                       ></div>
                                    </div>
                                    <span className="text-[8px] font-black text-text/40">{((trans.confidence || 0.9) * 100).toFixed(0)}% Quality</span>
                                 </div>
                              </div>
                              <input 
                                className="w-full bg-transparent border-b border-text/5 py-2 text-sm text-text focus:border-gold outline-none italic font-serif"
                                value={trans.title}
                                onChange={(e) => setGeneratedTranslations({
                                   ...generatedTranslations,
                                   [lang]: { ...trans, title: e.target.value }
                                })}
                              />
                              <textarea 
                                className="w-full bg-transparent border-b border-text/5 py-2 text-xs text-text/60 focus:border-gold outline-none h-20 resize-none font-serif"
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
                            {isEditingProduct ? 'Commit Changes' : 'Authorize Entry'}
                          </button>
                       </div>
                     </div>
                   )}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
