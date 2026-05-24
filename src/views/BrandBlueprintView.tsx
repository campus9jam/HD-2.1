import { Download } from 'lucide-react';

const audience = [
  'Affluent Gen Z and Millennial African fashion buyers in diaspora and major African cities.',
  'Luxury-conscious collectors looking for exclusive drops, heritage storytelling, and status signaling.',
  'Marketplace vendors who need premium storefront positioning with trust and curation.',
];

const screens = [
  { title: 'Home (Luxury Feed)', split: 'Top 38% hero / Bottom 62% commerce feed', focus: 'Editorial story first, products second.' },
  { title: 'Product Detail', split: 'Top 62% image / Bottom 38% buy actions', focus: 'Conversion with premium visual dominance.' },
  { title: 'Marketplace', split: '62/38 editorial card grid', focus: 'Featured product authority with supporting cards.' },
  { title: 'Drop Page', split: '62% urgency visual / 38% CTA + info', focus: 'Countdown-driven scarcity and action.' },
  { title: 'Profile', split: 'Top 38% identity / Bottom 62% activity', focus: 'Status, rewards, and retention loops.' },
];

const pipeline = [
  'Input content saved in Firestore',
  'Cloud Function trigger translates with luxury tone prompt',
  'Glossary lock and guardrail checks apply',
  'Confidence score gates low-quality copy with fallback to English',
  'Client renders selected language with RTL handling for Arabic',
];

const routeMap = [
  ['/', 'HomeView', 'Hero carousel + luxury feed'],
  ['/marketplace', 'MarketplaceView', 'Vendor marketplace'],
  ['/shop', 'ShopView', 'Curated internal storefront'],
  ['/product/:id', 'ProductDetailView', 'Conversion-focused detail'],
  ['/drops', 'DropView', 'Scarcity events and countdowns'],
  ['/heritage', 'HeritageView', 'Archive-rich storytelling'],
  ['/community', 'CommunityView', 'YouTube media archive bridge'],
  ['/profile', 'ProfileView', 'Identity, tier, and rewards'],
  ['/wallet', 'WalletView', 'Wallet + transaction ledger'],
  ['/vendor/dashboard', 'VendorDashboardView', 'Vendor metrics'],
  ['/admin/dashboard', 'AdminDashboardView', 'Moderation and controls'],
  ['/atelier', 'AtelierPortalView', 'Personal tailoring entry point'],
  ['/atelier/order', 'AtelierOrderWizardView', 'Measurement flow'],
  ['/atelier/admin', 'AtelierAdminView', 'Production status tracking'],
  ['/neural', 'LinguisticNodeView', 'AI translation + reasoning UI'],
];

const techStack = [
  'Frontend: React 18 + Vite SPA + TypeScript',
  'Backend: Node.js + Express API server',
  'Styling: Tailwind CSS v4 + motion animations',
  'Routing: react-router-dom with HashRouter',
  'Data/Auth: Firebase + Firestore',
  'Offline cache: Dexie / dexie-react-hooks',
  'AI: OpenRouter + Google GenAI adapters',
  'Media bridge: rss-parser for YouTube RSS proxy',
];

const imageRefs = [
  'https://i.imgur.com/7QFYTZJ.png',
  'https://i.imgur.com/MA123T4.png',
  'https://i.imgur.com/S4l7lKP.png',
  'https://i.imgur.com/jNv9WE7.png',
  'https://i.imgur.com/2Xkwv9Y.png',
  'https://i.imgur.com/Fy9UYJ4.png',
];

