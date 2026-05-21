// cos-page.js — randează pagina coșului și gestionează trimiterea comenzii pe WhatsApp.

(function () {
  function placeholderImg(nume) {
    return '<div class="product-card__placeholder" style="font-size:.8rem; height:100%;">' + nume + '</div>';
  }

  function imgHTML(p) {
    if (!p.imagine) return placeholderImg(p.nume);
    return '<img src="' + p.imagine + '" alt="' + p.nume + '" onerror="this.replaceWith(Object.assign(document.createElement(\'div\'),{className:\'product-card__placeholder\',style:\'font-size:.8rem;height:100%;\',textContent:\'' + p.nume.replace(/'/g, "\\'") + '\'}))">';
  }

  function rowHTML(produs, cantitate) {
    const subtotal = produs.pret * cantitate;
    return (
      '<div class="cart-row" data-id="' + produs.id + '">' +
      '  <div class="cart-row__media">' + imgHTML(produs) + '</div>' +
      '  <div>' +
      '    <h3 class="cart-row__name">' + produs.nume + '</h3>' +
      '    <div class="cart-row__meta">' + produs.categorie + ' · ' + produs.volum + '</div>' +
      '    <div class="cart-row__price">' + produs.pret.toLocaleString("ro-RO") + ' RON / buc</div>' +
      '  </div>' +
      '  <div class="cart-row__right">' +
      '    <div class="qty-stepper">' +
      '      <button type="button" data-step="-1" aria-label="Scade">−</button>' +
      '      <input type="number" value="' + cantitate + '" min="1" max="99" data-qty aria-label="Cantitate">' +
      '      <button type="button" data-step="+1" aria-label="Crește">+</button>' +
      '    </div>' +
      '    <strong style="font-family:var(--font-serif);font-size:1.1rem;">' + subtotal.toLocaleString("ro-RO") + ' RON</strong>' +
      '    <button type="button" class="cart-row__remove" data-remove>Șterge</button>' +
      '  </div>' +
      '</div>'
    );
  }

  function emptyHTML() {
    return (
      '<div class="cart-empty">' +
      '  <h2>Coșul tău este gol</h2>' +
      '  <p>Descoperă colecția noastră și adaugă parfumurile preferate.</p>' +
      '  <p><a href="produse.html" class="btn">Vezi parfumurile</a></p>' +
      '</div>'
    );
  }

  function summaryHTML(total) {
    return (
      '<h3>Sumar comandă</h3>' +
      '<div class="cart-summary__row"><span>Subtotal</span><span>' + total.toLocaleString("ro-RO") + ' RON</span></div>' +
      '<div class="cart-summary__row"><span>Livrare</span><span>se calculează la confirmare</span></div>' +
      '<div class="cart-summary__row cart-summary__total"><span>Total</span><span>' + total.toLocaleString("ro-RO") + ' RON</span></div>' +
      '<form id="order-form" novalidate>' +
      '  <div class="form-group">' +
      '    <label for="nume">Nume complet</label>' +
      '    <input type="text" id="nume" name="nume" required>' +
      '    <div class="form-error" data-error-for="nume">Te rugăm să completezi numele.</div>' +
      '  </div>' +
      '  <div class="form-group">' +
      '    <label for="telefon">Telefon</label>' +
      '    <input type="tel" id="telefon" name="telefon" required>' +
      '    <div class="form-error" data-error-for="telefon">Te rugăm să completezi un număr de telefon.</div>' +
      '  </div>' +
      '  <div class="form-group">' +
      '    <label for="adresa">Adresă de livrare</label>' +
      '    <textarea id="adresa" name="adresa" required></textarea>' +
      '    <div class="form-error" data-error-for="adresa">Te rugăm să completezi adresa.</div>' +
      '  </div>' +
      '  <div class="form-group">' +
      '    <label for="observatii">Observații <span class="optional">(opțional)</span></label>' +
      '    <textarea id="observatii" name="observatii"></textarea>' +
      '  </div>' +
      '  <button type="submit" class="btn btn--pink btn--full">Trimite comanda pe WhatsApp</button>' +
      '  <p style="font-size:.82rem;color:var(--text-muted);margin-top:14px;text-align:center;">Comanda se va deschide într-un mesaj WhatsApp pre-completat.</p>' +
      '</form>'
    );
  }

  function attachItemHandlers(itemsHost) {
    itemsHost.querySelectorAll(".cart-row").forEach(function (row) {
      const id = row.getAttribute("data-id");
      const input = row.querySelector("[data-qty]");

      row.querySelectorAll("[data-step]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          const delta = parseInt(btn.getAttribute("data-step"), 10);
          const cur = parseInt(input.value, 10) || 1;
          const next = Math.max(1, Math.min(99, cur + delta));
          window.Elixir.cos.actualizeazaCant(id, next);
        });
      });

      input.addEventListener("change", function () {
        const v = Math.max(1, Math.min(99, parseInt(input.value, 10) || 1));
        window.Elixir.cos.actualizeazaCant(id, v);
      });

      row.querySelector("[data-remove]").addEventListener("click", function () {
        window.Elixir.cos.elimina(id);
      });
    });
  }

  function showError(form, field, show) {
    const el = form.querySelector('[data-error-for="' + field + '"]');
    if (el) el.classList.toggle("show", show);
  }

  function attachSubmit(form, items, total) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      let ok = true;
      ["nume", "telefon", "adresa"].forEach(function (f) {
        const val = form.elements[f].value.trim();
        if (!val) {
          showError(form, f, true);
          ok = false;
        } else {
          showError(form, f, false);
        }
      });
      if (!ok) return;

      const payload = {
        items: items,
        total: total,
        nume: form.elements.nume.value.trim(),
        telefon: form.elements.telefon.value.trim(),
        adresa: form.elements.adresa.value.trim(),
        observatii: form.elements.observatii.value.trim()
      };
      const url = window.Elixir.whatsapp.buildUrl(window.Elixir.whatsapp.mesajComanda(payload));
      window.open(url, "_blank", "noopener");
    });
  }

  function render() {
    const itemsHost = document.querySelector("[data-elixir-cart-items]");
    const summaryHost = document.querySelector("[data-elixir-cart-summary]");
    if (!itemsHost || !summaryHost) return;

    const continut = window.Elixir.cos.continut();

    if (continut.length === 0) {
      itemsHost.innerHTML = emptyHTML();
      summaryHost.style.display = "none";
      return;
    }

    window.Elixir.data.loadProduse().then(function (produse) {
      const items = continut
        .map(function (c) {
          const p = produse.find(function (x) { return x.id === c.id; });
          return p ? { produs: p, cantitate: c.cantitate } : null;
        })
        .filter(Boolean);

      // dacă vreun id nu mai există în catalog, îl curățăm
      if (items.length !== continut.length) {
        items.forEach(function (i) { /* păstrăm doar valide */ });
        const validIds = items.map(function (i) { return i.produs.id; });
        const continutValid = continut.filter(function (c) { return validIds.indexOf(c.id) !== -1; });
        if (continutValid.length !== continut.length) {
          window.localStorage.setItem("elixir_cos", JSON.stringify(continutValid));
        }
      }

      const total = items.reduce(function (s, i) { return s + i.produs.pret * i.cantitate; }, 0);

      itemsHost.innerHTML = '<div class="cart-items">' +
        items.map(function (i) { return rowHTML(i.produs, i.cantitate); }).join("") +
        '</div>';
      summaryHost.innerHTML = summaryHTML(total);
      summaryHost.style.display = "";

      attachItemHandlers(itemsHost);
      attachSubmit(summaryHost.querySelector("#order-form"), items, total);
    });
  }

  function init() {
    render();
    window.addEventListener("cos:schimbat", render);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
