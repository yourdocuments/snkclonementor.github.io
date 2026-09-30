/* =========================================================
   SNK AI MENTOR
   Step 3 — script.js

   Features:
   ✓ Mobile navigation
   ✓ Light / Dark theme
   ✓ Theme persistence
   ✓ Current year
   ✓ Active navigation
   ✓ Scroll reveal
   ✓ Header scroll effect
   ✓ Button interactions
   ✓ Local settings
========================================================= */

(() => {
  "use strict";

  /* =======================================================
     CONFIG
  ======================================================= */

  const STORAGE_KEY = "snkAiMentorSettings";

  const settings = {
    theme: "dark"
  };


  /* =======================================================
     DOM READY
  ======================================================= */

  document.addEventListener("DOMContentLoaded", init);


  function init() {

    loadSettings();

    initTheme();

    initMobileMenu();

    initCurrentYear();

    initNavigation();

    initScrollEffects();

    initRevealAnimation();

    initButtons();

  }


  /* =======================================================
     SETTINGS
  ======================================================= */

  function loadSettings() {

    try {

      const saved =
        localStorage.getItem(STORAGE_KEY);

      if (!saved) return;

      const parsed =
        JSON.parse(saved);

      if (
        parsed &&
        typeof parsed === "object"
      ) {

        Object.assign(
          settings,
          parsed
        );

      }

    } catch (error) {

      console.warn(
        "SNK AI Mentor: Could not load settings.",
        error
      );

    }

  }


  function saveSettings() {

    try {

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(settings)
      );

    } catch (error) {

      console.warn(
        "SNK AI Mentor: Could not save settings.",
        error
      );

    }

  }


  /* =======================================================
     THEME
  ======================================================= */

  function initTheme() {

    const body =
      document.body;

    const themeButton =
      document.getElementById(
        "themeButton"
      );

    if (!body) return;


    /* -----------------------------------------------
       Apply saved theme
    ------------------------------------------------ */

    if (
      settings.theme === "light"
    ) {

      body.classList.add(
        "light-mode"
      );

    } else {

      body.classList.remove(
        "light-mode"
      );

    }


    updateThemeButton();


    /* -----------------------------------------------
       Theme button
    ------------------------------------------------ */

    if (themeButton) {

      themeButton.addEventListener(
        "click",
        toggleTheme
      );

    }

  }


  function toggleTheme() {

    const body =
      document.body;

    const isLight =
      body.classList.toggle(
        "light-mode"
      );


    settings.theme =
      isLight
        ? "light"
        : "dark";


    saveSettings();

    updateThemeButton();

  }


  function updateThemeButton() {

    const themeButton =
      document.getElementById(
        "themeButton"
      );

    if (!themeButton) return;


    const isLight =
      document.body.classList.contains(
        "light-mode"
      );


    if (isLight) {

      themeButton.textContent = "☀";

      themeButton.setAttribute(
        "aria-label",
        "Switch to dark mode"
      );

      themeButton.setAttribute(
        "title",
        "Switch to dark mode"
      );

    } else {

      themeButton.textContent = "◐";

      themeButton.setAttribute(
        "aria-label",
        "Switch to light mode"
      );

      themeButton.setAttribute(
        "title",
        "Switch to light mode"
      );

    }

  }


  /* =======================================================
     MOBILE MENU
  ======================================================= */

  function initMobileMenu() {

    const menuButton =
      document.getElementById(
        "mobileMenuButton"
      );

    const mobileNav =
      document.getElementById(
        "mobileNav"
      );


    if (
      !menuButton ||
      !mobileNav
    ) {

      return;

    }


    menuButton.addEventListener(
      "click",
      () => {

        const isOpen =
          mobileNav.classList.toggle(
            "show"
          );


        menuButton.setAttribute(
          "aria-expanded",
          String(isOpen)
        );


        menuButton.textContent =
          isOpen
            ? "×"
            : "☰";

      }
    );


    /* -----------------------------------------------
       Close menu after navigation
    ------------------------------------------------ */

    const mobileLinks =
      mobileNav.querySelectorAll(
        "a"
      );


    mobileLinks.forEach(
      (link) => {

        link.addEventListener(
          "click",
          () => {

            mobileNav.classList.remove(
              "show"
            );

            menuButton.textContent =
              "☰";

            menuButton.setAttribute(
              "aria-expanded",
              "false"
            );

          }
        );

      }
    );


    /* -----------------------------------------------
       Close menu on outside click
    ------------------------------------------------ */

    document.addEventListener(
      "click",
      (event) => {

        if (
          !mobileNav.classList.contains(
            "show"
          )
        ) {

          return;

        }


        const clickedInside =
          mobileNav.contains(
            event.target
          );


        const clickedButton =
          menuButton.contains(
            event.target
          );


        if (
          !clickedInside &&
          !clickedButton
        ) {

          mobileNav.classList.remove(
            "show"
          );

          menuButton.textContent =
            "☰";

          menuButton.setAttribute(
            "aria-expanded",
            "false"
          );

        }

      }
    );

  }


  /* =======================================================
     CURRENT YEAR
  ======================================================= */

  function initCurrentYear() {

    const yearElement =
      document.getElementById(
        "currentYear"
      );


    if (!yearElement) return;


    yearElement.textContent =
      new Date().getFullYear();

  }


  /* =======================================================
     NAVIGATION
  ======================================================= */

  function initNavigation() {

    const navLinks =
      document.querySelectorAll(
        '.main-nav a[href^="#"]'
      );


    const sections =
      document.querySelectorAll(
        "main section[id]"
      );


    if (!navLinks.length) return;


    /* -----------------------------------------------
       Smooth navigation
    ------------------------------------------------ */

    navLinks.forEach(
      (link) => {

        link.addEventListener(
          "click",
          (event) => {

            const href =
              link.getAttribute(
                "href"
              );


            if (
              !href ||
              href === "#"
            ) {

              return;

            }


            const target =
              document.querySelector(
                href
              );


            if (!target) return;


            event.preventDefault();


            const header =
              document.querySelector(
                ".site-header"
              );


            const headerHeight =
              header
                ? header.offsetHeight
                : 0;


            const targetPosition =
              target.getBoundingClientRect()
                .top +
              window.scrollY -
              headerHeight -
              15;


            window.scrollTo({
              top: targetPosition,
              behavior: "smooth"
            });

          }
        );

      }
    );


    /* -----------------------------------------------
       Active section
    ------------------------------------------------ */

    if (!sections.length) return;


    const observer =
      new IntersectionObserver(
        (entries) => {

          entries.forEach(
            (entry) => {

              if (
                !entry.isIntersecting
              ) {

                return;

              }


              const id =
                entry.target.id;


              navLinks.forEach(
                (link) => {

                  link.classList.toggle(
                    "active",
                    link.getAttribute(
                      "href"
                    ) === `#${id}`
                  );

                }
              );

            }
          );

        },
        {
          root: null,
          rootMargin:
            "-25% 0px -60% 0px",
          threshold: 0
        }
      );


    sections.forEach(
      (section) => {

        observer.observe(
          section
        );

      }
    );

  }


  /* =======================================================
     HEADER SCROLL EFFECT
  ======================================================= */

  function initScrollEffects() {

    const header =
      document.querySelector(
        ".site-header"
      );


    if (!header) return;


    let ticking = false;


    function updateHeader() {

      if (
        window.scrollY > 20
      ) {

        header.classList.add(
          "scrolled"
        );

      } else {

        header.classList.remove(
          "scrolled"
        );

      }


      ticking = false;

    }


    window.addEventListener(
      "scroll",
      () => {

        if (!ticking) {

          window.requestAnimationFrame(
            updateHeader
          );

          ticking = true;

        }

      },
      {
        passive: true
      }
    );


    updateHeader();

  }


  /* =======================================================
     REVEAL ANIMATION
  ======================================================= */

  function initRevealAnimation() {

    const revealElements =
      document.querySelectorAll(
        `
        .workflow-card,
        .feature-card,
        .privacy-box,
        .studio-container,
        .stats-container
        `
      );


    if (!revealElements.length) {
      return;
    }


    /* -----------------------------------------------
       Respect reduced motion
    ------------------------------------------------ */

    const reducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;


    if (reducedMotion) {

      revealElements.forEach(
        (element) => {

          element.classList.add(
            "reveal-visible"
          );

        }
      );

      return;

    }


    /* -----------------------------------------------
       Initial state
    ------------------------------------------------ */

    revealElements.forEach(
      (element, index) => {

        element.classList.add(
          "reveal-element"
        );

        element.style.setProperty(
          "--reveal-delay",
          `${Math.min(index * 45, 250)}ms`
        );

      }
    );


    /* -----------------------------------------------
       Observer
    ------------------------------------------------ */

    const observer =
      new IntersectionObserver(
        (entries, obs) => {

          entries.forEach(
            (entry) => {

              if (
                !entry.isIntersecting
              ) {

                return;

              }


              entry.target.classList.add(
                "reveal-visible"
              );


              obs.unobserve(
                entry.target
              );

            }
          );

        },
        {
          threshold: .08,
          rootMargin:
            "0px 0px -40px 0px"
        }
      );


    revealElements.forEach(
      (element) => {

        observer.observe(
          element
        );

      }
    );

  }


  /* =======================================================
     BUTTONS
  ======================================================= */

  function initButtons() {

    const buttons =
      document.querySelectorAll(
        ".primary-button, .secondary-button, .header-button"
      );


    buttons.forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            createButtonRipple(
              button
            );

          }
        );

      }
    );

  }


  /* =======================================================
     BUTTON RIPPLE
  ======================================================= */

  function createButtonRipple(
    button
  ) {

    if (
      !button ||
      !button.getBoundingClientRect
    ) {

      return;

    }


    const ripple =
      document.createElement(
        "span"
      );


    ripple.className =
      "button-ripple";


    const rect =
      button.getBoundingClientRect();


    const size =
      Math.max(
        rect.width,
        rect.height
      );


    ripple.style.width =
      `${size}px`;

    ripple.style.height =
      `${size}px`;


    ripple.style.left =
      `${rect.width / 2 - size / 2}px`;

    ripple.style.top =
      `${rect.height / 2 - size / 2}px`;


    button.appendChild(
      ripple
    );


    window.setTimeout(
      () => {

        ripple.remove();

      },
      600
    );

  }


  /* =======================================================
     GLOBAL CSS FOR JS EFFECTS
  ======================================================= */

  const dynamicStyle =
    document.createElement(
      "style"
    );


  dynamicStyle.textContent = `

    .site-header.scrolled {
      background: rgba(5, 7, 12, .90);
      box-shadow:
        0 12px 35px rgba(0,0,0,.16);
    }

    body.light-mode .site-header.scrolled {
      background: rgba(255,255,255,.94);
    }

    .reveal-element {
      opacity: 0;
      transform: translateY(25px);
      transition:
        opacity .7s ease var(--reveal-delay),
        transform .7s ease var(--reveal-delay);
    }

    .reveal-element.reveal-visible {
      opacity: 1;
      transform: translateY(0);
    }

    .button-ripple {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;

      background:
        rgba(255,255,255,.18);

      transform: scale(0);

      animation:
        snkRipple .6s ease-out forwards;
    }

    @keyframes snkRipple {

      to {
        transform: scale(2);
        opacity: 0;
      }

    }

    .primary-button,
    .secondary-button,
    .header-button {
      position: relative;
      overflow: hidden;
    }

  `;


  document.head.appendChild(
    dynamicStyle
  );


  /* =======================================================
     KEYBOARD ACCESSIBILITY
  ======================================================= */

  document.addEventListener(
    "keydown",
    (event) => {

      /* ESC closes mobile menu */

      if (
        event.key === "Escape"
      ) {

        const mobileNav =
          document.getElementById(
            "mobileNav"
          );

        const menuButton =
          document.getElementById(
            "mobileMenuButton"
          );


        if (
          mobileNav &&
          mobileNav.classList.contains(
            "show"
          )
        ) {

          mobileNav.classList.remove(
            "show"
          );

          if (menuButton) {

            menuButton.textContent =
              "☰";

            menuButton.setAttribute(
              "aria-expanded",
              "false"
            );

          }

        }

      }

    }
  );


  /* =======================================================
     PAGE VISIBILITY
  ======================================================= */

  document.addEventListener(
    "visibilitychange",
    () => {

      if (
        document.visibilityState ===
        "visible"
      ) {

        updateThemeButton();

      }

    }
  );


  /* =======================================================
     PUBLIC API
     Future pages can use this if needed.
  ======================================================= */

  window.SNKAI = {

    version: "1.0.0",

    getSettings() {

      return {
        ...settings
      };

    },

    saveSettings,

    toggleTheme

  };


})();
