/* =========================================================
   SNK AI MENTOR
   ai/avatar.js
   Step 15 — Provider-Ready Avatar Engine
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
      width: 0,
      height: 0,
      aspectRatio: "",
      lastUpdated: null
    },
    ready: false,
    error: "",
    checking: false
  };

  /* ---------------------------------------------------------
     Helpers
  --------------------------------------------------------- */

  function emit(eventName, detail = {}) {
    const handlers = EVENTS[eventName] || [];

    handlers.forEach((handler) => {
      try {
        handler(detail);
      } catch (error) {
        console.error("[SNK Avatar] Event handler error:", error);
      }
    });

    try {
      window.dispatchEvent(
        new CustomEvent(`snk-avatar:${eventName}`, {
          detail
        })
      );
    } catch (_) {}
  }

  function on(eventName, handler) {
    if (typeof handler !== "function") return () => {};

    if (!EVENTS[eventName]) {
      EVENTS[eventName] = [];
    }

    EVENTS[eventName].push(handler);

    return () => {
      EVENTS[eventName] = EVENTS[eventName].filter(
        (item) => item !== handler
      );
    };
  }

  function bytesToMB(bytes) {
    return Number((bytes / (1024 * 1024)).toFixed(2));
  }

  function getExtension(fileName = "") {
    const parts = fileName.split(".");
    return parts.length > 1
      ? parts.pop().toLowerCase()
      : "";
  }

  function isVideoFile(file) {
    if (!file) return false;

    const allowedExtensions = [
      "mp4",
      "webm",
      "mov",
      "m4v",
      "avi"
    ];

    const extension = getExtension(file.name);

    if (file.type && file.type.startsWith("video/")) {
      return true;
    }

    return allowedExtensions.includes(extension);
  }

  function getAspectRatio(width, height) {
    if (!width || !height) return "";

    const ratio = width / height;

    if (Math.abs(ratio - 16 / 9) < 0.04) {
      return "16:9";
    }

    if (Math.abs(ratio - 9 / 16) < 0.04) {
      return "9:16";
    }

    if (Math.abs(ratio - 4 / 3) < 0.04) {
      return "4:3";
    }

    if (Math.abs(ratio - 1) < 0.04) {
      return "1:1";
    }

    return ratio.toFixed(2);
  }

  function revokeObjectUrl() {
    if (!state.objectUrl) return;

    try {
      URL.revokeObjectURL(state.objectUrl);
    } catch (_) {}

    state.objectUrl = null;
  }

  /* ---------------------------------------------------------
     Video metadata
  --------------------------------------------------------- */

  function readVideoMetadata(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error("No video file selected."));
        return;
      }

      const url = URL.createObjectURL(file);
      const video = document.createElement("video");

      let finished = false;

      const cleanup = () => {
        video.removeAttribute("src");
        video.load();

        try {
          URL.revokeObjectURL(url);
        } catch (_) {}
      };

      const complete = (result) => {
        if (finished) return;

        finished = true;
        cleanup();
        resolve(result);
      };

      const fail = (message) => {
        if (finished) return;

        finished = true;
        cleanup();
        reject(new Error(message));
      };

      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;

      video.addEventListener("loadedmetadata", () => {
        complete({
          duration: Number.isFinite(video.duration)
            ? Number(video.duration.toFixed(2))
            : 0,

          width: video.videoWidth || 0,
          height: video.videoHeight || 0,

          aspectRatio: getAspectRatio(
            video.videoWidth,
            video.videoHeight
          )
        });
      });

      video.addEventListener("error", () => {
        fail("The selected video could not be read.");
      });

      video.src = url;
    });
  }

  /* ---------------------------------------------------------
     Validation
  --------------------------------------------------------- */

  function validateFile(file) {
    if (!file) {
      return {
        valid: false,
        message: "Please select a face video."
      };
    }

    if (!isVideoFile(file)) {
      return {
        valid: false,
        message: "Please select a valid video file."
      };
    }

    return {
      valid: true,
      message: ""
    };
  }

  /* ---------------------------------------------------------
     Set source
  --------------------------------------------------------- */

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

      const videoInfo = await readVideoMetadata(file);

      state.sourceFile = file;
      state.objectUrl = URL.createObjectURL(file);

      state.metadata = {
        name: file.name || "face-video",
        type: file.type || "video/*",
        size: file.size || 0,
        sizeMB: bytesToMB(file.size || 0),
        duration: videoInfo.duration,
        width: videoInfo.width,
        height: videoInfo.height,
        aspectRatio: videoInfo.aspectRatio,
        lastUpdated: new Date().toISOString()
      };

      state.ready = true;
      state.error = "";
      state.checking = false;

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
        error?.message || "Unable to process the face video.";

      emit("error", {
        message: state.error
      });

      return {
        success: false,
        error: state.error
      };
    }
  }

  /* ---------------------------------------------------------
     Clear source
  --------------------------------------------------------- */

  function clearSource() {
    revokeObjectUrl();

    state.sourceFile = null;

    state.metadata = {
      name: "",
      type: "",
      size: 0,
      sizeMB: 0,
      duration: 0,
      width: 0,
      height: 0,
      aspectRatio: "",
      lastUpdated: null
    };

    state.ready = false;
    state.error = "";
    state.checking = false;

    emit("cleared");

    return true;
  }

  /* ---------------------------------------------------------
     Getters
  --------------------------------------------------------- */

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

  function isReady() {
    return Boolean(state.ready && state.sourceFile);
  }

  function getError() {
    return state.error || "";
  }

  function isChecking() {
    return Boolean(state.checking);
  }

  /* ---------------------------------------------------------
     Provider configuration
  --------------------------------------------------------- */

  function getAIConfig() {
    return NS.AIConfig || null;
  }

  function getProvider() {
    const config = getAIConfig();

    if (!config || typeof config.getProvider !== "function") {
      return "demo";
    }

    return config.getProvider();
  }

  function isDemoMode() {
    const config = getAIConfig();

    if (!config) return true;

    if (typeof config.isDemoMode === "function") {
      return config.isDemoMode();
    }

    return getProvider() === "demo";
  }

  function isLiveMode() {
    const config = getAIConfig();

    if (!config) return false;

    if (typeof config.isLiveMode === "function") {
      return config.isLiveMode();
    }

    return !isDemoMode();
  }

  /* ---------------------------------------------------------
     Provider readiness
  --------------------------------------------------------- */

  function checkProvider() {
    const config = getAIConfig();

    if (!config) {
      return {
        ready: true,
        mode: "demo",
        provider: "demo",
        message: "Demo avatar engine is available."
      };
    }

    const mode =
      typeof config.getMode === "function"
        ? config.getMode()
        : "demo";

    const provider = getProvider();

    if (mode === "demo") {
      return {
        ready: true,
        mode: "demo",
        provider,
        message: "Demo avatar engine is ready."
      };
    }

    /*
      IMPORTANT:

      Live provider calls must normally go through your own
      backend/server. Never expose a private provider API key
      inside GitHub Pages frontend JavaScript.

      Therefore live mode is considered configured only when
      the AI configuration layer reports the necessary backend
      connection.
    */

    let connectionReady = false;

    if (
      typeof config.isConfigured === "function"
    ) {
      connectionReady = config.isConfigured();
    }

    if (!connectionReady) {
      return {
        ready: false,
        mode: "live",
        provider,
        message:
          "Live avatar provider is not configured. Connect a secure backend/API."
      };
    }

    return {
      ready: true,
      mode: "live",
      provider,
      message:
        "Live avatar provider configuration is available."
    };
  }

  /* ---------------------------------------------------------
     Avatar readiness
  --------------------------------------------------------- */

  function checkReadiness() {
    const provider = checkProvider();

    if (!isReady()) {
      return {
        ready: false,
        sourceReady: false,
        providerReady: provider.ready,
        mode: provider.mode,
        provider: provider.provider,
        message:
          state.error ||
          "Upload a face video before generating an AI mentor video."
      };
    }

    if (!provider.ready) {
      return {
        ready: false,
        sourceReady: true,
        providerReady: false,
        mode: provider.mode,
        provider: provider.provider,
        message: provider.message
      };
    }

    return {
      ready: true,
      sourceReady: true,
      providerReady: true,
      mode: provider.mode,
      provider: provider.provider,
      message:
        provider.mode === "demo"
          ? "Avatar source is ready for demo generation."
          : "Avatar source is ready for live generation."
    };
  }

  /* ---------------------------------------------------------
     Build provider-safe payload
  --------------------------------------------------------- */

  function buildPayload(options = {}) {
    const readiness = checkReadiness();

    if (!readiness.sourceReady) {
      throw new Error(readiness.message);
    }

    /*
      We intentionally DO NOT put the File object into JSON.

      A real provider may require:
      - multipart/form-data
      - cloud storage URL
      - provider asset ID
      - signed upload URL

      That upload step belongs in the secure backend layer.
    */

    return {
      avatar: {
        fileName: state.metadata.name,
        mimeType: state.metadata.type,
        size: state.metadata.size,
        sizeMB: state.metadata.sizeMB,
        duration: state.metadata.duration,
        width: state.metadata.width,
        height: state.metadata.height,
        aspectRatio: state.metadata.aspectRatio
      },

      provider: {
        name: readiness.provider,
        mode: readiness.mode
      },

      options: {
        ...options
      },

      client: {
        application: "SNK AI Mentor",
        engine: "avatar",
        version: "1.0.0"
      }
    };
  }

  /* ---------------------------------------------------------
     Export local source metadata
  --------------------------------------------------------- */

  function exportMetadata() {
    return {
      ready: isReady(),
      metadata: getMetadata(),
      provider: getProvider(),
      mode: isDemoMode() ? "demo" : "live"
    };
  }

  /* ---------------------------------------------------------
     Public API
  --------------------------------------------------------- */

  const Avatar = {
    version: "1.0.0",

    state,

    setSource,
    clearSource,

    getSource,
    getPreviewUrl,
    getMetadata,

    isReady,
    isChecking,
    getError,

    getProvider,
    isDemoMode,
    isLiveMode,

    checkProvider,
    checkReadiness,

    buildPayload,
    exportMetadata,

    validateFile,

    on
  };

  NS.Avatar = Avatar;

  emit("loaded", {
    version: Avatar.version
  });

})();
