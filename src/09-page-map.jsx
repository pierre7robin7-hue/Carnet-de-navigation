// Leaflet (CSS + JS, ~150 Ko) n'est utile que sur cette page : le charger à
// la demande évite de ralentir le premier affichage du tableau de bord et de
// l'historique, bien plus consultés au quotidien.
let leafletPromise = null;
function loadLeaflet() {
  if (window.L) return Promise.resolve();
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Chargement de la carte impossible — vérifie ta connexion.'));
    document.head.appendChild(script);
  });
  return leafletPromise;
}

function buildMapData(outings) {
  const portVisits = {}; // name -> count
  const unresolved = new Set();

  // Chaque étape (d'une sortie simple ou d'un voyage multi-étapes) compte
  // pour la fréquentation de ses ports de départ et d'arrivée.
  outings.forEach((o) => {
    outingLegs(o).forEach((l) => {
      [l.portDepart, l.portArrivee].forEach((name) => {
        if (!name) return;
        portVisits[name] = (portVisits[name] || 0) + 1;
        if (!findPort(name)) unresolved.add(name);
      });
    });
  });

  return { portVisits, unresolved: Array.from(unresolved) };
}

async function geocodePortName(name) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(`${name} port`)}`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'fr' } });
  if (!res.ok) throw new Error('Recherche indisponible');
  const data = await res.json();
  if (!data.length) throw new Error('Aucun résultat');
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

// Un port saisi librement (absent de la base intégrée) atterrit ici tant
// qu'il n'a pas de coordonnées : recherche automatique (OpenStreetMap) avec
// repli sur une saisie manuelle si la recherche échoue ou est indisponible.
function UnresolvedPortRow({ name, onResolved }) {
  const [status, setStatus] = React.useState('idle'); // idle | loading | manual
  const [manualLat, setManualLat] = React.useState('');
  const [manualLon, setManualLon] = React.useState('');
  const [error, setError] = React.useState('');

  const geocode = async () => {
    setStatus('loading');
    setError('');
    try {
      const { lat, lon } = await geocodePortName(name);
      CustomPorts.setCoords(name, lat, lon);
      onResolved();
    } catch (e) {
      setError('Introuvable automatiquement — entrez les coordonnées.');
      setStatus('manual');
    }
  };

  const saveManual = () => {
    const lat = Number(manualLat), lon = Number(manualLon);
    if (!manualLat || !manualLon || Number.isNaN(lat) || Number.isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError('Coordonnées invalides (latitude -90 à 90, longitude -180 à 180).');
      return;
    }
    CustomPorts.setCoords(name, lat, lon);
    onResolved();
  };

  return (
    <div className="py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Icon.MapPin size={13} className="text-coral-500 shrink-0" />
        <span className="text-sm font-medium text-navy-700 dark:text-navy-300">{name}</span>
        {status !== 'manual' ? (
          <button
            type="button" onClick={geocode} disabled={status === 'loading'}
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-ocean-600 hover:text-ocean-700 bg-ocean-50 hover:bg-ocean-100 px-3 py-1.5 rounded-lg disabled:opacity-60"
          >
            {status === 'loading' ? 'Recherche…' : 'Localiser'}
          </button>
        ) : (
          <div className="ml-auto flex items-center gap-1.5">
            <input type="number" step="any" placeholder="Latitude" value={manualLat} onChange={(e) => setManualLat(e.target.value)} className={classNames(inputClass, 'w-28 py-1.5')} />
            <input type="number" step="any" placeholder="Longitude" value={manualLon} onChange={(e) => setManualLon(e.target.value)} className={classNames(inputClass, 'w-28 py-1.5')} />
            <button type="button" onClick={saveManual} className="text-xs font-semibold text-white bg-ocean-600 hover:bg-ocean-500 px-3 py-1.5 rounded-lg">Enregistrer</button>
          </div>
        )}
      </div>
      {error && <p className="text-coral-500 text-xs mt-1.5">{error}</p>}
    </div>
  );
}

function MapPage({ outings }) {
  const ref = React.useRef(null);
  const [resolveTick, setResolveTick] = React.useState(0);
  const [mapError, setMapError] = React.useState(null);
  const { portVisits, unresolved } = React.useMemo(() => buildMapData(outings), [outings, resolveTick]);

  React.useEffect(() => {
    if (!ref.current) return;
    let map = null;
    let raf = null;
    let cancelled = false;

    loadLeaflet().then(() => {
      if (cancelled || !ref.current) return;
      map = L.map(ref.current, { scrollWheelZoom: true, zoomControl: false, attributionControl: false });
      L.control.zoom({ position: 'topright' }).addTo(map);
      L.control.attribution({ prefix: false, position: 'bottomright' })
        .addAttribution('© <a href="https://carto.com/attributions">CARTO</a> · © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>')
        .addTo(map);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19, subdomains: 'abcd',
      }).addTo(map);

      const bounds = [];
      const maxVisits = Math.max(1, ...Object.values(portVisits));

      Object.entries(portVisits).forEach(([name, count]) => {
        const p = findPort(name);
        if (!p) return;
        const radius = 7 + (count / maxVisits) * 8;
        const marker = L.circleMarker([p.lat, p.lon], {
          radius, color: '#ffffff', weight: 2, fillColor: '#e6674a', fillOpacity: 0.9,
        }).addTo(map);
        marker.bindTooltip(name, { direction: 'top', offset: [0, -radius], className: 'port-tooltip' });
        marker.bindPopup(`<strong>${name}</strong><br/>${count} passage${count > 1 ? 's' : ''}`);
        marker.on('mouseover', function () { this.setStyle({ fillOpacity: 1, radius: radius * 1.15 }); });
        marker.on('mouseout', function () { this.setStyle({ fillOpacity: 0.9, radius }); });
        bounds.push([p.lat, p.lon]);
      });

      if (bounds.length) {
        map.fitBounds(bounds, { padding: [40, 40] });
      } else {
        map.setView([46.6, -2], 5);
      }

      // Le conteneur peut ne pas encore avoir ses dimensions finales (classes
      // Tailwind CDN appliquées de façon asynchrone) au moment de l'init : on
      // force un recalcul une fois la mise en page stabilisée.
      raf = requestAnimationFrame(() => {
        map.invalidateSize();
        if (bounds.length) map.fitBounds(bounds, { padding: [40, 40] });
      });
    }).catch((err) => setMapError(err.message));

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      if (map) map.remove();
    };
  }, [portVisits]);

  const portCount = Object.keys(portVisits).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-4">
      <PageHeader
        title="Carte des navigations"
        subtitle={outings.length ? `${portCount} port${portCount > 1 ? 's' : ''} visité${portCount > 1 ? 's' : ''}` : 'Ports visités lors de vos navigations'}
      />

      {mapError && (
        <div className="text-sm rounded-lg px-4 py-3 font-medium bg-coral-400/10 text-coral-600">{mapError}</div>
      )}

      {outings.length === 0 ? (
        <EmptyState title="Aucune navigation à afficher" description="Ajoutez des sorties pour voir vos ports apparaître sur la carte." />
      ) : (
        <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-soft overflow-hidden">
          <div ref={ref} style={{ height: '65vh', minHeight: 360 }} />
          <div className="flex flex-wrap items-center gap-4 px-5 py-3.5 border-t border-navy-50 dark:border-navy-700 text-xs text-navy-400">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-coral-500 inline-block border-2 border-white shadow-sm" /> Port (taille = fréquentation)</span>
          </div>

          {unresolved.length > 0 && (
            <div className="px-5 py-4 border-t border-navy-50 dark:border-navy-700">
              <p className="text-xs font-semibold text-navy-500 dark:text-navy-300 mb-1 flex items-center gap-1.5">
                Ports à localiser ({unresolved.length})
              </p>
              <p className="text-xs text-navy-300 dark:text-navy-500 mb-1">
                Ces ports ont été saisis mais n’ont pas encore de position : recherchez-les (connexion internet requise) ou entrez leurs coordonnées.
              </p>
              <div className="divide-y divide-navy-50 dark:divide-navy-700">
                {unresolved.map((name) => (
                  <UnresolvedPortRow key={name} name={name} onResolved={() => setResolveTick((t) => t + 1)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
