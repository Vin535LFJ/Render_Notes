(function () {
  "use strict";

  const DATA = window.RENDER_NOTES;
  const $ = (id) => document.getElementById(id);

  const els = {
    sidebar: $("sidebar"),
    overlay: $("sidebarOverlay"),
    menuBtn: $("menuBtn"),
    sidebarNav: $("sidebarNav"),
    breadcrumb: $("breadcrumb"),
    content: $("content"),
    tocNav: $("tocNav"),
    tocFooter: $("tocFooter"),
    progress: $("progressFill"),
    themeToggle: $("themeToggle"),
    searchTrigger: $("searchTrigger"),
    glossaryTrigger: $("glossaryTrigger"),
    courseTrigger: $("courseTrigger"),
    labTrigger: $("labTrigger"),
    graphTrigger: $("graphTrigger"),
    techTrigger: $("techTrigger"),
    termTooltip: $("termTooltip"),
    searchBackdrop: $("searchBackdrop"),
    searchDialog: $("searchDialog"),
    searchInput: $("searchInput"),
    searchResults: $("searchResults"),
    searchCount: $("searchCount"),
    buildStamp: $("buildStamp"),
    repoLink: $("repoLink"),
    diagramLightbox: $("diagramLightbox"),
    lightboxStage: $("lightboxStage"),
    lightboxCanvas: $("lightboxCanvas"),
    lightboxCaption: $("lightboxCaption"),
    lightboxScale: $("lightboxScale"),
    lightboxZoomIn: $("lightboxZoomIn"),
    lightboxZoomOut: $("lightboxZoomOut"),
    lightboxFit: $("lightboxFit"),
    lightboxReset: $("lightboxReset"),
    lightboxClose: $("lightboxClose"),
  };

  if (!DATA) {
    els.content.textContent = "内容数据未生成，请先在仓库根目录运行 python tools/build_site.py";
    return;
  }

  const docMap = new Map(DATA.docs.map((doc) => [doc.id, doc]));
  const order = DATA.order;
  const HOME_IDS = [
    "README.md",
    "00-导航与索引/学习路径指南.md",
    "00-导航与索引/知识缺口登记表.md",
    "00-导航与索引/验真队列与术语表.md",
    "02-解码与播放链路/解码与播放链路.md",
    "03-图形与GPU工程/图形与GPU工程.md",
    "07-3D渲染与算法实现/README.md",
  ];

  const GLOSSARY = DATA.glossary || { groups: [] };
  const TERMS = GLOSSARY.groups.flatMap((group) =>
    group.terms.map((term) => ({ ...term, groupLabel: group.label, groupId: group.id }))
  );
  const TERM_MAP = new Map();
  const TERM_ALIASES = [];
  TERMS.forEach((term) => {
    const names = [term.name, ...(term.aliases || [])];
    names.forEach((name) => {
      TERM_MAP.set(name.toLowerCase(), term);
      TERM_ALIASES.push(name);
    });
  });
  TERM_ALIASES.sort((a, b) => b.length - a.length);
  const TERM_PATTERN = TERM_ALIASES.length
    ? new RegExp("(" + TERM_ALIASES.map(escapeRegExp).join("|") + ")", "gi")
    : null;

  const COURSE = DATA.course || { units: [], lessons: [] };
  const LESSONS = COURSE.lessons || [];
  const LESSON_MAP = new Map(LESSONS.map((lesson) => [lesson.id, lesson]));
  const UNIT_MAP = new Map((COURSE.units || []).map((unit) => [unit.id, unit]));
  const LABS = (DATA.labs && DATA.labs.labs) || [];
  const LAB_MAP = new Map(LABS.map((lab) => [lab.id, lab]));
  const PROGRESS_KEY = "rn-course-progress";

  let currentId = null;
  let renderToken = 0;
  let searchHits = [];
  let searchSelected = 0;
  let mermaidCounter = 0;
  let scrollScheduled = false;
  let labRedraw = null;
  let labDispose = null;

  /* ---------------- utilities ---------------- */

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function safeDecode(value) {
    try {
      return decodeURIComponent(value);
    } catch (err) {
      return value;
    }
  }

  function routeFor(id, anchor) {
    return "#/doc/" + encodeURIComponent(id) + (anchor ? "?h=" + encodeURIComponent(anchor) : "");
  }

  function glossaryRoute(termName) {
    return "#/glossary" + (termName ? "?term=" + encodeURIComponent(termName) : "");
  }

  function courseRoute(lessonId) {
    return "#/course" + (lessonId ? "/" + encodeURIComponent(lessonId) : "");
  }

  function labRoute(labId) {
    return "#/lab" + (labId ? "/" + encodeURIComponent(labId) : "");
  }

  function graphRoute(viewId) {
    return "#/graph" + (viewId ? "/" + encodeURIComponent(viewId) : "");
  }

  function techRoute() {
    return "#/tech";
  }

  function parseRoute() {
    let raw = location.hash.slice(1).replace(/^\//, "");
    raw = safeDecode(raw);
    if (!raw || raw === "home" || raw.startsWith("home?")) return { home: true };
    if (raw.startsWith("doc/")) {
      const question = raw.indexOf("?");
      const path = question >= 0 ? raw.slice(0, question) : raw;
      const query = question >= 0 ? raw.slice(question + 1) : "";
      const id = path.slice(4);
      const match = query.match(/(?:^|&)h=([^&]*)/);
      return { id: id, anchor: match ? match[1] : "" };
    }
    if (raw === "course" || raw.startsWith("course?")) return { course: true };
    if (raw.startsWith("course/")) return { course: true, lesson: safeDecode(raw.slice(7)) };
    if (raw === "lab" || raw.startsWith("lab?")) return { lab: true, labId: "" };
    if (raw.startsWith("lab/")) return { lab: true, labId: safeDecode(raw.slice(4)) };
    if (raw === "graph" || raw.startsWith("graph?")) return { graph: true, viewId: "" };
    if (raw.startsWith("graph/")) return { graph: true, viewId: safeDecode(raw.slice(6)) };
    if (raw === "tech" || raw.startsWith("tech?")) return { tech: true };
    if (raw === "glossary" || raw.startsWith("glossary?")) {
      const match = raw.match(/[?&]term=([^&]*)/);
      return { glossary: true, term: match ? safeDecode(match[1]) : "" };
    }
    return { home: true };
  }

  function shortTitle(title) {
    return String(title).replace(/^\d{2}\s*[·.]\s*/, "").trim() || title;
  }

  function dirname(path) {
    const index = path.lastIndexOf("/");
    return index < 0 ? "" : path.slice(0, index);
  }

  function resolveDocPath(basePath, relative) {
    let rel = safeDecode(relative).replace(/\\/g, "/");
    const hashIndex = rel.indexOf("#");
    const queryIndex = rel.indexOf("?");
    let cut = rel.length;
    if (hashIndex >= 0) cut = Math.min(cut, hashIndex);
    if (queryIndex >= 0) cut = Math.min(cut, queryIndex);
    rel = rel.slice(0, cut);
    if (!rel.endsWith(".md")) return null;

    const base = dirname(basePath);
    const parts = base ? base.split("/") : [];
    rel.split("/").forEach((part) => {
      if (!part || part === ".") return;
      if (part === "..") parts.pop();
      else parts.push(part);
    });
    return parts.join("/");
  }

  function slugify(text) {
    return String(text)
      .replace(/<[^>]*>/g, "")
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  /* ---------------- offline svg icons ---------------- */

  const ICONS = {
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z"/><path d="M8 3v18M11 8h5M11 12h5"/>',
    wave: '<path d="M3 12h3l2-6 3 12 3-9 2 3h5"/>',
    play: '<path d="M8 5v14l11-7z"/>',
    cpu: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0-5 5L4 17l3 3 5.7-5.7a4 4 0 0 0 5-5l-3 3-3-3z"/>',
    spark: '<path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z"/>',
    cube: '<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M3 7l9 5 9-5M12 12v10"/>',
    archive: '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v12h14V8M10 12h4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>',
    route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h4a4 4 0 0 0 4-4V8"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 9v5M12 17h.01"/>',
    palette: '<circle cx="12" cy="12" r="9"/><circle cx="8" cy="9" r="1"/><circle cx="12" cy="7" r="1"/><circle cx="16" cy="9" r="1"/>',
    link: '<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    code: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4"/>',
    car: '<path d="M5 16l1.5-5h11L19 16M4 16h16v3H4zM7 19v2M17 19v2"/>',
  };

  const SECTION_ICONS = {
    "": "compass",
    "00-导航与索引": "compass",
    "01-基础理论": "wave",
    "02-解码与播放链路": "play",
    "03-图形与GPU工程": "cpu",
    "04-跨平台与高性能架构": "layers",
    "05-项目实战": "wrench",
    "06-面试知识库": "spark",
    "07-3D渲染与算法实现": "cube",
    archive: "archive",
  };

  const GROUP_ICONS = {
    "math-geometry": "cube",
    "gpu-hardware": "cpu",
    "pipeline-resources": "layers",
    "sync-scheduling": "link",
    "android-av": "play",
    "color-compression": "palette",
    "culling-aa": "target",
    "explicit-api": "code",
    automotive: "car",
  };

  function icon(name, className) {
    const body = ICONS[name] || ICONS.info;
    return (
      '<svg class="icon' + (className ? " " + className : "") +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + "</svg>"
    );
  }

  function sectionIcon(docPath) {
    const top = String(docPath || "").split("/")[0];
    return SECTION_ICONS[top] || "info";
  }

  /* ---------------- glossary & inline explanations ---------------- */

  function termByName(name) {
    return TERM_MAP.get(String(name).toLowerCase()) || null;
  }

  function annotateTerms(root) {
    if (!TERM_PATTERN) return;
    const used = new Map();
    const skipSelector = "script,style,code,pre,a,h1,h2,h3,h4,.katex,.term,.article-meta,.term-panel,.pager,.no-term";
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || node.nodeValue.length < 2) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent || parent.closest(skipSelector)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach((node) => {
      const text = node.nodeValue;
      TERM_PATTERN.lastIndex = 0;
      const matches = [];
      let match;
      while ((match = TERM_PATTERN.exec(text)) !== null) {
        const term = termByName(match[0]);
        if (!term) continue;
        const count = used.get(term.name) || 0;
        if (count >= 2) continue;
        used.set(term.name, count + 1);
        matches.push({ index: match.index, value: match[0], term: term });
        if (!match[0]) TERM_PATTERN.lastIndex++;
      }
      if (!matches.length) return;

      const fragment = document.createDocumentFragment();
      let cursor = 0;
      matches.forEach((item) => {
        if (item.index > cursor) fragment.appendChild(document.createTextNode(text.slice(cursor, item.index)));
        const span = document.createElement("span");
        span.className = "term";
        span.tabIndex = 0;
        span.dataset.term = item.term.name;
        span.textContent = item.value;
        fragment.appendChild(span);
        cursor = item.index + item.value.length;
      });
      if (cursor < text.length) fragment.appendChild(document.createTextNode(text.slice(cursor)));
      node.parentNode.replaceChild(fragment, node);
    });
  }

  function tooltipHtml(term) {
    const aliases = (term.aliases || []).length
      ? '<div class="tt-aliases">又称：' + escapeHtml(term.aliases.join(" / ")) + "</div>"
      : "";
    return (
      '<div class="tt-head"><strong>' + escapeHtml(term.name) + "</strong>" +
      '<span>' + escapeHtml(term.groupLabel) + "</span></div>" +
      aliases +
      '<p class="tt-lead">' + escapeHtml(term.short) + "</p>" +
      '<dl class="tt-meta">' +
      "<dt>展开讲讲</dt><dd>" + escapeHtml(term.detail) + "</dd>" +
      "<dt>为什么重要</dt><dd>" + escapeHtml(term.why) + "</dd>" +
      "<dt>容易混淆</dt><dd>" + escapeHtml(term.confusion) + "</dd>" +
      "</dl>" +
      '<a class="tt-more" href="' + glossaryRoute(term.name) + '">在术语速查中查看 →</a>'
    );
  }

  function showTermTooltip(term, target, pinned) {
    if (!term || !target) return;
    els.termTooltip.innerHTML = tooltipHtml(term);
    els.termTooltip.hidden = false;
    els.termTooltip.dataset.pinned = pinned ? "1" : "";

    const rect = target.getBoundingClientRect();
    const tip = els.termTooltip;
    const width = Math.min(390, window.innerWidth - 24);
    let left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
    let top = rect.bottom + 10;
    const height = tip.offsetHeight;
    if (top + height > window.innerHeight - 12) top = Math.max(12, rect.top - height - 10);
    tip.style.left = left + "px";
    tip.style.top = top + "px";
    tip.style.width = width + "px";
  }

  function hideTermTooltip(force) {
    if (!force && els.termTooltip.dataset.pinned === "1") return;
    els.termTooltip.hidden = true;
    els.termTooltip.dataset.pinned = "";
  }

  function termHitsInDoc(doc) {
    if (!TERM_PATTERN) return [];
    const counts = new Map();
    const regex = new RegExp(TERM_PATTERN.source, "gi");
    let match;
    while ((match = regex.exec(doc.plain)) !== null) {
      const term = termByName(match[0]);
      if (!term) continue;
      counts.set(term.name, (counts.get(term.name) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ term: termByName(name), count: count }))
      .filter((item) => item.term)
      .slice(0, 6);
  }

  function buildTermPanel(doc) {
    const hits = termHitsInDoc(doc);
    if (!hits.length) return;
    const meta = els.content.querySelector(".article-meta");
    const panel = document.createElement("details");
    panel.className = "term-panel no-term";
    panel.innerHTML =
      "<summary>本页重点术语 <span>" + hits.length + " 个 · 点击展开</span></summary>" +
      '<div class="term-panel-grid">' +
      hits
        .map(
          (item) =>
            '<a class="term-chip" href="' + glossaryRoute(item.term.name) + '">' +
            "<strong>" + escapeHtml(item.term.name) + "</strong>" +
            "<span>" + escapeHtml(item.term.short) + "</span>" +
            "<small>出现 " + item.count + " 次</small></a>"
        )
        .join("") +
      "</div>";
    if (meta && meta.nextSibling) els.content.insertBefore(panel, meta.nextSibling);
    else els.content.appendChild(panel);
  }

  function glossaryCard(term, open, groupLabel) {
    return (
      '<article class="glossary-card" data-term-name="' + escapeHtml(term.name) + '">' +
      '<div class="gc-head"><h3>' + escapeHtml(term.name) + "</h3>" +
      '<span class="gc-group">' + escapeHtml(groupLabel || term.groupLabel || "") + "</span></div>" +
      (term.aliases && term.aliases.length
        ? '<div class="gc-aliases">又称 ' + escapeHtml(term.aliases.join(" / ")) + "</div>"
        : "") +
      '<p class="gc-short">' + escapeHtml(term.short) + "</p>" +
      "<details class=\"gc-details\"" + (open ? " open" : "") + ">" +
      "<summary>展开原理与易混点</summary>" +
      '<div class="gc-body">' +
      "<p><strong>展开讲讲</strong>" + escapeHtml(term.detail) + "</p>" +
      "<p><strong>为什么重要</strong>" + escapeHtml(term.why) + "</p>" +
      "<p><strong>容易混淆</strong>" + escapeHtml(term.confusion) + "</p>" +
      "</div></details></article>"
    );
  }

  /* ---------------- textbook mode ---------------- */

  function getCourseProgress() {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function saveCourseProgress(list) {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(list));
    } catch (err) {
      /* localStorage may be unavailable on file:// */
    }
  }

  function isLessonDone(id) {
    return getCourseProgress().indexOf(id) >= 0;
  }

  function toggleLessonDone(id) {
    const list = getCourseProgress();
    const index = list.indexOf(id);
    if (index >= 0) list.splice(index, 1);
    else list.push(id);
    saveCourseProgress(list);
  }

  function courseProgress() {
    const done = getCourseProgress().filter((id) => LESSON_MAP.has(id)).length;
    return { done: done, total: LESSONS.length, percent: LESSONS.length ? Math.round((done / LESSONS.length) * 100) : 0 };
  }

  function nextLessonId(id) {
    const index = LESSONS.findIndex((lesson) => lesson.id === id);
    return index >= 0 && index < LESSONS.length - 1 ? LESSONS[index + 1].id : "";
  }

  function courseGraph() {
    const lines = ["graph LR"];
    (COURSE.units || []).forEach((unit) => {
      lines.push('  subgraph ' + unit.id + '["' + unit.title + '"]');
      LESSONS.filter((lesson) => lesson.unit === unit.id).forEach((lesson) => {
        lines.push('    ' + lesson.id + '["' + lesson.id + " " + lesson.title + '"]');
      });
      lines.push("  end");
    });
    LESSONS.forEach((lesson) => {
      (lesson.prerequisites || []).forEach((pre) => lines.push("  " + pre + " --> " + lesson.id));
    });
    return lines.join("\n");
  }

  function renderCourse() {
    currentId = null;
    renderToken++;
    document.title = "教材模式 · Render_Notes";
    els.breadcrumb.innerHTML =
      '<span>Render_Notes</span><span class="crumb-sep">/</span><span class="crumb-current">教材模式</span>';

    const progress = courseProgress();
    const next = LESSONS.find((lesson) => !isLessonDone(lesson.id)) || LESSONS[0];
    const unitsHtml = (COURSE.units || [])
      .map((unit) => {
        const cards = LESSONS.filter((lesson) => lesson.unit === unit.id)
          .map(
            (lesson) =>
              '<a class="lesson-card' + (isLessonDone(lesson.id) ? " done" : "") + '" href="' + courseRoute(lesson.id) + '">' +
              '<span class="lesson-id">' + escapeHtml(lesson.id) + "</span>" +
              "<strong>" + escapeHtml(lesson.title) + "</strong>" +
              "<span>" + escapeHtml(lesson.short) + "</span>" +
              '<span class="lesson-foot">' + lesson.minutes + " 分钟 · " +
              (isLessonDone(lesson.id) ? "已完成 ✓" : "未开始") + "</span></a>"
          )
          .join("");
        return (
          '<section class="course-unit no-term" id="unit-' + escapeHtml(unit.id) + '">' +
          '<div class="course-unit-head"><h2>' + escapeHtml(unit.title) + "</h2><p>" +
          escapeHtml(unit.subtitle) + "</p></div>" +
          '<div class="lesson-grid">' + cards + "</div></section>"
        );
      })
      .join("");

    els.content.innerHTML =
      '<section class="course-hero no-term">' +
      '<span class="hero-eyebrow">教材模式 · 按认知顺序学习</span>' +
      "<h1>从“是什么”走到“为什么”</h1>" +
      "<p>现有文档是知识资产，教材模式只负责重排阅读顺序：每课明确前置、目标、阅读步骤、关键术语和自检题。</p>" +
      '<div class="course-progress"><div class="course-progress-bar"><span style="width:' + progress.percent + '%"></span></div>' +
      "<span>已完成 " + progress.done + " / " + progress.total + " 课（" + progress.percent + "%）</span></div>" +
      (next ? '<a class="course-continue" href="' + courseRoute(next.id) + '">继续学习：' + escapeHtml(next.id + " " + next.title) + " →</a>" : "") +
      "</section>" +
      '<section class="course-map no-term"><h2>学习依赖图</h2>' +
      '<pre><code class="language-mermaid">' + escapeHtml(courseGraph()) + "</code></pre></section>" +
      unitsHtml;

    els.tocNav.innerHTML = (COURSE.units || [])
      .map((unit) => '<a class="toc-link level-2" href="#unit-' + escapeHtml(unit.id) + '" data-target="unit-' + escapeHtml(unit.id) + '">' + escapeHtml(unit.title) + "</a>")
      .join("");
    els.tocNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const target = document.getElementById(link.dataset.target);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    els.tocFooter.textContent = LESSONS.length + " 课 · 进度自动保存在本地";

    enhanceCode(els.content, renderToken);
    window.scrollTo({ top: 0, behavior: "auto" });
    updateProgress();
  }

  function renderLesson(lessonId) {
    const lesson = LESSON_MAP.get(lessonId);
    if (!lesson) {
      renderCourse();
      return;
    }
    currentId = null;
    renderToken++;
    document.title = lesson.id + " " + lesson.title + " · 教材模式";
    const unit = UNIT_MAP.get(lesson.unit) || { title: "教材" };
    els.breadcrumb.innerHTML =
      '<span>教材模式</span><span class="crumb-sep">/</span>' +
      "<span>" + escapeHtml(unit.title) + "</span><span class=\"crumb-sep\">/</span>" +
      '<span class="crumb-current">' + escapeHtml(lesson.id + " " + lesson.title) + "</span>";

    const done = isLessonDone(lesson.id);
    const prereqs = (lesson.prerequisites || [])
      .map((id) => {
        const pre = LESSON_MAP.get(id);
        if (!pre) return "";
        const ok = isLessonDone(id);
        return '<a class="prereq-chip' + (ok ? " done" : "") + '" href="' + courseRoute(id) + '">' +
          escapeHtml(pre.id + " " + pre.title) + "<small>" + (ok ? "已完成" : "未完成") + "</small></a>";
      })
      .join("");
    const reading = (lesson.reading || [])
      .map(
        (item, index) =>
          '<li><span class="reading-index">' + (index + 1) + "</span>" +
          '<a href="' + routeFor(item.doc, item.anchor) + '">' + escapeHtml(item.label || docMap.get(item.doc)?.title || item.doc) + "</a></li>"
      )
      .join("");
    const terms = (lesson.terms || [])
      .map((name) => '<a class="term-chip" href="' + glossaryRoute(name) + '">' + escapeHtml(name) + "</a>")
      .join("");
    const checkpoints = (lesson.checkpoint || []).map((q) => "<li>" + escapeHtml(q) + "</li>").join("");
    const nextId = lesson.next || nextLessonId(lesson.id);
    const labLinks = LABS.filter((lab) => lab.lesson === lesson.id)
      .map((lab) => '<a class="lesson-lab" href="' + labRoute(lab.id) + '">⌁ 打开实验：' + escapeHtml(lab.title) + "</a>")
      .join("");

    els.content.innerHTML =
      '<section class="lesson-hero no-term">' +
      '<span class="hero-eyebrow">' + escapeHtml(unit.title) + " · " + escapeHtml(lesson.id) + "</span>" +
      "<h1>" + escapeHtml(lesson.title) + "</h1>" +
      '<p class="lesson-question">核心问题：' + escapeHtml(lesson.question) + "</p>" +
      '<div class="lesson-meta"><span>' + lesson.minutes + " 分钟</span><span>" +
      (done ? "已完成" : "未完成") + "</span><a href=\"" + courseRoute() + "\">← 课程地图</a></div>" +
      "</section>" +
      '<section class="lesson-block no-term"><h2>学习目标</h2><ol>' +
      (lesson.objectives || []).map((o) => "<li>" + escapeHtml(o) + "</li>").join("") +
      "</ol></section>" +
      '<section class="lesson-block no-term"><h2>前置检查</h2>' +
      (prereqs || '<p class="lesson-empty">无前置课时，可以直接开始。</p>') +
      "</section>" +
      '<section class="lesson-block no-term"><h2>按顺序阅读</h2><ol class="reading-list">' + reading + "</ol></section>" +
      '<section class="lesson-block no-term"><h2>关键术语</h2><div class="lesson-terms">' + terms + "</div></section>" +
      '<section class="lesson-block no-term"><h2>学完自检</h2><ul>' + checkpoints + "</ul></section>" +
      '<section class="lesson-actions no-term">' +
      labLinks +
      '<button type="button" class="lesson-toggle" data-lesson="' + escapeHtml(lesson.id) + '">' +
      (done ? "标记为未完成" : "标记本课完成") + "</button>" +
      (nextId ? '<a class="lesson-next" href="' + courseRoute(nextId) + '">下一课 →</a>' : '<a class="lesson-next" href="' + courseRoute() + '">回到课程地图 →</a>') +
      "</section>";

    buildToc(els.content);
    window.scrollTo({ top: 0, behavior: "auto" });
    updateProgress();
  }

  function lessonsForDoc(docId) {
    return LESSONS.filter((lesson) => (lesson.reading || []).some((item) => item.doc === docId));
  }

  function labsForDoc(docId) {
    return LABS.filter((lab) => (lab.docs || []).indexOf(docId) >= 0);
  }

  function buildCourseStrip(doc) {
    const lessons = lessonsForDoc(doc.id);
    const labs = labsForDoc(doc.id);
    if (!lessons.length && !labs.length) return;
    const meta = els.content.querySelector(".article-meta");
    const strip = document.createElement("div");
    strip.className = "course-strip no-term";
    strip.innerHTML =
      icon(lessons.length ? "book" : "target") +
      "<span>" + (lessons.length ? "本文属于教材" : "本文配套实验") + "</span>" +
      lessons
        .slice(0, 4)
        .map((lesson) => '<a href="' + courseRoute(lesson.id) + '">' + escapeHtml(lesson.id + " " + lesson.title) + "</a>")
        .join("") +
      labs
        .map((lab) => '<a href="' + labRoute(lab.id) + '">⌁ 实验：' + escapeHtml(lab.title) + "</a>")
        .join("");
    if (meta && meta.nextSibling) els.content.insertBefore(strip, meta.nextSibling);
    else els.content.appendChild(strip);
  }

  function renderGlossary(activeTermName) {
    currentId = null;
    renderToken++;
    document.title = "术语速查 · Render_Notes";
    els.breadcrumb.innerHTML =
      '<span>Render_Notes</span><span class="crumb-sep">/</span><span class="crumb-current">术语速查</span>';
    els.tocNav.innerHTML = GLOSSARY.groups
      .map(
        (group) =>
          '<a class="toc-link level-2" href="#group-' + escapeHtml(group.id) +
          '" data-target="group-' + escapeHtml(group.id) + '">' + escapeHtml(group.label) + "</a>"
      )
      .join("");
    els.tocNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const target = document.getElementById(link.dataset.target);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    els.tocFooter.textContent = TERMS.length + " 个术语 · 点击词条查看解释";

    const activeTerm = activeTermName ? termByName(activeTermName) : null;
    const groupsHtml = GLOSSARY.groups
      .map(
        (group) =>
          '<section class="glossary-group no-term" id="group-' + escapeHtml(group.id) + '">' +
          '<div class="glossary-group-head">' + icon(GROUP_ICONS[group.id]) +
          "<h2>" + escapeHtml(group.label) + "</h2>" +
          "<span>" + group.terms.length + " 条</span></div>" +
          '<div class="glossary-grid">' +
          group.terms.map((term) => glossaryCard(term, activeTerm && term.name === activeTerm.name, group.label)).join("") +
          "</div></section>"
      )
      .join("");

    els.content.innerHTML =
      '<section class="glossary-hero no-term">' +
      '<span class="hero-eyebrow">原理名词 · 讲义式解释</span>' +
      "<h1>术语速查</h1>" +
      "<p>不只是翻译：每个术语都给出“它是什么、为什么要懂、容易混淆在哪里”。正文中带虚线下划线的词也可以悬停查看。</p>" +
      '<div class="glossary-filter">' +
      '<span>⌕</span><input id="glossaryFilter" type="search" placeholder="筛选术语，例如 RenderGraph / OES / 带宽" />' +
      '<kbd>' + TERMS.length + " 条</kbd></div></section>" +
      groupsHtml;

    const filter = $("glossaryFilter");
    if (filter) {
      filter.addEventListener("input", () => {
        const query = filter.value.trim().toLowerCase();
        els.content.querySelectorAll(".glossary-card").forEach((card) => {
          const name = card.dataset.termName || "";
          card.hidden = !!query && !name.toLowerCase().includes(query) && !card.textContent.toLowerCase().includes(query);
        });
        els.content.querySelectorAll(".glossary-group").forEach((group) => {
          const visible = group.querySelectorAll(".glossary-card:not([hidden])").length;
          group.hidden = visible === 0;
        });
      });
      if (activeTerm) filter.value = activeTerm.name;
    }

    window.scrollTo({ top: 0, behavior: "auto" });
    updateProgress();
    if (activeTerm) {
      requestAnimationFrame(() => {
        const card = els.content.querySelector('.glossary-card[data-term-name="' + activeTerm.name + '"]');
        if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }

  /* ---------------- interactive graphics lab ---------------- */

  const CUBE_VERTICES = [
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
  ];
  const CUBE_EDGES = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  const LAB_DEFAULTS = {
    tx: 0, ty: 0, tz: 0, ry: 25, scale: 1, distance: 5, fov: 50,
    projection: "perspective", vertex: 6,
  };

  function labParamText(key, value) {
    if (key === "ry" || key === "fov") return Math.round(value) + "°";
    if (key === "scale") return Number(value).toFixed(2) + "×";
    return Number(value).toFixed(1);
  }

  function matIdentity() {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  }

  function matMul(a, b) {
    const out = new Array(16).fill(0);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) sum += a[r * 4 + k] * b[k * 4 + c];
        out[r * 4 + c] = sum;
      }
    }
    return out;
  }

  function matTranslate(x, y, z) {
    const m = matIdentity();
    m[3] = x;
    m[7] = y;
    m[11] = z;
    return m;
  }

  function matRotateY(degrees) {
    const rad = (degrees * Math.PI) / 180;
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1];
  }

  function matScale(s) {
    const m = matIdentity();
    m[0] = s;
    m[5] = s;
    m[10] = s;
    return m;
  }

  function matPerspective(fovDeg, aspect, near, far) {
    const f = 1 / Math.tan((fovDeg * Math.PI) / 360);
    const nf = 1 / (near - far);
    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, 2 * far * near * nf,
      0, 0, -1, 0,
    ];
  }

  function matOrthographic(aspect, near, far) {
    const half = 2.2;
    const m = matIdentity();
    m[0] = 1 / (half * aspect);
    m[5] = 1 / half;
    m[10] = -2 / (far - near);
    m[14] = -(far + near) / (far - near);
    return m;
  }

  function applyMat(m, v) {
    return [0, 1, 2, 3].map((r) =>
      m[r * 4] * v[0] + m[r * 4 + 1] * v[1] + m[r * 4 + 2] * v[2] + m[r * 4 + 3] * v[3]
    );
  }

  function lerpVec4(a, b, t) {
    return a.map((value, index) => value + (b[index] - value) * t);
  }

  /* Clip a clip-space segment against w>=near and the homogeneous NDC box. */
  function clipSegment(a, b, near) {
    let p = a.slice();
    let q = b.slice();
    const clipPlane = (distance) => {
      const dp = distance(p);
      const dq = distance(q);
      if (dp < 0 && dq < 0) return false;
      if (dp >= 0 && dq >= 0) return true;
      const cut = lerpVec4(p, q, dp / (dp - dq));
      if (dp < 0) p = cut;
      else q = cut;
      return true;
    };
    const planes = [
      (v) => v[3] - near,
      (v) => v[3] - v[0], (v) => v[3] + v[0],
      (v) => v[3] - v[1], (v) => v[3] + v[1],
      (v) => v[3] - v[2], (v) => v[3] + v[2],
    ];
    for (let i = 0; i < planes.length; i++) {
      if (!clipPlane(planes[i])) return null;
    }
    return [p, q];
  }

  function fmt(n) {
    if (!isFinite(n)) return "—";
    const value = Math.abs(n) < 0.005 ? 0 : n;
    return (value >= 0 ? " " : "") + value.toFixed(2);
  }

  function fmtVec(v) {
    return "(" + v.map((n) => fmt(n)).join(", ") + ")";
  }

  function matrixText(m) {
    return [0, 1, 2, 3]
      .map((r) => [0, 1, 2, 3].map((c) => fmt(m[r * 4 + c]).padStart(7)).join(" "))
      .join("\n");
  }

  function labControlRow(label, key, min, max, step) {
    return (
      '<label class="lab-control">' +
      "<span>" + escapeHtml(label) + '<output data-out="' + key + '"></output></span>' +
      '<input type="range" data-param="' + key + '" min="' + min + '" max="' + max +
      '" step="' + step + '" value="' + LAB_DEFAULTS[key] + '" /></label>'
    );
  }

  function renderLabList() {
    if (labDispose) { labDispose(); labDispose = null; }
    currentId = null;
    renderToken++;
    document.title = "图形实验室 · Render_Notes";
    els.breadcrumb.innerHTML =
      '<span>Render_Notes</span><span class="crumb-sep">/</span><span class="crumb-current">图形实验室</span>';
    els.tocNav.innerHTML = "";
    els.tocFooter.textContent = LABS.length + " 个实验 · 持续扩充中";

    const cards = LABS.map((lab) => {
      const lesson = LESSON_MAP.get(lab.lesson);
      return (
        '<a class="lab-card" href="' + labRoute(lab.id) + '">' +
        '<span class="lab-card-kicker">实验 · ' + escapeHtml(lab.lesson || "独立") + "</span>" +
        "<strong>" + escapeHtml(lab.title) + "</strong>" +
        "<p>" + escapeHtml(lab.subtitle) + "</p>" +
        '<span class="lab-card-foot">' +
        (lesson ? escapeHtml(lesson.title) + " · " : "") +
        (lab.terms || []).slice(0, 4).map((term) => escapeHtml(term)).join(" / ") +
        "</span></a>"
      );
    }).join("");

    els.content.innerHTML =
      '<section class="lab-hero no-term">' +
      '<span class="hero-eyebrow">可运行的知识点 · 从教材到实验</span>' +
      "<h1>图形实验室</h1>" +
      "<p>有些概念看文字不够：调一次 FOV、拖一次旋转，矩阵和画面同时变化，才能建立真正的直觉。每个实验都对应教材课时与原始文档，并把数学步骤逐阶段摊开。</p>" +
      '<div class="lab-hero-meta"><span>' + LABS.length + " 个示范实验</span>" +
      "<span>离线 Canvas 2D · 无外部依赖</span><span>参数可重置</span></div></section>" +
      '<section class="lab-section no-term"><h2>全部实验</h2><div class="lab-grid">' + cards + "</div></section>" +
      '<section class="lab-section no-term"><h2>关于这个实验室</h2>' +
      '<div class="lab-note">' + icon("info") + "<div>" +
      "<p>实验室是教材的可操作延伸，不是另一套独立教程。每个实验都验证完整闭环：文档 → 术语 → 公式 → 交互 → 自检。</p>" +
      "<p>现在有两条示范线：<strong>坐标变换与 MVP</strong> 对应任务一（读懂原理），<strong>程序化几何 · 旋转曲面</strong> 对应任务二阶段 1（用数学生成几何）。后续继续扩展到光照、PBR、着色器与程序化材质。相关实践以 Saltline 作为案例研究和实验起点，不把单个项目的选择当作行业标准。</p>" +
      "</div></div></section>";

    buildToc(els.content);
    window.scrollTo({ top: 0, behavior: "auto" });
    updateProgress();
  }

  // Shared footer for every lab: hands-on task checklist + optional self-test.
  // Both states persist independently in localStorage so a closed loop can be
  // verified (doc -> lesson -> term -> formula -> interaction -> self-test).
  function labFooterHtml(lab) {
    const tasks = (lab.tasks || [])
      .map((task) => '<li><input type="checkbox" class="lab-task-check" /><span>' + escapeHtml(task) + "</span></li>")
      .join("");
    let html =
      '<section class="lab-section no-term"><h2>试着动手</h2><ul class="lab-task-list">' + tasks + "</ul></section>";
    const selfTest = lab.selfTest || [];
    if (selfTest.length) {
      const items = selfTest
        .map((item, i) =>
          '<details class="lab-selftest-item" data-selfindex="' + i + '">' +
          "<summary>" + (i + 1) + ". " + escapeHtml(item.q) + "</summary>" +
          '<div class="lab-selftest-answer">' + escapeHtml(item.a) + "</div></details>"
        )
        .join("");
      html +=
        '<section class="lab-section no-term"><h2>自检</h2>' +
        '<p class="lab-hint">先自己想一遍，再展开答案。展开状态会记住。</p>' +
        '<div class="lab-selftest">' + items + "</div></section>";
    }
    return html;
  }

  function wireLabFooter(lab) {
    const taskKey = "rn-lab-tasks-" + lab.id;
    const checks = Array.from(els.content.querySelectorAll(".lab-task-check"));
    try {
      const saved = JSON.parse(localStorage.getItem(taskKey) || "[]");
      checks.forEach((box, index) => { box.checked = !!saved[index]; });
    } catch (err) { /* storage may be unavailable */ }
    checks.forEach((box) => {
      box.addEventListener("change", () => {
        try {
          localStorage.setItem(taskKey, JSON.stringify(checks.map((item) => item.checked)));
        } catch (err) { /* ignore */ }
      });
    });

    const testKey = "rn-lab-selftest-" + lab.id;
    const details = Array.from(els.content.querySelectorAll(".lab-selftest-item"));
    if (details.length) {
      try {
        const saved = JSON.parse(localStorage.getItem(testKey) || "[]");
        details.forEach((d, i) => { d.open = !!saved[i]; });
      } catch (err) { /* ignore */ }
      details.forEach((d) => {
        d.addEventListener("toggle", () => {
          try {
            localStorage.setItem(testKey, JSON.stringify(details.map((item) => item.open)));
          } catch (err) { /* ignore */ }
        });
      });
    }
  }

  function renderLab(labId) {
    const lab = LAB_MAP.get(labId);
    if (!lab) { renderLabList(); return; }
    if (lab.type === "lathe") { renderLatheLab(lab); return; }
    if (lab.type === "pbr") { renderPbrLab(lab); return; }
    renderMvpLab(lab);
  }

  function renderMvpLab(lab) {
    if (labDispose) { labDispose(); labDispose = null; }
    currentId = null;
    renderToken++;
    document.title = lab.title + " · 图形实验室";
    els.breadcrumb.innerHTML =
      '<span>图形实验室</span><span class="crumb-sep">/</span>' +
      '<span class="crumb-current">' + escapeHtml(lab.title) + "</span>";

    const lesson = LESSON_MAP.get(lab.lesson);
    const docs = (lab.docs || [])
      .map((id) => {
        const doc = docMap.get(id);
        return doc ? '<a href="' + routeFor(id) + '">' + escapeHtml(shortTitle(doc.title)) + "</a>" : "";
      })
      .join("");
    const terms = (lab.terms || [])
      .map((name) => '<a class="term-chip" href="' + glossaryRoute(name) + '">' + escapeHtml(name) + "</a>")
      .join("");
    const stages = (lab.stages || [])
      .map((stage, index) =>
        '<div class="lab-stage">' +
        '<span class="lab-stage-index">' + (index + 1) + "</span>" +
        "<strong>" + escapeHtml(stage.name) + "</strong>" +
        "<small>" + escapeHtml(stage.desc) + "</small>" +
        '<code data-stage-value="' + index + '">—</code></div>'
      )
      .join("");
    const vertexOptions = CUBE_VERTICES.map((vertex, index) =>
      '<option value="' + index + '"' + (index === LAB_DEFAULTS.vertex ? " selected" : "") +
      '>v' + index + " = (" + vertex.join(", ") + ")</option>"
    ).join("");

    els.content.innerHTML =
      '<section class="lab-hero no-term">' +
      '<span class="hero-eyebrow">交互实验 · ' + escapeHtml(lab.lesson || "独立") + "</span>" +
      "<h1>" + escapeHtml(lab.title) + "</h1>" +
      "<p>" + escapeHtml(lab.subtitle) + "</p>" +
      '<div class="lab-hero-meta">' +
      (lesson ? '<a href="' + courseRoute(lesson.id) + '">← ' + escapeHtml(lesson.id + " " + lesson.title) + "</a>" : "") +
      docs + '<a href="' + labRoute() + '">全部实验</a></div></section>' +
      '<section class="lab-section no-term"><h2>核心公式</h2>' +
      '<div class="lab-formula">$$' + lab.formula + '$$</div>' +
      '<p class="lab-hint">列向量从右向左依次经过 M、V、P。顶点着色器输出 <code>gl_Position</code>，透视除法由 GPU 固定管线完成。</p></section>' +
      '<section class="lab-section no-term"><h2>交互画布</h2>' +
      '<div class="lab-layout">' +
      '<div class="lab-panel lab-controls">' +
      '<div class="lab-panel-head"><strong>参数</strong><button type="button" class="lab-reset" id="labReset">重置</button></div>' +
      labControlRow("平移 X", "tx", -2, 2, 0.1) +
      labControlRow("平移 Y", "ty", -2, 2, 0.1) +
      labControlRow("平移 Z", "tz", -2, 2, 0.1) +
      labControlRow("旋转 Y", "ry", -180, 180, 5) +
      labControlRow("缩放", "scale", 0.4, 1.8, 0.05) +
      labControlRow("相机距离", "distance", 2.5, 10, 0.1) +
      labControlRow("视场角 FOV", "fov", 20, 110, 1) +
      '<label class="lab-control lab-select"><span>投影方式</span><select data-param="projection">' +
      '<option value="perspective">透视投影</option><option value="orthographic">正交投影</option></select></label>' +
      '<label class="lab-control lab-select"><span>追踪顶点</span><select data-param="vertex">' + vertexOptions + "</select></label>" +
      '<div class="lab-clip-state" id="labClipState">视锥内 · 全部顶点可见</div></div>' +
      '<div class="lab-panel lab-view">' +
      '<canvas class="lab-canvas" id="labCanvas" width="640" height="440" aria-label="MVP 变换后的线框立方体"></canvas>' +
      '<div class="lab-canvas-legend"><span><i class="lab-dot axis-x"></i>X 轴</span>' +
      "<span><i class=\"lab-dot axis-y\"></i>Y 轴</span><span><i class=\"lab-dot axis-z\"></i>Z 轴</span>" +
      "<span>虚线 = 视锥外（被裁切）</span></div></div></div></section>" +
      '<section class="lab-section no-term"><h2>逐阶段看一个顶点</h2>' +
      '<p class="lab-hint">切换“追踪顶点”或点击画布中的顶点，观察同一个点如何变成屏幕像素。</p>' +
      '<div class="lab-stage-grid">' + stages + "</div></section>" +
      '<section class="lab-section no-term"><h2>实时矩阵</h2>' +
      '<div class="lab-matrix-grid">' +
      '<div class="lab-matrix"><h3>M · 模型</h3><pre id="matM"></pre><small>把顶点从模型空间搬到世界空间</small></div>' +
      '<div class="lab-matrix"><h3>V · 观察</h3><pre id="matV"></pre><small>把世界搬到相机坐标系</small></div>' +
      '<div class="lab-matrix"><h3>P · 投影</h3><pre id="matP"></pre><small>决定透视感与视锥范围</small></div>' +
      '<div class="lab-matrix"><h3>PVM · 合成</h3><pre id="matPVM"></pre><small>着色器里一次性乘完的矩阵</small></div>' +
      "</div></section>" +
      labFooterHtml(lab) +
      '<section class="lab-section no-term"><h2>对应着色器代码</h2><pre><code class="language-glsl">' +
      escapeHtml(lab.code || "") + "</code></pre></section>" +
      '<section class="lab-section no-term"><h2>关键术语</h2><div class="lesson-terms">' + terms + "</div>" +
      '<p class="lab-note-text">' + icon("info") + " " + escapeHtml(lab.note || "") + "</p></section>";

    renderMath(els.content);
    enhanceCode(els.content, renderToken);
    buildToc(els.content);
    window.scrollTo({ top: 0, behavior: "auto" });
    updateProgress();

    const canvas = $("labCanvas");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    const params = Object.assign({}, LAB_DEFAULTS);
    const inputs = Array.from(els.content.querySelectorAll("[data-param]"));
    const stageValues = Array.from(els.content.querySelectorAll("[data-stage-value]"));
    const matrixNodes = { M: $("matM"), V: $("matV"), P: $("matP"), PVM: $("matPVM") };
    let clippedCount = 0;

    function cssColor(name, fallback) {
      const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return value || fallback;
    }

    function compute() {
      const near = 0.1;
      const far = 100;
      const aspect = canvas.width / canvas.height;
      const M = matMul(matMul(matTranslate(params.tx, params.ty, params.tz), matRotateY(params.ry)), matScale(params.scale));
      const V = matTranslate(0, 0, -params.distance);
      const P = params.projection === "orthographic"
        ? matOrthographic(aspect, near, far)
        : matPerspective(params.fov, aspect, near, far);
      const VM = matMul(V, M);
      return { M: M, V: V, P: P, VM: VM, PVM: matMul(P, VM), near: near };
    }

    function toScreen(ndc) {
      return [(ndc[0] * 0.5 + 0.5) * canvas.width, (1 - (ndc[1] * 0.5 + 0.5)) * canvas.height];
    }

    function draw() {
      const state = compute();
      const border = cssColor("--border-strong", "#d0d7de");
      const accent = cssColor("--accent", "#3b5bdb");
      const muted = cssColor("--text-subtle", "#8c959f");
      const bg = cssColor("--bg", "#ffffff");
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 5]);
      ctx.strokeRect(8, 8, W - 16, H - 16);
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.35;
      for (let i = 1; i < 8; i++) {
        const x = (W * i) / 8;
        ctx.beginPath(); ctx.moveTo(x, 8); ctx.lineTo(x, H - 8); ctx.stroke();
      }
      for (let i = 1; i < 6; i++) {
        const y = (H * i) / 6;
        ctx.beginPath(); ctx.moveTo(8, y); ctx.lineTo(W - 8, y); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      const model = CUBE_VERTICES.map((v) => applyMat(state.M, [v[0], v[1], v[2], 1]));
      const view = model.map((v) => applyMat(state.V, v));
      const clip = view.map((v) => applyMat(state.P, v));

      ctx.strokeStyle = muted;
      ctx.globalAlpha = 0.28;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      CUBE_EDGES.forEach((edge) => {
        const a = clip[edge[0]];
        const b = clip[edge[1]];
        if (a[3] <= 0 || b[3] <= 0) return;
        const p0 = toScreen([a[0] / a[3], a[1] / a[3]]);
        const p1 = toScreen([b[0] / b[3], b[1] / b[3]]);
        ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      const originClip = applyMat(state.P, applyMat(state.V, [0, 0, 0, 1]));
      if (originClip[3] > 0) {
        const origin = toScreen([originClip[0] / originClip[3], originClip[1] / originClip[3]]);
        const axes = [
          { end: [1, 0, 0], color: "#e5534b", label: "X" },
          { end: [0, 1, 0], color: "#2da44e", label: "Y" },
          { end: [0, 0, 1], color: "#4c6ef5", label: "Z" },
        ];
        axes.forEach((axis) => {
          const c = applyMat(state.P, applyMat(state.V, [axis.end[0], axis.end[1], axis.end[2], 1]));
          if (c[3] <= 0) return;
          const end = toScreen([c[0] / c[3], c[1] / c[3]]);
          ctx.strokeStyle = axis.color;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.75;
          ctx.beginPath(); ctx.moveTo(origin[0], origin[1]); ctx.lineTo(end[0], end[1]); ctx.stroke();
          ctx.fillStyle = axis.color;
          ctx.font = "600 11px system-ui, sans-serif";
          ctx.fillText(axis.label, end[0] + 4, end[1] - 4);
          ctx.globalAlpha = 1;
        });
      }

      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      CUBE_EDGES.forEach((edge) => {
        const segment = clipSegment(clip[edge[0]], clip[edge[1]], state.near);
        if (!segment) return;
        const p0 = toScreen([segment[0][0] / segment[0][3], segment[0][1] / segment[0][3]]);
        const p1 = toScreen([segment[1][0] / segment[1][3], segment[1][1] / segment[1][3]]);
        ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
      });

      clippedCount = 0;
      clip.forEach((c, index) => {
        const outside = c[3] <= state.near ||
          Math.abs(c[0]) > c[3] || Math.abs(c[1]) > c[3] || Math.abs(c[2]) > c[3];
        if (outside) clippedCount++;
        if (c[3] <= 0) return;
        const point = toScreen([c[0] / c[3], c[1] / c[3]]);
        const active = index === params.vertex;
        ctx.beginPath();
        ctx.arc(point[0], point[1], active ? 6 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = outside ? muted : accent;
        ctx.globalAlpha = outside ? 0.45 : 1;
        ctx.fill();
        ctx.globalAlpha = 1;
        if (active) {
          ctx.strokeStyle = bg;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = accent;
          ctx.font = "600 12px system-ui, sans-serif";
          ctx.fillText("v" + index, point[0] + 9, point[1] - 7);
        }
      });

      const chosen = CUBE_VERTICES[params.vertex];
      const viewV = applyMat(state.VM, [chosen[0], chosen[1], chosen[2], 1]);
      const clipV = applyMat(state.P, viewV);
      const ndc = clipV.map((n) => n / clipV[3]);
      const screen = toScreen([ndc[0], ndc[1]]);
      const values = [
        "(" + chosen.join(", ") + ", 1)",
        fmtVec(model[params.vertex]),
        fmtVec(view[params.vertex]),
        fmtVec(clipV),
        fmtVec(ndc),
        "(" + screen[0].toFixed(1) + ", " + screen[1].toFixed(1) + ") px",
      ];
      stageValues.forEach((node, index) => { node.textContent = values[index] || "—"; });
      Object.keys(matrixNodes).forEach((key) => {
        if (matrixNodes[key]) matrixNodes[key].textContent = matrixText(state[key]);
      });

      const clipState = $("labClipState");
      if (clipState) {
        clipState.textContent = clippedCount
          ? "视锥外 · " + clippedCount + " 个顶点被裁切"
          : "视锥内 · 全部顶点可见";
        clipState.classList.toggle("clipped", clippedCount > 0);
      }
    }

    inputs.forEach((input) => {
      const key = input.dataset.param;
      const output = els.content.querySelector('[data-out="' + key + '"]');
      const sync = () => {
        params[key] = key === "vertex" ? parseInt(input.value, 10)
          : input.tagName === "SELECT" ? input.value : parseFloat(input.value);
        if (output) output.textContent = labParamText(key, params[key]);
      };
      input.addEventListener("input", () => { sync(); draw(); });
      input.addEventListener("change", () => { sync(); draw(); });
      sync();
    });

    const reset = $("labReset");
    if (reset) {
      reset.addEventListener("click", () => {
        inputs.forEach((input) => { input.value = LAB_DEFAULTS[input.dataset.param]; });
        inputs.forEach((input) => input.dispatchEvent(new Event("input", { bubbles: true })));
        draw();
      });
    }

    canvas.addEventListener("click", (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
      const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
      const state = compute();
      const clip = CUBE_VERTICES.map((v) =>
        applyMat(state.P, applyMat(state.V, applyMat(state.M, [v[0], v[1], v[2], 1])))
      );
      let best = -1;
      let bestDistance = 20 * 20;
      clip.forEach((c, index) => {
        if (c[3] <= 0) return;
        const point = toScreen([c[0] / c[3], c[1] / c[3]]);
        const distance = (point[0] - x) ** 2 + (point[1] - y) ** 2;
        if (distance < bestDistance) { bestDistance = distance; best = index; }
      });
      if (best < 0) return;
      params.vertex = best;
      const select = els.content.querySelector('[data-param="vertex"]');
      if (select) select.value = String(best);
      draw();
    });

    wireLabFooter(lab);

    labRedraw = draw;
    labDispose = () => { labRedraw = null; };
    draw();
  }

  /* ---------- procedural geometry lab: lathe / revolution surface ---------- */

  const LATHE_PRESETS = [
    { id: "cylinder", label: "圆柱", points: [[1, -1], [1, 1]] },
    { id: "vase", label: "花瓶", points: [[0.45, -1], [0.95, -0.6], [0.6, -0.1], [0.85, 0.45], [0.45, 1]] },
    { id: "sphere", label: "球冠", points: [[0, -1], [0.71, -0.71], [1, 0], [0.71, 0.71], [0, 1]] },
    { id: "hyperboloid", label: "双曲面", points: [[0.9, -1], [0.55, -0.4], [0.55, 0.4], [0.9, 1]] },
  ];
  const LATHE_DEFAULTS = {
    preset: "vase", radial: 24, profileSeg: 4, radius: 1, rotY: 25, distance: 5.5,
  };

  function latheProfile(preset, profileSeg) {
    const points = preset.points;
    const ring = [];
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      for (let s = 0; s < profileSeg; s++) {
        const t = s / profileSeg;
        ring.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    ring.push(points[points.length - 1].slice());
    return ring;
  }

  function renderLatheLab(lab) {
    if (labDispose) { labDispose(); labDispose = null; }
    currentId = null;
    renderToken++;
    document.title = lab.title + " · 图形实验室";
    els.breadcrumb.innerHTML =
      '<span>图形实验室</span><span class="crumb-sep">/</span>' +
      '<span class="crumb-current">' + escapeHtml(lab.title) + "</span>";
    els.tocNav.innerHTML = "";

    const lesson = LESSON_MAP.get(lab.lesson);
    const docs = (lab.docs || [])
      .map((id) => {
        const doc = docMap.get(id);
        return doc ? '<a href="' + routeFor(id) + '">' + escapeHtml(shortTitle(doc.title)) + "</a>" : "";
      })
      .join("");
    const terms = (lab.terms || [])
      .map((name) => '<a class="term-chip" href="' + glossaryRoute(name) + '">' + escapeHtml(name) + "</a>")
      .join("");
    const stages = (lab.stages || [])
      .map((stage, index) =>
        '<div class="lab-stage">' +
        '<span class="lab-stage-index">' + (index + 1) + "</span>" +
        "<strong>" + escapeHtml(stage.name) + "</strong>" +
        "<small>" + escapeHtml(stage.desc) + "</small>" +
        '<code data-stage-value="' + index + '">—</code></div>'
      )
      .join("");
    const presetOptions = LATHE_PRESETS.map((p) =>
      '<option value="' + p.id + '"' + (p.id === LATHE_DEFAULTS.preset ? " selected" : "") + ">" + p.label + "</option>"
    ).join("");

    els.content.innerHTML =
      '<section class="lab-hero no-term">' +
      '<span class="hero-eyebrow">交互实验 · 任务二 阶段 1</span>' +
      "<h1>" + escapeHtml(lab.title) + "</h1>" +
      "<p>" + escapeHtml(lab.subtitle) + "</p>" +
      '<div class="lab-hero-meta">' +
      (lesson ? '<a href="' + courseRoute(lesson.id) + '">← ' + escapeHtml(lesson.id + " " + lesson.title) + "</a>" : "") +
      '<a href="' + labRoute() + '">← 全部实验</a>' + docs +
      '<a href="#/course">教材模式</a></div></section>' +
      '<section class="lab-section no-term"><h2>核心公式</h2>' +
      '<div class="lab-formula">$$' + lab.formula + '$$</div>' +
      '<p class="lab-hint">轮廓上的点 (r, y) 绕 Y 轴旋转 θ 得到三维点。沿轮廓采样 M 段、绕轴采样 N 段，得到 M×N 个顶点；相邻环之间连出两组三角形，写入索引缓冲。</p></section>' +
      '<section class="lab-section no-term"><h2>交互画布</h2>' +
      '<div class="lab-layout">' +
      '<div class="lab-panel lab-controls">' +
      '<div class="lab-panel-head"><strong>参数</strong><button type="button" class="lab-reset" id="labReset">重置</button></div>' +
      '<label class="lab-control lab-select"><span>轮廓预设</span><select data-param="preset">' + presetOptions + "</select></label>" +
      '<label class="lab-control"><span>径向分段 N<output data-out="radial"></output></span>' +
      '<input type="range" data-param="radial" min="6" max="48" step="1" value="' + LATHE_DEFAULTS.radial + '" /></label>' +
      '<label class="lab-control"><span>轮廓采样/段<output data-out="profileSeg"></output></span>' +
      '<input type="range" data-param="profileSeg" min="1" max="10" step="1" value="' + LATHE_DEFAULTS.profileSeg + '" /></label>' +
      '<label class="lab-control"><span>半径缩放<output data-out="radius"></output></span>' +
      '<input type="range" data-param="radius" min="0.4" max="1.6" step="0.05" value="' + LATHE_DEFAULTS.radius + '" /></label>' +
      '<label class="lab-control"><span>旋转 Y<output data-out="rotY"></output></span>' +
      '<input type="range" data-param="rotY" min="-180" max="180" step="5" value="' + LATHE_DEFAULTS.rotY + '" /></label>' +
      '<label class="lab-control"><span>相机距离<output data-out="distance"></output></span>' +
      '<input type="range" data-param="distance" min="3" max="12" step="0.1" value="' + LATHE_DEFAULTS.distance + '" /></label>' +
      '<div class="lab-clip-state" id="labGeoStats">—</div></div>' +
      '<div class="lab-panel lab-view">' +
      '<canvas class="lab-canvas" id="labCanvas" width="640" height="440" aria-label="程序化生成的旋转曲面线框"></canvas>' +
      '<div class="lab-canvas-legend"><span><i class="lab-dot axis-x"></i>轮廓母线 (r, y)</span>' +
      '<span><i class="lab-dot axis-y"></i>纬线环</span><span><i class="lab-dot axis-z"></i>经线</span>' +
      "<span>左下角小图 = 原始轮廓</span></div></div></div></section>" +
      '<section class="lab-section no-term"><h2>逐阶段看网格如何生成</h2>' +
      '<p class="lab-hint">同一个函数，参数一变，顶点和索引立刻重算——这就是「数学驱动的几何生成」。</p>' +
      '<div class="lab-stage-grid">' + stages + "</div></section>" +
      '<section class="lab-section no-term"><h2>实时生成数据</h2>' +
      '<div class="lab-matrix-grid">' +
      '<div class="lab-matrix"><h3>轮廓采样 M</h3><pre id="geoM"></pre><small>沿母线的采样点数</small></div>' +
      '<div class="lab-matrix"><h3>径向分段 N</h3><pre id="geoN"></pre><small>绕 Y 轴的复制份数</small></div>' +
      '<div class="lab-matrix"><h3>顶点数</h3><pre id="geoV"></pre><small>M × N，写入顶点缓冲</small></div>' +
      '<div class="lab-matrix"><h3>三角形 / 索引</h3><pre id="geoT"></pre><small>相邻环之间连成的面与索引数</small></div>' +
      "</div></section>" +
      labFooterHtml(lab) +
      '<section class="lab-section no-term"><h2>对应生成代码</h2><pre><code class="language-javascript">' +
      escapeHtml(lab.code || "") + "</code></pre></section>" +
      '<section class="lab-section no-term"><h2>关键术语</h2><div class="lesson-terms">' + terms + "</div>" +
      '<p class="lab-note-text">' + icon("info") + " " + escapeHtml(lab.note || "") + "</p></section>";

    renderMath(els.content);
    enhanceCode(els.content, renderToken);
    buildToc(els.content);
    window.scrollTo({ top: 0, behavior: "auto" });
    updateProgress();

    const canvas = $("labCanvas");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    const params = Object.assign({}, LATHE_DEFAULTS);
    const inputs = Array.from(els.content.querySelectorAll("[data-param]"));
    const stageValues = Array.from(els.content.querySelectorAll("[data-stage-value]"));

    function cssColor(name, fallback) {
      const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return value || fallback;
    }

    function draw() {
      const preset = LATHE_PRESETS.filter((p) => p.id === params.preset)[0] || LATHE_PRESETS[0];
      const ring = latheProfile(preset, params.profileSeg).map((p) => [p[0] * params.radius, p[1]]);
      const M = ring.length;
      const N = params.radial;
      const vertices = [];
      for (let i = 0; i < M; i++) {
        const row = [];
        for (let j = 0; j <= N; j++) {
          const theta = (j / N) * Math.PI * 2;
          row.push([ring[i][0] * Math.cos(theta), ring[i][1], ring[i][0] * Math.sin(theta), 1]);
        }
        vertices.push(row);
      }
      const triangles = (M - 1) * N * 2;
      const indexCount = triangles * 3;

      const border = cssColor("--border-strong", "#d0d7de");
      const accent = cssColor("--accent", "#3b5bdb");
      const muted = cssColor("--text-subtle", "#8c959f");
      const bg = cssColor("--bg", "#ffffff");
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 5]);
      ctx.strokeRect(8, 8, W - 16, H - 16);
      ctx.setLineDash([]);

      const aspect = W / H;
      const P = matPerspective(50, aspect, 0.1, 100);
      const V = matTranslate(0, 0, -params.distance);
      const Mdl = matRotateY(params.rotY);
      const PVM = matMul(P, matMul(V, Mdl));
      const toScreen = (v) => {
        const c = applyMat(PVM, v);
        if (c[3] <= 0.05) return null;
        const ndc = [c[0] / c[3], c[1] / c[3]];
        if (Math.abs(ndc[0]) > 1.3 || Math.abs(ndc[1]) > 1.3) return null;
        return [(ndc[0] * 0.5 + 0.5) * W, (1 - (ndc[1] * 0.5 + 0.5)) * H];
      };

      /* meridian lines (along profile, fixed angle) */
      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      for (let j = 0; j < N; j += 2) {
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < M; i++) {
          const p = toScreen(vertices[i][j]);
          if (!p) { started = false; continue; }
          if (!started) { ctx.moveTo(p[0], p[1]); started = true; }
          else ctx.lineTo(p[0], p[1]);
        }
        ctx.stroke();
      }

      /* latitude rings (fixed profile row, around axis) */
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.4;
      ctx.globalAlpha = 0.85;
      for (let i = 0; i < M; i++) {
        ctx.beginPath();
        let started = false;
        for (let j = 0; j <= N; j++) {
          const p = toScreen(vertices[i][j]);
          if (!p) { started = false; continue; }
          if (!started) { ctx.moveTo(p[0], p[1]); started = true; }
          else ctx.lineTo(p[0], p[1]);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      /* axis */
      const axisA = toScreen([0, -1.6, 0, 1]);
      const axisB = toScreen([0, 1.6, 0, 1]);
      if (axisA && axisB) {
        ctx.strokeStyle = muted;
        ctx.globalAlpha = 0.5;
        ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(axisA[0], axisA[1]); ctx.lineTo(axisB[0], axisB[1]); ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      /* profile inset (bottom-left) */
      const inset = { x: 22, y: H - 118, w: 118, h: 96 };
      ctx.fillStyle = bg;
      ctx.globalAlpha = 0.92;
      ctx.fillRect(inset.x, inset.y, inset.w, inset.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.strokeRect(inset.x, inset.y, inset.w, inset.h);
      const toInset = (r, y) => [
        inset.x + inset.w / 2 + r * (inset.w / 2 - 12) * 0.5,
        inset.y + inset.h / 2 - y * (inset.h / 2 - 12) * 0.5,
      ];
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ring.forEach((p, i) => {
        const q = toInset(p[0], p[1]);
        if (i === 0) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]);
      });
      ctx.stroke();
      const axisX0 = toInset(0, 0);
      const axisX1 = toInset(1.7, 0);
      const axisY0 = toInset(0, -1.2);
      const axisY1 = toInset(0, 1.2);
      ctx.strokeStyle = muted;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(axisX0[0], axisX0[1]); ctx.lineTo(axisX1[0], axisX1[1]); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(axisY0[0], axisY0[1]); ctx.lineTo(axisY1[0], axisY1[1]); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = muted;
      ctx.font = "11px system-ui, sans-serif";
      ctx.fillText("r", axisX1[0] + 3, axisX1[1] + 4);
      ctx.fillText("y", axisY1[0] + 4, axisY1[1]);
      ctx.fillText("轮廓 (r, y)", inset.x + 6, inset.y + 14);

      const values = [
        preset.points.length + " 个",
        M + " 点",
        N + " 份",
        M + " × " + N + " = " + M * N + " 顶点",
        indexCount + " 索引",
        "1 次 · " + triangles + " 三角形",
      ];
      stageValues.forEach((node, index) => { node.textContent = values[index] || "—"; });
      const set = (id, text) => { const n = $(id); if (n) n.textContent = text; };
      set("geoM", String(M));
      set("geoN", String(N));
      set("geoV", String(M * N));
      set("geoT", triangles + " / " + indexCount);
      const stats = $("labGeoStats");
      if (stats) stats.textContent = preset.label + " · " + M + "×" + N + " 网格 · " + triangles + " 三角形";
    }

    inputs.forEach((input) => {
      const key = input.dataset.param;
      const output = els.content.querySelector('[data-out="' + key + '"]');
      const sync = () => {
        params[key] = key === "preset" ? input.value : parseFloat(input.value);
        if (output) {
          if (key === "radial" || key === "profileSeg") output.textContent = " " + params[key];
          else if (key === "rotY") output.textContent = " " + params[key] + "°";
          else if (key === "radius") output.textContent = " " + params[key].toFixed(2) + "×";
          else output.textContent = " " + params[key].toFixed(1);
        }
      };
      input.addEventListener("input", () => { sync(); draw(); });
      input.addEventListener("change", () => { sync(); draw(); });
      sync();
    });

    const reset = $("labReset");
    if (reset) {
      reset.addEventListener("click", () => {
        inputs.forEach((input) => { input.value = LATHE_DEFAULTS[input.dataset.param]; });
        inputs.forEach((input) => input.dispatchEvent(new Event("input", { bubbles: true })));
        draw();
      });
    }

    wireLabFooter(lab);

    labRedraw = draw;
    labDispose = () => { labRedraw = null; };
    draw();
  }

  const PBR_DEFAULTS = {
    lightAzimuth: 35, lightElevation: 45, intensity: 1.0,
    albedo: 0.72, metalness: 0.0, roughness: 0.35,
  };

  function renderPbrLab(lab) {
    if (labDispose) { labDispose(); labDispose = null; }
    currentId = null;
    renderToken++;
    document.title = lab.title + " · 图形实验室";
    els.breadcrumb.innerHTML =
      '<span>图形实验室</span><span class="crumb-sep">/</span>' +
      '<span class="crumb-current">' + escapeHtml(lab.title) + "</span>";
    els.tocNav.innerHTML = "";

    const lesson = LESSON_MAP.get(lab.lesson);
    const docs = (lab.docs || []).map((id) => {
      const doc = docMap.get(id);
      return doc ? '<a href="' + routeFor(id) + '">' + escapeHtml(shortTitle(doc.title)) + "</a>" : "";
    }).join("");
    const terms = (lab.terms || []).map((name) =>
      '<a class="term-chip" href="' + glossaryRoute(name) + '">' + escapeHtml(name) + "</a>"
    ).join("");
    const stages = (lab.stages || []).map((s, i) =>
      '<div class="lab-stage"><span class="lab-stage-index">' + (i + 1) + "</span>" +
      "<strong>" + escapeHtml(s.name) + "</strong><small>" + escapeHtml(s.desc) + "</small>" +
      '<code data-stage-value="' + i + '">—</code></div>'
    ).join("");

    els.content.innerHTML =
      '<section class="lab-hero no-term">' +
      '<span class="hero-eyebrow">交互实验 · 任务二 阶段 3</span>' +
      "<h1>" + escapeHtml(lab.title) + "</h1><p>" + escapeHtml(lab.subtitle) + "</p>" +
      '<div class="lab-hero-meta">' +
      (lesson ? '<a href="' + courseRoute(lesson.id) + '">← ' + escapeHtml(lesson.id + " " + lesson.title) + "</a>" : "") +
      '<a href="' + labRoute() + '">← 全部实验</a>' + docs +
      '<a href="#/course">教材模式</a></div></section>' +
      '<section class="lab-section no-term"><h2>核心公式</h2>' +
      '<div class="lab-formula">$$' + lab.formula + '$$</div>' +
      '<p class="lab-hint">镜面项由 D（法线分布）、G（几何遮蔽）、F（菲涅尔）三项相乘再除以归一化分母得到。下面的数值取自球体中心像素。</p></section>' +
      '<section class="lab-section no-term"><h2>交互画布</h2><div class="lab-layout">' +
      '<div class="lab-panel lab-controls">' +
      '<div class="lab-panel-head"><strong>参数</strong><button type="button" class="lab-reset" id="labReset">重置</button></div>' +
      '<label class="lab-control"><span>光源方位角<output data-out="lightAzimuth"></output></span><input type="range" data-param="lightAzimuth" min="-180" max="180" step="5" value="' + PBR_DEFAULTS.lightAzimuth + '" /></label>' +
      '<label class="lab-control"><span>光源仰角<output data-out="lightElevation"></output></span><input type="range" data-param="lightElevation" min="5" max="90" step="5" value="' + PBR_DEFAULTS.lightElevation + '" /></label>' +
      '<label class="lab-control"><span>光强<output data-out="intensity"></output></span><input type="range" data-param="intensity" min="0.2" max="2" step="0.05" value="' + PBR_DEFAULTS.intensity + '" /></label>' +
      '<label class="lab-control"><span>albedo 反照率<output data-out="albedo"></output></span><input type="range" data-param="albedo" min="0.05" max="1" step="0.01" value="' + PBR_DEFAULTS.albedo + '" /></label>' +
      '<label class="lab-control"><span>metalness 金属度<output data-out="metalness"></output></span><input type="range" data-param="metalness" min="0" max="1" step="0.01" value="' + PBR_DEFAULTS.metalness + '" /></label>' +
      '<label class="lab-control"><span>roughness 粗糙度<output data-out="roughness"></output></span><input type="range" data-param="roughness" min="0.05" max="1" step="0.01" value="' + PBR_DEFAULTS.roughness + '" /></label>' +
      '<div class="lab-clip-state" id="labPbrState">—</div></div>' +
      '<div class="lab-panel lab-view">' +
      '<canvas class="lab-canvas" id="labCanvas" width="640" height="440" aria-label="PBR 着色球"></canvas>' +
      '<div class="lab-canvas-legend"><span>逐像素 Cook-Torrance</span><span>中心十字 = 读数采样点</span><span>教学近似</span></div>' +
      "</div></div></section>" +
      '<section class="lab-section no-term"><h2>D / G / F 如何合成高光</h2>' +
      '<p class="lab-hint">拖动参数，观察每一项的数值如何变化，再回到画面确认高光的形状与亮度。</p>' +
      '<div class="lab-stage-grid">' + stages + "</div></section>" +
      '<section class="lab-section no-term"><h2>中心像素读数</h2><div class="lab-matrix-grid">' +
      '<div class="lab-matrix"><h3>D · GGX</h3><pre id="pbrD"></pre><small>法线分布</small></div>' +
      '<div class="lab-matrix"><h3>G · Smith</h3><pre id="pbrG"></pre><small>几何遮蔽</small></div>' +
      '<div class="lab-matrix"><h3>F · Schlick</h3><pre id="pbrF"></pre><small>菲涅尔</small></div>' +
      '<div class="lab-matrix"><h3>镜面 / 漫反射</h3><pre id="pbrSpec"></pre><small>能量分配</small></div>' +
      "</div></section>" +
      labFooterHtml(lab) +
      '<section class="lab-section no-term"><h2>对应着色器代码</h2><pre><code class="language-glsl">' +
      escapeHtml(lab.code || "") + "</code></pre></section>" +
      '<section class="lab-section no-term"><h2>关键术语</h2><div class="lesson-terms">' + terms + "</div>" +
      '<p class="lab-note-text">' + icon("info") + " " + escapeHtml(lab.note || "") + "</p></section>";

    renderMath(els.content);
    enhanceCode(els.content, renderToken);
    buildToc(els.content);
    window.scrollTo({ top: 0, behavior: "auto" });
    updateProgress();

    const canvas = $("labCanvas");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    const params = Object.assign({}, PBR_DEFAULTS);
    const inputs = Array.from(els.content.querySelectorAll("[data-param]"));
    const stageValues = Array.from(els.content.querySelectorAll("[data-stage-value]"));
    const PI = Math.PI;
    const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

    function cssColor(name, fallback) {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    }
    const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0]/l, v[1]/l, v[2]/l]; };
    const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];

    function cookTorrance(N, L, V, albedo, metallic, roughness) {
      const H = norm([L[0]+V[0], L[1]+V[1], L[2]+V[2]]);
      const NoL = Math.max(dot(N,L), 0), NoV = Math.max(dot(N,V), 1e-4);
      const NoH = Math.max(dot(N,H), 0), VoH = Math.max(dot(V,H), 0);
      const a = roughness * roughness, a2 = a * a;
      const d = NoH*NoH*(a2-1)+1;
      const D = a2 / (PI * d * d);
      const k = (roughness+1)*(roughness+1)/8;
      const G = (NoL/(NoL*(1-k)+k)) * (NoV/(NoV*(1-k)+k));
      const F0 = [0.04+(albedo[0]-0.04)*metallic, 0.04+(albedo[1]-0.04)*metallic, 0.04+(albedo[2]-0.04)*metallic];
      const fres = [0,1,2].map(i => F0[i] + (1-F0[i])*Math.pow(1-VoH, 5));
      const specDen = 4*NoL*NoV + 1e-4;
      const spec = [0,1,2].map(i => D*G*fres[i]/specDen);
      const kd = 1 - metallic;
      const diffuse = [0,1,2].map(i => kd*albedo[i]/PI);
      return { D, G, F: fres[0], spec: spec[0], diffuse: diffuse[0], NoL,
               out: [0,1,2].map(i => (diffuse[i]+spec[i])*NoL) };
    }

    function draw() {
      const W = canvas.width, H = canvas.height;
      const bg = cssColor("--bg", "#ffffff");
      const border = cssColor("--border-strong", "#d0d7de");
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle = border; ctx.lineWidth = 1;
      ctx.setLineDash([4,5]); ctx.strokeRect(8,8,W-16,H-16); ctx.setLineDash([]);

      const az = params.lightAzimuth * PI/180, el = params.lightElevation * PI/180;
      const L = norm([Math.cos(el)*Math.sin(az), Math.sin(el), Math.cos(el)*Math.cos(az)]);
      const V = [0,0,1];
      const albedo = [params.albedo*0.95, params.albedo*0.7, params.albedo*0.5]; // warm tint for readability
      const cx = W*0.5, cy = H*0.5, R = Math.min(W,H)*0.38;

      // shading via image data over the sphere's bounding box
      const img = ctx.createImageData(W,H);
      const data = img.data;
      for (let py = 0; py < H; py++) {
        for (let px = 0; px < W; px++) {
          const nx = (px-cx)/R, ny = -(py-cy)/R;
          const r2 = nx*nx + ny*ny;
          if (r2 > 1) continue;
          const nz = Math.sqrt(1-r2);
          const N = [nx, ny, nz];
          const c = cookTorrance(N, L, V, albedo, params.metalness, params.roughness);
          const mapped = [0,1,2].map(i => {
            const lin = c.out[i] * params.intensity;
            return Math.round(clamp(Math.pow(lin, 1/2.2), 0, 1) * 255);
          });
          const idx = (py*W+px)*4;
          data[idx] = mapped[0]; data[idx+1] = mapped[1]; data[idx+2] = mapped[2]; data[idx+3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);

      // sphere rim
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, PI*2);
      ctx.strokeStyle = border; ctx.lineWidth = 1.5; ctx.stroke();

      // light direction indicator (upper-left mini dial)
      const dial = { x: 46, y: 46, r: 26 };
      ctx.beginPath(); ctx.arc(dial.x, dial.y, dial.r, 0, PI*2);
      ctx.fillStyle = bg; ctx.fill(); ctx.strokeStyle = border; ctx.stroke();
      const lx = dial.x + L[0]*dial.r, ly = dial.y - L[1]*dial.r;
      ctx.beginPath(); ctx.moveTo(dial.x, dial.y); ctx.lineTo(lx, ly);
      ctx.strokeStyle = cssColor("--accent", "#3b5bdb"); ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(lx, ly, 4, 0, PI*2); ctx.fillStyle = cssColor("--accent", "#3b5bdb"); ctx.fill();

      // center sample crosshair
      ctx.strokeStyle = cssColor("--text-subtle", "#8c959f"); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx-8,cy); ctx.lineTo(cx+8,cy); ctx.moveTo(cx,cy-8); ctx.lineTo(cx,cy+8); ctx.stroke();

      // center-pixel readouts (N = view direction at sphere center)
      const mid = cookTorrance([0,0,1], L, V, albedo, params.metalness, params.roughness);
      const set = (id, txt) => { const el = $(id); if (el) el.textContent = txt; };
      set("pbrD", mid.D.toFixed(3));
      set("pbrG", mid.G.toFixed(3));
      set("pbrF", mid.F.toFixed(3));
      set("pbrSpec", mid.spec.toFixed(3) + " / " + mid.diffuse.toFixed(3));
      if (stageValues.length >= 6) {
        stageValues[0].textContent = "m=" + params.metalness.toFixed(2);
        stageValues[1].textContent = "kd=" + (1-params.metalness).toFixed(2);
        stageValues[2].textContent = "D=" + mid.D.toFixed(2);
        stageValues[3].textContent = "F=" + mid.F.toFixed(2);
        stageValues[4].textContent = "G=" + mid.G.toFixed(2);
        stageValues[5].textContent = "γ 2.2";
      }
      const state = $("labPbrState");
      if (state) state.textContent = "albedo " + params.albedo.toFixed(2) + " · metal " + params.metalness.toFixed(2) + " · rough " + params.roughness.toFixed(2);
    }

    inputs.forEach((input) => {
      const key = input.dataset.param;
      const output = els.content.querySelector('[data-out="' + key + '"]');
      const sync = () => {
        params[key] = key === "lightAzimuth" || key === "lightElevation" ? parseFloat(input.value) : parseFloat(input.value);
        if (output) {
          if (key === "lightAzimuth" || key === "lightElevation") output.textContent = " " + params[key] + "°";
          else output.textContent = " " + params[key].toFixed(2);
        }
      };
      input.addEventListener("input", () => { sync(); draw(); });
      input.addEventListener("change", () => { sync(); draw(); });
      sync();
    });

    const reset = $("labReset");
    if (reset) {
      reset.addEventListener("click", () => {
        inputs.forEach((input) => { input.value = PBR_DEFAULTS[input.dataset.param]; input.dispatchEvent(new Event("input", { bubbles: true })); });
        draw();
      });
    }

    wireLabFooter(lab);
    labRedraw = draw;
    labDispose = () => { labRedraw = null; };
    draw();
  }

  /* ---------------- sidebar ---------------- */

  function buildSidebar() {
    els.sidebarNav.innerHTML = DATA.sections
      .map((section) => {
        const links = section.items
          .map((id) => {
            const doc = docMap.get(id);
            if (!doc) return "";
            const label = shortTitle(doc.title);
            return (
              '<a class="nav-link" href="' + routeFor(id) + '" data-doc="' + escapeHtml(id) +
              '" title="' + escapeHtml(doc.title) + '">' + escapeHtml(label) + "</a>"
            );
          })
          .join("");
        return (
          '<div class="nav-section" data-key="' + escapeHtml(section.key) + '">' +
          '<button class="nav-section-title" type="button">' +
          icon(SECTION_ICONS[String(section.key).split("/")[0]]) +
          "<span>" + escapeHtml(section.label) + "</span></button>" +
          '<div class="nav-links">' + links + "</div>" +
          "</div>"
        );
      })
      .join("");

    els.sidebarNav.querySelectorAll(".nav-section-title").forEach((button) => {
      button.addEventListener("click", () => {
        button.parentElement.classList.toggle("collapsed");
      });
    });

    const archive = els.sidebarNav.querySelector('.nav-section[data-key="archive"]');
    if (archive) archive.classList.add("collapsed");

    els.sidebarNav.addEventListener("click", (event) => {
      if (event.target.closest(".nav-link")) closeSidebar();
    });
  }

  function updateActiveNav() {
    els.sidebarNav.querySelectorAll(".nav-link").forEach((link) => {
      const active = link.dataset.doc === currentId;
      link.classList.toggle("active", active);
      if (active) link.scrollIntoView({ block: "nearest" });
    });
  }

  function openSidebar() {
    els.sidebar.classList.add("open");
    els.overlay.hidden = false;
  }

  function closeSidebar() {
    els.sidebar.classList.remove("open");
    els.overlay.hidden = true;
  }

  /* ---------------- content rendering ---------------- */

  function assignHeadingIds(root) {
    const used = new Map();
    root.querySelectorAll("h1, h2, h3, h4").forEach((heading) => {
      const base = slugify(heading.textContent) || "section";
      const count = used.get(base) || 0;
      used.set(base, count + 1);
      heading.id = count ? base + "-" + count : base;
    });
  }

  function wrapTables(root) {
    root.querySelectorAll("table").forEach((table) => {
      const wrapper = document.createElement("div");
      wrapper.className = "table-wrap";
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  // marked treats "\\" as an escaped backslash and "&" as an HTML entity, which
  // silently destroys LaTeX matrix row breaks (\\) and column separators (&).
  // Protect every math span with an opaque placeholder before parsing, then
  // restore it verbatim so KaTeX receives the exact source bytes.
  function protectMath(text) {
    const store = [];
    const re = /\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$[^$\n]*?\$/g;
    const out = text.replace(re, function (match) {
      const token = "RNMATHPLH" + store.length + "END";
      store.push(match);
      return token;
    });
    return { text: out, store: store };
  }

  function restoreMath(html, store) {
    let out = html;
    for (let i = 0; i < store.length; i++) {
      out = out.split("RNMATHPLH" + i + "END").join(store[i]);
    }
    return out;
  }

  function renderMath(root) {
    if (typeof window.renderMathInElement !== "function") return;
    try {
      window.renderMathInElement(root, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\[", right: "\\]", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false },
        ],
        ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option"],
        throwOnError: false,
        strict: false,
      });
    } catch (err) {
      console.warn("Math render skipped:", err);
    }
  }

  function rewriteLinks(root, doc) {
    root.querySelectorAll("a[href]").forEach((anchor) => {
      const href = anchor.getAttribute("href");
      if (!href) return;

      if (/^(https?:|mailto:)/i.test(href)) {
        anchor.target = "_blank";
        anchor.rel = "noopener";
        return;
      }
      if (href.startsWith("#/")) return;
      if (href.startsWith("#")) {
        const target = safeDecode(href.slice(1));
        anchor.addEventListener("click", (event) => {
          event.preventDefault();
          scrollToHeading(target, true);
        });
        return;
      }

      const targetId = resolveDocPath(doc.path, href);
      if (!targetId) {
        const clean = href.replace(/^\.\//, "");
        if (DATA.repo && clean && !/^(data:|javascript:|tel:)/i.test(clean)) {
          anchor.setAttribute(
            "href",
            DATA.repo.replace(/\/$/, "") + "/blob/master/" + encodeURI(clean.split("#")[0])
          );
          anchor.target = "_blank";
          anchor.rel = "noopener";
        }
        return;
      }
      const hashIndex = href.indexOf("#");
      const anchorId = hashIndex >= 0 ? safeDecode(href.slice(hashIndex + 1)) : "";
      const targetDoc = docMap.get(targetId);
      if (!targetDoc) {
        anchor.classList.add("broken-link");
        anchor.title = "未找到文档：" + targetId;
        return;
      }
      anchor.setAttribute("href", routeFor(targetId, anchorId));
    });
  }

  function copyText(text, button) {
    const done = () => {
      button.textContent = "已复制";
      setTimeout(() => (button.textContent = "复制"), 1600);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, button, done));
    } else {
      fallbackCopy(text, button, done);
    }
  }

  function fallbackCopy(text, button, done) {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand("copy");
      done();
    } catch (err) {
      button.textContent = "请手动复制";
      setTimeout(() => (button.textContent = "复制"), 1600);
    }
    document.body.removeChild(area);
  }

  /* ---------------- diagram lightbox (zoom / pan) ---------------- */
  let lightbox = { scale: 1, tx: 0, ty: 0, naturalW: 0, naturalH: 0, dragging: false, lastX: 0, lastY: 0 };

  function applyLightboxTransform() {
    els.lightboxCanvas.style.transform =
      "translate(" + lightbox.tx + "px," + lightbox.ty + "px) scale(" + lightbox.scale + ")";
    els.lightboxScale.textContent = Math.round(lightbox.scale * 100) + "%";
  }

  function lightboxFit() {
    if (!lightbox.naturalW || !lightbox.naturalH) return;
    const stage = els.lightboxStage.getBoundingClientRect();
    const s = Math.min(
      (stage.width - 48) / lightbox.naturalW,
      (stage.height - 48) / lightbox.naturalH
    );
    lightbox.scale = Math.max(0.05, Math.min(s, 8));
    lightbox.tx = (stage.width - lightbox.naturalW * lightbox.scale) / 2;
    lightbox.ty = (stage.height - lightbox.naturalH * lightbox.scale) / 2;
    applyLightboxTransform();
  }

  function openDiagramLightbox(svg, caption) {
    if (!els.diagramLightbox) return;
    const clone = svg.cloneNode(true);
    // Keep Mermaid node click handlers inert inside the lightbox (they are for the page graph).
    clone.querySelectorAll("*").forEach((el) => { el.removeAttribute("onclick"); });
    els.lightboxCanvas.innerHTML = "";
    els.lightboxCanvas.appendChild(clone);
    els.lightboxCaption.textContent = caption || "图示";
    const vb = clone.getAttribute("viewBox");
    let w = parseFloat(clone.getAttribute("width"));
    let h = parseFloat(clone.getAttribute("height"));
    if (vb) {
      const parts = vb.split(/[\s,]+/).map(Number);
      if (parts.length === 4) { w = parts[2]; h = parts[3]; }
    }
    lightbox.naturalW = w && isFinite(w) && w > 0 ? w : 1000;
    lightbox.naturalH = h && isFinite(h) && h > 0 ? h : 600;
    clone.style.width = lightbox.naturalW + "px";
    clone.style.height = "auto";
    els.diagramLightbox.hidden = false;
    // Open at a readable scale (at least 90%) rather than shrinking a wide
    // diagram to fit; the 适应 button still gives a whole-diagram overview.
    const stage = els.lightboxStage.getBoundingClientRect();
    const fitScale = Math.min(
      (stage.width - 48) / lightbox.naturalW,
      (stage.height - 48) / lightbox.naturalH
    );
    lightbox.scale = Math.max(0.05, Math.min(Math.max(fitScale, 0.9), 3));
    // Wide left-to-right diagrams read better starting from the left edge.
    lightbox.tx = lightbox.naturalW * lightbox.scale <= stage.width - 48
      ? (stage.width - lightbox.naturalW * lightbox.scale) / 2
      : 24;
    lightbox.ty = (stage.height - lightbox.naturalH * lightbox.scale) / 2;
    applyLightboxTransform();
  }

  function closeDiagramLightbox() {
    if (!els.diagramLightbox) return;
    els.diagramLightbox.hidden = true;
    els.lightboxCanvas.innerHTML = "";
  }

  function makeMermaidZoomable(holder, caption) {
    if (!els.diagramLightbox || holder.dataset.zoomReady) return;
    holder.dataset.zoomReady = "1";
    const hint = document.createElement("span");
    hint.className = "mermaid-zoom-hint";
    hint.textContent = "点击放大";
    holder.appendChild(hint);
    holder.addEventListener("click", (event) => {
      const svg = holder.querySelector("svg");
      if (!svg) return;
      // Let clicks on graph nodes navigate instead of opening the lightbox.
      const node = event.target.closest && event.target.closest(".node");
      if (node && holder.closest(".graph-mermaid")) return;
      openDiagramLightbox(svg, caption);
    });
  }

  function initDiagramLightbox() {
    if (!els.diagramLightbox) return;
    const zoomBy = (factor) => {
      const stage = els.lightboxStage.getBoundingClientRect();
      const cx = stage.width / 2, cy = stage.height / 2;
      const wx = (cx - lightbox.tx) / lightbox.scale;
      const wy = (cy - lightbox.ty) / lightbox.scale;
      lightbox.scale = Math.max(0.05, Math.min(lightbox.scale * factor, 8));
      lightbox.tx = cx - wx * lightbox.scale;
      lightbox.ty = cy - wy * lightbox.scale;
      applyLightboxTransform();
    };
    els.lightboxZoomIn.addEventListener("click", () => zoomBy(1.25));
    els.lightboxZoomOut.addEventListener("click", () => zoomBy(0.8));
    els.lightboxFit.addEventListener("click", lightboxFit);
    els.lightboxReset.addEventListener("click", () => {
      const stage = els.lightboxStage.getBoundingClientRect();
      lightbox.scale = 1;
      lightbox.tx = (stage.width - lightbox.naturalW) / 2;
      lightbox.ty = (stage.height - lightbox.naturalH) / 2;
      applyLightboxTransform();
    });
    els.lightboxClose.addEventListener("click", closeDiagramLightbox);
    els.diagramLightbox.addEventListener("click", (event) => {
      if (event.target === els.diagramLightbox || event.target === els.lightboxStage) closeDiagramLightbox();
    });
    els.lightboxStage.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();
        zoomBy(event.deltaY < 0 ? 1.12 : 0.89);
      },
      { passive: false }
    );
    els.lightboxStage.addEventListener("mousedown", (event) => {
      if (event.button !== 0) return;
      lightbox.dragging = true;
      lightbox.lastX = event.clientX;
      lightbox.lastY = event.clientY;
      els.lightboxStage.classList.add("dragging");
    });
    window.addEventListener("mousemove", (event) => {
      if (!lightbox.dragging) return;
      lightbox.tx += event.clientX - lightbox.lastX;
      lightbox.ty += event.clientY - lightbox.lastY;
      lightbox.lastX = event.clientX;
      lightbox.lastY = event.clientY;
      applyLightboxTransform();
    });
    window.addEventListener("mouseup", () => {
      lightbox.dragging = false;
      els.lightboxStage.classList.remove("dragging");
    });
  }

  async function enhanceCode(root, token) {
    const blocks = Array.from(root.querySelectorAll("pre > code"));
    const mermaidJobs = [];

    blocks.forEach((code) => {
      const pre = code.parentElement;
      const match = code.className.match(/language-([\w+-]+)/);
      const language = match ? match[1].toLowerCase() : "";

      if (language === "mermaid") {
        const holder = document.createElement("div");
        holder.className = "mermaid-block";
        pre.replaceWith(holder);
        mermaidJobs.push(
          (async () => {
            try {
              if (!window.mermaid) throw new Error("Mermaid 未加载");
              window.mermaid.initialize({
                startOnLoad: false,
                theme: document.documentElement.dataset.theme === "dark" ? "dark" : "default",
                securityLevel: "loose",
                fontFamily: "system-ui, sans-serif",
              });
              const id = "rn-mermaid-" + ++mermaidCounter;
              const result = await window.mermaid.render(id, code.textContent);
              if (token === renderToken) {
                holder.innerHTML = result.svg;
                const prev = holder.previousElementSibling;
                const caption = prev && /^H[1-4]$/.test(prev.tagName) ? prev.textContent.trim() : "知识图示";
                makeMermaidZoomable(holder, caption);
              }
            } catch (err) {
              holder.textContent = code.textContent;
              console.warn("Mermaid render failed:", err);
            }
          })()
        );
        return;
      }

      if (window.hljs) {
        try {
          window.hljs.highlightElement(code);
        } catch (err) {
          /* leave text as-is */
        }
      }

      const button = document.createElement("button");
      button.type = "button";
      button.className = "copy-code";
      button.textContent = "复制";
      button.addEventListener("click", () => copyText(code.textContent, button));
      pre.appendChild(button);
    });

    await Promise.all(mermaidJobs);
  }

  function buildToc(root) {
    const headings = Array.from(root.querySelectorAll("h2, h3, h4"));
    if (!headings.length) {
      els.tocNav.innerHTML = "";
      els.tocFooter.textContent = "";
      return;
    }
    els.tocNav.innerHTML = headings
      .map(
        (heading) =>
          '<a class="toc-link level-' + heading.tagName.charAt(1) + '" href="#' + heading.id +
          '" data-target="' + escapeHtml(heading.id) + '">' + escapeHtml(heading.textContent) + "</a>"
      )
      .join("");
    els.tocNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        scrollToHeading(link.dataset.target, true);
      });
    });
    const doc = docMap.get(currentId);
    els.tocFooter.textContent = doc ? doc.words + " 字 · 约 " + doc.minutes + " 分钟" : "";
    updateActiveTocOnScroll();
  }

  function setActiveToc(id) {
    els.tocNav.querySelectorAll(".toc-link").forEach((link) => {
      link.classList.toggle("active", link.dataset.target === id);
    });
  }

  function updateActiveTocOnScroll() {
    const links = Array.from(els.tocNav.querySelectorAll(".toc-link"));
    if (!links.length) return;
    let active = links[0].dataset.target;
    links.forEach((link) => {
      const heading = document.getElementById(link.dataset.target);
      if (heading && heading.getBoundingClientRect().top <= 110) active = link.dataset.target;
    });
    setActiveToc(active);
  }

  function scrollToHeading(id, updateHash) {
    const heading = document.getElementById(id);
    if (!heading) return;
    const top = heading.getBoundingClientRect().top + window.scrollY - 76;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    setActiveToc(id);
    if (updateHash && currentId) history.replaceState(null, "", routeFor(currentId, id));
  }

  function renderPager(id) {
    const index = order.indexOf(id);
    const previous = index > 0 ? docMap.get(order[index - 1]) : null;
    const next = index < order.length - 1 ? docMap.get(order[index + 1]) : null;
    const pager = document.createElement("nav");
    pager.className = "pager";
    pager.innerHTML =
      (previous
        ? '<a class="pager-item" href="' + routeFor(previous.id) + '"><span>← 上一篇</span><strong>' +
          escapeHtml(previous.title) + "</strong></a>"
        : '<div class="pager-item pager-empty"></div>') +
      (next
        ? '<a class="pager-item next" href="' + routeFor(next.id) + '"><span>下一篇 →</span><strong>' +
          escapeHtml(next.title) + "</strong></a>"
        : '<div class="pager-item pager-empty"></div>');
    els.content.appendChild(pager);
  }

  async function renderDoc(id, anchor, options) {
    const settings = options || {};
    const doc = docMap.get(id);
    if (!doc) {
      renderNotFound(id);
      return;
    }

    const token = ++renderToken;
    currentId = id;
    document.title = doc.title + " · Render_Notes";
    els.breadcrumb.innerHTML =
      "<span>Render_Notes</span><span class=\"crumb-sep\">/</span>" +
      "<span>" + escapeHtml(doc.section) + "</span><span class=\"crumb-sep\">/</span>" +
      "<span class=\"crumb-current\">" + escapeHtml(shortTitle(doc.title)) + "</span>";

    const protected_md = protectMath(doc.markdown);
    let html = window.marked && window.marked.parse ? window.marked.parse(protected_md.text, { gfm: true, breaks: false }) : "";
    html = restoreMath(html, protected_md.store);
    els.content.innerHTML = html;
    assignHeadingIds(els.content);
    wrapTables(els.content);
    renderMath(els.content);
    rewriteLinks(els.content, doc);
    annotateTerms(els.content);

    const meta = document.createElement("div");
    meta.className = "article-meta";
    meta.innerHTML =
      icon(sectionIcon(doc.path)) +
      '<span class="tag">' + escapeHtml(doc.section) + "</span>" +
      "<span>" + doc.words + " 字</span>" +
      "<span>约 " + doc.minutes + " 分钟</span>" +
      "<span>数据生成 " + escapeHtml(DATA.generatedAt) + "</span>";
    els.content.insertBefore(meta, els.content.firstChild);
    buildTermPanel(doc);
    buildCourseStrip(doc);

    await enhanceCode(els.content, token);
    if (token !== renderToken) return;

    buildToc(els.content);
    renderPager(id);
    updateActiveNav();
    updateProgress();

    if (!settings.preserveScroll) {
      if (anchor) {
        requestAnimationFrame(() => scrollToHeading(anchor, false));
      } else {
        window.scrollTo({ top: 0, behavior: "auto" });
        history.replaceState(null, "", routeFor(id));
      }
    }
  }

  function renderNotFound(id) {
    currentId = null;
    renderToken++;
    document.title = "未找到文档 · Render_Notes";
    els.breadcrumb.innerHTML = '<span class="crumb-current">未找到文档</span>';
    els.tocNav.innerHTML = "";
    els.tocFooter.textContent = "";
    els.content.innerHTML =
      '<h1>未找到文档</h1><p>路由 <code>' + escapeHtml(id) + "</code> 没有对应的 Markdown 文件。</p>" +
      '<p><a href="#/home">返回首页</a></p>';
  }

  function card(id, kicker, title, description, foot, iconName) {
    const target = docMap.get(id);
    if (!target) return "";
    return (
      '<a class="home-card" href="' + routeFor(id) + '">' +
      '<span class="card-icon">' + icon(iconName || "info") + "</span>" +
      '<span class="card-kicker">' + escapeHtml(kicker) + "</span>" +
      "<strong>" + escapeHtml(title) + "</strong>" +
      "<p>" + escapeHtml(description) + "</p>" +
      '<span class="card-foot">' + escapeHtml(foot || (target.words + " 字 · 约 " + target.minutes + " 分钟")) + "</span>" +
      "</a>"
    );
  }

  function graphMermaid(view) {
    const byId = {};
    (DATA.graph.nodes || []).forEach((n) => { byId[n.id] = n; });
    const lines = ["graph LR"];
    const classDefs = {
      layer: "layer", lesson: "lesson", lab: "lab", doc: "doc", index: "index"
    };
    (view.nodeIds || []).forEach((id) => {
      const n = byId[id];
      if (!n) return;
      const label = String(n.label).replace(/"/g, "'").replace(/\\n/g, " ");
      lines.push('  ' + id + '["' + label + '"]:::' + (classDefs[n.kind] || "layer"));
    });
    const inView = new Set(view.nodeIds || []);
    (DATA.graph.edges || []).forEach((e) => {
      if (!inView.has(e.from) || !inView.has(e.to)) return;
      const arrow = e.kind === "experiment" ? "==>" : e.kind === "prereq" ? "-->" : "-.->";
      const label = e.label ? '|' + String(e.label).replace(/"/g, "'") + '|' : "";
      lines.push('  ' + e.from + ' ' + arrow + label + ' ' + e.to);
    });
    // Clickable nodes jump to their hash routes (Mermaid securityLevel is "loose").
    (view.nodeIds || []).forEach((id) => {
      const n = byId[id];
      if (n && n.route) lines.push('  click ' + id + ' "' + n.route + '"');
    });
    lines.push("  classDef layer fill:#eef2ff,stroke:#3b5bdb,color:#1f2328;");
    lines.push("  classDef lesson fill:#eefaf2,stroke:#2da44e,color:#1f2328;");
    lines.push("  classDef lab fill:#fff6e8,stroke:#d97706,color:#1f2328;");
    lines.push("  classDef doc fill:#f3f0ff,stroke:#7048e8,color:#1f2328;");
    lines.push("  classDef index fill:#f2f6ff,stroke:#5b7cfa,color:#1f2328;");
    return lines.join("\n");
  }

  function renderGraph(viewId) {
    currentId = null;
    renderToken++;
    document.title = "知识依赖图 · Render_Notes";
    els.breadcrumb.innerHTML =
      '<span>Render_Notes</span><span class="crumb-sep">/</span><span class="crumb-current">知识依赖图</span>';
    const views = DATA.graph.views || [];
    const view = views.filter((v) => v.id === viewId)[0] || views[0];
    if (!view) {
      els.content.innerHTML = '<section class="lab-hero no-term"><h1>知识依赖图</h1><p>暂无图谱数据。</p></section>';
      return;
    }
    const byId = {};
    (DATA.graph.nodes || []).forEach((n) => { byId[n.id] = n; });

    const tabs = views.map((v) =>
      '<a class="graph-tab' + (v.id === view.id ? " active" : "") + '" href="' + graphRoute(v.id) + '">' +
      escapeHtml(v.title) + "</a>"
    ).join("");

    // Always-present HTML fallback list, grouped by layer, works without Mermaid/JS.
    const grouped = {};
    (view.nodeIds || []).forEach((id) => {
      const n = byId[id];
      if (!n) return;
      const key = n.layer == null ? "其他" : "L" + n.layer;
      (grouped[key] = grouped[key] || []).push(n);
    });
    const fallback = Object.keys(grouped).sort().map((key) =>
      '<div class="graph-fallback-group"><h3>' + escapeHtml(key) + "</h3><ul>" +
      grouped[key].map((n) =>
        '<li><a href="' + n.route + '">' + escapeHtml(n.label) + "</a>" +
        (n.summary ? '<span>' + escapeHtml(n.summary) + "</span>" : "") + "</li>"
      ).join("") + "</ul></div>"
    ).join("");

    els.tocNav.innerHTML = views.map((v) =>
      '<a class="toc-link' + (v.id === view.id ? " active" : "") + '" href="' + graphRoute(v.id) + '">' +
      escapeHtml(v.title) + "</a>"
    ).join("");
    els.tocFooter.textContent = (DATA.graph.nodes || []).length + " 个节点 · 点击跳转";

    els.content.innerHTML =
      '<section class="lab-hero no-term">' +
      '<span class="hero-eyebrow">知识依赖图 · 节点可点击</span>' +
      "<h1>知识依赖图</h1>" +
      "<p>知识不是线性目录，而是依赖图。点击任意节点，跳到对应的文档、课时或实验。</p>" +
      '<div class="graph-tabs">' + tabs + "</div></section>" +
      '<section class="lab-section no-term"><h2>' + escapeHtml(view.title) + "</h2>" +
      '<p class="lab-hint">' + escapeHtml(view.desc || "") + "</p>" +
      '<div class="graph-mermaid"><pre><code class="language-mermaid">' + graphMermaid(view) + "</code></pre></div>" +
      "</section>" +
      '<section class="lab-section no-term"><h2>节点清单（离线可用）</h2>' +
      '<p class="lab-hint">图渲染失败时，仍可从这里到达每一个节点。</p>' +
      '<div class="graph-fallback">' + fallback + "</div></section>";

    window.scrollTo({ top: 0, behavior: "auto" });
    enhanceCode(els.content, renderToken);
  }

  function renderTechIndex() {
    currentId = null;
    renderToken++;
    document.title = "技术索引 · Render_Notes";
    els.breadcrumb.innerHTML =
      '<span>Render_Notes</span><span class="crumb-sep">/</span><span class="crumb-current">技术索引</span>';
    const categories = (DATA.techIndex && DATA.techIndex.categories) || [];
    els.tocNav.innerHTML = categories.map((c) =>
      '<a class="toc-link level-2" href="#tech-' + escapeHtml(c.id) + '" data-target="tech-' + escapeHtml(c.id) + '">' +
      escapeHtml(c.label) + "</a>"
    ).join("");
    els.tocNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const target = document.getElementById(link.dataset.target);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    const total = categories.reduce((s, c) => s + c.items.length, 0);
    els.tocFooter.textContent = total + " 个条目 · 按 API / 算法 / 概念 / 主题查阅";

    const sections = categories.map((c) =>
      '<section class="glossary-group no-term" id="tech-' + escapeHtml(c.id) + '">' +
      '<div class="glossary-group-head"><h2>' + escapeHtml(c.label) + "</h2>" +
      "<span>" + c.items.length + " 条</span></div>" +
      '<div class="glossary-grid">' +
      c.items.map((item) =>
        '<a class="tech-item" href="' + item.route + '">' +
        "<strong>" + escapeHtml(item.name) + "</strong>" +
        '<span class="tech-group">' + escapeHtml(item.group) + "</span>" +
        "<p>" + escapeHtml(item.summary) + "</p>" +
        (item.aliases && item.aliases.length ? '<small>别名：' + escapeHtml(item.aliases.join(" / ")) + "</small>" : "") +
        "</a>"
      ).join("") +
      "</div></section>"
    ).join("");

    els.content.innerHTML =
      '<section class="lab-hero no-term">' +
      '<span class="hero-eyebrow">技术索引 · 从术语库自动生成</span>' +
      "<h1>技术索引</h1>" +
      "<p>按 API、算法、概念与工程主题浏览全部技术点；每个条目都链到统一术语解释。</p>" +
      '<label class="tech-filter"><span>过滤条目</span><input type="search" id="techFilter" placeholder="输入名称、别名或关键词" /></label>' +
      "</section>" + sections;

    const filter = $("techFilter");
    if (filter) {
      filter.addEventListener("input", () => {
        const q = filter.value.trim().toLowerCase();
        els.content.querySelectorAll(".tech-item").forEach((card) => {
          card.hidden = !!q && card.textContent.toLowerCase().indexOf(q) < 0;
        });
        els.content.querySelectorAll(".glossary-group").forEach((group) => {
          const anyVisible = Array.from(group.querySelectorAll(".tech-item")).some((c) => !c.hidden);
          group.hidden = !anyVisible;
        });
      });
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function renderHome() {
    currentId = null;
    renderToken++;
    document.title = "Render_Notes · 知识库阅读版";
    els.breadcrumb.innerHTML = '<span class="crumb-current">首页</span>';
    els.tocNav.innerHTML = "";
    els.tocFooter.textContent = "";
    updateActiveNav();

    const topLevel = new Set(
      DATA.sections
        .map((section) => section.key.split("/")[0])
        .filter((key) => key && key !== "archive")
    );
    const chapterCount = topLevel.size;
    const quick = [
      '<a class="home-card" href="' + courseRoute() + '">' +
      '<span class="card-icon">' + icon("book") + "</span>" +
      '<span class="card-kicker">教材模式</span>' +
      "<strong>" + LESSONS.length + " 课按认知顺序学</strong>" +
      "<p>每课明确前置、目标、阅读步骤、术语与自检题，进度自动保存。</p>" +
      '<span class="card-foot">快捷键 C · 从第一课继续</span></a>',
      '<a class="home-card" href="' + labRoute() + '">' +
      '<span class="card-icon">' + icon("target") + "</span>" +
      '<span class="card-kicker">图形实验室</span>' +
      "<strong>调参数，看矩阵真的动起来</strong>" +
      "<p>坐标变换与 MVP 实验：拖滑块改变旋转、缩放、FOV，逐步查看顶点从模型空间到屏幕像素。</p>" +
      '<span class="card-foot">快捷键 L · 离线 Canvas 交互</span></a>',
      '<a class="home-card" href="' + graphRoute() + '">' +
      '<span class="card-icon">' + icon("route") + "</span>" +
      '<span class="card-kicker">知识依赖图</span>' +
      "<strong>知识是图，不是线性目录</strong>" +
      "<p>点击节点查看为什么学、为后续哪些技术打基础；主干路径与图形学交叉路径两张视图。</p>" +
      '<span class="card-foot">快捷键 M · 节点可点击跳转</span></a>',
      '<a class="home-card" href="' + techRoute() + '">' +
      '<span class="card-icon">' + icon("layers") + "</span>" +
      '<span class="card-kicker">技术索引</span>' +
      "<strong>按 API / 算法 / 主题查阅</strong>" +
      "<p>从术语库自动生成的速查入口，每个条目直达统一术语解释。</p>" +
      '<span class="card-foot">快捷键 T · 从术语库生成</span></a>',
      card(
        "00-导航与索引/知识架构总览.md",
        "先看地图",
        "知识架构总览",
        "8 层知识地图、章节依赖、三条学习路线与概念入口。",
        "建议先读 5 分钟",
        "compass"
      ),
      card(
        "00-导航与索引/学习路径指南.md",
        "系统学习",
        "八层递进学习路径",
        "从基础概念到项目实战，每层给出核心问题与阶段检验。",
        "建议从这里开始",
        "route"
      ),
      card(
        "06-面试知识库/车载渲染引擎/00-面试速问速答清单.md",
        "3 天面试冲刺",
        "车载渲染速问速答",
        "高频题 → OpenGL/FBO → Vulkan → 3D → Shader → DrawCall。",
        "按模块逐篇击破",
        "spark"
      ),
      card(
        "00-导航与索引/知识缺口登记表.md",
        "查漏补缺",
        "知识缺口与依赖图",
        "P0/P1 已补齐清单、P2 待办，以及知识点依赖关系图。",
        "含 Mermaid 依赖图",
        "alert"
      ),
      '<a class="home-card" href="' + glossaryRoute() + '">' +
      '<span class="card-icon">' + icon("info") + "</span>" +
      '<span class="card-kicker">术语理解</span>' +
      "<strong>核心术语精讲</strong>" +
      "<p>" + TERMS.length + " 个原理名词，解释“是什么、为什么重要、容易混淆在哪里”。</p>" +
      '<span class="card-foot">正文术语可悬停查看</span></a>',
    ].join("");

    const fundamentals = [
      card("01-基础理论/音视频基础理论.md", "01 基础理论", "音视频基础理论", "YUV/RGB、容器与编码、PTS/DTS、Stride。", null, "wave"),
      card("02-解码与播放链路/解码与播放链路.md", "02 解码与播放", "解码与播放链路", "软硬解、Surface/OES、FBO 特效链、回退状态机。", null, "play"),
      card("03-图形与GPU工程/图形与GPU工程.md", "03 图形与 GPU", "图形与 GPU 工程", "OpenGL ES 管线、Shader、DrawCall、压缩纹理、FBO。", null, "cpu"),
      card("04-跨平台与高性能架构/跨平台与高性能架构.md", "04 工程架构", "跨平台与高性能架构", "零拷贝、RenderGraph、GPU-Native Runtime、WebGPU。", null, "layers"),
    ].join("");

    const sectionRows = DATA.sections
      .map((section) => {
        const links = section.items
          .map((id) => {
            const doc = docMap.get(id);
            if (!doc) return "";
            return '<li><a href="' + routeFor(id) + '">' + escapeHtml(shortTitle(doc.title)) + "</a></li>";
          })
          .join("");
        return (
          '<div class="section-row"><h3>' + escapeHtml(section.label) +
          "<small>" + section.items.length + " 篇</small></h3><ul>" + links + "</ul></div>"
        );
      })
      .join("");

    els.content.innerHTML =
      '<section class="hero">' +
      '<span class="hero-eyebrow">个人系统化知识库 · 阅读版</span>' +
      "<h1>从文件到屏幕，把每一帧讲清楚</h1>" +
      "<p>音视频处理、图形渲染与 GPU 工程的系统化笔记。支持全文搜索、章节目录、公式与代码高亮，所有内容均来自仓库内 Markdown，双击即可离线阅读。</p>" +
      '<div class="stats">' +
      "<div class=\"stat\"><strong>" + DATA.docs.length + "</strong><span>篇文档</span></div>" +
      "<div class=\"stat\"><strong>" + chapterCount + "</strong><span>个主题</span></div>" +
      "<div class=\"stat\"><strong>" + DATA.docs.reduce((sum, doc) => sum + doc.words, 0).toLocaleString("zh-CN") + "</strong><span>字内容</span></div>" +
      "<div class=\"stat\"><strong>" + TERMS.length + "</strong><span>条术语</span></div>" +
      "<div class=\"stat\"><strong>离线</strong><span>本地阅读</span></div>" +
      "</div></section>" +
      '<section class="home-section"><h2>快速入口</h2><div class="card-grid">' + quick + "</div></section>" +
      '<section class="home-section"><h2>核心主线</h2><div class="card-grid">' + fundamentals + "</div></section>" +
      '<section class="home-section"><h2>全部章节</h2><div class="section-list">' + sectionRows + "</div></section>";

    window.scrollTo({ top: 0, behavior: "auto" });
    updateProgress();
  }

  /* ---------------- search ---------------- */

  function highlight(text, query) {
    const safe = escapeHtml(text);
    if (!query) return safe;
    const needle = escapeHtml(query);
    const index = safe.toLowerCase().indexOf(needle.toLowerCase());
    if (index < 0) return safe;
    return safe.slice(0, index) + "<mark>" + safe.slice(index, index + needle.length) + "</mark>" + safe.slice(index + needle.length);
  }

  function searchSnippet(doc, query) {
    const text = doc.plain;
    const index = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
    if (index < 0) return text.slice(0, 90);
    const start = Math.max(0, index - 34);
    return (start ? "…" : "") + text.slice(start, index + query.length + 48) + "…";
  }

  function performSearch(value) {
    const query = value.trim().toLowerCase();
    const items = [];

    if (!query) {
      HOME_IDS.map((id) => docMap.get(id)).filter(Boolean).forEach((doc) => {
        items.push({ kind: "doc", doc: doc, score: 10 });
      });
      TERMS.slice(0, 6).forEach((term) => {
        items.push({ kind: "term", term: term, score: 8 });
      });
    } else {
      DATA.docs.forEach((doc) => {
        const title = doc.title.toLowerCase();
        const plain = doc.plain.toLowerCase();
        let score = 0;
        if (title.indexOf(query) >= 0) score += 12;
        if (doc.section.toLowerCase().indexOf(query) >= 0) score += 3;
        const occurrences = plain.split(query).length - 1;
        if (occurrences > 0) score += Math.min(occurrences, 6);
        if (score > 0) items.push({ kind: "doc", doc: doc, score: score });
      });

      TERMS.forEach((term) => {
        const names = [term.name, ...(term.aliases || [])];
        const haystack = names.concat([term.groupLabel, term.short, term.detail, term.why]).join(" ").toLowerCase();
        let score = 0;
        if (term.name.toLowerCase().indexOf(query) >= 0) score += 14;
        if (names.some((name) => name.toLowerCase().indexOf(query) >= 0)) score += 8;
        if (haystack.indexOf(query) >= 0) score += 4;
        if (score > 0) items.push({ kind: "term", term: term, score: score });
      });

      LESSONS.forEach((lesson) => {
        const haystack = [lesson.id, lesson.title, lesson.short, lesson.question].join(" ").toLowerCase();
        let score = 0;
        if (lesson.title.toLowerCase().indexOf(query) >= 0) score += 11;
        if (haystack.indexOf(query) >= 0) score += 5;
        if (score > 0) items.push({ kind: "lesson", lesson: lesson, score: score });
      });

      LABS.forEach((lab) => {
        const haystack = [lab.id, lab.title, lab.subtitle, (lab.terms || []).join(" ")].join(" ").toLowerCase();
        let score = 0;
        if (lab.title.toLowerCase().indexOf(query) >= 0) score += 12;
        if (haystack.indexOf(query) >= 0) score += 6;
        if (score > 0) items.push({ kind: "lab", lab: lab, score: score });
      });

      (DATA.graph && DATA.graph.nodes ? DATA.graph.nodes : []).forEach((node) => {
        const haystack = [node.label, node.summary].join(" ").toLowerCase();
        if (haystack.indexOf(query) >= 0) {
          items.push({ kind: "node", node: node, score: haystack.indexOf(query) >= 0 ? 7 : 3 });
        }
      });

      (DATA.techIndex && DATA.techIndex.categories ? DATA.techIndex.categories : []).forEach((cat) => {
        cat.items.forEach((item) => {
          const haystack = [item.name, item.group, item.summary, (item.aliases || []).join(" ")].join(" ").toLowerCase();
          if (haystack.indexOf(query) >= 0) {
            items.push({ kind: "tech", tech: item, score: 4 });
          }
        });
      });
    }

    items.sort((a, b) => b.score - a.score);
    searchHits = items.slice(0, 14);
    searchSelected = 0;
    els.searchCount.textContent = searchHits.length + " 条结果";
    if (!searchHits.length) {
      els.searchResults.innerHTML = '<div class="search-empty">没有找到匹配内容，换个关键词试试</div>';
      return;
    }

    els.searchResults.innerHTML = searchHits
      .map((item, index) => {
        let href, section, title, snippet, extraClass;
        if (item.kind === "term") {
          href = glossaryRoute(item.term.name);
          section = "术语 · " + item.term.groupLabel;
          title = item.term.name;
          snippet = item.term.short;
          extraClass = " term-result";
        } else if (item.kind === "lesson") {
          href = courseRoute(item.lesson.id);
          section = "教材 · " + item.lesson.id;
          title = item.lesson.title;
          snippet = item.lesson.short;
          extraClass = " lesson-result";
        } else if (item.kind === "lab") {
          href = labRoute(item.lab.id);
          section = "实验 · " + item.lab.id;
          title = item.lab.title;
          snippet = item.lab.subtitle;
          extraClass = " lab-result";
        } else if (item.kind === "node") {
          href = item.node.route;
          section = "图谱 · " + item.node.kind;
          title = item.node.label;
          snippet = item.node.summary || "";
          extraClass = " node-result";
        } else if (item.kind === "tech") {
          href = item.tech.route;
          section = "索引 · " + item.tech.group;
          title = item.tech.name;
          snippet = item.tech.summary || "";
          extraClass = " tech-result";
        } else {
          href = routeFor(item.doc.id);
          section = item.doc.section;
          title = item.doc.title;
          snippet = searchSnippet(item.doc, query);
          extraClass = "";
        }
        return (
          '<a class="search-result' + (index === 0 ? " selected" : "") + extraClass +
          '" href="' + href + '" data-index="' + index + '">' +
          '<div class="sr-top"><span class="sr-section">' + escapeHtml(section) +
          '</span><span class="sr-title">' + escapeHtml(title) + "</span></div>" +
          '<div class="sr-snippet">' + highlight(snippet, query) + "</div></a>"
        );
      })
      .join("");
  }

  function moveSearchSelection(delta) {
    if (!searchHits.length) return;
    const items = els.searchResults.querySelectorAll(".search-result");
    if (!items.length) return;
    searchSelected = (searchSelected + delta + items.length) % items.length;
    items.forEach((item, index) => item.classList.toggle("selected", index === searchSelected));
    items[searchSelected].scrollIntoView({ block: "nearest" });
  }

  function openSearch() {
    els.searchBackdrop.hidden = false;
    els.searchDialog.hidden = false;
    els.searchInput.value = "";
    performSearch("");
    els.searchInput.focus();
  }

  function closeSearch() {
    els.searchBackdrop.hidden = true;
    els.searchDialog.hidden = true;
  }

  /* ---------------- global events ---------------- */

  function updateProgress() {
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = height > 0 ? Math.min(1, Math.max(0, window.scrollY / height)) : 0;
    els.progress.style.width = (ratio * 100).toFixed(1) + "%";
  }

  function applyTheme(theme, rerender) {
    document.documentElement.dataset.theme = theme;
    els.themeToggle.textContent = theme === "dark" ? "☀" : "◐";
    try {
      localStorage.setItem("rn-theme", theme);
    } catch (err) {
      /* storage may be unavailable on file:// */
    }
    if (labRedraw) labRedraw();
    if (rerender && currentId) {
      const previous = window.scrollY;
      const anchor = parseRoute().anchor;
      renderDoc(currentId, anchor, { preserveScroll: true }).then(() => {
        window.scrollTo({ top: previous, behavior: "auto" });
      });
    }
  }

  function route() {
    closeSidebar();
    hideTermTooltip(true);
    if (labDispose) { labDispose(); labDispose = null; }
    const target = parseRoute();
    if (target.home) renderHome();
    else if (target.course) {
      if (target.lesson) renderLesson(target.lesson);
      else renderCourse();
    } else if (target.glossary) renderGlossary(target.term);
    else if (target.graph) renderGraph(target.viewId);
    else if (target.tech) renderTechIndex();
    else if (target.lab) {
      if (target.labId) renderLab(target.labId);
      else renderLabList();
    } else renderDoc(target.id, target.anchor);
  }

  function init() {
    buildSidebar();
    initDiagramLightbox();
    els.buildStamp.textContent = "数据生成 " + DATA.generatedAt;
    if (DATA.repo) els.repoLink.href = DATA.repo;

    let saved = "light";
    try {
      saved = localStorage.getItem("rn-theme") || "light";
    } catch (err) {
      saved = "light";
    }
    applyTheme(saved === "dark" ? "dark" : "light", false);

    els.menuBtn.addEventListener("click", openSidebar);
    els.overlay.addEventListener("click", closeSidebar);
    els.searchTrigger.addEventListener("click", openSearch);
    els.glossaryTrigger.addEventListener("click", () => {
      location.hash = glossaryRoute();
    });
    els.courseTrigger.addEventListener("click", () => {
      location.hash = courseRoute();
    });
    els.labTrigger.addEventListener("click", () => {
      location.hash = labRoute();
    });
    if (els.graphTrigger) els.graphTrigger.addEventListener("click", () => {
      location.hash = graphRoute();
    });
    if (els.techTrigger) els.techTrigger.addEventListener("click", () => {
      location.hash = techRoute();
    });
    els.searchBackdrop.addEventListener("click", closeSearch);
    els.searchInput.addEventListener("input", (event) => performSearch(event.target.value));
    els.searchResults.addEventListener("click", (event) => {
      if (event.target.closest(".search-result")) closeSearch();
    });
    els.themeToggle.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(next, true);
    });

    els.content.addEventListener("mouseover", (event) => {
      const node = event.target.closest(".term");
      if (node) showTermTooltip(termByName(node.dataset.term), node, false);
    });
    els.content.addEventListener("mouseout", (event) => {
      if (event.target.closest(".term")) hideTermTooltip(false);
    });
    els.content.addEventListener("focusin", (event) => {
      const node = event.target.closest(".term");
      if (node) showTermTooltip(termByName(node.dataset.term), node, false);
    });
    els.content.addEventListener("focusout", (event) => {
      if (event.target.closest(".term")) hideTermTooltip(false);
    });
    els.content.addEventListener("click", (event) => {
      const toggle = event.target.closest("[data-lesson]");
      if (toggle) {
        event.preventDefault();
        toggleLessonDone(toggle.dataset.lesson);
        renderLesson(toggle.dataset.lesson);
        return;
      }
      const node = event.target.closest(".term");
      if (!node) return;
      event.preventDefault();
      if (!els.termTooltip.hidden && els.termTooltip.dataset.pinned === "1") hideTermTooltip(true);
      else showTermTooltip(termByName(node.dataset.term), node, true);
    });
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".term") && !event.target.closest("#termTooltip")) hideTermTooltip(true);
    });

    function plainKeyAllowed(event) {
      if (!els.searchDialog.hidden) return false;
      if (event.ctrlKey || event.metaKey || event.altKey) return false;
      const el = document.activeElement;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/i.test(el.tagName)) return false;
      if (el && el.isContentEditable) return false;
      const sel = window.getSelection && window.getSelection();
      if (sel && String(sel).length > 0) return false;
      return true;
    }

    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
        return;
      }
      const key = event.key.toLowerCase();
      if (plainKeyAllowed(event)) {
        if (key === "g") { event.preventDefault(); location.hash = glossaryRoute(); return; }
        if (key === "c") { event.preventDefault(); location.hash = courseRoute(); return; }
        if (key === "l") { event.preventDefault(); location.hash = labRoute(); return; }
        if (key === "m") { event.preventDefault(); location.hash = graphRoute(); return; }
        if (key === "t") { event.preventDefault(); location.hash = techRoute(); return; }
      }
      if (event.key === "Escape") {
        if (!els.diagramLightbox.hidden) closeDiagramLightbox();
        closeSearch();
        closeSidebar();
        return;
      }
      if (els.searchDialog.hidden) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveSearchSelection(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        moveSearchSelection(-1);
      } else if (event.key === "Enter") {
        event.preventDefault();
        const item = els.searchResults.querySelectorAll(".search-result")[searchSelected];
        if (item) {
          location.hash = item.getAttribute("href");
          closeSearch();
        }
      }
    });

    window.addEventListener("hashchange", route);
    window.addEventListener("scroll", () => {
      if (scrollScheduled) return;
      scrollScheduled = true;
      requestAnimationFrame(() => {
        updateProgress();
        updateActiveTocOnScroll();
        scrollScheduled = false;
      });
    });

    route();
  }

  init();
})();
