const STORAGE_KEY = 'carnet-navigation.sorties.v1';

function readAll() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Lecture localStorage impossible', e);
    return [];
  }
}

function writeAll(list) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

const CUSTOM_PORTS_KEY = 'carnet-navigation.ports-personnalises.v1';

function readCustomPorts() {
  try {
    const raw = window.localStorage.getItem(CUSTOM_PORTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Lecture des ports personnalisés impossible', e);
    return [];
  }
}

function writeCustomPorts(list) {
  window.localStorage.setItem(CUSTOM_PORTS_KEY, JSON.stringify(list));
}

// Ports saisis librement par l'utilisateur et absents de la base intégrée
// (00-ports.jsx). Ils sont mémorisés dès la première saisie (pour réapparaître
// dans l'autocomplétion) puis peuvent recevoir des coordonnées — via la page
// Carte — pour s'afficher enfin sur la carte et les mini-cartes de trajet.
const CustomPorts = {
  getAll() {
    return readCustomPorts();
  },
  ensure(name) {
    if (!name || findPort(name)) return;
    const list = readCustomPorts();
    if (list.some((p) => p.name.toLowerCase() === name.toLowerCase())) return;
    list.push({ name, lat: null, lon: null });
    writeCustomPorts(list);
  },
  setCoords(name, lat, lon) {
    const list = readCustomPorts();
    const idx = list.findIndex((p) => p.name.toLowerCase() === name.toLowerCase());
    if (idx === -1) list.push({ name, lat, lon });
    else list[idx] = { ...list[idx], lat, lon };
    writeCustomPorts(list);
  },
};

function registerPortsFromOuting(outing) {
  outingLegs(outing).forEach((l) => {
    CustomPorts.ensure(l.portDepart);
    CustomPorts.ensure(l.portArrivee);
  });
}

function demoOutings() {
  const today = new Date();
  const iso = (offsetDays) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString().slice(0, 10);
  };
  return [
    {
      id: uid(), portDepart: 'La Trinité-sur-Mer', portArrivee: 'Île de Groix', date: iso(6),
      bateauModele: 'Bénéteau Océanis 34',
      distanceNm: 18.5, dureeMin: 210,
      meteo: { ventNoeuds: 14, directionVent: 'NO', etatMer: 'peu_agitee' },
      skipper: { humeur: 'bon', fatigue: 2, notes: 'Belle brise portante à l’aller, un peu molle au retour.' },
      voiles: ['Grand-voile', 'Génois'], equipage: ['Pierre', 'Camille'],
      commentaire: 'Mouillage tranquille à Port-Tudy avant de rentrer.', createdAt: iso(6), updatedAt: iso(6),
    },
    {
      id: uid(), portDepart: 'Concarneau', portArrivee: 'Bénodet', date: iso(20),
      bateauModele: 'Bénéteau Océanis 34',
      distanceNm: 11.2, dureeMin: 130,
      meteo: { ventNoeuds: 9, directionVent: 'O', etatMer: 'calme' },
      skipper: { humeur: 'excellent', fatigue: 1, notes: 'Navigation très reposante, mer plate.' },
      voiles: ['Grand-voile', 'Spi asymétrique'], equipage: ['Pierre'],
      commentaire: 'Sortie en solo pour tester le nouveau gennaker.', createdAt: iso(20), updatedAt: iso(20),
    },
    {
      id: uid(), portDepart: 'Lorient', portArrivee: 'La Trinité-sur-Mer', date: iso(45),
      bateauModele: 'Bénéteau Océanis 34',
      distanceNm: 14.8, dureeMin: 165,
      meteo: { ventNoeuds: 22, directionVent: 'SO', etatMer: 'agitee' },
      skipper: { humeur: 'difficile', fatigue: 4, notes: 'Bonne claque, ris pris tôt, équipage un peu secoué.' },
      voiles: ['Grand-voile', 'Foc'], equipage: ['Pierre', 'Camille', 'Julien'],
      commentaire: 'Coup de vent annoncé plus tôt que prévu, on a bien fait de partir avant.', createdAt: iso(45), updatedAt: iso(45),
    },
    {
      id: uid(), portDepart: 'Marseille', portArrivee: 'Cassis', date: iso(70),
      bateauModele: 'Jeanneau Sun Odyssey 349',
      distanceNm: 15.0, dureeMin: 180,
      meteo: { ventNoeuds: 12, directionVent: 'NE', etatMer: 'belle' },
      skipper: { humeur: 'bon', fatigue: 2, notes: 'Beau temps, mistral modéré.' },
      voiles: ['Grand-voile', 'Génois'], equipage: ['Pierre', 'Sophie'],
      commentaire: 'Arrêt baignade dans les Calanques.', createdAt: iso(70), updatedAt: iso(70),
    },
    {
      id: uid(), portDepart: 'Cannes', portArrivee: 'Île Sainte-Marguerite', date: iso(95),
      distanceNm: 6.4, dureeMin: 75,
      meteo: { ventNoeuds: 8, directionVent: 'E', etatMer: 'calme' },
      skipper: { humeur: 'excellent', fatigue: 1, notes: 'Petite sortie détente en famille.' },
      voiles: ['Grand-voile'], equipage: ['Pierre', 'Camille', 'Léo', 'Anna'],
      commentaire: 'Pique-nique à bord au mouillage.', createdAt: iso(95), updatedAt: iso(95),
    },
    {
      id: uid(), portDepart: 'Saint-Tropez', portArrivee: 'Sainte-Maxime', date: iso(130),
      distanceNm: 8.9, dureeMin: 95,
      meteo: { ventNoeuds: 16, directionVent: 'SE', etatMer: 'peu_agitee' },
      skipper: { humeur: 'bon', fatigue: 2, notes: 'Traversée de la baie sans encombre.' },
      voiles: ['Grand-voile', 'Génois'], equipage: ['Pierre', 'Julien'],
      commentaire: '', createdAt: iso(130), updatedAt: iso(130),
    },
    {
      id: uid(), type: 'voyage', titre: 'Croisière Belle-Île — 3 jours',
      bateauModele: 'Bénéteau Océanis 34',
      createdAt: iso(52), updatedAt: iso(52),
      etapes: [
        {
          portDepart: 'La Trinité-sur-Mer', portArrivee: 'Belle-Île-en-Mer (Le Palais)', date: iso(54),
          distanceNm: 16.2, dureeMin: 195,
          meteo: { ventNoeuds: 13, directionVent: 'O', etatMer: 'peu_agitee' },
          skipper: { humeur: 'bon', fatigue: 2, notes: 'Bon départ, vent portant.' },
          voiles: ['Grand-voile', 'Génois'], equipage: ['Pierre', 'Camille', 'Julien'],
          commentaire: 'Escale nuit au port du Palais.',
        },
        {
          portDepart: 'Belle-Île-en-Mer (Le Palais)', portArrivee: 'Île de Groix', date: iso(53),
          distanceNm: 21.4, dureeMin: 240,
          meteo: { ventNoeuds: 17, directionVent: 'SO', etatMer: 'agitee' },
          skipper: { humeur: 'moyen', fatigue: 3, notes: 'Mer plus formée, un ris pris l’après-midi.' },
          voiles: ['Grand-voile', 'Foc'], equipage: ['Pierre', 'Camille', 'Julien'],
          commentaire: 'Mouillage à Port-Tudy pour la nuit.',
        },
        {
          portDepart: 'Île de Groix', portArrivee: 'La Trinité-sur-Mer', date: iso(52),
          distanceNm: 18.5, dureeMin: 200,
          meteo: { ventNoeuds: 11, directionVent: 'NO', etatMer: 'belle' },
          skipper: { humeur: 'excellent', fatigue: 2, notes: 'Retour tranquille, beau soleil.' },
          voiles: ['Grand-voile', 'Spi asymétrique'], equipage: ['Pierre', 'Camille', 'Julien'],
          commentaire: 'Belle croisière, à refaire !',
        },
      ],
    },
  ];
}

