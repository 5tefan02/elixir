// data.js — încarcă produsele și expune helperi globali.
// Folosește fetch() pe produse.json — necesită server static (npx serve / python -m http.server).

window.Elixir = window.Elixir || {};

(function () {
  let cache = null;
  let pending = null;

  function loadProduse() {
    if (cache) return Promise.resolve(cache);
    if (pending) return pending;

    pending = fetch("js/produse.json", { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("Nu pot încărca produsele (" + r.status + ")");
        return r.json();
      })
      .then(function (data) {
        cache = data;
        return data;
      })
      .catch(function (err) {
        console.error("[Elixir] Eroare la încărcarea produselor:", err);
        cache = [];
        return [];
      });

    return pending;
  }

  function getProdusById(id) {
    return loadProduse().then(function (list) {
      return list.find(function (p) {
        return p.id === id;
      }) || null;
    });
  }

  function getCategorii() {
    return loadProduse().then(function (list) {
      const set = new Set();
      list.forEach(function (p) {
        if (p.categorie) set.add(p.categorie);
      });
      return Array.from(set);
    });
  }

  function formatPret(p) {
    return p.toLocaleString("ro-RO") + " RON";
  }

  // Helper pentru ajustarea path-ului relativ la pagina curentă.
  // Paginile din /blog/ trebuie să meargă la "../js/produse.json", "../produse.html", etc.
  function relPath(p) {
    const depth = window.location.pathname.split("/").filter(Boolean).length;
    const inSub = window.location.pathname.indexOf("/blog/") !== -1;
    if (inSub) return "../" + p;
    return p;
  }

  window.Elixir.data = {
    loadProduse: loadProduse,
    getProdusById: getProdusById,
    getCategorii: getCategorii,
    formatPret: formatPret,
    relPath: relPath
  };
})();
