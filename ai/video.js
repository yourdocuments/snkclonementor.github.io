/* =========================================================
   SNK AI MENTOR
   ai/video.js
   Step 17 — AI Mentor Video Generation Engine
   ========================================================= */

(() => {
  "use strict";

  window.SNKAI = window.SNKAI || {};

  const NS = window.SNKAI;

  const EVENTS = {};

  const state = {
    processing: false,
    progress: 0,
    status: "idle",
    message: "",
    error: "",

    jobId: "",
    videoUrl: "",
    downloadUrl: "",
    thumbnailUrl: "",

    startedAt: null,
    completedAt: null,

    lastPayload: null,
    result: null
  };

  /* =========================================================
     EVENT SYSTEM
  ========================================================= */

  function emit(eventName, detail = {}) {
    const handlers = EVENTS[eventName] || [];

    handlers.forEach((handler) => {
      try {
        handler(detail);
      } catch (error) {
        console.error(
          "[SNK Video] Event handler error:",
          error
        );
      }
    });

    try {
      window.dispatchEvent(
        new CustomEvent(
          `snk-video:${eventName}`,
          { detail }
        )
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

  function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  function clamp(value, min, max) {
    return Math.min(
      max,
      Math.max(min, value)
    );
  }

  function updateProgress(
    progress,
    status,
    message
  ) {
    state.progress = clamp(
      Number(progress) || 0,
      0,
      100
    );

    state.status =
      status || state.status;

    state.message =
      message || state.message;

    emit("progress", {
      progress:
        state.progress,

      status:
        state.status,

      message:
        state.message
    });
  }

  function getConfig() {
    return NS.AIConfig || null;
  }

  function getAvatar() {
    return NS.Avatar || null;
  }

  function getVoice() {
    return NS.Voice || null;
  }

  /* =========================================================
     CONFIG HELPERS
  ========================================================= */

  function getMode() {
    const config =
      getConfig();

    if (
      config &&
      typeof config.getMode === "function"
    ) {
      return config.getMode();
    }

    return "demo";
  }

  function isDemoMode() {
    const config =
      getConfig();

    if (
      config &&
      typeof config.isDemoMode === "function"
    ) {
      return config.isDemoMode();
    }

    return getMode() === "demo";
  }

  function getProvider() {
    const config =
      getConfig();

    if (
      config &&
      typeof config.getProvider === "function"
    ) {
      return config.getProvider();
    }

    return "demo";
  }

  function getGenerateUrl() {
    const config =
      getConfig();

    if (
      config &&
      typeof config.getGenerateUrl === "function"
    ) {
      return config.getGenerateUrl();
    }

    return "";
  }

  function getStatusUrl(jobId) {
    const config =
      getConfig();

    if (
      config &&
      typeof config.getStatusUrl === "function"
    ) {
      return config.getStatusUrl(
        jobId
      );
    }

    return "";
  }

  function buildHeaders() {
    const config =
      getConfig();

    if (
      config &&
      typeof config.buildHeaders === "function"
    ) {
      return config.buildHeaders();
    }

    return {
      "Content-Type":
        "application/json"
    };
  }

  function getTimeout() {
    const config =
      getConfig();

    if (
      config &&
      typeof config.getRequestTimeout ===
        "function"
    ) {
      return config.getRequestTimeout();
    }

    return 120000;
  }

  function getPollingInterval() {
    const config =
      getConfig();

    if (
      config &&
      typeof config.getPollingInterval ===
        "function"
    ) {
      return config.getPollingInterval();
    }

    return 4000;
  }

  function getMaxPollingAttempts() {
    const config =
      getConfig();

    if (
      config &&
      typeof config.getMaxPollingAttempts ===
        "function"
    ) {
      return config.getMaxPollingAttempts();
    }

    return 90;
  }

  /* =========================================================
     INPUT NORMALIZATION
  ========================================================= */

  function getValue(elementId) {
    const element =
      document.getElementById(
        elementId
      );

    return element
      ? String(element.value || "")
      : "";
  }

  function collectSettings() {
    return {
      format:
        getValue("videoFormat") ||
        "mp4",

      resolution:
        getValue("videoResolution") ||
        "1080p",

      mentorPosition:
        getValue("mentorPosition") ||
        "right",

      background:
        getValue("videoBackground") ||
        "studio",

      aspectRatio:
        "16:9",

      fps: 30,

      subtitles: false,

      audio: true
    };
  }

  function getLessonScript() {
    return getValue(
      "lessonScript"
    ).trim();
  }

  /* =========================================================
     VALIDATION
  ========================================================= */

  function validate() {
    const avatar =
      getAvatar();

    const voice =
      getVoice();

    const script =
      getLessonScript();

    const settings =
      collectSettings();

    const errors = [];

    if (!avatar) {
      errors.push(
        "Avatar engine is not loaded."
      );
    } else if (
      typeof avatar.isReady ===
        "function" &&
      !avatar.isReady()
    ) {
      errors.push(
        "Please upload a face video."
      );
    }

    if (!voice) {
      errors.push(
        "Voice engine is not loaded."
      );
    } else if (
      typeof voice.isReady ===
        "function" &&
      !voice.isReady()
    ) {
      errors.push(
        "Please upload a voice sample."
      );
    }

    if (!script) {
      errors.push(
        "Please write the lesson script."
      );
    }

    if (
      script.length < 3
    ) {
      errors.push(
        "Lesson script is too short."
      );
    }

    if (
      !settings.format
    ) {
      errors.push(
        "Video format is missing."
      );
    }

    if (
      !settings.resolution
    ) {
      errors.push(
        "Video resolution is missing."
      );
    }

    return {
      valid:
        errors.length === 0,

      errors,

      script,

      settings
    };
  }

  /* =========================================================
     ENGINE READINESS
  ========================================================= */

  function checkEngineReadiness() {
    const avatar =
      getAvatar();

    const voice =
      getVoice();

    const result = {
      avatar: {
        available:
          Boolean(avatar),

        ready:
          Boolean(
            avatar &&
            typeof avatar.isReady ===
              "function" &&
            avatar.isReady()
          )
      },

      voice: {
        available:
          Boolean(voice),

        ready:
          Boolean(
            voice &&
            typeof voice.isReady ===
              "function" &&
            voice.isReady()
          )
      },

      script: {
        ready:
          getLessonScript().length > 2
      },

      settings: {
        ready:
          Boolean(
            getValue(
              "videoFormat"
            ) &&
            getValue(
              "videoResolution"
            )
          )
      }
    };

    result.ready =
      result.avatar.ready &&
      result.voice.ready &&
      result.script.ready &&
      result.settings.ready;

    return result;
  }

  /* =========================================================
     BUILD GENERATION PAYLOAD
  ========================================================= */

  function buildPayload(extra = {}) {
    const validation =
      validate();

    if (!validation.valid) {
      throw new Error(
        validation.errors.join(" ")
      );
    }

    const avatar =
      getAvatar();

    const voice =
      getVoice();

    const avatarData =
      avatar &&
      typeof avatar.buildPayload ===
        "function"
        ? avatar.buildPayload(
            validation.settings
          )
        : {};

    const voiceData =
      voice &&
      typeof voice.buildPayload ===
        "function"
        ? voice.buildPayload(
            validation.settings
          )
        : {};

    const payload = {
      project: {
        name:
          getValue(
            "projectName"
          ) ||
          "SNK AI Mentor Project"
      },

      provider: {
        name:
          getProvider(),

        mode:
          getMode()
      },

      avatar:
        avatarData,

      voice:
        voiceData,

      script: {
        text:
          validation.script,

        language:
          getValue(
            "scriptLanguage"
          ) ||
          "bn",

        style:
          getValue(
            "scriptStyle"
          ) ||
          "teaching"
      },

      settings:
        validation.settings,

      client: {
        application:
          "SNK AI Mentor",

        engine:
          "video",

        version:
          "2.0.0"
      },

      ...extra
    };

    state.lastPayload =
      payload;

    return payload;
  }

  /* =========================================================
     DEMO GENERATOR
  ========================================================= */

  async function runDemo(payload) {
    updateProgress(
      5,
      "preparing",
      "Preparing AI mentor project..."
    );

    await sleep(500);

    updateProgress(
      18,
      "avatar",
      "Preparing mentor avatar..."
    );

    await sleep(700);

    updateProgress(
      34,
      "voice",
      "Preparing voice sample..."
    );

    await sleep(700);

    updateProgress(
      50,
      "script",
      "Processing lesson script..."
    );

    await sleep(700);

    updateProgress(
      68,
      "rendering",
      "Rendering demo mentor video..."
    );

    await sleep(900);

    updateProgress(
      82,
      "audio",
      "Preparing synchronized narration..."
    );

    await sleep(600);

    updateProgress(
      94,
      "finalizing",
      "Finalizing video..."
    );

    await sleep(700);

    /*
      Demo mode does not create a real AI-cloned MP4.
      We create a browser-generated placeholder video
      so the Studio pipeline can be tested.
    */

    const demoVideo =
      createDemoVideo();

    state.videoUrl =
      demoVideo.url;

    state.downloadUrl =
      demoVideo.url;

    state.thumbnailUrl =
      "";

    state.jobId =
      `demo-${Date.now()}`;

    state.result = {
      success: true,
      mode: "demo",
      provider:
        payload.provider.name,

      jobId:
        state.jobId,

      videoUrl:
        state.videoUrl,

      downloadUrl:
        state.downloadUrl,

      message:
        "Demo video created. Live AI provider integration is still required for real avatar/voice generation."
    };

    updateProgress(
      100,
      "completed",
      "Demo video is ready."
    );

    return state.result;
  }

  /* =========================================================
     CREATE DEMO VIDEO
  ========================================================= */

  function createDemoVideo() {
    /*
      Browser MediaRecorder is used only to create
      a simple local test video.

      It does NOT perform face cloning or voice cloning.
    */

    if (
      typeof MediaRecorder ===
      "undefined"
    ) {
      return {
        url: createDemoHtmlVideo(),
        type: "html"
      };
    }

    try {
      const canvas =
        document.createElement(
          "canvas"
        );

      canvas.width = 1280;
      canvas.height = 720;

      const ctx =
        canvas.getContext(
          "2d"
        );

      if (!ctx) {
        return {
          url:
            createDemoHtmlVideo(),
          type: "html"
        };
      }

      let frame = 0;

      const draw = () => {
        frame++;

        ctx.clearRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        ctx.fillStyle =
          "#07111f";

        ctx.fillRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        const gradient =
          ctx.createLinearGradient(
            0,
            0,
            canvas.width,
            canvas.height
          );

        gradient.addColorStop(
          0,
          "#0d2440"
        );

        gradient.addColorStop(
          1,
          "#111827"
        );

        ctx.fillStyle =
          gradient;

        ctx.fillRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        ctx.fillStyle =
          "rgba(80,160,255,.14)";

        ctx.beginPath();

        ctx.arc(
          980 +
            Math.sin(
              frame / 20
            ) *
              35,
          180,
          150,
          0,
          Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle =
          "#ffffff";

        ctx.font =
          "700 58px Arial";

        ctx.fillText(
          "SNK AI Mentor",
          80,
          180
        );

        ctx.font =
          "400 30px Arial";

        ctx.fillStyle =
          "#b9c7d8";

        ctx.fillText(
          "Demo AI Teaching Video",
          84,
          235
        );

        ctx.font =
          "400 22px Arial";

        ctx.fillStyle =
          "#8ea1b8";

        ctx.fillText(
          "Avatar + Voice + Script pipeline ready",
          84,
          285
        );

        ctx.fillStyle =
          "rgba(255,255,255,.08)";

        ctx.fillRect(
          84,
          350,
          1110,
          2
        );

        ctx.fillStyle =
          "#dce8f5";

        ctx.font =
          "500 24px Arial";

        ctx.fillText(
          "This is a browser demo placeholder.",
          84,
          415
        );

        ctx.fillStyle =
          "#91a4ba";

        ctx.font =
          "400 19px Arial";

        ctx.fillText(
          "Connect a secure AI provider to generate the real mentor video.",
          84,
          455
        );

        ctx.fillStyle =
          "#70839b";

        ctx.font =
          "400 17px Arial";

        ctx.fillText(
          new Date().toLocaleString(),
          84,
          620
        );
      };

      draw();

      const stream =
        canvas.captureStream(
          25
        );

      const mimeTypes = [
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm"
      ];

      const supported =
        mimeTypes.find(
          (type) =>
            MediaRecorder.isTypeSupported(
              type
            )
        );

      if (!supported) {
        return {
          url:
            createDemoHtmlVideo(),
          type: "html"
        };
      }

      const recorder =
        new MediaRecorder(
          stream,
          {
            mimeType:
              supported
          }
        );

      const chunks = [];

      recorder.ondataavailable =
        (event) => {
          if (
            event.data &&
            event.data.size
          ) {
            chunks.push(
              event.data
            );
          }
        };

      return new Promise(
        (resolve) => {
          recorder.onstop =
            () => {
              const blob =
                new Blob(
                  chunks,
                  {
                    type:
                      supported
                  }
                );

              resolve({
                url:
                  URL.createObjectURL(
                    blob
                  ),

                type:
                  supported
              });
            };

          recorder.start();

          setTimeout(
            () => {
              try {
                recorder.stop();
              } catch (_) {
                resolve({
                  url:
                    createDemoHtmlVideo(),
                  type: "html"
                });
              }
            },
            3000
          );
        }
      );
    } catch (error) {
      console.warn(
        "[SNK Video] Demo MediaRecorder failed:",
        error
      );

      return {
        url:
          createDemoHtmlVideo(),

        type:
          "html"
      };
    }
  }

  function createDemoHtmlVideo() {
    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>SNK AI Mentor Demo</title>
<style>
html,body{
  margin:0;
  width:100%;
  height:100%;
  background:#07111f;
  color:#fff;
  font-family:Arial,sans-serif;
}
body{
  display:flex;
  align-items:center;
  justify-content:center;
}
main{
  text-align:center;
  padding:40px;
}
h1{
  font-size:48px;
  margin:0 0 18px;
}
p{
  color:#a9b8ca;
  font-size:20px;
}
</style>
</head>
<body>
<main>
<h1>SNK AI Mentor</h1>
<p>Demo AI Mentor Video</p>
<p>Connect a live provider for real avatar + voice generation.</p>
</main>
</body>
</html>
`;

    const blob =
      new Blob(
        [html],
        {
          type:
            "text/html"
        }
      );

    return URL.createObjectURL(
      blob
    );
  }

  /* =========================================================
     LIVE API REQUEST
  ========================================================= */

  async function requestLiveGeneration(
    payload
  ) {
    const endpoint =
      getGenerateUrl();

    if (!endpoint) {
      throw new Error(
        "Live generation endpoint is not configured."
      );
    }

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => {
          controller.abort();
        },
        getTimeout()
      );

    try {
      const response =
        await fetch(
          endpoint,
          {
            method:
              "POST",

            headers:
              buildHeaders(),

            body:
              JSON.stringify(
                payload
              ),

            signal:
              controller.signal
          }
        );

      let data = null;

      try {
        data =
          await response.json();
      } catch (_) {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          `Generation request failed (${response.status}).`
        );
      }

      return (
        data || {}
      );
    } catch (error) {
      if (
        error?.name ===
        "AbortError"
      ) {
        throw new Error(
          "Generation request timed out."
        );
      }

      throw error;
    } finally {
      clearTimeout(
        timeout
      );
    }
  }

  /* =========================================================
     EXTRACT JOB INFORMATION
  ========================================================= */

  function extractJobData(data) {
    return {
      jobId:
        data?.jobId ||
        data?.id ||
        data?.data?.jobId ||
        data?.data?.id ||
        "",

      status:
        data?.status ||
        data?.data?.status ||
        "processing",

      progress:
        Number(
          data?.progress ??
          data?.data?.progress ??
          0
        ),

      videoUrl:
        data?.videoUrl ||
        data?.video_url ||
        data?.data?.videoUrl ||
        data?.data?.video_url ||
        "",

      downloadUrl:
        data?.downloadUrl ||
        data?.download_url ||
        data?.data?.downloadUrl ||
        data?.data?.download_url ||
        "",

      thumbnailUrl:
        data?.thumbnailUrl ||
        data?.thumbnail_url ||
        data?.data?.thumbnailUrl ||
        data?.data?.thumbnail_url ||
        "",

      message:
        data?.message ||
        data?.data?.message ||
        ""
    };
  }

  /* =========================================================
     POLL LIVE JOB
  ========================================================= */

  async function pollJob(
    jobId,
    initialData = {}
  ) {
    const endpoint =
      getStatusUrl(
        jobId
      );

    if (!endpoint) {
      throw new Error(
        "Live status endpoint is not configured."
      );
    }

    let last =
      extractJobData(
        initialData
      );

    const maxAttempts =
      getMaxPollingAttempts();

    const interval =
      getPollingInterval();

    for (
      let attempt = 0;
      attempt < maxAttempts;
      attempt++
    ) {
      if (
        state.status ===
        "cancelled"
      ) {
        throw new Error(
          "Video generation was cancelled."
        );
      }

      if (
        attempt > 0
      ) {
        await sleep(
          interval
        );
      }

      const response =
        await fetch(
          endpoint,
          {
            method:
              "GET",

            headers:
              buildHeaders()
          }
        );

      let data = {};

      try {
        data =
          await response.json();
      } catch (_) {}

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          `Status request failed (${response.status}).`
        );
      }

      last =
        extractJobData(
          data
        );

      const calculatedProgress =
        last.progress ||
        Math.min(
          95,
          10 +
            Math.round(
              (attempt /
                Math.max(
                  1,
                  maxAttempts
                )) *
                85
            )
        );

      updateProgress(
        calculatedProgress,
        last.status ||
          "processing",
        last.message ||
          "AI mentor video is being generated..."
      );

      const normalizedStatus =
        String(
          last.status ||
            ""
        ).toLowerCase();

      if (
        normalizedStatus ===
          "completed" ||
        normalizedStatus ===
          "complete" ||
        normalizedStatus ===
          "success" ||
        Boolean(
          last.videoUrl
        )
      ) {
        state.videoUrl =
          last.videoUrl;

        state.downloadUrl =
          last.downloadUrl ||
          last.videoUrl;

        state.thumbnailUrl =
          last.thumbnailUrl ||
          "";

        return last;
      }

      if (
        normalizedStatus ===
          "failed" ||
        normalizedStatus ===
          "error" ||
        normalizedStatus ===
          "cancelled"
      ) {
        throw new Error(
          last.message ||
          "AI video generation failed."
        );
      }
    }

    throw new Error(
      "Video generation polling timed out."
    );
  }

  /* =========================================================
     START GENERATION
  ========================================================= */

  async function generate(
    extraPayload = {}
  ) {
    if (
      state.processing
    ) {
      return {
        success: false,
        error:
          "Video generation is already running."
      };
    }

    const validation =
      validate();

    if (!validation.valid) {
      const error =
        validation.errors.join(
          " "
        );

      state.error =
        error;

      emit("error", {
        message:
          error
      });

      return {
        success: false,
        error
      };
    }

    const payload =
      buildPayload(
        extraPayload
      );

    state.processing = true;
    state.progress = 0;
    state.status =
      "starting";
    state.message =
      "Starting AI mentor video generation...";
    state.error = "";

    state.jobId = "";
    state.videoUrl = "";
    state.downloadUrl = "";
    state.thumbnailUrl = "";
    state.result = null;

    state.startedAt =
      new Date().toISOString();

    emit("started", {
      payload
    });

    try {
      let result;

      if (
        isDemoMode()
      ) {
        result =
          await runDemo(
            payload
          );
      } else {
        updateProgress(
          8,
          "uploading",
          "Sending generation request..."
        );

        const response =
          await requestLiveGeneration(
            payload
          );

        const job =
          extractJobData(
            response
          );

        state.jobId =
          job.jobId;

        if (
          job.videoUrl
        ) {
          state.videoUrl =
            job.videoUrl;

          state.downloadUrl =
            job.downloadUrl ||
            job.videoUrl;

          state.thumbnailUrl =
            job.thumbnailUrl ||
            "";

          updateProgress(
            100,
            "completed",
            "AI mentor video is ready."
          );

          result =
            job;
        } else if (
          state.jobId
        ) {
          result =
            await pollJob(
              state.jobId,
              response
            );
        } else {
          throw new Error(
            "Provider response did not contain a video URL or job ID."
          );
        }

        state.result = {
          success: true,

          mode:
            "live",

          provider:
            getProvider(),

          jobId:
            state.jobId,

          videoUrl:
            state.videoUrl,

          downloadUrl:
            state.downloadUrl,

          thumbnailUrl:
            state.thumbnailUrl,

          providerResult:
            result
        };
      }

      state.completedAt =
        new Date().toISOString();

      state.processing = false;

      emit("completed", {
        result:
          state.result
      });

      return (
        state.result || {
          success: true
        }
      );

    } catch (error) {
      state.processing = false;

      state.status =
        "failed";

      state.error =
        error?.message ||
        "Video generation failed.";

      state.message =
        state.error;

      emit("error", {
        message:
          state.error,

        error
      });

      return {
        success: false,

        error:
          state.error
      };
    }
  }

  /* =========================================================
     CANCEL
  ========================================================= */

  function cancel() {
    if (
      !state.processing
    ) {
      return false;
    }

    state.status =
      "cancelled";

    state.message =
      "Cancelling generation...";

    emit("cancelled");

    return true;
  }

  /* =========================================================
     OPEN VIDEO
  ========================================================= */

  function openVideo() {
    const url =
      state.videoUrl;

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

  /* =========================================================
     DOWNLOAD VIDEO
  ========================================================= */

  async function download(
    fileName = "snk-ai-mentor-video"
  ) {
    const url =
      state.downloadUrl ||
      state.videoUrl;

    if (!url) {
      return false;
    }

    try {
      const response =
        await fetch(url);

      if (!response.ok) {
        throw new Error(
          "Unable to download video."
        );
      }

      const blob =
        await response.blob();

      const blobUrl =
        URL.createObjectURL(
          blob
        );

      const anchor =
        document.createElement(
          "a"
        );

      anchor.href =
        blobUrl;

      anchor.download =
        `${fileName}.mp4`;

      document.body.appendChild(
        anchor
      );

      anchor.click();

      anchor.remove();

      setTimeout(
        () => {
          URL.revokeObjectURL(
            blobUrl
          );
        },
        1000
      );

      return true;

    } catch (error) {
      /*
        Cross-origin provider URLs may block fetch.
        In that case fallback to opening the URL.
      */

      try {
        const anchor =
          document.createElement(
            "a"
          );

        anchor.href =
          url;

        anchor.target =
          "_blank";

        anchor.rel =
          "noopener noreferrer";

        anchor.click();

        return true;
      } catch (_) {
        console.error(
          "[SNK Video] Download failed:",
          error
        );

        return false;
      }
    }
  }

  /* =========================================================
     RESULT
  ========================================================= */

  function getResult() {
    return state.result
      ? {
          ...state.result
        }
      : null;
  }

  function getState() {
    return {
      ...state
    };
  }

  function reset() {
    if (
      state.videoUrl &&
      state.videoUrl.startsWith(
        "blob:"
      )
    ) {
      try {
        URL.revokeObjectURL(
          state.videoUrl
        );
      } catch (_) {}
    }

    state.processing =
      false;

    state.progress =
      0;

    state.status =
      "idle";

    state.message =
      "";

    state.error =
      "";

    state.jobId =
      "";

    state.videoUrl =
      "";

    state.downloadUrl =
      "";

    state.thumbnailUrl =
      "";

    state.startedAt =
      null;

    state.completedAt =
      null;

    state.lastPayload =
      null;

    state.result =
      null;

    emit("reset");
  }

  /* =========================================================
     PUBLIC API
  ========================================================= */

  const Video = {
    version:
      "2.0.0",

    state,

    generate,

    validate,
    buildPayload,

    checkEngineReadiness,

    cancel,
    reset,

    openVideo,
    download,

    getResult,
    getState,

    isDemoMode,
    getMode,
    getProvider,

    on
  };

  NS.Video =
    Video;

  emit("loaded", {
    version:
      Video.version
  });

})();
