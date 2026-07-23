function parseRoute(hash) {
  const path = (hash || '#/').replace(/^#/, '') || '/';
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return { name: 'dashboard' };
  if (parts[0] === 'historique') return { name: 'history' };
  if (parts[0] === 'carte') return { name: 'map' };
  if (parts[0] === 'export') return { name: 'export' };
  if (parts[0] === 'nouvelle') return { name: 'new' };
  if (parts[0] === 'sortie' && parts[1] && parts[2] === 'modifier') return { name: 'edit', id: parts[1] };
  if (parts[0] === 'sortie' && parts[1]) return { name: 'detail', id: parts[1] };
  return { name: 'dashboard' };
}

function Footer() {
  return (
    <footer className="no-print border-t border-navy-100 dark:border-navy-800 mt-10 pb-20 md:pb-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-center gap-2 text-navy-400 text-xs">
        <Icon.Anchor size={14} />
        Carnet de Navigation — vos données sont liées à votre compte et synchronisées entre vos appareils.
      </div>
    </footer>
  );
}

function App() {
  const [route, setRoute] = React.useState(() => parseRoute(window.location.hash));
  const [outings, setOutings] = React.useState([]);
  const [session, setSession] = React.useState(undefined); // undefined = chargement, null = déconnecté
  const [migratePrompt, setMigratePrompt] = React.useState(false);
  const [migrating, setMigrating] = React.useState(false);
  const [pendingSync, setPendingSync] = React.useState(() => RemoteSync.pendingCount());
  const [isOnline, setIsOnline] = React.useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  const refresh = React.useCallback(() => setOutings(Store.getAll()), []);

  // Suivi de la file d'attente de synchronisation et de l'état réseau, pour
  // afficher un indicateur honnête plutôt que de laisser croire que tout est
  // toujours à jour.
  React.useEffect(() => {
    const unsubscribe = RemoteSync.subscribeQueue(setPendingSync);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      unsubscribe();
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);
  // Mémorise pour quel utilisateur on a déjà rapatrié les données, afin qu'un
  // simple rafraîchissement de jeton (même session, même utilisateur — ça
  // arrive régulièrement en arrière-plan) ne relance jamais un remplacement
  // du cache local : ça écraserait des sorties saisies hors-ligne pas encore
  // synchronisées (cas fréquent en mer, sans réseau).
  const hydratedUserRef = React.useRef(null);

  // Récupération et suivi de la session de connexion.
  React.useEffect(() => {
    let active = true;
    Auth.getSession().then((s) => { if (active) setSession(s); });
    Auth.onChange((s) => { if (active) setSession(s); });
    return () => { active = false; };
  }, []);

  // Une fois connecté : on rapatrie les données du compte. Si le compte est
  // vide mais que ce navigateur contient déjà des sorties (usage avant la
  // mise en place des comptes), on propose de les envoyer plutôt que de les
  // écraser silencieusement.
  React.useEffect(() => {
    if (!session) { hydratedUserRef.current = null; return; }
    if (hydratedUserRef.current === session.user.id) return;
    let active = true;
    (async () => {
      try {
        // On tente d'abord d'envoyer toute écriture locale encore en attente
        // (faite hors-ligne) : si elle n'est pas passée, on ne rapatrie pas
        // les données distantes cette fois-ci, pour ne jamais écraser des
        // sorties pas encore synchronisées avec une version distante plus
        // ancienne.
        await RemoteSync.flushQueue();
        if (!active) return;
        if (RemoteSync.pendingCount() > 0) {
          hydratedUserRef.current = session.user.id;
          return;
        }
        const remote = await RemoteSync.fetchAll();
        if (!active) return;
        const hasLocalData = Store.getAll().length > 0;
        if (remote.sorties.length === 0 && hasLocalData) {
          setMigratePrompt(true);
        } else {
          Store.replaceAllLocal(remote.sorties);
          CustomPorts.replaceAllLocal(remote.ports);
        }
        hydratedUserRef.current = session.user.id;
      } catch (err) {
        console.error('Récupération des données du compte impossible', err);
      } finally {
        if (active) refresh();
      }
    })();
    return () => { active = false; };
  }, [session, refresh]);

  React.useEffect(() => {
    const onHashChange = () => {
      setRoute(parseRoute(window.location.hash));
      window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleCreate = (data) => {
    const created = Store.create(data);
    refresh();
    window.location.hash = `#/sortie/${created.id}`;
  };

  const handleUpdate = (id, data) => {
    Store.update(id, data);
    refresh();
    window.location.hash = `#/sortie/${id}`;
  };

  const handleDelete = (id) => {
    const existing = outings.find((o) => o.id === id);
    if (existing && existing.photos && existing.photos.length) {
      // Best-effort : on ne bloque jamais la suppression sur le nettoyage
      // des fichiers distants (sinon perdus dans le quota gratuit, mais sans
      // gravité — pas de donnée utilisateur perdue).
      Storage.remove(existing.photos).catch((err) => console.error('Nettoyage des photos distantes impossible', err));
    }
    Store.remove(id);
    refresh();
    window.location.hash = '#/historique';
  };

  const handlePhotosChange = (outing, photos) => {
    Store.update(outing.id, { ...outing, photos });
    refresh();
  };

  const handleMigrateConfirm = async () => {
    setMigrating(true);
    try {
      await RemoteSync.pushAllLocal(Store.getAll(), CustomPorts.getAll());
      setMigratePrompt(false);
    } catch (err) {
      console.error('Envoi des données existantes impossible', err);
      alert("L'envoi vers ton compte a échoué (vérifie ta connexion) — réessaie depuis l'onglet Export.");
    } finally {
      setMigrating(false);
    }
  };

  const handleMigrateSkip = () => setMigratePrompt(false);

  const handleSignOut = async () => {
    await Auth.signOut();
    Store.clearAll();
    CustomPorts.replaceAllLocal([]);
    refresh();
  };

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center text-navy-400 dark:text-navy-500">
        Chargement du carnet de navigation…
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  let page = null;
  if (route.name === 'dashboard') {
    page = <DashboardPage outings={outings} />;
  } else if (route.name === 'history') {
    page = <HistoryPage outings={outings} />;
  } else if (route.name === 'map') {
    page = <MapPage outings={outings} />;
  } else if (route.name === 'export') {
    page = <ExportPage outings={outings} onImported={refresh} />;
  } else if (route.name === 'new') {
    page = <OutingFormPage onSubmit={handleCreate} />;
  } else if (route.name === 'edit') {
    const existing = outings.find((o) => o.id === route.id);
    page = <OutingFormPage existing={existing} onSubmit={(data) => handleUpdate(route.id, data)} />;
  } else if (route.name === 'detail') {
    const outing = outings.find((o) => o.id === route.id) || null;
    page = <OutingDetailPage outing={outing} onDelete={handleDelete} onPhotosChange={handlePhotosChange} />;
  }

  const showFab = route.name !== 'new' && route.name !== 'edit';

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        route={route}
        userEmail={session.user.email}
        onSignOut={handleSignOut}
        syncBadge={<SyncBadge pending={pendingSync} isOnline={isOnline} />}
      />
      <main className="flex-1">{page}</main>
      <Footer />
      <BottomTabBar route={route} />
      {showFab && <FabNewOuting />}
      <ConfirmDialog
        open={migratePrompt}
        title="Reprendre tes sorties existantes ?"
        description="Ce navigateur contient des sorties enregistrées avant la connexion, et ton compte est encore vide. Veux-tu les envoyer vers ton compte pour les retrouver sur tous tes appareils ?"
        confirmLabel={migrating ? 'Envoi en cours…' : 'Envoyer vers mon compte'}
        onCancel={handleMigrateSkip}
        onConfirm={handleMigrateConfirm}
      />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
