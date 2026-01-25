/* assets/js/app.js */

const $ = (sel) => document.querySelector(sel);

const state = {
  lang: "bg",
  i18n: {},
  nav: [],
  current: null,

  // gallery/lightbox
  galleryItems: [],
  galleryIndex: 0
};
// ------------------------
// Sidebar (vertical menu) configuration
// ------------------------
const HIDDEN_NAV_IDS = [
  "councilPhotos",
  "councilRTE1963_1986",
  "kvActivityTo1999",
  "kvDiplomas",
  "kvMagRadio1952_1956",
  "kvRTE1959_1987",
  "otherFactoryDevices",
  "otherSchemes",
  "otherSchemesKvUkv",
  "otherSchemesRz",
  "rs1993_2010",
  "rs2014_2021",
  "rs2022_2030",
  "rsPhotosDiplomas",
  "rz1996_2012",
  "rz2013_2021",
  "rz2022_2030",
  "rzPhotosDiplomas",
  "rzRTE1970_2002",
  "rzRadioTV1957_1969",
  "ukvDiplomas",
  "ukvRTE1966_1989",
  "ukvRepeaters",
  "ukvTo1992",
  "ukvTo2008",
  "ukvTo2013",
  "ukvTo2015",
  "ukvTo2026",
  "ukvTo2030",

  // Legal / policy pages (shown via footer links only)
  "terms",
  "legal",
  "privacy",
  "cookies",
  "logoTrademark"
];

const SUBNAV_GROUPS = {
  "council": [
    "councilPhotos",
    "councilRTE1963_1986"
  ],
  "kvArchive": [
    "kvDiplomas",
    "kvMagRadio1952_1956",
    "kvRTE1959_1987",
    "kvActivityTo1999"
  ],
  "ukvArchive": [
    "ukvDiplomas",
    "ukvRepeaters",
    "ukvRTE1966_1989",
    "ukvTo1992",
    "ukvTo2008",
    "ukvTo2013",
    "ukvTo2015",
    "ukvTo2026",
    "ukvTo2030"
  ],
  "rzArchive": [
    "rzPhotosDiplomas",
    "rzRadioTV1957_1969",
    "rzRTE1970_2002",
    "rz1996_2012",
    "rz2013_2021",
    "rz2022_2030"
  ],
  "rsArchive": [
    "rsPhotosDiplomas",
    "rs1993_2010",
    "rs2014_2021",
    "rs2022_2030"
  ],
  "schemes": [
    "otherSchemesKvUkv",
    "otherSchemesRz",
    "otherFactoryDevices",
    "otherSchemes"
  ]
};

function getSubnavRootId(currentId) {
  // If currentId itself is a root key
  if (SUBNAV_GROUPS[currentId]) return currentId;
  // Otherwise find a root that contains it
  for (const [rootId, ids] of Object.entries(SUBNAV_GROUPS)) {
    if (ids.includes(currentId)) return rootId;
  }
  return null;
}

function renderSubnavFor(currentId) {
  const sidebar = document.getElementById("sidebar");
  const grid = document.getElementById("pageGrid");
  const subnav = document.getElementById("subnav");
  if (!sidebar || !grid || !subnav) return;

  const rootId = getSubnavRootId(currentId);
  if (!rootId) {
    subnav.innerHTML = "";
    subnav.setAttribute("aria-hidden", "true");
    sidebar.setAttribute("aria-hidden", "true");
    grid.classList.add("no-sidebar");
    return;
  }

  const rootItem = (state.nav || []).find(x => x.id === rootId);
  const ids = SUBNAV_GROUPS[rootId] || [];
  const items = ids.map(id => (state.nav || []).find(x => x.id === id)).filter(Boolean);

  if (!items.length) {
    subnav.innerHTML = "";
    subnav.setAttribute("aria-hidden", "true");
    sidebar.setAttribute("aria-hidden", "true");
    grid.classList.add("no-sidebar");
    return;
  }

  const title = document.createElement("div");
  title.className = "subnav-title";
  title.textContent = rootItem ? (rootItem.title || rootId) : rootId;

  const ul = document.createElement("ul");
  ul.className = "subnav-list";

  // include root itself as first item (so user can always return)
  if (rootItem) {
    const li0 = document.createElement("li");
    const a0 = document.createElement("a");
    a0.href = `#${rootId}`;
    a0.dataset.id = rootId;
    a0.textContent = rootItem.title || rootId;
    if (currentId === rootId) a0.classList.add("active");
    li0.appendChild(a0);
    ul.appendChild(li0);
  }

  items.forEach(it => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `#${it.id}`;
    a.dataset.id = it.id;
    a.textContent = it.title || it.id;
    if (currentId === it.id) a.classList.add("active");
    li.appendChild(a);
    ul.appendChild(li);
  });

  subnav.innerHTML = "";
  subnav.appendChild(title);
  subnav.appendChild(ul);

  subnav.setAttribute("aria-hidden", "false");
  sidebar.setAttribute("aria-hidden", "false");
  grid.classList.remove("no-sidebar");
}


