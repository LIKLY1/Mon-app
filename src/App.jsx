// App.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, Tooltip,
  XAxis, YAxis, Legend, ResponsiveContainer, Cell
} from "recharts";
import {
  Plus, LineChart as LineChartIcon, Package, CheckCircle2, Pencil, Trash2,
  ShoppingCart, Save, Search, ArrowRightLeft, Wallet, Layers, Users
} from "lucide-react";
import { supabase } from "./supabaseClient";
import Papa from "papaparse";
import AuthPage from "./AuthPage";
import logo from "./logo.png";


// --- Constants / Types ---
const CATEGORIES = ["pokémon", "chaussure", "ticket", "random"];

/**
 * Article shape:
 * {
 *  id, nom, taille, categorie, sousCategorie, prixAchat,
 *  lieuAchat, dateAchat, quantite, vendu,
 *  dateRevente, prixRevente, lieuRevente, created_at
 * }
 */

const CATALOGUE = [

];


// --- Tiny UI helpers ---
function classNames(...xs) { return xs.filter(Boolean).join(" "); }
const Card = ({ children, className, onClick }) => (
  <div
    onClick={onClick}
    className={classNames(
      "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 rounded-2xl shadow-lg p-5",
      onClick ? "cursor-pointer hover:shadow-xl transition-transform hover:-translate-y-0.5" : "",
      className
    )}
  >
    {children}
  </div>
);
const Badge = ({ children, variant = "default" }) => {
  const styles = {
    default: "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700",
    success: "bg-green-50 text-green-600 border border-green-600",
  };

  return (
    <span className={`px-2 py-0.5 text-xs rounded-full ${styles[variant]}`}>
      {children}
    </span>
  );
};

const Field = ({ label, required=false, children }) => (
  <label className="grid gap-1">
    <span className="text-sm text-zinc-600 dark:text-zinc-300">{label}{required && <span className="text-red-500"> *</span>}</span>
    {children}
  </label>
);
const Input = ({ className = '', ...props }) => (
  <input
    {...props}
    className={classNames(
      'w-full rounded-xl border px-3 py-2 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 ring-zinc-300 dark:ring-zinc-600',
      'text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500',
      className
    )}
  />
);

const Select = ({ options = [], className = '', ...props }) => (
  <select
    {...props}
    className={classNames(
      'w-full rounded-xl border px-3 py-2 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 ring-zinc-300 dark:ring-zinc-600',
      'text-zinc-900 dark:text-zinc-50',
      className
    )}
  >
    {options.map(o => <option key={o} value={o} className="text-zinc-900 dark:text-zinc-50">{o}</option>)}
  </select>
);

export const Button = ({ children, variant="solid", icon: Icon, className, neon=false, ...props }) => {
  const variants = {
    solid: "bg-[#0F766E] text-white hover:bg-[#0C5D55] btn-neon", // couleur néon
    outline: "border border-[#0F766E] text-[#0F766E] hover:bg-[#E6FFFA]",
    subtle: "bg-[#D1FAE5] text-[#0F766E] hover:bg-[#A7F3D0]",
    danger: "bg-red-600 text-white hover:bg-red-700", // couleur bouton supprimer
    success: "bg-green-50 text-green-600 border border-green-600 hover:bg-green-100", // couleur bouton vendre
    info: "bg-blue-50 text-blue-600 border border-blue-600 hover:bg-blue-100", // couleur bleue
  };

  return (
    <button
      {...props}
      className={classNames(
        "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl transition relative overflow-visible focus:outline-none",
        variants[variant],
        neon ? "btn-neon" : "",
        className
      )}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
};



// --- App principal ---
export default function AppComptaAchatRevente() {
  const [articles, setArticles] = useState([]);
  const [vue, setVue] = useState("dashboard");
  const [filtre, setFiltre] = useState({
  q: "",
  categorie: "toutes",
  etat: "tous",
  dateAchat: "",
  dateRevente: "",
  lieuAchat: "",
  lieuRevente: ""
});
  const [editing, setEditing] = useState(null);
  const [kpiDetail, setKpiDetail] = useState(null);
  const [dateFilter, setDateFilter] = useState({
  from: "", // début (YYYY-MM-DD)
  to: "",   // fin (YYYY-MM-DD)
});

      
      


// ajout dans AppComptaAchatRevente (au même niveau que articles, vue, etc.)
const [user, setUser] = useState(null);
const [logoutMsg, setLogoutMsg] = useState(null);


// initialise la session / écoute les changements d'auth
useEffect(() => {
  let mounted = true;
  // get current session (supabase-js v2)
  supabase.auth.getSession().then(({ data }) => {
    if (!mounted) return;
    setUser(data?.session?.user ?? null);
  });

  // écouter les changements d'auth (login/logout)
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
  });

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, []);

  

  // fetch depuis Supabase
  async function fetchArticles() {
  // si pas connecté, ne pas exposer d'articles privés (tu peux aussi choisir d'afficher rien)
  if (!user) {
    setArticles([]);
    return;
  }

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    setArticles([]);
  } else {
    setArticles(data || []);
  }
}


  useEffect(() => { fetchArticles(); }, [user]);


