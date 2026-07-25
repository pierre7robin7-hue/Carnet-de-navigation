// Silhouette affichée le temps très bref de vérifier la session de
// connexion, à la place d'un texte "Chargement…" : donne une impression de
// démarrage instantané plutôt qu'un écran qui attend.
function AppSkeleton() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="h-16 bg-navy-950 safe-top" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 w-full">
        <div className="space-y-2">
          <div className="h-8 w-52 rounded-lg bg-navy-100 dark:bg-navy-800 animate-pulse" />
          <div className="h-4 w-64 rounded-lg bg-navy-100 dark:bg-navy-800 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-white dark:bg-navy-800 shadow-soft animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-white dark:bg-navy-800 shadow-soft animate-pulse" />
      </div>
    </div>
  );
}

function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-navy-900 dark:text-navy-50">{title}</h1>
        {subtitle && <p className="text-navy-400 dark:text-navy-400 text-sm mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function SyncBadge({ pending, isOnline }) {
  if (pending > 0) {
    return (
      <span
        title={`${pending} modification${pending > 1 ? 's' : ''} en attente d'une connexion pour être synchronisée${pending > 1 ? 's' : ''}`}
        className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium text-coral-300 bg-coral-400/10 px-2.5 py-1.5 rounded-lg"
      >
        <Icon.CloudOff size={13} /> {pending} en attente
      </span>
    );
  }
  if (!isOnline) {
    return (
      <span title="Hors ligne" className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium text-navy-300 bg-white/5 px-2.5 py-1.5 rounded-lg">
        <Icon.CloudOff size={13} /> Hors ligne
      </span>
    );
  }
  return null;
}

function ThemeToggle({ className = '', style }) {
  const [dark, setDark] = React.useState(() => document.documentElement.classList.contains('dark'));

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try { window.localStorage.setItem('carnet-navigation.theme', next ? 'dark' : 'light'); } catch (e) {}
  };

  return (
    <button
      onClick={toggle}
      style={style}
      aria-label={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      title={dark ? 'Mode clair' : 'Mode sombre'}
      className={classNames('text-navy-300 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors', className)}
    >
      {dark ? <Icon.Sun size={18} /> : <Icon.Moon size={18} />}
    </button>
  );
}

function NewOutingButton({ display = 'inline-flex', className = '' }) {
  return (
    <a
      href="#/nouvelle"
      className={classNames(
        display,
        'items-center gap-1.5 bg-ocean-600 hover:bg-ocean-500 text-white font-semibold text-sm px-3.5 py-2 rounded-lg transition-colors',
        className
      )}
    >
      <Icon.Plus size={16} /> Nouvelle sortie
    </a>
  );
}

function NavLink({ href, active, children, icon: IconCmp }) {
  return (
    <a
      href={href}
      className={classNames(
        'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
        // Un simple surlignage (pas de couleur pleine) : la couleur pleine
        // ocean-600 reste réservée au bouton "Nouvelle sortie", seule action
        // du bandeau — sinon les deux se confondent visuellement au même endroit.
        active ? 'text-ocean-300 bg-white/10' : 'text-navy-200 hover:text-white hover:bg-white/5'
      )}
    >
      {IconCmp && <IconCmp size={16} />}
      {children}
    </a>
  );
}

const NAV_LINKS = [
  { href: '#/', label: 'Tableau de bord', shortLabel: 'Bord', icon: Icon.Home, match: (r) => r.name === 'dashboard' },
  { href: '#/historique', label: 'Historique', shortLabel: 'Historique', icon: Icon.List, match: (r) => r.name === 'history' },
  { href: '#/carte', label: 'Carte', shortLabel: 'Carte', icon: Icon.Map, match: (r) => r.name === 'map' },
  { href: '#/export', label: 'Export', shortLabel: 'Export', icon: Icon.Download, match: (r) => r.name === 'export' },
];

// "Ajouter une sortie" ne s'affiche que sur le tableau de bord : sur
// l'Historique on consulte/filtre des sorties existantes (la liste peut être
// longue), et sur la Carte / l'Export le bouton n'aurait rien à faire de
// plus près de son contenu (même logique que le bouton flottant mobile, voir
// FabNewOuting).
function isOutingListRoute(route) {
  return route.name === 'dashboard';
}

function Navbar({ route, userEmail, onSignOut, syncBadge }) {
  return (
    <header className="no-print bg-navy-950/90 backdrop-blur-xl sticky top-0 z-30 safe-top border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center h-16 gap-4">
          <a href="#/" className="flex items-center gap-2 text-white font-heading font-semibold text-lg tracking-tight justify-self-start">
            <span className="text-ocean-400"><Icon.Sailboat size={24} /></span>
            <span className="hidden sm:inline">Carnet de Navigations</span>
            <span className="sm:hidden">Carnet Navs</span>
          </a>
          <nav className="hidden md:flex items-center gap-1 justify-self-center">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.href} href={l.href} icon={l.icon} active={l.match(route)}>{l.label}</NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-1 sm:gap-2 justify-self-end">
            {syncBadge}
            <ThemeToggle />
            {userEmail && (
              <button
                onClick={onSignOut}
                title={`Déconnexion (${userEmail})`}
                className="hidden md:inline-flex items-center gap-1.5 text-navy-300 hover:text-white text-xs font-medium px-2.5 py-2 rounded-lg hover:bg-white/5 transition-colors max-w-[10rem]"
              >
                <span className="truncate">{userEmail}</span>
                <Icon.X size={13} className="shrink-0" />
              </button>
            )}
            {isOutingListRoute(route) && <NewOutingButton display="hidden md:inline-flex" />}
          </div>
        </div>
      </div>
    </header>
  );
}