// ------------------------
// URL language helpers
// ------------------------
function getLangFromUrl() {
  const u = new URL(window.location.href);
  return u.searchParams.get("lang") || "bg";
}

function setLangInUrl(lang) {
  const u = new URL(window.location.href);
  u.searchParams.set("lang", lang);
  history.replaceState({}, "", u.toString());
}

// ------------------------
// fetch helpers
// ------------------------
async function fetchText(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Cannot load: ${path} (${res.status})`);
  return await res.text();
}

async function fetchJson(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Cannot load: ${path} (${res.status})`);
  return await res.json();
}

// ------------------------
// small util: escape html
// ------------------------
function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[c]));
}

// ------------------------
// Minimal Markdown -> HTML
// ------------------------
function mdToHtml(md) {
  let html = String(md || "")
    .replace(/\r\n/g, "\n")
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/^\- (.*)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" rel="noopener">$1</a>`)
    .trim();

  html = html
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br/>");

  if (!html.startsWith("<h") && !html.startsWith("<p>")) html = `<p>${html}</p>`;
  if (!html.endsWith("</p>")) html = `${html}</p>`;
  return html;
}

// ------------------------
// NAV transform (filter + rename per your rules)
// ------------------------
function normalizeTitle(t = "") {
  return String(t)
    .replace(/\s+/g, " ")
    .replace(/[–—]/g, "-")
    .trim();
}

function applyMenuRules(items, lang) {
  // rules are based on BG titles (as requested)
  const out = [];

  for (const it of items) {
    const originalTitle = it.title || it.id;
    const t = normalizeTitle(originalTitle);

    // removals
    if (lang === "bg") {
      if (t === "Начало") continue;
      if (t === "Управителен съвет - Снимки") continue;
    } else {
      // ако в EN имаш Home / Board Photos и т.н.
      if (t.toLowerCase() === "home") continue;
      if (t.toLowerCase().includes("board") && t.toLowerCase().includes("photos")) continue;
    }

    // rename map (BG)
    let newTitle = originalTitle;

    if (lang === "bg") {
      if (t === "КВ - Архив" || t.startsWith("КВ -")) newTitle = "КВ";
      else if (t === "УКВ - Архив" || t.startsWith("УКВ -")) newTitle = "УКВ";
      else if (t === "Радио засичане - Архив") newTitle = "Радио Засичане";
      else if (t === "Цифрова група - Снимки") newTitle = "Цифрова Група";
      else if (t === "Радио събори - Архив") newTitle = "Събори";
      else if (t === "Схеми и документация") newTitle = "Други";
      // Управителен съвет остава
      // Списания, Новини, Връзки остават
    } else {
      // леки EN еквиваленти (ако имаш такива)
      const tl = t.toLowerCase();
      if (tl.includes("hf") && tl.includes("archive")) newTitle = "HF";
      else if (tl.includes("vhf") && tl.includes("archive")) newTitle = "VHF";
      else if (tl.includes("fox") || (tl.includes("direction") && tl.includes("finding"))) newTitle = "Radio Direction Finding";
      else if (tl.includes("digital") && tl.includes("photos")) newTitle = "Digital Group";
      else if (tl.includes("rallies") || (tl.includes("meet") && tl.includes("archive"))) newTitle = "Rallies";
      else if (tl.includes("schemes") || tl.includes("documentation")) newTitle = "Other";
    }

    out.push({ ...it, title: newTitle });
  }

  return out;
}

// ------------------------
// Header texts
// ------------------------
function setHeaderTexts() {
  const siteTitle = $("#siteTitle");
  const siteSubtitle = $("#siteSubtitle");
  const footerText = $("#footerText");
  const footerContactLink = $("#footerContactLink");

  if (siteTitle) siteTitle.textContent = state.i18n.siteTitle || "Радиолюбители";
  if (siteSubtitle) siteSubtitle.textContent = state.i18n.siteSubtitle || "";
  if (footerText) footerText.textContent = state.i18n.footerText || "";

  if (footerContactLink) {
    footerContactLink.textContent = state.lang === "en" ? "Contact" : "КОНТАКТИ";
  }
}

