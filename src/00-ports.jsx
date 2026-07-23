// Base de ports pour l'autocomplétion et l'affichage cartographique.
// Coordonnées approximatives (suffisantes pour le placement sur carte).
const PORTS = [
  // Bretagne
  { name: 'Brest', lat: 48.3833, lon: -4.4903, region: 'Bretagne' },
  { name: 'Douarnenez', lat: 48.0928, lon: -4.3286, region: 'Bretagne' },
  { name: 'Camaret-sur-Mer', lat: 48.2758, lon: -4.5928, region: 'Bretagne' },
  { name: 'Concarneau', lat: 47.8747, lon: -3.9186, region: 'Bretagne' },
  { name: 'Lorient', lat: 47.7482, lon: -3.3702, region: 'Bretagne' },
  { name: 'Vannes', lat: 47.6582, lon: -2.7603, region: 'Bretagne' },
  { name: 'La Trinité-sur-Mer', lat: 47.5822, lon: -3.0175, region: 'Bretagne' },
  { name: 'Port-Louis', lat: 47.7069, lon: -3.3536, region: 'Bretagne' },
  { name: 'Île de Groix', lat: 47.6392, lon: -3.4550, region: 'Bretagne' },
  { name: 'Île de Sein', lat: 48.0392, lon: -4.8517, region: 'Bretagne' },
  { name: 'Bénodet', lat: 47.8747, lon: -4.1069, region: 'Bretagne' },
  { name: 'Paimpol', lat: 48.7797, lon: -3.0439, region: 'Bretagne' },
  { name: 'Perros-Guirec', lat: 48.8103, lon: -3.4436, region: 'Bretagne' },
  { name: 'Saint-Malo', lat: 48.6493, lon: -2.0257, region: 'Bretagne' },
  { name: 'Roscoff', lat: 48.7264, lon: -3.9781, region: 'Bretagne' },
  { name: 'Île de Bréhat', lat: 48.8419, lon: -2.9583, region: 'Bretagne' },
  { name: 'Île d’Ouessant', lat: 48.4586, lon: -5.0906, region: 'Bretagne' },
  { name: 'Belle-Île-en-Mer (Le Palais)', lat: 47.3486, lon: -3.1522, region: 'Bretagne' },
  // Manche
  { name: 'Cherbourg', lat: 49.6467, lon: -1.6167, region: 'Manche' },
  { name: 'Granville', lat: 48.8367, lon: -1.5964, region: 'Manche' },
  { name: 'Dieppe', lat: 49.9267, lon: 1.0850, region: 'Manche' },
  { name: 'Le Havre', lat: 49.4944, lon: 0.1079, region: 'Manche' },
  { name: 'Honfleur', lat: 49.4189, lon: 0.2333, region: 'Manche' },
  { name: 'Deauville', lat: 49.3597, lon: 0.0764, region: 'Manche' },
  { name: 'Boulogne-sur-Mer', lat: 50.7264, lon: 1.5978, region: 'Manche' },
  { name: 'Barfleur', lat: 49.6700, lon: -1.2597, region: 'Manche' },
  { name: 'Saint-Vaast-la-Hougue', lat: 49.5850, lon: -1.2683, region: 'Manche' },
  { name: 'Jersey (Saint-Hélier)', lat: 49.1858, lon: -2.1058, region: 'Îles Anglo-Normandes' },
  { name: 'Guernesey (Saint-Pierre-Port)', lat: 49.4550, lon: -2.5364, region: 'Îles Anglo-Normandes' },
  // Atlantique
  { name: 'La Rochelle', lat: 46.1591, lon: -1.1520, region: 'Atlantique' },
  { name: 'Les Sables-d’Olonne', lat: 46.4967, lon: -1.7833, region: 'Atlantique' },
  { name: 'Île de Ré (Saint-Martin-de-Ré)', lat: 46.2033, lon: -1.3628, region: 'Atlantique' },
  { name: 'Île d’Yeu (Port-Joinville)', lat: 46.7261, lon: -2.3428, region: 'Atlantique' },
  { name: 'Île d’Oléron (Boyardville)', lat: 45.9450, lon: -1.2261, region: 'Atlantique' },
  { name: 'Royan', lat: 45.6231, lon: -1.0311, region: 'Atlantique' },
  { name: 'Arcachon', lat: 44.6586, lon: -1.1683, region: 'Atlantique' },
  { name: 'Saint-Jean-de-Luz', lat: 43.3897, lon: -1.6631, region: 'Atlantique' },
  { name: 'Pornic', lat: 47.1147, lon: -2.1031, region: 'Atlantique' },
  { name: 'Saint-Nazaire', lat: 47.2733, lon: -2.2136, region: 'Atlantique' },
  // Méditerranée
  { name: 'Port-Vendres', lat: 42.5169, lon: 3.1064, region: 'Méditerranée' },
  { name: 'Collioure', lat: 42.5256, lon: 3.0836, region: 'Méditerranée' },
  { name: 'Sète', lat: 43.4028, lon: 3.6975, region: 'Méditerranée' },
  { name: 'Palavas-les-Flots', lat: 43.5303, lon: 3.9308, region: 'Méditerranée' },
  { name: 'Port-Camargue', lat: 43.5194, lon: 4.1364, region: 'Méditerranée' },
  { name: 'Marseille', lat: 43.2965, lon: 5.3698, region: 'Méditerranée' },
  { name: 'Cassis', lat: 43.2144, lon: 5.5386, region: 'Méditerranée' },
  { name: 'La Ciotat', lat: 43.1747, lon: 5.6053, region: 'Méditerranée' },
  { name: 'Bandol', lat: 43.1364, lon: 5.7517, region: 'Méditerranée' },
  { name: 'Toulon', lat: 43.1242, lon: 5.9280, region: 'Méditerranée' },
  { name: 'Hyères (Porquerolles)', lat: 43.0011, lon: 6.2028, region: 'Méditerranée' },
  { name: 'Saint-Tropez', lat: 43.2727, lon: 6.6407, region: 'Méditerranée' },
  { name: 'Sainte-Maxime', lat: 43.3078, lon: 6.6386, region: 'Méditerranée' },
  { name: 'Cannes', lat: 43.5513, lon: 7.0128, region: 'Méditerranée' },
  { name: 'Antibes', lat: 43.5808, lon: 7.1250, region: 'Méditerranée' },
  { name: 'Nice', lat: 43.6950, lon: 7.2794, region: 'Méditerranée' },
  { name: 'Villefranche-sur-Mer', lat: 43.7031, lon: 7.3131, region: 'Méditerranée' },
  { name: 'Menton', lat: 43.7761, lon: 7.4967, region: 'Méditerranée' },
  // Corse
  { name: 'Ajaccio', lat: 41.9192, lon: 8.7386, region: 'Corse' },
  { name: 'Bonifacio', lat: 41.3878, lon: 9.1594, region: 'Corse' },
  { name: 'Porto-Vecchio', lat: 41.5911, lon: 9.2797, region: 'Corse' },
  { name: 'Calvi', lat: 42.5681, lon: 8.7564, region: 'Corse' },
  { name: 'Bastia', lat: 42.6978, lon: 9.4503, region: 'Corse' },
  { name: 'Propriano', lat: 41.6772, lon: 8.9017, region: 'Corse' },
  // Voisins (Espagne / Italie)
  { name: 'Roses', lat: 42.2622, lon: 3.1761, region: 'Espagne' },
  { name: 'Port de la Selva', lat: 42.3364, lon: 3.2011, region: 'Espagne' },
  { name: 'L’Escala', lat: 42.1256, lon: 3.1358, region: 'Espagne' },
  { name: 'San Remo', lat: 43.8175, lon: 7.7761, region: 'Italie' },
  { name: 'Imperia', lat: 43.8867, lon: 8.0294, region: 'Italie' },
  { name: 'Portofino', lat: 44.3033, lon: 9.2097, region: 'Italie' },
];

// Recherche un port dans la base intégrée, puis dans les ports personnalisés
// (saisis librement par l'utilisateur et localisés depuis la page Carte).
function findPort(name) {
  if (!name) return null;
  const clean = name.trim().toLowerCase();
  const known = PORTS.find((p) => p.name.toLowerCase() === clean);
  if (known) return known;
  const custom = CustomPorts.getAll().find((p) => p.name.toLowerCase() === clean && p.lat != null && p.lon != null);
  return custom || null;
}

// Tous les noms de ports connus (base intégrée + personnalisés, même non
// encore localisés) : utilisé pour l'autocomplétion du formulaire.
function allKnownPortNames() {
  const set = new Set(PORTS.map((p) => p.name));
  CustomPorts.getAll().forEach((p) => set.add(p.name));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
