// cos.js — gestionează coșul în localStorage.
// Dispatch event "cos:schimbat" pe window la fiecare modificare.

window.Elixir = window.Elixir || {};

(function () {
  const STORAGE_KEY = "elixir_cos";

  function citeste() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(function (item) {
        return item && typeof item.id === "string" && typeof item.cantitate === "number" && item.cantitate > 0;
      });
    } catch (e) {
      console.error("[Elixir] Coș corupt, resetez:", e);
      return [];
    }
  }

  function scrie(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("cos:schimbat", { detail: items }));
  }

  function adauga(id, cant) {
    cant = Math.max(1, Math.floor(cant || 1));
    const items = citeste();
    const existing = items.find(function (i) {
      return i.id === id;
    });
    if (existing) {
      existing.cantitate += cant;
    } else {
      items.push({ id: id, cantitate: cant });
    }
    scrie(items);
  }

  function actualizeazaCant(id, cant) {
    cant = Math.floor(cant);
    let items = citeste();
    if (cant <= 0) {
      items = items.filter(function (i) {
        return i.id !== id;
      });
    } else {
      const existing = items.find(function (i) {
        return i.id === id;
      });
      if (existing) existing.cantitate = cant;
    }
    scrie(items);
  }

  function elimina(id) {
    const items = citeste().filter(function (i) {
      return i.id !== id;
    });
    scrie(items);
  }

  function goleste() {
    scrie([]);
  }

  function continut() {
    return citeste();
  }

  function numarTotal() {
    return citeste().reduce(function (sum, i) {
      return sum + i.cantitate;
    }, 0);
  }

  // Total în RON — necesită accesul la produse pentru prețuri.
  function total() {
    if (!window.Elixir.data) return Promise.resolve(0);
    return window.Elixir.data.loadProduse().then(function (produse) {
      return citeste().reduce(function (sum, item) {
        const p = produse.find(function (x) {
          return x.id === item.id;
        });
        if (!p) return sum;
        return sum + p.pret * item.cantitate;
      }, 0);
    });
  }

  // Sincronizare între tab-uri.
  window.addEventListener("storage", function (e) {
    if (e.key === STORAGE_KEY) {
      window.dispatchEvent(new CustomEvent("cos:schimbat", { detail: citeste() }));
    }
  });

  window.Elixir.cos = {
    adauga: adauga,
    actualizeazaCant: actualizeazaCant,
    elimina: elimina,
    goleste: goleste,
    continut: continut,
    numarTotal: numarTotal,
    total: total
  };
})();
