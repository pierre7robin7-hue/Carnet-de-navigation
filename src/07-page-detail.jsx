function FatigueBar({ value }) {
  const v = Number(value) || 0;
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={classNames('h-2.5 w-6 rounded-full', i <= v ? 'bg-coral-500' : 'bg-navy-100 dark:bg-navy-700')} />
      ))}
      <span className="text-xs text-navy-400 ml-1">{v}/5</span>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-sand-50 dark:bg-navy-900 rounded-xl p-3.5">
      <p className="text-xs text-navy-400 font-medium">{label}</p>
      <p className="text-lg font-heading font-bold text-navy-900 dark:text-navy-50 mt-0.5 flex items-center gap-1.5 truncate">{value}</p>
    </div>
  );
}

// Carte affichant le trajet entre 2 ports (sortie simple) ou l'itinéraire
// complet à travers N ports (voyage multi-étapes).
function RouteMap({ ports }) {
  const ref = React.useRef(null);
  const resolved = React.useMemo(
    () => (ports || []).map((name) => ({ name, pos: findPort(name) })).filter((p) => p.pos),
    [ports.join('|')]
  );

  React.useEffect(() => {
    if (!ref.current || resolved.length === 0) return;
    const map = L.map(ref.current, { zoomControl: false, attributionControl: false, dragging: true, scrollWheelZoom: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 19, subdomains: 'abcd' }).addTo(map);

    const latlngs = resolved.map((p) => [p.pos.lat, p.pos.lon]);
    let line = null;
    if (latlngs.length >= 2) {
      line = L.polyline(latlngs, { color: '#0f63d1', weight: 3, dashArray: '6 6', lineCap: 'round' }).addTo(map);
      map.fitBounds(line.getBounds(), { padding: [30, 30] });
    } else {
      map.setView(latlngs[0], 11);
    }

    const multi = resolved.length > 2;
    // Un aller-retour / une boucle revisite parfois le même port : sans
    // correction, les points se superposent exactement et cachent leur
    // numéro. On les fait légèrement "s'éventailler" via l'ancre de l'icône
    // (position géographique réelle inchangée, seul l'affichage se décale).
    const seenAt = {};
    resolved.forEach((p, i) => {
      const isFirst = i === 0, isLast = i === resolved.length - 1;
      const color = isFirst ? '#19655e' : isLast ? '#e6674a' : '#0f63d1';
      const posKey = `${p.pos.lat.toFixed(4)},${p.pos.lon.toFixed(4)}`;
      const occurrence = seenAt[posKey] || 0;
      seenAt[posKey] = occurrence + 1;
      const half = multi ? 10 : 7;
      const nudge = occurrence * 9;
      const html = multi
        ? `<div style="width:20px;height:20px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:700;">${i + 1}</div>`
        : `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`;
      const icon = L.divIcon({ className: '', html, iconSize: multi ? [20, 20] : [14, 14], iconAnchor: [half + nudge, half + nudge] });
      L.marker([p.pos.lat, p.pos.lon], { icon }).addTo(map).bindPopup(p.name);
    });

    const raf = requestAnimationFrame(() => {
      map.invalidateSize();
      if (line) map.fitBounds(line.getBounds(), { padding: [30, 30] });
    });
    return () => { cancelAnimationFrame(raf); map.remove(); };
  }, [resolved]);

  if (resolved.length === 0) {
    return (
      <div className="h-48 rounded-xl bg-navy-50 dark:bg-navy-900 flex items-center justify-center text-navy-400 text-sm gap-2">
        <Icon.MapPin size={16} /> Position des ports non répertoriée
      </div>
    );
  }
  return <div ref={ref} className="h-48 rounded-xl overflow-hidden border border-navy-100 dark:border-navy-700" />;
}

