function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-navy-900">{title}</h1>
        {subtitle && <p className="text-navy-400 text-sm mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function NewOutingButton({ display = 'inline-flex', className = '' }) {
  return (
    <a
      href="#/nouvelle"
      className={classNames(
        display,
        'items-center gap-1.5 bg-gradient-to-r from-ocean-500 to-ocean-600 hover:from-ocean-400 hover:to-ocean-500 text-white font-semibold text-sm px-3.5 py-2 rounded-lg shadow-glow hover:shadow-glow-lg transition-all',
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
        active ? 'bg-gradient-to-r from-ocean-500 to-ocean-600 text-white shadow-glow' : 'text-navy-200 hover:text-white hover:bg-white/5'
      )}
    >
      {IconCmp && <IconCmp size={16} />}
      {children}
    </a>
  );
}

function Navbar({ route, userEmail, onSignOut }) {
  const [open, setOpen] = React.useState(false);
  const links = [
    { href: '#/', label: 'Tableau de bord', icon: Icon.Home, match: (r) => r.name === 'dashboard' },
    { href: '#/historique', label: 'Historique', icon: Icon.List, match: (r) => r.name === 'history' },
    { href: '#/carte', label: 'Carte', icon: Icon.Map, match: (r) => r.name === 'map' },
    { href: '#/export', label: 'Export', icon: Icon.Download, match: (r) => r.name === 'export' },
  ];
  return (
    <header className="no-print bg-gradient-to-r from-navy-950 via-navy-900 to-navy-900 sticky top-0 z-30 shadow-soft">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center h-16 gap-4">
          <a href="#/" className="flex items-center gap-2 text-white font-heading font-semibold text-lg tracking-tight justify-self-start">
            <span className="text-ocean-400"><Icon.Sailboat size={24} /></span>
            Carnet de Navigation
          </a>
          <nav className="hidden md:flex items-center gap-1 justify-self-center">
            {links.map((l) => (
              <NavLink key={l.href} href={l.href} icon={l.icon} active={l.match(route)}>{l.label}</NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2 justify-self-end">
            {userEmail && (
              <button
                onClick={onSignOut}
                title={userEmail}
                className="hidden sm:inline-flex items-center gap-1.5 text-navy-300 hover:text-white text-xs font-medium px-2.5 py-2 rounded-lg hover:bg-white/5 transition-colors max-w-[10rem]"
              >
                <span className="truncate">{userEmail}</span>
                <Icon.X size={13} className="shrink-0" />
              </button>
            )}
            <NewOutingButton display="hidden sm:inline-flex" />
            <button
              className="md:hidden text-navy-100 p-2"
              onClick={() => setOpen((o) => !o)}
              aria-label="Ouvrir le menu"
            >
              {open ? <Icon.X size={22} /> : <Icon.List size={22} />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="md:hidden flex flex-col gap-1 pb-3">
            {links.map((l) => (
              <NavLink key={l.href} href={l.href} icon={l.icon} active={l.match(route)}>{l.label}</NavLink>
            ))}
            <NewOutingButton display="flex" className="mt-1" />
            {userEmail && (
              <button
                onClick={onSignOut}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-navy-200 hover:text-white hover:bg-white/5 transition-all"
              >
                <Icon.X size={16} /> Déconnexion ({userEmail})
              </button>
            )}
          </nav>
        )}
      </div>
      <div className="h-2 bg-waves bg-navy-800" />
    </header>
  );
}

function StatCard({ icon: IconCmp, label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl shadow-soft hover:shadow-lg transition-shadow p-5 flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-ocean-500 to-ocean-700 text-white flex items-center justify-center shrink-0 shadow-glow">
        <IconCmp size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-navy-400 text-xs font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-heading font-bold text-navy-900 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-navy-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Badge({ children, tone = 'navy' }) {
  const tones = {
    navy: 'bg-navy-50 text-navy-700',
    ocean: 'bg-ocean-50 text-ocean-700',
    sand: 'bg-sand-100 text-navy-700',
    coral: 'bg-coral-400/10 text-coral-600',
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
      <defs>
        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4da2ff" />
          <stop offset="100%" stopColor="#0e4fa8" />
        </linearGradient>
      </defs>
      <line x1={padLeft} y1={height - padBottom} x2={width - padLeft} y2={height - padBottom} stroke="#e5d6b4" strokeWidth="1" />
      {data.map((d, i) => {
        const barH = d.value <= 0 ? 0 : Math.max(3, ((height - padTop - padBottom) * d.value) / max);
        const x = padLeft + i * (barWidth + barGap);
        const y = height - padBottom - barH;
        return (
          <g key={d.key}>
            <rect x={x} y={y} width={barWidth} height={barH} rx={5} fill="url(#barGradient)">
              <title>{`${d.label} : ${d.value.toFixed(1)} MN`}</title>
            </rect>
            <text x={x + barWidth / 2} y={height - padBottom + 16} textAnchor="middle" fontSize="11" fill="#153a56" fontFamily="Inter, sans-serif">
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
      className="block bg-white rounded-2xl shadow-soft p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-navy-900 font-heading font-semibold text-base">
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
        <p className="text-sm text-navy-500 mt-3 line-clamp-2">{outing.commentaire}</p>
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
      className="block bg-white rounded-2xl shadow-soft p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all border-l-4 border-ocean-500"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-navy-900 font-heading font-semibold text-base truncate">{outingTitre(outing)}</span>
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
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-3 text-sm text-navy-700 font-medium">
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
    <div className="bg-white/60 border border-dashed border-navy-200 rounded-2xl p-10 text-center flex flex-col items-center gap-3">
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-ocean-400 to-ocean-600 text-white flex items-center justify-center shadow-glow">
        <IconCmp size={26} />
      </div>
      <h3 className="font-heading font-semibold text-navy-800 text-lg">{title}</h3>
      {description && <p className="text-navy-400 text-sm max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

function ConfirmDialog({ open, title, description, confirmLabel = 'Confirmer', onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-navy-950/50 p-4" style={{ zIndex: 10000 }} onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-heading font-semibold text-lg text-navy-900">{title}</h3>
        {description && <p className="text-navy-500 text-sm mt-2">{description}</p>}
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-navy-600 hover:bg-navy-50">Annuler</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm font-semibold bg-coral-500 hover:bg-coral-600 text-white">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, required, hint }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-navy-700">{label}{required && <span className="text-coral-500"> *</span>}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="text-xs text-navy-400 mt-1 block">{hint}</span>}
    </label>
  );
}

const inputClass = 'w-full rounded-lg border border-navy-100 bg-white px-3 py-2 text-sm text-navy-900 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-ocean-400 focus:border-ocean-400 transition-shadow';
