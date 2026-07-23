function HistoryPage({ outings }) {
  const [filters, setFilters] = React.useState({ dateFrom: '', dateTo: '', port: '', etatMer: '', directionVent: '' });

  const allPorts = React.useMemo(() => {
    const set = new Set();
    outings.forEach((o) => outingLegs(o).forEach((l) => {
      if (l.portDepart) set.add(l.portDepart);
      if (l.portArrivee) set.add(l.portArrivee);
    }));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [outings]);

  // Une sortie « matche » si au moins une de ses étapes correspond aux
  // filtres (une seule étape suffit à faire remonter tout le voyage).
  const filtered = React.useMemo(() => {
    return outings.filter((o) => outingLegs(o).some((l) => {
      if (filters.dateFrom && l.date < filters.dateFrom) return false;
      if (filters.dateTo && l.date > filters.dateTo) return false;
      if (filters.port && l.portDepart !== filters.port && l.portArrivee !== filters.port) return false;
      if (filters.etatMer && (!l.meteo || l.meteo.etatMer !== filters.etatMer)) return false;
      if (filters.directionVent && (!l.meteo || l.meteo.directionVent !== filters.directionVent)) return false;
      return true;
    }));
  }, [outings, filters]);

  const setFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));
  const resetFilters = () => setFilters({ dateFrom: '', dateTo: '', port: '', etatMer: '', directionVent: '' });
  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader
        title="Historique"
        subtitle={`${filtered.length} navigation${filtered.length > 1 ? 's' : ''} ${hasActiveFilters ? 'correspondant aux filtres' : 'au total'}`}
      />

      <div className="bg-white rounded-2xl shadow-soft p-5">
        <div className="flex items-center gap-2 text-navy-700 font-medium text-sm mb-4">
          <Icon.Filter size={16} className="text-ocean-600" /> Filtres
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Field label="Du">
            <input type="date" value={filters.dateFrom} onChange={setFilter('dateFrom')} className={inputClass} />
          </Field>
          <Field label="Au">
            <input type="date" value={filters.dateTo} onChange={setFilter('dateTo')} className={inputClass} />
          </Field>
          <Field label="Port">
            <select value={filters.port} onChange={setFilter('port')} className={inputClass}>
              <option value="">Tous les ports</option>
              {allPorts.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="État de la mer">
            <select value={filters.etatMer} onChange={setFilter('etatMer')} className={inputClass}>
              <option value="">Tous</option>
              {ETATS_MER.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </Field>
          <Field label="Direction du vent">
            <select value={filters.directionVent} onChange={setFilter('directionVent')} className={inputClass}>
              <option value="">Toutes</option>
              {DIRECTIONS_VENT.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
        </div>
        {hasActiveFilters && (
          <button onClick={resetFilters} className="mt-4 text-sm text-ocean-600 font-medium hover:underline flex items-center gap-1">
            <Icon.X size={14} /> Réinitialiser les filtres
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Icon.Filter}
          title="Aucun résultat"
          description="Aucune navigation ne correspond à ces filtres. Essayez d’élargir vos critères."
          action={<button onClick={resetFilters} className="mt-2 text-ocean-600 font-medium text-sm hover:underline">Réinitialiser les filtres</button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((o) => <OutingCard key={o.id} outing={o} />)}
        </div>
      )}
    </div>
  );
}
