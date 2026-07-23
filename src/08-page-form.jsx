function emptyLeg(dateDefault) {
  return {
    portDepart: '', portArrivee: '', date: dateDefault || new Date().toISOString().slice(0, 10),
    distanceNm: '', dureeH: '', dureeM: '',
    meteo: { ventNoeuds: '', directionVent: 'NO', etatMer: 'peu_agitee' },
    skipper: { humeur: 'bon', fatigue: 2, notes: '' },
    voiles: [], equipage: [], commentaire: '',
  };
}

function legToForm(leg) {
  const h = Math.floor((leg.dureeMin || 0) / 60);
  const m = (leg.dureeMin || 0) % 60;
  return {
    portDepart: leg.portDepart || '', portArrivee: leg.portArrivee || '', date: leg.date || '',
    distanceNm: leg.distanceNm != null ? String(leg.distanceNm) : '',
    dureeH: String(h), dureeM: String(m),
    meteo: { ventNoeuds: leg.meteo && leg.meteo.ventNoeuds != null ? String(leg.meteo.ventNoeuds) : '', directionVent: (leg.meteo && leg.meteo.directionVent) || 'NO', etatMer: (leg.meteo && leg.meteo.etatMer) || 'peu_agitee' },
    skipper: { humeur: (leg.skipper && leg.skipper.humeur) || 'bon', fatigue: (leg.skipper && leg.skipper.fatigue) || 2, notes: (leg.skipper && leg.skipper.notes) || '' },
    voiles: leg.voiles || [], equipage: leg.equipage || [], commentaire: leg.commentaire || '',
  };
}

function legFormToLeg(f) {
  return {
    portDepart: f.portDepart.trim(), portArrivee: f.portArrivee.trim(), date: f.date,
    distanceNm: Number(f.distanceNm) || 0,
    dureeMin: (Number(f.dureeH) || 0) * 60 + (Number(f.dureeM) || 0),
    meteo: {
      ventNoeuds: f.meteo.ventNoeuds === '' ? null : Number(f.meteo.ventNoeuds),
      directionVent: f.meteo.directionVent, etatMer: f.meteo.etatMer,
    },
    skipper: { humeur: f.skipper.humeur, fatigue: Number(f.skipper.fatigue), notes: f.skipper.notes.trim() },
    voiles: f.voiles, equipage: f.equipage, commentaire: f.commentaire.trim(),
  };
}

function legIsValid(f) {
  return !!(f.portDepart.trim() && f.portArrivee.trim() && f.date) && Number(f.distanceNm) >= 0;
}

