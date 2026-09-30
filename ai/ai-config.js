/* =========================================================
   SNK AI MENTOR
   ai/ai-config.js

   STEP 14 — AI PROVIDER CONFIGURATION CENTER

   IMPORTANT:
   ---------------------------------------------------------
   • Default mode = DEMO
   • GitHub Pages frontend should NOT contain real secret API keys
   • Live provider requests should eventually go through
     a secure backend/serverless function.
   ========================================================= */

(() => {
  "use strict";

  /* =======================================================
     GLOBAL NAMESPACE
     ======================================================= */

  window.SNKAI = window.SNKAI || {};


  /* =======================================================
     STORAGE
     ======================================================= */

  const STORAGE_KEY = "snkAiMentorAIConfig";


  /* =======================================================
     DEFAULT CONFIG
     ======================================================= */

  const DEFAULT_CONFIG = {

    /*
     * demo
     * ----
     * Safe frontend testing mode.
     *
     * live
     * ----
     * Real backend/provider mode.
     */
    mode: "demo",


    /*
     * Provider name is descriptive.
     *
     * Examples:
     * "custom"
     * "heygen"
     * "synthesia"
     * "d-id"
     * "custom-backend"
     */
    provider: "demo",


    /*
     * Frontend should call YOUR secure backend.
     *
     * DO NOT place private provider API URLs here if
     * they require secret credentials.
     */
    apiBaseUrl: "",


    /*
     * Generation endpoint.
     */
    generateEndpoint: "/api/ai/video/generate",


    /*
     * Job status endpoint.
     */
    statusEndpoint: "/api/ai/video/status",


    /*
     * Provider endpoint can be used by a secure backend
     * configuration later.
     *
     * This is intentionally empty.
     */
    providerEndpoint: "",


    /*
     * Never put a real secret key in this frontend file.
     *
     * This property exists only as a placeholder so the
     * application architecture can understand credentials.
     */
    apiKey: "",


    /*
     * Optional project identifier.
     */
    projectId: "snk-ai-mentor",


    /*
     * Request timeout.
     */
    requestTimeout: 120000,


    /*
     * Polling settings.
     */
    pollingInterval: 4000,
    maxPollingAttempts: 90,


    /*
     * Default output settings.
     */
    defaults: {

      format: "mp4",

      resolution: "1080p",

      mentorPosition: "right",

      background: "studio",

      aspectRatio: "16:9",

      fps: 30,

      subtitles: false,

      audio: true

    }

  };


  /* =======================================================
     CLONE OBJECT
     ======================================================= */

  function clone(value) {

    return JSON.parse(
      JSON.stringify(value)
    );

  }


  /* =======================================================
     LOAD SAVED CONFIG
     ======================================================= */

  function loadSavedConfig() {

    try {

      const raw =
        localStorage.getItem(STORAGE_KEY);

      if (!raw) {

        return clone(DEFAULT_CONFIG);

      }

      const saved =
        JSON.parse(raw);

      return mergeConfig(
        clone(DEFAULT_CONFIG),
        saved
      );

    } catch (error) {

      console.warn(
        "[SNK AI] Could not load saved AI config.",
        error
      );

      return clone(DEFAULT_CONFIG);

    }

  }


  /* =======================================================
     DEEP MERGE
     ======================================================= */

  function mergeConfig(base, override) {

    if (
      !override ||
      typeof override !== "object"
    ) {

      return base;

    }


    Object.keys(override).forEach((key) => {

      const value = override[key];

      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        base[key] &&
        typeof base[key] === "object"
      ) {

        base[key] =
          mergeConfig(
            base[key],
            value
          );

      } else {

        base[key] = value;

      }

    });


    return base;

  }


  /* =======================================================
     CURRENT CONFIG
     ======================================================= */

  let config =
    loadSavedConfig();


  /* =======================================================
     SAVE CONFIG
     ======================================================= */

  function saveConfig(nextConfig) {

    config =
      mergeConfig(
        clone(DEFAULT_CONFIG),
        nextConfig || {}
      );


    /*
     * Never persist an accidental secret key.
     *
     * Real production credentials must stay server-side.
     */
    config.apiKey = "";


    try {

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(config)
      );

    } catch (error) {

      console.warn(
        "[SNK AI] Could not save AI config.",
        error
      );

    }


    return getConfig();

  }


  /* =======================================================
     GET CONFIG
     ======================================================= */

  function getConfig() {

    return clone(config);

  }


  /* =======================================================
     GET MODE
     ======================================================= */

  function getMode() {

    return String(
      config.mode || "demo"
    ).toLowerCase();

  }


  /* =======================================================
     DEMO MODE
     ======================================================= */

  function isDemoMode() {

    return getMode() === "demo";

  }


  /* =======================================================
     LIVE MODE
     ======================================================= */

  function isLiveMode() {

    return getMode() === "live";

  }


  /* =======================================================
     PROVIDER NAME
     ======================================================= */

  function getProvider() {

    return (
      config.provider ||
      "demo"
    );

  }


  /* =======================================================
     SET MODE
     ======================================================= */

  function setMode(mode) {

    const normalized =
      String(mode || "demo")
        .trim()
        .toLowerCase();


    if (
      normalized !== "demo" &&
      normalized !== "live"
    ) {

      throw
