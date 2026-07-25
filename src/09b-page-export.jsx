function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function seasonYears(outings) {
  const years = new Set();
  outings.forEach((o) => {
    const d = outingSortDate(o);
    if (d) years.add(d.slice(0, 4));
  });
  return Array.from(years).sort((a, b) => b.localeCompare(a));
}

function computeSeasonStats(outings, year) {
  const inYear = year ? outings.filter((o) => (outingSortDate(o) || '').slice(0, 4) === year) : outings;
  const totalSorties = inYear.length;
  const totalNm = inYear.reduce((sum, o) => sum + outingDistanceTotal(o), 0);
  const totalDuree = inYear.reduce((sum, o) => sum + outingDureeTotal(o), 0);

  const portCounts = {};
  inYear.forEach((o) => outingLegs(o).forEach((l) => {
    [l.portDepart, l.portArrivee].forEach((p) => { if (p) portCounts[p] = (portCounts[p] || 0) + 1; });
  }));
  let topPort = null, topPortCount = 0;
  Object.entries(portCounts).forEach(([port, count]) => {
    if (count > topPortCount) { topPort = port; topPortCount = count; }
  });

  const boatCounts = {};
  inYear.forEach((o) => {
    const b = (o.bateauModele || '').trim();
    if (b) boatCounts[b] = (boatCounts[b] || 0) + 1;
  });
  let topBoat = null, topBoatCount = 0;
  Object.entries(boatCounts).forEach(([b, c]) => { if (c > topBoatCount) { topBoat = b; topBoatCount = c; } });

  let longest = null;
  inYear.forEach((o) => { if (!longest || outingDistanceTotal(o) > outingDistanceTotal(longest)) longest = o; });

  const portsVisited = new Set();
  inYear.forEach((o) => outingPortsVisited(o).forEach((p) => portsVisited.add(p)));

  return {
    totalSorties, totalNm, totalDuree, topPort, topPortCount, topBoat, topBoatCount,
    longest, portsVisitedCount: portsVisited.size,
  };
}

