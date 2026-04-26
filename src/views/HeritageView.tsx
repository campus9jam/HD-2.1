import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { Sparkles, Send, History, Scroll, ShieldCheck, ArrowRight } from 'lucide-react';

export default function HeritageView() {
  const [inquiry, setInquiry] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAskSage = async () => {
    if (!inquiry.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/heritage/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiry })
      });
      const data = await res.json();
      setResponse(data.text || "The archives are silent on this matter.");
    } catch (e) {
      setResponse("Provenance sync failure.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-32 px-6 max-w-7xl mx-auto space-y-24">
      {/* Editorial Header */}
      <header className="pt-24 space-y-12">
        <div className="flex items-center gap-4 text-gold border-b border-gold/20 pb-4 w-fit">
          <Scroll className="w-5 h-5" />
          <span className="text-micro italic">Restricted_Archives_V.8</span>
        </div>
        <h1 className="text-display leading-[0.8] max-w-4xl">The <span className="italic">Provenance</span> of Power.</h1>
        <p className="text-2xl font-serif text-text/40 italic max-w-2xl leading-relaxed">
          Every thread in the House of Daraja is an immutable record of 500 years of royal heritage. We do not just curate; we preserve sovereignty.
        </p>
      </header>

      {/* Heritage Sage AI */}
      <section className="luxury-card p-12 lg:p-20 bg-gold/[0.02] border-gold/20 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gold/5 blur-[120px]"></div>
        <div className="max-w-4xl mx-auto space-y-12 relative z-10">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-gold/10 rounded-full border border-gold/20">
              <Sparkles className="w-8 h-8 text-gold" />
            </div>
            <div>
              <h2 className="text-3xl font-serif text-text italic">Heritage Sage.</h2>
              <p className="text-micro mt-1">AI_Archive_Inference_Loop</p>
            </div>
          </div>

          <div className="space-y-8">
            <h3 className="text-xl font-serif text-text/60 italic leading-relaxed">
              "Inquire of the elders. Our textiles are maps of the empire."
            </h3>
            <div className="flex gap-4">
              <input 
                value={inquiry}
                onChange={(e) => setInquiry(e.target.value)}
                placeholder="Ask about the Indigo Dye Pits or 14th Cent. Brocade..."
                className="flex-grow bg-bg border border-text/5 rounded-2xl px-8 py-6 text-text focus:border-gold outline-none italic font-serif"
              />
              <button onClick={handleAskSage} disabled={isLoading} className="bg-gold text-navy px-12 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-text transition-all">
                {isLoading ? 'SYNCING...' : 'Ask Sage'}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {response && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-12 bg-navy/50 rounded-3xl border border-gold/10 relative group">
                <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-100 transition-opacity">
                   <History className="w-5 h-5 text-gold" />
                </div>
                <p className="text-xl lg:text-3xl font-serif text-text leading-relaxed italic pr-12">
                  "{response}"
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Archive Grid (Visual Storytelling) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-12">
           <div className="luxury-card aspect-[4/5] bg-surface relative group">
              <img src="https://picsum.photos/seed/indigo/800/1000" alt="dye pits" className="w-full h-full object-cover grayscale opacity-40 group-hover:opacity-100 transition-all duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-bg to-transparent opacity-80"></div>
              <div className="absolute bottom-12 left-12 space-y-4">
                 <span className="status-badge border-gold text-gold">Archived 1524</span>
                 <h3 className="text-4xl font-serif text-text italic">The Indigo <br/> Alchemists.</h3>
              </div>
           </div>
           <div className="p-12 luxury-card bg-surface/30 space-y-6">
              <h4 className="text-micro">Provenance Report</h4>
              <p className="text-body italic">
                Our indigo vats in Kano have been continuously active since the 14th century, using symbiotic fermentation processes guarded by hereditary guilds.
              </p>
              <ArrowRight className="w-6 h-6 text-gold" />
           </div>
        </div>

        <div className="lg:pt-32 space-y-12">
           <div className="p-12 luxury-card bg-surface/30 space-y-6">
              <h4 className="text-micro">Royal Protocol</h4>
              <p className="text-body italic">
                The hand-loomed brocade patterns signify genealogical status. To wear Daraja is to communicate your place in the sovereign history of the Sahel.
              </p>
              <ArrowRight className="w-6 h-6 text-gold" />
           </div>
           <div className="luxury-card aspect-[4/5] bg-surface relative group">
              <img src="https://picsum.photos/seed/royal/800/1000" alt="royal robe" className="w-full h-full object-cover grayscale opacity-40 group-hover:opacity-100 transition-all duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-bg to-transparent opacity-80"></div>
              <div className="absolute bottom-12 left-12 space-y-4">
                 <span className="status-badge border-text/20 text-text/40">Verified Artifact</span>
                 <h3 className="text-4xl font-serif text-text italic">The Emir's <br/> Loom.</h3>
              </div>
           </div>
        </div>
      </section>
    </motion.div>
  );
}
