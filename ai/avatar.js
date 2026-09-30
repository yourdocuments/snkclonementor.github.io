/* =========================================================
   SNK AI MENTOR
   ai/avatar.js
   ---------------------------------------------------------
   AI AVATAR ENGINE
   ---------------------------------------------------------

   Responsibilities:
   1. Mentor face video validation
   2. Avatar source management
   3. Avatar settings
   4. Provider readiness check
   5. Avatar generation payload
   6. Future API integration point
   7. Demo-mode avatar simulation
   8. Event system for other modules

   IMPORTANT:
   Real AI face cloning/generation should be handled by
   a secure backend/provider. Never expose private API keys
   inside GitHub Pages JavaScript.
   ========================================================= */

(() => {

  "use strict";


  /* ---------------------------------------------------------
     1. GLOBAL NAMESPACE
     --------------------------------------------------------- */

  window.SNKAI = window.SNKAI || {};


  /* ---------------------------------------------------------
     2. INTERNAL STATE
     --------------------------------------------------------- */

  const state = {

    initialized: false,

    source: null,

    sourceType: "video",

    fileName: "",

    fileSize: 0,

    fileType: "",

    objectUrl: "",

    ready: false,

    processing: false,

    progress: 0,

    jobId: null,

    error: null,

    settings: {

      position: "right",

      size: "medium",

      background: "studio",

      crop: "contain",

      mirror: false,

      enabled: true

    }

  };


  /* ---------------------------------------------------------
     3. EVENT SYSTEM
     --------------------------------------------------------- */

  const events = {};


  function on(eventName, callback) {

    if (typeof callback !== "function") {
      return;
    }

    if (!events[eventName]) {
      events[eventName] = [];
    }

    events[eventName].push(callback);

  }


  function off(eventName, callback) {

    if (!events[eventName]) {
      return;
    }

    events[eventName] =
      events[eventName].filter(
        fn => fn !== callback
      );

  }


  function emit(eventName, data = {}) {

    if (!events[eventName]) {
      return;
    }

    events[eventName].forEach(
      callback => {

        try {

          callback(data);

        } catch (err) {

          console.error(
            "[SNK AI Avatar]",
            err
          );

        }

      }
    );

  }


  /* ---------------------------------------------------------
     4. FILE VALIDATION
     --------------------------------------------------------- */

  function validateVideoFile(file) {

    const result = {

      valid: false,

      error: "",

      file: file || null

    };


    if (!file) {

      result.error =
        "No mentor face video selected.";

      return result;

    }


    if (!file.type) {

      result.error =
        "The selected file type could not be detected.";

      return result;

    }


    if (!file.type.startsWith("video/")) {

      result.error =
        "Please select a valid video file.";

      return result;

    }


    const config =
      window.SNKAI.AIConfig
        ? window.SNKAI.AIConfig.getConfig()
        : null;


    const maxMB =
      config &&
      config.limits &&
      config.limits.faceVideoMB
        ? config.limits.faceVideoMB
        : 500;


    const maxBytes =
      maxMB * 1024 * 1024;


    if (file.size > maxBytes) {

      result.error =
        `Video is too large. Maximum allowed size is ${maxMB} MB.`;

      return result;

    }


    result.valid = true;

    return result;

  }


  /* ---------------------------------------------------------
     5. SET VIDEO SOURCE
     --------------------------------------------------------- */

  function setSource(file) {

    const validation =
      validateVideoFile(file);


    if (!validation.valid) {

      state.error =
        validation.error;

      state.ready = false;

      emit(
        "error",
        {
          message: validation.error
        }
      );

      return false;

    }


    clearObjectUrl();


    state.source = file;

    state.sourceType = "video";

    state.fileName = file.name;

    state.fileSize = file.size;

    state.fileType = file.type;

    state.objectUrl =
      URL.createObjectURL(file);

    state.ready = true;

    state.error = null;

    state.progress = 100;


    emit(
      "sourceChanged",
      getState()
    );


    emit(
      "ready",
      getState()
    );


    return true;

  }


  /* ---------------------------------------------------------
     6. CLEAR SOURCE
     --------------------------------------------------------- */

  function clearSource() {

    clearObjectUrl();


    state.source = null;

    state.fileName = "";

    state.fileSize = 0;

    state.fileType = "";

    state.objectUrl = "";

    state.ready = false;

    state.processing = false;

    state.progress = 0;

    state.jobId = null;

    state.error = null;


    emit(
      "sourceCleared",
      getState()
    );

  }


  /* ---------------------------------------------------------
     7. OBJECT URL CLEANUP
     --------------------------------------------------------- */

  function clearObjectUrl() {

    if (state.objectUrl) {

      try {

        URL.revokeObjectURL(
          state.objectUrl
        );

      } catch (err) {

        console.warn(
          "[SNK AI Avatar] URL cleanup failed.",
          err
        );

      }

    }

  }


  /* ---------------------------------------------------------
     8. SET AVATAR SETTINGS
     --------------------------------------------------------- */

  function setSettings(newSettings = {}) {

    state.settings = {

      ...state.settings,

      ...newSettings

    };


    emit(
      "settingsChanged",
      getSettings()
    );


    return getSettings();

  }


  /* ---------------------------------------------------------
     9. UPDATE SINGLE SETTING
     --------------------------------------------------------- */

  function setSetting(key, value) {

    if (!key) {
      return false;
    }

    state.settings[key] =
      value;


    emit(
      "settingsChanged",
      getSettings()
    );


    return true;

  }


  /* ---------------------------------------------------------
     10. GET SETTINGS
     --------------------------------------------------------- */

  function getSettings() {

    return {
      ...state.settings
    };

  }


  /* ---------------------------------------------------------
     11. POSITION PRESETS
     --------------------------------------------------------- */

  function setPosition(position) {

    const allowed = [

      "left",

      "center",

      "right"

    ];


    if (!allowed.includes(position)) {

      return false;

    }


    return setSetting(
      "position",
      position
    );

  }


  /* ---------------------------------------------------------
     12. SIZE PRESETS
     --------------------------------------------------------- */

  function setSize(size) {

    const allowed = [

      "small",

      "medium",

      "large"

    ];


    if (!allowed.includes(size)) {

      return false;

    }


    return setSetting(
      "size",
      size
    );

  }


  /* ---------------------------------------------------------
     13. BACKGROUND PRESETS
     --------------------------------------------------------- */

  function setBackground(background) {

    const allowed = [

      "studio",

      "transparent",

      "white",

      "dark",

      "custom"

    ];


    if (!allowed.includes(background)) {

      return false;

    }


    return setSetting(
      "background",
      background
    );

  }


  /* ---------------------------------------------------------
     14. MIRROR
     --------------------------------------------------------- */

  function setMirror(enabled) {

    return setSetting(
      "mirror",
      Boolean(enabled)
    );

  }


  /* ---------------------------------------------------------
     15. ENABLE / DISABLE
     --------------------------------------------------------- */

  function setEnabled(enabled) {

    return setSetting(
      "enabled",
      Boolean(enabled)
    );

  }


  /* ---------------------------------------------------------
     16. PROVIDER CAPABILITY CHECK
     --------------------------------------------------------- */

  function checkProvider() {

    const AIConfig =
      window.SNKAI.AIConfig;


    if (!AIConfig) {

      return {

        available: false,

        message:
          "AI configuration module is not loaded."

      };

    }


    const provider =
      AIConfig.getProvider();


    if (!provider) {

      return {

        available: false,

        message:
          "No AI avatar provider is configured."

      };

    }


    const capabilities =
      provider.capabilities || {};


    if (!capabilities.avatar) {

      return {

        available: false,

        message:
          "The current provider does not support AI avatar generation."

      };

    }


    return {

      available: true,

      provider: provider

    };

  }


  /* ---------------------------------------------------------
     17. BUILD AVATAR PAYLOAD
     --------------------------------------------------------- */

  function buildPayload(options = {}) {

    return {

      type: "avatar-generation",

      source: {

        name: state.fileName,

        mimeType: state.fileType,

        size: state.fileSize

      },

      settings: {

        ...state.settings,

        ...(options.settings || {})

      },

      mentor: {

        name:
          options.mentorName ||
          "SNK AI Mentor"

      },

      output: {

        format:
          options.format ||
          "mp4",

        resolution:
          options.resolution ||
          "1080p",

        aspectRatio:
          options.aspectRatio ||
          "16:9"

      },

      createdAt:
        new Date().toISOString()

    };

  }


  /* ---------------------------------------------------------
     18. DEMO AVATAR PROCESS
     --------------------------------------------------------- */

  function demoGenerate(options = {}) {

    if (!state.ready) {

      const message =
        "Please upload a mentor face video first.";

      state.error = message;

      emit(
        "error",
        {
          message
        }
      );

      return Promise.reject(
        new Error(message)
      );

    }


    state.processing = true;

    state.progress = 0;

    state.error = null;


    emit(
      "generationStarted",
      getState()
    );


    return new Promise(resolve => {

      let progress = 0;


      const timer =
        setInterval(() => {

          progress += 10;

          state.progress =
            Math.min(
              progress,
              100
            );


          emit(
            "progress",
            {
              progress:
                state.progress
            }
          );


          if (progress >= 100) {

            clearInterval(timer);


            state.processing =
              false;


            state.jobId =
              "demo-avatar-" +
              Date.now();


            emit(
              "generationCompleted",
              {
                jobId:
                  state.jobId,

                payload:
                  buildPayload(options),

                demo: true
              }
            );


            resolve({

              success: true,

              demo: true,

              jobId:
                state.jobId,

              payload:
                buildPayload(options)

            });

          }

        }, 120);

    });

  }


  /* ---------------------------------------------------------
     19. LIVE GENERATION
     --------------------------------------------------------- */

  async function generate(options = {}) {

    const AIConfig =
      window.SNKAI.AIConfig;


    if (!AIConfig) {

      const error =
        new Error(
          "AI configuration is not loaded."
        );

      state.error =
        error.message;

      emit(
        "error",
        {
          message:
            error.message
        }
      );

      throw error;

    }


    if (!state.ready) {

      const error =
        new Error(
          "Please upload a mentor face video first."
        );

      state.error =
        error.message;

      emit(
        "error",
        {
          message:
            error.message
        }
      );

      throw error;

    }


    const config =
      AIConfig.getConfig();


    /*
     * Demo mode
     */

    if (
      config.mode === "demo"
    ) {

      return demoGenerate(
        options
      );

    }


    /*
     * Live mode
     */

    const url =
      AIConfig.getGenerateUrl();


    if (!url) {

      const error =
        new Error(
          "AI avatar generation endpoint is not configured."
        );

      state.error =
        error.message;

      emit(
        "error",
        {
          message:
            error.message
        }
      );

      throw error;

    }


    state.processing = true;

    state.progress = 5;

    state.error = null;


    emit(
      "generationStarted",
      getState()
    );


    try {

      /*
       * NOTE:
       * This is the generic integration point.
       *
       * The exact request format will be adapted when
       * the real provider/backend is selected.
       */

      const payload =
        buildPayload(options);


      const response =
        await fetch(
          url,
          {

            method: "POST",

            headers:
              AIConfig.buildHeaders(),

            body:
              JSON.stringify(payload)

          }
        );


      if (!response.ok) {

        throw new Error(
          `Avatar API request failed (${response.status}).`
        );

      }


      const data =
        await response.json();


      state.progress = 100;

      state.processing = false;

      state.jobId =
        data.jobId ||
        data.id ||
        null;


      emit(
        "generationCompleted",
        {

          jobId:
            state.jobId,

          response:
            data,

          demo: false

        }
      );


      return {

        success: true,

        demo: false,

        jobId:
          state.jobId,

        response:
          data

      };

    } catch (err) {

      state.processing = false;

      state.error =
        err.message ||
        "Avatar generation failed.";

      emit(
        "error",
        {
          message:
            state.error
        }
      );

      throw err;

    }

  }


  /* ---------------------------------------------------------
     20. CANCEL GENERATION
     --------------------------------------------------------- */

  function cancel() {

    if (!state.processing) {

      return false;

    }


    state.processing = false;

    state.error =
      "Avatar generation cancelled.";


    emit(
      "cancelled",
      getState()
    );


    return true;

  }


  /* ---------------------------------------------------------
     21. GET STATE
     --------------------------------------------------------- */

  function getState() {

    return {

      initialized:
        state.initialized,

      sourceType:
        state.sourceType,

      fileName:
        state.fileName,

      fileSize:
        state.fileSize,

      fileType:
        state.fileType,

      objectUrl:
        state.objectUrl,

      ready:
        state.ready,

      processing:
        state.processing,

      progress:
        state.progress,

      jobId:
        state.jobId,

      error:
        state.error,

      settings:
        getSettings()

    };

  }


  /* ---------------------------------------------------------
     22. RESET
     --------------------------------------------------------- */

  function reset() {

    clearSource();


    state.settings = {

      position: "right",

      size: "medium",

      background: "studio",

      crop: "contain",

      mirror: false,

      enabled: true

    };


    state.error = null;


    emit(
      "reset",
      getState()
    );

  }


  /* ---------------------------------------------------------
     23. INITIALIZE
     --------------------------------------------------------- */

  function init() {

    if (state.initialized) {

      return getState();

    }


    state.initialized = true;


    /*
     * Use defaults from AI config when available.
     */

    if (
      window.SNKAI.AIConfig
    ) {

      const config =
        window.SNKAI.AIConfig;


      const avatar =
        config.getAvatarSettings();


      if (avatar) {

        state.settings.position =
          avatar.defaultPosition ||
          state.settings.position;

        state.settings.background =
          avatar.defaultBackground ||
          state.settings.background;

        state.settings.enabled =
          avatar.enabled !== undefined
            ? avatar.enabled
            : state.settings.enabled;

      }

    }


    emit(
      "initialized",
      getState()
    );


    return getState();

  }


  /* ---------------------------------------------------------
     24. PUBLIC API
     --------------------------------------------------------- */

  const Avatar = {

    init,

    on,

    off,

    emit,

    getState,

    getSettings,

    setSettings,

    setSetting,

    setSource,

    clearSource,

    validateVideoFile,

    setPosition,

    setSize,

    setBackground,

    setMirror,

    setEnabled,

    checkProvider,

    buildPayload,

    generate,

    cancel,

    reset

  };


  /* ---------------------------------------------------------
     25. EXPORT
     --------------------------------------------------------- */

  window.SNKAI.Avatar =
    Avatar;


  /* ---------------------------------------------------------
     26. AUTO INITIALIZE
     --------------------------------------------------------- */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      () => Avatar.init(),
      {
        once: true
      }
    );

  } else {

    Avatar.init();

  }


})();
