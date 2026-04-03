import { useState, useEffect } from 'react';
import { apiCall } from '../hooks/useApi';

const LABELS: Record<string, Record<string, string>> = {
  sv: {
    title: 'TrustScore',
    subtitle: 'Betaltrovärdighet',
    activate: 'Aktivera TrustScore',
    activating: 'Aktiverar...',
    notStarted: 'Aktivera TrustScore för att visa din betaltrovärdighet för andra företag.',
    inactive: 'Samlar data...',
    partial: 'Delvis aktiverad',
    full: 'Fullt aktiverad',
    payment: 'Betalning',
    contract: 'Avtal',
    pattern: 'Mönster',
    progress: 'Framsteg',
    events: 'händelser',
    days: 'dagar',
    of: 'av',
    score_strong: 'Stark historik',
    score_good: 'God historik',
    score_mixed: 'Blandad historik',
    score_concern: 'Oroande mönster',
    score_high_risk: 'Hög risk',
    confidence: 'Underlag',
  },
  fi: {
    title: 'TrustScore',
    subtitle: 'Maksuluotettavuus',
    activate: 'Aktivoi TrustScore',
    activating: 'Aktivoidaan...',
    notStarted: 'Aktivoi TrustScore näyttääksesi maksuluotettavuutesi muille yrityksille.',
    inactive: 'Kerätään tietoja...',
    partial: 'Osittain aktivoitu',
    full: 'Täysin aktivoitu',
    payment: 'Maksu',
    contract: 'Sopimus',
    pattern: 'Kaava',
    progress: 'Edistyminen',
    events: 'tapahtumaa',
    days: 'päivää',
    of: '/',
    score_strong: 'Vahva historia',
    score_good: 'Hyvä historia',
    score_mixed: 'Vaihteleva historia',
    score_concern: 'Huolestuttava kaava',
    score_high_risk: 'Korkea riski',
    confidence: 'Luottamus',
  },
  de: {
    title: 'TrustScore',
    subtitle: 'Zahlungszuverlässigkeit',
    activate: 'TrustScore aktivieren',
    activating: 'Wird aktiviert...',
    notStarted: 'Aktivieren Sie TrustScore, um Ihre Zahlungszuverlässigkeit anderen Unternehmen zu zeigen.',
    inactive: 'Daten werden gesammelt...',
    partial: 'Teilweise aktiviert',
    full: 'Vollständig aktiviert',
    payment: 'Zahlung',
    contract: 'Vertrag',
    pattern: 'Muster',
    progress: 'Fortschritt',
    events: 'Ereignisse',
    days: 'Tage',
    of: 'von',
    score_strong: 'Starke Historie',
    score_good: 'Gute Historie',
    score_mixed: 'Gemischte Historie',
    score_concern: 'Besorgniserregendes Muster',
    score_high_risk: 'Hohes Risiko',
    confidence: 'Datenbasis',
  },
  nl: {
    title: 'TrustScore',
    subtitle: 'Betalingsbetrouwbaarheid',
    activate: 'TrustScore activeren',
    activating: 'Activeren...',
    notStarted: 'Activeer TrustScore om uw betalingsbetrouwbaarheid aan andere bedrijven te tonen.',
    inactive: 'Gegevens worden verzameld...',
    partial: 'Gedeeltelijk geactiveerd',
    full: 'Volledig geactiveerd',
    payment: 'Betaling',
    contract: 'Contract',
    pattern: 'Patroon',
    progress: 'Voortgang',
    events: 'gebeurtenissen',
    days: 'dagen',
    of: 'van',
    score_strong: 'Sterke historie',
    score_good: 'Goede historie',
    score_mixed: 'Gemengde historie',
    score_concern: 'Zorgwekkend patroon',
    score_high_risk: 'Hoog risico',
    confidence: 'Onderbouwing',
  },
  en: {
    title: 'TrustScore',
    subtitle: 'Payment Reliability',
    activate: 'Activate TrustScore',
    activating: 'Activating...',
    notStarted: 'Activate TrustScore to show your payment reliability to other businesses.',
    inactive: 'Collecting data...',
    partial: 'Partially activated',
    full: 'Fully activated',
    payment: 'Payment',
    contract: 'Contract',
    pattern: 'Pattern',
    progress: 'Progress',
    events: 'events',
    days: 'days',
    of: 'of',
    score_strong: 'Strong track record',
    score_good: 'Good track record',
    score_mixed: 'Mixed track record',
    score_concern: 'Concerning pattern',
    score_high_risk: 'High risk',
    confidence: 'Confidence',
  },
  da: {
    title: 'TrustScore',
    subtitle: 'Betalingspålidelighed',
    activate: 'Aktiver TrustScore',
    activating: 'Aktiverer...',
    notStarted: 'Aktiver TrustScore for at vise din betalingspålidelighed til andre virksomheder.',
    inactive: 'Indsamler data...',
    partial: 'Delvist aktiveret',
    full: 'Fuldt aktiveret',
    payment: 'Betaling',
    contract: 'Kontrakt',
    pattern: 'Mønster',
    progress: 'Fremskridt',
    events: 'hændelser',
    days: 'dage',
    of: 'af',
    score_strong: 'Stærk historik',
    score_good: 'God historik',
    score_mixed: 'Blandet historik',
    score_concern: 'Bekymrende mønster',
    score_high_risk: 'Høj risiko',
    confidence: 'Datagrundlag',
  },
  nb: {
    title: 'TrustScore',
    subtitle: 'Betalingspålitelighet',
    activate: 'Aktiver TrustScore',
    activating: 'Aktiverer...',
    notStarted: 'Aktiver TrustScore for å vise betalingspåliteligheten din til andre bedrifter.',
    inactive: 'Samler data...',
    partial: 'Delvis aktivert',
    full: 'Fullt aktivert',
    payment: 'Betaling',
    contract: 'Kontrakt',
    pattern: 'Mønster',
    progress: 'Fremgang',
    events: 'hendelser',
    days: 'dager',
    of: 'av',
    score_strong: 'Sterk historikk',
    score_good: 'God historikk',
    score_mixed: 'Blandet historikk',
    score_concern: 'Bekymringsfullt mønster',
    score_high_risk: 'Høy risiko',
    confidence: 'Datagrunnlag',
  },
};

