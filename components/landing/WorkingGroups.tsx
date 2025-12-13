import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { GT } from '../../types';
import { Briefcase, Leaf, Cpu, HeartPulse, Building2, Lightbulb } from 'lucide-react';

export const WorkingGroups: React.FC = () => {
  const [gts, setGts] = useState<GT[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback data
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
    const icons = [Leaf, Building2, HeartPulse, Cpu, ZapIcon, Lightbulb];
    const IconComponent = icons[index % icons.length];
    return <IconComponent size={24} />;
  };

  const ZapIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
  );

  return (
    <div id="gts" className="py-24 bg-brand-black relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute right-0 top-1/3 w-[500px] h-[500px] bg-brand-green/5 rounded-full blur-[100px]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Grupos de Trabalho</h2>
            <p className="text-lg text-slate-400 max-w-xl">
              Equipes multidisciplinares focadas em verticais estratégicas.
            </p>
          </div>
          <button className="hidden md:block px-6 py-3 rounded-2xl border border-white/20 text-white hover:bg-white/10 transition-colors backdrop-blur-sm">
             Ver todos os grupos
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-neon"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gts.map((gt, index) => (
              <div key={gt.id} className="group relative p-8 rounded-3xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] hover:border-brand-green/30 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1">
                
                <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="w-20 h-20 bg-brand-neon/20 blur-2xl rounded-full"></div>
                </div>

                <div className="w-16 h-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-brand-neon mb-6 group-hover:bg-brand-neon group-hover:text-black transition-colors shadow-lg">
                  {getIcon(index)}
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3">{gt.gt}</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  Focado em desenvolver soluções e conectar atores chave na área de {gt.gt.toLowerCase()}.
                </p>
                
                <div className="w-full h-px bg-white/10 mb-6 group-hover:bg-brand-green/30 transition-colors"></div>
                
                <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-slate-500">12 PROJETOS</span>
                    <button className="text-white text-sm font-medium flex items-center gap-2 group-hover:text-brand-neon transition-colors">
                    Acessar <span className="text-lg">→</span>
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-8 md:hidden text-center">
            <button className="px-6 py-3 rounded-2xl border border-white/20 text-white w-full">Ver todos os grupos</button>
        </div>
      </div>
    </div>
  );
};