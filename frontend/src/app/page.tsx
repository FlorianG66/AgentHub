import Link from "next/link";
import {
  Cpu,
  Sparkles,
  Share2,
  ShieldCheck,
  BookOpen,
  Building2,
  Zap,
  MessagesSquare,
  ArrowRight,
  Check,
  Rocket,
  Blocks,
  KeyRound,
  Sliders,
  Users,
  GraduationCap,
} from "lucide-react";

const FEATURES = [
  {
    icon: Blocks,
    title: "Routage intelligent multi-agents",
    desc: "Chaque mission est analysée puis confiée automatiquement à l'agent le plus compétent, sans binôme figé.",
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  },
  {
    icon: Share2,
    title: "Collaboration inter-agents",
    desc: "Vos agents se consultent entre eux, s'entraident et croisent les données avant de vous livrer un résultat complet.",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: ShieldCheck,
    title: "Human-in-the-Loop",
    desc: "Rien n'est publié ou exécuté sur vos comptes réels sans votre validation. Vous gardez le contrôle à chaque étape.",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: BookOpen,
    title: "Base de connaissances (RAG)",
    desc: "Enrichissez la mémoire de l'équipe avec vos chartes, tarifs et process : les agents répondent selon vos règles.",
    color: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  },
  {
    icon: Building2,
    title: "Espace client cloisonné",
    desc: "Chaque entreprise dispose de son espace isolé. Le super-admin supervise l'ensemble des clients depuis le siège.",
    color: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  },
  {
    icon: Sliders,
    title: "Modèles IA configurables",
    desc: "Utilisez l'IA gratuite intégrée ou branchez votre propre clé OpenAI / compatible, par espace client.",
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  },
];

const AGENTS = [
  {
    name: "Léa",
    role: "Community Manager",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    caps: ["Social media", "Community", "Calendrier éditorial"],
    emoji: "📣",
  },
  {
    name: "Marc",
    role: "Analyste de Données",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    caps: ["Data analysis", "Reporting", "KPIs"],
    emoji: "📊",
  },
  {
    name: "Sophie",
    role: "Rédactrice & Storyteller",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80",
    caps: ["Copywriting", "Storytelling", "SEO"],
    emoji: "✍️",
  },
  {
    name: "Thomas",
    role: "Assistant RH & Organisation",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    caps: ["Recrutement", "Contrats", "Onboarding"],
    emoji: "🛠️",
  },
];

const PLANS = [
  {
    name: "Découverte",
    price: "0 €",
    period: "/ mois",
    desc: "Pour explorer l'équipe virtuelle librement.",
    features: ["4 agents IA actifs", "IA gratuite intégrée", "Bureau Virtuel & Chat", "File de validation"],
    cta: "Commencer gratuitement",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "79 €",
    period: "/ mois",
    desc: "Pour les TPE & PME qui veulent passer à la vitesse supérieure.",
    features: [
      "Agents illimités",
      "Votre clé OpenAI / modèle",
      "Base de connaissances illimitée",
      "Routage & collaboration avancés",
      "Support prioritaire",
    ],
    cta: "Démarrer l'essai 14 jours",
    highlighted: true,
  },
  {
    name: "Entreprise",
    price: "Sur mesure",
    period: "",
    desc: "Pour les organismes multi-espaces et cas avancés.",
    features: ["Multi-tenants & super-admin", "Déploiement dédié", "SLA & accompagnement", "SSO & audit logs"],
    cta: "Contacter l'équipe",
    highlighted: false,
  },
];