const BAND_COLORS: Record<string, { ring: string; bg: string; text: string }> = {
  green:  { ring: 'stroke-green-500',  bg: 'bg-green-50',  text: 'text-green-700' },
  blue:   { ring: 'stroke-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-700' },
  yellow: { ring: 'stroke-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  orange: { ring: 'stroke-orange-500', bg: 'bg-orange-50', text: 'text-orange-700' },
  red:    { ring: 'stroke-red-500',    bg: 'bg-red-50',    text: 'text-red-700' },
};

interface TrustScoreProps {
  lang?: string;
}

interface ScoreData {
  ok: boolean;
  activated: boolean;
  activationLevel: string;
  trustScore: number;
  trustConfidence: number;
  scoreBand: { label: string; color: string };
  subScores: {
    payment:  { score: number; eventCount: number };
    contract: { score: number; eventCount: number };
    pattern:  { score: number; eventCount: number };
  };
  progress: {
    paymentEvents: { current: number; target: number };
    days: { current: number; target: number };
  };
}

export default function TrustScore({ lang = 'sv' }: TrustScoreProps) {
  const [data, setData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const t = LABELS[lang] || LABELS.en;

  useEffect(() => { loadScore(); }, []);

  const loadScore = async () => {
    try {
      const res = await apiCall('trust.score');
      if (res.ok) setData(res as any);
    } catch {}
    setLoading(false);
  };

  const handleActivate = async () => {
    setActivating(true);
    try {
      const res = await apiCall('trust.activate');
      if (res.ok) await loadScore();
    } catch {}
    setActivating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not activated
  if (!data || !data.activated) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
        <div className="text-4xl mb-3">🛡️</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{t.title}</h3>
        <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">{t.notStarted}</p>
        <button
          onClick={handleActivate}
          disabled={activating}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-all"
        >
          {activating ? t.activating : t.activate}
        </button>
      </div>
    );
  }

  const score = Math.round(data.trustScore);
  const bandColor = BAND_COLORS[data.scoreBand?.color] || BAND_COLORS.blue;
  const bandLabel = t[`score_${data.scoreBand?.label}`] || data.scoreBand?.label;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            🛡️ {t.title}
          </h3>
          <p className="text-xs text-gray-500">{t.subtitle}</p>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${bandColor.bg} ${bandColor.text}`}>
          {data.activationLevel === 'FULL' ? t.full : data.activationLevel === 'PARTIAL' ? t.partial : t.inactive}
        </div>
      </div>

      {/* Score circle + sub-scores */}
      <div className="flex items-center gap-6">
        {/* Circular gauge */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              className={bandColor.ring}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{score}</span>
            <span className="text-[10px] text-gray-500">/100</span>
          </div>
        </div>

        {/* Sub-scores */}
        <div className="flex-1 space-y-2">
          <SubScore label={t.payment} score={data.subScores.payment.score} count={data.subScores.payment.eventCount} t={t} />
          <SubScore label={t.contract} score={data.subScores.contract.score} count={data.subScores.contract.eventCount} t={t} />
          <SubScore label={t.pattern} score={data.subScores.pattern.score} count={data.subScores.pattern.eventCount} t={t} />
        </div>
      </div>

      {/* Band label */}
      <div className={`mt-4 text-center py-2 rounded-xl text-sm font-semibold ${bandColor.bg} ${bandColor.text}`}>
        {bandLabel}
      </div>

      {/* Progress (if not FULL) */}
      {data.activationLevel !== 'FULL' && data.progress && (
        <div className="mt-4 bg-gray-50 rounded-xl p-3">
          <div className="text-xs font-semibold text-gray-700 mb-2">{t.progress}</div>
          <div className="grid grid-cols-2 gap-3">
            <ProgressBar
              label={t.events}
              current={data.progress.paymentEvents.current}
              target={data.progress.paymentEvents.target}
              t={t}
            />
            <ProgressBar
              label={t.days}
              current={data.progress.days.current}
              target={data.progress.days.target}
              t={t}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SubScore({ label, score, count, t }: { label: string; score: number; count: number; t: Record<string, string> }) {
  const color = score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-blue-500' : score >= 30 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-0.5">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="text-gray-500">{score} ({count} {t.events})</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%`, transition: 'width 1s ease-out' }} />
      </div>
    </div>
  );
}

function ProgressBar({ label, current, target, t }: { label: string; current: number; target: number; t: Record<string, string> }) {
  const pct = Math.min(100, Math.round((current / target) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-500">{current} {t.of} {target}</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
