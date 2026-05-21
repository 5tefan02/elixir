// whatsapp.js — construiește URL-uri wa.me pentru comandă și feedback.
// IMPORTANT: înlocuiește WHATSAPP_NUMBER cu numărul tău real (format internațional, fără +).

window.Elixir = window.Elixir || {};

(function () {
  const WHATSAPP_NUMBER = "40712345678"; // <-- înlocuiește înainte de lansare

  function buildUrl(mesaj) {
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(mesaj);
  }

  function mesajComanda(payload) {
    // payload = { items: [{ produs, cantitate, subtotal }], total, nume, telefon, adresa, observatii }
    const linii = [];
    linii.push("Salut Elixir! Aș dori să comand:");
    linii.push("");
    payload.items.forEach(function (i) {
      const p = i.produs;
      linii.push(
        "• " + p.nume + " (" + p.volum + ") x" + i.cantitate + " — " +
        (p.pret * i.cantitate).toLocaleString("ro-RO") + " RON"
      );
    });
    linii.push("");
    linii.push("Total: " + payload.total.toLocaleString("ro-RO") + " RON");
    linii.push("");
    linii.push("Nume: " + payload.nume);
    linii.push("Telefon: " + payload.telefon);
    linii.push("Adresă: " + payload.adresa);
    if (payload.observatii && payload.observatii.trim()) {
      linii.push("Observații: " + payload.observatii.trim());
    }
    return linii.join("\n");
  }

  function mesajFeedback(payload) {
    // payload = { produs?: { nume }, rating?: 1-5, comentariu?, gasitUsor?, experientaGenerala?: 1-5, sugestii?, recomanda?, nume?, email? }
    const linii = ["Feedback Elixir 🌸", ""];

    const aPlin = payload.produs || payload.rating || (payload.comentariu && payload.comentariu.trim());
    if (aPlin) {
      linii.push("── Despre produs ──");
      if (payload.produs) linii.push("Parfum: " + payload.produs.nume);
      if (payload.rating) {
        const stele = "★".repeat(payload.rating) + "☆".repeat(5 - payload.rating);
        linii.push("Rating: " + stele + " (" + payload.rating + "/5)");
      }
      if (payload.comentariu && payload.comentariu.trim()) {
        linii.push("Comentariu: " + payload.comentariu.trim());
      }
      linii.push("");
    }

    const bPlin = payload.gasitUsor || payload.experientaGenerala ||
      (payload.sugestii && payload.sugestii.trim()) || payload.recomanda;
    if (bPlin) {
      linii.push("── Despre site ──");
      if (payload.gasitUsor) linii.push("Găsit ușor: " + payload.gasitUsor);
      if (payload.experientaGenerala) linii.push("Experiență generală: " + payload.experientaGenerala + "/5");
      if (payload.sugestii && payload.sugestii.trim()) {
        linii.push("Sugestii: " + payload.sugestii.trim());
      }
      if (payload.recomanda) linii.push("Recomandă: " + payload.recomanda);
      linii.push("");
    }

    if ((payload.nume && payload.nume.trim()) || (payload.email && payload.email.trim())) {
      linii.push("── Contact (opțional) ──");
      if (payload.nume && payload.nume.trim()) linii.push("Nume: " + payload.nume.trim());
      if (payload.email && payload.email.trim()) linii.push("Email: " + payload.email.trim());
    }

    return linii.join("\n").trimEnd();
  }

  window.Elixir.whatsapp = {
    NUMBER: WHATSAPP_NUMBER,
    buildUrl: buildUrl,
    mesajComanda: mesajComanda,
    mesajFeedback: mesajFeedback
  };
})();
