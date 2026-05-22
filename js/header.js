// header.js — injectează headerul și footerul pe toate paginile.
// Pune <div data-elixir-header></div> și <div data-elixir-footer></div> în HTML.
// Atribute opționale pe body: data-page="acasa|produse|despre|contact|blog|feedback|cos"

(function () {
  // Detectăm dacă suntem într-un subfolder (ex: /blog/articol.html)
  const inSub = window.location.pathname.indexOf("/blog/") !== -1;
  const base = inSub ? "../" : "";

  function navHTML(activeKey) {
    const items = [
      { key: "acasa", label: "Acasă", href: base + "index.html" },
      { key: "produse", label: "Parfumuri", href: base + "produse.html" },
      { key: "blog", label: "Jurnal", href: base + "blog/index.html" },
      { key: "despre", label: "Despre", href: base + "despre.html" },
      { key: "contact", label: "Contact", href: base + "contact.html" },
      { key: "feedback", label: "Feedback", href: base + "feedback.html" }
    ];
    return items
      .map(function (i) {
        const active = i.key === activeKey ? " class=\"active\"" : "";
        return '<a href="' + i.href + '"' + active + ">" + i.label + "</a>";
      })
      .join("");
  }

  function renderHeader() {
    const host = document.querySelector("[data-elixir-header]");
    if (!host) return;
    const pageKey = document.body.getAttribute("data-page") || "";
    host.innerHTML =
      '<header class="site-header">' +
      '  <div class="container site-header__inner">' +
      '    <button class="site-header__burger" type="button" aria-label="Meniu" aria-expanded="false">☰</button>' +
      '    <a href="' + base + 'index.html" class="site-header__logo">Elixir</a>' +
      '    <nav class="site-header__nav" aria-label="Navigare principală">' +
      navHTML(pageKey) +
      '    </nav>' +
      '    <a href="' + base + 'cos.html" class="site-header__cart" aria-label="Coș de cumpărături">' +
      '      🛍' +
      '      <span class="site-header__cart-badge" data-elixir-cart-badge hidden>0</span>' +
      '    </a>' +
      '  </div>' +
      '</header>';

    // Burger toggle
    const burger = host.querySelector(".site-header__burger");
    const nav = host.querySelector(".site-header__nav");
    burger.addEventListener("click", function () {
      const open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", String(open));
    });

    updateBadge();
  }

  function renderFooter() {
    const host = document.querySelector("[data-elixir-footer]");
    if (!host) return;
    host.innerHTML =
      '<footer class="site-footer">' +
      '  <div class="container">' +
      '    <div class="site-footer__cols">' +
      '      <div>' +
      '        <h4>Elixir</h4>' +
      '        <p>Parfumuri create cu pasiune, livrate cu grijă.</p>' +
      '      </div>' +
      '      <div>' +
      '        <h4>Navighează</h4>' +
      '        <p>' +
      '          <a href="' + base + 'produse.html">Parfumuri</a><br>' +
      '          <a href="' + base + 'blog/index.html">Jurnal</a><br>' +
      '          <a href="' + base + 'despre.html">Despre noi</a>' +
      '        </p>' +
      '      </div>' +
      '      <div>' +
      '        <h4>Contact</h4>' +
      '        <p>' +
      '          <a href="' + base + 'contact.html">Date de contact</a><br>' +
      '          <a href="' + base + 'feedback.html">Lasă o recenzie</a>' +
      '        </p>' +
      '      </div>' +
      '    </div>' +
      '    <div class="site-footer__bottom">' +
      '      © ' + new Date().getFullYear() + ' Elixir. Toate drepturile rezervate.' +
      '    </div>' +
      '  </div>' +
      '</footer>';
  }

  function updateBadge() {
    const badge = document.querySelector("[data-elixir-cart-badge]");
    if (!badge || !window.Elixir || !window.Elixir.cos) return;
    const n = window.Elixir.cos.numarTotal();
    if (n > 0) {
      badge.textContent = String(n);
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }

  window.addEventListener("cos:schimbat", updateBadge);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      renderHeader();
      renderFooter();
    });
  } else {
    renderHeader();
    renderFooter();
  }
})();
