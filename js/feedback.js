// feedback.js — chestionar de feedback. Trimite răspunsurile pe WhatsApp.

(function () {
  function init() {
    const form = document.getElementById("feedback-form");
    const productSelect = document.getElementById("fb-produs");
    const success = document.querySelector("[data-feedback-success]");
    if (!form) return;

    // Populăm dropdown-ul cu produse.
    window.Elixir.data.loadProduse().then(function (produse) {
      produse.forEach(function (p) {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.nume;
        productSelect.appendChild(opt);
      });
    });

    function gatherPayload() {
      const fd = new FormData(form);
      const ratingRaw = fd.get("rating");
      const expRaw = fd.get("experientaGenerala");
      const productId = fd.get("produsId");
      const payload = {
        produs: null,
        rating: ratingRaw ? parseInt(ratingRaw, 10) : null,
        comentariu: (fd.get("comentariu") || "").trim(),
        gasitUsor: fd.get("gasitUsor") || null,
        experientaGenerala: expRaw ? parseInt(expRaw, 10) : null,
        sugestii: (fd.get("sugestii") || "").trim(),
        recomanda: fd.get("recomanda") || null,
        nume: (fd.get("nume") || "").trim(),
        email: (fd.get("email") || "").trim()
      };

      if (productId) {
        return window.Elixir.data.getProdusById(productId).then(function (p) {
          if (p) payload.produs = { nume: p.nume };
          return payload;
        });
      }
      return Promise.resolve(payload);
    }

    function isEmailValid(email) {
      if (!email) return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function hasSomething(payload) {
      return Boolean(
        payload.produs || payload.rating || payload.comentariu ||
        payload.gasitUsor || payload.experientaGenerala || payload.sugestii || payload.recomanda
      );
    }

    function showError(field, show) {
      const el = form.querySelector('[data-error-for="' + field + '"]');
      if (el) el.classList.toggle("show", show);
    }

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      gatherPayload().then(function (payload) {
        let ok = true;

        if (!hasSomething(payload)) {
          showError("global", true);
          ok = false;
        } else {
          showError("global", false);
        }

        if (!isEmailValid(payload.email)) {
          showError("email", true);
          ok = false;
        } else {
          showError("email", false);
        }

        if (!ok) return;

        const mesaj = window.Elixir.whatsapp.mesajFeedback(payload);
        const url = window.Elixir.whatsapp.buildUrl(mesaj);
        window.open(url, "_blank", "noopener");
        success.classList.add("show");
        success.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });

    form.addEventListener("reset", function () {
      success.classList.remove("show");
      form.querySelectorAll(".form-error").forEach(function (e) { e.classList.remove("show"); });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
