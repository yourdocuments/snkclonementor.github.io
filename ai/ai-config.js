/* =========================================================
   SNK AI MENTOR
   ai/ai-config.js
   ---------------------------------------------------------
   Central AI Provider Configuration
   ---------------------------------------------------------
   IMPORTANT:
   - Never put private API keys/secrets in this file.
   - This project runs on GitHub Pages/static hosting.
   - Real AI generation should eventually use a secure backend.
   ========================================================= */

(() => {
  "use strict";

  /* ---------------------------------------------------------
     1. GLOBAL NAMESPACE
     --------------------------------------------------------- */

  window.SNKAI = window.SNKAI || {};


  /* ---------------------------------------------------------
     2. MAIN CONFIGURATION
     --------------------------------------------------------- */

  const CONFIG = {

    /* Current mode:
       demo = UI/testing mode
       live = future backend/API mode
    */
    mode: "demo",

    /* Future provider name */
    provider: "custom",

    /* Human-readable provider name */
    providerLabel: "Custom AI Provider",

    /* -------------------------------------------------------
       Future backend/API settings

       Keep these EMPTY until a secure backend is connected.
       ------------------------------------------------------- */

    apiBaseUrl: "",

    endpoints: {
      generate: "",
      status: "",
      cancel: "",
      webhook: ""
    },


    /* -------------------------------------------------------
       SECURITY
       ------------------------------------------------------- */

    security: {

      /*
       NEVER place private API keys here.

       Example of what NOT to do:

       apiKey: "sk-xxxxxxxx"

       Instead, the future backend should hold
       the private API credentials.
      */

      allowClientApiKey: false,

      apiKey: "",

      /*
       Optional public runtime configuration.
       This is intentionally empty.
      */
      publicToken: ""
    },


    /* -------------------------------------------------------
       VIDEO OUTPUT
       ------------------------------------------------------- */

    output: {

      format: "mp4",

      resolution: "1080p",

      aspectRatio: "16:9",

      fps: 30,

      audio: true,

      subtitles: false
    },


    /* -------------------------------------------------------
       DEFAULT AVATAR SETTINGS
       ------------------------------------------------------- */

    avatar: {

      source: "mentor-face-video",

      defaultPosition: "right",

      defaultBackground: "studio",

      enabled: true
    },


    /* -------------------------------------------------------
       DEFAULT VOICE SETTINGS
       ------------------------------------------------------- */

    voice: {

      source: "mentor-voice-sample",

      language: "auto",

      enabled: true
    },


    /* -------------------------------------------------------
       GENERATION SETTINGS
       ------------------------------------------------------- */

    generation: {

      timeout: 10 * 60 * 1000,

      pollingInterval: 3000,

      maxRetries: 3,

      autoDownload: false
    },


    /* -------------------------------------------------------
       FILE LIMITS
       ------------------------------------------------------- */

    limits: {

      faceVideoMB: 500,

      voiceAudioMB: 200,

      scriptCharacters: 50000
    },


    /* -------------------------------------------------------
       DEBUG
       ------------------------------------------------------- */

    debug: true
  };


  /* ---------------------------------------------------------
     3. PROVIDER PROFILES
     --------------------------------------------------------- */

  const PROVIDERS = {

    demo: {
      id: "demo",
      label: "Demo Mode",

      capabilities: {
        avatar: false,
        voice: false,
        video: true
      }
    },


    custom: {
      id: "custom",
      label: "Custom AI Provider",

      capabilities: {
        avatar: true,
        voice: true,
        video: true
      }
    }

  };


  /* ---------------------------------------------------------
     4. SAFE RUNTIME CONFIG
     --------------------------------------------------------- */

  function getRuntimeConfig() {

    /*
     * Optional runtime configuration.
     *
     * A future backend/application can provide:
     *
     * window.SNKAI_RUNTIME_CONFIG = {
     *   apiBaseUrl: "...",
     *   publicToken: "..."
     * };
     *
     * Never use this mechanism for private secrets.
     */

    const runtime =
      window.SNKAI_RUNTIME_CONFIG &&
      typeof window.SNKAI_RUNTIME_CONFIG === "object"
        ? window.SNKAI_RUNTIME_CONFIG
        : {};

    return runtime;
  }


  /* ---------------------------------------------------------
     5. GET CONFIG
     * --------------------------------------------------------- */

  function getConfig() {

    const runtime = getRuntimeConfig();

    return {

      ...CONFIG,

      apiBaseUrl:
        runtime.apiBaseUrl ||
        CONFIG.apiBaseUrl,

      security: {

        ...CONFIG.security,

        publicToken:
          runtime.publicToken ||
          CONFIG.security.publicToken
      }

    };
  }


  /* ---------------------------------------------------------
     6. GET PROVIDER
     * --------------------------------------------------------- */

  function getProvider() {

    const config = getConfig();

    return (
      PROVIDERS[config.provider] ||
      PROVIDERS.custom
    );
  }


  /* ---------------------------------------------------------
     7. CHECK DEMO MODE
     * --------------------------------------------------------- */

  function isDemo() {

    return getConfig().mode === "demo";
  }


  /* ---------------------------------------------------------
     8. CHECK LIVE MODE
     * --------------------------------------------------------- */

  function isLive() {

    return getConfig().mode === "live";
  }


  /* ---------------------------------------------------------
     9. CHECK API CONFIGURATION
     * --------------------------------------------------------- */

  function isConfigured() {

    const config = getConfig();

    if (config.mode === "demo") {
      return true;
    }

    return Boolean(
      config.apiBaseUrl &&
      config.endpoints.generate
    );
  }


  /* ---------------------------------------------------------
     10. VALIDATE CONFIGURATION
     * --------------------------------------------------------- */

  function validate() {

    const config = getConfig();

    const errors = [];
    const warnings = [];


    /* Demo mode */

    if (config.mode === "demo") {

      warnings.push(
        "SNK AI Mentor is currently running in Demo Mode."
      );

    }


    /* Live mode */

    if (config.mode === "live") {

      if (!config.apiBaseUrl) {

        errors.push(
          "API Base URL is not configured."
        );

      }

      if (!config.endpoints.generate) {

        errors.push(
          "Generate endpoint is not configured."
        );

      }

    }


    /* Security check */

    if (
      config.security.allowClientApiKey &&
      config.security.apiKey
    ) {

      errors.push(
        "Private API keys must not be exposed in client-side code."
      );

    }


    return {

      valid: errors.length === 0,

      errors,

      warnings

    };

  }


  /* ---------------------------------------------------------
     11. BUILD REQUEST HEADERS
     * --------------------------------------------------------- */

  function buildHeaders() {

    const config = getConfig();

    const headers = {

      "Content-Type": "application/json",

      "Accept": "application/json"

    };


    /*
     * Public token only.
     *
     * This is NOT a private API key.
     */

    if (config.security.publicToken) {

      headers["X-SNK-Public-Token"] =
        config.security.publicToken;

    }


    return headers;

  }


  /* ---------------------------------------------------------
     12. GET GENERATION URL
     * --------------------------------------------------------- */

  function getGenerateUrl() {

    const config = getConfig();

    if (!config.apiBaseUrl) {
      return "";
    }

    if (!config.endpoints.generate) {
      return "";
    }

    return joinUrl(
      config.apiBaseUrl,
      config.endpoints.generate
    );

  }


  /* ---------------------------------------------------------
     13. GET STATUS URL
     * --------------------------------------------------------- */

  function getStatusUrl(jobId) {

    const config = getConfig();

    if (!config.apiBaseUrl) {
      return "";
    }

    if (!config.endpoints.status) {
      return "";
    }

    let endpoint =
      config.endpoints.status;

    endpoint =
      endpoint.replace(
        "{jobId}",
        encodeURIComponent(jobId || "")
      );

    return joinUrl(
      config.apiBaseUrl,
      endpoint
    );

  }


  /* ---------------------------------------------------------
     14. URL HELPER
     * --------------------------------------------------------- */

  function joinUrl(base, endpoint) {

    if (!base) {
      return endpoint || "";
    }

    if (!endpoint) {
      return base;
    }

    return (
      base.replace(/\/+$/, "") +
      "/" +
      endpoint.replace(/^\/+/, "")
    );

  }


  /* ---------------------------------------------------------
     15. GET OUTPUT SETTINGS
     * --------------------------------------------------------- */

  function getOutputSettings() {

    return {
      ...getConfig().output
    };

  }


  /* ---------------------------------------------------------
     16. GET AVATAR SETTINGS
     * --------------------------------------------------------- */

  function getAvatarSettings() {

    return {
      ...getConfig().avatar
    };

  }


  /* ---------------------------------------------------------
     17. GET VOICE SETTINGS
     * --------------------------------------------------------- */

  function getVoiceSettings() {

    return {
      ...getConfig().voice
    };

  }


  /* ---------------------------------------------------------
     18. GET GENERATION SETTINGS
     * --------------------------------------------------------- */

  function getGenerationSettings() {

    return {
      ...getConfig().generation
    };

  }


  /* ---------------------------------------------------------
     19. DEBUG LOGGER
     * --------------------------------------------------------- */

  function log(...args) {

    if (!getConfig().debug) {
      return;
    }

    console.log(
      "[SNK AI Mentor]",
      ...args
    );

  }


  /* ---------------------------------------------------------
     20. WARNING LOGGER
     * --------------------------------------------------------- */

  function warn(...args) {

    console.warn(
      "[SNK AI Mentor]",
      ...args
    );

  }


  /* ---------------------------------------------------------
     21. ERROR LOGGER
     * --------------------------------------------------------- */

  function error(...args) {

    console.error(
      "[SNK AI Mentor]",
      ...args
    );

  }


  /* ---------------------------------------------------------
     22. PUBLIC API
     * --------------------------------------------------------- */

  const AIConfig = {

    CONFIG,

    PROVIDERS,

    getConfig,

    getRuntimeConfig,

    getProvider,

    isDemo,

    isLive,

    isConfigured,

    validate,

    buildHeaders,

    getGenerateUrl,

    getStatusUrl,

    getOutputSettings,

    getAvatarSettings,

    getVoiceSettings,

    getGenerationSettings,

    log,

    warn,

    error

  };


  /* ---------------------------------------------------------
     23. EXPORT
     * --------------------------------------------------------- */

  window.SNKAI.AIConfig = AIConfig;


  /* ---------------------------------------------------------
     24. STARTUP CHECK
     * --------------------------------------------------------- */

  document.addEventListener(
    "DOMContentLoaded",
    () => {

      const validation =
        AIConfig.validate();

      if (validation.warnings.length) {

        validation.warnings.forEach(
          message => AIConfig.warn(message)
        );

      }

      if (validation.errors.length) {

        validation.errors.forEach(
          message => AIConfig.error(message)
        );

      }

      AIConfig.log(
        "AI configuration loaded.",
        {
          mode: AIConfig.getConfig().mode,
          provider: AIConfig.getProvider().label
        }
      );

    }
  );


})();