function inDateRange(dateStr, from, to) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (from && new Date(from) > d) return false;
  if (to && new Date(to) < d) return false;
  return true;
}

  // KPIs & derived
  const kpis = useMemo(() => {
  const articlesInvestis = articles.filter(a =>
    inDateRange(a.dateAchat, dateFilter.from, dateFilter.to)
  );
  const articlesRevendus = articles.filter(a =>
    a.vendu && a.dateRevente && inDateRange(a.dateRevente, dateFilter.from, dateFilter.to)
  );

  const totalInvesti = articlesInvestis.reduce((s,a)=> s + (a.prixAchat || 0) * (a.quantite||1), 0);
  const totalRevenu = articlesRevendus.reduce((s,a)=> s + (a.prixRevente || 0) * (a.quantite||1), 0);
  const totalInvestiVendus = articlesRevendus.reduce((s,a)=> s + (a.prixAchat || 0) * (a.quantite||1), 0);
  const profit = totalRevenu - totalInvestiVendus;
  const roi = totalInvesti > 0 ? (profit/totalInvesti)*100 : 0;

  // ⚠️ Ces valeurs restent globales, non filtrées
  const invNonVendus = articles.filter(a=>!a.vendu).reduce((s,a)=> s + (a.prixAchat||0)*(a.quantite||1), 0);
  const nbNonVendus = articles.filter(a=>!a.vendu).length;
  const nbVendus = articles.filter(a=>a.vendu).length;

   return { 
    totalInvesti, 
    totalRevenu, 
    profit, 
    roi, 
    invNonVendus, 
    nbNonVendus, 
    nbVendus, 
     };

}, [articles, dateFilter]);

  const articlesFiltres = useMemo(() => {
  return (articles || []).filter((a) => {
    // catégorie
    if (filtre.categorie !== "toutes" && a.categorie !== filtre.categorie) return false;

    // état (vendus / nonvendus / tous)
    if (filtre.etat !== "tous") {
      if (filtre.etat === "vendus" && !a.vendu) return false;
      if (filtre.etat === "nonvendus" && a.vendu) return false;
    }

    // recherche texte
    if (filtre.q) {
      const q = filtre.q.toLowerCase();
      const blob = `${a.nom} ${a.taille || ""} ${a.categorie} ${a.sousCategorie || ""} ${a.lieuAchat || ""} ${a.lieuRevente || ""}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }

    // date d'achat exacte (YYYY-MM-DD)
    if (filtre.dateAchat) {
      if (!a.dateAchat || a.dateAchat.slice(0, 10) !== filtre.dateAchat) return false;
    }

    // date de revente exacte (YYYY-MM-DD)
    if (filtre.dateRevente) {
      if (!a.dateRevente || a.dateRevente.slice(0, 10) !== filtre.dateRevente) return false;
    }

    // lieu d'achat contient (insensible à la casse)
    if (filtre.lieuAchat) {
      const needle = filtre.lieuAchat.toLowerCase();
      if (!a.lieuAchat || !a.lieuAchat.toLowerCase().includes(needle)) return false;
    }

    // lieu de vente contient (insensible à la casse)
    if (filtre.lieuRevente) {
      const needle = filtre.lieuRevente.toLowerCase();
      if (!a.lieuRevente || !a.lieuRevente.toLowerCase().includes(needle)) return false;
    }

    return true;
  });
}, [articles, filtre]);

  const ventesParMois = useMemo(()=>{
  const map = new Map();
  articles.filter(a => a.vendu && inDateRange(a.dateRevente, dateFilter.from, dateFilter.to))
    .forEach(a=>{
      const m = (a.dateRevente||"").slice(0,7);
      map.set(m, (map.get(m)||0) + (a.prixRevente||0)*(a.quantite||1));
    });
  return Array.from(map.entries()).sort().map(([mois,val])=>({ mois, revenu: Math.round(val) }));
}, [articles, dateFilter]);

const profitParMois = useMemo(()=>{
  const map = new Map();
  articles.filter(a => a.vendu && inDateRange(a.dateRevente, dateFilter.from, dateFilter.to))
    .forEach(a=>{
      const m = (a.dateRevente||"").slice(0,7);
      const profit = ((a.prixRevente||0)-(a.prixAchat||0))*(a.quantite||1);
      map.set(m, (map.get(m)||0) + profit);
    });
  return Array.from(map.entries()).sort().map(([mois,val])=>({ mois, profit: Math.round(val) }));
}, [articles, dateFilter]);

const repartitionCategories = useMemo(() => {
  const map = new Map();

  articles
    .filter(a => inDateRange(a.dateAchat, dateFilter.from, dateFilter.to)) // filtre appliqué ici
    .forEach(a => {
      map.set(a.categorie, (map.get(a.categorie) || 0) + 1);
    });

  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}, [articles, dateFilter]); // ⚠️ bien mettre dateFilter dans les dépendances

const profitParCategorie = useMemo(() => {
  const map = new Map();

  (articles || [])
    .filter(a => a.vendu && inDateRange(a.dateRevente, dateFilter.from, dateFilter.to))
    .forEach(a => {
      const profit = ((a.prixRevente || 0) - (a.prixAchat || 0)) * (a.quantite || 1);
      map.set(a.categorie, (map.get(a.categorie) || 0) + profit);
    });

  return Array.from(map.entries()).map(([name, value]) => ({
    name,
    value: Math.round(value),
  }));
}, [articles, dateFilter]);



  // CRUD -> Supabase
    async function addArticle(articleOrArray) {
  if (!user) {
    alert("Tu dois être connecté pour ajouter des articles.");
    return { error: new Error("Not authenticated") };
  }
  const payload = Array.isArray(articleOrArray) ? articleOrArray : [articleOrArray];
  // attache user_id à chaque ligne
  const payloadWithOwner = payload.map(a => ({ ...a, user_id: user.id }));

  const { data, error } = await supabase.from("articles").insert(payloadWithOwner);
  if (error) { console.error("Insert error:", error); return { error }; }
  await fetchArticles();
  return { data };
}



  async function updateArticle(id, patch) {
  if (!id) {
    console.error("❌ updateArticle: id manquant");
    alert("Erreur: id manquant pour la mise à jour.");
    return { error: new Error("missing id") };
  }

  console.log("🔍 updateArticle -> id:", id, "patch:", patch);

  // Supabase n'aime pas qu'on envoie 'id' dans le body d'update
  const { id: _, ...fieldsToUpdate } = patch;

  // ✅ Nettoyage: convertir '' -> null pour éviter les erreurs de type côté Postgres
  const clean = (v) => (v === "" ? null : v);
  const fields = {
    nom: fieldsToUpdate.nom,
    taille: clean(fieldsToUpdate.taille),
    categorie: fieldsToUpdate.categorie,
    sousCategorie: clean(fieldsToUpdate.sousCategorie),
    prixAchat: Number(fieldsToUpdate.prixAchat ?? 0),
    lieuAchat: clean(fieldsToUpdate.lieuAchat),
    dateAchat: fieldsToUpdate.dateAchat, // string "YYYY-MM-DD"
    quantite: Number(fieldsToUpdate.quantite ?? 1),
    vendu: Boolean(fieldsToUpdate.vendu),
    dateRevente: clean(fieldsToUpdate.dateRevente), // null ou "YYYY-MM-DD"
    prixRevente: fieldsToUpdate.prixRevente != null ? Number(fieldsToUpdate.prixRevente) : null,
    lieuRevente: clean(fieldsToUpdate.lieuRevente),
  };

  // 🔁 Mise à jour + retour de la ligne modifiée pour maj locale
  const { data, error } = await supabase
    .from("articles")
    .update(fields)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("❌ Supabase update error:", error);
    alert("Erreur Supabase (update): " + (error.message || "voir console"));
    return { error };
  }

  // ✅ Mise à jour locale (pas besoin de refetch complet)
  setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));

  console.log("✅ Update OK:", data);
  return { success: true, data };
}



  async function deleteArticle(id) {
  const { data, error } = await supabase
    .from("articles")
    .delete()
    .eq("id", id)
    .eq("user_id", user?.id);

  if (error) {
    console.error("Delete error:", error);
    return { error };
  } else {
    await fetchArticles();
    return { data };
  }
}


  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-50">
     <header className="sticky top-0 z-10 backdrop-blur bg-white/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800">
  <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
    <img src={logo} className="h-16 w-auto" />
<h1 className="font-semibold text-lg">MoneyTrackR</h1>


    <div className="ml-auto flex items-center gap-2">
      <Button icon={Plus} onClick={() => setVue("nouvel")}>
        Nouvel achat
      </Button>

      {/* Bouton Connexion / Déconnexion */}
      {user ? (
        <Button
  variant="outline"
  onClick={async () => {
    await supabase.auth.signOut();
    setLogoutMsg("Déconnecté avec succès ✅");
    setVue("auth");
  }}
>
  Déconnexion
</Button>

      ) : (
        <Button variant="outline" onClick={() => setVue("auth")}>
          Connexion
        </Button>
      )}
    </div>
  </div>

  <nav className="max-w-7xl mx-auto px-4 pb-3">
    <div className="inline-flex rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-1">
      {[
        { key: "dashboard", label: "Dashboard", icon: LineChartIcon },
        { key: "inventaire", label: "Inventaire", icon: Package },
        { key: "nouvel", label: "Nouvel achat", icon: ShoppingCart },
      ].map((t) => (
        <button
          key={t.key}
          onClick={() => setVue(t.key)}
          className={classNames(
  "flex items-center gap-2 px-4 py-2 rounded-xl transition",
  vue === t.key
    ? "bg-white dark:bg-zinc-900 tab-neon"
    : "opacity-70 hover:opacity-100"
)}

        >
          <t.icon size={16} /> {t.label}
        </button>
      ))}
    </div>
  </nav>
</header>




      <main className="max-w-7xl mx-auto px-4 py-6 grid gap-6">
        {vue === "dashboard" && (
          <Dashboard
            kpis={kpis}
            ventesParMois={ventesParMois}
            profitParMois={profitParMois}
            repartitionCategories={repartitionCategories}
            profitParCategorie={profitParCategorie}
            onOpenDetail={setKpiDetail}
            articles={articles}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
          />
        )}

        {vue === "inventaire" && (
          <Inventaire
            articles={articlesFiltres}
            setFiltre={setFiltre}
            filtre={filtre}
            onEdit={setEditing}
            onDelete={deleteArticle}
            onArticlesUpdate={fetchArticles}
            setArticles={setArticles}
            user={user}
          />
        )}

{vue === "nouvel" && (
  user ? (
    <NouvelAchat
      onSubmit={addArticle}
      user={user}
      onAskLogin={() => setVue("auth")}
    />
  ) : (
    <Card className="p-6">
      <p className="mb-3">
        Tu dois être connecté pour ajouter un produit au catalogue.
      </p>
      <Button onClick={() => setVue("auth")}>Se connecter</Button>
    </Card>
  )
)}


        {vue === "auth" && (
  <AuthPage
    onBack={() => setVue("dashboard")}
    onSuccess={() => setVue("dashboard")}
    logoutMsg={logoutMsg} // ✅ on envoie le message
  />
)}



      </main>

      <AnimatePresence>
  {editing && (
    <Modal onClose={() => setEditing(null)}>
      <EditForm
        initial={editing}
        onSave={async (patch) => {
          const res = await updateArticle(editing.id, patch);
          if (!res.error) {
            setEditing(null); // ferme seulement si succès
          }
        }}
      />
    </Modal>
  )}
</AnimatePresence>

<AnimatePresence>
  {kpiDetail && (
    <Modal onClose={() => setKpiDetail(null)}>
      <KPIDetail detail={kpiDetail} onClose={() => setKpiDetail(null)} />
    </Modal>
  )}
</AnimatePresence>

      <footer className="max-w-7xl mx-auto px-4 py-8 text-xs opacity-70">
        Fait pour simplifier ta compta d'achat–revente. 
      </footer>
    </div>
  );
}


// ---------------- NouvelAchat ----------------
function NouvelAchat({ onSubmit, user, onAskLogin }) {
  // formulaire local
  const [f, setF] = useState({
    nom: "",
    taille: "",
    categorie: CATEGORIES[0],
    sousCategorie: "",
    prixAchat: "",
    lieuAchat: "",
    dateAchat: new Date().toISOString().slice(0, 10),
    quantite: 1,
  });

  const [q, setQ] = useState("");

  // catalogue provenant de Supabase (fallback depuis CATALOGUE défini en dur)
  const PAGE_SIZE = 200; // charge 200 produits par page (ajuste si tu veux)
  const [catalogue, setCatalogue] = useState(() =>
    (CATALOGUE || []).map((c, i) => ({
      id: `fallback-${i}`,
      nom: c.nom,
      categorie: c.categorie || "",
      image_url: c.image || c.image_url || null,
    }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // état pour le nouveau produit catalogue
const [newProduct, setNewProduct] = useState({
  nom: "",
  categorie: CATEGORIES[0],
});
const [file, setFile] = useState(null);

const [adding, setAdding] = useState(false);
const [selectedItem, setSelectedItem] = useState(null);
const formRef = React.useRef(null);
// état qui indique qu'on affiche uniquement l'item sélectionné (sans toucher au catalogue réel)
const [catalogueCollapsed, setCatalogueCollapsed] = useState(false);

// ajout persistant d’un produit au catalogue
// Remplace ta fonction addToCatalogue par celle-ci
async function addToCatalogue(e) {
  e.preventDefault();

  if (!user) {
    alert("Tu dois être connecté pour ajouter un produit au catalogue.");
    onAskLogin?.();
    return;
  }

  // Vérifie doublon (optionnel : je laisse ton idée mais je recommande un match exact)
  const { data: existing, error: existingError } = await supabase
    .from("catalogue")
    .select("id, nom")
    .ilike("nom", q.trim()); // si tu veux partial => `%${q.trim()}%`

  if (existingError) {
    console.error("Erreur check existant:", existingError);
    alert("Erreur lors de la vérification du catalogue.");
    return;
  }
  if (existing && existing.length > 0) {
    alert(`Le produit "${existing[0].nom}" existe déjà dans le catalogue.`);
    onRedirectToProduct?.(existing[0].id);
    return;
  }

  // upload image si fournie
  let url = null;
  if (file) {
    const safeName = file.name
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_");

    const path = `${user.id}/${Date.now()}_${safeName}`; // évite collisions

    // upload
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("catalogue")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    console.log("uploadData, uploadError:", uploadData, uploadError);
    if (uploadError) {
      console.error("Upload error:", uploadError);
      alert("Erreur lors de l'upload de l'image : " + (uploadError.message || uploadError));
      return;
    }

    // get public url (si bucket public) — getPublicUrl renvoie l'objet contenant publicUrl
    const publicUrlResp = supabase.storage.from("catalogue").getPublicUrl(uploadData.path);
    console.log("publicUrlResp:", publicUrlResp);
    const publicUrl = publicUrlResp?.data?.publicUrl || publicUrlResp?.publicUrl;
    if (!publicUrl) {
      console.error("Impossible d'obtenir l'URL publique. Vérifie le bucket (public/private).", publicUrlResp);
      alert("Impossible de récupérer l'URL publique de l'image (vérifie les permissions du bucket).");
      return;
    }
    url = publicUrl;
  }

  // Construis le payload en respectant les noms de colonnes de ta table Supabase
  const payload = {
    nom: q.trim(),
    categorie: newProduct.categorie,
    image_url: url, // null ou string
    // ATTENTION : utilise le nom de colonne exact pour la sous-catégorie (ex : 'sous_categorie' ou 'sousCategorie')
  };
  // Si tu souhaites inclure la sous-catégorie et que ta colonne s'appelle 'sous_categorie' :
  if (newProduct.sousCategorie) payload.sous_categorie = newProduct.sousCategorie;
  // Si ta table nécessite user_id (RLS), attache-le :
  if (user?.id) payload.user_id = user.id;

  console.log("insert payload:", payload);

  const { data: insertData, error: insertError } = await supabase
    .from("catalogue")
    .insert([payload])
    .select()
    .single(); // récupère la ligne insérée

  if (insertError) {
    console.error("Insert error:", insertError);
    alert("Erreur lors de l'ajout au catalogue : " + (insertError.message || JSON.stringify(insertError)));
    return;
  }

  // succès : mets à jour l'UI locale
  setCatalogue((prev) => [insertData, ...(prev || [])]);
  alert("Article ajouté au catalogue !");
  setAdding(false);
  setFile(null);
  setNewProduct({ nom: "", categorie: CATEGORIES[0], sousCategorie: "" });
}




  // fetch paginé (on utilise range pour ne pas ramener tout si tu as 2000 items)
  useEffect(() => {
    let mounted = true;
    async function fetchPage(p) {
      setLoading(true);
      setError(null);
      try {
        const from = p * PAGE_SIZE;
        const to = p * PAGE_SIZE + PAGE_SIZE - 1;
        const { data, error: err } = await supabase
          .from("catalogue")
          .select("id, nom, categorie, image_url")
          .order("nom", { ascending: true })
          .range(from, to);

        if (!mounted) return;
        if (err) {
          console.error("Catalogue fetch error:", err);
          setError(err.message || "Erreur lors de la récupération du catalogue");
          setLoading(false);
          return;
        }

        if (Array.isArray(data) && data.length > 0) {
          // si page 0, on remplace le fallback ; sinon on concatène
          setCatalogue((prev) => (p === 0 ? data : [...prev, ...data]));
          setHasMore(data.length === PAGE_SIZE);
        } else {
          // aucune donnée renvoyée → plus de pages
          if (p === 0) {
            // ne rien faire si on garde le fallback
          }
          setHasMore(false);
        }
      } catch (e) {
        console.error(e);
        setError(String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchPage(page);
    return () => {
      mounted = false;
    };
  }, [page]);

  // recherche côté client
  // recherche côté client
const filteredCatalog = useMemo(() => {
  // si on est en "collapsed" et qu'il y a un selectedItem, on ne renvoie que lui
  if (catalogueCollapsed && selectedItem) return [selectedItem];

  const s = q.trim().toLowerCase();
  if (!s) return catalogue;

  return catalogue.filter(
    (c) =>
      (c.nom || "").toLowerCase().includes(s) ||
      (c.categorie || "").toLowerCase().includes(s)
  );
}, [catalogue, q, catalogueCollapsed, selectedItem]);

// grouper le catalogue par catégorie pour afficher des sections distinctes
const groupedCatalogByCategory = useMemo(() => {
  const map = new Map();
  (filteredCatalog || []).forEach((it) => {
    const key = it.categorie || "Autres";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(it);
  });

  // retourne un tableau [categorie, items[]] trié par nom de catégorie
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}, [filteredCatalog]);



  // sélection d'un produit dans le catalogue : préremplit le formulaire
function chooseCatalogItem(item) {
  // préremplit le formulaire
  setF((prev) => ({ ...prev, nom: item.nom, categorie: item.categorie || prev.categorie }));
  setSelectedItem(item);
  // on n'écrase pas le catalogue : on active le mode "catalogue réduit"
  setCatalogueCollapsed(true);

  // scroll automatique vers le formulaire
  setTimeout(() => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
}



  // soumission : crée N lignes (1 par quantité) — **sans** stocker d'image en base
  async function submit(e) {
    e.preventDefault();
    if (!f.nom || !f.prixAchat) return;

    const quantite = Number(f.quantite || 1);
    const articles = Array.from({ length: quantite }, () => ({
      nom: f.nom,
      taille: f.taille || null,
      categorie: f.categorie,
      sousCategorie: f.sousCategorie || null,
      prixAchat: Number(f.prixAchat),
      lieuAchat: f.lieuAchat || null,
      dateAchat: f.dateAchat,
      quantite: 1,
      vendu: false,
    }));

    await onSubmit(articles);

    // reset du formulaire
    setF({
  nom: "",
  taille: "",
  categorie: CATEGORIES[0],
  sousCategorie: "",
  prixAchat: "",
  lieuAchat: "",
  dateAchat: new Date().toISOString().slice(0, 10),
  quantite: 1,
});
setQ("");
setSelectedItem(null);
setCatalogueCollapsed(false);

  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
  <div className="relative flex-1">
    <Search className="w-5 h-5 absolute left-3 top-2.5 opacity-60" />
    <Input
      placeholder="Rechercher un produit dans le catalogue…"
      className="pl-10"
      value={q}
      onChange={(e) => setQ(e.target.value)}
    />
  </div>

  {catalogueCollapsed && (
    <Button
      variant="outline"
      onClick={() => {
        setCatalogueCollapsed(false);
        setSelectedItem(null);
        setQ("");
      }}
      className="whitespace-nowrap"
    >
      ← Retour au catalogue
    </Button>
  )}
</div>


        {/* Grid des produits du catalogue */}
        {filteredCatalog.length > 0 ? (
  <>
    {groupedCatalogByCategory.map(([categoryName, items]) => (
      <div key={categoryName} className="w-full">
        {/* Titre de section */}
        <h3 className="text-lg font-semibold mb-3 mt-6 border-b pb-1">
          {categoryName}
        </h3>

        {/* Grille pour cette catégorie */}
        <div
  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
  style={{ gridAutoRows: "1fr" }}
>

          {items.map((item) => (
  <button
  key={item.id}
  type="button"
  onClick={() => chooseCatalogItem(item)}
  className={classNames(
    // classes existantes
    "rounded-2xl overflow-hidden border shadow-sm hover:shadow-md transition text-left",
    "border-black/70",
    // <-- Ajouté : forcer le bouton à occuper la largeur de la cellule et permettre le shrink
    "flex flex-col h-full w-full min-w-0",
    f.nom === item.nom ? "ring-2 ring-amber-400" : ""
  )}
>
  <div className="aspect-video bg-zinc-100 flex items-center justify-center overflow-hidden w-full">
    {item.image_url ? (
      <img src={item.image_url} alt={item.nom} className="w-full h-full object-cover" loading="lazy" />
    ) : (
      <div className="text-xs text-zinc-400 p-3">Pas d'image</div>
    )}
  </div>

  {/* <-- Ajouté : w-full + min-w-0 + overflow-hidden pour forcer largeur et permettre truncate */}
  <div
    className="px-3 py-2 font-medium h-12 flex items-center w-full min-w-0 overflow-hidden"
    style={{ backgroundColor: "#A8DADC", color: "white" }}
  >
    {/* <-- simplify : always truncate and show full value on hover via title */}
    <span className="truncate" title={item.nom}>
      {item.nom}
    </span>
  </div>
</button>

))}

        </div>
      </div>
    ))}
  </>
) : (

  // aucun résultat → proposer l’ajout
  <div className="p-4 border rounded-xl bg-zinc-50">
    {!adding ? (
  <Button
    onClick={() => {
      if (!user) {
        alert("Tu dois être connecté pour ajouter un produit au catalogue.");
        onAskLogin?.();
        return;
      }
      setAdding(true);
    }}
    icon={Plus}
  >
    Ajouter "{q}" à la liste
  </Button>
) : (
      <form onSubmit={addToCatalogue} className="grid gap-3">
        <Field label="Nom" required>
  <Input
    value={newProduct.nom}
    onChange={(e) =>
      setNewProduct((p) => ({ ...p, nom: e.target.value }))
    }
  />
</Field>

        <Field label="Catégorie">
          <Select
            value={newProduct.categorie}
            onChange={(e) =>
              setNewProduct((p) => ({ ...p, categorie: e.target.value }))
            }
            options={CATEGORIES}
          />
        </Field>
        <Field label="Image">
  <input
    type="file"
    accept="image/*"
    onChange={(e) => setFile(e.target.files?.[0] || null)}
    className="block w-full text-sm text-zinc-600"
  />
</Field>

        <div className="flex gap-2">
          <Button type="submit" icon={Save} disabled={!user}>
            Enregistrer dans le catalogue
          </Button>
          <Button
            type="button"
            variant="subtle"
            onClick={() => setAdding(false)}
          >
            Annuler
          </Button>
        </div>
      </form>
    )}
  </div>
)}

        {/* Charger plus si nécessaire */}
        <div className="flex justify-center mt-2 md:col-span-2 lg:col-span-4">
          {loading ? (
            <div className="text-sm text-zinc-500">Chargement…</div>
          ) : hasMore ? (
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
            >
              Charger plus
            </Button>
          ) : (
            <div className="text-sm text-zinc-400">Plus de produits</div>
          )}
        </div>

      {/* Formulaire d'achat (apparait quand un nom est present ou que l'on tape un nom) */}
      <AnimatePresence>
        {Boolean(f.nom) && (
          <motion.form
  ref={formRef} // 🆕 pour cibler le scroll
  onSubmit={submit}
  className="grid gap-4 md:grid-cols-2 mt-6"
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 6 }}
>

            <Field label="Catégorie">
              <Select
                value={f.categorie}
                onChange={(e) => setF({ ...f, categorie: e.target.value })}
                options={[...CATEGORIES]}
              />
            </Field>
            <Field label="Sous-catégorie (si ticket: catégorie de place)">
              <Input
                value={f.sousCategorie}
                onChange={(e) => setF({ ...f, sousCategorie: e.target.value })}
                placeholder="Ex: Catégorie Or, Pelouse, etc."
              />
            </Field>
            <Field label="Taille / Format">
              <Input
                value={f.taille}
                onChange={(e) => setF({ ...f, taille: e.target.value })}
                placeholder="Ex: 42 EU"
              />
            </Field>
            <Field label="Prix d'achat (€)" required>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={f.prixAchat}
                onChange={(e) => setF({ ...f, prixAchat: e.target.value })}
              />
            </Field>
            <Field label="Quantité">
              <Input
                type="number"
                min="1"
                value={f.quantite}
                onChange={(e) => setF({ ...f, quantite: e.target.value })}
              />
            </Field>
            <Field label="Lieu d'achat">
              <Input
                value={f.lieuAchat}
                onChange={(e) => setF({ ...f, lieuAchat: e.target.value })}
                placeholder="Ex: Paris, Vinted, Leboncoin"
              />
            </Field>
            <Field label="Date d'achat">
              <Input
                type="date"
                value={f.dateAchat}
                onChange={(e) => setF({ ...f, dateAchat: e.target.value })}
              />
            </Field>

            <div className="md:col-span-2 flex gap-2">
              <Button icon={Save} type="submit" variant="solid" neon className="pulse">
                Enregistrer l'achat
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ---------------- EditForm ----------------
function EditForm({ initial, onSave }) {
  const [f, setF] = useState(() => ({
    ...initial,
    prixAchat: initial.prixAchat != null ? String(initial.prixAchat) : "",
    prixRevente: initial.prixRevente != null ? String(initial.prixRevente) : "",
    quantite: initial.quantite || 1,
    dateRevente: initial.dateRevente || "",
    lieuRevente: initial.lieuRevente || "",
  }));
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    try {
      // ✅ venduAuto si date OU prix de revente renseigné
      const venduAuto =
        (f.dateRevente && String(f.dateRevente).trim().length > 0) ||
        (f.prixRevente !== "" && f.prixRevente != null);

      const patch = {
        nom: f.nom,
        taille: f.taille || null,
        categorie: f.categorie,
        sousCategorie: f.sousCategorie || null,
        prixAchat: Number(f.prixAchat),
        lieuAchat: f.lieuAchat || null,
        dateAchat: f.dateAchat, // "YYYY-MM-DD"
        quantite: Number(f.quantite || 1),

        vendu: venduAuto,
        dateRevente: venduAuto
          ? (f.dateRevente && String(f.dateRevente).trim().length > 0
              ? f.dateRevente
              : new Date().toISOString().slice(0, 10))
          : null,
        prixRevente: venduAuto ? Number(f.prixRevente || 0) : null,
        lieuRevente: venduAuto ? (f.lieuRevente || null) : null,
      };

      console.log("📝 Submit EditForm -> patch:", patch);

      // ⚠️ onSave doit retourner la promesse (c’est le cas dans ton App)
      const res = await onSave(patch);

      if (res && res.error) {
        console.error("❌ onSave error:", res.error);
        alert("Erreur lors de l’enregistrement: " + (res.error.message || "voir console"));
      } else {
        // Le parent ferme le modal si succès (setEditing(null))
        // On ne fait rien ici.
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      <Field label="Nom de l'article" required>
        <Input value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} />
      </Field>
      <Field label="Catégorie">
        <Select
          value={f.categorie}
          onChange={(e) => setF({ ...f, categorie: e.target.value })}
          options={["pokémon", "chaussure", "ticket", "random"]}
        />
      </Field>
      <Field label="Sous-catégorie">
        <Input value={f.sousCategorie || ""} onChange={(e) => setF({ ...f, sousCategorie: e.target.value })} />
      </Field>
      <Field label="Taille / Format">
        <Input value={f.taille || ""} onChange={(e) => setF({ ...f, taille: e.target.value })} />
      </Field>
      <Field label="Prix d'achat (€)" required>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={f.prixAchat}
          onChange={(e) => setF({ ...f, prixAchat: e.target.value })}
        />
      </Field>
      <Field label="Quantité">
        <Input type="number" min="1" value={f.quantite} onChange={(e) => setF({ ...f, quantite: e.target.value })} />
      </Field>
      <Field label="Lieu d'achat">
        <Input value={f.lieuAchat || ""} onChange={(e) => setF({ ...f, lieuAchat: e.target.value })} />
      </Field>
      <Field label="Date d'achat">
        <Input type="date" value={f.dateAchat} onChange={(e) => setF({ ...f, dateAchat: e.target.value })} />
      </Field>

      <Field label="Date de revente">
        <Input
          type="date"
          value={f.dateRevente}
          onChange={(e) => setF({ ...f, dateRevente: e.target.value })}
        />
      </Field>
      <Field label="Prix de revente (€)">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={f.prixRevente}
          onChange={(e) => setF({ ...f, prixRevente: e.target.value })}
        />
      </Field>
      <Field label="Lieu de revente">
        <Input value={f.lieuRevente || ""} onChange={(e) => setF({ ...f, lieuRevente: e.target.value })} />
      </Field>

      <div className="md:col-span-2">
        <Button type="submit" icon={Save} disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

// ---------------- Inventaire  ----------------
function Inventaire({ articles, filtre, setFiltre, onEdit, onDelete, setArticles, user }) {
  const [onglet, setOnglet] = useState("tous");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");

  const parseDate = (str) => {
  if (!str) return null;

  // Vérifie si c'est déjà au format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // Vérifie si c'est au format DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [day, month, year] = str.split('/');
    return `${year}-${month}-${day}`; // format YYYY-MM-DD
  }

  return null; // valeur invalide
};




  const fetchArticles = async () => {
  if (!user) {
    setArticles([]); // parent setter
    return;
  }
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("user_id", user.id)
    .order("dateAchat", { ascending: false });

  if (error) console.error("Erreur récupération articles:", error);
  else setArticles(data);
};


useEffect(() => {
  fetchArticles(); // Recharge les articles dès que le composant est monté
}, []);


  useEffect(() => {
    setFiltre((f) => ({ ...f, etat: onglet === "tous" ? "tous" : onglet }));
  }, [onglet, setFiltre]);

  const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;



  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const data = results.data.map((row) => {
  const dateAchat = parseDate(row.dateAchat || row.DateAchat);
  const dateRevente = parseDate(row.dateRevente || row.DateRevente);

  return {
    nom: row.nom || row.N || "",
    categorie: row.categorie || row.Cat || "",
    quantite: Number(row.quantite || row.Q || 1),
    taille: row.taille || row.T || "",
    dateAchat,
    lieuAchat: row.lieuAchat || row.Lieu || "",
    prixAchat: Number(row.prixAchat || row.PrixAchat || 0),
    sousCategorie: row.sousCategorie || row.SousCat || "",
    dateRevente,
    prixRevente: row.prixRevente ? Number(row.prixRevente) : null,
    lieuRevente: row.lieuRevente || row.LieuRevente || "",
    vendu: dateRevente ? true : false,
  };
});

      setImportData(data);
    },
  });
};


const handleImport = async () => {
  if (!importData.length) return alert("Aucune donnée à importer");
  if (!user) return alert("Tu dois être connecté pour importer des données.");

  const dataToInsert = importData.map(item => ({
    ...item,
    vendu: item.dateRevente ? true : false,
    // IMPORTANT : attache user_id (obligatoire si ta RLS check user_id = auth.uid())
    user_id: user.id,
  }));

  // si tu veux récupérer les lignes insérées tu peux ajouter .select()
  const { data, error } = await supabase
    .from("articles")
    .insert(dataToInsert)
    .select(); // facultatif mais pratique pour debug

  if (error) {
    alert("Erreur lors de l'import : " + error.message);
    console.error("Import error", error);
  } else {
    setSuccessMessage("Import réalisé avec succès ! (actualise la page)");
    setTimeout(() => setSuccessMessage(""), 10000);
    setShowImportModal(false);
    setImportData([]);

    // recharge automatiquement le tableau (ta fonction existante)
    fetchArticles();
  }
};



// Affichage du message de succès dans le JSX
{successMessage && (
  <div className="p-3 mb-2 text-green-800 bg-green-100 rounded">
    {successMessage}
  </div>
)}




  return (
    
    <div className="space-y-6">
      {successMessage && (
  <div className="p-3 mb-2 text-green-800 bg-green-100 rounded">
    {successMessage}
  </div>
)}

      {/* === Barre filtres sticky === */}
      <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 shadow-md p-4 rounded-xl">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Onglets */}
          <div className="flex border-b mb-4">
            {[
              { k: "tous", l: "Tout" },
              { k: "nonvendus", l: "Inventaire" },
              { k: "vendus", l: "Vendus" },
            ].map((t) => (
              <button
  key={t.k}
  onClick={() => setOnglet(t.k)}
  className={classNames(
    "px-4 py-2 -mb-[2px] transition",
    onglet === t.k
      ? "tab-neon-lite font-semibold"
      : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent"
  )}
>
  {t.l}
</button>


            ))}
          </div>

          {/* Bouton Importer */}
<div className="flex items-end ml-auto">
  <Button
  onClick={() => setShowImportModal(true)}
  variant="solid"
>
  Importer des données
</Button>

</div>


          {/* Filtres */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-[900px] mx-auto w-full">

            {/* Recherche */}
            <Field label="Recherche">
              <Input
                placeholder="Nom du produit"
                value={filtre.q}
                onChange={(e) => setFiltre((f) => ({ ...f, q: e.target.value }))}
              />
            </Field>

            {/* Catégorie */}
            <Field label="Catégorie">
              <Select
                value={filtre.categorie}
                onChange={(e) => setFiltre((f) => ({ ...f, categorie: e.target.value }))}
                options={["toutes", ...CATEGORIES]}
              />
            </Field>

            {/* Date achat */}
            <Field label="Date d'achat">
              <Input
                type="date"
                value={filtre.dateAchat || ""}
                onChange={(e) => setFiltre((f) => ({ ...f, dateAchat: e.target.value }))}
              />
            </Field>

            {/* Date revente */}
            <Field label="Date de revente">
              <Input
                type="date"
                value={filtre.dateRevente || ""}
                onChange={(e) => setFiltre((f) => ({ ...f, dateRevente: e.target.value }))}
              />
            </Field>

            {/* Lieu achat */}
            <Field label="Lieu d'achat">
              <Input
                value={filtre.lieuAchat || ""}
                onChange={(e) => setFiltre((f) => ({ ...f, lieuAchat: e.target.value }))}
              />
            </Field>

            {/* Lieu vente */}
            <Field label="Lieu de vente">
              <Input
                value={filtre.lieuRevente || ""}
                onChange={(e) => setFiltre((f) => ({ ...f, lieuRevente: e.target.value }))}
              />
            </Field>
          </div>
        </div>{/* <-- fermé le flex qui contient onglets + filtres */}
      </div>{/* <-- fermé le sticky */}

      {/* === Tableau inventaire === */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead className="text-left text-zinc-500">
              <tr>
                <th className="py-3 pr-4">Article</th>
                <th className="py-3 pr-4">Catégorie</th>
                <th className="py-3 pr-4">Date d'achat</th>
                <th className="py-3 pr-4">Lieu d'achat</th>
                <th className="py-3 pr-4">Prix Achat</th>
                <th className="py-3 pr-4">Date revente</th>
                <th className="py-3 pr-4">Lieu revente</th>
                <th className="py-3 pr-4">Prix revente</th>
                <th className="py-3 pr-4">Profit</th>
                <th className="py-3 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => {
                const achat = a.prixAchat || 0;
                const revenuUnitaire = a.prixRevente != null ? a.prixRevente : null;
                const revenuTotal = a.vendu && a.prixRevente != null ? a.prixRevente : null;
                const profit = revenuTotal != null ? revenuTotal - achat : null;

                return (
                  <tr key={a.id} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="py-3 pr-4">
                      <div className="font-medium">
                        {a.nom} {a.vendu && <Badge variant="success">Vendu</Badge>}

                      </div>
                      {a.taille && <div className="text-xs text-zinc-500">{a.taille}</div>}
                    </td>

                    <td className="py-3 pr-4">
                      {a.categorie}
                      {a.sousCategorie ? ` • ${a.sousCategorie}` : ""}
                    </td>

                    <td className="py-3 pr-4">{formatDate(a.dateAchat)}</td>

                    <td className="py-3 pr-4">
                      {a.lieuAchat ? a.lieuAchat : <span className="text-zinc-400">—</span>}
                    </td>

                    <td className="py-3 pr-4">{formatMoney(achat)}</td>

                    <td className="py-3 pr-4">
                      {a.vendu && a.dateRevente ? formatDate(a.dateRevente) : <span className="text-zinc-400">—</span>}
                    </td>

                    <td className="py-3 pr-4">
                      {a.vendu && a.lieuRevente ? a.lieuRevente : <span className="text-zinc-400">—</span>}
                    </td>

                    <td className="py-3 pr-4">
                      {a.vendu && revenuUnitaire != null ? formatMoney(revenuTotal || 0) : <span className="text-zinc-400">—</span>}
                    </td>

                    <td className="py-3 pr-4">
                      {profit != null ? (
                        <span className={profit >= 0 ? "text-emerald-600" : "text-red-600"}>
                          {formatMoney(profit)}
                        </span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>

<td className="py-3 pr-4">
  <div className="flex gap-2">
    {!a.vendu && (
      <Button
        variant="success"
        icon={CheckCircle2}
        onClick={() =>
          onEdit({
            ...a,
            dateRevente:
              a.dateRevente || new Date().toISOString().slice(0, 10),
          })
        }
      >
        Vendre
      </Button>
    )}
    <Button
      variant="info"
      icon={Pencil}
      onClick={() => onEdit(a)}
    >
      Modifier
    </Button>
    <Button
      variant="danger"
      icon={Trash2}
      onClick={() => onDelete(a.id)}
    >
      Suppr.
    </Button>
  </div>
</td>
</tr>
);
})}
</tbody>
</table>


          {articles.length === 0 && (
            <div className="py-10 text-center text-zinc-500">Aucun article. Ajoute ton premier achat 👇</div>
          )}
        </div>
      </Card>
      {showImportModal && (
  <Modal title="Importer un tableau CSV" onClose={() => setShowImportModal(false)}>
    <Modal title="Importer un tableau CSV" onClose={() => setShowImportModal(false)}>
  <div className="space-y-4">
    <p className="text-sm text-zinc-500">
      Le fichier CSV ou Excel doit contenir au moins ces colonnes : <br />
      <strong>nom, categorie, quantite, taille, dateAchat, lieuAchat, prixAchat, sousCategorie, dateRevente, prixRevente, lieuRevente</strong>.<br />
      <br />
    
      Si la quantité est vide, elle sera remplacée par <strong>1</strong> par défaut.<br />
      <br />

      Pour avoir les données les plus réalistes possible, mettre des noms <strong>exactement</strong> pareils pour les articles similaires.<br />
    </p>

    {/* Input fichier */}
    <input type="file" accept=".csv, .xlsx" onChange={handleFileChange} className="block w-full border border-zinc-300 rounded p-2" />

    {/* Prévisualisation */}
    {importData.length > 0 && (
      <div className="max-h-40 overflow-y-auto border p-2 rounded text-sm">
        {importData.slice(0, 5).map((item, idx) => (
          <div key={idx} className="border-b last:border-b-0 py-1">
            {item.nom} — {item.categorie} — {item.quantite}
          </div>
        ))}
        {importData.length > 5 && <div className="text-xs text-zinc-400">... et {importData.length - 5} autres</div>}
      </div>
    )}

    {/* Boutons */}
    <div className="flex justify-end gap-2 mt-4">
      <Button
        onClick={() => setShowImportModal(false)}
        className="bg-zinc-50 text-zinc-600 border border-zinc-300 hover:bg-zinc-100 transition"
      >
        Annuler
      </Button>
      <Button
        onClick={() => handleImport()}
        className="bg-indigo-50 text-indigo-600 border border-indigo-600 hover:bg-indigo-100 transition"
      >
        Importer
      </Button>
    </div>
  </div>
</Modal>

  </Modal>
)}

    </div>
  );
}








// ---------------- Dashboard ----------------

const COLORS = [
  "#A8DADC", // bleu pastel
  "#FBC4AB", // pêche pastel
  "#FFE5B4", // jaune pastel
  "#C1E1C1", // vert pastel
  "#E6CFE6", // violet pastel
  "#F9D5E5", // rose pastel
  "#FFD6E0", // rose clair
  "#BFD7EA", // bleu clair
];

// palette pastel/visibilité
const REVENUE = {
  stroke: "#3B82F6", // bleu moyen — ligne visible
  dotFill: "#93C5FD" // bleu pastel clair — remplissage des points
};

const PROFIT = {
  stroke: "#10B981", // vert moyen — ligne visible
  dotFill: "#A7F3D0" // vert pastel clair — remplissage des points
};




function Dashboard({
  kpis,
  ventesParMois,
  profitParMois,
  repartitionCategories,
  profitParCategorie,
  onOpenDetail,
  articles,
  dateFilter,
  setDateFilter
}) {
  const [selectedGraph, setSelectedGraph] = useState(null);

  // Format mois en français
  const formatMoisFR = (mois) => new Date(mois).toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="grid gap-6">
      {/* Filtre dates */}
      <div className="flex gap-2 items-center mb-4">
        <label className="text-sm">Du :</label>
        <Input type="date" value={dateFilter.from} onChange={e => setDateFilter(f => ({ ...f, from: e.target.value }))} />
        <label className="text-sm">Au :</label>
        <Input type="date" value={dateFilter.to} onChange={e => setDateFilter(f => ({ ...f, to: e.target.value }))} />
        <Button variant="solid" onClick={() => setDateFilter({ from: "", to: "" })}>Réinitialiser</Button>
      </div>

      {/* KPIs */}
<div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 max-w-7xl mx-auto py-4">
  <KPI label="Total investi" value={kpis.totalInvesti} money onClick={() => onOpenDetail({ defKey: "totalInvesti", title: "Total investi", articles, kpis })} />
  <KPI label="Chiffre d'Affaire" value={kpis.totalRevenu} money onClick={() => onOpenDetail({ defKey: "totalRevenu", title: "Chiffre d'Affaire", articles, kpis })} />
  <KPI label="Profit" value={kpis.profit} positive money onClick={() => onOpenDetail({ defKey: "profit", title: "Profit", articles, kpis })} />
  <KPI label="ROI" value={Number.isFinite(kpis.roi) ? Number(kpis.roi.toFixed(1)) : 0} suffix="%" positive money={false} onClick={() => onOpenDetail({ defKey: "roi", title: "ROI", articles, kpis })} />
  <KPI label="Valeur inv. non vendus" value={kpis.invNonVendus} money onClick={() => onOpenDetail({ defKey: "invNonVendus", title: "Valeur inventaire non vendus", articles, kpis })} />
  <KPI label="Non vendus / Vendus" value={kpis.nbNonVendus} suffix={" / " + kpis.nbVendus} money={false} onClick={() => onOpenDetail({ defKey: "nonVendusVendus", title: "Articles non vendus / vendus", articles, kpis })} />
</div>

{/* Graphiques */}
<div className="grid lg:grid-cols-3 gap-6">
  {/* Revenus par mois (haut gauche, large) */}
  <Card
    className="lg:col-span-2 neon-frame-lite"
    onClick={() => setSelectedGraph({ key: "ventesParMois", data: ventesParMois, title: "Revenus par mois" })}
  >
    <h3 className="font-medium mb-4 flex items-center gap-2"><LineChartIcon size={18}/> Revenus par mois</h3>
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={ventesParMois}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E6E6E6" />
          <XAxis dataKey="mois" tickFormatter={formatMoisFR} />
          <YAxis />
          <Tooltip labelFormatter={formatMoisFR} />
          <Line
            type="monotone"
            dataKey="revenu"
            stroke={REVENUE.stroke}
            strokeWidth={3}
            strokeOpacity={0.95}
            dot={{ r: 3, stroke: REVENUE.stroke, fill: REVENUE.dotFill, strokeWidth: 1 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </Card>

  {/* Bénéfice par catégorie (haut droite) */}
  <Card
    className="neon-frame-lite"
    onClick={() => setSelectedGraph({ key: "profitParCategorie", data: profitParCategorie, title: "Bénéfice par catégorie" })}
  >
    <h3 className="font-medium mb-4 flex items-center gap-2"><Wallet size={18}/> Bénéfice par catégorie</h3>
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip />
          <Legend />
          <Pie
  data={profitParCategorie}
  dataKey="value"
  nameKey="name"
  outerRadius={100}
  // n'affiche que la valeur formatée, sans le nom
  label={(entry) => formatMoney(entry.value)}
  // optionnel mais propre : enlève la ligne de label si tu veux moins de clutter
  labelLine={false}
>
  {profitParCategorie.map((entry, index) => (
    <Cell key={`cell-profitcat-${index}`} fill={COLORS[index % COLORS.length]} />
  ))}
</Pie>

        </PieChart>
      </ResponsiveContainer>
    </div>
  </Card>

  {/* Profit par mois (bas gauche, large) */}
  <Card
    className="lg:col-span-2 neon-frame-lite"
    onClick={() => setSelectedGraph({ key: "profitParMois", data: profitParMois, title: "Profit par mois" })}
  >
    <h3 className="font-medium mb-4 flex items-center gap-2"><ArrowRightLeft size={18}/> Profit par mois</h3>
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={profitParMois}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E6E6E6" />
          <XAxis dataKey="mois" tickFormatter={formatMoisFR} />
          <YAxis />
          <Tooltip labelFormatter={formatMoisFR} />
          <Line
            type="monotone"
            dataKey="profit"
            stroke={PROFIT.stroke}
            strokeWidth={3}
            strokeOpacity={0.95}
            dot={{ r: 3, stroke: PROFIT.stroke, fill: PROFIT.dotFill, strokeWidth: 1 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </Card>

  {/* Répartition catégories (bas droite) */}
  <Card
    className="neon-frame-lite"
    onClick={() => setSelectedGraph({ key: "repartitionCategories", data: repartitionCategories, title: "Répartition catégories" })}
  >
    <h3 className="font-medium mb-4 flex items-center gap-2"><Package size={18}/> Répartition catégories</h3>
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip />
          <Legend />
          <Pie data={repartitionCategories} dataKey="value" nameKey="name" outerRadius={100} label>
            {repartitionCategories.map((entry, index) => (
              <Cell key={`cell-cat-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  </Card>
</div>



      

      {/* Modal graphique + infos importantes */}
      {selectedGraph && (
        <Modal onClose={() => setSelectedGraph(null)}>
          <h2 className="text-xl font-bold mb-4">{selectedGraph.title}</h2>
          <div className="flex gap-6">
            {/* Graphique */}
            <div className="flex-1 h-96">
              {selectedGraph.key === "ventesParMois" && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedGraph.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" tickFormatter={formatMoisFR} />
                    <YAxis />
                    <Tooltip labelFormatter={formatMoisFR} />
                    <Line type="monotone" dataKey="revenu" stroke="#1D4ED8" />
                  </LineChart>
                </ResponsiveContainer>
              )}
              {selectedGraph.key === "profitParMois" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={selectedGraph.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" tickFormatter={formatMoisFR} />
                    <YAxis />
                    <Tooltip labelFormatter={formatMoisFR} />
                    <Bar dataKey="profit" fill="#16A34A" />
                  </BarChart>
                </ResponsiveContainer>
              )}
             
              {selectedGraph.key === "repartitionCategories" && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip />
                    <Legend />
                    <Pie data={selectedGraph.data} dataKey="value" nameKey="name" outerRadius={120} label>
                      {selectedGraph.data.map((entry, index) => (
                        <Cell key={`cell-cat-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}

              {selectedGraph.key === "profitParCategorie" && (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Tooltip />
      <Legend />
      <Pie
        data={selectedGraph.data}
        dataKey="value"
        nameKey="name"
        outerRadius={120}
        label={(entry) => formatMoney(entry.value)}
        labelLine={false}
      >
        {selectedGraph.data.map((entry, index) => (
          <Cell key={`cell-profitcat-modal-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
    </PieChart>
  </ResponsiveContainer>
)}





            </div>

            {/* Infos importantes */}
            <div className="w-64 bg-zinc-50 dark:bg-zinc-800 p-4 rounded shadow overflow-auto">
  <h4 className="font-semibold mb-2">Infos importantes</h4>
  <div className="text-sm text-zinc-700 dark:text-zinc-200 space-y-1">
                {selectedGraph.key === "ventesParMois" && (
                  <>
                    <div>Total revenu: {formatMoney(selectedGraph.data.reduce((sum, d) => sum + (d.revenu || 0), 0))}</div>
                    <div>Moyenne mensuelle: {formatMoney(selectedGraph.data.reduce((sum, d) => sum + (d.revenu || 0), 0) / selectedGraph.data.length)}</div>
                    <div>Mois le plus performant: {formatMoisFR(selectedGraph.data.reduce((a, b) => (a.revenu > b.revenu ? a : b), { mois: "-", revenu: 0 }).mois)}</div>
                    <div>Mois le moins performant: {formatMoisFR(selectedGraph.data.reduce((a, b) => (a.revenu < b.revenu ? a : b), { mois: "-", revenu: Infinity }).mois)}</div>
                  </>
                )}
                {selectedGraph.key === "profitParMois" && (
                  <>
                    <div>Total profit: {formatMoney(selectedGraph.data.reduce((sum, d) => sum + (d.profit || 0), 0))}</div>
                    <div>Moyenne mensuelle: {formatMoney(selectedGraph.data.reduce((sum, d) => sum + (d.profit || 0), 0) / selectedGraph.data.length)}</div>
                    <div>Mois le plus profitable: {formatMoisFR(selectedGraph.data.reduce((a, b) => (a.profit > b.profit ? a : b), { mois: "-", profit: 0 }).mois)}</div>
                    <div>Mois le moins profitable: {formatMoisFR(selectedGraph.data.reduce((a, b) => (a.profit < b.profit ? a : b), { mois: "-", profit: Infinity }).mois)}</div>
                  </>
                )}
                {selectedGraph.key === "repartitionCategories" && (
                  selectedGraph.data.map(i => {
                    const total = selectedGraph.data.reduce((sum, d) => sum + d.value, 0);
                    const percent = ((i.value / total) * 100).toFixed(1);
                    return (
                      <div key={i.name}>{i.name}: {i.value} ({percent}%)</div>
                    )
                    
                  })
                )}
                {selectedGraph.key === "profitParCategorie" && (
  (() => {
    const total = selectedGraph.data.reduce((s, d) => s + (d.value || 0), 0);
    const sorted = [...selectedGraph.data].sort((a,b) => (b.value||0) - (a.value||0));
    const top = sorted[0] || null;
    return (
      <>
        <div>Total bénéfice: {formatMoney(total)}</div>
        <div>Catégorie la plus rentable: {top ? `${top.name} (${formatMoney(top.value)})` : "—"}</div>
        <div>Part par catégorie:</div>
        {selectedGraph.data.map(i => {
          const percent = total ? ((i.value / total) * 100).toFixed(1) : "0.0";
          return <div key={i.name}>{i.name}: {formatMoney(i.value)} ({percent}%)</div>;
        })}
      </>
    );
  })()
)}

              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}







// ---------------- Modal / KPI / KPIDetail / TopList / Utils ----------------
function Modal({ children, onClose }) {
  useEffect(()=>{
    function onKey(e){ if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return ()=> window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:10}} className="relative mx-auto max-w-3xl w-[94vw] top-12">
        <Card className="relative">
          <button onClick={onClose} className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-200">✕</button>
          {children}
        </Card>
      </motion.div>
    </div>
  );
}

function KPI({ label, value, money=true, suffix="", positive=false, onClick }) {
  const display = money ? formatMoney(value) : (value ?? 0) + (suffix||"");
  return (
    <Card onClick={onClick} className="neon-frame-lite w-full h-28 grid place-items-center">
      <div className="grid gap-1 place-items-center text-center">
        <span className="text-sm text-zinc-500">{label}</span>
        <motion.div
          initial={{ opacity:0, y:6 }}
          animate={{ opacity:1, y:0 }}
          key={label+"-"+String(value)}
          className={(positive ? (value>=0?"text-emerald-600":"text-red-600") : "") + " text-2xl font-semibold"}
        >
          {display}
        </motion.div>
      </div>
    </Card>
  );
}



function KPIDetail({ detail }) {
  const descriptions = {
    totalInvesti: "Montant total que tu as dépensé pour acheter tes articles.",
    totalRevenu: "Somme totale générée par les ventes (chiffre d'affaire).",
    profit: "Bénéfice net réalisé uniquement sur les articles vendus.",
    roi: "Rendement sur investissement : combien chaque euro investi t’a rapporté.",
    invNonVendus: "Les articles encore en stock, triés par ancienneté.",
    nonVendusVendus: "Nombre d'items vendus et non-vendus (ici les 3 dernières ventes)",
    partsParents: "Suivi de la part de bénéfice reversée aux parents, mois par mois."
  };

  const rankingDescriptions = {
  totalInvesti: "Top 3 des articles les plus coûteux selon le total investi.",
  totalRevenu: "Top 3 des articles qui ont généré le plus de revenu.",
  profit: "Top 3 des articles les plus rentables.",
  roi: "Top 3 des articles selon leur retour sur investissement (ROI).",
  invNonVendus: "Top 3 des articles encore en stock, du plus ancien au plus récent.",
  nonVendusVendus: "Top 3 des dernières ventes effectuées.",
  partsParents: "Classement des gains reversés aux parents chaque mois."
};


  if (!detail) return null;
  const { defKey, title, articles } = detail;

  // === Cas 2 : Non vendus / Vendus -> Top 3 dernières ventes ===
  if (defKey === "nonVendusVendus") {
    const topVentes = (articles || [])
      .filter(a => a.vendu && a.dateRevente)
      .sort((a, b) => new Date(b.dateRevente) - new Date(a.dateRevente))
      .slice(0, 3);

    return (
  <div className="grid gap-10 p-6 bg-white dark:bg-zinc-900 rounded-lg shadow-md">
    <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-50 mb-2">{title}</h3>
    <div className="text-base text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
      <span className="text-blue-500">ℹ️</span> {descriptions[defKey]}
    </div>

    <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">{rankingDescriptions[defKey]}</div>
        </div>
        

        <ul className="space-y-3">
  {topVentes.map((a) => {
    const q = a.quantite || 1;
    const revenuTotal = (a.prixRevente || 0) * q;
    const achatTotal = (a.prixAchat || 0) * q;
    const profit = revenuTotal - achatTotal;
    return (
      <li
        key={a.id}
        className="border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg flex justify-between items-center"
      >
        <div>
          <div className="font-medium">{a.nom}</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {formatDate(a.dateRevente)} • {a.lieuRevente || "—"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm">Qté: {q}</div>
          <div className="text-sm">Profit: {profit.toLocaleString()} €</div>
        </div>
      </li>
    );
  })}
</ul>

          {topVentes.length === 0 && (
            <li className="text-sm text-zinc-500">Aucune vente enregistrée.</li>
          )}
        </ul>
      </div>
    );
  }

  // === Autres KPI : on garde une liste Top 3 comme avant ===
  let rows = [];

  if (defKey === "totalInvesti") {
  const grouped = groupByItem(articles || []);
  rows = grouped
    .map(a => ({ label: a.nom, num: a.totalAchat, display: formatMoney(a.totalAchat) }))
    .sort((a, b) => b.num - a.num)
    .slice(0, 3);
} else if (defKey === "totalRevenu") {
  const grouped = groupByItem(articles.filter(a => a.vendu && a.prixRevente != null));
  rows = grouped
    .map(a => ({ label: a.nom, num: a.totalRevenu, display: formatMoney(a.totalRevenu) }))
    .sort((a, b) => b.num - a.num)
    .slice(0, 3);
} else if (defKey === "profit") {
  const grouped = groupByItem(articles.filter(a => a.vendu && a.prixRevente != null));
  rows = grouped
    .map(a => ({ label: a.nom, num: a.totalRevenu - a.totalAchat, display: formatMoney(a.totalRevenu - a.totalAchat) }))
    .sort((a, b) => b.num - a.num)
    .slice(0, 3);
} else if (defKey === "roi") {
  const grouped = groupByItem(articles.filter(a => a.vendu && a.prixRevente != null && a.prixAchat > 0));
  rows = grouped
    .map(a => {
      const roi = ((a.totalRevenu - a.totalAchat) / a.totalAchat) * 100;
      return { label: a.nom, num: roi, display: roi.toFixed(1) + "%" };
    })
    .sort((a, b) => b.num - a.num)
    .slice(0, 3);
} else if (defKey === "invNonVendus") {
  const grouped = groupByItem(articles.filter(a => !a.vendu));
  rows = grouped
    .sort((a, b) => new Date(a.dateAchat) - new Date(b.dateAchat))
    .slice(0, 3)
    .map(a => ({ label: a.nom, num: 0, display: `Acheté le ${formatDate(a.dateAchat)}` }));
}


  return (
  <div className="grid gap-10 p-6 bg-white dark:bg-zinc-900 rounded-lg shadow-md">
    <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-50 mb-2">{title}</h3>
    <div className="text-base text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
      <span className="text-blue-500">ℹ️</span> {descriptions[defKey]}
    </div>

    <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">{rankingDescriptions[defKey]}</div>

    <ul className="space-y-3">
      {topVentes.map((a) => {
        const q = a.quantite || 1;
        return (
          <li
            key={a.id}
            className="border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg flex justify-between items-center"
          >
            <div>
              <div className="font-medium">{a.nom}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {formatDate(a.dateRevente)} • {a.lieuRevente || "—"}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  </div>
);

}



function TopList({ title, items, money=false }) {
  return (
    <div className="grid gap-2">
      {title && <h4 className="font-medium">{title}</h4>}
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {items.map((it, i)=> (
          <li key={i} className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium">{it.label}</div>
              {it.sub && <div className="text-xs text-zinc-500">{it.sub}</div>}
            </div>
            <div className="text-sm">{money ? formatMoney(it.value||0) : (it.value||0)}</div>
          </li>
        ))}
        {items.length===0 && (<li className="py-3 text-sm text-zinc-500">Aucun élément</li>)}
      </ul>
    </div>
  );
}

// ---------------- Utils ----------------
function formatMoney(n){
  const v = Number(n||0);
  try {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(v);
  } catch {
    return `${v} €`;
  }
}
function formatDate(s){
  if(!s) return "";
  try {
    const d = new Date(s);
    return d.toLocaleDateString("fr-FR");
  } catch {
    return s;
  }
}

function groupByItem(articles) {
  const map = new Map();
  articles.forEach(a => {
    const key = a.nom; // ou `${a.nom}-${a.taille}` si tu veux distinguer les tailles
    const qty = a.quantite || 1;
    const achat = a.prixAchat || 0;
    const revenu = a.prixRevente != null ? a.prixRevente : 0;

    if (!map.has(key)) {
      map.set(key, { ...a, totalAchat: achat * qty, totalRevenu: revenu * qty, totalQty: qty });
    } else {
      const item = map.get(key);
      item.totalAchat += achat * qty;
      item.totalRevenu += revenu * qty;
      item.totalQty += qty;
      map.set(key, item);
    }
  });
  return Array.from(map.values());
}
