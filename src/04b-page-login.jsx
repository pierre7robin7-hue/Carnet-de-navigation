function translateAuthError(err) {
  const msg = (err && err.message) || '';
  if (/Invalid login credentials/i.test(msg)) return 'E-mail ou mot de passe incorrect.';
  if (/User already registered/i.test(msg)) return 'Un compte existe déjà avec cet e-mail — connecte-toi plutôt.';
  if (/Password should be/i.test(msg)) return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (/Email not confirmed/i.test(msg)) return "Confirme ton e-mail avant de te connecter (vérifie ta boîte de réception).";
  if (/Unable to validate email address/i.test(msg)) return "Cette adresse e-mail n'est pas valide.";
  return msg || 'Une erreur est survenue, réessaie.';
}

function LoginPage() {
  const [mode, setMode] = React.useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [info, setInfo] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const switchMode = () => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setError('');
    setInfo('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        await Auth.signUp(email, password);
        setInfo("Compte créé. Si ta boîte mail te demande de confirmer ton adresse, clique le lien reçu puis reviens te connecter ici.");
        setMode('signin');
      } else {
        await Auth.signIn(email, password);
      }
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <ThemeToggle
        className="!text-navy-400 hover:!text-navy-700 dark:!text-navy-500 dark:hover:!text-white absolute right-4"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
      />
      <div className="w-full max-w-sm bg-white dark:bg-navy-800 rounded-2xl shadow-soft p-7">
        <div className="flex items-center gap-2 text-navy-900 dark:text-navy-50 font-heading font-semibold text-lg mb-1">
          <span className="text-ocean-500"><Icon.Sailboat size={24} /></span>
          Carnet de Navigation
        </div>
        <p className="text-navy-400 text-sm mb-6">
          {mode === 'signin'
            ? 'Connecte-toi pour retrouver tes sorties, sur tous tes appareils.'
            : 'Crée ton compte pour synchroniser tes sorties entre appareils.'}
        </p>
        <form onSubmit={submit} className="space-y-4">
          <Field label="E-mail" required>
            <input
              type="email" required autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="toi@exemple.com"
            />
          </Field>
          <Field label="Mot de passe" required hint={mode === 'signup' ? '6 caractères minimum' : undefined}>
            <input
              type="password" required minLength={6}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="••••••••"
            />
          </Field>
          {error && <p className="text-sm text-coral-600 dark:text-coral-300 bg-coral-400/10 dark:bg-coral-400/20 rounded-lg px-3 py-2">{error}</p>}
          {info && <p className="text-sm text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30 rounded-lg px-3 py-2">{info}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-ocean-500 to-ocean-600 hover:from-ocean-400 hover:to-ocean-500 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-60"
          >
            {loading ? 'Un instant…' : mode === 'signin' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>
        <button onClick={switchMode} className="w-full text-center text-sm text-navy-500 dark:text-navy-400 hover:text-ocean-600 dark:hover:text-ocean-400 mt-4">
          {mode === 'signin' ? 'Pas encore de compte ? Créer un compte' : 'Déjà un compte ? Se connecter'}
        </button>
      </div>
    </div>
  );
}
