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
// ties keep the built order.
(function () {
  document.querySelectorAll("table[data-sortable]").forEach((table) => {
    const tbody = table.tBodies[0];
    if (!tbody) return;
    const rows = Array.from(tbody.rows);
    rows.forEach((r, i) => (r.dataset.sortIndex = i));
    const headers = Array.from(table.tHead.rows[0].cells);
    const status = document.createElement("p");
    status.className = "usa-sr-only";
    status.setAttribute("aria-live", "polite");
    table.after(status);

    const sortable = headers.filter((th) => th.dataset.sortType);
    sortable.forEach((th) => {
      const col = headers.indexOf(th);
      const type = th.dataset.sortType;
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
        const current = th.getAttribute("aria-sort");
        const first = th.dataset.sortFirst === "desc" ? "descending" : "ascending";
        const dir = current === first ? (first === "ascending" ? "descending" : "ascending") : first;
        sortable.forEach((h) => h.removeAttribute("aria-sort"));
        th.setAttribute("aria-sort", dir);
        const sign = dir === "ascending" ? 1 : -1;
        const value = (r) => {
          const v = (r.cells[col].dataset.sortValue || "").trim();
          return v === "" ? null : type === "number" ? Number(v) : v;
        };
        const sorted = Array.from(tbody.rows).sort((a, b) => {
          const va = value(a), vb = value(b);
          if (va === null || vb === null) {
            if (va !== vb) return va === null ? 1 : -1;
          } else if (va !== vb) {
            const c = type === "number" ? va - vb : String(va).localeCompare(String(vb));
            if (c) return sign * c;
          }
          return a.dataset.sortIndex - b.dataset.sortIndex;
        });
        sorted.forEach((r) => tbody.appendChild(r));
        const name = (th.querySelector(".aian-sort").firstChild.textContent || "").trim();
        status.textContent = "Sorted by " + name + ", " + dir + ".";
      });
    });
  });
})();
