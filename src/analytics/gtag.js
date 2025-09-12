// src/analytics/gtag.js
export const GA_MEASUREMENT_ID =
  process.env.REACT_APP_GA_ID || process.env.VITE_GA_ID || ""; // mettre G-XXXXX si tu veux hardcoder (pas recommandé)

// injecte gtag et configure (send_page_view: false pour SPA)
export function initGA() {
  if (!GA_MEASUREMENT_ID) return;
  if (typeof window === "undefined") return;
  if (window.gtag) return; // déjà initialisé

  // script gtag.js
  const s1 = document.createElement("script");
  s1.async = true;
  s1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(s1);

  // inline setup (définit window.gtag tout de suite pour pouvoir push même si gtag.js n'a pas fini de charger)
  const s2 = document.createElement("script");
  s2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
  `;
  document.head.appendChild(s2);
}

export function pageview(path) {
  if (!GA_MEASUREMENT_ID) return;
  if (typeof window === "undefined") return;
  if (!window.gtag) {
    // pas encore initialisé -> on peut éventuellement bufferiser; mais suffit généralement
    return;
  }
  window.gtag("event", "page_view", {
    page_path: path,
  });
}

export function event({ action, category, label, value }) {
  if (!GA_MEASUREMENT_ID) return;
  if (typeof window === "undefined") return;
  if (!window.gtag) return;
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value,
  });
}