const Store = {
  getAll() {
    return readAll().sort((a, b) => (outingSortDate(a) < outingSortDate(b) ? 1 : -1));
  },
  getById(id) {
    return readAll().find((s) => s.id === id) || null;
  },
  create(data) {
    const list = readAll();
    const now = new Date().toISOString();
    const outing = { ...data, id: uid(), createdAt: now, updatedAt: now };
    list.push(outing);
    writeAll(list);
    registerPortsFromOuting(outing);
    return outing;
  },
  update(id, data) {
    const list = readAll();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    // Remplacement complet (hors id/createdAt) : `data` porte toujours la
    // représentation intégrale de la sortie, simple ou voyage. Un merge
    // superficiel laisserait traîner d'anciens champs si le mode a changé.
    const updated = { ...data, id, createdAt: list[idx].createdAt, updatedAt: new Date().toISOString() };
    list[idx] = updated;
    writeAll(list);
    registerPortsFromOuting(updated);
    return updated;
  },
  remove(id) {
    const list = readAll().filter((s) => s.id !== id);
    writeAll(list);
  },
  seedIfEmpty() {
    const list = readAll();
    if (list.length === 0) {
      writeAll(demoOutings());
    }
  },
  clearAll() {
    writeAll([]);
  },
  exportData() {
    return {
      app: 'carnet-navigation',
      version: 1,
      exportedAt: new Date().toISOString(),
      sorties: readAll(),
      portsPersonnalises: readCustomPorts(),
    };
  },
  importData(data) {
    if (!data || !Array.isArray(data.sorties)) {
      throw new Error('Format de fichier invalide : aucune liste de sorties trouvée.');
    }
    writeAll(data.sorties);
    if (Array.isArray(data.portsPersonnalises)) writeCustomPorts(data.portsPersonnalises);
  },
};
