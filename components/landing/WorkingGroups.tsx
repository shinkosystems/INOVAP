import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { GT } from '../../types';
import { Leaf, Cpu, HeartPulse, Building2, Lightbulb, Zap } from 'lucide-react';

export const WorkingGroups: React.FC = () => {
  const [gts, setGts] = useState<GT[]>([]);
  const [loading, setLoading] = useState(true);

  const fallbackGTs = [
    { id: 1, gt: "Agronegócio" },
    { id: 2, gt: "Cidades Inteligentes" },
    { id: 3, gt: "Saúde e Bem-estar" },
    { id: 4, gt: "Indústria 4.0" },
    { id: 5, gt: "Energias Renováveis" },
    { id: 6, gt: "Educação Empreendedora" },
  ];

  useEffect(() => {
    async function fetchGTs() {
      try {
        const { data, error } = await supabase.from('gts').select('*');
        if (error) throw error;
        if (data && data.length > 0) {
          setGts(data);
        } else {
          setGts(fallbackGTs);
        }
      } catch (e) {
        setGts(fallbackGTs);
      } finally {
        setLoading(false);
      }
    }
    fetchGTs();
  }, []);

  const getIcon = (index: number) => {
    const icons = [Leaf, Building2, HeartPulse, Cpu, Zap, Lightbulb];
    const IconComponent = icons[index % icons.length];
    return <IconComponent size={24} />;
  };

  return (
    <div id="gts" className="py-24 bg-white dark:bg-brand-black relative overflow-hidden transition-colors duration-500">
      <div className="absolute right-[-10%] top-1/4 w-[600px] h-[600px] bg-brand-green/[0.03] dark:bg-brand-green/[0.03] rounded-full blur-[120px]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">Grupos de Trabalho</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
              Equipes multidisciplinares focadas em verticais estratégicas para transformar o Alto Paraopeba.
            </p>
          </div>
          <button className="hidden md:flex px-8 py-3.5 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-all items-center gap-2 text-sm uppercase tracking-widest">
            Explorar Ecossistema
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-24 gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-brand-neon/10 border-t-brand-neon animate-spin"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Carregando Verticais</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {gts.map((gt, index) => (
              <div key={gt.id} className="group relative p-10 rounded-5xl bg-slate-50/50 dark:bg-brand-surface/20 transition-all duration-500 hover:bg-slate-100 dark:hover:bg-brand-elevated overflow-hidden">

                {/* Subtle reactive background highlight */}
                <div className="absolute inset-0 bg-brand-neon opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700"></div>

                <div className="w-12 h-12 bg-white dark:bg-white/[0.05] rounded-2xl flex items-center justify-center text-brand-green dark:text-brand-neon mb-8 transition-all duration-500 group-hover:scale-110 group-hover:bg-brand-neon group-hover:text-black">
                  {getIcon(index)}
                </div>

                <h3 className="text-xl font-black text-slate-800 dark:text-slate-200 mb-4 tracking-tight group-hover:text-brand-neon transition-colors">{gt.gt}</h3>
                <p className="text-slate-500 dark:text-slate-500 text-sm mb-8 leading-relaxed font-medium">
                  {gt.descricao || `Atuação estratégica conectando atores chave na área de ${gt.gt.toLowerCase()}.`}
                </p>

                <div className="pt-8 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Inovação</span>
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Ativa no território</span>
                  </div>
                  <Zap size={16} className="text-brand-neon" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};