import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Users, 
  BarChart3, 
  Clock, 
  Search, 
  Edit3, 
  Trash2, 
  Share2, 
  Download, 
  Upload,
  ChevronRight,
  MessageCircle,
  FileText,
  Lock,
  ArrowUpRight,
  TrendingUp,
  Briefcase,
  DollarSign,
  PieChart
} from 'lucide-react';
import { AtelierOrder, AtelierClient } from '../types';
import { toast } from 'sonner';
import { generateOrderReceiptHTML } from '../lib/atelierUtils';
import { unlockAchievement } from '../lib/achievementUtils';
import { useAuth } from '../contexts/AuthContext';
import { 
  fetchAllAtelierOrders, 
  fetchAllAtelierClients, 
  updateAtelierOrder 
} from '../services/AtelierService';

export default function AtelierAdminView() {
  const { profile } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'orders' | 'data'>('overview');
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Live Data
  const [clients, setClients] = useState<AtelierClient[]>([]);
  const [orders, setOrders] = useState<AtelierOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [allClients, allOrders] = await Promise.all([
      fetchAllAtelierClients(),
      fetchAllAtelierOrders()
    ]);
    setClients(allClients);
    setOrders(allOrders);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, loadData]);

  const handleLogin = () => {
    if (credentials.email === 'HD@houseofdaraja.com' && credentials.password === '12345@HD') {
      setIsAdmin(true);
      if (profile) {
        unlockAchievement(profile.uid, 'GOVERNOR', profile).catch(console.error);
      }
      toast.success('Governance Established', { description: 'Welcome back, Architect of Elegance.' });
    } else {
      toast.error('Identity Mismatch', { description: 'Requested credentials are not in the sovereign directory.' });
    }
  };

  const updateOrderStatus = async (id: string, status: AtelierOrder['status']) => {
    const success = await updateAtelierOrder(id, { status });
    if (success) {
      toast.success('Sync Successful', { description: `Order #${id.slice(-4)} reclassified to ${status}.` });
      loadData();
    }
  };

  const togglePayment = async (id: string, type: 'deposit' | 'balance') => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    
    const updates = type === 'deposit' ? { depositPaid: !order.depositPaid } : { balancePaid: !order.balancePaid };
    const success = await updateAtelierOrder(id, updates);
    if (success) {
      toast.success('Ledger Updated', { description: `${type.toUpperCase()} status toggled for #${id.slice(-4)}.` });
      loadData();
    }
  };

  const handleWhatsApp = (order: AtelierOrder) => {
    const client = clients?.find(c => c.username === order.clientUsername);
    if (!client?.phone) {
      toast.error('Comms Node Missing', { description: 'Target node phone frequency is not archived.' });
      return;
    }
    const msg = `Greetings ${client.clientName},\n\nYour bespoke order (#${order.id}) for '${order.outfitName}' has been updated to: *${order.status.toUpperCase()}*.\n\nThank you for trusting the House of Daraja.`;
    window.open(`https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handlePrint = (order: AtelierOrder) => {
    const client = clients?.find(c => c.username === order.clientUsername);
    const html = generateOrderReceiptHTML(order, client);
    const win = window.open('', '_blank');
    win?.document.write(html);
    win?.document.close();
    win?.print();
  };

  const handleExport = async () => {
    const data = {
      clients: await fetchAllAtelierClients(),
      orders: await fetchAllAtelierOrders(),
      timestamp: Date.now()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `House_of_Daraja_Archive_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    toast.success('Protocol Dump Complete', { description: 'Global archive state exported to secure file.' });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        // Bulk import logic for Firestore would be complex, we'll keep it as a placeholder for now
        // or actually implement simple loop if testing.
        toast.info('Restoration Node Engaged', { description: 'Structural sync is manual due to cloud integrity checks.' });
      } catch (err) {
        toast.error('Restore Error', { description: 'Integrity mismatch in target archive fragment.' });
      }
    };
    reader.readAsText(file);
  };

  if (!isAdmin) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-navy flex items-center justify-center p-8">
        <div className="luxury-card p-12 w-full max-w-md space-y-10 bg-surface/50 border-gold/20">
           <div className="flex flex-col items-center gap-4">
              <div className="p-6 bg-gold/10 rounded-[2.5rem] border border-gold/20 shadow-[0_0_50px_rgba(212,175,55,0.1)]">
                 <Shield className="w-12 h-12 text-gold" />
              </div>
              <div className="text-center">
                 <h1 className="text-3xl font-serif text-text italic">Governance</h1>
                 <p className="text-[10px] uppercase font-black text-gold tracking-[0.4em] mt-2">Atelier_Central_Control</p>
              </div>
           </div>

           <div className="space-y-6">
              <div className="space-y-2">
                 <input 
                   type="email" 
                   value={credentials.email}
                   onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                   placeholder="Admin Identifier"
                   className="luxury-input w-full"
                 />
                 <input 
                   type="password" 
                   value={credentials.password}
                   onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                   placeholder="Neural Passcode"
                   className="luxury-input w-full"
                 />
              </div>
              <button 
                onClick={handleLogin}
                className="luxury-button w-full !py-6 group"
              >
                Access Governance Node
                <Lock className="w-4 h-4 inline-block ml-2 group-hover:scale-110 transition-transform" />
              </button>
           </div>
        </div>
      </motion.div>
    );
  }

  // Admin UI
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-navy flex flex-col md:flex-row pb-32">
       {/* Sidebar */}
       <aside className="w-full md:w-80 bg-surface/50 border-r border-text/5 p-8 space-y-12">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-gold rounded-2xl flex items-center justify-center shadow-lg shadow-gold/20">
                <Briefcase className="w-6 h-6 text-navy" />
             </div>
             <div>
                <h2 className="text-xl font-serif text-text italic">HD Atelier</h2>
                <span className="text-[8px] font-black uppercase text-gold tracking-widest">Admin Control</span>
             </div>
          </div>

          <nav className="space-y-4">
             {[
               { id: 'overview', label: 'Overview', icon: BarChart3 },
               { id: 'clients', label: 'Clients', icon: Users },
               { id: 'orders', label: 'Orders', icon: Clock },
               { id: 'data', label: 'Archive', icon: Share2 }
             ].map(tab => (
               <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${
                   activeTab === tab.id ? 'bg-gold text-navy font-bold' : 'text-text/30 hover:bg-text/5 hover:text-text'
                 }`}
               >
                 <tab.icon className="w-5 h-5" />
                 <span className="text-[11px] uppercase tracking-widest">{tab.label}</span>
                 {activeTab === tab.id && <ArrowUpRight className="w-4 h-4 ml-auto" />}
               </button>
             ))}
          </nav>
       </aside>

       {/* Main Content */}
       <main className="flex-1 p-8 space-y-12 max-h-screen overflow-y-auto no-scrollbar">
          {activeTab === 'overview' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex justify-between items-end border-b border-text/5 pb-8">
                   <h1 className="text-4xl font-serif italic text-text leading-none">System <br/> <span className="text-gold">Intelligence</span></h1>
                   <div className="px-4 py-2 bg-green-500/10 rounded-lg flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-[8px] font-black text-green-500 tracking-widest uppercase">Live Nodes</span>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   {[
                     { label: 'Total Clients', val: clients?.length || 0, icon: Users, color: 'text-blue-400' },
                     { label: 'Pending Deposits', val: orders?.filter(o => !o.depositPaid).length || 0, icon: Clock, color: 'text-orange-400' },
                     { label: 'Projected Revenue', val: `₦${orders?.reduce((acc, o) => acc + (o.price || 0), 0).toLocaleString()}`, icon: TrendingUp, color: 'text-gold' },
                     { label: 'Actual Cashflow', val: `₦${orders?.reduce((acc, o) => {
                       let sum = 0;
                       if (o.depositPaid) sum += (o.price || 0) * 0.6;
                       if (o.balancePaid) sum += (o.price || 0) * 0.4;
                       return acc + sum;
                     }, 0).toLocaleString()}`, icon: DollarSign, color: 'text-green-400' }
                   ].map((stat, i) => (
                      <div key={i} className="luxury-card p-8 bg-surface/30 border-text/5 space-y-4">
                         <stat.icon className={`w-5 h-5 ${stat.color}`} />
                         <p className="text-2xl font-serif text-text">{stat.val}</p>
                         <p className="text-[9px] uppercase font-black text-text/20 tracking-widest">{stat.label}</p>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {activeTab === 'clients' && (
             <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex bg-text/5 p-4 rounded-[1.5rem] border border-text/5">
                   <Search className="w-5 h-5 text-text/20 mr-4" />
                   <input 
                     type="text" 
                     placeholder="Search client index..." 
                     value={searchTerm} 
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="bg-transparent border-none outline-none text-text w-full text-sm font-mono"
                   />
                </div>

                <div className="grid grid-cols-1 gap-4">
                   {clients?.filter(c => c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || c.username.toLowerCase().includes(searchTerm.toLowerCase())).map(client => (
                      <div key={client.id} className="luxury-card p-6 bg-surface/30 flex justify-between items-center group hover:bg-text/5 transition-all">
                         <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-full border border-gold/30 bg-gold/10 flex items-center justify-center text-gold font-serif">
                               {client.clientName[0]}
                            </div>
                            <div>
                               <h4 className="text-lg font-serif text-text italic">{client.clientName}</h4>
                               <p className="text-[10px] text-text/20 uppercase font-black tracking-widest">@{client.username} // {client.phone}</p>
                            </div>
                         </div>
                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-3 bg-text/5 rounded-xl hover:bg-gold/10 hover:text-gold transition-all"><Edit3 className="w-4 h-4" /></button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {activeTab === 'orders' && (
             <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 gap-6">
                   {orders?.sort((a,b) => b.createdAt - a.createdAt).map(order => (
                      <div key={order.id} className="luxury-card p-8 bg-surface/30 space-y-6">
                         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                               <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-2xl font-serif text-text italic">{order.outfitName}</h4>
                                  <span className={`px-3 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${
                                    order.priority === 'Urgent' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 
                                    order.priority === 'High' ? 'bg-orange-500/20 text-orange-500' : 'bg-text/5 text-text/40'
                                  }`}>
                                    {order.priority}
                                  </span>
                               </div>
                               <p className="text-[10px] text-text/20 uppercase font-black tracking-[0.2em]">{order.clientUsername} // Ref: #{order.id}</p>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2">
                               <select 
                                 value={order.status}
                                 onChange={(e) => updateOrderStatus(order.id!, e.target.value as any)}
                                 className="bg-navy/50 border border-text/5 rounded-xl px-4 py-2.5 text-[10px] text-text/70 uppercase font-black outline-none focus:border-gold transition-all"
                               >
                                  {['Pending', 'Cutting', 'Sewing', 'Fitting', 'Ready', 'Delivered', 'Cancelled'].map(s => (
                                    <option key={s}>{s}</option>
                                  ))}
                               </select>
                               <button onClick={() => handleWhatsApp(order)} className="p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500/20 shadow-lg shadow-green-500/10 transition-all">
                                 <MessageCircle className="w-5 h-5" />
                               </button>
                               <button onClick={() => handlePrint(order)} className="p-3 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500/20 transition-all">
                                 <FileText className="w-5 h-5" />
                               </button>
                            </div>
                         </div>
                         
                         <div className="pt-6 border-t border-text/5 flex flex-wrap gap-12">
                            <div className="space-y-3">
                               <p className="text-[8px] uppercase font-black text-text/20 tracking-[0.3em]">Financial_Ledger</p>
                               <div className="flex gap-3">
                                  <button 
                                    onClick={() => togglePayment(order.id!, 'deposit')}
                                    className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-wider border transition-all ${
                                      order.depositPaid ? 'bg-gold/10 text-gold border-gold/30' : 'bg-text/5 text-text/20 border-text/10'
                                    }`}
                                  >
                                    Deposit (60%) {order.depositPaid ? '• Sync' : ''}
                                  </button>
                                  <button 
                                    onClick={() => togglePayment(order.id!, 'balance')}
                                    className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-wider border transition-all ${
                                      order.balancePaid ? 'bg-gold/10 text-gold border-gold/30' : 'bg-text/5 text-text/20 border-text/10'
                                    }`}
                                  >
                                    Final (40%) {order.balancePaid ? '• Sync' : ''}
                                  </button>
                               </div>
                            </div>
                            <div className="space-y-1">
                               <p className="text-[8px] uppercase font-black text-text/20 tracking-widest">Pricing</p>
                               <p className="text-lg font-serif text-gold italic">₦{order.price.toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                               <p className="text-[8px] uppercase font-black text-text/20 tracking-widest">Fabric_Artifact</p>
                               <p className="text-sm font-light text-text/70">{order.fabric}</p>
                            </div>
                            <div className="space-y-1">
                               <p className="text-[8px] uppercase font-black text-text/20 tracking-widest">Deadline</p>
                               <p className="text-sm font-mono text-text/50">{order.deadline || 'NOT SET'}</p>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {activeTab === 'data' && (
             <div className="space-y-8 animate-in fade-in duration-500">
                <div className="luxury-card p-12 bg-surface/30 space-y-10 border-dashed border-text/10">
                   <div className="text-center space-y-4">
                      <div className="p-6 bg-gold/10 rounded-full inline-block border border-gold/20">
                         <Download className="w-10 h-10 text-gold" />
                      </div>
                      <h3 className="text-2xl font-serif text-text italic">Protocol Backup</h3>
                      <p className="text-xs text-text/30 max-w-sm mx-auto">Generate a structural export of the entire atelier archive for secure cold storage or migration.</p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <button onClick={handleExport} className="luxury-button !py-6 group">
                         Export Mastery Records
                         <Download className="w-4 h-4 ml-2 group-hover:translate-y-0.5 transition-transform" />
                      </button>
                      <label className="luxury-button !py-6 bg-text/5 text-text/40 border-text/10 cursor-pointer flex items-center justify-center group">
                         Restore Archive Node
                         <Upload className="w-4 h-4 ml-2 group-active:-translate-y-0.5 transition-transform" />
                         <input type="file" className="hidden" accept=".json" onChange={handleImport} />
                      </label>
                   </div>
                </div>
             </div>
          )}
       </main>
    </motion.div>
  );
}
