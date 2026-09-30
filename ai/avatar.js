/* =========================================================
   SNK AI MENTOR — AVATAR ENGINE
   File: ai/avatar.js

   STEP 26
   ---------------------------------------------------------
   Personal Face / Avatar preparation engine.

   Responsibilities:
   - Receive personal face video
   - Validate avatar source
   - Read video metadata
   - Create preview URL
   - Store temporary in-memory asset
   - Prepare provider-independent avatar payload
   - Expose readiness state
   - Provide clean API for future providers

   IMPORTANT:
   This browser-side engine does NOT clone a real face.
   Actual avatar generation must be handled by an
   authorized external AI provider / backend.
   ========================================================= */

(() => {
  "use strict";


  /* =======================================================
     01. GLOBAL NAMESPACE
     ======================================================= */

  window.SNKAI = window.SNKAI || {};


  /* =======================================================
     02. CONSTANTS
     ======================================================= */

  const MAX_FILE_SIZE =
    500 * 1024 * 1024;

  const ALLOWED_TYPES = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-m4v"
  ];


  /* =======================================================
     03. STATE
     ======================================================= */

  const state = {

    ready: false,

    file: null,

    objectUrl: "",

    metadata: {

      name: "",

      type: "",

      size: 0,

      duration: 0,

      width: 0,

      height: 0
    },

    status:
      "No avatar video selected",

    error: "",

    updatedAt: null
  };


  /* =======================================================
     04. EVENTS
     ======================================================= */

  const listeners = new Map();


  function on(
    eventName,
    callback
  ) {

    if (
      typeof callback !==
      "function"
    ) {
      return () => {};
    }


    if (
      !listeners.has(
        eventName
      )
    ) {

      listeners.set(
        eventName,
        new Set()
      );
    }


    listeners
      .get(eventName)
      .add(callback);


    return () => {

      listeners
        .get(eventName)
        ?.delete(callback);
    };
  }


  function emit(
    eventName,
    data
  ) {

    const callbacks =
      listeners.get(eventName);


    if (!callbacks) {
      return;
    }


    callbacks.forEach(
      (callback) => {

        try {

          callback(
            data,
            getState()
          );

        } catch (error) {

          console.error(
            "SNK Avatar event error:",
            error
          );
        }
      }
    );
  }


  /* =======================================================
     05. HELPERS
     ======================================================= */

  function formatBytes(
    bytes
  ) {

    if (
      !bytes ||
      bytes <= 0
    ) {
      return "0 KB";
    }


    const units = [
      "Bytes",
      "KB",
      "MB",
      "GB"
    ];


    const index =
      Math.min(
        Math.floor(
          Math.log(bytes) /
          Math.log(1024)
        ),
        units.length - 1
      );


    return `${(
      bytes /
      Math.pow(1024, index)
    ).toFixed(
      index === 0
        ? 0
        : 1
    )} ${units[index]}`;
  }


  function normalizeType(
    file
  ) {

    if (!file) {
      return "";
    }


    return (
      file.type ||
      ""
    ).toLowerCase();
  }


  function isVideoFile(
    file
  ) {

    if (!file) {
      return false;
    }


    const type =
      normalizeType(file);


    return (
      type.startsWith(
        "video/"
      ) ||
      ALLOWED_TYPES.includes(
        type
      )
    );
  }


  function isWithinSizeLimit(
    file
  ) {

    return Boolean(
      file &&
      file.size <=
        MAX_FILE_SIZE
    );
  }


  function revokeObjectUrl() {

    if (
      state.objectUrl
    ) {

      try {

        URL.revokeObjectURL(
          state.objectUrl
        );

      } catch (error) {

        console.warn(
          "Could not revoke avatar URL.",
          error
        );
      }
    }


    state.objectUrl = "";
  }


  function resetMetadata() {

    state.metadata = {

      name: "",

      type: "",

      size: 0,

      duration: 0,

      width: 0,

      height: 0
    };
  }


  /* =======================================================
     06. VALIDATION
     ======================================================= */

  function validateFile(
    file
  ) {

    if (!file) {

      return {
        valid: false,
        message:
          "No face video was selected."
      };
    }


    if (
      !isVideoFile(file)
    ) {

      return {
        valid: false,
        message:
          "Please select a valid video file."
      };
    }


    if (
      !isWithinSizeLimit(file)
    ) {

      return {
        valid: false,
        message:
          "Face video must be smaller than 500 MB."
      };
    }


    return {
      valid: true,
      message:
        "Face video is valid."
    };
  }


  /* =======================================================
     07. READ VIDEO METADATA
     ======================================================= */

  function readVideoMetadata(
    file,
    objectUrl
  ) {

    return new Promise(
      (resolve, reject) => {

        const video =
          document.createElement(
            "video"
          );


        video.preload =
          "metadata";


        video.muted =
          true;


        video.playsInline =
          true;


        const cleanup = () => {

          video.removeAttribute(
            "src"
          );

          video.load();
        };


        video.addEventListener(
          "loadedmetadata",
          () => {

            const metadata = {

              name:
                file.name,

              type:
                file.type ||
                "video",

              size:
                file.size,

              duration:
                Number(
                  video.duration
                ) || 0,

              width:
                Number(
                  video.videoWidth
                ) || 0,

              height:
                Number(
                  video.videoHeight
                ) || 0
            };


            cleanup();

            resolve(
              metadata
            );
          },
          {
            once: true
          }
        );


        video.addEventListener(
          "error",
          () => {

            cleanup();

            reject(
              new Error(
                "The selected video could not be read."
              )
            );

          },
          {
            once: true
          }
        );


        video.src =
          objectUrl;
      }
    );
  }


  /* =======================================================
     08. LOAD AVATAR VIDEO
     ======================================================= */

  async function load(
    file
  ) {

    const validation =
      validateFile(file);


    if (
      !validation.valid
    ) {

      state.ready =
        false;

      state.error =
        validation.message;

      state.status =
        validation.message;


      emit(
        "error",
        {
          message:
            validation.message
        }
      );


      throw new Error(
        validation.message
      );
    }


    revokeObjectUrl();


    resetMetadata();


    const objectUrl =
      URL.createObjectURL(
        file
      );


    try {

      const metadata =
        await readVideoMetadata(
          file,
          objectUrl
        );


      state.file =
        file;


      state.objectUrl =
        objectUrl;


      state.metadata =
        metadata;


      state.ready =
        true;


      state.error =
        "";


      state.status =
        "Avatar video ready";


      state.updatedAt =
        new Date().toISOString();


      emit(
        "loaded",
        {
          file,
          metadata
        }
      );


      emit(
        "change",
        getState()
      );


      return getState();

    } catch (error) {

      try {

        URL.revokeObjectURL(
          objectUrl
        );

      } catch (_) {}


      state.file =
        null;


      state.objectUrl =
        "";


      state.ready =
        false;


      state.error =
        error?.message ||
        "Unable to read avatar video.";


      state.status =
        state.error;


      emit(
        "error",
        {
          message:
            state.error
        }
      );


      throw error;
    }
  }


  /* =======================================================
     09. CLEAR AVATAR
     ======================================================= */

  function clear() {

    revokeObjectUrl();


    state.file =
      null;


    state.ready =
      false;


    state.error =
      "";


    state.status =
      "No avatar video selected";


    state.updatedAt =
      new Date().toISOString();


    resetMetadata();


    emit(
      "clear",
      getState()
    );


    emit(
      "change",
      getState()
    );
  }


  /* =======================================================
     10. GET PREVIEW URL
     ======================================================= */

  function getPreviewUrl() {

    return (
      state.objectUrl ||
      ""
    );
  }


  /* =======================================================
     11. GET FILE
     ======================================================= */

  function getFile() {

    return (
      state.file ||
      null
    );
  }


  /* =======================================================
     12. GET METADATA
     ======================================================= */

  function getMetadata() {

    return {
      ...state.metadata
    };
  }


  /* =======================================================
     13. READINESS
     ======================================================= */

  function isReady() {

    return Boolean(
      state.ready &&
      state.file
    );
  }


  function getReadiness() {

    if (!state.file) {

      return {
        ready: false,

        status:
          "Face video required",

        message:
          "Upload a personal face video first."
      };
    }


    if (!state.ready) {

      return {
        ready: false,

        status:
          "Preparing avatar",

        message:
          state.error ||
          "Avatar video is being prepared."
      };
    }


    return {
      ready: true,

      status:
        "Avatar ready",

      message:
        "Face video is ready for the AI avatar pipeline."
    };
  }


  /* =======================================================
     14. BUILD PROVIDER PAYLOAD
     ======================================================= */

  function buildPayload(
    options = {}
  ) {

    const metadata =
      getMetadata();


    return {

      type:
        "personal-avatar",

      source:
        "face-video",

      sourceFile: {

        name:
          metadata.name,

        type:
          metadata.type,

        size:
          metadata.size,

        duration:
          metadata.duration,

        width:
          metadata.width,

        height:
          metadata.height
      },

      options: {

        avatarName:
          options.avatarName ||
          "SNK AI Mentor",

        provider:
          options.provider ||
          "demo",

        consentConfirmed:
          Boolean(
            options.consentConfirmed
          )
      }
    };
  }


  /* =======================================================
     15. FORM DATA HELPER
     ======================================================= */

  function appendToFormData(
    formData,
    fieldName = "avatarVideo"
  ) {

    if (
      !formData ||
      typeof formData.append !==
        "function"
    ) {

      throw new Error(
        "A valid FormData object is required."
      );
    }


    if (!state.file) {

      throw new Error(
        "No avatar video is loaded."
      );
    }


    formData.append(
      fieldName,
      state.file,
      state.file.name
    );


    formData.append(
      "avatarType",
      "personal-avatar"
    );


    return formData;
  }


  /* =======================================================
     16. PROVIDER SUPPORT
     ======================================================= */

  function getSupportedProviders() {

    return [
      {
        id: "demo",
        name: "Demo Engine",
        available: true
      },

      {
        id: "custom",
        name: "Custom API",
        available: true
      },

      {
        id: "heygen",
        name: "HeyGen",
        available: true
      },

      {
        id: "synthesia",
        name: "Synthesia",
        available: true
      },

      {
        id: "d-id",
        name: "D-ID",
        available: true
      }
    ];
  }


  function supportsProvider(
    provider
  ) {

    return getSupportedProviders()
      .some(
        (item) =>
          item.id === provider
      );
  }


  /* =======================================================
     17. PROVIDER PREPARATION
     ======================================================= */

  async function prepareForProvider(
    provider,
    options = {}
  ) {

    if (
      !supportsProvider(provider)
    ) {

      throw new Error(
        `Unsupported avatar provider: ${provider}`
      );
    }


    if (!isReady()) {

      throw new Error(
        "Avatar video is not ready."
      );
    }


    const payload =
      buildPayload({
        ...options,
        provider
      });


    /*
     * Demo provider:
     * Browser-side preparation is enough.
     */

    if (
      provider === "demo"
    ) {

      return {

        success: true,

        provider,

        mode: "demo",

        payload
      };
    }


    /*
     * Live providers:
     *
     * We intentionally do not call external
     * provider APIs directly from this file.
     *
     * A secure backend should receive the
     * FormData/file and communicate with the
     * provider using server-side credentials.
     */

    return {

      success: true,

      provider,

      mode: "live",

      payload,

      requiresBackend: true
    };
  }


  /* =======================================================
     18. STATE SNAPSHOT
     ======================================================= */

  function getState() {

    return {

      ready:
        Boolean(
          state.ready
        ),

      hasFile:
        Boolean(
          state.file
        ),

      objectUrl:
        state.objectUrl,

      metadata:
        {
          ...state.metadata
        },

      status:
        state.status,

      error:
        state.error,

      updatedAt:
        state.updatedAt
    };
  }


  /* =======================================================
     19. RESET
     ======================================================= */

  function reset() {

    clear();
  }


  /* =======================================================
     20. PUBLIC API
     ======================================================= */

  window.SNKAI.Avatar = {

    /* File */

    load,

    clear,

    reset,

    getFile,

    getPreviewUrl,

    getMetadata,


    /* Validation */

    validateFile,

    isReady,

    getReadiness,


    /* Provider */

    buildPayload,

    appendToFormData,

    prepareForProvider,

    getSupportedProviders,

    supportsProvider,


    /* State */

    getState,


    /* Events */

    on,


    /* Limits */

    MAX_FILE_SIZE,

    ALLOWED_TYPES
  };


  /* =======================================================
     21. READY EVENT
     ======================================================= */

  emit(
    "ready",
    {
      engine:
        "avatar"
    }
  );


  console.log(
    "SNK AI Mentor: Avatar engine loaded."
  );

})();