// Card interactive (sélecteur d'année) réservée à l'écran : sur le
// récapitulatif imprimé, ses chiffres sont repris dans un bandeau condensé
// au sein du même document (voir PrintStatsStrip) plutôt que dans une carte
// séparée, pour n'avoir qu'un seul cadre continu sur la page imprimée.
function SeasonSummary({ stats, year, years, onYearChange }) {
  if (years.length === 0) return null;

  return (
    <section className="no-print bg-white dark:bg-navy-800 rounded-2xl shadow-soft p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-heading font-semibold text-navy-800 dark:text-navy-100 flex items-center gap-2">
          <Icon.BarChart size={17} className="text-ocean-600" /> Bilan de saison
        </h2>
        <select
          value={year} onChange={(e) => onYearChange(e.target.value)}
          className="no-print text-sm font-medium border border-navy-100 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-700 dark:text-navy-200 rounded-lg px-3 py-1.5"
        >
          <option value="all">Toutes les années</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {stats.totalSorties === 0 ? (
        <p className="text-navy-400 text-sm">Aucune navigation en {year}.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-navy-400 text-xs uppercase tracking-wide">Sorties</p>
            <p className="text-xl font-heading font-bold text-navy-900 dark:text-navy-50">{stats.totalSorties}</p>
          </div>
          <div>
            <p className="text-navy-400 text-xs uppercase tracking-wide">Distance cumulée</p>
            <p className="text-xl font-heading font-bold text-navy-900 dark:text-navy-50">{formatNm(stats.totalNm)}</p>
          </div>
          <div>
            <p className="text-navy-400 text-xs uppercase tracking-wide">Temps en mer</p>
            <p className="text-xl font-heading font-bold text-navy-900 dark:text-navy-50">{formatDuree(stats.totalDuree)}</p>
          </div>
          <div>
            <p className="text-navy-400 text-xs uppercase tracking-wide">Ports visités</p>
            <p className="text-xl font-heading font-bold text-navy-900 dark:text-navy-50">{stats.portsVisitedCount}</p>
          </div>
          <div>
            <p className="text-navy-400 text-xs uppercase tracking-wide">Port le plus fréquenté</p>
            <p className="text-base font-semibold text-navy-800 dark:text-navy-100 truncate">{stats.topPort || '—'}</p>
            {stats.topPort && <p className="text-xs text-navy-400">{stats.topPortCount} passage{stats.topPortCount > 1 ? 's' : ''}</p>}
          </div>
          {stats.topBoat && (
            <div>
              <p className="text-navy-400 text-xs uppercase tracking-wide">Bateau le plus utilisé</p>
              <p className="text-base font-semibold text-navy-800 dark:text-navy-100 truncate">{stats.topBoat}</p>
              <p className="text-xs text-navy-400">{stats.topBoatCount} sortie{stats.topBoatCount > 1 ? 's' : ''}</p>
            </div>
          )}
          {stats.longest && (
            <div className="col-span-2 sm:col-span-3">
              <p className="text-navy-400 text-xs uppercase tracking-wide">Plus longue sortie</p>
              <p className="text-base font-semibold text-navy-800 dark:text-navy-100">
                {isVoyage(stats.longest) ? outingTitre(stats.longest) : `${stats.longest.portDepart} → ${stats.longest.portArrivee}`}
                <span className="text-navy-400 font-normal"> — {formatNm(outingDistanceTotal(stats.longest))}, {formatDateFR(outingSortDate(stats.longest))}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function monthGroupLabel(key) {
  const [y, m] = key.split('-');
  const label = MOIS_LONGS[Number(m) - 1] || key;
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} ${y}`;
}

function groupByMonth(outings) {
  const groups = {};
  outings.forEach((o) => {
    const d = outingSortDate(o);
    const key = d ? d.slice(0, 7) : 'Date inconnue';
    (groups[key] = groups[key] || []).push(o);
  });
  return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
}

// Jour + mois courts, sans l'année : chaque tableau est déjà groupé par mois
// (l'en-tête "MARS 2026" la porte), la répéter sur chaque ligne ne faisait
// que forcer une colonne "Date" trop large pour son texte — au point de
// déborder sur la colonne "Trajet" voisine sur la page imprimée.
function printDateLabel(iso) {
  const d = parseDateLocal(iso);
  if (!d) return '';
  return `${d.getDate()} ${MOIS_COURTS[d.getMonth()]}`;
}

function PrintRow({ outing }) {
  const legs = outingLegs(outing);
  return (
    <>
      {isVoyage(outing) && (
        <tr className="break-inside-avoid">
          <td colSpan={7} className="pt-3.5 pb-1 font-semibold text-navy-800 dark:text-navy-100 text-[11px]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-ocean-600 inline-block shrink-0" />
              {outingTitre(outing)}{outing.bateauModele ? ` — ${outing.bateauModele}` : ''}
            </span>
          </td>
        </tr>
      )}
      {legs.map((l, i) => {
        const humeur = humeurInfo(l.skipper && l.skipper.humeur);
        return (
          <tr key={i} className="border-b border-navy-100 dark:border-navy-700 text-navy-700 dark:text-navy-300 break-inside-avoid">
            {/* `truncate` (plutôt que `whitespace-nowrap` seul) sur les colonnes
                étroites : dans un tableau à largeurs fixes, un contenu trop
                large doit se couper proprement dans sa cellule au lieu de
                déborder visuellement sur la colonne suivante. */}
            <td className="py-2 pr-2 align-top truncate tabular-nums">{printDateLabel(l.date)}</td>
            <td className="py-2 pr-2 align-top">{l.portDepart} → {l.portArrivee}</td>
            <td className="py-2 pr-2 align-top truncate">{!isVoyage(outing) ? (outing.bateauModele || '—') : ''}</td>
            <td className="py-2 pr-2 align-top truncate text-right tabular-nums">{formatNm(l.distanceNm)}</td>
            <td className="py-2 pr-2 align-top truncate text-right tabular-nums">{formatDuree(l.dureeMin)}</td>
            <td className="py-2 pr-2 align-top truncate">{l.meteo && l.meteo.ventNoeuds != null ? `${l.meteo.ventNoeuds} nds ${l.meteo.directionVent || ''}` : '—'}</td>
            <td className="py-2 align-top">{humeur.emoji} {l.commentaire || ''}</td>
          </tr>
        );
      })}
    </>
  );
}

// Largeurs fixes (plutôt qu'un tableau à largeurs automatiques) : chaque
// colonne garde une taille prévisible d'un mois à l'autre, et le texte long
// (trajet, commentaire) passe à la ligne au lieu de forcer un défilement
// horizontal — important sur une page imprimée, qui ne peut pas défiler.
function PrintMonthGroup({ monthKey, outings }) {
  const totalNm = outings.reduce((sum, o) => sum + outingDistanceTotal(o), 0);
  return (
    <div className="mb-7 last:mb-0">
      <div className="flex items-baseline justify-between border-b-2 border-navy-800 dark:border-navy-200 pb-1.5 mb-1.5 break-after-avoid-page">
        <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-navy-900 dark:text-navy-50">{monthGroupLabel(monthKey)}</h3>
        <span className="text-[11px] text-navy-400">{outings.length} sortie{outings.length > 1 ? 's' : ''} · {formatNm(totalNm)}</span>
      </div>
      <table className="w-full text-[11.5px] leading-normal border-collapse table-fixed">
        <colgroup>
          <col style={{ width: '8%' }} />
          <col style={{ width: '24%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '9%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '26%' }} />
        </colgroup>
        <thead>
          <tr className="text-left text-navy-400 border-b border-navy-200 dark:border-navy-700">
            <th className="py-1.5 pr-2 font-medium">Date</th>
            <th className="py-1.5 pr-2 font-medium">Trajet</th>
            <th className="py-1.5 pr-2 font-medium">Bateau</th>
            <th className="py-1.5 pr-2 font-medium text-right">Distance</th>
            <th className="py-1.5 pr-2 font-medium text-right">Durée</th>
            <th className="py-1.5 pr-2 font-medium">Vent</th>
            <th className="py-1.5 font-medium">Ressenti &amp; commentaire</th>
          </tr>
        </thead>
        <tbody>
          {outings.map((o) => <PrintRow key={o.id} outing={o} />)}
        </tbody>
      </table>
    </div>
  );
}

// Sur mobile, le tableau à colonnes fixes (pensé pour une page imprimée
// large) devient illisible : trop de colonnes pour ~350px, texte minuscule.
// On lui substitue à l'écran une liste de cartes (une par étape), au même
// gabarit que le reste de l'app — le tableau reste réservé au grand écran et
// à l'impression, où il a la place de respirer.
function PrintLegMobileCard({ leg, boat }) {
  const humeur = humeurInfo(leg.skipper && leg.skipper.humeur);
  return (
    <div className="bg-sand-50 dark:bg-navy-900 rounded-xl p-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm text-navy-900 dark:text-navy-50 min-w-0">{leg.portDepart} → {leg.portArrivee}</p>
        <span className="text-lg leading-none shrink-0">{humeur.emoji}</span>
      </div>
      <p className="text-xs text-navy-400 mt-1">{printDateLabel(leg.date)}{boat ? ` · ${boat}` : ''}</p>
      <div className="flex flex-wrap gap-1.5 mt-2.5">
        <Badge tone="ocean">{formatNm(leg.distanceNm)}</Badge>
        <Badge tone="navy"><Icon.Clock size={12} />{formatDuree(leg.dureeMin)}</Badge>
        {leg.meteo && leg.meteo.ventNoeuds != null && (
          <Badge tone="sand"><Icon.Wind size={12} />{leg.meteo.ventNoeuds} nds {leg.meteo.directionVent || ''}</Badge>
        )}
      </div>
      {leg.commentaire && <p className="text-sm text-navy-600 dark:text-navy-300 mt-2.5">{leg.commentaire}</p>}
    </div>
  );
}

function PrintOutingMobileCards({ outing }) {
  const legs = outingLegs(outing);
  return (
    <>
      {isVoyage(outing) && (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-navy-800 dark:text-navy-100">
          <span className="w-1.5 h-1.5 rounded-full bg-ocean-600 inline-block shrink-0" />
          {outingTitre(outing)}{outing.bateauModele ? ` — ${outing.bateauModele}` : ''}
        </p>
      )}
      {legs.map((l, i) => (
        <PrintLegMobileCard key={i} leg={l} boat={!isVoyage(outing) ? (outing.bateauModele || null) : null} />
      ))}
    </>
  );
}

function PrintMonthGroupMobile({ monthKey, outings }) {
  const totalNm = outings.reduce((sum, o) => sum + outingDistanceTotal(o), 0);
  return (
    <div className="mb-6 last:mb-0">
      <div className="flex items-baseline justify-between border-b-2 border-navy-800 dark:border-navy-200 pb-1.5 mb-3">
        <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-navy-900 dark:text-navy-50">{monthGroupLabel(monthKey)}</h3>
        <span className="text-[11px] text-navy-400">{outings.length} sortie{outings.length > 1 ? 's' : ''} · {formatNm(totalNm)}</span>
      </div>
      <div className="space-y-2.5">
        {outings.map((o) => <PrintOutingMobileCards key={o.id} outing={o} />)}
      </div>
    </div>
  );
}

// Bandeau de chiffres clés, visible uniquement à l'impression : reprend les
// mêmes totaux que la carte "Bilan de saison" (écran), mais intégrés au
// même cadre que le tableau plutôt que dans une carte séparée.
function PrintStat({ label, value }) {
  return (
    <div className="px-3 first:pl-0 last:pr-0 text-center">
      <p className="text-[8.5px] uppercase tracking-wide text-navy-400">{label}</p>
      <p className="text-[13px] font-heading font-semibold text-navy-900 mt-0.5 truncate">{value}</p>
    </div>
  );
}

function PrintStatsStrip({ stats }) {
  if (stats.totalSorties === 0) return null;
  return (
    <div className="grid grid-cols-6 divide-x divide-navy-100 border-b border-navy-100 py-3">
      <PrintStat label="Sorties" value={stats.totalSorties} />
      <PrintStat label="Distance" value={formatNm(stats.totalNm)} />
      <PrintStat label="Temps en mer" value={formatDuree(stats.totalDuree)} />
      <PrintStat label="Ports visités" value={stats.portsVisitedCount} />
      <PrintStat label="Port favori" value={stats.topPort || '—'} />
      <PrintStat label="Bateau" value={stats.topBoat || '—'} />
    </div>
  );
}

function ExportPage({ outings, onImported }) {
  const fileInputRef = React.useRef(null);
  const [message, setMessage] = React.useState(null); // { tone, text }
  const [confirmFile, setConfirmFile] = React.useState(null);

  const handleExport = () => {
    const data = Store.exportData();
    const stamp = todayLocalISO();
    downloadJSON(data, `carnet-navigation-${stamp}.json`);
  };

  const pickFile = () => fileInputRef.current && fileInputRef.current.click();

  const onFileChosen = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data.sorties)) throw new Error('invalid');
        setConfirmFile(data);
      } catch (err) {
        setMessage({ tone: 'coral', text: 'Ce fichier ne semble pas être un export valide du Carnet de Navigations.' });
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    try {
      Store.importData(confirmFile);
      setConfirmFile(null);
      setMessage({ tone: 'teal', text: `Import réussi : ${confirmFile.sorties.length} sortie(s) chargée(s).` });
      onImported();
    } catch (err) {
      setMessage({ tone: 'coral', text: err.message || 'Import impossible.' });
      setConfirmFile(null);
    }
  };

  const years = React.useMemo(() => seasonYears(outings), [outings]);
  const [year, setYear] = React.useState(() => years[0] || 'all');
  const stats = React.useMemo(() => computeSeasonStats(outings, year === 'all' ? null : year), [outings, year]);

  const sorted = [...outings].sort((a, b) => (outingSortDate(a) < outingSortDate(b) ? -1 : 1));
  const printable = year === 'all' ? sorted : sorted.filter((o) => (outingSortDate(o) || '').slice(0, 4) === year);
  const monthGroups = React.useMemo(() => groupByMonth(printable), [printable]);
  const printTotalNm = printable.reduce((sum, o) => sum + outingDistanceTotal(o), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 print:px-0 print:py-0 space-y-6 print:space-y-0">
      <div className="no-print">
        <PageHeader
          title="Export & impression"
          subtitle="Sauvegardez vos données ou imprimez un récapitulatif de vos navigations"
        />
      </div>

      {message && (
        <div className={classNames(
          'no-print text-sm rounded-lg px-4 py-3 font-medium',
          message.tone === 'coral' ? 'bg-coral-400/10 dark:bg-coral-400/20 text-coral-600 dark:text-coral-300' : 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
        )}>
          {message.text}
        </div>
      )}

      <section className="no-print bg-white dark:bg-navy-800 rounded-2xl shadow-soft p-5 space-y-4">
        <h2 className="font-heading font-semibold text-navy-800 dark:text-navy-100 flex items-center gap-2">
          <Icon.Download size={17} className="text-ocean-600" /> Sauvegarde &amp; transfert manuel
        </h2>
        <p className="text-sm text-navy-500">
          Vos sorties sont déjà synchronisées automatiquement avec votre compte. Ce fichier reste utile pour
          garder une copie de secours en local, ou migrer des données entre deux comptes.
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExport} className="inline-flex items-center gap-1.5 bg-ocean-600 hover:bg-ocean-500 text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors">
            <Icon.Download size={16} /> Exporter mes données (.json)
          </button>
          <button onClick={pickFile} className="inline-flex items-center gap-1.5 bg-navy-50 dark:bg-navy-700 hover:bg-navy-100 dark:hover:bg-navy-600 text-navy-700 dark:text-navy-200 font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors">
            <Icon.Upload size={16} /> Importer un fichier
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={onFileChosen} className="hidden" />
        </div>
      </section>

      <SeasonSummary stats={stats} year={year} years={years} onYearChange={setYear} />

      <section className="bg-white dark:bg-navy-800 rounded-2xl shadow-soft p-5 sm:p-8 space-y-4 print-sheet print:p-0">
        <div className="no-print flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-heading font-semibold text-navy-800 dark:text-navy-100 flex items-center gap-2">
            <Icon.Printer size={17} className="text-ocean-600" /> Récapitulatif imprimable
          </h2>
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 bg-navy-800 dark:bg-navy-600 hover:bg-navy-700 dark:hover:bg-navy-500 text-white font-semibold text-sm px-4 py-2 rounded-lg">
            <Icon.Printer size={15} /> Imprimer / Exporter en PDF
          </button>
        </div>

        {/* Page de garde + bandeau de chiffres clés, visibles uniquement à
            l'impression : un seul document continu (pas une carte séparée
            par sujet) pour une mise en page de rapport plutôt que d'écran. */}
        <div className="hidden print:block">
          <div className="flex items-center justify-between gap-4 pb-4 border-b-2 border-navy-900">
            <div className="flex items-center gap-2.5">
              <Icon.Sailboat size={28} className="text-ocean-600" />
              <div>
                <p className="font-heading font-bold text-xl text-navy-900 leading-tight">Carnet de Navigations</p>
                <p className="text-xs text-navy-400 mt-0.5">{year === 'all' ? 'Toutes les navigations' : `Saison ${year}`}</p>
              </div>
            </div>
            <div className="text-right text-xs text-navy-400 leading-relaxed">
              <p className="font-medium text-navy-600">{printable.length} sortie{printable.length > 1 ? 's' : ''} · {formatNm(printTotalNm)}</p>
              <p>Généré le {formatDateFR(todayLocalISO(), { long: true })}</p>
            </div>
          </div>
          <PrintStatsStrip stats={stats} />
        </div>

        {printable.length === 0 ? (
          <p className="text-navy-400 text-sm">Aucune navigation à imprimer pour le moment.</p>
        ) : (
          <>
            <div className="sm:hidden print:hidden mt-5">
              {monthGroups.map(([key, group]) => (
                <PrintMonthGroupMobile key={key} monthKey={key} outings={group} />
              ))}
            </div>
            <div className="hidden sm:block print:block overflow-x-auto print:overflow-visible mt-5 print:mt-4">
              {monthGroups.map(([key, group]) => (
                <PrintMonthGroup key={key} monthKey={key} outings={group} />
              ))}
            </div>
          </>
        )}
      </section>

      <ConfirmDialog
        open={!!confirmFile}
        title="Remplacer toutes les données ?"
        description={confirmFile ? `Ce fichier contient ${confirmFile.sorties.length} sortie(s). L'import remplacera intégralement vos données actuelles dans ce navigateur. Cette action est irréversible.` : ''}
        confirmLabel="Importer et remplacer"
        onCancel={() => setConfirmFile(null)}
        onConfirm={confirmImport}
      />
    </div>
  );
}
