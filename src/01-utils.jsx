const MOIS_COURTS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const MOIS_LONGS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

const DIRECTIONS_VENT = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

const ETATS_MER = [
  { value: 'calme', label: 'Calme (miroir)' },
  { value: 'belle', label: 'Belle (ridée)' },
  { value: 'peu_agitee', label: 'Peu agitée' },
  { value: 'agitee', label: 'Agitée' },
  { value: 'forte', label: 'Forte' },
  { value: 'tres_forte', label: 'Très forte / grosse' },
];

const HUMEURS = [
  { value: 'excellent', label: 'Excellent', emoji: '😄' },
  { value: 'bon', label: 'Bon', emoji: '🙂' },
  { value: 'moyen', label: 'Moyen', emoji: '😐' },
  { value: 'difficile', label: 'Difficile', emoji: '😕' },
  { value: 'eprouvant', label: 'Éprouvant', emoji: '😣' },
];

const VOILES_DISPONIBLES = [
  'Grand-voile', 'Génois', 'Foc', 'Trinquette', 'Tourmentin',
  'Spi symétrique', 'Spi asymétrique', 'Gennaker', 'Voile d’étai',
];

function uid() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2);
}

function parseDateLocal(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDateFR(iso, opts) {
  const d = parseDateLocal(iso);
  if (!d) return '';
  const long = opts && opts.long;
  const jour = d.getDate();
  const mois = long ? MOIS_LONGS[d.getMonth()] : MOIS_COURTS[d.getMonth()];
  const annee = d.getFullYear();
  return long ? `${jour} ${mois} ${annee}` : `${jour} ${mois} ${annee}`;
}

function formatDuree(minutes) {
  const m = Number(minutes) || 0;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${rest} min`;
  if (rest === 0) return `${h} h`;
  return `${h} h ${String(rest).padStart(2, '0')}`;
}

function formatNm(nm) {
  const n = Number(nm) || 0;
  return `${n % 1 === 0 ? n : n.toFixed(1)} MN`;
}

function etatMerLabel(value) {
  const e = ETATS_MER.find((x) => x.value === value);
  return e ? e.label : value || '—';
}

function humeurInfo(value) {
  return HUMEURS.find((h) => h.value === value) || { label: value || '—', emoji: '❔' };
}

function monthKey(iso) {
  return iso ? iso.slice(0, 7) : '';
}

function classNames(...parts) {
  return parts.filter(Boolean).join(' ');
}

// --- Sorties simples vs voyages multi-étapes -------------------------------
// Une sortie "simple" porte ses champs directement (portDepart, date, ...).
// Une sortie "voyage" porte un `titre` et un tableau `etapes`, chaque étape
// ayant exactement la même forme qu'une sortie simple. Ces helpers permettent
// au reste de l'app de traiter les deux uniformément.

function isVoyage(o) {
  return !!o && o.type === 'voyage';
}

function outingLegs(o) {
  if (isVoyage(o)) return o.etapes || [];
  return [{
    portDepart: o.portDepart, portArrivee: o.portArrivee, date: o.date,
    distanceNm: o.distanceNm, dureeMin: o.dureeMin, meteo: o.meteo,
    skipper: o.skipper, voiles: o.voiles, equipage: o.equipage, commentaire: o.commentaire,
  }];
}

function outingPortDepart(o) {
  const legs = outingLegs(o);
  return legs[0] ? legs[0].portDepart : '';
}

function outingPortArrivee(o) {
  const legs = outingLegs(o);
  return legs.length ? legs[legs.length - 1].portArrivee : '';
}

function outingDateDebut(o) {
  const legs = outingLegs(o);
  return legs.reduce((min, l) => (l.date && (!min || l.date < min) ? l.date : min), '');
}

function outingDateFin(o) {
  const legs = outingLegs(o);
  return legs.reduce((max, l) => (l.date && (!max || l.date > max) ? l.date : max), '');
}

// Date utilisée pour le tri chronologique et les regroupements par mois.
function outingSortDate(o) {
  return isVoyage(o) ? outingDateFin(o) : o.date;
}

function outingDistanceTotal(o) {
  return outingLegs(o).reduce((sum, l) => sum + (Number(l.distanceNm) || 0), 0);
}

function outingDureeTotal(o) {
  return outingLegs(o).reduce((sum, l) => sum + (Number(l.dureeMin) || 0), 0);
}

function outingPortsVisited(o) {
  const legs = outingLegs(o);
  const ports = [];
  legs.forEach((l, i) => {
    if (i === 0 && l.portDepart) ports.push(l.portDepart);
    if (l.portArrivee) ports.push(l.portArrivee);
  });
  return ports;
}

function outingEquipageAll(o) {
  const set = new Set();
  outingLegs(o).forEach((l) => (l.equipage || []).forEach((n) => set.add(n)));
  return Array.from(set);
}

function outingVoilesAll(o) {
  const set = new Set();
  outingLegs(o).forEach((l) => (l.voiles || []).forEach((v) => set.add(v)));
  return Array.from(set);
}

function outingTitre(o) {
  if (!isVoyage(o)) return '';
  if (o.titre && o.titre.trim()) return o.titre.trim();
  return `${outingPortDepart(o)} → ${outingPortArrivee(o)}`;
}
