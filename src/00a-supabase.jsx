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

// File d'attente persistante (localStorage) pour les écritures vers
// Supabase : une création/modification/suppression est d'abord posée ici,
// puis on tente de l'envoyer. Hors-ligne (ou en cas d'erreur réseau), elle
// reste en attente et sera réessayée automatiquement — au retour du réseau,
// à la prochaine ouverture de l'app, ou après chaque nouvelle écriture.
// Sans ça, une sortie saisie en mer sans signal serait silencieusement
// perdue dès que l'app retente une lecture depuis le compte.
const QUEUE_KEY = 'carnet-navigation.sync-queue.v1';

function readQueue() {
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}
function writeQueue(list) {
  try { window.localStorage.setItem(QUEUE_KEY, JSON.stringify(list)); } catch (e) { /* quota dépassé : tant pis */ }
}

async function runQueuedOp(op) {
  if (op.type === 'upsert-outing') {
    const { error } = await supabaseClient.from('sorties').upsert({
      id: op.payload.id, user_id: currentUserId, data: op.payload, updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  } else if (op.type === 'delete-outing') {
    const { error } = await supabaseClient.from('sorties').delete().eq('id', op.payload.id);
    if (error) throw error;
  } else if (op.type === 'upsert-port') {
    const { error } = await supabaseClient.from('ports_personnalises').upsert(
      { user_id: currentUserId, name: op.payload.name, lat: op.payload.lat, lon: op.payload.lon },
      { onConflict: 'user_id,name' }
    );
    if (error) throw error;
  }
}

let flushing = false;
let queueListeners = [];
function notifyQueueListeners() {
  const n = readQueue().length;
  queueListeners.forEach((cb) => cb(n));
}

const SyncQueue = {
  enqueue(op) {
    const list = readQueue();
    list.push({ ...op, id: uid(), ts: Date.now() });
    writeQueue(list);
    notifyQueueListeners();
    SyncQueue.flush();
  },
  pendingCount() {
    return readQueue().length;
  },
  subscribe(cb) {
    queueListeners.push(cb);
    return () => { queueListeners = queueListeners.filter((c) => c !== cb); };
  },
  async flush() {
    if (flushing || !currentUserId) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    flushing = true;
    try {
      let list = readQueue();
      while (list.length > 0) {
        try {
          await runQueuedOp(list[0]);
        } catch (err) {
          console.error('Synchronisation en attente (réessai plus tard)', err);
          break; // on garde l'ordre : on ne saute pas une opération en échec
        }
        list = list.slice(1);
        writeQueue(list);
        notifyQueueListeners();
      }
    } finally {
      flushing = false;
    }
  },
};

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => SyncQueue.flush());
}

const RemoteSync = {
  getUserId() {
    return currentUserId;
  },
  subscribeQueue: SyncQueue.subscribe,
  pendingCount: SyncQueue.pendingCount,
  flushQueue: SyncQueue.flush,
  pushOuting(outing) {
    if (!currentUserId) return;
    SyncQueue.enqueue({ type: 'upsert-outing', payload: outing });
  },
  deleteOuting(id) {
    if (!currentUserId) return;
    SyncQueue.enqueue({ type: 'delete-outing', payload: { id } });
  },
  pushPort(port) {
    if (!currentUserId) return;
    SyncQueue.enqueue({ type: 'upsert-port', payload: port });
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

// Photos jointes aux sorties : nécessite le bucket Storage "photos-sorties"
// (créé manuellement dans Supabase, voir le guide). Bucket privé : chaque
// photo est servie via une URL signée temporaire plutôt qu'une URL publique.
const PHOTOS_BUCKET = 'photos-sorties';

const Storage = {
  async upload(path, file) {
    const { error } = await supabaseClient.storage.from(PHOTOS_BUCKET).upload(path, file, { upsert: false });
    if (error) throw error;
  },
  async remove(paths) {
    const { error } = await supabaseClient.storage.from(PHOTOS_BUCKET).remove(paths);
    if (error) throw error;
  },
  async getSignedUrls(paths) {
    if (!paths || !paths.length) return {};
    const { data, error } = await supabaseClient.storage.from(PHOTOS_BUCKET).createSignedUrls(paths, 3600);
    if (error) throw error;
    const map = {};
    (data || []).forEach((d) => { if (d.signedUrl) map[d.path || d.signedUrl] = d.signedUrl; });
    return map;
  },
};
