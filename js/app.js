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