const buildPdf = async () => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  let y = 16;

  const addTitle = (text: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(text, 14, y);
    y += 8;
  };

  const addBody = (text: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const wrapped = doc.splitTextToSize(text, 180);
    doc.text(wrapped, 14, y);
    y += wrapped.length * 6 + 2;

    if (y > 270) {
      doc.addPage();
      y = 16;
    }
  };

  addTitle('House of Daraja Product Blueprint');
  addBody('From target audience to UI wireframe structure, this blueprint defines a luxury-first app architecture that uses golden ratio hierarchy and automated multilingual scalability.');

  addTitle('Target Audience');
  audience.forEach((item) => addBody(`• ${item}`));

  addTitle('Brand + UX Principles');
  addBody('Golden ratio (1:1.618) governs hierarchy: 62% primary focus, 38% support zone. Gold is used as a controlled accent (~38%) against black/white neutral foundations (~62%).');

  addTitle('UI Wireframe Structure');
  screens.forEach((screen) => addBody(`• ${screen.title}: ${screen.split}. ${screen.focus}`));

  addTitle('Multilingual Automation Model');
  pipeline.forEach((step, i) => addBody(`${i + 1}. ${step}`));

  addTitle('Implementation Stack');
  techStack.forEach((item) => addBody(`• ${item}`));
  addTitle('Application Route Structure');
  routeMap.forEach(([path, view, purpose]) => addBody(`• ${path} → ${view}: ${purpose}`));
  addTitle('Embedded Visual References');
  imageRefs.forEach((src) => addBody(`• ${src}`));

  doc.save('house-of-daraja-blueprint.pdf');
};

export default function BrandBlueprintView() {
  return (
    <main className="min-h-full bg-navy text-text p-4 md:p-8 pb-28">
      <div className="max-w-5xl mx-auto space-y-8">
        <section className="rounded-3xl border border-gold/25 bg-black/30 p-6 md:p-8">
          <p className="text-[10px] tracking-[0.45em] uppercase text-gold/70">House of Daraja</p>
          <h1 className="text-3xl md:text-5xl font-serif mt-3">Product Blueprint</h1>
          <p className="mt-4 text-text/80 max-w-3xl">Luxury commerce system with golden-ratio wireframing, drop mechanics, marketplace curation, and fully automated multilingual infrastructure.</p>
          <button
            onClick={buildPdf}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gold text-black font-bold px-5 py-3 hover:brightness-110 transition"
          >
            <Download className="w-4 h-4" />
            Download Blueprint PDF
          </button>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold text-gold mb-3">Target Audience</h2>
            <ul className="space-y-3 list-disc ml-6 text-text/85">
              {audience.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold text-gold mb-3">Global Layout System</h2>
            <ul className="space-y-3 list-disc ml-6 text-text/85">
              <li>8pt spacing grid with 62/38 visual hierarchy.</li>
              <li>Home and Profile: top 38% context + bottom 62% utility/activity.</li>
              <li>Product and Drop: top 62% immersive media + bottom 38% conversion actions.</li>
              <li>Bottom nav center slot (HD) sized at 1.618x for brand dominance.</li>
            </ul>
          </article>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold text-gold mb-4">UI Wireframe Structure</h2>
          <div className="space-y-4">
            {screens.map((screen) => (
              <div key={screen.title} className="border border-gold/20 rounded-xl p-4 bg-black/30">
                <h3 className="text-lg font-semibold">{screen.title}</h3>
                <p className="text-text/80">Split: {screen.split}</p>
                <p className="text-text/90">Focus: {screen.focus}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold text-gold mb-4">Full App Route Blueprint</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gold/20 text-gold">
                  <th className="py-2 pr-4">Route</th>
                  <th className="py-2 pr-4">View</th>
                  <th className="py-2">Purpose</th>
                </tr>
              </thead>
              <tbody>
                {routeMap.map(([path, view, purpose]) => (
                  <tr key={path} className="border-b border-white/10">
                    <td className="py-2 pr-4 font-mono text-xs">{path}</td>
                    <td className="py-2 pr-4">{view}</td>
                    <td className="py-2 text-text/80">{purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-semibold text-gold mb-4">Technology Stack</h2>
            <ul className="space-y-2 list-disc ml-6 text-text/85">
              {techStack.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-semibold text-gold mb-4">Embedded Image References</h2>
            <ul className="space-y-2 text-text/85">
              {imageRefs.map((src) => (
                <li key={src} className="break-all text-xs md:text-sm">{src}</li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}
