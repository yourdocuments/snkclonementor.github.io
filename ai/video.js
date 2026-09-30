/* =========================================================
   SNK AI MENTOR
   ai/video.js
   ---------------------------------------------------------
   AI VIDEO ENGINE
   ---------------------------------------------------------

   FLOW:

   Mentor Face
        +
   Mentor Voice
        +
   Lesson Script
        +
   Video Settings
        ↓
   AI VIDEO JOB
        ↓
   Processing / Status
        ↓
   Generated Video

   IMPORTANT:
   This is a provider-independent integration layer.

   GitHub Pages cannot safely store private AI API keys.
   The real provider/backend will be connected later.
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

    processing: false,

    progress: 0,

    status: "idle",

    jobId: null,

    videoUrl: "",

    thumbnailUrl: "",

    downloadUrl: "",

    error: null,

    startedAt: null,

    completedAt: null,

    script: "",

    settings: {

      format: "mp4",

      resolution: "1080p",

      aspectRatio: "16:9",

      fps: 30,

      mentorPosition: "right",

      background: "studio",

      subtitles: false,

      audio: true

    }

  };


  /* ---------------------------------------------------------
     3. EVENT SYSTEM
     --------------------------------------------------------- */

  const events = {};


  function on(eventName, callback) {

    if (
      typeof callback !== "function"
    ) {
      return;
    }


    if (
      !events[eventName]
    ) {
      events[eventName] = [];
    }


    events[eventName].push(
      callback
    );

  }


  function off(eventName, callback) {

    if (
      !events[eventName]
    ) {
      return;
    }


    events[eventName] =
      events[eventName].filter(
        fn => fn !== callback
      );

  }


  function emit(
    eventName,
    data = {}
  ) {

    if (
      !events[eventName]
    ) {
      return;
    }


    events[eventName].forEach(
      callback => {

        try {

          callback(data);

        } catch (err) {

          console.error(
            "[SNK AI Video]",
            err
          );

        }

      }
    );

  }


  /* ---------------------------------------------------------
     4. GET CONFIG
     --------------------------------------------------------- */

  function getConfig() {

    if (
      window.SNKAI.AIConfig
    ) {

      return window.SNKAI.AIConfig
        .getConfig();

    }


    return {

      mode: "demo",

      provider: "custom",

      output: {

        format: "mp4",

        resolution: "1080p",

        aspectRatio: "16:9",

        fps: 30

      },

      generation: {

        timeout:
          10 * 60 * 1000,

        pollingInterval:
          3000,

        maxRetries: 3

      }

    };

  }


  /* ---------------------------------------------------------
     5. SET SCRIPT
     --------------------------------------------------------- */

  function setScript(script) {

    state.script =
      String(
        script || ""
      );


    emit(
      "scriptChanged",
      {
        script:
          state.script,

        characters:
          state.script.length,

        words:
          countWords(
            state.script
          )
      }
    );


    return state.script;

  }


  /* ---------------------------------------------------------
     6. GET SCRIPT
     --------------------------------------------------------- */

  function getScript() {

    return state.script;

  }


  /* ---------------------------------------------------------
     7. WORD COUNT
     --------------------------------------------------------- */

  function countWords(text) {

    if (
      !text ||
      !String(text).trim()
    ) {

      return 0;

    }


    return String(text)
      .trim()
      .split(/\s+/)
      .length;

  }


  /* ---------------------------------------------------------
     8. SET VIDEO SETTINGS
     --------------------------------------------------------- */

  function setSettings(
    newSettings = {}
  ) {

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
     9. SET SINGLE SETTING
     --------------------------------------------------------- */

  function setSetting(
    key,
    value
  ) {

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
     10. NORMALIZE SETTINGS
     --------------------------------------------------------- */

  function normalizeSettings() {

    const allowedFormats = [

      "mp4",

      "webm"

    ];


    if (
      !allowedFormats.includes(
        state.settings.format
      )
    ) {

      state.settings.format =
        "mp4";

    }


    const allowedResolutions = [

      "720p",

      "1080p",

      "1440p",

      "2160p"

    ];


    if (
      !allowedResolutions.includes(
        state.settings.resolution
      )
    ) {

      state.settings.resolution =
        "1080p";

    }


    const allowedRatios = [

      "16:9",

      "9:16",

      "1:1",

      "4:5"

    ];


    if (
      !allowedRatios.includes(
        state.settings.aspectRatio
      )
    ) {

      state.settings.aspectRatio =
        "16:9";

    }


    const fps =
      Number(
        state.settings.fps
      );


    state.settings.fps =
      Number.isFinite(fps)
        ? Math.max(
            1,
            Math.min(
              60,
              fps
            )
          )
        : 30;


    state.settings.subtitles =
      Boolean(
        state.settings.subtitles
      );


    state.settings.audio =
      Boolean(
        state.settings.audio
      );

  }


  /* ---------------------------------------------------------
     11. GET SETTINGS
     --------------------------------------------------------- */

  function getSettings() {

    return {

      ...state.settings

    };

  }


  /* ---------------------------------------------------------
     12. SET OUTPUT FORMAT
     --------------------------------------------------------- */

  function setFormat(format) {

    return setSetting(
      "format",
      format
    );

  }


  /* ---------------------------------------------------------
     13. SET RESOLUTION
     --------------------------------------------------------- */

  function setResolution(
    resolution
  ) {

    return setSetting(
      "resolution",
      resolution
    );

  }


  /* ---------------------------------------------------------
     14. SET ASPECT RATIO
     --------------------------------------------------------- */

  function setAspectRatio(
    ratio
  ) {

    return setSetting(
      "aspectRatio",
      ratio
    );

  }


  /* ---------------------------------------------------------
     15. SET MENTOR POSITION
     --------------------------------------------------------- */

  function setMentorPosition(
    position
  ) {

    const allowed = [

      "left",

      "center",

      "right"

    ];


    if (
      !allowed.includes(
        position
      )
    ) {

      return false;

    }


    return setSetting(
      "mentorPosition",
      position
    );

  }


  /* ---------------------------------------------------------
     16. SET BACKGROUND
     --------------------------------------------------------- */

  function setBackground(
    background
  ) {

    return setSetting(
      "background",
      background
    );

  }


  /* ---------------------------------------------------------
     17. VALIDATE INPUTS
     --------------------------------------------------------- */

  function validate() {

    const errors = [];


    /*
     * Script
     */

    if (
      !state.script.trim()
    ) {

      errors.push(
        "Lesson script is empty."
      );

    }


    /*
     * Face
     */

    const avatar =
      window.SNKAI.Avatar;


    if (!avatar) {

      errors.push(
        "Avatar engine is not loaded."
      );

    } else {

      const avatarState =
        avatar.getState();


      if (
        !avatarState.ready
      ) {

        errors.push(
          "Mentor face video is not ready."
        );

      }

    }


    /*
     * Voice
     */

    const voice =
      window.SNKAI.Voice;


    if (!voice) {

      errors.push(
        "Voice engine is not loaded."
      );

    } else {

      const voiceState =
        voice.getState();


      if (
        !voiceState.ready
      ) {

        errors.push(
          "Mentor voice sample is not ready."
        );

      }

    }


    /*
     * Settings
     */

    if (
      !state.settings.format
    ) {

      errors.push(
        "Video format is not configured."
      );

    }


    if (
      !state.settings.resolution
    ) {

      errors.push(
        "Video resolution is not configured."
      );

    }


    return {

      valid:
        errors.length === 0,

      errors

    };

  }


  /* ---------------------------------------------------------
     18. BUILD VIDEO PAYLOAD
     --------------------------------------------------------- */

  function buildPayload(
    options = {}
  ) {

    const avatar =
      window.SNKAI.Avatar;


    const voice =
      window.SNKAI.Voice;


    const avatarState =
      avatar
        ? avatar.getState()
        : null;


    const voiceState =
      voice
        ? voice.getState()
        : null;


    return {

      type:
        "ai-video-generation",


      mentor: {

        name:
          options.mentorName ||
          "SNK AI Mentor"

      },


      avatar: {

        source:
          avatarState
            ? {
                fileName:
                  avatarState.fileName,

                fileType:
                  avatarState.fileType,

                fileSize:
                  avatarState.fileSize
              }
            : null,

        settings:
          avatarState
            ? avatarState.settings
            : {}

      },


      voice: {

        source:
          voiceState
            ? {
                fileName:
                  voiceState.fileName,

                fileType:
                  voiceState.fileType,

                fileSize:
                  voiceState.fileSize
              }
            : null,

        settings:
          voiceState
            ? voiceState.settings
            : {}

      },


      script: {

        text:
          state.script,

        characters:
          state.script.length,

        words:
          countWords(
            state.script
          )

      },


      video: {

        ...state.settings,

        ...(options.video || {})

      },


      createdAt:
        new Date().toISOString()

    };

  }


  /* ---------------------------------------------------------
     19. DEMO VIDEO GENERATION
     --------------------------------------------------------- */

  function demoGenerate(
    options = {}
  ) {

    const validation =
      validate();


    if (
      !validation.valid
    ) {

      const message =
        validation.errors.join(
          " "
        );


      state.error =
        message;


      state.status =
        "error";


      emit(
        "error",
        {
          message,

          errors:
            validation.errors
        }
      );


      return Promise.reject(
        new Error(message)
      );

    }


    state.processing = true;

    state.status =
      "processing";

    state.progress = 0;

    state.error = null;

    state.jobId =
      "demo-video-" +
      Date.now();

    state.startedAt =
      new Date().toISOString();

    state.completedAt =
      null;


    emit(
      "generationStarted",
      getState()
    );


    return new Promise(
      resolve => {

        let progress = 0;


        const timer =
          setInterval(
            () => {

              progress += 5;


              state.progress =
                Math.min(
                  progress,
                  100
                );


              state.status =
                progress >= 100
                  ? "completed"
                  : "processing";


              emit(
                "progress",
                {

                  progress:
                    state.progress,

                  status:
                    state.status

                }
              );


              if (
                progress >= 100
              ) {

                clearInterval(
                  timer
                );


                state.processing =
                  false;


                state.completedAt =
                  new Date()
                    .toISOString();


                /*
                 * Demo mode does not create a
                 * real MP4 file.
                 */

                const payload =
                  buildPayload(
                    options
                  );


                emit(
                  "generationCompleted",
                  {

                    success:
                      true,

                    demo:
                      true,

                    jobId:
                      state.jobId,

                    payload

                  }
                );


                resolve({

                  success:
                    true,

                  demo:
                    true,

                  jobId:
                    state.jobId,

                  payload

                });

              }

            },
            150
          );

      }
    );

  }


  /* ---------------------------------------------------------
     20. LIVE VIDEO GENERATION
     --------------------------------------------------------- */

  async function generate(
    options = {}
  ) {

    const AIConfig =
      window.SNKAI.AIConfig;


    if (!AIConfig) {

      throw new Error(
        "AI configuration is not loaded."
      );

    }


    const validation =
      validate();


    if (
      !validation.valid
    ) {

      const message =
        validation.errors.join(
          " "
        );


      state.error =
        message;


      state.status =
        "error";


      emit(
        "error",
        {
          message,

          errors:
            validation.errors
        }
      );


      throw new Error(
        message
      );

    }


    const config =
      AIConfig.getConfig();


    /*
     * Demo Mode
     */

    if (
      config.mode === "demo"
    ) {

      return demoGenerate(
        options
      );

    }


    /*
     * Live Mode
     */

    const url =
      AIConfig.getGenerateUrl();


    if (!url) {

      const error =
        new Error(
          "AI video generation endpoint is not configured."
        );


      state.error =
        error.message;


      state.status =
        "error";


      emit(
        "error",
        {
          message:
            error.message
        }
      );


      throw error;

    }


    state.processing =
      true;

    state.status =
      "uploading";

    state.progress =
      5;

    state.error =
      null;

    state.startedAt =
      new Date().toISOString();

    state.completedAt =
      null;


    emit(
      "generationStarted",
      getState()
    );


    try {

      const payload =
        buildPayload(
          options
        );


      const response =
        await fetch(
          url,
          {

            method:
              "POST",

            headers:
              AIConfig
                .buildHeaders(),

            body:
              JSON.stringify(
                payload
              )

          }
        );


      if (!response.ok) {

        throw new Error(
          `Video API request failed (${response.status}).`
        );

      }


      const data =
        await response.json();


      state.jobId =
        data.jobId ||
        data.id ||
        null;


      state.videoUrl =
        data.videoUrl ||
        data.video_url ||
        data.outputUrl ||
        "";


      state.thumbnailUrl =
        data.thumbnailUrl ||
        data.thumbnail_url ||
        "";


      state.downloadUrl =
        data.downloadUrl ||
        data.download_url ||
        state.videoUrl ||
        "";


      /*
       * If provider already returned a completed
       * video, finish immediately.
       */

      if (
        state.videoUrl
      ) {

        state.progress =
          100;

        state.status =
          "completed";

        state.processing =
          false;

        state.completedAt =
          new Date()
            .toISOString();


        emit(
          "generationCompleted",
          {

            success:
              true,

            demo:
              false,

            jobId:
              state.jobId,

            videoUrl:
              state.videoUrl,

            thumbnailUrl:
              state.thumbnailUrl,

            downloadUrl:
              state.downloadUrl,

            response:
              data

          }
        );


        return {

          success:
            true,

          demo:
            false,

          jobId:
            state.jobId,

          videoUrl:
            state.videoUrl,

          thumbnailUrl:
            state.thumbnailUrl,

          downloadUrl:
            state.downloadUrl,

          response:
            data

        };

      }


      /*
       * Otherwise the backend may return a job ID.
       */

      state.status =
        "queued";

      state.progress =
        10;


      emit(
        "queued",
        getState()
      );


      if (
        state.jobId
      ) {

        await pollJob(
          state.jobId
        );

      }


      return {

        success:
          true,

        demo:
          false,

        jobId:
          state.jobId,

        videoUrl:
          state.videoUrl,

        thumbnailUrl:
          state.thumbnailUrl,

        downloadUrl:
          state.downloadUrl

      };

    } catch (err) {

      state.processing =
        false;

      state.status =
        "error";

      state.error =
        err.message ||
        "Video generation failed.";


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
     21. POLL VIDEO JOB
     --------------------------------------------------------- */

  async function pollJob(
    jobId
  ) {

    const AIConfig =
      window.SNKAI.AIConfig;


    if (!AIConfig) {

      throw new Error(
        "AI configuration is not loaded."
      );

    }


    const config =
      AIConfig.getConfig();


    const statusUrl =
      AIConfig.getStatusUrl(
        jobId
      );


    if (!statusUrl) {

      /*
       * Without a status endpoint, we leave the
       * job queued rather than inventing completion.
       */

      state.status =
        "queued";

      state.processing =
        false;


      emit(
        "waiting",
        getState()
      );


      return null;

    }


    const timeout =
      Number(
        config.generation &&
        config.generation.timeout
      ) ||
      10 * 60 * 1000;


    const interval =
      Number(
        config.generation &&
        config.generation.pollingInterval
      ) ||
      3000;


    const started =
      Date.now();


    while (
      Date.now() -
      started <
      timeout
    ) {

      await wait(
        interval
      );


      const response =
        await fetch(
          statusUrl,
          {

            method:
              "GET",

            headers:
              AIConfig
                .buildHeaders()

          }
        );


      if (!response.ok) {

        throw new Error(
          `Video status request failed (${response.status}).`
        );

      }


      const data =
        await response.json();


      const status =
        String(
          data.status ||
          data.state ||
          "processing"
        ).toLowerCase();


      const providerProgress =
        Number(
          data.progress
        );


      if (
        Number.isFinite(
          providerProgress
        )
      ) {

        state.progress =
          Math.max(
            0,
            Math.min(
              100,
              providerProgress
            )
          );

      } else {

        state.progress =
          Math.min(
            95,
            state.progress + 5
          );

      }


      state.status =
        status;


      emit(
        "progress",
        {

          progress:
            state.progress,

          status,

          response:
            data

        }
      );


      if (
        [
          "completed",
          "complete",
          "success",
          "succeeded",
          "done"
        ].includes(status)
      ) {

        state.processing =
          false;

        state.status =
          "completed";

        state.progress =
          100;

        state.completedAt =
          new Date()
            .toISOString();


        state.videoUrl =
          data.videoUrl ||
          data.video_url ||
          data.outputUrl ||
          "";


        state.thumbnailUrl =
          data.thumbnailUrl ||
          data.thumbnail_url ||
          "";


        state.downloadUrl =
          data.downloadUrl ||
          data.download_url ||
          state.videoUrl ||
          "";


        emit(
          "generationCompleted",
          {

            success:
              true,

            demo:
              false,

            jobId,

            videoUrl:
              state.videoUrl,

            thumbnailUrl:
              state.thumbnailUrl,

            downloadUrl:
              state.downloadUrl,

            response:
              data

          }
        );


        return data;

      }


      if (
        [
          "failed",
          "failure",
          "error",
          "cancelled",
          "canceled"
        ].includes(status)
      ) {

        throw new Error(
          data.message ||
          "AI video generation failed."
        );

      }

    }


    throw new Error(
      "Video generation timed out."
    );

  }


  /* ---------------------------------------------------------
     22. WAIT HELPER
     --------------------------------------------------------- */

  function wait(ms) {

    return new Promise(
      resolve =>
        setTimeout(
          resolve,
          ms
        )
    );

  }


  /* ---------------------------------------------------------
     23. CANCEL
     --------------------------------------------------------- */

  async function cancel() {

    if (
      !state.processing
    ) {

      return false;

    }


    const AIConfig =
      window.SNKAI.AIConfig;


    /*
     * Demo cancellation
     */

    if (
      !AIConfig ||
      AIConfig.isDemo()
    ) {

      state.processing =
        false;

      state.status =
        "cancelled";

      state.error =
        "Video generation cancelled.";


      emit(
        "cancelled",
        getState()
      );


      return true;

    }


    /*
     * Live cancellation
     */

    const config =
      AIConfig.getConfig();


    const endpoint =
      config.endpoints &&
      config.endpoints.cancel;


    if (
      !endpoint ||
      !state.jobId
    ) {

      state.processing =
        false;

      state.status =
        "cancelled";

      emit(
        "cancelled",
        getState()
      );


      return true;

    }


    try {

      const url =
        joinUrl(
          config.apiBaseUrl,
          endpoint
            .replace(
              "{jobId}",
              encodeURIComponent(
                state.jobId
              )
            )
        );


      const response =
        await fetch(
          url,
          {

            method:
              "POST",

            headers:
              AIConfig
                .buildHeaders(),

            body:
              JSON.stringify(
                {
                  jobId:
                    state.jobId
                }
              )

          }
        );


      if (!response.ok) {

        throw new Error(
          `Cancel request failed (${response.status}).`
        );

      }


      state.processing =
        false;

      state.status =
        "cancelled";


      emit(
        "cancelled",
        getState()
      );


      return true;

    } catch (err) {

      state.error =
        err.message;


      emit(
        "error",
        {
          message:
            err.message
        }
      );


      return false;

    }

  }


  /* ---------------------------------------------------------
     24. DOWNLOAD VIDEO
     --------------------------------------------------------- */

  function download(
    fileName =
      "snk-ai-mentor-video.mp4"
  ) {

    const url =
      state.downloadUrl ||
      state.videoUrl;


    if (!url) {

      return false;

    }


    const link =
      document.createElement(
        "a"
      );


    link.href =
      url;


    link.download =
      fileName;


    link.target =
      "_blank";


    document.body.appendChild(
      link
    );


    link.click();


    link.remove();


    return true;

  }


  /* ---------------------------------------------------------
     25. OPEN VIDEO
     --------------------------------------------------------- */

  function openVideo() {

    const url =
      state.videoUrl ||
      state.downloadUrl;


    if (!url) {

      return false;

    }


    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );


    return true;

  }


  /* ---------------------------------------------------------
     26. GET STATE
     --------------------------------------------------------- */

  function getState() {

    return {

      initialized:
        state.initialized,

      processing:
        state.processing,

      progress:
        state.progress,

      status:
        state.status,

      jobId:
        state.jobId,

      videoUrl:
        state.videoUrl,

      thumbnailUrl:
        state.thumbnailUrl,

      downloadUrl:
        state.downloadUrl,

      error:
        state.error,

      startedAt:
        state.startedAt,

      completedAt:
        state.completedAt,

      script:
        state.script,

      settings:
        getSettings()

    };

  }


  /* ---------------------------------------------------------
     27. RESET
     --------------------------------------------------------- */

  function reset() {

    state.processing =
      false;

    state.progress =
      0;

    state.status =
      "idle";

    state.jobId =
      null;

    state.videoUrl =
      "";

    state.thumbnailUrl =
      "";

    state.downloadUrl =
      "";

    state.error =
      null;

    state.startedAt =
      null;

    state.completedAt =
      null;

    state.script =
      "";


    state.settings = {

      format: "mp4",

      resolution: "1080p",

      aspectRatio: "16:9",

      fps: 30,

      mentorPosition: "right",

      background: "studio",

      subtitles: false,

      audio: true

    };


    emit(
      "reset",
      getState()
    );

  }


  /* ---------------------------------------------------------
     28. INITIALIZE
     --------------------------------------------------------- */

  function init() {

    if (
      state.initialized
    ) {

      return getState();

    }


    state.initialized =
      true;


    const config =
      getConfig();


    if (
      config.output
    ) {

      state.settings.format =
        config.output.format ||
        state.settings.format;

      state.settings.resolution =
        config.output.resolution ||
        state.settings.resolution;

      state.settings.aspectRatio =
        config.output.aspectRatio ||
        state.settings.aspectRatio;

      state.settings.fps =
        config.output.fps ||
        state.settings.fps;

    }


    normalizeSettings();


    emit(
      "initialized",
      getState()
    );


    return getState();

  }


  /* ---------------------------------------------------------
     29. URL JOIN HELPER
     --------------------------------------------------------- */

  function joinUrl(
    base,
    endpoint
  ) {

    if (!base) {
      return endpoint || "";
    }


    if (!endpoint) {
      return base;
    }


    return (
      String(base)
        .replace(/\/+$/, "") +
      "/" +
      String(endpoint)
        .replace(/^\/+/, "")
    );

  }


  /* ---------------------------------------------------------
     30. PUBLIC API
     --------------------------------------------------------- */

  const Video = {

    init,

    on,

    off,

    emit,

    getState,

    getScript,

    setScript,

    setSettings,

    setSetting,

    getSettings,

    setFormat,

    setResolution,

    setAspectRatio,

    setMentorPosition,

    setBackground,

    validate,

    buildPayload,

    generate,

    pollJob,

    cancel,

    download,

    openVideo,

    reset

  };


  /* ---------------------------------------------------------
     31. EXPORT
     --------------------------------------------------------- */

  window.SNKAI.Video =
    Video;


  /* ---------------------------------------------------------
     32. AUTO INITIALIZE
     --------------------------------------------------------- */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      () => Video.init(),
      {
        once: true
      }
    );

  } else {

    Video.init();

  }


})();
