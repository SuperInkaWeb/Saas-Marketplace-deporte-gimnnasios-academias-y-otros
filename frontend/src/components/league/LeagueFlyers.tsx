import React from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { LEAGUE_CAMPAIGN, type LeagueStage, type LeagueStageTone } from './leagueCampaign';

const TONE_PILL: Record<LeagueStageTone, string> = {
  red: 'border-red-500/50 text-red-400 bg-red-500/10',
  blue: 'border-blue-500/50 text-blue-400 bg-blue-500/10',
  green: 'border-green-500/50 text-green-400 bg-green-500/10',
};

const MEDALS = ['🥇', '🥈', '🥉'];

interface LeagueFlyersProps {
  onCta: (path: string) => void;
}

const stageUrl = (stage: LeagueStage) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.hercix.com';
  return `${origin}${stage.cta.path}?ref=hercix-league&etapa=${stage.id}`;
};

const FlyerCard: React.FC<{ stage: LeagueStage; index: number; onCta: (path: string) => void }> = ({
  stage,
  index,
  onCta,
}) => (
  <motion.article
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    className="relative snap-center flex-shrink-0 w-[82%] sm:w-[46%] lg:w-auto min-h-[540px] rounded-3xl border border-white/10 overflow-hidden flex flex-col shadow-2xl"
  >
    {/* Fondo fotográfico + degradado para legibilidad */}
    <div
      className="absolute inset-0 bg-cover bg-center"
      style={{ backgroundImage: `url(${stage.image})` }}
      aria-hidden="true"
    />
    <div className="absolute inset-0 bg-gradient-to-b from-background-darker/60 via-background-darker/70 to-background-darker/95" aria-hidden="true" />

    <div className="relative flex flex-col flex-1 p-6">
      {/* Marca + etapa */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-lg font-black tracking-wide text-primary-light">HERCIX</span>
        <span className={`text-[10px] font-bold tracking-wider px-3 py-1 rounded-full border ${TONE_PILL[stage.tone]}`}>
          {stage.label}
        </span>
      </div>

      {/* Mensaje */}
      <div className="mt-auto pt-16">
        <h3 className="text-3xl font-black leading-tight tracking-tight">
          {stage.title}
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
            {stage.highlight}
          </span>
        </h3>
        {stage.kicker && <p className="mt-3 text-sm font-bold text-white">{stage.kicker}</p>}

        {stage.standings && stage.standings.length > 0 && (
          <ul className="mt-4 divide-y divide-white/10 text-sm">
            {stage.standings.map((s) => (
              <li key={s.position} className="flex items-center justify-between py-1.5">
                <span>
                  {MEDALS[s.position - 1] ?? ''} {s.position}. {s.gym}
                </span>
                <span className="font-bold">{s.points.toLocaleString('es-PE')} Pts</span>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-3 text-sm text-slate-300 leading-relaxed">{stage.description}</p>
      </div>

      {/* QR + llamado a la acción */}
      <button
        type="button"
        onClick={() => onCta(stage.cta.path)}
        className="mt-8 flex items-center gap-4 text-left bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-2xl p-3 transition-colors"
      >
        <span className="bg-white rounded-xl p-1.5 flex-shrink-0">
          <QRCodeSVG value={stageUrl(stage)} size={56} level="M" aria-label={`Código QR: ${stage.cta.title}`} />
        </span>
        <span>
          <span className="block text-sm font-bold text-white">{stage.cta.title}</span>
          <span className="block text-xs text-slate-400 mt-0.5">{stage.cta.subtitle}</span>
        </span>
      </button>
    </div>
  </motion.article>
);

// Flyers por etapa del circuito: carrusel deslizable en móvil y grilla de 3 columnas en escritorio.
const LeagueFlyers: React.FC<LeagueFlyersProps> = ({ onCta }) => (
  <section id="hercix-league" aria-labelledby="league-stages-title" className="w-full max-w-6xl mt-24 scroll-mt-24">
    <div className="text-center mb-10 px-2">
      <h2
        id="league-stages-title"
        className="text-2xl md:text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
      >
        {LEAGUE_CAMPAIGN.stagesTitle}
      </h2>
      <p className="text-slate-400 mt-2 text-sm md:text-base max-w-lg mx-auto">{LEAGUE_CAMPAIGN.stagesSubtitle}</p>
    </div>

    <div className="-mx-6 px-6 flex lg:grid lg:grid-cols-3 gap-5 lg:gap-6 overflow-x-auto lg:overflow-visible snap-x snap-mandatory pb-4 lg:pb-0">
      {LEAGUE_CAMPAIGN.stages.map((stage, i) => (
        <FlyerCard key={stage.id} stage={stage} index={i} onCta={onCta} />
      ))}
    </div>
  </section>
);

export default LeagueFlyers;
