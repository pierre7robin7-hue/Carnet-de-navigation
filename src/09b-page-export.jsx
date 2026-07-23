function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function PrintRow({ outing }) {
  const legs = outingLegs(outing);
  return (
    <>
      {isVoyage(outing) && (
        <tr className="bg-sand-50">
          <td colSpan={8} className="px-3 py-1.5 font-semibold text-navy-800 text-xs">
            {outingTitre(outing)} {outing.bateauModele ? `— ${outing.bateauModele}` : ''}
          </td>
        </tr>
      )}
      {legs.map((l, i) => {
        const humeur = humeurInfo(l.skipper && l.skipper.humeur);
        return (
          <tr key={i} className="border-b border-navy-100">
            <td className="px-3 py-1.5 whitespace-nowrap">{formatDateFR(l.date)}</td>
            <td className="px-3 py-1.5">{l.portDepart} → {l.portArrivee}</td>
            <td className="px-3 py-1.5 whitespace-nowrap">{!isVoyage(outing) ? (outing.bateauModele || '—') : ''}</td>
            <td className="px-3 py-1.5 whitespace-nowrap">{formatNm(l.distanceNm)}</td>
            <td className="px-3 py-1.5 whitespace-nowrap">{formatDuree(l.dureeMin)}</td>
            <td className="px-3 py-1.5 whitespace-nowrap">{l.meteo && l.meteo.ventNoeuds != null ? `${l.meteo.ventNoeuds} nds ${l.meteo.directionVent || ''}` : '—'}</td>
            <td className="px-3 py-1.5 whitespace-nowrap">{humeur.emoji} {humeur.label}</td>
            <td className="px-3 py-1.5">{l.commentaire || ''}</td>
          </tr>
        );
      })}
    </>
  );
}

function ExportPage({ outings, onImported }) {
  const fileInputRef = React.useRef(null);
  const [message, setMessage] = React.useState(null); // { tone, text }
  const [confirmFile, setConfirmFile] = React.useState(null);

  const handleExport = () => {
    const data = Store.exportData();
    const stamp = new Date().toISOString().slice(0, 10);
    downloadJSON(data, `carnet-navigation-${stamp}.json`);
  };

  const pickFile = () => fileInputRef.current && fileInputRef.current.click();

  const onFileChosen = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data.sorties)) throw new Error('invalid');
        setConfirmFile(data);
      } catch (err) {
        setMessage({ tone: 'coral', text: 'Ce fichier ne semble pas être un export valide du Carnet de Navigation.' });
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    try {
      Store.importData(confirmFile);
      setConfirmFile(null);
      setMessage({ tone: 'teal', text: `Import réussi : ${confirmFile.sorties.length} sortie(s) chargée(s).` });
      onImported();
    } catch (err) {
      setMessage({ tone: 'coral', text: err.message || 'Import impossible.' });
      setConfirmFile(null);
    }
  };

  const sorted = [...outings].sort((a, b) => (outingSortDate(a) < outingSortDate(b) ? -1 : 1));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="no-print">
        <PageHeader
          title="Export & impression"
          subtitle="Sauvegardez vos données ou imprimez un récapitulatif de vos navigations"
        />
      </div>

      {message && (
        <div className={classNames(
          'no-print text-sm rounded-lg px-4 py-3 font-medium',
          message.tone === 'coral' ? 'bg-coral-400/10 text-coral-600' : 'bg-teal-50 text-teal-700'
        )}>
          {message.text}
        </div>
      )}

      <section className="no-print bg-white rounded-2xl shadow-soft p-5 space-y-4">
        <h2 className="font-heading font-semibold text-navy-800 flex items-center gap-2">
          <Icon.Download size={17} className="text-ocean-600" /> Sauvegarde &amp; transfert entre appareils
        </h2>
        <p className="text-sm text-navy-500">
          Vos données sont stockées uniquement dans ce navigateur, sur cet appareil. Pour les retrouver sur votre
          téléphone ou un autre ordinateur, exportez un fichier ici puis importez-le là-bas (par e-mail, AirDrop,
          cloud personnel…).
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExport} className="inline-flex items-center gap-1.5 bg-gradient-to-r from-ocean-500 to-ocean-600 hover:from-ocean-400 hover:to-ocean-500 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-glow hover:shadow-glow-lg transition-all">
            <Icon.Download size={16} /> Exporter mes données (.json)
          </button>
          <button onClick={pickFile} className="inline-flex items-center gap-1.5 bg-navy-50 hover:bg-navy-100 text-navy-700 font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors">
            <Icon.Upload size={16} /> Importer un fichier
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={onFileChosen} className="hidden" />
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-soft p-5 space-y-4 print-sheet">
        <div className="no-print flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-heading font-semibold text-navy-800 flex items-center gap-2">
            <Icon.Printer size={17} className="text-ocean-600" /> Récapitulatif imprimable
          </h2>
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 bg-navy-800 hover:bg-navy-700 text-white font-semibold text-sm px-4 py-2 rounded-lg">
            <Icon.Printer size={15} /> Imprimer / Exporter en PDF
          </button>
        </div>

        {sorted.length === 0 ? (
          <p className="text-navy-400 text-sm">Aucune navigation à imprimer pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-navy-600 border-collapse">
              <thead>
                <tr className="text-left text-navy-400 border-b border-navy-200">
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Trajet</th>
                  <th className="px-3 py-2 font-medium">Bateau</th>
                  <th className="px-3 py-2 font-medium">Distance</th>
                  <th className="px-3 py-2 font-medium">Durée</th>
                  <th className="px-3 py-2 font-medium">Vent</th>
                  <th className="px-3 py-2 font-medium">Ressenti</th>
                  <th className="px-3 py-2 font-medium">Commentaire</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((o) => <PrintRow key={o.id} outing={o} />)}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!confirmFile}
        title="Remplacer toutes les données ?"
        description={confirmFile ? `Ce fichier contient ${confirmFile.sorties.length} sortie(s). L'import remplacera intégralement vos données actuelles dans ce navigateur. Cette action est irréversible.` : ''}
        confirmLabel="Importer et remplacer"
        onCancel={() => setConfirmFile(null)}
        onConfirm={confirmImport}
      />
    </div>
  );
}