// Barre d'onglets fixe en bas de l'écran sur mobile : navigation principale
// à un pouce de distance, comme dans une app native, plutôt qu'un menu
// hamburger qui exige un aller-retour vers le haut de l'écran.
function BottomTabBar({ route }) {
  return (
    <nav className="no-print md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-navy-900/95 backdrop-blur border-t border-navy-100 dark:border-navy-800 safe-bottom">
      <div className="grid grid-cols-4">
        {NAV_LINKS.map((l) => {
          const active = l.match(route);
          const IconCmp = l.icon;
          return (
            <a
              key={l.href}
              href={l.href}
              className={classNames(
                'flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors',
                active ? 'text-ocean-600 dark:text-ocean-400' : 'text-navy-400 dark:text-navy-500'
              )}
            >
              <IconCmp size={22} strokeWidth={active ? 2.2 : 1.8} />
              {l.shortLabel}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

function FabNewOuting() {
  return (
    <a
      href="#/nouvelle"
      aria-label="Nouvelle sortie"
      className="no-print md:hidden fixed z-30 right-4 flex items-center justify-center w-14 h-14 rounded-full bg-ocean-600 text-white shadow-fab-lg ring-4 ring-sand-50 dark:ring-navy-950 active:scale-95 transition-transform"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 70px)' }}
    >
      <Icon.Plus size={26} />
    </a>
  );
}

function StatCard({ icon: IconCmp, label, value, sub }) {
  return (
    <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-soft hover:shadow-lg transition-shadow p-5 flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl bg-ocean-50 dark:bg-ocean-900/40 text-ocean-600 dark:text-ocean-300 flex items-center justify-center shrink-0">
        <IconCmp size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-navy-400 text-xs font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-heading font-bold text-navy-900 dark:text-navy-50 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-navy-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Badge({ children, tone = 'navy' }) {
  const tones = {
    navy: 'bg-navy-50 dark:bg-navy-800 text-navy-700 dark:text-navy-200',
    ocean: 'bg-ocean-50 dark:bg-ocean-900/40 text-ocean-700 dark:text-ocean-300',
    sand: 'bg-sand-100 dark:bg-navy-800 text-navy-700 dark:text-navy-200',
    coral: 'bg-coral-400/10 dark:bg-coral-400/20 text-coral-600 dark:text-coral-300',
  };
  return (
    <span className={classNames('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', tones[tone])}>
      {children}
    </span>
  );
}

function MonthlyChart({ data }) {
  // data: [{ key, label, value }] déjà trié chronologiquement
  const max = Math.max(1, ...data.map((d) => d.value));
  const width = 720, height = 220, padLeft = 8, padBottom = 28, padTop = 12;
  const barGap = 10;
  const barWidth = (width - padLeft * 2 - barGap * (data.length - 1)) / data.length;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56" preserveAspectRatio="xMidYMid meet">
      <line x1={padLeft} y1={height - padBottom} x2={width - padLeft} y2={height - padBottom} className="stroke-sand-300 dark:stroke-navy-700" strokeWidth="1" />
      {data.map((d, i) => {
        const barH = d.value <= 0 ? 0 : Math.max(3, ((height - padTop - padBottom) * d.value) / max);
        const x = padLeft + i * (barWidth + barGap);
        const y = height - padBottom - barH;
        return (
          <g key={d.key}>
            <rect x={x} y={y} width={barWidth} height={barH} rx={5} fill="#0f63d1">
              <title>{`${d.label} : ${d.value.toFixed(1)} MN`}</title>
            </rect>
            <text
              x={x + barWidth / 2} y={height - padBottom + 16} textAnchor="middle" fontSize="11"
              className="fill-navy-700 dark:fill-navy-300" fontFamily="Inter, sans-serif"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function MoodEmoji({ value, size = 'text-lg' }) {
  const info = humeurInfo(value);
  return <span className={size} title={info.label}>{info.emoji}</span>;
}

function OutingCard({ outing }) {
  if (isVoyage(outing)) return <VoyageCard outing={outing} />;
  return (
    <a
      href={`#/sortie/${outing.id}`}
      className="block bg-white dark:bg-navy-800 rounded-2xl shadow-soft p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-navy-900 dark:text-navy-50 font-heading font-semibold text-base">
            <span className="truncate">{outing.portDepart}</span>
            <Icon.ChevronRight size={14} className="text-ocean-500 shrink-0" />
            <span className="truncate">{outing.portArrivee}</span>
          </div>
          <p className="text-navy-400 text-xs mt-1 flex items-center gap-1.5">
            <Icon.Calendar size={13} /> {formatDateFR(outing.date)}
          </p>
        </div>
        <MoodEmoji value={outing.skipper && outing.skipper.humeur} />
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <Badge tone="ocean">{formatNm(outing.distanceNm)}</Badge>
        <Badge tone="navy"><Icon.Clock size={12} />{formatDuree(outing.dureeMin)}</Badge>
        <Badge tone="sand"><Icon.Wind size={12} />{outing.meteo && outing.meteo.ventNoeuds}{outing.meteo && outing.meteo.ventNoeuds != null ? ' nds ' : ''}{outing.meteo && outing.meteo.directionVent}</Badge>
        {outing.bateauModele && <Badge tone="sand"><Icon.Sailboat size={12} />{outing.bateauModele}</Badge>}
      </div>
      {outing.commentaire && (
        <p className="text-sm text-navy-500 dark:text-navy-400 mt-3 line-clamp-2">{outing.commentaire}</p>
      )}
    </a>
  );
}

function VoyageCard({ outing }) {
  const legs = outingLegs(outing);
  const ports = outingPortsVisited(outing);
  const totalNm = outingDistanceTotal(outing);
  const totalDuree = outingDureeTotal(outing);
  const dateDebut = outingDateDebut(outing);
  const dateFin = outingDateFin(outing);

  return (
    <a
      href={`#/sortie/${outing.id}`}
      className="block bg-white dark:bg-navy-800 rounded-2xl shadow-soft p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all border-l-4 border-ocean-500"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-navy-900 dark:text-navy-50 font-heading font-semibold text-base truncate">{outingTitre(outing)}</span>
            <Badge tone="ocean"><Icon.Route size={12} />{legs.length} étapes</Badge>
          </div>
          <p className="text-navy-400 text-xs mt-1 flex items-center gap-1.5">
            <Icon.Calendar size={13} />
            {dateDebut === dateFin ? formatDateFR(dateDebut) : `${formatDateFR(dateDebut)} → ${formatDateFR(dateFin)}`}
          </p>
        </div>
        <div className="flex items-center -space-x-1 shrink-0">
          {legs.map((l, i) => <MoodEmoji key={i} value={l.skipper && l.skipper.humeur} size="text-base" />)}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-3 text-sm text-navy-700 dark:text-navy-300 font-medium">
        {ports.map((p, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <Icon.ChevronRight size={12} className="text-ocean-400 shrink-0" />}
            <span className="truncate max-w-[8rem]">{p}</span>
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <Badge tone="ocean">{formatNm(totalNm)}</Badge>
        <Badge tone="navy"><Icon.Clock size={12} />{formatDuree(totalDuree)}</Badge>
        {outing.bateauModele && <Badge tone="sand"><Icon.Sailboat size={12} />{outing.bateauModele}</Badge>}
      </div>
    </a>
  );
}

function EmptyState({ icon: IconCmp = Icon.Sailboat, title, description, action }) {
  return (
    <div className="bg-white/60 dark:bg-navy-800/60 border border-dashed border-navy-200 dark:border-navy-700 rounded-2xl p-10 text-center flex flex-col items-center gap-3">
      <div className="w-14 h-14 rounded-full bg-ocean-600 text-white flex items-center justify-center">
        <IconCmp size={26} />
      </div>
      <h3 className="font-heading font-semibold text-navy-800 dark:text-navy-100 text-lg">{title}</h3>
      {description && <p className="text-navy-400 text-sm max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

function ConfirmDialog({ open, title, description, confirmLabel = 'Confirmer', onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-navy-950/50 p-4" style={{ zIndex: 10000 }} onClick={onCancel}>
      <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-lg max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-heading font-semibold text-lg text-navy-900 dark:text-navy-50">{title}</h3>
        {description && <p className="text-navy-500 dark:text-navy-400 text-sm mt-2">{description}</p>}
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-navy-600 dark:text-navy-300 hover:bg-navy-50 dark:hover:bg-navy-700">Annuler</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm font-semibold bg-coral-500 hover:bg-coral-600 text-white">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, required, hint }) {
  return (
    // `min-w-0` : dans une grille, un enfant ne rétrécit jamais sous la
    // largeur intrinsèque de son contenu par défaut — et un <input
    // type="date"> natif (surtout sur iOS) a une largeur intrinsèque bien
    // plus grande que sa colonne, ce qui poussait toute la grille (et donc
    // la carte de filtres) à déborder de l'écran sur mobile.
    <label className="block min-w-0">
      <span className="text-sm font-medium text-navy-700 dark:text-navy-300">{label}{required && <span className="text-coral-500"> *</span>}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="text-xs text-navy-400 mt-1 block">{hint}</span>}
    </label>
  );
}

const inputClass = 'w-full rounded-lg border border-navy-100 dark:border-navy-700 bg-white dark:bg-navy-900 px-3 py-2 text-sm text-navy-900 dark:text-navy-50 placeholder-navy-300 dark:placeholder-navy-500 focus:outline-none focus:ring-2 focus:ring-ocean-400 focus:border-ocean-400 transition-shadow';