function EtapeCard({ leg, index }) {
  const vitesseMoy = leg.dureeMin > 0 ? (leg.distanceNm / (leg.dureeMin / 60)) : 0;
  const meteo = leg.meteo || {};
  const skipper = leg.skipper || {};
  const humeur = humeurInfo(skipper.humeur);

  return (
    <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-soft p-5">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-full bg-gradient-to-br from-ocean-500 to-ocean-700 text-white text-xs font-bold flex items-center justify-center shrink-0">{index + 1}</span>
          <span className="font-heading font-semibold text-navy-900 dark:text-navy-50 truncate">{leg.portDepart} <Icon.ChevronRight size={13} className="inline text-ocean-500" /> {leg.portArrivee}</span>
        </div>
        <span className="text-xs text-navy-400 flex items-center gap-1.5 shrink-0"><Icon.Calendar size={13} /> {formatDateFR(leg.date)}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat label="Distance" value={formatNm(leg.distanceNm)} />
        <MiniStat label="Durée" value={formatDuree(leg.dureeMin)} />
        <MiniStat label="Vitesse moy." value={`${vitesseMoy.toFixed(1)} nds`} />
        <MiniStat label="Ressenti" value={<>{humeur.emoji} {humeur.label}</>} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-4 text-sm">
        <div>
          <p className="text-navy-400 text-xs font-medium mb-1">Météo</p>
          <p className="text-navy-700 dark:text-navy-300">
            {meteo.ventNoeuds != null ? `${meteo.ventNoeuds} nds` : '—'} {meteo.directionVent || ''} · {etatMerLabel(meteo.etatMer)}
          </p>
        </div>
        <div>
          <p className="text-navy-400 text-xs font-medium mb-1.5">Niveau de fatigue</p>
          <FatigueBar value={skipper.fatigue} />
        </div>
      </div>

      {(leg.voiles || []).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {leg.voiles.map((v) => <Badge key={v} tone="ocean">{v}</Badge>)}
        </div>
      )}
      {(leg.equipage || []).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {leg.equipage.map((p) => <Badge key={p} tone="navy">{p}</Badge>)}
        </div>
      )}
      {skipper.notes && (
        <p className="mt-3 text-sm text-navy-700 dark:text-navy-300 bg-sand-50 dark:bg-navy-900 rounded-lg p-3">{skipper.notes}</p>
      )}
      {leg.commentaire && (
        <p className="mt-2 text-sm text-navy-600 dark:text-navy-400 whitespace-pre-wrap">{leg.commentaire}</p>
      )}
    </div>
  );
}

