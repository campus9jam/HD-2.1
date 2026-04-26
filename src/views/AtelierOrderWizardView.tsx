import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Camera, 
  Zap, 
  Info,
  Ruler,
  Scissors,
  ClipboardList,
  AlertTriangle,
  Upload,
  Database
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AtelierOrder, AtelierMeasurements } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { extractAtelierDataFromText } from '../lib/atelierUtils';
import { unlockAchievement } from '../lib/achievementUtils';
import { toast } from 'sonner';
import { createAtelierOrder, fetchAtelierClient } from '../services/AtelierService';
import { uploadToDrive, openPicker } from '../services/GoogleDriveService';

export default function AtelierOrderWizardView() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { fabric?: string, price?: number };
  const { profile } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const [order, setOrder] = useState<Partial<AtelierOrder>>({
    clientUsername: profile?.username || '',
    outfitName: state?.fabric ? `${state.fabric} Bespoke` : '',
    outfitType: 'Kaftan',
    fabric: state?.fabric || '',
    serialNumber: '',
    price: state?.price || 0,
    deadline: '',
    styleNotes: '',
    orderNotes: '',
    priority: 'Normal',
    status: 'Pending',
    depositPaid: false,
    balancePaid: false,
    imageDataUrls: [],
    driveFiles: [],
    measurements: {
      bustChest: '', waist: '', hips: '', length: '', shoulder: '', sleeve: '',
      armhole: '', neck: '', thigh: '', knee: '', cuff: '', additional: ''
    }
  });

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
          toast.error(`Failed to upload ${file.name} to sovereign storage`);
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      const validResults = results.filter(r => r !== null) as any[];
      
      setOrder(prev => ({
        ...prev,
        driveFiles: [...(prev.driveFiles || []), ...validResults]
      }));
      setIsUploading(false);
      toast.success('Media Archival Complete', { description: `${validResults.length} assets offloaded to Drive.` });
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
        setOrder(prev => ({
          ...prev,
          driveFiles: [...(prev.driveFiles || []), ...driveFiles]
        }));
        toast.success(`${driveFiles.length} Archive Nodes Linked`);
      });
    } catch (err) {
      toast.error('GAPI Error', { description: 'Could not initialize archive picker.' });
    }
  };

  const TERMS_AND_CONDITIONS = [
    { title: "1. Consultation & Measurements", content: "All orders require an initial consultation to confirm design, fabric choice, and measurements. We are not responsible for garments that do not fit due to weight fluctuations or inaccurate measurements provided by the client (if not measured in-studio)." },
    { title: "2. Payment Terms", content: "Deposit: A 60% non-refundable deposit is required to confirm all orders and secure materials. Production will not begin until this deposit is received. Balance: The remaining 40% balance is due upon completion and must be paid in full before the garment is collected or shipped." },
    { title: "3. Design & Fabric", content: "Variations: Please note that slight variations in color or texture may occur between fabric samples and the final product. Sourcing: If the client provides their own fabric, we are not liable for any defects or issues arising from the quality of that material." },
    { title: "4. Timelines & Deadlines", content: "Standard production time is 2 weeks from the date the deposit is paid. Rush Orders: Orders requiring a faster turnaround will incur an additional express rush fee (negotiable). We will notify you immediately if any unforeseen delays (e.g., supply chain issues) occur." },
    { title: "5. Alterations & Fittings", content: "The first fitting and minor adjustments are included in the original price. Major design changes requested after production has started will be billed as additional costs. Any alteration requests made more than 3 days after pickup will be treated as a new order." },
    { title: "6. Collection & Storage", content: "Completed garments must be collected within 7 days of notification. Garments left longer than 7 days may incur a storage fee or, after 12 months, may be sold to recover costs." }
  ];

  const handleAiAutoFill = () => {
    if (!aiInput.trim()) {
      toast.error('Manifest Input Empty', { description: 'Please provide a narrative fragment to extract data.' });
      return;
    }
    const extracted = extractAtelierDataFromText(aiInput);
    setOrder(prev => ({
      ...prev,
      outfitName: extracted.outfitName || prev.outfitName,
      fabric: extracted.fabric || prev.fabric,
      price: extracted.price ? parseInt(extracted.price) : prev.price,
      measurements: {
        ...prev.measurements!,
        ...extracted.measurements
      }
    }));
    toast.success('Neural Extraction Successful', { description: 'Sovereign data nodes synced from fragment.' });
    setAiInput('');
  };

  const handleSubmit = async () => {
    if (!order.clientUsername || !order.outfitName) {
      toast.error('Incomplete Manifest', { description: 'Identity and Outfit Name are mandatory nodes.' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Validate client exists
      const client = await fetchAtelierClient(order.clientUsername!);
      if (!client) {
        toast.error('Identity Node Not Found', { description: 'Requested username is not registered in the archive.' });
        setIsSubmitting(false);
        return;
      }

      await createAtelierOrder(order as Omit<AtelierOrder, 'id'>);

      // Award Architect achievement
      if (profile) {
        unlockAchievement(profile.uid, 'ARCHITECT', profile).catch(console.error);
      }

      toast.success('Fabrication Initiated', { description: 'Bespoke node established in the sovereign archive.' });
      navigate('/atelier');
    } catch (err) {
      toast.error('Archive Desync', { description: 'Structural error during data persistence.' });
      setIsSubmitting(false);
    }
  };

  const updateMeasurement = (key: keyof AtelierMeasurements, val: string) => {
    setOrder(prev => ({
      ...prev,
      measurements: { ...prev.measurements!, [key]: val }
    }));
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="flex items-center gap-4 text-gold border-b border-gold/10 pb-4">
               <div className="p-3 bg-gold/10 rounded-2xl">
                  <ClipboardList className="w-6 h-6" />
               </div>
               <div>
                  <h2 className="text-xl font-serif italic text-text">Client & Concept</h2>
                  <p className="text-[10px] uppercase font-black tracking-widest opacity-40">Phase_01 // Core Identity</p>
               </div>
            </div>

            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-text/30 ml-2 tracking-widest">Node_Username</label>
                  <input 
                    type="text" 
                    value={order.clientUsername}
                    onChange={(e) => setOrder({...order, clientUsername: e.target.value.toLowerCase()})}
                    className="luxury-input w-full"
                    placeholder="Enter registered username"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-text/30 ml-2 tracking-widest">Outfit_Manifest</label>
                  <input 
                    type="text" 
                    value={order.outfitName}
                    onChange={(e) => setOrder({...order, outfitName: e.target.value})}
                    className="luxury-input w-full"
                    placeholder="e.g. Royal Agbada v2"
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-text/30 ml-2 tracking-widest">Type</label>
                    <select 
                      value={order.outfitType}
                      onChange={(e) => setOrder({...order, outfitType: e.target.value})}
                      className="luxury-input w-full appearance-none"
                    >
                       <option>Kaftan</option>
                       <option>Agbada</option>
                       <option>Suit</option>
                       <option>Dress</option>
                       <option>Blouse</option>
                       <option>Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-text/30 ml-2 tracking-widest">Target_Deadline</label>
                    <input 
                      type="date" 
                      value={order.deadline}
                      onChange={(e) => setOrder({...order, deadline: e.target.value})}
                      className="luxury-input w-full"
                    />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-text/30 ml-2 tracking-widest">Price (₦)</label>
                  <input 
                    type="number" 
                    value={order.price || ''}
                    onChange={(e) => setOrder({...order, price: parseInt(e.target.value)})}
                    className="luxury-input w-full"
                    placeholder="0.00"
                  />
               </div>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="flex items-center gap-4 text-gold border-b border-gold/10 pb-4">
               <div className="p-3 bg-gold/10 rounded-2xl">
                  <Scissors className="w-6 h-6" />
               </div>
               <div>
                  <h2 className="text-xl font-serif italic text-text">Fabric & Design</h2>
                  <p className="text-[10px] uppercase font-black tracking-widest opacity-40">Phase_02 // Material Manifest</p>
               </div>
            </div>

            {/* AI Beta Extraction */}
            <div className="p-6 bg-gold/5 rounded-3xl border border-gold/20 space-y-4">
               <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-gold animate-pulse" />
                  <span className="text-[10px] uppercase font-black text-gold tracking-widest">Neural_AutoFill_Beta</span>
               </div>
               <textarea 
                 value={aiInput}
                 onChange={(e) => setAiInput(e.target.value)}
                 placeholder="Paste WhatsApp message or design notes here to extract fields..."
                 className="w-full bg-navy/50 border border-text/5 rounded-2xl p-4 text-xs text-text/70 italic placeholder:text-text/10 outline-none focus:border-gold/30 transition-all min-h-[100px]"
               />
               <button 
                 onClick={handleAiAutoFill}
                 className="w-full py-3 bg-gold/10 text-gold text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-gold/20 transition-all border border-gold/10"
               >
                 Execute Neural Extraction
               </button>
            </div>

            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-text/30 ml-2 tracking-widest">Fabric_Artifact</label>
                    <input 
                      type="text" 
                      value={order.fabric}
                      onChange={(e) => setOrder({...order, fabric: e.target.value})}
                      className="luxury-input w-full"
                      placeholder="e.g. Italian Wool"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-text/30 ml-2 tracking-widest">Serial_Number</label>
                    <input 
                      type="text" 
                      value={order.serialNumber}
                      onChange={(e) => setOrder({...order, serialNumber: e.target.value})}
                      className="luxury-input w-full"
                      placeholder="SN-99"
                    />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-text/30 ml-2 tracking-widest">Style_Notes</label>
                  <textarea 
                    value={order.styleNotes}
                    onChange={(e) => setOrder({...order, styleNotes: e.target.value})}
                    className="luxury-input w-full min-h-[100px]"
                    placeholder="Specific design parameters..."
                  />
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] uppercase font-black text-text/30 ml-2 tracking-widest">Reference_Images_&_Videos</label>
                    <button 
                      onClick={handlePickerSelect}
                      type="button"
                      className="text-[9px] uppercase font-black text-gold/60 hover:text-gold flex items-center gap-1 transition-colors"
                    >
                      <Database className="w-3 h-3" />
                      Browse Drive Archive
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                     {order.driveFiles?.map((file, i) => (
                        <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-text/10 group relative">
                           <img src={file.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                           <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[8px] font-black uppercase text-text/70 tracking-tighter truncate px-2">{file.name}</span>
                           </div>
                        </div>
                     ))}
                     {isUploading && (
                       <div className="aspect-square rounded-2xl border border-gold/20 bg-gold/5 flex items-center justify-center animate-pulse">
                          <Upload className="w-6 h-6 text-gold animate-bounce" />
                       </div>
                     )}
                     <label className="aspect-square rounded-2xl border-2 border-dashed border-text/10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-gold/30 transition-all text-text/20 hover:text-gold group">
                        <Camera className="w-6 h-6" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Snap_Artifact</span>
                        <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleImageUpload} />
                     </label>
                  </div>
               </div>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="flex items-center gap-4 text-gold border-b border-gold/10 pb-4">
               <div className="p-3 bg-gold/10 rounded-2xl">
                  <Ruler className="w-6 h-6" />
               </div>
               <div>
                  <h2 className="text-xl font-serif italic text-text">Measurement Grid</h2>
                  <p className="text-[10px] uppercase font-black tracking-widest opacity-40">Phase_03 // Precision Matrix</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
               {(Object.keys(order.measurements!) as Array<keyof AtelierMeasurements>).map((m) => (
                  m !== 'additional' && (
                    <div key={m} className="space-y-1 relative">
                       <label className="text-[9px] uppercase font-black text-text/20 ml-2 tracking-widest">{m.replace(/([A-Z])/g, ' $1')}</label>
                       <input 
                         type="text" 
                         value={order.measurements![m] as string}
                         onChange={(e) => updateMeasurement(m, e.target.value)}
                         className="bg-transparent border-b border-text/10 w-full py-2 text-gold font-serif italic text-lg outline-none focus:border-gold transition-colors"
                         placeholder="..."
                       />
                    </div>
                  )
               ))}
            </div>

            <div className="space-y-4">
               <label className="text-[10px] uppercase font-black text-text/30 ml-2 tracking-widest">Additional_Parameters</label>
               <textarea 
                 value={order.measurements!.additional}
                 onChange={(e) => updateMeasurement('additional', e.target.value)}
                 className="luxury-input w-full min-h-[80px]"
                 placeholder="Crotch, muscle, etc..."
               />
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="flex items-center gap-4 text-gold border-b border-gold/10 pb-4">
               <div className="p-3 bg-gold/10 rounded-2xl">
                  <Check className="w-6 h-6" />
               </div>
               <div>
                  <h2 className="text-xl font-serif italic text-text">Final Synchronization</h2>
                  <p className="text-[10px] uppercase font-black tracking-widest opacity-40">Phase_04 // Dispatch Execution</p>
               </div>
            </div>

            <div className="space-y-8">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] uppercase font-black text-text/30 ml-2 tracking-widest">Status_Tier</label>
                     <select 
                       value={order.priority}
                       onChange={(e) => setOrder({...order, priority: e.target.value as any})}
                       className="luxury-input w-full appearance-none"
                     >
                        <option>Normal</option>
                        <option>High</option>
                        <option>Urgent</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] uppercase font-black text-text/30 ml-2 tracking-widest">Fabrication_State</label>
                     <div className="luxury-input w-full bg-text/5 opacity-50 flex items-center justify-between">
                        <span className="text-sm">Pending</span>
                        <Zap className="w-3 h-3" />
                     </div>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-text/30 ml-2 tracking-widest">Internal_Notes</label>
                  <textarea 
                    value={order.orderNotes}
                    onChange={(e) => setOrder({...order, orderNotes: e.target.value})}
                    className="luxury-input w-full min-h-[100px]"
                    placeholder="Staff notes only..."
                  />
               </div>

               {/* Summary Card */}
               <div className="luxury-card p-8 bg-surface border-gold/30 space-y-4">
                  <div className="flex justify-between items-start">
                     <div>
                        <h4 className="text-2xl font-serif text-text italic">{order.outfitName}</h4>
                        <p className="text-[10px] text-text/30 uppercase font-black tracking-widest">{order.clientUsername} // {order.outfitType}</p>
                     </div>
                     <span className="text-xl font-serif text-gold italic">₦{(order.price || 0).toLocaleString()}</span>
                  </div>
                  <div className="pt-4 border-t border-text/5 flex gap-4 text-[9px] uppercase font-black tracking-widest text-text/20">
                     <span>{order.fabric}</span>
                     <span>//</span>
                     <span>{order.deadline || 'NO DATE'}</span>
                  </div>
               </div>

               {/* Terms & Conditions Acknowledgement */}
               <div className="space-y-4 pt-4 border-t border-text/5">
                  <button 
                    onClick={() => setShowTerms(true)}
                    className="flex items-center gap-2 text-gold/60 hover:text-gold transition-colors"
                  >
                    <Info className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-black tracking-widest underline decoration-gold/30">View Terms & Conditions</span>
                  </button>
                  
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <div className={`mt-1 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${acceptedTerms ? 'bg-gold border-gold' : 'border-text/10 group-hover:border-gold/30'}`} onClick={() => setAcceptedTerms(!acceptedTerms)}>
                       {acceptedTerms && <Check className="w-3 h-3 text-navy" />}
                    </div>
                    <p className="text-[10px] text-text/40 italic leading-relaxed select-none">
                      I have reviewed the sovereign fabrication protocols and agree to the <span className="text-gold/60">House of Daraja Terms of Excellence</span>.
                    </p>
                  </label>
               </div>
            </div>

            {/* Terms Modal Overlay */}
            <AnimatePresence>
               {showTerms && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-navy/95 backdrop-blur-3xl overflow-y-auto p-8"
                  >
                     <div className="max-w-2xl mx-auto space-y-12 py-12">
                        <header className="flex justify-between items-center border-b border-text/5 pb-8">
                           <h2 className="text-4xl font-serif italic text-text">Terms of <span className="text-gold">Excellence</span></h2>
                           <button onClick={() => setShowTerms(false)} className="p-4 bg-text/5 rounded-full hover:bg-gold hover:text-navy transition-all">
                              <ChevronLeft className="w-5 h-5" />
                           </button>
                        </header>
                        
                        <div className="space-y-12">
                           {TERMS_AND_CONDITIONS.map((section, idx) => (
                              <div key={idx} className="space-y-4">
                                 <h3 className="text-lg font-serif text-gold italic">{section.title}</h3>
                                 <p className="text-sm text-white/60 leading-relaxed font-light">{section.content}</p>
                              </div>
                           ))}
                        </div>

                        <button 
                          onClick={() => { setAcceptedTerms(true); setShowTerms(false); }}
                          className="luxury-button w-full !py-6"
                        >
                          Acknowledge Protocols
                        </button>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>
          </motion.div>
        );
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-navy pb-32"
    >
      <header className="p-8 pt-12 flex justify-between items-center bg-navy/80 backdrop-blur-xl sticky top-0 z-40 border-b border-text/5 overflow-x-auto no-scrollbar">
         <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="p-3 bg-text/5 rounded-full border border-text/10 text-text/40 hover:text-text transition-all shrink-0">
           <ChevronLeft className="w-5 h-5" />
         </button>
         
         <div className="flex gap-4 px-8">
            {[1, 2, 3, 4].map(s => (
               <div key={s} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${
                    step === s ? 'bg-gold text-navy scale-110' : 
                    step > s ? 'bg-text/10 text-gold' : 
                    'bg-text/5 text-text/20'
                  }`}>
                    {step > s ? <Check className="w-4 h-4" /> : s}
                  </div>
                  {s < 4 && <div className={`w-4 h-[1px] ${step > s ? 'bg-gold' : 'bg-text/5'}`}></div>}
               </div>
            ))}
         </div>

         <div className="w-12 h-12"></div>
      </header>

      <main className="p-8 pb-32">
         {renderStep()}
      </main>

      <div className="fixed bottom-12 inset-x-8 z-50">
         {step < 4 ? (
           <button 
             onClick={() => setStep(step + 1)}
             className="luxury-button w-full !py-6 group"
           >
             Proceed To Archive
             <ChevronRight className="w-5 h-5 inline-block ml-2 group-hover:translate-x-1 transition-transform" />
           </button>
         ) : (
           <button 
             onClick={handleSubmit}
             disabled={isSubmitting || !acceptedTerms}
             className="luxury-button w-full !py-6 group bg-gold text-navy shadow-[0_20px_50px_rgba(212,175,55,0.3)] disabled:opacity-30 disabled:grayscale transition-all"
           >
             {isSubmitting ? (
               <div className="flex items-center gap-2">
                 <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin"></div>
                 Synchronizing...
               </div>
             ) : 'Execute Fabrication'}
           </button>
         )}
      </div>
    </motion.div>
  );
}
