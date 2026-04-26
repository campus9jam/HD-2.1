import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrainCircuit, Cpu, Zap, Activity, Info, ChevronRight, Hash, Database, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function LinguisticNodeView() {
  const [prompt, setPrompt] = useState("How many r's are in the word 'strawberry'?");
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [reasoningTokens, setReasoningTokens] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState("google/gemma-4-31b-it:free");
  const [showModelSelect, setShowModelSelect] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const MODELS = [
    { id: "google/gemma-4-31b-it:free", name: "Gemma 4 31B (Reasoning)", desc: "Advanced cognitive logic & heritage linguistics" },
    { id: "meta-llama/llama-3.1-70b-instruct:free", name: "Llama 3.1 70B", desc: "High-status general intelligence" },
    { id: "mistralai/mistral-7b-instruct:free", name: "Mistral 7B", desc: "Efficient & witty conversationalist" },
    { id: "microsoft/phi-3-mini-128k-instruct:free", name: "Phi-3 Mini", desc: "Fast & lightweight archival inference" }
  ];

  const startReasoning = async () => {
    if (!prompt.trim()) return;
    
    setResponse('');
    setReasoningTokens(null);
    setIsStreaming(true);

    try {
      const res = await fetch('/api/neural/reasoning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: selectedModel })
      });

      if (!res.ok) throw new Error("Connection to Neural Node lost.");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Stream reader not available.");

      const decoder = new TextDecoder();
      let finished = false;

      while (!finished) {
        const { value, done } = await reader.read();
        finished = done;
        
        if (value) {
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            
            if (trimmedLine.startsWith('data: ')) {
              const dataStr = trimmedLine.slice(6).trim();
              if (dataStr === '[DONE]') {
                finished = true;
                break;
              }
              
              try {
                const data = JSON.parse(dataStr);
                if (data.content) setResponse(prev => prev + data.content);
                if (data.usage?.reasoning_tokens) setReasoningTokens(data.usage.reasoning_tokens);
                // Some providers might use reasoningTokens or reasoning_tokens
                if (data.usage?.reasoningTokens) setReasoningTokens(data.usage.reasoningTokens);
                
                if (data.error) {
                  toast.error(data.error);
                  finished = true;
                }
              } catch (e) {
                // Ignore parsing errors for partial or malformed chunks
              }
            }
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-navy pt-8 pb-40 px-8 max-w-4xl mx-auto space-y-16"
    >
      <header className="flex flex-col md:flex-row justify-between items-end gap-10 pb-12 border-b border-text/5">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center border border-gold/20">
                <BrainCircuit className="w-5 h-5 text-gold" />
             </div>
             <div className="space-y-0.5">
                <h2 className="text-2xl font-serif text-text italic tracking-tight">Neural Linguistic Node</h2>
                <p className="text-[8px] uppercase font-black text-gold/60 tracking-[0.4em]">Protocol: Advanced Cognitive Reasoning</p>
             </div>
          </div>
          <p className="text-text/40 text-[10px] uppercase font-black tracking-widest leading-relaxed max-w-sm">
             Sovereign inference engine leveraging Gemma architecture for high-status cultural analysis.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-12 gap-12">
         {/* Controls */}
         <div className="md:col-span-5 space-y-10">
            <div className="space-y-6">
               <div className="flex justify-between items-center px-2">
                  <h3 className="text-[10px] uppercase font-black text-text/40 tracking-[0.2em] flex items-center gap-2">
                     <Cpu className="w-3 h-3" /> System Integration
                  </h3>
                  <div className="flex gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                     <span className="text-[8px] font-black uppercase text-green-500/60">Node Online</span>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="luxury-card p-6 space-y-4">
                     <label className="text-[10px] uppercase font-black text-text/30 tracking-widest block">Inference Prompt</label>
                     <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full bg-navy border border-text/5 rounded-xl p-4 text-sm text-text/80 font-light resize-none h-40 focus:border-gold/30 outline-none transition-colors"
                        placeholder="Define query protocol..."
                     />
                  </div>

                  <div className="relative">
                     <div 
                        onClick={() => setShowModelSelect(!showModelSelect)}
                        className="luxury-card p-6 flex justify-between items-center group cursor-pointer hover:bg-text/5 transition-colors border-gold/10"
                     >
                        <div className="flex items-center gap-4">
                           <Database className="w-4 h-4 text-gold/40" />
                           <div>
                              <p className="text-[10px] uppercase font-black text-text/30 tracking-widest">Neural Model</p>
                              <p className="text-xs text-text/70 font-mono mt-1">
                                 {MODELS.find(m => m.id === selectedModel)?.name || selectedModel}
                              </p>
                           </div>
                        </div>
                        <RefreshCw className={`w-3 h-3 text-text/10 group-hover:text-gold transition-all duration-500 ${showModelSelect ? 'rotate-180' : ''}`} />
                     </div>

                     <AnimatePresence>
                        {showModelSelect && (
                           <motion.div 
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute top-full left-0 right-0 mt-4 luxury-card p-4 bg-surface/95 backdrop-blur-3xl z-[60] space-y-2 border-gold/20"
                           >
                              {MODELS.map((m) => (
                                 <button
                                    key={m.id}
                                    onClick={() => {
                                       setSelectedModel(m.id);
                                       setShowModelSelect(false);
                                    }}
                                    className={`w-full text-left p-4 rounded-xl transition-all ${selectedModel === m.id ? 'bg-gold/10 border border-gold/20' : 'hover:bg-text/5'}`}
                                 >
                                    <p className="text-xs font-black uppercase tracking-widest text-text/90">{m.name}</p>
                                    <p className="text-[9px] text-text/30 mt-1 uppercase tracking-tight">{m.desc}</p>
                                 </button>
                              ))}
                           </motion.div>
                        )}
                     </AnimatePresence>
                  </div>
               </div>

               <button 
                  onClick={startReasoning}
                  disabled={isStreaming}
                  className="w-full h-16 bg-gold text-navy rounded-2xl font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_40px_rgba(var(--gold-rgb),0.2)] disabled:opacity-50 disabled:grayscale"
               >
                  {isStreaming ? (
                    <Activity className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-5 h-5" /> Initiate Reasoning
                    </>
                  )}
               </button>
            </div>

            {/* Metrics */}
            <div className="luxury-card p-8 space-y-8 bg-gold/5 border-gold/10">
               <h4 className="text-[10px] uppercase font-black text-gold/60 tracking-[0.4em] flex items-center gap-2">
                  <Hash className="w-3 h-3" /> Inference Usage
               </h4>
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <p className="text-2xl font-serif text-text italic">{reasoningTokens ?? '--'}</p>
                     <p className="text-[8px] uppercase font-black text-text/20 tracking-widest">Reasoning_Tokens</p>
                  </div>
                  <div className="space-y-2">
                     <p className="text-2xl font-serif text-text italic">0.0 ms</p>
                     <p className="text-[8px] uppercase font-black text-text/20 tracking-widest">Latency_Index</p>
                  </div>
               </div>
            </div>
         </div>

         {/* Output Display */}
         <div className="md:col-span-7 h-full">
            <div className="luxury-card h-full min-h-[600px] flex flex-col p-8 space-y-8 bg-surface/40 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <BrainCircuit className="w-64 h-64 -mr-20 -mt-20 group-hover:rotate-12 transition-transform duration-1000" />
               </div>
               
               <div className="flex justify-between items-center border-b border-text/5 pb-6">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-gold shadow-[0_0_10px_#D4AF37]"></div>
                     <span className="text-[10px] uppercase font-black text-text tracking-[0.4em]">Response Buffer</span>
                  </div>
               </div>

               <div className="flex-grow font-serif italic text-lg leading-relaxed text-text/90 space-y-6 max-h-[500px] overflow-y-auto no-scrollbar">
                  {response ? (
                    <div className="whitespace-pre-wrap">{response}</div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full opacity-20 space-y-4">
                       <Info className="w-12 h-12" />
                       <p className="text-sm tracking-widest">Awaiting Neural Signal...</p>
                    </div>
                  )}
                  {isStreaming && (
                    <motion.span 
                      animate={{ opacity: [0, 1] }} 
                      transition={{ repeat: Infinity, duration: 0.5 }} 
                      className="inline-block w-1 h-5 bg-gold align-middle ml-1"
                    />
                  )}
               </div>

               <div className="pt-6 border-t border-text/5 flex justify-between items-center">
                  <p className="text-[7px] uppercase font-black text-text/10 tracking-[0.3em]">Neural Verification: Active</p>
                  <div className="flex gap-4">
                     <div className="group/btn p-2 hover:text-gold transition-colors cursor-pointer">
                        <ChevronRight className="w-4 h-4" />
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>
    </motion.div>
  );
}
