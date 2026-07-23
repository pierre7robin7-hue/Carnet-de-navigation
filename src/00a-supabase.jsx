// Connexion à Supabase (authentification + base de données du compte).
// L'URL et la clé ci-dessous sont publiques par conception ("publishable
// key") : la protection des données vient des policies RLS définies côté
// base (chacun ne voit/modifie que ses propres lignes), pas du secret de
// cette clé. Ne jamais mettre ici la "secret key" de Supabase.
const SUPABASE_URL = 'https://clshermapqzhtipzhjjf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kDGaeYAKC-RQgbZNofRQeg_GMS_B_mC';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUserId = null;

const Auth = {
  async getSession() {
    const { data } = await supabaseClient.auth.getSession();
    currentUserId = data.session ? data.session.user.id : null;
    return data.session;
  },
  onChange(callback) {
    supabaseClient.auth.onAuthStateChange((_event, session) => {
      currentUserId = session ? session.user.id : null;
      callback(session);
    });
  },
  async signUp(email, password) {
    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) throw error;
  },
  async signIn(email, password) {
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },
  async signOut() {
    await supabaseClient.auth.signOut();
    currentUserId = null;
  },
};

// Synchronisation en arrière-plan : le stockage local (02-store.jsx) reste la
// source de vérité pour l'affichage immédiat de l'app ; chaque écriture est
// répercutée vers Supabase sans bloquer l'interface. v1 : pas de file
// d'attente hors-ligne (les erreurs réseau sont journalisées, pas retentées).
const RemoteSync = {
  getUserId() {
    return currentUserId;
  },
  async pushOuting(outing) {
    if (!currentUserId) return;
    const { error } = await supabaseClient.from('sorties').upsert({
      id: outing.id,
      user_id: currentUserId,
      data: outing,
      updated_at: new Date().toISOString(),
    });
    if (error) console.error('Synchronisation (sortie) impossible', error);
  },
  async deleteOuting(id) {
    if (!currentUserId) return;
    const { error } = await supabaseClient.from('sorties').delete().eq('id', id);
    if (error) console.error('Suppression distante impossible', error);
  },
  async pushPort(port) {
    if (!currentUserId) return;
    const { error } = await supabaseClient.from('ports_personnalises').upsert(
      { user_id: currentUserId, name: port.name, lat: port.lat, lon: port.lon },
      { onConflict: 'user_id,name' }
    );
    if (error) console.error('Synchronisation (port) impossible', error);
  },
  async fetchAll() {
    const [sortiesRes, portsRes] = await Promise.all([
      supabaseClient.from('sorties').select('data').order('created_at', { ascending: true }),
      supabaseClient.from('ports_personnalises').select('name, lat, lon'),
    ]);
    if (sortiesRes.error) throw sortiesRes.error;
    if (portsRes.error) throw portsRes.error;
    return {
      sorties: (sortiesRes.data || []).map((r) => r.data),
      ports: portsRes.data || [],
    };
  },
  // Utilisé une seule fois lors de la migration des données locales
  // pré-existantes vers un compte qui n'a encore aucune donnée distante.
  async pushAllLocal(sorties, ports) {
    if (!currentUserId) return;
    if (sorties.length) {
      const rows = sorties.map((o) => ({
        id: o.id, user_id: currentUserId, data: o, updated_at: new Date().toISOString(),
      }));
      const { error } = await supabaseClient.from('sorties').upsert(rows);
      if (error) throw error;
    }
    if (ports.length) {
      const rows = ports.map((p) => ({ user_id: currentUserId, name: p.name, lat: p.lat, lon: p.lon }));
      const { error } = await supabaseClient.from('ports_personnalises').upsert(rows, { onConflict: 'user_id,name' });
      if (error) throw error;
    }
  },
};
