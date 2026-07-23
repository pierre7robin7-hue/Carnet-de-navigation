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
    <footer className="no-print border-t border-navy-100 mt-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-center gap-2 text-navy-400 text-xs">
        <Icon.Anchor size={14} />
        Carnet de Navigation — vos données sont stockées localement, uniquement dans ce navigateur.
      </div>
    </footer>
  );
}

function App() {
  const [route, setRoute] = React.useState(() => parseRoute(window.location.hash));
  const [outings, setOutings] = React.useState([]);

  const refresh = React.useCallback(() => setOutings(Store.getAll()), []);

  React.useEffect(() => {
    Store.seedIfEmpty();
    refresh();
    const onHashChange = () => {
      setRoute(parseRoute(window.location.hash));
      window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [refresh]);

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
    Store.remove(id);
    refresh();
    window.location.hash = '#/historique';
  };

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
    page = <OutingDetailPage outing={outing} onDelete={handleDelete} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar route={route} />
      <main className="flex-1">{page}</main>
      <Footer />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
