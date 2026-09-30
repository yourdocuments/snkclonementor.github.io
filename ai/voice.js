/* =========================================================
   SNK AI MENTOR
   ai/voice.js
   ---------------------------------------------------------
   AI VOICE ENGINE
   ---------------------------------------------------------

   Responsibilities:
   1. Voice sample upload
   2. Audio validation
   3. Voice preview
   4. Voice profile management
   5. Language / voice settings
   6. Voice generation payload
   7. Demo voice-generation workflow
   8. Future secure API integration
   9. Event system for other modules

   IMPORTANT:
   Private API keys must NEVER be placed in this file.
   Real voice cloning/generation should be handled by a
   secure backend and a compatible AI voice provider.
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

    sourceType: "audio",

    fileName: "",

    fileSize: 0,

    fileType: "",

    objectUrl: "",

    ready: false,

    processing: false,

    progress: 0,

    jobId: null,

    generatedAudioUrl: "",

    error: null,

    settings: {

      language: "auto",

      voiceStyle: "natural",

      speed: 1,

      pitch: 0,

      emotion: "neutral",

      stability: 0.7,

      clarity: 0.8,

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
            "[SNK AI Voice]",
            err
          );

        }

      }
    );

  }


  /* ---------------------------------------------------------
     4. FILE VALIDATION
     --------------------------------------------------------- */

  function validateAudioFile(file) {

    const result = {

      valid: false,

      error: "",

      file: file || null

    };


    if (!file) {

      result.error =
        "No mentor voice sample selected.";

      return result;

    }


    if (!file.type) {

      result.error =
        "The selected audio type could not be detected.";

      return result;

    }


    if (!file.type.startsWith("audio/")) {

      result.error =
        "Please select a valid audio file.";

      return result;

    }


    const config =
      window.SNKAI.AIConfig
        ? window.SNKAI.AIConfig.getConfig()
        : null;


    const maxMB =
      config &&
      config.limits &&
      config.limits.voiceAudioMB
        ? config.limits.voiceAudioMB
        : 200;


    const maxBytes =
      maxMB * 1024 * 1024;


    if (file.size > maxBytes) {

      result.error =
        `Audio is too large. Maximum allowed size is ${maxMB} MB.`;

      return result;

    }


    result.valid = true;

    return result;

  }


  /* ---------------------------------------------------------
     5. SET VOICE SOURCE
     --------------------------------------------------------- */

  function setSource(file) {

    const validation =
      validateAudioFile(file);


    if (!validation.valid) {

      state.error =
        validation.error;

      state.ready = false;

      emit(
        "error",
        {
          message:
            validation.error
        }
      );

      return false;

    }


    clearObjectUrl();


    state.source = file;

    state.sourceType = "audio";

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

    state.generatedAudioUrl = "";

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
          "[SNK AI Voice] URL cleanup failed.",
          err
        );

      }

    }

  }


  /* ---------------------------------------------------------
     8. GENERATED AUDIO CLEANUP
     --------------------------------------------------------- */

  function clearGeneratedAudio() {

    if (state.generatedAudioUrl) {

      try {

        URL.revokeObjectURL(
          state.generatedAudioUrl
        );

      } catch (err) {

        console.warn(
          "[SNK AI Voice] Generated audio cleanup failed.",
          err
        );

      }

    }


    state.generatedAudioUrl = "";

  }


  /* ---------------------------------------------------------
     9. SET ALL SETTINGS
     --------------------------------------------------------- */

  function setSettings(newSettings = {}) {

    state.settings = {

      ...state.settings,

      ...newSettings

    };


    normalizeSettings();


    emit(
      "settingsChanged",
      getSettings()
    );


    return getSettings();

  }


  /* ---------------------------------------------------------
     10. SET SINGLE SETTING
     --------------------------------------------------------- */

  function setSetting(key, value) {

    if (!key) {
      return false;
    }


    state.settings[key] =
      value;


    normalizeSettings();


    emit(
      "settingsChanged",
      getSettings()
    );


    return true;

  }


  /* ---------------------------------------------------------
     11. NORMALIZE SETTINGS
     --------------------------------------------------------- */

  function normalizeSettings() {

    /* Speed */

    const speed =
      Number(state.settings.speed);


    if (
      !Number.isFinite(speed)
    ) {

      state.settings.speed = 1;

    } else {

      state.settings.speed =
        Math.max(
          0.5,
          Math.min(
            2,
            speed
          )
        );

    }


    /* Pitch */

    const pitch =
      Number(state.settings.pitch);


    if (
      !Number.isFinite(pitch)
    ) {

      state.settings.pitch = 0;

    } else {

      state.settings.pitch =
        Math.max(
          -12,
          Math.min(
            12,
            pitch
          )
        );

    }


    /* Stability */

    const stability =
      Number(state.settings.stability);


    if (
      !Number.isFinite(stability)
    ) {

      state.settings.stability =
        0.7;

    } else {

      state.settings.stability =
        Math.max(
          0,
          Math.min(
            1,
            stability
          )
        );

    }


    /* Clarity */

    const clarity =
      Number(state.settings.clarity);


    if (
      !Number.isFinite(clarity)
    ) {

      state.settings.clarity =
        0.8;

    } else {

      state.settings.clarity =
        Math.max(
          0,
          Math.min(
            1,
            clarity
          )
        );

    }


    state.settings.enabled =
      Boolean(
        state.settings.enabled
      );

  }


  /* ---------------------------------------------------------
     12. GET SETTINGS
     --------------------------------------------------------- */

  function getSettings() {

    return {

      ...state.settings

    };

  }


  /* ---------------------------------------------------------
     13. LANGUAGE
     --------------------------------------------------------- */

  function setLanguage(language) {

    const allowed = [

      "auto",

      "bn",

      "en",

      "hi",

      "ar"

    ];


    if (
      !allowed.includes(language)
    ) {

      return false;

    }


    return setSetting(
      "language",
      language
    );

  }


  /* ---------------------------------------------------------
     14. VOICE STYLE
     --------------------------------------------------------- */

  function setVoiceStyle(style) {

    const allowed = [

      "natural",

      "professional",

      "friendly",

      "energetic",

      "calm"

    ];


    if (
      !allowed.includes(style)
    ) {

      return false;

    }


    return setSetting(
      "voiceStyle",
      style
    );

  }


  /* ---------------------------------------------------------
     15. EMOTION
     --------------------------------------------------------- */

  function setEmotion(emotion) {

    const allowed = [

      "neutral",

      "happy",

      "serious",

      "excited",

      "calm"

    ];


    if (
      !allowed.includes(emotion)
    ) {

      return false;

    }


    return setSetting(
      "emotion",
      emotion
    );

  }


  /* ---------------------------------------------------------
     16. SPEED
     --------------------------------------------------------- */

  function setSpeed(speed) {

    return setSetting(
      "speed",
      Number(speed)
    );

  }


  /* ---------------------------------------------------------
     17. PITCH
     --------------------------------------------------------- */

  function setPitch(pitch) {

    return setSetting(
      "pitch",
      Number(pitch)
    );

  }


  /* ---------------------------------------------------------
     18. ENABLE / DISABLE
     --------------------------------------------------------- */

  function setEnabled(enabled) {

    return setSetting(
      "enabled",
      Boolean(enabled)
    );

  }


  /* ---------------------------------------------------------
     19. PROVIDER CHECK
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
          "No AI voice provider is configured."

      };

    }


    const capabilities =
      provider.capabilities || {};


    if (!capabilities.voice) {

      return {

        available: false,

        message:
          "The current provider does not support AI voice generation."

      };

    }


    return {

      available: true,

      provider

    };

  }


  /* ---------------------------------------------------------
     20. BUILD VOICE PAYLOAD
     --------------------------------------------------------- */

  function buildPayload(options = {}) {

    const settings = {

      ...state.settings,

      ...(options.settings || {})

    };


    return {

      type:
        "voice-generation",


      source: {

        name:
          state.fileName,

        mimeType:
          state.fileType,

        size:
          state.fileSize

      },


      voice: {

        language:
          settings.language,

        style:
          settings.voiceStyle,

        speed:
          settings.speed,

        pitch:
          settings.pitch,

        emotion:
          settings.emotion,

        stability:
          settings.stability,

        clarity:
          settings.clarity

      },


      text:
        options.text ||
        "",


      mentor: {

        name:
          options.mentorName ||
          "SNK AI Mentor"

      },


      output: {

        format:
          options.format ||
          "mp3"

      },


      createdAt:
        new Date().toISOString()

    };

  }


  /* ---------------------------------------------------------
     21. DEMO VOICE GENERATION
     --------------------------------------------------------- */

  function demoGenerate(options = {}) {

    if (!state.ready) {

      const message =
        "Please upload a mentor voice sample first.";

      state.error =
        message;

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


    if (
      !options.text ||
      !String(options.text).trim()
    ) {

      const message =
        "Please provide lesson text for voice generation.";

      state.error =
        message;

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


    clearGeneratedAudio();


    emit(
      "generationStarted",
      getState()
    );


    return new Promise(resolve => {

      let progress = 0;


      const timer =
        setInterval(
          () => {

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


            if (
              progress >= 100
            ) {

              clearInterval(timer);


              state.processing =
                false;


              state.jobId =
                "demo-voice-" +
                Date.now();


              /*
               * Demo mode does not actually clone a voice.
               * We return the generation payload so the
               * future provider adapter can consume it.
               */

              const payload =
                buildPayload(
                  options
                );


              emit(
                "generationCompleted",
                {

                  jobId:
                    state.jobId,

                  payload,

                  demo: true

                }
              );


              resolve({

                success: true,

                demo: true,

                jobId:
                  state.jobId,

                payload

              });

            }

          },
          120
        );

    });

  }


  /* ---------------------------------------------------------
     22. LIVE VOICE GENERATION
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
          "Please upload a mentor voice sample first."
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


    if (
      !options.text ||
      !String(options.text).trim()
    ) {

      const error =
        new Error(
          "Lesson text is required."
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


    /* -------------------------------------------------------
       DEMO MODE
       ------------------------------------------------------- */

    if (
      config.mode === "demo"
    ) {

      return demoGenerate(
        options
      );

    }


    /* -------------------------------------------------------
       LIVE MODE
       ------------------------------------------------------- */

    const url =
      AIConfig.getGenerateUrl();


    if (!url) {

      const error =
        new Error(
          "AI voice generation endpoint is not configured."
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

      const payload =
        buildPayload(
          options
        );


      /*
       * Generic backend integration point.
       *
       * The exact provider request format will be added
       * after the actual AI provider is selected.
       */

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
          `Voice API request failed (${response.status}).`
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


      /*
       * Some future providers may return an audio URL.
       */

      state.generatedAudioUrl =
        data.audioUrl ||
        data.audio_url ||
        data.outputUrl ||
        "";


      emit(
        "generationCompleted",
        {

          jobId:
            state.jobId,

          response:
            data,

          audioUrl:
            state.generatedAudioUrl,

          demo: false

        }
      );


      return {

        success: true,

        demo: false,

        jobId:
          state.jobId,

        audioUrl:
          state.generatedAudioUrl,

        response:
          data

      };

    } catch (err) {

      state.processing = false;

      state.error =
        err.message ||
        "Voice generation failed.";


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
     23. DOWNLOAD GENERATED AUDIO
     --------------------------------------------------------- */

  function downloadGeneratedAudio(
    fileName = "snk-ai-mentor-voice.mp3"
  ) {

    if (
      !state.generatedAudioUrl
    ) {

      return false;

    }


    const link =
      document.createElement(
        "a"
      );


    link.href =
      state.generatedAudioUrl;


    link.download =
      fileName;


    document.body.appendChild(
      link
    );


    link.click();


    link.remove();


    return true;

  }


  /* ---------------------------------------------------------
     24. GET STATE
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

      generatedAudioUrl:
        state.generatedAudioUrl,

      error:
        state.error,

      settings:
        getSettings()

    };

  }


  /* ---------------------------------------------------------
     25. RESET
     --------------------------------------------------------- */

  function reset() {

    clearSource();

    clearGeneratedAudio();


    state.settings = {

      language: "auto",

      voiceStyle: "natural",

      speed: 1,

      pitch: 0,

      emotion: "neutral",

      stability: 0.7,

      clarity: 0.8,

      enabled: true

    };


    state.error = null;


    emit(
      "reset",
      getState()
    );

  }


  /* ---------------------------------------------------------
     26. INITIALIZE
     --------------------------------------------------------- */

  function init() {

    if (
      state.initialized
    ) {

      return getState();

    }


    state.initialized = true;


    /*
     * Read defaults from ai-config.js
     */

    if (
      window.SNKAI.AIConfig
    ) {

      const config =
        window.SNKAI.AIConfig;


      const voice =
        config.getVoiceSettings();


      if (voice) {

        state.settings.language =
          voice.language ||
          state.settings.language;

      }

    }


    normalizeSettings();


    emit(
      "initialized",
      getState()
    );


    return getState();

  }


  /* ---------------------------------------------------------
     27. PUBLIC API
     --------------------------------------------------------- */

  const Voice = {

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

    validateAudioFile,

    setLanguage,

    setVoiceStyle,

    setEmotion,

    setSpeed,

    setPitch,

    setEnabled,

    checkProvider,

    buildPayload,

    generate,

    cancel: () => {

      if (!state.processing) {
        return false;
      }


      state.processing = false;

      state.error =
        "Voice generation cancelled.";


      emit(
        "cancelled",
        getState()
      );


      return true;

    },

    downloadGeneratedAudio,

    reset

  };


  /* ---------------------------------------------------------
     28. EXPORT
     --------------------------------------------------------- */

  window.SNKAI.Voice =
    Voice;


  /* ---------------------------------------------------------
     29. AUTO INITIALIZE
     --------------------------------------------------------- */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      () => Voice.init(),
      {
        once: true
      }
    );

  } else {

    Voice.init();

  }


})();