// ------------------------
// NAV rendering (Quick links, no dropdowns)
// ------------------------
function renderNav() {
  const navEl = $("#nav");
  const mobileNavEl = $("#mobileNavInner");
  if (!navEl || !mobileNavEl) return;

  navEl.innerHTML = "";
  mobileNavEl.innerHTML = "";

    /* HOME – always first */
  /* HOME – icon only, always first */
const homeLink = document.createElement("a");
homeLink.href = `#${state.nav[0].id}`;
homeLink.dataset.id = state.nav[0].id;
homeLink.classList.add("home-link");
homeLink.setAttribute("aria-label", "Home");
homeLink.innerHTML = "🏠";
navEl.appendChild(homeLink);

const homeLinkMobile = document.createElement("a");
homeLinkMobile.href = `#${state.nav[0].id}`;
homeLinkMobile.dataset.id = state.nav[0].id;
homeLinkMobile.classList.add("home-link");
homeLinkMobile.setAttribute("aria-label", "Home");
homeLinkMobile.innerHTML = "🏠";
mobileNavEl.appendChild(homeLinkMobile);


  // apply your menu rules (filter + rename)
  const finalItems = applyMenuRules(state.nav, state.lang)
    .filter(it => !HIDDEN_NAV_IDS.includes(it.id))
    .filter(it => it.id !== 'contact');
for (const it of finalItems) {
    const a = document.createElement("a");
    a.href = `#${it.id}`;
    a.dataset.id = it.id;
    a.textContent = it.title || it.id;
    navEl.appendChild(a);

    const am = document.createElement("a");
    am.href = `#${it.id}`;
    am.dataset.id = it.id;
    am.textContent = it.title || it.id;
    mobileNavEl.appendChild(am);
  }

  // Contact as last
  const contactTitle = state.lang === "en" ? "Contact" : "КОНТАКТИ";
  const c1 = document.createElement("a");
  c1.href = "#contact";
  c1.dataset.id = "contact";
  c1.textContent = contactTitle;
  navEl.appendChild(c1);

  const c2 = document.createElement("a");
  c2.href = "#contact";
  c2.dataset.id = "contact";
  c2.textContent = contactTitle;
  mobileNavEl.appendChild(c2);

  highlightActive();
}

function highlightActive() {
  const id = state.current;
  document.querySelectorAll("nav a").forEach(a => {
    a.classList.toggle("active", a.dataset.id === id);
  });
}

// ------------------------
// Contact page loader (loads contact.html and wires Formspree)
// ------------------------
async function loadContactPage() {
  state.current = "contact";
  highlightActive();

  // Контакти НЕ трябва да показват sidebar
  // (ако при теб трябва да се показва — кажи)
  if (typeof renderSubnav === "function") {
    renderSubnav(null);
  }

  const pageTitle = $("#pageTitle");
  const breadcrumbs = $("#breadcrumbs");
  const contentEl = $("#pageContent");

  if (pageTitle) pageTitle.textContent = (state.lang === "en") ? "Contact" : "Контакти";
  if (breadcrumbs) breadcrumbs.textContent = "";

  if (!contentEl) return;

  contentEl.innerHTML = `<p style="color:var(--muted)">${escapeHtml(state.i18n.loading || "Зареждане...")}</p>`;

  try {
    const html = await fetchText(`content/pages/${state.lang}/contact.html`);
    contentEl.innerHTML = html;

    // ако съществува функция за “закачане” на submit handler — извикай я, но само ако я има
    if (typeof wireContactForm === "function") {
      wireContactForm(contentEl);
    }
  } catch (err) {
    console.error(err);
    contentEl.innerHTML = `
      <div class="card">
        <h3 style="margin-top:0">Грешка при зареждане на Контакти</h3>
        <p style="color:var(--muted)">${escapeHtml(err.message || String(err))}</p>
      </div>
    `;
  }
}