function PhotoGallery({ outing, onChange }) {
  const photos = outing.photos || [];
  const [urls, setUrls] = React.useState({});
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState('');
  const fileInputRef = React.useRef(null);

  React.useEffect(() => {
    let active = true;
    if (photos.length === 0) { setUrls({}); return; }
    Storage.getSignedUrls(photos)
      .then((map) => { if (active) setUrls(map); })
      .catch((err) => console.error('Chargement des photos impossible', err));
    return () => { active = false; };
    // eslint-disable-next-line
  }, [photos.join('|')]);

  const pick = () => fileInputRef.current && fileInputRef.current.click();

  const onFilesChosen = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    if (!navigator.onLine) {
      setError('Connexion internet requise pour ajouter des photos.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const userId = RemoteSync.getUserId();
      const newPaths = [];
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const path = `${userId}/${outing.id}/${uid()}-${safeName}`;
        await Storage.upload(path, file);
        newPaths.push(path);
      }
      onChange([...photos, ...newPaths]);
    } catch (err) {
      console.error('Envoi de photo impossible', err);
      setError('Envoi impossible — vérifie ta connexion et réessaie.');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (path) => {
    onChange(photos.filter((p) => p !== path));
    try {
      await Storage.remove([path]);
    } catch (err) {
      console.error('Suppression du fichier distant impossible', err);
    }
  };

  return (
    <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-soft p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-semibold text-navy-800 dark:text-navy-100 flex items-center gap-2">
          <Icon.Camera size={17} className="text-ocean-600" /> Photos
        </h3>
        <button
          type="button" onClick={pick} disabled={uploading}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ocean-600 dark:text-ocean-300 hover:text-ocean-700 bg-ocean-50 dark:bg-ocean-900/30 hover:bg-ocean-100 dark:hover:bg-ocean-900/50 px-3 py-1.5 rounded-lg disabled:opacity-60"
        >
          <Icon.Plus size={13} /> {uploading ? 'Envoi…' : 'Ajouter'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={onFilesChosen} className="hidden" />
      </div>
      {error && <p className="text-coral-600 dark:text-coral-300 text-xs mb-2">{error}</p>}
      {photos.length === 0 ? (
        <p className="text-navy-400 text-sm">Aucune photo pour cette sortie.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((path) => (
            <div key={path} className="relative aspect-square rounded-lg overflow-hidden bg-navy-50 dark:bg-navy-900 group">
              {urls[path] ? (
                <img src={urls[path]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-navy-300"><Icon.Camera size={20} /></div>
              )}
              <button
                type="button" onClick={() => removePhoto(path)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-navy-950/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Supprimer cette photo"
              >
                <Icon.X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DetailHeader({ outing, title, dateLabel, onDelete, confirmOpen, setConfirmOpen }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="font-heading text-2xl font-bold text-navy-900 dark:text-navy-50">{title}</div>
          <p className="text-navy-400 text-sm mt-1.5 flex items-center gap-1.5">
            <Icon.Calendar size={14} /> {dateLabel}
          </p>
          {outing.bateauModele && (
            <p className="text-navy-400 text-sm mt-1 flex items-center gap-1.5">
              <Icon.Sailboat size={14} /> {outing.bateauModele}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a href={`#/sortie/${outing.id}/modifier`} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-navy-600 dark:text-navy-300 bg-navy-50 dark:bg-navy-700 hover:bg-navy-100 dark:hover:bg-navy-600">
            <Icon.Pencil size={14} /> Modifier
          </a>
          <button onClick={() => setConfirmOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-coral-600 bg-coral-400/10 hover:bg-coral-400/20">
            <Icon.Trash size={14} /> Supprimer
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Supprimer cette navigation ?"
        description="Cette action est définitive et supprimera toutes les informations de cette sortie."
        confirmLabel="Supprimer"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => { setConfirmOpen(false); onDelete(outing.id); }}
      />
    </>
  );
}

function VoyageDetailPage({ outing, onDelete, onPhotosChange, confirmOpen, setConfirmOpen }) {
  const legs = outingLegs(outing);
  const ports = outingPortsVisited(outing);
  const totalNm = outingDistanceTotal(outing);
  const totalDuree = outingDureeTotal(outing);
  const vitesseMoy = totalDuree > 0 ? (totalNm / (totalDuree / 60)) : 0;
  const dateDebut = outingDateDebut(outing), dateFin = outingDateFin(outing);
  const dateLabel = dateDebut === dateFin
    ? formatDateFR(dateDebut, { long: true })
    : `${formatDateFR(dateDebut, { long: true })} → ${formatDateFR(dateFin, { long: true })}`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <a href="#/historique" className="inline-flex items-center gap-1.5 text-navy-500 dark:text-navy-400 hover:text-navy-800 dark:hover:text-navy-100 text-sm font-medium">
        <Icon.ArrowLeft size={16} /> Retour à l’historique
      </a>

      <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-soft p-6">
        <DetailHeader outing={outing} title={outingTitre(outing)} dateLabel={dateLabel} onDelete={onDelete} confirmOpen={confirmOpen} setConfirmOpen={setConfirmOpen} />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <MiniStat label="Distance totale" value={formatNm(totalNm)} />
          <MiniStat label="Durée totale" value={formatDuree(totalDuree)} />
          <MiniStat label="Vitesse moy." value={`${vitesseMoy.toFixed(1)} nds`} />
          <MiniStat label="Étapes" value={legs.length} />
        </div>

        <div className="mt-5">
          <RouteMap ports={ports} />
        </div>
      </div>

      <PhotoGallery outing={outing} onChange={(photos) => onPhotosChange(outing, photos)} />

      <div>
        <h2 className="font-heading font-semibold text-navy-800 dark:text-navy-100 mb-3">Itinéraire</h2>
        <div className="space-y-4">
          {legs.map((leg, i) => <EtapeCard key={i} leg={leg} index={i} />)}
        </div>
      </div>
    </div>
  );
}

function SimpleDetailPage({ outing, onDelete, onPhotosChange, confirmOpen, setConfirmOpen }) {
  const vitesseMoy = outing.dureeMin > 0 ? (outing.distanceNm / (outing.dureeMin / 60)) : 0;
  const meteo = outing.meteo || {};
  const skipper = outing.skipper || {};
  const humeur = humeurInfo(skipper.humeur);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <a href="#/historique" className="inline-flex items-center gap-1.5 text-navy-500 dark:text-navy-400 hover:text-navy-800 dark:hover:text-navy-100 text-sm font-medium">
        <Icon.ArrowLeft size={16} /> Retour à l’historique
      </a>

      <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-soft p-6">
        <DetailHeader
          outing={outing}
          title={<span className="flex items-center gap-2">{outing.portDepart}<Icon.ChevronRight size={20} className="text-ocean-500" />{outing.portArrivee}</span>}
          dateLabel={formatDateFR(outing.date, { long: true })}
          onDelete={onDelete} confirmOpen={confirmOpen} setConfirmOpen={setConfirmOpen}
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <MiniStat label="Distance" value={formatNm(outing.distanceNm)} />
          <MiniStat label="Durée" value={formatDuree(outing.dureeMin)} />
          <MiniStat label="Vitesse moy." value={`${vitesseMoy.toFixed(1)} nds`} />
          <MiniStat label="Ressenti" value={<>{humeur.emoji} {humeur.label}</>} />
        </div>

        <div className="mt-5">
          <RouteMap ports={[outing.portDepart, outing.portArrivee]} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-soft p-5">
          <h3 className="font-heading font-semibold text-navy-800 dark:text-navy-100 flex items-center gap-2 mb-3">
            <Icon.Wind size={17} className="text-ocean-600" /> Conditions météo
          </h3>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between"><dt className="text-navy-400">Vent</dt><dd className="font-medium text-navy-800 dark:text-navy-200">{meteo.ventNoeuds != null ? `${meteo.ventNoeuds} nds` : '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-navy-400">Direction</dt><dd className="font-medium text-navy-800 dark:text-navy-200">{meteo.directionVent || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-navy-400">État de la mer</dt><dd className="font-medium text-navy-800 dark:text-navy-200">{etatMerLabel(meteo.etatMer)}</dd></div>
          </dl>
        </div>

        <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-soft p-5">
          <h3 className="font-heading font-semibold text-navy-800 dark:text-navy-100 flex items-center gap-2 mb-3">
            <Icon.Gauge size={17} className="text-ocean-600" /> Ressenti du skipper
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-navy-400">Humeur</span>
              <span className="font-medium text-navy-800 dark:text-navy-200 flex items-center gap-1.5">{humeur.emoji} {humeur.label}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-navy-400">Niveau de fatigue</span>
              <FatigueBar value={skipper.fatigue} />
            </div>
            {skipper.notes && (
              <div>
                <span className="text-navy-400 block mb-1">Notes</span>
                <p className="text-navy-700 dark:text-navy-300 bg-sand-50 dark:bg-navy-900 rounded-lg p-3">{skipper.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-soft p-5">
          <h3 className="font-heading font-semibold text-navy-800 dark:text-navy-100 flex items-center gap-2 mb-3">
            <Icon.Sailboat size={17} className="text-ocean-600" /> Voiles utilisées
          </h3>
          {(outing.voiles || []).length ? (
            <div className="flex flex-wrap gap-2">
              {outing.voiles.map((v) => <Badge key={v} tone="ocean">{v}</Badge>)}
            </div>
          ) : <p className="text-navy-400 text-sm">Non renseigné</p>}
        </div>

        <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-soft p-5">
          <h3 className="font-heading font-semibold text-navy-800 dark:text-navy-100 flex items-center gap-2 mb-3">
            <Icon.Users size={17} className="text-ocean-600" /> Équipage
          </h3>
          {(outing.equipage || []).length ? (
            <div className="flex flex-wrap gap-2">
              {outing.equipage.map((p) => <Badge key={p} tone="navy">{p}</Badge>)}
            </div>
          ) : <p className="text-navy-400 text-sm">Non renseigné</p>}
        </div>
      </div>

      {outing.commentaire && (
        <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-soft p-5">
          <h3 className="font-heading font-semibold text-navy-800 dark:text-navy-100 mb-2">Commentaire</h3>
          <p className="text-navy-700 dark:text-navy-300 text-sm whitespace-pre-wrap">{outing.commentaire}</p>
        </div>
      )}

      <PhotoGallery outing={outing} onChange={(photos) => onPhotosChange(outing, photos)} />
    </div>
  );
}

function OutingDetailPage({ outing, onDelete, onPhotosChange }) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  if (!outing) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <EmptyState title="Navigation introuvable" description="Cette sortie n’existe pas ou a été supprimée." action={<a href="#/historique" className="text-ocean-600 font-medium text-sm hover:underline">Retour à l’historique</a>} />
      </div>
    );
  }

  if (isVoyage(outing)) {
    return <VoyageDetailPage outing={outing} onDelete={onDelete} onPhotosChange={onPhotosChange} confirmOpen={confirmOpen} setConfirmOpen={setConfirmOpen} />;
  }
  return <SimpleDetailPage outing={outing} onDelete={onDelete} onPhotosChange={onPhotosChange} confirmOpen={confirmOpen} setConfirmOpen={setConfirmOpen} />;
}
