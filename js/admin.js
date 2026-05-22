// admin.js — panou de administrare local pentru gestionarea catalogului.
// IMPORTANT: parola e doar o barieră simplă, NU securitate reală.
// Codul fiind public pe GitHub, oricine poate vedea parola în sursă.

(function () {
  // ↓↓↓ SCHIMBĂ ACEASTĂ PAROLĂ ↓↓↓
  const ADMIN_PASSWORD = "elixir2026";
  // ↑↑↑                       ↑↑↑

  const SESSION_KEY = "elixir_admin_unlocked";
  const DRAFT_KEY = "elixir_admin_draft";

  let workingList = [];
  let editingId = null;

  // ============ Lock / Unlock ============

  function isUnlocked() {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  }

  function unlock() {
    sessionStorage.setItem(SESSION_KEY, "1");
    showPanel();
  }

  function lock() {
    sessionStorage.removeItem(SESSION_KEY);
    document.querySelector("[data-admin-lock]").hidden = false;
    document.querySelector("[data-admin-panel]").hidden = true;
    document.getElementById("admin-pass").value = "";
  }

  function showPanel() {
    document.querySelector("[data-admin-lock]").hidden = true;
    document.querySelector("[data-admin-panel]").hidden = false;
    loadInitial();
  }

  function attachLogin() {
    const form = document.getElementById("admin-login");
    const err = form.querySelector('[data-error-for="pass"]');
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      const val = document.getElementById("admin-pass").value;
      if (val === ADMIN_PASSWORD) {
        err.classList.remove("show");
        unlock();
      } else {
        err.classList.add("show");
      }
    });
  }

  // ============ Working list ============

  function loadInitial() {
    const draft = sessionStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        workingList = JSON.parse(draft);
        renderList();
        return;
      } catch (e) {
        // fall through
      }
    }
    reloadFromFile();
  }

  function reloadFromFile() {
    fetch("js/produse.json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (data) {
        workingList = Array.isArray(data) ? data : [];
        saveDraft();
        renderList();
      })
      .catch(function () {
        workingList = [];
        renderList();
      });
  }

  function saveDraft() {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(workingList));
  }

  function clearDraft() {
    sessionStorage.removeItem(DRAFT_KEY);
  }

  // ============ Render ============

  function renderList() {
    const host = document.querySelector("[data-admin-list]");
    const count = document.querySelector("[data-admin-count]");
    count.textContent = String(workingList.length);

    if (workingList.length === 0) {
      host.innerHTML =
        '<div class="admin-empty">' +
        '  <h3>Niciun parfum încă</h3>' +
        '  <p>Folosește formularul de mai jos pentru a adăuga primul parfum.</p>' +
        '</div>';
      return;
    }

    host.innerHTML = workingList.map(function (p, idx) {
      const thumb = p.imagine
        ? '<img src="' + escapeAttr(p.imagine) + '" alt="" onerror="this.style.display=\'none\'; this.parentNode.textContent = \'' + escapeAttr(p.nume.slice(0, 14)) + '\'">'
        : escapeText(p.nume.slice(0, 14));
      return (
        '<div class="admin-item">' +
        '  <div class="admin-item__thumb">' + thumb + '</div>' +
        '  <div class="admin-item__info">' +
        '    <h3>' + escapeText(p.nume) + '</h3>' +
        '    <div class="admin-item__meta">' +
        escapeText(p.categorie || "—") + ' · ' + escapeText(p.volum || "—") + ' · ' +
        (typeof p.pret === "number" ? p.pret.toLocaleString("ro-RO") + " RON" : "—") +
        (p.stoc === false ? " · <em>fără stoc</em>" : "") +
        '    </div>' +
        '  </div>' +
        '  <div class="admin-item__actions">' +
        '    <button type="button" class="btn btn--small btn--ghost" data-edit="' + idx + '">Editează</button>' +
        '    <button type="button" class="btn btn--small" data-delete="' + idx + '" style="background:#b04848;border-color:#b04848;">Șterge</button>' +
        '  </div>' +
        '</div>'
      );
    }).join("");

    host.querySelectorAll("[data-edit]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const i = parseInt(btn.getAttribute("data-edit"), 10);
        startEdit(workingList[i]);
      });
    });
    host.querySelectorAll("[data-delete]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const i = parseInt(btn.getAttribute("data-delete"), 10);
        deleteAt(i);
      });
    });
  }

  // ============ Form ============

  function attachFormHandlers() {
    const form = document.getElementById("admin-product-form");
    const title = document.querySelector("[data-admin-form-title]");
    const submitBtn = form.querySelector("[data-admin-form-submit]");
    const cancelBtn = form.querySelector("[data-admin-form-cancel]");

    cancelBtn.addEventListener("click", function () {
      resetForm();
    });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      const result = readForm(form);
      if (!result) return;
      const data = result;

      if (editingId !== null) {
        const idx = workingList.findIndex(function (p) { return p.id === editingId; });
        if (idx !== -1) workingList[idx] = data;
        else workingList.push(data);
      } else {
        workingList.push(data);
      }
      saveDraft();
      renderList();
      resetForm();
    });

    window.__elixirAdminForm = { reset: resetForm, title: title, submitBtn: submitBtn };
  }

  function slug(s) {
    return s
      .toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
  }

  function readForm(form) {
    function clearErrors() {
      form.querySelectorAll(".form-error").forEach(function (e) { e.classList.remove("show"); });
    }
    function showErr(field) {
      const el = form.querySelector('[data-error-for="' + field + '"]');
      if (el) el.classList.add("show");
    }
    clearErrors();

    const fd = new FormData(form);
    const nume = (fd.get("nume") || "").toString().trim();
    if (!nume) { showErr("nume"); return null; }

    let id = (fd.get("id") || "").toString().trim();
    if (!id) id = slug(nume);
    if (!/^[a-z0-9\-]+$/.test(id)) { showErr("id"); return null; }

    // Verificăm coliziuni cu alte produse (în afara celui pe care îl edităm).
    const collision = workingList.find(function (p) {
      return p.id === id && p.id !== editingId;
    });
    if (collision) { showErr("id"); return null; }

    const pret = parseFloat(fd.get("pret"));
    if (isNaN(pret) || pret < 0) { showErr("pret"); return null; }

    function parseNote(raw) {
      return (raw || "").toString()
        .split(",")
        .map(function (s) { return s.trim(); })
        .filter(Boolean);
    }

    return {
      id: id,
      nume: nume,
      descriereScurta: (fd.get("descriereScurta") || "").toString().trim(),
      descriereLunga: (fd.get("descriereLunga") || "").toString().trim(),
      pret: pret,
      volum: (fd.get("volum") || "").toString().trim(),
      imagine: (fd.get("imagine") || "").toString().trim(),
      categorie: (fd.get("categorie") || "").toString().trim().toLowerCase(),
      note: {
        top: parseNote(fd.get("noteTop")),
        middle: parseNote(fd.get("noteMiddle")),
        base: parseNote(fd.get("noteBase"))
      },
      stoc: fd.get("stoc") === "on" || fd.get("stoc") === true
    };
  }

  function startEdit(p) {
    editingId = p.id;
    const form = document.getElementById("admin-product-form");
    form.elements.originalId.value = p.id;
    form.elements.id.value = p.id;
    form.elements.nume.value = p.nume || "";
    form.elements.descriereScurta.value = p.descriereScurta || "";
    form.elements.descriereLunga.value = p.descriereLunga || "";
    form.elements.pret.value = p.pret != null ? p.pret : "";
    form.elements.volum.value = p.volum || "";
    form.elements.imagine.value = p.imagine || "";
    form.elements.categorie.value = p.categorie || "";
    form.elements.noteTop.value = (p.note && p.note.top || []).join(", ");
    form.elements.noteMiddle.value = (p.note && p.note.middle || []).join(", ");
    form.elements.noteBase.value = (p.note && p.note.base || []).join(", ");
    form.elements.stoc.checked = p.stoc !== false;

    window.__elixirAdminForm.title.textContent = "Editează: " + p.nume;
    window.__elixirAdminForm.submitBtn.textContent = "Salvează modificările";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetForm() {
    editingId = null;
    const form = document.getElementById("admin-product-form");
    form.reset();
    form.querySelectorAll(".form-error").forEach(function (e) { e.classList.remove("show"); });
    window.__elixirAdminForm.title.textContent = "Adaugă un parfum nou";
    window.__elixirAdminForm.submitBtn.textContent = "Adaugă parfum";
  }

  function deleteAt(idx) {
    const p = workingList[idx];
    if (!p) return;
    if (!confirm('Sigur ștergi "' + p.nume + '"?')) return;
    workingList.splice(idx, 1);
    saveDraft();
    renderList();
    if (editingId === p.id) resetForm();
  }

  // ============ Toolbar actions ============

  function downloadJSON() {
    const json = JSON.stringify(workingList, null, 2) + "\n";
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "produse.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function attachToolbar() {
    document.querySelector("[data-admin-download]").addEventListener("click", downloadJSON);
    document.querySelector("[data-admin-reset]").addEventListener("click", function () {
      if (!confirm("Asta înlocuiește lista din browser cu cea din fișierul produse.json. Pierzi modificările nesalvate. Continui?")) return;
      clearDraft();
      reloadFromFile();
      resetForm();
    });
    document.querySelector("[data-admin-clear]").addEventListener("click", function () {
      if (!confirm("Sigur ștergi TOATE parfumurile din listă?")) return;
      workingList = [];
      saveDraft();
      renderList();
      resetForm();
    });
    document.querySelector("[data-admin-logout]").addEventListener("click", lock);
  }

  // ============ Utils ============

  function escapeText(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function escapeAttr(s) {
    return escapeText(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // ============ Init ============

  function init() {
    attachLogin();
    attachFormHandlers();
    attachToolbar();
    if (isUnlocked()) showPanel();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
