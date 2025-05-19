(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // node_modules/@uswds/uswds/dist/js/uswds-init.js
  var require_uswds_init = __commonJS({
    "node_modules/@uswds/uswds/dist/js/uswds-init.js"() {
      (function uswdsInit() {
        "use strict";
        var loadingClass = "usa-js-loading";
        var fallback;
        document.documentElement.classList.add(loadingClass);
        function revertClass() {
          document.documentElement.classList.remove(loadingClass);
        }
        fallback = setTimeout(revertClass, 8e3);
        function verifyLoaded() {
          if (window.uswdsPresent) {
            clearTimeout(fallback);
            revertClass();
            window.removeEventListener("load", verifyLoaded, true);
          }
        }
        window.addEventListener("load", verifyLoaded, true);
      })();
    }
  });

  // js/uswds-init.js
  require_uswds_init();
})();
//# sourceMappingURL=uswds-init-YIZL6EE4.js.map