// Regroupe tous les champs d'une étape (trajet, météo, ressenti, voiles,
// équipage, commentaire). Réutilisé tel quel pour une sortie simple (une
// seule étape) ou répété pour chaque étape d'un voyage multi-étapes.
function LegFormFields({ leg, onChange }) {
  const [crewInput, setCrewInput] = React.useState('');

  const set = (path, value) => {
    if (path.includes('.')) {
      const [a, b] = path.split('.');
      onChange({ ...leg, [a]: { ...leg[a], [b]: value } });
    } else {
      onChange({ ...leg, [path]: value });
    }
  };

  const toggleVoile = (voile) => {
    onChange({ ...leg, voiles: leg.voiles.includes(voile) ? leg.voiles.filter((v) => v !== voile) : [...leg.voiles, voile] });
  };

  const addCrew = () => {
    const name = crewInput.trim();
    if (!name) return;
    if (!leg.equipage.includes(name)) onChange({ ...leg, equipage: [...leg.equipage, name] });
    setCrewInput('');
  };
  const removeCrew = (name) => onChange({ ...leg, equipage: leg.equipage.filter((n) => n !== name) });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading font-semibold text-navy-800 flex items-center gap-2 mb-3"><Icon.Route size={16} className="text-ocean-600" /> Trajet</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Port de départ" required>
            <input list="ports-datalist" className={inputClass} value={leg.portDepart} onChange={(e) => set('portDepart', e.target.value)} placeholder="Ex. La Trinité-sur-Mer" />
          </Field>
          <Field label="Port d’arrivée" required>
            <input list="ports-datalist" className={inputClass} value={leg.portArrivee} onChange={(e) => set('portArrivee', e.target.value)} placeholder="Ex. Île de Groix" />
          </Field>
          <Field label="Date" required>
            <input type="date" className={inputClass} value={leg.date} onChange={(e) => set('date', e.target.value)} />
          </Field>
          <Field label="Distance parcourue (MN)" required>
            <input type="number" min="0" step="0.1" className={inputClass} value={leg.distanceNm} onChange={(e) => set('distanceNm', e.target.value)} placeholder="0" />
          </Field>
          <Field label="Durée de navigation">
            <div className="flex gap-2 items-center">
              <input type="number" min="0" className={inputClass} value={leg.dureeH} onChange={(e) => set('dureeH', e.target.value)} placeholder="0" />
              <span className="text-navy-400 text-sm shrink-0">h</span>
              <input type="number" min="0" max="59" className={inputClass} value={leg.dureeM} onChange={(e) => set('dureeM', e.target.value)} placeholder="0" />
              <span className="text-navy-400 text-sm shrink-0">min</span>
            </div>
          </Field>
        </div>
      </div>

      <div className="border-t border-navy-50 pt-4">
        <h3 className="font-heading font-semibold text-navy-800 flex items-center gap-2 mb-3"><Icon.Wind size={16} className="text-ocean-600" /> Conditions météo</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Vent (noeuds)">
            <input type="number" min="0" className={inputClass} value={leg.meteo.ventNoeuds} onChange={(e) => set('meteo.ventNoeuds', e.target.value)} placeholder="0" />
          </Field>
          <Field label="Direction du vent">
            <select className={inputClass} value={leg.meteo.directionVent} onChange={(e) => set('meteo.directionVent', e.target.value)}>
              {DIRECTIONS_VENT.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="État de la mer">
            <select className={inputClass} value={leg.meteo.etatMer} onChange={(e) => set('meteo.etatMer', e.target.value)}>
              {ETATS_MER.map((e2) => <option key={e2.value} value={e2.value}>{e2.label}</option>)}
            </select>
          </Field>
        </div>
      </div>

      <div className="border-t border-navy-50 pt-4">
        <h3 className="font-heading font-semibold text-navy-800 flex items-center gap-2 mb-3"><Icon.Gauge size={16} className="text-ocean-600" /> Ressenti du skipper</h3>
        <div className="space-y-4">
          <Field label="Humeur">
            <div className="flex flex-wrap gap-2">
              {HUMEURS.map((h) => (
                <button
                  type="button" key={h.value} onClick={() => set('skipper.humeur', h.value)}
                  className={classNames(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                    leg.skipper.humeur === h.value ? 'bg-ocean-50 border-ocean-400 text-ocean-700' : 'border-navy-100 text-navy-500 hover:bg-navy-50'
                  )}
                >
                  <span className="text-base">{h.emoji}</span> {h.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label={`Niveau de fatigue : ${leg.skipper.fatigue}/5`}>
            <input type="range" min="1" max="5" step="1" value={leg.skipper.fatigue} onChange={(e) => set('skipper.fatigue', e.target.value)} className="w-full accent-ocean-500" />
          </Field>
          <Field label="Notes libres">
            <textarea rows={3} className={inputClass} value={leg.skipper.notes} onChange={(e) => set('skipper.notes', e.target.value)} placeholder="Ressenti, anecdotes, difficultés rencontrées…" />
          </Field>
        </div>
      </div>

      <div className="border-t border-navy-50 pt-4">
        <h3 className="font-heading font-semibold text-navy-800 flex items-center gap-2 mb-3"><Icon.Sailboat size={16} className="text-ocean-600" /> Voiles utilisées</h3>
        <div className="flex flex-wrap gap-2">
          {VOILES_DISPONIBLES.map((v) => (
            <button
              type="button" key={v} onClick={() => toggleVoile(v)}
              className={classNames(
                'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                leg.voiles.includes(v) ? 'bg-navy-800 border-navy-800 text-white' : 'border-navy-100 text-navy-500 hover:bg-navy-50'
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-navy-50 pt-4">
        <h3 className="font-heading font-semibold text-navy-800 flex items-center gap-2 mb-3"><Icon.Users size={16} className="text-ocean-600" /> Équipage à bord</h3>
        <div className="flex gap-2">
          <input
            className={inputClass} value={crewInput} onChange={(e) => setCrewInput(e.target.value)}
            placeholder="Nom de l’équipier·ère"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCrew(); } }}
          />
          <button type="button" onClick={addCrew} className="shrink-0 px-4 rounded-lg bg-navy-800 text-white text-sm font-medium hover:bg-navy-700">Ajouter</button>
        </div>
        {leg.equipage.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {leg.equipage.map((n) => (
              <span key={n} className="inline-flex items-center gap-1.5 bg-navy-50 text-navy-700 text-sm font-medium pl-3 pr-1.5 py-1 rounded-full">
                {n}
                <button type="button" onClick={() => removeCrew(n)} className="text-navy-400 hover:text-coral-500"><Icon.X size={13} /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-navy-50 pt-4">
        <h3 className="font-heading font-semibold text-navy-800 mb-3">Commentaire libre</h3>
        <textarea rows={3} className={inputClass} value={leg.commentaire} onChange={(e) => set('commentaire', e.target.value)} placeholder="Manoeuvres, incidents techniques, mouillages, observations…" />
      </div>
    </div>
  );
}

function ModeToggle({ mode, setMode }) {
  const options = [
    { value: 'simple', label: 'Sortie simple', icon: Icon.Sailboat, hint: 'Un aller entre deux ports, en une journée' },
    { value: 'voyage', label: 'Voyage multi-étapes', icon: Icon.Route, hint: 'Plusieurs jours, avec escales' },
  ];
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {options.map((o) => (
        <button
          key={o.value} type="button" onClick={() => setMode(o.value)}
          className={classNames(
            'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-colors',
            mode === o.value ? 'bg-ocean-50 border-ocean-400' : 'bg-white border-navy-100 hover:border-navy-200'
          )}
        >
          <span className={classNames('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', mode === o.value ? 'bg-ocean-500 text-white' : 'bg-navy-50 text-navy-400')}>
            <o.icon size={18} />
          </span>
          <span>
            <span className={classNames('block font-semibold text-sm', mode === o.value ? 'text-ocean-700' : 'text-navy-700')}>{o.label}</span>
            <span className="block text-xs text-navy-400 mt-0.5">{o.hint}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function OutingFormPage({ existing, onSubmit }) {
  const isEdit = !!existing;
  const [mode, setMode] = React.useState(isEdit && isVoyage(existing) ? 'voyage' : 'simple');
  const [titre, setTitre] = React.useState((isEdit && existing.titre) || '');
  const [bateauModele, setBateauModele] = React.useState((isEdit && existing.bateauModele) || '');
  const [leg, setLeg] = React.useState(() => (isEdit && !isVoyage(existing) ? legToForm(existing) : emptyLeg()));
  const [etapes, setEtapes] = React.useState(() => {
    if (isEdit && isVoyage(existing)) return existing.etapes.map(legToForm);
    return [emptyLeg(), emptyLeg()];
  });
  const [error, setError] = React.useState('');

  const changeMode = (next) => {
    if (next === mode) return;
    if (next === 'voyage') setEtapes([leg, emptyLeg()]);
    else setLeg(etapes[0]);
    setMode(next);
    setError('');
  };

  const updateEtape = (i, updated) => setEtapes((list) => list.map((e, idx) => (idx === i ? updated : e)));
  const addEtape = () => setEtapes((list) => [...list, emptyLeg(list[list.length - 1] && list[list.length - 1].date)]);
  const removeEtape = (i) => setEtapes((list) => (list.length > 2 ? list.filter((_, idx) => idx !== i) : list));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'simple') {
      if (!leg.portDepart.trim() || !leg.portArrivee.trim() || !leg.date) {
        setError('Merci de renseigner au minimum le port de départ, le port d’arrivée et la date.');
        return;
      }
      if (Number(leg.distanceNm) < 0) {
        setError('La distance ne peut pas être négative.');
        return;
      }
      setError('');
      onSubmit({ type: 'simple', bateauModele: bateauModele.trim(), ...legFormToLeg(leg) });
    } else {
      if (etapes.length < 2) {
        setError('Un voyage nécessite au moins 2 étapes.');
        return;
      }
      const invalidIndex = etapes.findIndex((et) => !legIsValid(et));
      if (invalidIndex !== -1) {
        setError(`Étape ${invalidIndex + 1} : merci de renseigner le port de départ, le port d’arrivée, la date et une distance valide.`);
        return;
      }
      setError('');
      onSubmit({ type: 'voyage', titre: titre.trim(), bateauModele: bateauModele.trim(), etapes: etapes.map(legFormToLeg) });
    }
  };

  const cancelHref = isEdit ? `#/sortie/${existing.id}` : '#/historique';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <a href={cancelHref} className="inline-flex items-center gap-1.5 text-navy-500 hover:text-navy-800 text-sm font-medium mb-4">
        <Icon.ArrowLeft size={16} /> Annuler
      </a>
      <h1 className="font-heading text-2xl sm:text-3xl font-bold text-navy-900 mb-6">
        {isEdit ? 'Modifier la sortie' : 'Nouvelle sortie'}
      </h1>

      {error && (
        <div className="bg-coral-400/10 text-coral-600 text-sm rounded-lg px-4 py-3 mb-5 font-medium">{error}</div>
      )}

      <datalist id="ports-datalist">
        {allKnownPortNames().map((name) => <option key={name} value={name} />)}
      </datalist>

      <form onSubmit={handleSubmit} className="space-y-6">
        <ModeToggle mode={mode} setMode={changeMode} />

        <section className="bg-white rounded-2xl shadow-soft p-5 space-y-4">
          {mode === 'voyage' && (
            <Field label="Titre du voyage" hint="Optionnel — sinon généré à partir des ports de départ et d’arrivée">
              <input className={inputClass} value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex. Croisière Belle-Île — 3 jours" />
            </Field>
          )}
          <Field label="Modèle du bateau" hint="Optionnel">
            <input className={inputClass} value={bateauModele} onChange={(e) => setBateauModele(e.target.value)} placeholder="Ex. Bénéteau Océanis 38" />
          </Field>
        </section>

        {mode === 'simple' ? (
          <section className="bg-white rounded-2xl shadow-soft p-5">
            <LegFormFields leg={leg} onChange={setLeg} />
          </section>
        ) : (
          <>
            {etapes.map((et, i) => (
              <section key={i} className="bg-white rounded-2xl shadow-soft p-5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-gradient-to-br from-ocean-500 to-ocean-700 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <span className="font-heading font-semibold text-navy-800">Étape {i + 1}</span>
                  </div>
                  {etapes.length > 2 && (
                    <button type="button" onClick={() => removeEtape(i)} className="inline-flex items-center gap-1 text-xs font-medium text-coral-600 hover:text-coral-700 px-2 py-1 rounded-lg hover:bg-coral-400/10">
                      <Icon.Trash size={13} /> Retirer cette étape
                    </button>
                  )}
                </div>
                <LegFormFields leg={et} onChange={(updated) => updateEtape(i, updated)} />
              </section>
            ))}

            <button
              type="button" onClick={addEtape}
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border-2 border-dashed border-navy-200 text-navy-500 text-sm font-medium hover:border-ocean-400 hover:text-ocean-600 hover:bg-ocean-50/50 transition-colors"
            >
              <Icon.Plus size={16} /> Ajouter une étape
            </button>
          </>
        )}

        <div className="flex justify-end gap-3 pb-4">
          <a href={cancelHref} className="px-4 py-2.5 rounded-lg text-sm font-medium text-navy-600 hover:bg-navy-50">Annuler</a>
          <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-ocean-500 to-ocean-600 hover:from-ocean-400 hover:to-ocean-500 text-white shadow-glow hover:shadow-glow-lg transition-all">
            {isEdit ? 'Enregistrer les modifications' : 'Enregistrer la sortie'}
          </button>
        </div>
      </form>
    </div>
  );
}
