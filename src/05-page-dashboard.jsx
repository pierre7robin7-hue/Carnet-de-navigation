function computeStats(outings) {
  const totalSorties = outings.length;
  const totalNm = outings.reduce((sum, o) => sum + outingDistanceTotal(o), 0);

  const portCounts = {};
  outings.forEach((o) => {
    outingLegs(o).forEach((l) => {
      [l.portDepart, l.portArrivee].forEach((p) => {
        if (!p) return;
        portCounts[p] = (portCounts[p] || 0) + 1;
      });
    });
  });
  let topPort = null, topCount = 0;
  Object.entries(portCounts).forEach(([port, count]) => {
    if (count > topCount || (count === topCount && topPort && port < topPort)) {
      topPort = port; topCount = count;
    }
  });

  return { totalSorties, totalNm, topPort, topCount };
}

function computeBoatStats(outings) {
  const map = {};
  outings.forEach((o) => {
    const boat = (o.bateauModele || '').trim();
    if (!boat) return;
    if (!map[boat]) map[boat] = { boat, count: 0, distance: 0 };
    map[boat].count += 1;
    map[boat].distance += outingDistanceTotal(o);
  });
  return Object.values(map).sort((a, b) => b.distance - a.distance);
}

function last12MonthsData(outings) {
  const now = new Date();
  const buckets = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets.push({ key, label: MOIS_COURTS[d.getMonth()], value: 0 });
  }
  const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]));
  // On agrège au niveau de chaque étape (et non de la sortie) pour qu'un
  // voyage de plusieurs jours répartisse bien sa distance sur les bons mois.
  outings.forEach((o) => {
    outingLegs(o).forEach((l) => {
      const k = monthKey(l.date);
      if (byKey[k]) byKey[k].value += Number(l.distanceNm) || 0;
    });
  });
  return buckets;
}

function DashboardPage({ outings }) {
  const stats = React.useMemo(() => computeStats(outings), [outings]);
  const chartData = React.useMemo(() => last12MonthsData(outings), [outings]);
  const boatStats = React.useMemo(() => computeBoatStats(outings), [outings]);
  const lastThree = outings.slice(0, 3);
  const maxBoatDistance = Math.max(1, ...boatStats.map((b) => b.distance));

  if (outings.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <EmptyState
          title="Aucune navigation enregistrée"
          description="Commencez par ajouter votre première sortie pour voir apparaître vos statistiques et votre historique."
          action={
            <a href="#/nouvelle" className="mt-2 inline-flex items-center gap-1.5 bg-gradient-to-r from-ocean-500 to-ocean-600 hover:from-ocean-400 hover:to-ocean-500 text-white font-semibold text-sm shadow-glow hover:shadow-glow-lg transition-all px-4 py-2.5 rounded-lg">
              <Icon.Plus size={16} /> Ajouter une sortie
            </a>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <PageHeader title="Tableau de bord" subtitle="Vue d’ensemble de vos navigations" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Icon.Notebook} label="Sorties enregistrées" value={stats.totalSorties} />
        <StatCard icon={Icon.Route} label="Milles parcourus" value={formatNm(stats.totalNm)} />
        <StatCard icon={Icon.MapPin} label="Port le plus fréquenté" value={stats.topPort || '—'} sub={stats.topCount ? `${stats.topCount} passages` : ''} />
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-5 sm:p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-heading font-semibold text-navy-800">Distance par mois</h2>
          <span className="text-xs text-navy-400">12 derniers mois</span>
        </div>
        <MonthlyChart data={chartData} />
      </div>

      {boatStats.length > 0 && (
        <div className="bg-white rounded-2xl shadow-soft p-5 sm:p-6">
          <h2 className="font-heading font-semibold text-navy-800 mb-4">Par bateau</h2>
          <div className="space-y-4">
            {boatStats.map((b) => (
              <div key={b.boat}>
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <span className="flex items-center gap-2 font-medium text-navy-800 text-sm truncate">
                    <Icon.Sailboat size={15} className="text-ocean-500 shrink-0" /> {b.boat}
                  </span>
                  <span className="text-xs text-navy-400 shrink-0">{b.count} sortie{b.count > 1 ? 's' : ''} · {formatNm(b.distance)}</span>
                </div>
                <div className="h-2 rounded-full bg-navy-50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-ocean-400 to-ocean-600"
                    style={{ width: `${Math.max(4, (b.distance / maxBoatDistance) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-semibold text-navy-800">Dernières navigations</h2>
          <a href="#/historique" className="text-ocean-600 text-sm font-medium hover:underline">Voir tout l’historique</a>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lastThree.map((o) => <OutingCard key={o.id} outing={o} />)}
        </div>
      </div>
    </div>
  );
}
