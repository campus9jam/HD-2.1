import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrainCircuit, X, Zap, Activity, Info, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  artifactName: string;
}

export const LinguisticAnalysisModal: React.FC<Props> = ({ isOpen, onClose, artifactName }) => {
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysis('');
    
    try {
      const prompt = `Provide a high-fidelity cultural and linguistic analysis of the artifact: "${artifactName}". 
      Focus on Sahelian heritage, artisanal technicality, and its "Sovereign Worth". Use an elite, archival tone.`;
      
      const res = await fetch('/api/neural/reasoning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: "google/gemma-4-31b-it:free" })
      });

      if (!res.ok) throw new Error("Neural Node Desync");

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let finished = false;

      while (!finished) {
        const { value, done } = await reader.read();
        finished = done;
        if (value) {
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
               const dataStr = line.slice(6).trim();
               if (dataStr === '[DONE]') break;
               try {
                  const data = JSON.parse(dataStr);
                  if (data.content) setAnalysis(prev => prev + data.content);
               } catch (e) {
                  // Silent catch for partial chunks
               }
            }
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-navy/80 backdrop-blur-3xl"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-2xl bg-surface/60 border border-gold/20 rounded-[3rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] flex flex-col max-h-[80vh]"
          >
            <header className="p-8 border-b border-text/5 flex justify-between items-center bg-gold/5">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center border border-gold/20">
                     <BrainCircuit className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                     <h3 className="text-xl font-serif italic pb-0.5">Heritage Intel Node</h3>
                     <p className="text-[8px] uppercase font-black tracking-[0.4em] text-gold/60">Protocol: Linguistic Analysis</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-4 hover:bg-text/5 rounded-full text-text/40 transition-colors">
                  <X className="w-5 h-5" />
               </button>
            </header>

            <div className="flex-1 overflow-y-auto p-12 space-y-12 no-scrollbar">
               <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text/30">Target Artifact</p>
                  <h4 className="text-4xl font-serif italic text-gold">{artifactName}</h4>
               </div>

               <div className="space-y-6">
                  {analysis ? (
                    <div className="font-serif italic text-lg leading-relaxed text-text/90 whitespace-pre-wrap py-4 border-l-2 border-gold/20 pl-8">
                       {analysis}
                    </div>
                  ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-6 opacity-20">
                       <Sparkles className="w-12 h-12" />
                       <p className="text-sm tracking-widest uppercase font-black">Archive ledger awaiting query...</p>
                    </div>
                  )}
               </div>
            </div>

            <footer className="p-8 border-t border-text/5 bg-navy/40">
               {!analysis && !isAnalyzing && (
                 <button 
                   onClick={startAnalysis}
                   className="w-full py-5 bg-gold text-navy rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-xl flex items-center justify-center gap-4"
                 >
                    <Zap className="w-4 h-4" /> INITIATE NEURAL SCAN
                 </button>
               )}
               {isAnalyzing && (
                 <div className="w-full py-5 bg-text/5 rounded-2xl flex items-center justify-center gap-4">
                    <Activity className="w-4 h-4 animate-spin text-gold" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold animate-pulse">Scanning Archive Nodes...</span>
                 </div>
               )}
               {analysis && !isAnalyzing && (
                 <button 
                   onClick={onClose}
                   className="w-full py-5 border border-gold/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-gold"
                 >
                    DISMISS SIGNAL
                 </button>
               )}
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
