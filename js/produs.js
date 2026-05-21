// produs.js — randează pagina de detaliu pentru produsul cu ?id=... în URL.

(function () {
  function noteListHTML(note) {
    if (!note) return "";
    const rows = [];
    if (note.top && note.top.length) {
      rows.push(
        '<div class="notes-list__row"><span class="notes-list__label">Note de top</span><span>' +
        note.top.join(", ") + "</span></div>"
      );
    }
    if (note.middle && note.middle.length) {
      rows.push(
        '<div class="notes-list__row"><span class="notes-list__label">Inimă</span><span>' +
        note.middle.join(", ") + "</span></div>"
      );
    }
    if (note.base && note.base.length) {
      rows.push(
        '<div class="notes-list__row"><span class="notes-list__label">Bază</span><span>' +
        note.base.join(", ") + "</span></div>"
      );
    }
    if (!rows.length) return "";
    return (
      '<div class="notes-group">' +
      '<h4>Piramidă olfactivă</h4>' +
      '<div class="notes-list">' + rows.join("") + "</div>" +
      "</div>"
    );
  }

  function placeholderHTML(nume) {
    return '<div class="product-card__placeholder" style="font-size:2rem;">' + nume + '</div>';
  }

  function imageHTML(p) {
    if (!p.imagine) return placeholderHTML(p.nume);
    return (
      '<img src="' + p.imagine + '" alt="' + p.nume + '" ' +
      'onerror="this.replaceWith(Object.assign(document.createElement(\'div\'),{className:\'product-card__placeholder\',style:\'font-size:2rem;\',textContent:\'' + p.nume.replace(/'/g, "\\'") + '\'}))">'
    );
  }

  function render(p) {
    document.title = p.nume + " — Elixir";
    const host = document.querySelector("[data-elixir-product]");
    if (!host) return;

    host.innerHTML =
      '<div class="product-detail">' +
      '  <div class="product-detail__media">' + imageHTML(p) + '</div>' +
      '  <div>' +
      '    <div class="product-detail__category">' + p.categorie + '</div>' +
      '    <h1 class="product-detail__name">' + p.nume + '</h1>' +
      '    <div class="product-detail__volume">' + p.volum + '</div>' +
      '    <div class="product-detail__price">' + p.pret.toLocaleString("ro-RO") + ' RON</div>' +
      '    <p class="product-detail__desc">' + p.descriereLunga + '</p>' +
      noteListHTML(p.note) +
      '    <div class="qty-row">' +
      '      <div class="qty-stepper" aria-label="Selectează cantitatea">' +
      '        <button type="button" data-qty="-1" aria-label="Scade">−</button>' +
      '        <input type="number" value="1" min="1" max="99" id="qty-input" aria-label="Cantitate">' +
      '        <button type="button" data-qty="+1" aria-label="Crește">+</button>' +
      '      </div>' +
      '      <button class="btn btn--pink" id="add-to-cart">Adaugă în coș</button>' +
      '    </div>' +
      '    <p style="font-size:.85rem;color:var(--text-muted);margin-top:8px;" id="add-feedback" hidden>✓ Adăugat în coș</p>' +
      '  </div>' +
      '</div>';

    const input = document.getElementById("qty-input");
    host.querySelectorAll("[data-qty]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const delta = parseInt(btn.getAttribute("data-qty"), 10);
        const next = Math.max(1, Math.min(99, parseInt(input.value, 10) + delta));
        input.value = next;
      });
    });

    const addBtn = document.getElementById("add-to-cart");
    const fb = document.getElementById("add-feedback");
    addBtn.addEventListener("click", function () {
      const cant = Math.max(1, parseInt(input.value, 10) || 1);
      window.Elixir.cos.adauga(p.id, cant);
      fb.hidden = false;
      addBtn.textContent = "Adăugat ✓";
      setTimeout(function () {
        addBtn.textContent = "Adaugă în coș";
        fb.hidden = true;
      }, 1800);
    });
  }

  function renderNotFound() {
    const host = document.querySelector("[data-elixir-product]");
    if (!host) return;
    host.innerHTML =
      '<div class="empty-state">' +
      '  <h2>Parfum negăsit</h2>' +
      '  <p>Acest parfum nu mai există sau linkul este greșit.</p>' +
      '  <p><a href="produse.html" class="btn btn--ghost">Înapoi la catalog</a></p>' +
      '</div>';
  }

  function init() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) {
      renderNotFound();
      return;
    }
    window.Elixir.data.getProdusById(id).then(function (p) {
      if (p) render(p);
      else renderNotFound();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
