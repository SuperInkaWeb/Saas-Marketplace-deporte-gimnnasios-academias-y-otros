import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Flame, MapPin } from 'lucide-react';
import { LEAGUE_CAMPAIGN } from './leagueCampaign';

interface LeagueHeroProps {
  onJoin: (district: string) => void;
}

// Banner principal de HERCIX League: reemplaza el hero de la landing mientras dure la campaña.
const LeagueHero: React.FC<LeagueHeroProps> = ({ onJoin }) => {
  const [district, setDistrict] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onJoin(district);
  };

  const scrollToStages = () => {
    document.getElementById('hercix-league')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section aria-labelledby="league-title" className="w-full flex flex-col items-center">
      {/* Badge del circuito */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/40 px-4 py-1.5 rounded-full text-[11px] md:text-xs font-bold tracking-wider text-red-400 mb-8 text-center"
      >
        <Flame className="w-3.5 h-3.5 flex-shrink-0 text-orange-400" />
        {LEAGUE_CAMPAIGN.badge}
      </motion.div>

      {/* Titular */}
      <motion.h1
        id="league-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-4xl sm:text-5xl md:text-7xl font-black text-center tracking-tight leading-[1.05] max-w-4xl"
      >
        {LEAGUE_CAMPAIGN.title}
        <br />
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
          {LEAGUE_CAMPAIGN.highlight}
        </span>
      </motion.h1>

      {/* Bajada */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-slate-300 text-base md:text-lg text-center max-w-3xl mt-6 leading-relaxed"
      >
        {LEAGUE_CAMPAIGN.subtitle.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </motion.div>

      {/* Selector de distrito + CTA */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        onSubmit={handleSubmit}
        className="w-full max-w-2xl mt-10 bg-background-darker/70 border border-white/10 hover:border-white/20 p-2 rounded-2xl md:rounded-full flex flex-col md:flex-row gap-2 shadow-2xl backdrop-blur-lg"
      >
        <label className="flex-1 flex items-center gap-3 px-4 py-2">
          <MapPin className="text-slate-400 w-5 h-5 flex-shrink-0" />
          <span className="sr-only">Elige tu distrito</span>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-slate-200 text-sm md:text-base cursor-pointer"
          >
            <option value="" className="bg-background-default">
              Elige tu distrito: {LEAGUE_CAMPAIGN.districts.join(', ')}...
            </option>
            {LEAGUE_CAMPAIGN.districts.map((d) => (
              <option key={d} value={d} className="bg-background-default">
                {d}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="bg-white text-black hover:bg-slate-200 px-7 py-3.5 rounded-xl md:rounded-full font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all duration-200 whitespace-nowrap"
        >
          {LEAGUE_CAMPAIGN.ctaLabel}
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.form>

      {/* Hashtags del circuito */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="flex flex-wrap items-center justify-center gap-3 mt-6 max-w-2xl text-xs md:text-sm font-semibold text-slate-400"
      >
        {LEAGUE_CAMPAIGN.tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={scrollToStages}
            className="px-3.5 py-1 rounded-full border border-white/10 hover:border-white/20 hover:text-white bg-white/[0.03] transition-all"
          >
            {tag}
          </button>
        ))}
      </motion.div>
    </section>
  );
};

export default LeagueHero;
