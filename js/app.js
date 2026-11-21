require('@uswds/uswds');

// Light/dark theme toggle. Dark is the default; the choice is remembered.
(function () {
  const root = document.documentElement;
  const button = document.querySelector(".theme-toggle");
  if (!button) return;
  const sync = () => {
    const dark = root.getAttribute("data-theme") !== "light";
    button.setAttribute("aria-pressed", String(dark));
  };
  button.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch (e) {}
    sync();
  });
  sync();
  button.hidden = false;
})();

// Sortable tables: <table data-sortable>, with data-sort-type="text|number"
// on each sortable column header and data-sort-value on its cells. Without
// JavaScript the table keeps its built order. Rows with no value sort last;
// ties keep the built order. Header buttons sort on wide screens; a "Sort by"
// select above the table does the same on phones, where the stacked layout
// hides the header row.
(function () {
  document.querySelectorAll("table[data-sortable]").forEach((table, n) => {
    const tbody = table.tBodies[0];
    if (!tbody || !table.tHead) return;
    Array.from(tbody.rows).forEach((r, i) => (r.dataset.sortIndex = i));
    const headers = Array.from(table.tHead.rows[0].cells);
    const sortable = headers.filter((th) => th.dataset.sortType);
    const status = document.createElement("p");
    status.className = "usa-sr-only";
    status.setAttribute("aria-live", "polite");
    table.after(status);

    const label = (th) => (th.dataset.sortLabel || th.firstChild.textContent || "").trim();
    const firstDir = (th) => (th.dataset.sortFirst === "desc" ? "descending" : "ascending");

    // Phone control.
    const wrap = document.createElement("div");
    wrap.className = "aian-sort-select";
    const id = "sort-select-" + n;
    const lab = document.createElement("label");
    lab.className = "usa-label";
    lab.htmlFor = id;
    lab.textContent = "Sort by";
    const select = document.createElement("select");
    select.className = "usa-select";
    select.id = id;
    const add = (value, text) => {
      const o = document.createElement("option");
      o.value = value;
      o.textContent = text;
      select.appendChild(o);
    };
    add("", table.dataset.sortDefaultLabel || "Default order");
    sortable.forEach((th) => {
      const col = headers.indexOf(th);
      const words = th.dataset.sortType === "number"
        ? (th.dataset.sortWords || "high to low|low to high").split("|")
        : (th.dataset.sortWords || "A to Z|Z to A").split("|");
      const f = firstDir(th);
      const other = f === "ascending" ? "descending" : "ascending";
      add(col + ":" + f, label(th) + ", " + words[0]);
      add(col + ":" + other, label(th) + ", " + words[1]);
    });
    wrap.append(lab, select);
    table.before(wrap);

    const apply = (col, dir) => {
      sortable.forEach((h) => h.removeAttribute("aria-sort"));
      let cmp;
      if (col === null) {
        cmp = (a, b) => a.dataset.sortIndex - b.dataset.sortIndex;
        status.textContent = "Sorted by " + select.options[0].textContent + ".";
        select.value = "";
      } else {
        const th = headers[col];
        const type = th.dataset.sortType;
        th.setAttribute("aria-sort", dir);
        const sign = dir === "ascending" ? 1 : -1;
        const value = (r) => {
          const v = (r.cells[col].dataset.sortValue || "").trim();
          return v === "" ? null : type === "number" ? Number(v) : v;
        };
        cmp = (a, b) => {
          const va = value(a), vb = value(b);
          if (va === null || vb === null) {
            if (va !== vb) return va === null ? 1 : -1;
          } else if (va !== vb) {
            const c = type === "number" ? va - vb : String(va).localeCompare(String(vb));
            if (c) return sign * c;
          }
          return a.dataset.sortIndex - b.dataset.sortIndex;
        };
        status.textContent = "Sorted by " + label(th) + ", " + dir + ".";
        select.value = col + ":" + dir;
      }
      Array.from(tbody.rows).sort(cmp).forEach((r) => tbody.appendChild(r));
    };

    select.addEventListener("change", () => {
      if (!select.value) return apply(null);
      const [col, dir] = select.value.split(":");
      apply(Number(col), dir);
    });

    // Header buttons.
    sortable.forEach((th) => {
      const col = headers.indexOf(th);
      th.dataset.sortLabel = label(th);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "aian-sort";
      while (th.firstChild) button.appendChild(th.firstChild);
      const icon = document.createElement("span");
      icon.className = "aian-sort-icon";
      icon.setAttribute("aria-hidden", "true");
      // Arrow right after the column name, before any note under it.
      button.insertBefore(icon, button.firstChild ? button.firstChild.nextSibling : null);
      th.appendChild(button);
      button.addEventListener("click", () => {
        const f = firstDir(th);
        const current = th.getAttribute("aria-sort");
        apply(col, current === f ? (f === "ascending" ? "descending" : "ascending") : f);
      });
    });
  });
})();