const STEPS = [
  {
    icon: Users,
    title: "1. Recrutez vos agents",
    desc: "Choisissez l'équipe dont vous avez besoin : community manager, analyste, rédactrice, RH... chacun avec sa personnalité.",
  },
  {
    icon: MessagesSquare,
    title: "2. Confiez vos missions",
    desc: "Une consigne suffit. L'équipe se coordonne, se consulte et vous présente un livrable structuré, étape par étape.",
  },
  {
    icon: KeyRound,
    title: "3. Validez en un clic",
    desc: "Chaque action externe passe par votre file de validation. Approbation ou refus, vous gardez la main.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans scroll-smooth">
      {/* ===== NAVBAR ===== */}
      <header className="border-b border-slate-800/70 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
              SynergyAI
              <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                SaaS
              </span>
            </div>
            <p className="text-[11px] text-slate-400">L&apos;équipe virtuelle autonome de votre entreprise</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300">
          <Link href="#fonctionnalites" className="hover:text-white transition">
            Fonctionnalités
          </Link>
          <Link href="#agents" className="hover:text-white transition">
            L&apos;équipe
          </Link>
          <Link href="#methodo" className="hover:text-white transition">
            Comment ça marche
          </Link>
          <Link href="#tarifs" className="hover:text-white transition">
            Tarifs
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-4 py-2 rounded-lg shadow-md shadow-indigo-500/20 transition"
          >
            <KeyRound className="w-4 h-4" />
            Connexion
          </Link>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.10),transparent_55%)]" />

          <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                SaaS Multi-Agents nouvelle génération
              </span>
              <h1 className="font-extrabold text-4xl sm:text-5xl lg:text-[3.4rem] leading-[1.08] tracking-tight text-white">
                Votre équipe virtuelle autonome,{" "}
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  au service de votre entreprise
                </span>
              </h1>
              <p className="mt-5 text-lg text-slate-400 leading-relaxed max-w-lg">
                Confiez vos missions à des agents IA spécialisés qui collaborent entre eux, produisent les livrables
                et soumettent chaque action à votre <strong className="text-slate-200">validation</strong>.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-stretch gap-4">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 font-semibold px-7 py-3.5 rounded-xl shadow-lg shadow-indigo-500/30 transition"
                >
                  <Rocket className="w-5 h-5" />
                  Lancer la démo
                </Link>
                <Link
                  href="#fonctionnalites"
                  className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 font-semibold px-7 py-3.5 rounded-xl transition"
                >
                  Découvrir les fonctionnalités
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="mt-9 grid grid-cols-3 gap-6 max-w-md">
                {[
                  { v: "4+", l: "Agents spécialisés" },
                  { v: "0", l: "Serveur à gérer" },
                  { v: "100%", l: "Vous validez tout" },
                ].map((s) => (
                  <div key={s.l}>
                    <div className="text-2xl font-bold text-white">{s.v}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aperçu produit (mock) */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-600/20 to-violet-600/20 blur-2xl rounded-3xl" />
              <div className="relative bg-slate-900 border border-slate-700/70 rounded-2xl p-5 shadow-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    4 agents en ligne
                  </span>
                </div>

                <div className="py-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                      alt="Léa"
                      className="w-8 h-8 rounded-full object-cover border border-indigo-500/40"
                    />
                    <div className="bg-slate-800 rounded-xl rounded-tl-sm px-3 py-2 text-xs text-slate-300">
                      J&apos;ai préparé le post LinkedIn de mardi. Marc, peux-tu croiser les chiffres du dernier
                      post ? 📊
                    </div>
                  </div>
                  <div className="flex items-start justify-end gap-3">
                    <div className="bg-slate-800 rounded-xl rounded-tr-sm px-3 py-2 text-xs text-slate-300">
                      C&apos;est fait Léa ! +34% d&apos;engagement. Le visuel ploté est prêt. ✅
                    </div>
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                      alt="Marc"
                      className="w-8 h-8 rounded-full object-cover border border-emerald-500/40"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-3 flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 mr-1">
                    Validation requise :
                  </span>
                  <span className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    Publication LinkedIn
                  </span>
                  <span className="ml-auto text-emerald-400 font-semibold">✓ Approuver</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FONCTIONNALITÉS ===== */}
        <section id="fonctionnalites" className="border-t border-slate-800/70 bg-slate-900/30 py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
                Fonctionnalités
              </span>
              <h2 className="font-bold text-3xl sm:text-4xl tracking-tight text-white mt-3">
                Tout ce qu&apos;un petit service peut faire, sans le recruter
              </h2>
              <p className="text-slate-400 mt-4">
                Une plateforme pensée pour les TPE & PME : puissante, mais simple à utiliser au quotidien.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-6 transition group"
                >
                  <div className={`inline-flex p-3 rounded-xl border mb-4 ${f.color}`}>
                    <f.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-white">{f.title}</h3>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== ÉQUIPE D'AGENTS ===== */}
        <section id="agents" className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                L&apos;équipe type
              </span>
              <h2 className="font-bold text-3xl sm:text-4xl tracking-tight text-white mt-3">
                Des agents avec des personnalités
              </h2>
              <p className="text-slate-400 mt-4">
                Pas des chatbots génériques : des profils humains, complémentaires et spécialisés.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {AGENTS.map((a) => (
                <div
                  key={a.name}
                  className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 text-center transition"
                >
                  <div className="relative inline-block">
                    <img
                      src={a.avatar}
                      alt={a.name}
                      className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500/40 mx-auto"
                    />
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                  </div>
                  <h3 className="font-bold text-lg text-white mt-4">
                    {a.name} <span className="align-middle">{a.emoji}</span>
                  </h3>
                  <p className="text-xs font-semibold text-indigo-400">{a.role}</p>
                  <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                    {a.caps.map((c) => (
                      <span
                        key={c}
                        className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700/60"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg py-1.5">
                    Prêt à collaborer
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-slate-500 mt-8">
              <Zap className="w-4 h-4 inline text-amber-400 mr-1" />
              Recrutez ensuite un juriste, un comptable ou tout autre profil : l&apos;équipe apprend à le solliciter.
            </p>
          </div>
        </section>

        {/* ===== COMMENT ÇA MARCHE ===== */}
        <section
          id="methodo"
          className="border-y border-slate-800/70 bg-slate-900/30 py-20"
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">
                Méthode
              </span>
              <h2 className="font-bold text-3xl sm:text-4xl tracking-tight text-white mt-3">
                Fini les allers-retours, l&apos;équipe avance
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {STEPS.map((s) => (
                <div key={s.title} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="inline-flex p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 mb-4">
                    <s.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-white">{s.title}</h3>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== TARIFS ===== */}
        <section id="tarifs" className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">Tarifs</span>
              <h2 className="font-bold text-3xl sm:text-4xl tracking-tight text-white mt-3">
                Un prix pensé pour les petites structures
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {PLANS.map((p) => (
                <div
                  key={p.name}
                  className={`rounded-2xl p-7 flex flex-col border transition ${
                    p.highlighted
                      ? "bg-gradient-to-b from-indigo-950/60 to-slate-900 border-indigo-500/50 shadow-xl shadow-indigo-500/10"
                      : "bg-slate-900 border-slate-800"
                  }`}
                >
                  {p.highlighted && (
                    <span className="self-start text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white px-2.5 py-1 rounded-full mb-4">
                      Le plus populaire
                    </span>
                  )}
                  <h3 className="font-bold text-white">{p.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">{p.price}</span>
                    <span className="text-sm text-slate-500">{p.period}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{p.desc}</p>
                  <ul className="mt-6 space-y-2.5 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/login"
                    className={`mt-7 flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition ${
                      p.highlighted
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                        : "bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200"
                    }`}
                  >
                    {p.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CTA FINAL ===== */}
        <section className="px-6 pb-20">
          <div className="max-w-4xl mx-auto relative overflow-hidden rounded-3xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-600 p-12 text-center shadow-2xl shadow-indigo-500/20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="relative">
              <h2 className="font-extrabold text-3xl sm:text-4xl tracking-tight text-white">
                Prêt à déléguer à votre équipe virtuelle ?
              </h2>
              <p className="mt-4 text-indigo-100 max-w-xl mx-auto">
                Découvrez la démo avec une équipe de boulangerie artisanale : community manager, analyste,
                rédactrice et RH y collaborent déjà.
              </p>
              <Link
                href="/login"
                className="mt-8 inline-flex items-center gap-2 bg-white hover:bg-indigo-50 text-indigo-700 font-bold px-8 py-4 rounded-xl shadow-lg transition"
              >
                Essayer maintenant
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-slate-800/70 px-6 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-white">SynergyAI</div>
              <div className="text-xs text-slate-500">L&apos;équipe virtuelle autonome au service des TPE & PME</div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-400">
            <Link href="#fonctionnalites" className="hover:text-white transition">
              Fonctionnalités
            </Link>
            <Link href="#agents" className="hover:text-white transition">
              L&apos;équipe
            </Link>
            <Link href="#tarifs" className="hover:text-white transition">
              Tarifs
            </Link>
            <Link href="/login" className="hover:text-white transition">
              Connexion
            </Link>
          </div>

          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5" />
            MVP pédagogique — FastAPI · Next.js · SQLite
          </div>
        </div>
      </footer>
    </div>
  );
}