// ------------------------
// Formspree submit (ако вече го имаш – остави; тук е минимално)
// ------------------------
function wireContactForm(scopeEl) {
  const form = scopeEl.querySelector("#contactForm");
  const status = scopeEl.querySelector("#contactStatus");
  if (!form) return;

  const endpoint = form.getAttribute("action");
  const submitBtn = scopeEl.querySelector("#contactSubmitBtn") || form.querySelector('button[type="submit"]');

  const loadedAt = Date.now();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const gotcha = form.querySelector('input[name="_gotcha"]');
    if (gotcha && gotcha.value) return;

    const seconds = (Date.now() - loadedAt) / 1000;
    if (seconds < 2) {
      const msg = state.lang === "en"
        ? "Spam protection: please wait a second and try again."
        : "Защита от спам: изчакай секунда и опитай пак.";
      if (status) status.textContent = msg;
      return;
    }

    const oldBtnText = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = state.lang === "en" ? "Sending..." : "Изпращане...";
    }
    if (status) status.textContent = "";

    try {
      const fd = new FormData(form);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: fd
      });
      if (!res.ok) throw new Error(`Send failed (${res.status})`);

      form.reset();

/* Replace form with big centered success message */
const msgBg = "БЛАГОДАРИМ! СЪОБЩЕНИЕТО БЕШЕ ИЗПРАТЕНО.";
const msgEn = "THANK YOU! YOUR MESSAGE HAS BEEN SENT.";

scopeEl.innerHTML = `
  <div class="card contact-success">
    ${state.lang === "en" ? msgEn : msgBg}
  </div>
`;

    } catch (err) {
      console.error(err);
      if (status) status.textContent = state.lang === "en"
        ? "Sorry — message could not be sent. Try again later."
        : "Грешка — съобщението не беше изпратено. Опитай пак по-късно.";
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = oldBtnText;
      }
    }
  });
}

// ------------------------
// Page loader
// ------------------------
async function loadPageById(id) {
  if (id === "contact") {
    state.current = "contact";
    highlightActive();
    renderSubnavFor(null);
    await loadContactPage();
    return;
  }

  if (!state.nav || !state.nav.length) return;

  const item = state.nav.find(x => x.id === id) || state.nav[0];
  state.current = item.id;

  const pageTitle = $("#pageTitle");
  const breadcrumbs = $("#breadcrumbs");
  const contentEl = $("#pageContent");

  if (pageTitle) pageTitle.textContent = item.title || item.id;
  if (breadcrumbs) breadcrumbs.textContent = item.breadcrumbs || item.group || "";

  highlightActive();
  renderSubnavFor(item.id);

  if (!contentEl) return;
  contentEl.innerHTML = `<p style="color:var(--muted)">${escapeHtml(state.i18n.loading || "Зареждане...")}</p>`;

  try {
    if (item.type === "md") {
      const md = await fetchText(`content/pages/${state.lang}/${item.src}`);
      contentEl.innerHTML = mdToHtml(md);

    } else if (item.type === "gallery") {
      const data = await fetchJson(`content/galleries/${state.lang}/${item.src}`);
      renderGallery(data, contentEl);

    } else if (item.type === "archive") {
      const data = await fetchJson(`content/archives/${state.lang}/${item.src}`);
      renderArchive(data, contentEl);
    } else if (item.type === "contact") {
      // Контакти: зареждаме HTML формата
      await loadContactPage();

    } else {
      contentEl.innerHTML = `<p>${escapeHtml(state.i18n.notFound || "Няма съдържание.")}</p>`;
    }
  } catch (err) {
    console.error(err);
    contentEl.innerHTML = `
      <div class="card">
        <h3 style="margin-top:0">Грешка при зареждане</h3>
        <p style="color:var(--muted)">${escapeHtml(err.message || String(err))}</p>
      </div>
    `;
  }
}

// ------------------------
// Gallery rendering + Lightbox (оставям както е било)
// ------------------------
function renderGallery(data, mountEl) {
  const wrapper = document.createElement("div");

  const title = data?.title ? `<h2 style="margin-top:0">${escapeHtml(data.title)}</h2>` : "";
  const intro = data?.intro ? `<p style="color:var(--muted)">${escapeHtml(data.intro)}</p>` : "";

  wrapper.innerHTML = `
    <div class="card" style="margin-bottom:14px;">
      ${title}
      ${intro}
    </div>
  `;

  const grid = document.createElement("div");
  grid.className = "gallery";

  state.galleryItems = Array.isArray(data?.items) ? data.items : [];
  state.galleryItems.forEach((it, idx) => {
    const card = document.createElement("div");
    card.className = "thumb";
    card.innerHTML = `
      <img src="${escapeHtml(it.thumb || "")}" alt="">
      <div class="desc">${escapeHtml(it.desc || "")}</div>
    `;
    card.addEventListener("click", () => openLightbox(idx));
    grid.appendChild(card);
  });

  wrapper.appendChild(grid);
  mountEl.innerHTML = "";
  mountEl.appendChild(wrapper);
}

