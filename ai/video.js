/* =========================================================
   SNK AI MENTOR
   ai/voice.js
   Step 16 — Provider-Ready Voice Engine
   ========================================================= */

(() => {
  "use strict";

  window.SNKAI = window.SNKAI || {};

  const NS = window.SNKAI;
  const EVENTS = {};

  const state = {
    sourceFile: null,
    objectUrl: null,

    metadata: {
      name: "",
      type: "",
      size: 0,
      sizeMB: 0,
      duration: 0,
      lastUpdated: null
    },

    ready: false,
    checking: false,
    error: ""
  };

  /* =========================================================
     EVENTS
  ========================================================= */

  function emit(eventName, detail = {}) {
    const handlers = EVENTS[eventName] || [];

    handlers.forEach((handler) => {
      try {
        handler(detail);
      } catch (error) {
        console.error("[SNK Voice] Event handler error:", error);
      }
    });

    try {
      window.dispatchEvent(
        new CustomEvent(`snk-voice:${eventName}`, {
          detail
        })
      );
    } catch (_) {}
  }

  function on(eventName, handler) {
    if (typeof handler !== "function") {
      return () => {};
    }

    if (!EVENTS[eventName]) {
      EVENTS[eventName] = [];
    }

    EVENTS[eventName].push(handler);

    return () => {
      EVENTS[eventName] =
        EVENTS[eventName].filter(
          (item) => item !== handler
        );
    };
  }

  /* =========================================================
     HELPERS
  ========================================================= */

  function bytesToMB(bytes) {
    return Number(
      ((bytes || 0) / (1024 * 1024)).toFixed(2)
    );
  }

  function formatDuration(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return "0:00";
    }

    const total = Math.round(seconds);
    const minutes = Math.floor(total / 60);
    const secs = total % 60;

    return `${minutes}:${String(secs).padStart(2, "0")}`;
  }

  function getExtension(fileName = "") {
    const parts = fileName.split(".");

    return parts.length > 1
      ? parts.pop().toLowerCase()
      : "";
  }

  function isAudioFile(file) {
    if (!file) return false;

    const allowedExtensions = [
      "mp3",
      "wav",
      "m4a",
      "aac",
      "ogg",
      "oga",
      "webm",
      "flac"
    ];

    if (
      file.type &&
      file.type.startsWith("audio/")
    ) {
      return true;
    }

    return allowedExtensions.includes(
      getExtension(file.name)
    );
  }

  function revokeObjectUrl() {
    if (!state.objectUrl) return;

    try {
      URL.revokeObjectURL(state.objectUrl);
    } catch (_) {}

    state.objectUrl = null;
  }

  /* =========================================================
     AUDIO METADATA
  ========================================================= */

  function readAudioMetadata(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(
          new Error("No voice sample selected.")
        );
        return;
      }

      const url = URL.createObjectURL(file);
      const audio = document.createElement("audio");

      let finished = false;

      function cleanup() {
        audio.removeAttribute("src");
        audio.load();

        try {
          URL.revokeObjectURL(url);
        } catch (_) {}
      }

      function success(result) {
        if (finished) return;

        finished = true;
        cleanup();
        resolve(result);
      }

      function fail(message) {
        if (finished) return;

        finished = true;
        cleanup();
        reject(new Error(message));
      }

      audio.preload = "metadata";

      audio.addEventListener(
        "loadedmetadata",
        () => {
          success({
            duration:
              Number.isFinite(audio.duration)
                ? Number(audio.duration.toFixed(2))
                : 0
          });
        }
      );

      audio.addEventListener(
        "error",
        () => {
          fail(
            "The selected audio file could not be read."
          );
        }
      );

      audio.src = url;
    });
  }

  /* =========================================================
     VALIDATION
  ========================================================= */

  function validateFile(file) {
    if (!file) {
      return {
        valid: false,
        message: "Please select a voice sample."
      };
    }

    if (!isAudioFile(file)) {
      return {
        valid: false,
        message:
          "Please select a valid audio file."
      };
    }

    return {
      valid: true,
      message: ""
    };
  }

  /* =========================================================
     SET VOICE SOURCE
  ========================================================= */

  async function setSource(file) {
    state.error = "";
    state.checking = true;

    emit("checking", {
      file
    });

    const validation = validateFile(file);

    if (!validation.valid) {
      state.ready = false;
      state.checking = false;
      state.error = validation.message;

      emit("error", {
        message: validation.message
      });

      return {
        success: false,
        error: validation.message
      };
    }

    try {
      revokeObjectUrl();

      const audioInfo =
        await readAudioMetadata(file);

      state.sourceFile = file;
      state.objectUrl =
        URL.createObjectURL(file);

      state.metadata = {
        name:
          file.name ||
          "voice-sample",

        type:
          file.type ||
          "audio/*",

        size:
          file.size || 0,

        sizeMB:
          bytesToMB(file.size || 0),

        duration:
          audioInfo.duration,

        lastUpdated:
          new Date().toISOString()
      };

      state.ready = true;
      state.checking = false;
      state.error = "";

      emit("ready", {
        file,
        metadata: getMetadata(),
        previewUrl: state.objectUrl
      });

      return {
        success: true,
        file,
        metadata: getMetadata(),
        previewUrl: state.objectUrl
      };

    } catch (error) {
      state.sourceFile = null;
      state.ready = false;
      state.checking = false;

      state.error =
        error?.message ||
        "Unable to process the voice sample.";

      emit("error", {
        message: state.error
      });

      return {
        success: false,
        error: state.error
      };
    }
  }

  /* =========================================================
     CLEAR SOURCE
  ========================================================= */

  function clearSource() {
    revokeObjectUrl();

    state.sourceFile = null;

    state.metadata = {
      name: "",
      type: "",
      size: 0,
      sizeMB: 0,
      duration: 0,
      lastUpdated: null
    };

    state.ready = false;
    state.checking = false;
    state.error = "";

    emit("cleared");

    return true;
  }

  /* =========================================================
     GETTERS
  ========================================================= */

  function getSource() {
    return state.sourceFile;
  }

  function getPreviewUrl() {
    return state.objectUrl || "";
  }

  function getMetadata() {
    return {
      ...state.metadata
    };
  }

  function getDuration() {
    return state.metadata.duration || 0;
  }

  function getFormattedDuration() {
    return formatDuration(
      state.metadata.duration
    );
  }

  function isReady() {
    return Boolean(
      state.ready &&
      state.sourceFile
    );
  }

  function isChecking() {
    return Boolean(state.checking);
  }

  function getError() {
    return state.error || "";
  }

  /* =========================================================
     AI CONFIG
  ========================================================= */

  function getAIConfig() {
    return NS.AIConfig || null;
  }

  function getProvider() {
    const config = getAIConfig();

    if (
      !config ||
      typeof config.getProvider !== "function"
    ) {
      return "demo";
    }

    return config.getProvider();
  }

  function getMode() {
    const config = getAIConfig();

    if (
      config &&
      typeof config.getMode === "function"
    ) {
      return config.getMode();
    }

    return "demo";
  }

  function isDemoMode() {
    const config = getAIConfig();

    if (!config) {
      return true;
    }

    if (
      typeof config.isDemoMode === "function"
    ) {
      return config.isDemoMode();
    }

    return getMode() === "demo";
  }

  function isLiveMode() {
    const config = getAIConfig();

    if (!config) {
      return false;
    }

    if (
      typeof config.isLiveMode === "function"
    ) {
      return config.isLiveMode();
    }

    return !isDemoMode();
  }

  /* =========================================================
     PROVIDER CHECK
  ========================================================= */

  function checkProvider() {
    const config = getAIConfig();

    if (!config) {
      return {
        ready: true,
        mode: "demo",
        provider: "demo",
        message:
          "Demo voice engine is available."
      };
    }

    const mode = getMode();
    const provider = getProvider();

    if (mode === "demo") {
      return {
        ready: true,
        mode: "demo",
        provider,
        message:
          "Demo voice engine is ready."
      };
    }

    /*
      SECURITY:

      A private voice-cloning provider API key should NOT
      be placed in frontend JavaScript on GitHub Pages.

      Live processing should use a secure backend.
    */

    let connectionReady = false;

    if (
      typeof config.isConfigured === "function"
    ) {
      connectionReady =
        config.isConfigured();
    }

    if (!connectionReady) {
      return {
        ready: false,
        mode: "live",
        provider,
        message:
          "Live voice provider is not configured. Connect a secure backend/API."
      };
    }

    return {
      ready: true,
      mode: "live",
      provider,
      message:
        "Live voice provider configuration is available."
    };
  }

  /* =========================================================
     VOICE READINESS
  ========================================================= */

  function checkReadiness() {
    const provider =
      checkProvider();

    if (!isReady()) {
      return {
        ready: false,
        sourceReady: false,
        providerReady:
          provider.ready,
        mode:
          provider.mode,
        provider:
          provider.provider,
        message:
          state.error ||
          "Upload a voice sample before generating an AI mentor video."
      };
    }

    if (!provider.ready) {
      return {
        ready: false,
        sourceReady: true,
        providerReady: false,
        mode:
          provider.mode,
        provider:
          provider.provider,
        message:
          provider.message
      };
    }

    return {
      ready: true,
      sourceReady: true,
      providerReady: true,
      mode:
        provider.mode,
      provider:
        provider.provider,
      message:
        provider.mode === "demo"
          ? "Voice sample is ready for demo generation."
          : "Voice sample is ready for live generation."
    };
  }

  /* =========================================================
     BUILD PROVIDER-SAFE PAYLOAD
  ========================================================= */

  function buildPayload(options = {}) {
    const readiness =
      checkReadiness();

    if (!readiness.sourceReady) {
      throw new Error(
        readiness.message
      );
    }

    /*
      Do not serialize the raw File object into JSON.

      A real provider integration can later use:

      1. Secure backend upload
      2. Signed upload URL
      3. Provider asset ID
      4. Cloud storage URL
      5. Multipart/FormData handled by backend
    */

    return {
      voice: {
        fileName:
          state.metadata.name,

        mimeType:
          state.metadata.type,

        size:
          state.metadata.size,

        sizeMB:
          state.metadata.sizeMB,

        duration:
          state.metadata.duration
      },

      provider: {
        name:
          readiness.provider,

        mode:
          readiness.mode
      },

      options: {
        ...options
      },

      client: {
        application:
          "SNK AI Mentor",

        engine:
          "voice",

        version:
          "1.0.0"
      }
    };
  }

  /* =========================================================
     EXPORT METADATA
  ========================================================= */

  function exportMetadata() {
    return {
      ready:
        isReady(),

      metadata:
        getMetadata(),

      duration:
        getDuration(),

      formattedDuration:
        getFormattedDuration(),

      provider:
        getProvider(),

      mode:
        isDemoMode()
          ? "demo"
          : "live"
    };
  }

  /* =========================================================
     PUBLIC API
  ========================================================= */

  const Voice = {
    version: "1.0.0",

    state,

    setSource,
    clearSource,

    getSource,
    getPreviewUrl,
    getMetadata,

    getDuration,
    getFormattedDuration,

    isReady,
    isChecking,
    getError,

    getProvider,
    getMode,

    isDemoMode,
    isLiveMode,

    checkProvider,
    checkReadiness,

    buildPayload,
    exportMetadata,

    validateFile,

    on
  };

  NS.Voice = Voice;

  emit("loaded", {
    version:
      Voice.version
  });

})();
