// catalog.js — randează grila de produse cu filtre și sortare.
// Funcționează în două moduri:
//   - data-mod="all"      → toate produsele + filtre (folosit pe produse.html)
//   - data-mod="featured" → primele N produse, fără filtre (folosit pe homepage)

(function () {
  function placeholderSVG(nume) {
    return '<div class="product-card__placeholder">' + nume + '</div>';
  }

  function cardHTML(p) {
    const imgUrl = p.imagine;
    const hasImg = imgUrl && imgUrl.length > 0;
    const media = hasImg
      ? '<img src="' + imgUrl + '" alt="' + p.nume + '" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement(\'div\'),{className:\'product-card__placeholder\',textContent:\'' + p.nume.replace(/'/g, "\\'") + '\'}))">'
      : placeholderSVG(p.nume);

    return (
      '<article class="product-card">' +
      '  <a href="produs.html?id=' + p.id + '" class="product-card__media" aria-label="Vezi ' + p.nume + '">' +
      media +
      '  </a>' +
      '  <div class="product-card__body">' +
      '    <div class="product-card__category">' + p.categorie + '</div>' +
      '    <h3 class="product-card__name">' + p.nume + '</h3>' +
      '    <p class="product-card__desc">' + p.descriereScurta + '</p>' +
      '    <div class="product-card__bottom">' +
      '      <span class="product-card__price">' + p.pret.toLocaleString("ro-RO") + " RON" + '</span>' +
      '      <a href="produs.html?id=' + p.id + '" class="product-card__link">Vezi detalii →</a>' +
      '    </div>' +
      '  </div>' +
      '</article>'
    );
  }

  function renderGrid(host, produse) {
    if (!produse.length) {
      host.innerHTML = '<div class="empty-state"><h2>Niciun parfum găsit</h2><p>Încearcă o altă categorie.</p></div>';
      return;
    }
    host.innerHTML = produse.map(cardHTML).join("");
  }

  function sortProduse(list, sort) {
    const arr = list.slice();
    switch (sort) {
      case "pret-asc":
        arr.sort(function (a, b) { return a.pret - b.pret; });
        break;
      case "pret-desc":
        arr.sort(function (a, b) { return b.pret - a.pret; });
        break;
      case "nume":
      default:
        arr.sort(function (a, b) { return a.nume.localeCompare(b.nume, "ro"); });
    }
    return arr;
  }

  function init() {
    const host = document.querySelector("[data-elixir-catalog]");
    if (!host) return;

    const mod = host.getAttribute("data-mod") || "all";
    const filtersHost = document.querySelector("[data-elixir-filters]");

    let state = {
      categorie: "toate",
      sort: "nume"
    };

    let toateProdusele = [];

    function aplicaSiRender() {
      let lista = toateProdusele.slice();
      if (mod === "featured") {
        lista = lista.slice(0, 4);
      } else {
        if (state.categorie !== "toate") {
          lista = lista.filter(function (p) { return p.categorie === state.categorie; });
        }
        lista = sortProduse(lista, state.sort);
      }
      renderGrid(host, lista);
    }

    function renderFiltre(categorii) {
      if (!filtersHost || mod !== "all") return;
      const chips = ["toate"].concat(categorii);
      filtersHost.innerHTML =
        '<div class="filters__chips">' +
        chips.map(function (c) {
          const active = c === state.categorie ? " active" : "";
          return '<button type="button" class="chip' + active + '" data-cat="' + c + '">' + c + '</button>';
        }).join("") +
        '</div>' +
        '<select class="filters__sort" aria-label="Sortează">' +
        '  <option value="nume">Sortează: A–Z</option>' +
        '  <option value="pret-asc">Preț crescător</option>' +
        '  <option value="pret-desc">Preț descrescător</option>' +
        '</select>';

      filtersHost.querySelectorAll(".chip").forEach(function (btn) {
        btn.addEventListener("click", function () {
          state.categorie = btn.getAttribute("data-cat");
          filtersHost.querySelectorAll(".chip").forEach(function (b) { b.classList.remove("active"); });
          btn.classList.add("active");
          aplicaSiRender();
        });
      });

      filtersHost.querySelector(".filters__sort").addEventListener("change", function (e) {
        state.sort = e.target.value;
        aplicaSiRender();
      });
    }

    window.Elixir.data.loadProduse().then(function (produse) {
      toateProdusele = produse;
      const categorii = Array.from(new Set(produse.map(function (p) { return p.categorie; })));
      renderFiltre(categorii);
      aplicaSiRender();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
