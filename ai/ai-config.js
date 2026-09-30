/* =========================================================
   SNK AI MENTOR
   ai/ai-config.js
   Step 19 — Final AI Provider Configuration
   ========================================================= */

(() => {
  "use strict";

  window.SNKAI = window.SNKAI || {};

  const NS = window.SNKAI;

  const STORAGE_KEY =
    "snkAiMentorAIConfig";

  /* =========================================================
     DEFAULT CONFIG
  ========================================================= */

  const DEFAULT_CONFIG = {
    mode: "demo",

    provider: "demo",

    /*
      IMPORTANT:
      Never put a private provider API key directly into
      GitHub Pages production code.

      Live mode should normally use:
        GitHub Pages frontend
              ↓
        Your secure backend
              ↓
        AI provider
    */

    apiBaseUrl: "",

    generateEndpoint:
      "/api/ai/video/generate",

    statusEndpoint:
      "/api/ai/video/status",

    providerEndpoint: "",

    apiKey: "",

    projectId:
      "snk-ai-mentor",

    requestTimeout:
      120000,

    pollingInterval:
      4000,

    maxPollingAttempts:
      90,

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

  /* =========================================================
     HELPERS
  ========================================================= */

  function clone(value) {
    try {
      return JSON.parse(
        JSON.stringify(value)
      );
    } catch (_) {
      return value;
    }
  }

  function mergeDeep(
    base,
    override
  ) {
    const result =
      clone(base);

    if (
      !override ||
      typeof override !==
        "object"
    ) {
      return result;
    }

    Object.keys(
      override
    ).forEach(
      (key) => {
        const value =
          override[key];

        if (
          value &&
          typeof value ===
            "object" &&
          !Array.isArray(
            value
          ) &&
          result[key] &&
          typeof result[key] ===
            "object" &&
          !Array.isArray(
            result[key]
          )
        ) {
          result[key] =
            mergeDeep(
              result[key],
              value
            );
        } else {
          result[key] =
            value;
        }
      }
    );

    return result;
  }

  function loadSavedConfig() {
    try {
      const raw =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (!raw) {
        return {};
      }

      const parsed =
        JSON.parse(raw);

      return (
        parsed &&
        typeof parsed ===
          "object"
          ? parsed
          : {}
      );
    } catch (error) {
      console.warn(
        "[SNK AI Config] Unable to load saved configuration.",
        error
      );

      return {};
    }
  }

  let config =
    mergeDeep(
      DEFAULT_CONFIG,
      loadSavedConfig()
    );

  /* =========================================================
     SANITIZATION
  ========================================================= */

  function sanitizeConfig(
    source
  ) {
    const safe =
      mergeDeep(
        DEFAULT_CONFIG,
        source
      );

    safe.mode =
      safe.mode ===
        "live"
        ? "live"
        : "demo";

    safe.provider =
      String(
        safe.provider ||
          "demo"
      ).trim();

    safe.apiBaseUrl =
      String(
        safe.apiBaseUrl ||
          ""
      ).trim();

    safe.generateEndpoint =
      String(
        safe.generateEndpoint ||
          DEFAULT_CONFIG.generateEndpoint
      ).trim();

    safe.statusEndpoint =
      String(
        safe.statusEndpoint ||
          DEFAULT_CONFIG.statusEndpoint
      ).trim();

    safe.providerEndpoint =
      String(
        safe.providerEndpoint ||
          ""
      ).trim();

    safe.projectId =
      String(
        safe.projectId ||
          DEFAULT_CONFIG.projectId
      ).trim();

    safe.requestTimeout =
      Math.max(
        5000,
        Number(
          safe.requestTimeout
        ) ||
          DEFAULT_CONFIG.requestTimeout
      );

    safe.pollingInterval =
      Math.max(
        1000,
        Number(
          safe.pollingInterval
        ) ||
          DEFAULT_CONFIG.pollingInterval
      );

    safe.maxPollingAttempts =
      Math.max(
        1,
        Number(
          safe.maxPollingAttempts
        ) ||
          DEFAULT_CONFIG.maxPollingAttempts
      );

    return safe;
  }

  /* =========================================================
     SAVE
  ========================================================= */

  function saveConfig(
    nextConfig = config
  ) {
    config =
      sanitizeConfig(
        nextConfig
      );

    /*
      Security:
      apiKey is intentionally removed before localStorage.
      A frontend API key should not be persisted on GitHub Pages.
    */

    const safeForStorage =
      clone(config);

    safeForStorage.apiKey =
      "";

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          safeForStorage
        )
      );

      return true;
    } catch (error) {
      console.warn(
        "[SNK AI Config] Unable to save configuration.",
        error
      );

      return false;
    }
  }

  /* =========================================================
     GET CONFIG
  ========================================================= */

  function getConfig() {
    return clone(config);
  }

  function getMode() {
    return config.mode;
  }

  function getProvider() {
    return config.provider;
  }

  function isDemoMode() {
    return (
      config.mode ===
      "demo"
    );
  }

  function isLiveMode() {
    return (
      config.mode ===
      "live"
    );
  }

  /* =========================================================
     MODE
  ========================================================= */

  function setMode(
    mode,
    persist = true
  ) {
    const normalized =
      String(
        mode || "demo"
      ).toLowerCase();

    config.mode =
      normalized ===
        "live"
        ? "live"
        : "demo";

    if (
      config.mode ===
      "demo"
    ) {
      /*
        Demo mode never needs an API key.
      */
      config.apiKey = "";
    }

    if (persist) {
      saveConfig(
        config
      );
    }

    emit(
      "configChanged",
      getPublicConfig()
    );

    return getMode();
  }

  /* =========================================================
     PROVIDER
  ========================================================= */

  function setProvider(
    provider,
    persist = true
  ) {
    const value =
      String(
        provider || "demo"
      ).trim();

    config.provider =
      value || "demo";

    if (persist) {
      saveConfig(
        config
      );
    }

    emit(
      "configChanged",
      getPublicConfig()
    );

    return config.provider;
  }

  /* =========================================================
     ENDPOINTS
  ========================================================= */

  function normalizeUrl(
    value
  ) {
    return String(
      value || ""
    ).trim();
  }

  function joinUrl(
    base,
    path
  ) {
    const cleanBase =
      normalizeUrl(
        base
      );

    const cleanPath =
      normalizeUrl(
        path
      );

    if (!cleanBase) {
      return cleanPath;
    }

    if (!cleanPath) {
      return cleanBase;
    }

    return (
      cleanBase.replace(
        /\/+$/,
        ""
      ) +
      "/" +
      cleanPath.replace(
        /^\/+/,
        ""
      )
    );
  }

  function getGenerateUrl() {
    return joinUrl(
      config.apiBaseUrl,
      config.generateEndpoint
    );
  }

  function getStatusUrl(
    jobId = ""
  ) {
    let endpoint =
      joinUrl(
        config.apiBaseUrl,
        config.statusEndpoint
      );

    const cleanJobId =
      encodeURIComponent(
        String(
          jobId || ""
        )
      );

    /*
      Supports either:
        /status
      or:
        /status/{jobId}
    */

    if (
      cleanJobId
    ) {
      if (
        endpoint.includes(
          "{jobId}"
        )
      ) {
        endpoint =
          endpoint.replace(
            "{jobId}",
            cleanJobId
          );
      } else {
        endpoint =
          `${endpoint.replace(
            /\/+$/,
            ""
          )}/${cleanJobId}`;
      }
    }

    return endpoint;
  }

  function getProviderEndpoint() {
    return normalizeUrl(
      config.providerEndpoint
    );
  }

  /* =========================================================
     SECURITY / LIVE CONFIG
  ========================================================= */

  function hasBackendEndpoint() {
    return Boolean(
      normalizeUrl(
        config.apiBaseUrl
      )
    );
  }

  function isConfigured() {
    if (
      isDemoMode()
    ) {
      return true;
    }

    /*
      Live mode requires a backend endpoint.

      We intentionally do not require an API key here because
      the recommended architecture is:

      Frontend → secure backend → provider

      The provider key stays on the backend.
    */

    return hasBackendEndpoint();
  }

  function getConfigurationStatus() {
    if (
      isDemoMode()
    ) {
      return {
        configured: true,

        mode: "demo",

        provider:
          config.provider,

        message:
          "Demo mode is ready."
      };
    }

    if (
      !hasBackendEndpoint()
    ) {
      return {
        configured: false,

        mode: "live",

        provider:
          config.provider,

        message:
          "Live mode requires a secure backend API endpoint."
      };
    }

    return {
      configured: true,

      mode: "live",

      provider:
        config.provider,

      message:
        "Live backend configuration is available."
    };
  }

  /* =========================================================
     HEADERS
  ========================================================= */

  function buildHeaders(
    extraHeaders = {}
  ) {
    const headers = {
      "Content-Type":
        "application/json",

      Accept:
        "application/json",

      "X-SNK-Project":
        config.projectId,

      ...extraHeaders
    };

    /*
      API keys are intentionally NOT automatically added.

      If your architecture requires a public/non-secret token,
      add it through a secure mechanism appropriate for your
      backend.

      Never expose private provider credentials in GitHub Pages.
    */

    return headers;
  }

  /* =========================================================
     REQUEST HELPERS
  ========================================================= */

  function getRequestTimeout() {
    return Number(
      config.requestTimeout
    );
  }

  function getPollingInterval() {
    return Number(
      config.pollingInterval
    );
  }

  function getMaxPollingAttempts() {
    return Number(
      config.maxPollingAttempts
    );
  }

  /* =========================================================
     DEFAULT VIDEO SETTINGS
  ========================================================= */

  function getDefaults() {
    return clone(
      config.defaults
    );
  }

  function getDefault(
    key,
    fallback = null
  ) {
    if (
      Object.prototype.hasOwnProperty.call(
        config.defaults,
        key
      )
    ) {
      return config.defaults[key];
    }

    return fallback;
  }

  /* =========================================================
     UPDATE CONFIG
  ========================================================= */

  function update(
    partial = {},
    options = {}
  ) {
    config =
      sanitizeConfig(
        mergeDeep(
          config,
          partial
        )
      );

    if (
      options.persist !==
      false
    ) {
      saveConfig(
        config
      );
    }

    emit(
      "configChanged",
      getPublicConfig()
    );

    return getConfig();
  }

  /* =========================================================
     PUBLIC-SAFE CONFIG
  ========================================================= */

  function getPublicConfig() {
    const safe =
      getConfig();

    /*
      Never expose an API key through the public configuration.
    */

    safe.apiKey = "";

    return safe;
  }

  /* =========================================================
     PROVIDER CONNECTION TEST
  ========================================================= */

  async function testConnection() {
    if (
      isDemoMode()
    ) {
      return {
        success: true,

        mode: "demo",

        provider:
          config.provider,

        message:
          "Demo connection is ready."
      };
    }

    const endpoint =
      getProviderEndpoint() ||
      getGenerateUrl();

    if (!endpoint) {
      return {
        success: false,

        mode: "live",

        provider:
          config.provider,

        message:
          "No live backend endpoint is configured."
      };
    }

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => {
          controller.abort();
        },
        Math.min(
          getRequestTimeout(),
          15000
        )
      );

    try {
      const response =
        await fetch(
          endpoint,
          {
            method:
              "OPTIONS",

            headers:
              buildHeaders(),

            signal:
              controller.signal
          }
        );

      /*
        Some servers do not support OPTIONS.
        A successful response or even a non-5xx response
        can indicate that the endpoint is reachable.
      */

      if (
        response.status >=
        500
      ) {
        return {
          success: false,

          mode: "live",

          provider:
            config.provider,

          message:
            `Backend returned HTTP ${response.status}.`
        };
      }

      return {
        success: true,

        mode: "live",

        provider:
          config.provider,

        message:
          "Backend endpoint is reachable.",

        status:
          response.status
      };

    } catch (error) {
      if (
        error?.name ===
        "AbortError"
      ) {
        return {
          success: false,

          mode: "live",

          provider:
            config.provider,

          message:
            "Connection test timed out."
        };
      }

      return {
        success: false,

        mode: "live",

        provider:
          config.provider,

        message:
          error?.message ||
          "Unable to reach backend endpoint."
      };

    } finally {
      clearTimeout(
        timeout
      );
    }
  }

  /* =========================================================
     RESET
  ========================================================= */

  function reset(
    persist = true
  ) {
    config =
      clone(
        DEFAULT_CONFIG
      );

    if (persist) {
      saveConfig(
        config
      );
    }

    emit(
      "configChanged",
      getPublicConfig()
    );

    return getConfig();
  }

  /* =========================================================
     EVENT SYSTEM
  ========================================================= */

  const EVENTS = {};

  function emit(
    eventName,
    detail = {}
  ) {
    const handlers =
      EVENTS[eventName] ||
      [];

    handlers.forEach(
      (handler) => {
        try {
          handler(
            detail
          );
        } catch (error) {
          console.error(
            "[SNK AI Config] Event error:",
            error
          );
        }
      }
    );

    try {
      window.dispatchEvent(
        new CustomEvent(
          `snk-ai-config:${eventName}`,
          {
            detail
          }
        )
      );
    } catch (_) {}
  }

  function on(
    eventName,
    handler
  ) {
    if (
      typeof handler !==
      "function"
    ) {
      return () => {};
    }

    if (
      !EVENTS[eventName]
    ) {
      EVENTS[eventName] =
        [];
    }

    EVENTS[eventName].push(
      handler
    );

    return () => {
      EVENTS[eventName] =
        EVENTS[eventName].filter(
          (item) =>
            item !== handler
        );
    };
  }

  /* =========================================================
     PUBLIC API
  ========================================================= */

  const AIConfig = {
    version:
      "2.0.0",

    DEFAULT_CONFIG:
      clone(
        DEFAULT_CONFIG
      ),

    getConfig,
    getPublicConfig,

    getMode,
    setMode,

    getProvider,
    setProvider,

    isDemoMode,
    isLiveMode,

    isConfigured,
    hasBackendEndpoint,

    getConfigurationStatus,

    getGenerateUrl,
    getStatusUrl,
    getProviderEndpoint,

    buildHeaders,

    getRequestTimeout,
    getPollingInterval,
    getMaxPollingAttempts,

    getDefaults,
    getDefault,

    update,
    saveConfig,
    reset,

    testConnection,

    on
  };

  NS.AIConfig =
    AIConfig;

  /*
    Ensure the current configuration is normalized and
    safely stored.
  */

  saveConfig(
    config
  );

  emit(
    "loaded",
    {
      version:
        AIConfig.version,

      mode:
        config.mode,

      provider:
        config.provider
    }
  );

})();
