/* =========================================================
   SNK AI Mentor
   ai/voice.js

   STEP 27 — Voice Sample Engine

   Responsibilities:
   - Voice sample upload
   - Audio validation
   - File size validation
   - Audio metadata detection
   - Preview URL creation
   - Readiness state
   - Provider-independent payload
   - FormData helper
   - Provider preparation
   - Events
   - Safe reset / clear

   IMPORTANT:
   This browser-side engine does NOT clone a voice.
   Actual voice cloning / voice synthesis must happen through
   an authorized external AI provider or your secure backend.

   Supported provider labels:
   - demo
   - custom
   - heygen
   - synthesia
   - d-id

   No API key or raw audio file is stored in localStorage.
   ========================================================= */

(() => {
  "use strict";

  /* ---------------------------------------------------------
     1. Namespace
     --------------------------------------------------------- */

  window.SNKAI = window.SNKAI || {};

  const EVENTS = {};

  /* ---------------------------------------------------------
     2. Constants
     --------------------------------------------------------- */

  const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250 MB

  const SUPPORTED_EXTENSIONS = [
    "mp3",
    "wav",
    "m4a",
    "aac",
    "ogg",
    "oga",
    "webm",
    "flac"
  ];

  const SUPPORTED_MIME_TYPES = [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/x-pn-wav",
    "audio/mp4",
    "audio/x-m4a",
    "audio/aac",
    "audio/ogg",
    "audio/oga",
    "audio/webm",
    "audio/flac",
    "audio/x-flac"
  ];

  const SUPPORTED_PROVIDERS = [
    {
      id: "demo",
      name: "Demo Engine",
      live: false,
      description: "Local browser demo mode."
    },
    {
      id: "custom",
      name: "Custom API",
      live: true,
      description: "Connect your own secure backend."
    },
    {
      id: "heygen",
      name: "HeyGen",
      live: true,
      description: "External avatar and voice platform."
    },
    {
      id: "synthesia",
      name: "Synthesia",
      live: true,
      description: "External AI video platform."
    },
    {
      id: "d-id",
      name: "D-ID",
      live: true,
      description: "External talking-avatar platform."
    }
  ];

  /* ---------------------------------------------------------
     3. Internal state
     --------------------------------------------------------- */

  const state = {
    ready: false,
    loading: false,

    file: null,
    previewUrl: "",

    metadata: {
      name: "",
      size: 0,
      sizeLabel: "",
      type: "",
      extension: "",
      duration: 0,
      durationLabel: "",
      lastModified: 0
    },

    error: "",
    provider: "demo",

    loadedAt: null
  };

  /* ---------------------------------------------------------
     4. Utility
     --------------------------------------------------------- */

  function emit(eventName, detail = {}) {
    const listeners = EVENTS[eventName];

    if (!listeners || !listeners.length) {
      return;
    }

    listeners.slice().forEach((listener) => {
      try {
        listener(detail);
      } catch (error) {
        console.error(
          "[SNK AI Voice] Event listener error:",
          error
        );
      }
    });
  }

  function on(eventName, callback) {
    if (typeof callback !== "function") {
      return () => {};
    }

    EVENTS[eventName] = EVENTS[eventName] || [];
    EVENTS[eventName].push(callback);

    return () => {
      EVENTS[eventName] =
        (EVENTS[eventName] || []).filter(
          (listener) => listener !== callback
        );
    };
  }

  function setError(message) {
    state.error = String(message || "");
    state.ready = false;

    emit("error", {
      message: state.error,
      state: getState()
    });
  }

  function clearError() {
    state.error = "";
  }

  function getExtension(fileName = "") {
    const parts = String(fileName).toLowerCase().split(".");

    if (parts.length < 2) {
      return "";
    }

    return parts.pop();
  }

  function formatBytes(bytes) {
    const value = Number(bytes) || 0;

    if (value <= 0) {
      return "0 B";
    }

    const units = ["B", "KB", "MB", "GB"];

    const index = Math.min(
      Math.floor(Math.log(value) / Math.log(1024)),
      units.length - 1
    );

    const size = value / Math.pow(1024, index);

    return `${size.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
  }

  function formatDuration(seconds) {
    const total = Math.max(
      0,
      Math.round(Number(seconds) || 0)
    );

    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;

    if (hours > 0) {
      return [
        String(hours).padStart(2, "0"),
        String(minutes).padStart(2, "0"),
        String(secs).padStart(2, "0")
      ].join(":");
    }

    return [
      String(minutes).padStart(2, "0"),
      String(secs).padStart(2, "0")
    ].join(":");
  }

  function isAudioFile(file) {
    if (!file) {
      return false;
    }

    const mime = String(file.type || "").toLowerCase();
    const extension = getExtension(file.name);

    const mimeAccepted =
      mime.startsWith("audio/") ||
      SUPPORTED_MIME_TYPES.includes(mime);

    const extensionAccepted =
      SUPPORTED_EXTENSIONS.includes(extension);

    return mimeAccepted || extensionAccepted;
  }

  /* ---------------------------------------------------------
     5. File validation
     --------------------------------------------------------- */

  function validateFile(file) {
    const errors = [];

    if (!file) {
      errors.push("Please select a voice sample.");
      return {
        valid: false,
        errors
      };
    }

    if (!isAudioFile(file)) {
      errors.push(
        "Unsupported audio format. Use MP3, WAV, M4A, AAC, OGG, WEBM or FLAC."
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      errors.push(
        `Voice sample is too large. Maximum size is ${formatBytes(
          MAX_FILE_SIZE
        )}.`
      );
    }

    if (file.size <= 0) {
      errors.push("The selected audio file is empty.");
    }

    return {
      valid: errors.length === 0,
      errors,
      maxSize: MAX_FILE_SIZE,
      maxSizeLabel: formatBytes(MAX_FILE_SIZE)
    };
  }

  /* ---------------------------------------------------------
     6. Audio metadata
     --------------------------------------------------------- */

  function readAudioMetadata(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error("No audio file supplied."));
        return;
      }

      const url = URL.createObjectURL(file);
      const audio = document.createElement("audio");

      let finished = false;

      const cleanup = () => {
        audio.removeAttribute("src");

        try {
          audio.load();
        } catch (_) {}

        URL.revokeObjectURL(url);
      };

      const success = () => {
        if (finished) {
          return;
        }

        finished = true;

        const duration = Number(audio.duration);

        cleanup();

        resolve({
          duration:
            Number.isFinite(duration) && duration > 0
              ? duration
              : 0
        });
      };

      const failure = () => {
        if (finished) {
          return;
        }

        finished = true;

        cleanup();

        reject(
          new Error(
            "Could not read audio metadata from this file."
          )
        );
      };

      audio.preload = "metadata";

      audio.addEventListener(
        "loadedmetadata",
        success,
        { once: true }
      );

      audio.addEventListener(
        "error",
        failure,
        { once: true }
      );

      audio.src = url;
    });
  }

  /* ---------------------------------------------------------
     7. Load voice sample
     --------------------------------------------------------- */

  async function load(file) {
    clearError();

    const validation = validateFile(file);

    if (!validation.valid) {
      setError(validation.errors.join(" "));
      return {
        success: false,
        errors: validation.errors
      };
    }

    state.loading = true;
    state.ready = false;

    emit("loading", {
      file,
      state: getState()
    });

    /* Remove previous preview */
    revokePreviewUrl();

    try {
      const audioMetadata = await readAudioMetadata(file);

      state.file = file;

      state.previewUrl = URL.createObjectURL(file);

      state.metadata = {
        name: file.name || "voice-sample",
        size: file.size || 0,
        sizeLabel: formatBytes(file.size),
        type: file.type || "audio/*",
        extension: getExtension(file.name),
        duration: audioMetadata.duration || 0,
        durationLabel: formatDuration(
          audioMetadata.duration
        ),
        lastModified: file.lastModified || 0
      };

      state.loadedAt = new Date().toISOString();
      state.loading = false;
      state.ready = true;
      state.error = "";

      emit("loaded", {
        file,
        metadata: { ...state.metadata },
        state: getState()
      });

      emit("change", {
        state: getState()
      });

      return {
        success: true,
        file,
        metadata: { ...state.metadata },
        previewUrl: state.previewUrl
      };
    } catch (error) {
      state.loading = false;
      state.ready = false;

      setError(
        error && error.message
          ? error.message
          : "Unable to load voice sample."
      );

      emit("change", {
        state: getState()
      });

      return {
        success: false,
        errors: [state.error]
      };
    }
  }

  /* Friendly aliases */
  const loadSample = load;
  const setSample = load;

  /* ---------------------------------------------------------
     8. Preview URL management
     --------------------------------------------------------- */

  function revokePreviewUrl() {
    if (!state.previewUrl) {
      return;
    }

    try {
      URL.revokeObjectURL(state.previewUrl);
    } catch (_) {}

    state.previewUrl = "";
  }

  function getPreviewUrl() {
    return state.previewUrl;
  }

  /* ---------------------------------------------------------
     9. Clear
     --------------------------------------------------------- */

  function clear() {
    revokePreviewUrl();

    state.ready = false;
    state.loading = false;
    state.file = null;

    state.metadata = {
      name: "",
      size: 0,
      sizeLabel: "",
      type: "",
      extension: "",
      duration: 0,
      durationLabel: "",
      lastModified: 0
    };

    state.error = "";
    state.loadedAt = null;

    emit("cleared", {
      state: getState()
    });

    emit("change", {
      state: getState()
    });
  }

  const reset = clear;

  /* ---------------------------------------------------------
     10. Provider
     --------------------------------------------------------- */

  function setProvider(providerId) {
    const provider = String(providerId || "")
      .trim()
      .toLowerCase();

    if (!supportsProvider(provider)) {
      return false;
    }

    state.provider = provider;

    emit("providerchange", {
      provider,
      providerInfo: getProvider(provider),
      state: getState()
    });

    return true;
  }

  function getProvider(providerId = state.provider) {
    return (
      SUPPORTED_PROVIDERS.find(
        (item) => item.id === providerId
      ) || null
    );
  }

  function getSupportedProviders() {
    return SUPPORTED_PROVIDERS.map((provider) => ({
      ...provider
    }));
  }

  function supportsProvider(providerId) {
    return SUPPORTED_PROVIDERS.some(
      (provider) => provider.id === providerId
    );
  }

  /* ---------------------------------------------------------
     11. Readiness
     --------------------------------------------------------- */

  function isReady() {
    return Boolean(
      state.ready &&
      state.file &&
      state.previewUrl &&
      state.metadata.name
    );
  }

  function getReadiness() {
    const checks = [
      {
        id: "file",
        label: "Voice sample selected",
        ready: Boolean(state.file)
      },
      {
        id: "format",
        label: "Supported audio format",
        ready: Boolean(
          state.file && isAudioFile(state.file)
        )
      },
      {
        id: "size",
        label: "File size accepted",
        ready: Boolean(
          state.file &&
          state.file.size > 0 &&
          state.file.size <= MAX_FILE_SIZE
        )
      },
      {
        id: "metadata",
        label: "Audio metadata readable",
        ready: Boolean(
          state.metadata.duration >= 0 &&
          state.metadata.name
        )
      },
      {
        id: "preview",
        label: "Audio preview ready",
        ready: Boolean(state.previewUrl)
      }
    ];

    const passed = checks.filter(
      (check) => check.ready
    ).length;

    return {
      ready: isReady(),
      checks,
      passed,
      total: checks.length,
      percentage: Math.round(
        (passed / checks.length) * 100
      ),
      error: state.error || ""
    };
  }

  /* ---------------------------------------------------------
     12. Getters
     --------------------------------------------------------- */

  function getFile() {
    return state.file;
  }

  function getSample() {
    return state.file;
  }

  function getMetadata() {
    return {
      ...state.metadata
    };
  }

  function getDuration() {
    return Number(state.metadata.duration) || 0;
  }

  function getState() {
    return {
      ready: state.ready,
      loading: state.loading,

      hasFile: Boolean(state.file),

      metadata: {
        ...state.metadata
      },

      previewUrl: state.previewUrl,

      provider: state.provider,

      error: state.error,

      loadedAt: state.loadedAt
    };
  }

  /* ---------------------------------------------------------
     13. Provider-independent payload
     --------------------------------------------------------- */

  function buildPayload(options = {}) {
    const provider =
      options.provider ||
      state.provider ||
      "demo";

    return {
      source: "snk-ai-mentor",
      engine: "voice",
      provider,

      sample: {
        available: Boolean(state.file),
        name: state.metadata.name,
        size: state.metadata.size,
        type: state.metadata.type,
        extension: state.metadata.extension,
        duration: state.metadata.duration
      },

      voice: {
        cloneRequested:
          options.cloneRequested !== false,
        language:
          options.language ||
          "auto",
        preserveNaturalTone:
          options.preserveNaturalTone !== false
      },

      security: {
        rawFileIncluded: false,
        browserOnlyMetadata: true
      }
    };
  }

  /* ---------------------------------------------------------
     14. FormData helper
     --------------------------------------------------------- */

  function appendToFormData(
    formData,
    fieldName = "voiceSample"
  ) {
    if (
      !formData ||
      typeof formData.append !== "function"
    ) {
      throw new Error(
        "A valid FormData instance is required."
      );
    }

    if (!state.file) {
      throw new Error(
        "No voice sample is loaded."
      );
    }

    formData.append(
      fieldName,
      state.file,
      state.file.name || "voice-sample"
    );

    return formData;
  }

  /* ---------------------------------------------------------
     15. Provider preparation
     --------------------------------------------------------- */

  function prepareForProvider(
    providerId = state.provider,
    options = {}
  ) {
    const provider = getProvider(providerId);

    if (!provider) {
      return {
        success: false,
        error: "Unsupported voice provider."
      };
    }

    if (!isReady()) {
      return {
        success: false,
        error:
          state.error ||
          "Voice sample is not ready."
      };
    }

    /*
      Demo mode:
      Return metadata only.

      Live providers:
      Return provider-independent information.
      Actual provider-specific upload/authentication
      must be performed by a secure backend.
    */

    const payload = buildPayload({
      ...options,
      provider: provider.id
    });

    return {
      success: true,

      provider: provider.id,
      providerName: provider.name,

      mode: provider.live
        ? "live"
        : "demo",

      payload,

      file: state.file,

      previewUrl: state.previewUrl,

      requiresBackend: Boolean(provider.live),

      message: provider.live
        ? "Voice sample is prepared. A secure backend/provider integration is required for actual voice processing."
        : "Demo voice sample is ready."
    };
  }

  /* ---------------------------------------------------------
     16. File input helper
     --------------------------------------------------------- */

  async function handleInput(input) {
    if (!input || !input.files) {
      return {
        success: false,
        errors: ["Invalid file input."]
      };
    }

    const file = input.files[0];

    if (!file) {
      return {
        success: false,
        errors: ["No voice sample selected."]
      };
    }

    return load(file);
  }

  /* ---------------------------------------------------------
     17. Destroy
     --------------------------------------------------------- */

  function destroy() {
    clear();

    Object.keys(EVENTS).forEach(
      (eventName) => {
        EVENTS[eventName] = [];
      }
    );
  }

  /* ---------------------------------------------------------
     18. Public API
     --------------------------------------------------------- */

  const Voice = {
    /* lifecycle */
    load,
    loadSample,
    setSample,
    clear,
    reset,
    destroy,

    /* input */
    handleInput,
    validateFile,

    /* file */
    getFile,
    getSample,
    getPreviewUrl,
    getMetadata,
    getDuration,

    /* readiness */
    isReady,
    getReadiness,

    /* provider */
    setProvider,
    getProvider,
    getSupportedProviders,
    supportsProvider,
    prepareForProvider,

    /* payload */
    buildPayload,
    appendToFormData,

    /* state */
    getState,

    /* events */
    on,

    /* constants */
    MAX_FILE_SIZE,
    MAX_FILE_SIZE_LABEL: formatBytes(
      MAX_FILE_SIZE
    ),
    SUPPORTED_EXTENSIONS:
      SUPPORTED_EXTENSIONS.slice(),
    SUPPORTED_MIME_TYPES:
      SUPPORTED_MIME_TYPES.slice()
  };

  /* ---------------------------------------------------------
     19. Expose
     --------------------------------------------------------- */

  window.SNKAI.Voice = Voice;

  /* ---------------------------------------------------------
     20. Initial event
     --------------------------------------------------------- */

  emit("ready", {
    engine: "voice",
    version: "1.0.0"
  });

  console.log(
    "%cSNK AI Mentor%c Voice Engine loaded.",
    "font-weight:700;color:#7dd3fc;",
    "font-weight:400;color:inherit;"
  );
})();
