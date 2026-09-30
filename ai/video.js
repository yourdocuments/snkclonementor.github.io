/* =========================================================
   SNK AI Mentor
   ai/video.js

   STEP 28 — FINAL VIDEO ENGINE

   Responsibilities:
   ---------------------------------------------------------
   1. Validate complete production project
   2. Collect:
      - Face video
      - Voice sample
      - Lesson script
      - Video settings
      - AI configuration
   3. Build provider-independent metadata
   4. Build upload-ready FormData
   5. Demo generation simulation
   6. Live backend generation request
   7. Job tracking / polling
   8. Progress events
   9. Result handling
   10. Video opening / downloading
   11. Cancel active generation
   12. Safe reset

   IMPORTANT:
   ---------------------------------------------------------
   This file does NOT perform actual face cloning,
   voice cloning, or AI video rendering inside the browser.

   Demo mode:
   - Simulates generation locally.

   Live mode:
   - Sends files + metadata to your secure backend.
   - Backend should communicate with the selected
     AI provider.

   NEVER place a permanent provider API key in this file.
   ========================================================= */

(() => {
  "use strict";

  /* ---------------------------------------------------------
     1. Namespace
     --------------------------------------------------------- */

  window.SNKAI = window.SNKAI || {};

  /* ---------------------------------------------------------
     2. Constants
     --------------------------------------------------------- */

  const VERSION = "2.0.0";

  const EVENTS = {};

  const DEFAULTS = {
    pollInterval: 4000,
    maxPollAttempts: 90,
    requestTimeout: 120000,

    format: "mp4",
    resolution: "1080p",
    mentorPosition: "right",
    background: "studio",
    aspectRatio: "16:9",
    fps: 30,

    subtitles: false,
    audio: true
  };

  /* ---------------------------------------------------------
     3. State
     --------------------------------------------------------- */

  const state = {
    processing: false,
    cancelled: false,

    progress: 0,
    status: "idle",

    message: "",
    error: "",

    jobId: "",
    providerJobId: "",

    videoUrl: "",
    downloadUrl: "",
    thumbnailUrl: "",

    createdAt: null,
    completedAt: null,

    requestStartedAt: null,

    pollAttempts: 0,

    result: null,

    lastPayload: null
  };

  /* ---------------------------------------------------------
     4. Event system
     --------------------------------------------------------- */

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
          "[SNK AI Video] Event listener error:",
          error
        );
      }
    });
  }

  /* ---------------------------------------------------------
     5. Utility
     --------------------------------------------------------- */

  function clamp(value, min = 0, max = 100) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return min;
    }

    return Math.min(
      max,
      Math.max(min, number)
    );
  }

  function safeString(value) {
    return String(value ?? "").trim();
  }

  function sleep(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  function getAIConfig() {
    return window.SNKAI &&
      window.SNKAI.AIConfig
      ? window.SNKAI.AIConfig
      : null;
  }

  function getAvatarEngine() {
    return window.SNKAI &&
      window.SNKAI.Avatar
      ? window.SNKAI.Avatar
      : null;
  }

  function getVoiceEngine() {
    return window.SNKAI &&
      window.SNKAI.Voice
      ? window.SNKAI.Voice
      : null;
  }

  /* ---------------------------------------------------------
     6. State update
     --------------------------------------------------------- */

  function updateState(patch = {}, emitChange = true) {
    Object.assign(state, patch);

    if (emitChange) {
      emit("change", {
        state: getState()
      });
    }
  }

  function setStatus(
    status,
    message = "",
    progress = state.progress
  ) {
    updateState({
      status,
      message,
      progress: clamp(progress)
    });

    emit("status", {
      status,
      message,
      progress: state.progress,
      state: getState()
    });
  }

  function setError(message) {
    const text = safeString(message);

    updateState({
      error: text,
      status: "error",
      message: text,
      processing: false
    });

    emit("error", {
      error: text,
      state: getState()
    });
  }

  /* ---------------------------------------------------------
     7. Current state
     --------------------------------------------------------- */

  function getState() {
    return {
      processing: state.processing,
      cancelled: state.cancelled,

      progress: state.progress,
      status: state.status,

      message: state.message,
      error: state.error,

      jobId: state.jobId,
      providerJobId: state.providerJobId,

      videoUrl: state.videoUrl,
      downloadUrl: state.downloadUrl,
      thumbnailUrl: state.thumbnailUrl,

      createdAt: state.createdAt,
      completedAt: state.completedAt,

      requestStartedAt:
        state.requestStartedAt,

      pollAttempts:
        state.pollAttempts,

      result: state.result,

      hasResult:
        Boolean(
          state.videoUrl ||
          state.downloadUrl
        )
    };
  }

  /* ---------------------------------------------------------
     8. Project data normalization
     --------------------------------------------------------- */

  function normalizeProject(project = {}) {
    const source = project || {};

    const settings =
      source.settings ||
      source.videoSettings ||
      {};

    const ai =
      source.ai ||
      source.aiConfig ||
      {};

    const script =
      source.script ||
      source.lessonScript ||
      "";

    return {
      projectId:
        safeString(
          source.projectId ||
          source.id ||
          `project-${Date.now()}`
        ),

      projectName:
        safeString(
          source.projectName ||
          source.name ||
          "SNK AI Mentor Project"
        ),

      script: safeString(script),

      scriptLanguage:
        safeString(
          source.scriptLanguage ||
          source.language ||
          "bn"
        ),

      scriptStyle:
        safeString(
          source.scriptStyle ||
          source.style ||
          "teaching"
        ),

      settings: {
        format:
          settings.format ||
          DEFAULTS.format,

        resolution:
          settings.resolution ||
          DEFAULTS.resolution,

        mentorPosition:
          settings.mentorPosition ||
          DEFAULTS.mentorPosition,

        background:
          settings.background ||
          DEFAULTS.background,

        aspectRatio:
          settings.aspectRatio ||
          DEFAULTS.aspectRatio,

        fps:
          Number(
            settings.fps ||
            DEFAULTS.fps
          ),

        subtitles:
          Boolean(
            settings.subtitles ??
            DEFAULTS.subtitles
          ),

        audio:
          Boolean(
            settings.audio ??
            DEFAULTS.audio
          )
      },

      ai: {
        mode:
          ai.mode ||
          "demo",

        provider:
          ai.provider ||
          "demo"
      }
    };
  }

  /* ---------------------------------------------------------
     9. File retrieval
     --------------------------------------------------------- */

  function getFaceFile() {
    const avatar = getAvatarEngine();

    if (!avatar) {
      return null;
    }

    if (typeof avatar.getFile === "function") {
      return avatar.getFile();
    }

    if (typeof avatar.getVideoFile === "function") {
      return avatar.getVideoFile();
    }

    if (typeof avatar.getSourceFile === "function") {
      return avatar.getSourceFile();
    }

    return null;
  }

  function getVoiceFile() {
    const voice = getVoiceEngine();

    if (!voice) {
      return null;
    }

    if (typeof voice.getFile === "function") {
      return voice.getFile();
    }

    if (typeof voice.getSample === "function") {
      return voice.getSample();
    }

    return null;
  }

  /* ---------------------------------------------------------
     10. Engine readiness
     --------------------------------------------------------- */

  function avatarReady() {
    const avatar = getAvatarEngine();

    if (!avatar) {
      return false;
    }

    if (typeof avatar.isReady === "function") {
      return Boolean(avatar.isReady());
    }

    return Boolean(getFaceFile());
  }

  function voiceReady() {
    const voice = getVoiceEngine();

    if (!voice) {
      return false;
    }

    if (typeof voice.isReady === "function") {
      return Boolean(voice.isReady());
    }

    return Boolean(getVoiceFile());
  }

  /* ---------------------------------------------------------
     11. Validate project
     --------------------------------------------------------- */

  function validate(project = {}) {
    const normalized =
      normalizeProject(project);

    const errors = [];
    const warnings = [];

    const faceFile = getFaceFile();
    const voiceFile = getVoiceFile();

    /* Face */
    if (!avatarReady() || !faceFile) {
      errors.push(
        "Face video is required."
      );
    }

    /* Voice */
    if (!voiceReady() || !voiceFile) {
      errors.push(
        "Voice sample is required."
      );
    }

    /* Script */
    if (!normalized.script) {
      errors.push(
        "Lesson script is required."
      );
    }

    if (
      normalized.script &&
      normalized.script.length < 10
    ) {
      warnings.push(
        "Lesson script is very short."
      );
    }

    /* Settings */
    if (!normalized.settings.format) {
      errors.push(
        "Video format is missing."
      );
    }

    if (!normalized.settings.resolution) {
      errors.push(
        "Video resolution is missing."
      );
    }

    /* AI Config */
    const config = getAIConfig();

    if (!config) {
      warnings.push(
        "AI configuration engine is unavailable."
      );
    } else {
      const mode =
        typeof config.getMode === "function"
          ? config.getMode()
          : normalized.ai.mode;

      if (
        mode === "live" &&
        typeof config.isConfigured === "function" &&
        !config.isConfigured()
      ) {
        errors.push(
          "Live AI mode is selected but the AI backend is not configured."
        );
      }
    }

    return {
      valid: errors.length === 0,

      errors,
      warnings,

      project: normalized,

      faceFile,
      voiceFile,

      checks: {
        face: avatarReady(),
        voice: voiceReady(),
        script: Boolean(normalized.script),
        settings: Boolean(
          normalized.settings.format &&
          normalized.settings.resolution
        )
      }
    };
  }

  /* ---------------------------------------------------------
     12. Build metadata payload
     --------------------------------------------------------- */

  function buildPayload(project = {}) {
    const normalized =
      normalizeProject(project);

    const avatar =
      getAvatarEngine();

    const voice =
      getVoiceEngine();

    let avatarPayload = null;
    let voicePayload = null;

    if (
      avatar &&
      typeof avatar.buildPayload === "function"
    ) {
      avatarPayload =
        avatar.buildPayload({
          provider:
            normalized.ai.provider
        });
    }

    if (
      voice &&
      typeof voice.buildPayload === "function"
    ) {
      voicePayload =
        voice.buildPayload({
          provider:
            normalized.ai.provider
        });
    }

    return {
      source: "snk-ai-mentor",
      engine: "video",
      version: VERSION,

      project: {
        id: normalized.projectId,
        name: normalized.projectName
      },

      script: {
        text: normalized.script,
        language:
          normalized.scriptLanguage,
        style:
          normalized.scriptStyle
      },

      video: {
        ...normalized.settings
      },

      ai: {
        mode: normalized.ai.mode,
        provider: normalized.ai.provider
      },

      avatar: avatarPayload,

      voice: voicePayload,

      client: {
        userAgent:
          navigator.userAgent || "",
        platform:
          navigator.platform || "",
        timestamp:
          new Date().toISOString()
      }
    };
  }

  /* ---------------------------------------------------------
     13. Build FormData
     --------------------------------------------------------- */

  function buildFormData(project = {}) {
    const validation =
      validate(project);

    if (!validation.valid) {
      throw new Error(
        validation.errors.join(" ")
      );
    }

    const normalized =
      validation.project;

    const formData =
      new FormData();

    /* Metadata */
    const payload =
      buildPayload(normalized);

    formData.append(
      "payload",
      JSON.stringify(payload)
    );

    formData.append(
      "projectId",
      normalized.projectId
    );

    formData.append(
      "projectName",
      normalized.projectName
    );

    formData.append(
      "script",
      normalized.script
    );

    formData.append(
      "scriptLanguage",
      normalized.scriptLanguage
    );

    formData.append(
      "scriptStyle",
      normalized.scriptStyle
    );

    formData.append(
      "format",
      normalized.settings.format
    );

    formData.append(
      "resolution",
      normalized.settings.resolution
    );

    formData.append(
      "mentorPosition",
      normalized.settings.mentorPosition
    );

    formData.append(
      "background",
      normalized.settings.background
    );

    formData.append(
      "aspectRatio",
      normalized.settings.aspectRatio
    );

    formData.append(
      "fps",
      String(normalized.settings.fps)
    );

    formData.append(
      "subtitles",
      String(normalized.settings.subtitles)
    );

    formData.append(
      "audio",
      String(normalized.settings.audio)
    );

    formData.append(
      "mode",
      normalized.ai.mode
    );

    formData.append(
      "provider",
      normalized.ai.provider
    );

    /* Face file */
    if (validation.faceFile) {
      formData.append(
        "faceVideo",
        validation.faceFile,
        validation.faceFile.name ||
          "face-video"
      );
    }

    /* Voice file */
    if (validation.voiceFile) {
      formData.append(
        "voiceSample",
        validation.voiceFile,
        validation.voiceFile.name ||
          "voice-sample"
      );
    }

    return formData;
  }

  /* ---------------------------------------------------------
     14. Request timeout
     --------------------------------------------------------- */

  function fetchWithTimeout(
    url,
    options = {},
    timeout =
      DEFAULTS.requestTimeout
  ) {
    const controller =
      new AbortController();

    const timer =
      window.setTimeout(() => {
        controller.abort();
      }, timeout);

    return fetch(url, {
      ...options,
      signal: controller.signal
    }).finally(() => {
      window.clearTimeout(timer);
    });
  }

  /* ---------------------------------------------------------
     15. Response parsing
     --------------------------------------------------------- */

  async function parseResponse(response) {
    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      return response.json();
    }

    const text =
      await response.text();

    return {
      success: response.ok,
      message: text
    };
  }

  function extractJobId(data) {
    if (!data) {
      return "";
    }

    return safeString(
      data.jobId ||
      data.job_id ||
      data.id ||
      data.taskId ||
      data.task_id ||
      data.data?.jobId ||
      data.data?.job_id ||
      data.data?.id ||
      ""
    );
  }

  function extractVideoUrl(data) {
    if (!data) {
      return "";
    }

    return safeString(
      data.videoUrl ||
      data.video_url ||
      data.outputUrl ||
      data.output_url ||
      data.url ||
      data.data?.videoUrl ||
      data.data?.video_url ||
      data.data?.outputUrl ||
      data.data?.url ||
      ""
    );
  }

  function extractDownloadUrl(data) {
    if (!data) {
      return "";
    }

    return safeString(
      data.downloadUrl ||
      data.download_url ||
      data.data?.downloadUrl ||
      data.data?.download_url ||
      ""
    );
  }

  function extractThumbnailUrl(data) {
    if (!data) {
      return "";
    }

    return safeString(
      data.thumbnailUrl ||
      data.thumbnail_url ||
      data.data?.thumbnailUrl ||
      data.data?.thumbnail_url ||
      ""
    );
  }

  /* ---------------------------------------------------------
     16. Demo generation
     --------------------------------------------------------- */

  async function generateDemo(
    project,
    validation
  ) {
    setStatus(
      "preparing",
      "Preparing demo generation...",
      5
    );

    await sleep(700);

    if (state.cancelled) {
      return null;
    }

    setStatus(
      "uploading",
      "Preparing face and voice assets...",
      18
    );

    await sleep(900);

    if (state.cancelled) {
      return null;
    }

    setStatus(
      "processing",
      "Simulating AI mentor generation...",
      35
    );

    const stages = [
      {
        progress: 48,
        message:
          "Analyzing lesson script..."
      },
      {
        progress: 60,
        message:
          "Preparing mentor animation..."
      },
      {
        progress: 72,
        message:
          "Preparing synthetic voice..."
      },
      {
        progress: 84,
        message:
          "Rendering teaching scene..."
      },
      {
        progress: 94,
        message:
          "Finalizing video..."
      }
    ];

    for (const stage of stages) {
      await sleep(900);

      if (state.cancelled) {
        return null;
      }

      setStatus(
        "processing",
        stage.message,
        stage.progress
      );
    }

    await sleep(700);

    if (state.cancelled) {
      return null;
    }

    /*
      Demo output:
      There is no actual generated MP4.
      We create a safe demo result instead.
    */

    const result = {
      mode: "demo",

      jobId:
        `demo-${Date.now()}`,

      providerJobId: "",

      videoUrl: "",

      downloadUrl: "",

      thumbnailUrl: "",

      demo: true,

      message:
        "Demo generation completed. Connect a secure AI backend to generate the actual MP4."
    };

    updateState({
      processing: false,
      progress: 100,
      status: "completed",
      message:
        result.message,
      jobId: result.jobId,
      providerJobId: "",
      videoUrl: "",
      downloadUrl: "",
      thumbnailUrl: "",
      result,
      completedAt:
        new Date().toISOString()
    });

    emit("complete", {
      result,
      state: getState()
    });

    return result;
  }

  /* ---------------------------------------------------------
     17. Live generation
     --------------------------------------------------------- */

  async function generateLive(
    project,
    validation
  ) {
    const config =
      getAIConfig();

    if (!config) {
      throw new Error(
        "AI configuration engine is unavailable."
      );
    }

    if (
      typeof config.isConfigured ===
        "function" &&
      !config.isConfigured()
    ) {
      throw new Error(
        "Live AI backend is not configured."
      );
    }

    const endpoint =
      typeof config.getGenerateUrl ===
        "function"
        ? config.getGenerateUrl()
        : "";

    if (!endpoint) {
      throw new Error(
        "AI generation endpoint is missing."
      );
    }

    setStatus(
      "uploading",
      "Uploading project assets...",
      12
    );

    const formData =
      buildFormData(project);

    const headers =
      typeof config.buildHeaders ===
        "function"
        ? config.buildHeaders()
        : {};

    /*
      Important:
      Do NOT manually set Content-Type when
      sending FormData.

      The browser creates the correct multipart
      boundary automatically.
    */

    const response =
      await fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          headers,
          body: formData
        },
        typeof config.getRequestTimeout ===
          "function"
          ? config.getRequestTimeout()
          : DEFAULTS.requestTimeout
      );

    const data =
      await parseResponse(response);

    if (!response.ok) {
      throw new Error(
        safeString(
          data?.message ||
          data?.error ||
          `Generation request failed (${response.status}).`
        )
      );
    }

    const jobId =
      extractJobId(data);

    const directVideoUrl =
      extractVideoUrl(data);

    const directDownloadUrl =
      extractDownloadUrl(data);

    const thumbnailUrl =
      extractThumbnailUrl(data);

    /*
      Some backends may return a finished video
      immediately.
    */

    if (
      directVideoUrl ||
      directDownloadUrl
    ) {
      const result = {
        mode: "live",

        jobId,

        providerJobId:
          safeString(
            data.providerJobId ||
            data.provider_job_id ||
            ""
          ),

        videoUrl:
          directVideoUrl,

        downloadUrl:
          directDownloadUrl,

        thumbnailUrl,

        raw: data
      };

      completeWithResult(result);

      return result;
    }

    if (!jobId) {
      throw new Error(
        "Backend accepted the request but did not return a job ID."
      );
    }

    updateState({
      jobId,
      providerJobId:
        safeString(
          data.providerJobId ||
          data.provider_job_id ||
          ""
        ),
      progress:
        Number(
          data.progress || 20
        )
    });

    setStatus(
      "queued",
      "Generation job created. Waiting for processing...",
      Math.max(
        20,
        Number(data.progress) || 20
      )
    );

    return pollJob(jobId);
  }

  /* ---------------------------------------------------------
     18. Poll status
     --------------------------------------------------------- */

  async function pollJob(jobId) {
    const config =
      getAIConfig();

    if (!config) {
      throw new Error(
        "AI configuration engine is unavailable."
      );
    }

    const statusBase =
      typeof config.getStatusUrl ===
        "function"
        ? config.getStatusUrl(jobId)
        : "";

    if (!statusBase) {
      throw new Error(
        "AI status endpoint is missing."
      );
    }

    const maxAttempts =
      typeof config.getMaxPollingAttempts ===
        "function"
        ? config.getMaxPollingAttempts()
        : DEFAULTS.maxPollAttempts;

    const interval =
      typeof config.getPollingInterval ===
        "function"
        ? config.getPollingInterval()
        : DEFAULTS.pollInterval;

    state.pollAttempts = 0;

    while (
      state.pollAttempts <
      maxAttempts
    ) {
      if (state.cancelled) {
        return null;
      }

      state.pollAttempts += 1;

      const response =
        await fetchWithTimeout(
          statusBase,
          {
            method: "GET",
            headers:
              typeof config.buildHeaders ===
                "function"
                ? config.buildHeaders()
                : {}
          },
          typeof config.getRequestTimeout ===
            "function"
            ? config.getRequestTimeout()
            : DEFAULTS.requestTimeout
        );

      const data =
        await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          safeString(
            data?.message ||
            data?.error ||
            `Status request failed (${response.status}).`
          )
        );
      }

      const status =
        safeString(
          data.status ||
          data.state ||
          data.data?.status ||
          data.data?.state ||
          ""
        ).toLowerCase();

      const progress =
        clamp(
          data.progress ??
          data.data?.progress ??
          state.progress
        );

      const videoUrl =
        extractVideoUrl(data);

      const downloadUrl =
        extractDownloadUrl(data);

      const thumbnailUrl =
        extractThumbnailUrl(data);

      if (
        status === "completed" ||
        status === "complete" ||
        status === "success" ||
        status === "succeeded" ||
        videoUrl ||
        downloadUrl
      ) {
        const result = {
          mode: "live",

          jobId,

          providerJobId:
            safeString(
              data.providerJobId ||
              data.provider_job_id ||
              data.data?.providerJobId ||
              ""
            ),

          videoUrl,

          downloadUrl,

          thumbnailUrl,

          raw: data
        };

        completeWithResult(result);

        return result;
      }

      if (
        status === "failed" ||
        status === "error" ||
        status === "cancelled" ||
        status === "canceled"
      ) {
        throw new Error(
          safeString(
            data.message ||
            data.error ||
            data.data?.message ||
            "AI video generation failed."
          )
        );
      }

      setStatus(
        status === "queued"
          ? "queued"
          : "processing",
        safeString(
          data.message ||
          data.data?.message ||
          "AI video is being generated..."
        ),
        Math.max(
          20,
          progress
        )
      );

      emit("progress", {
        progress: state.progress,
        status: state.status,
        message: state.message,
        attempt:
          state.pollAttempts,
        maxAttempts
      });

      await sleep(interval);
    }

    throw new Error(
      "Video generation timed out while waiting for the backend."
    );
  }

  /* ---------------------------------------------------------
     19. Complete result
     --------------------------------------------------------- */

  function completeWithResult(result) {
    const safeResult = {
      ...result
    };

    updateState({
      processing: false,
      cancelled: false,

      progress: 100,
      status: "completed",

      message:
        "AI mentor video is ready.",

      jobId:
        safeResult.jobId ||
        state.jobId,

      providerJobId:
        safeResult.providerJobId ||
        "",

      videoUrl:
        safeResult.videoUrl ||
        "",

      downloadUrl:
        safeResult.downloadUrl ||
        "",

      thumbnailUrl:
        safeResult.thumbnailUrl ||
        "",

      result: safeResult,

      completedAt:
        new Date().toISOString()
    });

    emit("complete", {
      result: safeResult,
      state: getState()
    });
  }

  /* ---------------------------------------------------------
     20. Main generate
     --------------------------------------------------------- */

  async function generate(project = {}) {
    if (state.processing) {
      return {
        success: false,
        error:
          "A video generation job is already running."
      };
    }

    const validation =
      validate(project);

    emit("validation", validation);

    if (!validation.valid) {
      setError(
        validation.errors.join(" ")
      );

      return {
        success: false,
        errors: validation.errors,
        warnings:
          validation.warnings
      };
    }

    state.processing = true;
    state.cancelled = false;

    state.progress = 0;
    state.status = "starting";

    state.message =
      "Starting AI mentor generation...";

    state.error = "";

    state.jobId = "";
    state.providerJobId = "";

    state.videoUrl = "";
    state.downloadUrl = "";
    state.thumbnailUrl = "";

    state.result = null;

    state.createdAt =
      new Date().toISOString();

    state.completedAt = null;

    state.requestStartedAt =
      new Date().toISOString();

    state.pollAttempts = 0;

    const normalized =
      validation.project;

    const payload =
      buildPayload(normalized);

    state.lastPayload = payload;

    emit("start", {
      project: normalized,
      validation,
      payload,
      state: getState()
    });

    try {
      const config =
        getAIConfig();

      let mode =
        normalized.ai.mode ||
        "demo";

      if (
        config &&
        typeof config.getMode ===
          "function"
      ) {
        mode =
          config.getMode() ||
          mode;
      }

      let result = null;

      if (mode === "live") {
        result =
          await generateLive(
            normalized,
            validation
          );
      } else {
        result =
          await generateDemo(
            normalized,
            validation
          );
      }

      if (!result) {
        if (state.cancelled) {
          updateState({
            processing: false,
            status: "cancelled",
            message:
              "Generation cancelled."
          });

          emit("cancelled", {
            state: getState()
          });

          return {
            success: false,
            cancelled: true
          };
        }

        return {
          success: false,
          error:
            "Generation did not return a result."
        };
      }

      return {
        success: true,
        result,
        state: getState()
      };
    } catch (error) {
      if (state.cancelled) {
        updateState({
          processing: false,
          status: "cancelled",
          message:
            "Generation cancelled."
        });

        emit("cancelled", {
          state: getState()
        });

        return {
          success: false,
          cancelled: true
        };
      }

      const message =
        error &&
        error.name === "AbortError"
          ? "The generation request timed out."
          : safeString(
              error?.message ||
              error ||
              "Video generation failed."
            );

      setError(message);

      return {
        success: false,
        error: message
      };
    }
  }

  /* ---------------------------------------------------------
     21. Cancel
     --------------------------------------------------------- */

  async function cancel() {
    if (!state.processing) {
      return {
        success: false,
        message:
          "No active generation job."
      };
    }

    state.cancelled = true;

    /*
      Local/demo generation stops naturally
      at the next checkpoint.

      For live jobs, backend cancellation can
      optionally be added later with a dedicated
      DELETE /cancel endpoint.
    */

    updateState({
      processing: false,
      status: "cancelled",
      message:
        "Generation cancellation requested."
    });

    emit("cancelled", {
      jobId: state.jobId,
      state: getState()
    });

    return {
      success: true,
      jobId: state.jobId
    };
  }

  /* ---------------------------------------------------------
     22. Open video
     --------------------------------------------------------- */

  function openVideo(url = "") {
    const target =
      safeString(
        url ||
        state.videoUrl
      );

    if (!target) {
      return false;
    }

    window.open(
      target,
      "_blank",
      "noopener,noreferrer"
    );

    return true;
  }

  /* ---------------------------------------------------------
     23. Download video
     --------------------------------------------------------- */

  function download(url = "", filename = "") {
    const target =
      safeString(
        url ||
        state.downloadUrl ||
        state.videoUrl
      );

    if (!target) {
      return false;
    }

    const link =
      document.createElement("a");

    link.href = target;

    link.target = "_blank";

    link.rel =
      "noopener noreferrer";

    if (filename) {
      link.download = filename;
    }

    document.body.appendChild(link);

    link.click();

    link.remove();

    return true;
  }

  /* ---------------------------------------------------------
     24. Reset result
     --------------------------------------------------------- */

  function reset() {
    if (state.processing) {
      state.cancelled = true;
    }

    updateState({
      processing: false,
      cancelled: false,

      progress: 0,
      status: "idle",

      message: "",
      error: "",

      jobId: "",
      providerJobId: "",

      videoUrl: "",
      downloadUrl: "",
      thumbnailUrl: "",

      createdAt: null,
      completedAt: null,

      requestStartedAt: null,

      pollAttempts: 0,

      result: null,
      lastPayload: null
    });

    emit("reset", {
      state: getState()
    });
  }

  /* ---------------------------------------------------------
     25. Readiness summary
     --------------------------------------------------------- */

  function getReadiness(project = {}) {
    const validation =
      validate(project);

    return {
      ready: validation.valid,

      errors:
        validation.errors.slice(),

      warnings:
        validation.warnings.slice(),

      checks: {
        face:
          validation.checks.face,

        voice:
          validation.checks.voice,

        script:
          validation.checks.script,

        settings:
          validation.checks.settings
      }
    };
  }

  /* ---------------------------------------------------------
     26. Public API
     --------------------------------------------------------- */

  const Video = {
    VERSION,

    DEFAULTS: {
      ...DEFAULTS
    },

    /* generation */
    generate,
    generateDemo,
    generateLive,

    /* validation */
    validate,
    getReadiness,

    /* payload */
    buildPayload,
    buildFormData,

    /* job */
    pollJob,
    cancel,

    /* result */
    openVideo,
    download,

    /* state */
    getState,
    reset,

    /* events */
    on
  };

  /* ---------------------------------------------------------
     27. Expose
     --------------------------------------------------------- */

  window.SNKAI.Video = Video;

  console.log(
    "%cSNK AI Mentor%c Video Engine v" +
      VERSION +
      " loaded.",
    "font-weight:700;color:#7dd3fc;",
    "font-weight:400;color:inherit;"
  );
})();