function openLightbox(index) {
  state.galleryIndex = index;
  const lb = $("#lightbox");
  if (!lb) return;
  lb.setAttribute("aria-hidden", "false");
  showLightboxItem();
}

function closeLightbox() {
  const lb = $("#lightbox");
  if (!lb) return;
  lb.setAttribute("aria-hidden", "true");
}

function showLightboxItem() {
  const it = state.galleryItems[state.galleryIndex];
  if (!it) return;
  const img = $("#lightboxImg");
  const cap = $("#lightboxCaption");
  if (img) img.src = it.full || it.thumb || "";
  if (cap) cap.textContent = it.desc || "";
}

function nextItem() {
  if (!state.galleryItems.length) return;
  state.galleryIndex = (state.galleryIndex + 1) % state.galleryItems.length;
  showLightboxItem();
}

function prevItem() {
  if (!state.galleryItems.length) return;
  state.galleryIndex = (state.galleryIndex - 1 + state.galleryItems.length) % state.galleryItems.length;
  showLightboxItem();
}

function renderArchive(data, mountEl) {
  // ако имаш по-специална логика — остави си я
  mountEl.innerHTML = `<div class="card"><p style="color:var(--muted)">Архив</p></div>`;
}

// ------------------------
// Mobile menu toggling
// ------------------------
function setMobileNavOpen(open) {
  const mobile = $("#mobileNav");
  const btn = $("#menuBtn");
  if (!mobile || !btn) return;

  mobile.setAttribute("aria-hidden", open ? "false" : "true");
  btn.setAttribute("aria-expanded", open ? "true" : "false");
}

// ------------------------
// App bootstrap
// ------------------------
async function bootstrap() {
  state.lang = getLangFromUrl();

  const langSelect = $("#langSelect");
  if (langSelect) langSelect.value = state.lang;

  state.i18n = await fetchJson(`content/i18n/${state.lang}.json`);
  state.nav = Array.isArray(state.i18n.nav) ? state.i18n.nav : [];
  if (!state.nav.length) throw new Error("i18n.nav is empty or missing.");

  setHeaderTexts();
  renderNav();

  // Some pages (e.g. legal/static pages) have their own static HTML content and
  // should NOT be replaced by the hash-based router.
  const isStaticPage = document.body && document.body.classList.contains("static-page");

  if (!isStaticPage) {
    const initialId = (location.hash || `#${state.nav[0].id}`).replace("#", "");
    await loadPageById(initialId);

    window.addEventListener("hashchange", async () => {
      const id = (location.hash || "").replace("#", "") || state.nav[0].id;
      await loadPageById(id);
      setMobileNavOpen(false);
    });
  }

  if (langSelect) {
    langSelect.addEventListener("change", async (e) => {
      state.lang = e.target.value;
      setLangInUrl(state.lang);
      location.reload();
    });
  }

  const menuBtn = $("#menuBtn");
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      const mobile = $("#mobileNav");
      const isOpen = mobile && mobile.getAttribute("aria-hidden") === "false";
      setMobileNavOpen(!isOpen);
    });
  }

  const lightbox = $("#lightbox");
  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target && e.target.dataset && e.target.dataset.close) closeLightbox();
    });
  }

  const nextBtn = $("#nextBtn");
  if (nextBtn) nextBtn.addEventListener("click", nextItem);

  const prevBtn = $("#prevBtn");
  if (prevBtn) prevBtn.addEventListener("click", prevItem);

  window.addEventListener("keydown", (e) => {
    const lb = $("#lightbox");
    const open = lb && lb.getAttribute("aria-hidden") === "false";
    if (!open) return;

    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") nextItem();
    if (e.key === "ArrowLeft") prevItem();
  });
}

// Ensure lightbox is closed on start
const lb = $("#lightbox");
if (lb) lb.setAttribute("aria-hidden", "true");

// Start
bootstrap().catch(err => {
  console.error(err);
  const contentEl = $("#pageContent");
  if (contentEl) {
    contentEl.innerHTML = `
      <div class="card">
        <h3 style="margin-top:0">Грешка при стартиране</h3>
        <p style="color:var(--muted)">${escapeHtml(err.message || String(err))}</p>
      </div>
    `;
  }
  
});