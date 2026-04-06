import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api-client';
import {
  Sparkles,
  Calendar,
  Dumbbell,
  Trophy,
  ChevronRight,
  Bot,
  Loader2,
  Star,
} from 'lucide-react';
import { motion } from 'framer-motion';

const TYPE_CONFIG: Record<string, { icon: any; color: string; route: string }> = {
  CLASS: { icon: Calendar, color: 'text-primary-light bg-primary/10', route: '/classes' },
  GYM: { icon: Dumbbell, color: 'text-secondary-light bg-secondary/10', route: '/gyms' },
  EVENT: { icon: Trophy, color: 'text-yellow-400 bg-yellow-500/10', route: '/events' },
  PROFESSIONAL: { icon: Star, color: 'text-green-400 bg-green-500/10', route: '/professionals' },
};

const RecommendationsPanel: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/recommendations')
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-8 flex flex-col items-center justify-center gap-3 min-h-[200px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-slate-400 text-sm">Analizando tus preferencias...</p>
      </div>
    );
  }

  if (!data || data.recommendations.length === 0) return null;

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-light" />
          Recomendado para Ti
        </h2>
        <span className={`text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 ${data.aiEnabled ? 'bg-primary/20 text-primary-light border border-primary/30' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
          <Bot className="w-3 h-3" />
          {data.aiEnabled ? 'Gemini AI' : 'IA Interna'}
        </span>
      </div>

      {/* AI Message */}
      {data.aiMessage && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl p-4 flex items-start gap-3"
        >
          <div className="bg-primary/20 p-2 rounded-xl flex-shrink-0">
            <Bot className="w-5 h-5 text-primary-light" />
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{data.aiMessage}</p>
        </motion.div>
      )}

      {/* Insights */}
      {data.insights && data.insights.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.insights.map((insight: string, i: number) => (
            <span key={i} className="text-xs bg-white/5 border border-white/10 text-slate-400 px-3 py-1.5 rounded-full">
              {insight}
            </span>
          ))}
        </div>
      )}

      {/* Recommendation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.recommendations.slice(0, 6).map((rec: any, i: number) => {
          const config = TYPE_CONFIG[rec.type] || TYPE_CONFIG.CLASS;
          const Icon = config.icon;
          return (
            <motion.button
              key={rec.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ x: 3 }}
              onClick={() => navigate(config.route)}
              className="glass-card p-4 flex items-center gap-3 border-white/5 hover:border-primary/30 transition-all text-left group"
            >
              <div className={`p-2.5 rounded-xl flex-shrink-0 ${config.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-white font-bold text-sm truncate group-hover:text-primary-light transition-colors">
                  {rec.title}
                </p>
                <p className="text-slate-500 text-xs truncate">{rec.subtitle}</p>
                <p className="text-slate-600 text-[10px] mt-0.5 truncate">{rec.reason}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-primary-light transition-colors flex-shrink-0" />
            </motion.button>
          );
        })}
      </div>
    </section>
  );
};

export default RecommendationsPanel;
