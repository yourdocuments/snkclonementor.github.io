/* =========================================================
   SNK AI MENTOR
   mentor/ai-mentor.js

   STEP 22
   Full Studio + AI Configuration Integration

   Depends on:
   ../script.js
   ../ai/ai-config.js
   ../ai/avatar.js
   ../ai/voice.js
   ../ai/video.js
   ========================================================= */

(() => {
  "use strict";

  /* =========================================================
     1. SAFE HELPERS
  ========================================================= */

  const $ = (id) => document.getElementById(id);

  const qs = (selector, root = document) =>
    root.querySelector(selector);

  const qsa = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const safeText = (value) =>
    value === null || value === undefined
      ? ""
      : String(value);

  const clamp = (value, min, max) =>
    Math.min(Math.max(value, min), max);

  const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";

    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1
    );

    return `${(bytes / Math.pow(1024, index)).toFixed(
      index === 0 ? 0 : 1
    )} ${units[index]}`;
  };

  const formatDateTime = (date = new Date()) => {
    try {
      return date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short"
      });
    } catch {
      return date.toLocaleString();
    }
  };


  /* =========================================================
     2. STORAGE
  ========================================================= */

  const STORAGE = {
    project: "snkAiMentorProject",
    studio: "snkAiMentorStudioState"
  };


  /* =========================================================
     3. DOM
  ========================================================= */

  const els = {
    faceVideoInput: $("faceVideoInput"),
    faceUploadArea: $("faceUploadArea"),
    faceUploadEmpty: $("faceUploadEmpty"),
    facePreviewWrapper: $("facePreviewWrapper"),
    faceVideoPreview: $("faceVideoPreview"),
    selectFaceVideoBtn: $("selectFaceVideoBtn"),
    changeFaceVideoBtn: $("changeFaceVideoBtn"),

    voiceInput: $("voiceInput"),
    voiceUploadArea: $("voiceUploadArea"),
    voiceUploadEmpty: $("voiceUploadEmpty"),
    voicePreview: $("voicePreview"),
    voiceAudioPlayer: $("voiceAudioPlayer"),
    voiceFileName: $("voiceFileName"),
    voiceFileMeta: $("voiceFileMeta"),
    selectVoiceBtn: $("selectVoiceBtn"),
    removeVoiceBtn: $("removeVoiceBtn"),

    lessonScript: $("lessonScript"),
    scriptLanguage: $("scriptLanguage"),
    scriptStyle: $("scriptStyle"),
    wordCount: $("wordCount"),
    charCount: $("charCount"),
    autosaveStatus: $("autosaveStatus"),
    clearScriptBtn: $("clearScriptBtn"),

    projectName: $("projectName"),
    projectNameTop: $("projectNameTop"),
    saveProjectBtn: $("saveProjectBtn"),
    sidebarSaveBtn: $("sidebarSaveBtn"),
    savedTime: $("savedTime"),

    videoFormat: $("videoFormat"),
    videoResolution: $("videoResolution"),
    mentorPosition: $("mentorPosition"),
    videoBackground: $("videoBackground"),

    studioStatus: $("studioStatus"),
    readinessPercent: $("readinessPercent"),
    readinessProgress: $("readinessProgress"),

    checkFace: $("checkFace"),
    checkVoice: $("checkVoice"),
    checkScript: $("checkScript"),
    checkSettings: $("checkSettings"),

    prepareVideoBtn: $("prepareVideoBtn"),
    exportProjectBtn: $("exportProjectBtn"),

    mentorToast: $("mentorToast"),
    toastMessage: $("toastMessage")
  };


  /* =========================================================
     4. STATE
  ========================================================= */

  const state = {
    faceFile: null,
    voiceFile: null,

    faceUrl: "",
    voiceUrl: "",

    projectName: "My AI Lesson",
    savedAt: null,

    generating: false,
    generationStartedAt: null,

    aiMode: "demo",
    aiProvider: "demo",
    aiConnected: false,

    initialized: false
  };


  /* =========================================================
     5. AI CONFIG ACCESS
  ========================================================= */

  const getAIConfig = () => {
    return window.SNKAI &&
      window.SNKAI.AIConfig
      ? window.SNKAI.AIConfig
      : null;
  };


  /* =========================================================
     6. TOAST
  ========================================================= */

  let toastTimer = null;

  function showToast(message, type = "info", duration = 3200) {

    if (!els.mentorToast) return;

    if (els.toastMessage) {
      els.toastMessage.textContent = safeText(message);
    } else {
      els.mentorToast.textContent = safeText(message);
    }

    els.mentorToast.classList.remove(
      "show",
      "success",
      "error"
    );

    if (type === "success") {
      els.mentorToast.classList.add("success");
    }

    if (type === "error") {
      els.mentorToast.classList.add("error");
    }

    requestAnimationFrame(() => {
      els.mentorToast.classList.add("show");
    });

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      els.mentorToast.classList.remove("show");
    }, duration);
  }


  /* =========================================================
     7. AI CONFIG UI DISCOVERY
  ========================================================= */

  function getConfigElements() {

    return {
      modeInputs: qsa(
        'input[name="aiMode"], input[data-ai-mode]'
      ),

      provider:
        $("aiProvider") ||
        $("aiProviderSelect") ||
        qs("[data-ai-provider]"),

      apiBaseUrl:
        $("aiBaseUrl") ||
        $("aiApiBaseUrl") ||
        qs("[data-ai-base-url]"),

      apiKey:
        $("aiApiKey") ||
        $("aiApiKeyInput") ||
        qs("[data-ai-api-key]"),

      generateEndpoint:
        $("aiGenerateEndpoint") ||
        qs("[data-ai-generate-endpoint]"),

      statusEndpoint:
        $("aiStatusEndpoint") ||
        qs("[data-ai-status-endpoint]"),

      testButton:
        $("testAIConnectionBtn") ||
        $("aiTestConnectionBtn") ||
        qs("[data-ai-test]"),

      saveButton:
        $("saveAIConfigBtn") ||
        $("aiSaveConfigBtn") ||
        qs("[data-ai-save]"),

      resetButton:
        $("resetAIConfigBtn") ||
        $("aiResetConfigBtn") ||
        qs("[data-ai-reset]"),

      keyToggle:
        $("toggleAIKeyBtn") ||
        $("aiKeyToggle") ||
        qs("[data-ai-key-toggle]"),

      status:
        $("aiConnectionStatus") ||
        qs("[data-ai-connection-status]"),

      providerLabel:
        $("aiConnectionProvider") ||
        qs("[data-ai-connection-provider]"),

      endpointLabel:
        $("aiConnectionEndpoint") ||
        qs("[data-ai-connection-endpoint]"),

      modeLabel:
        $("aiConnectionMode") ||
        qs("[data-ai-connection-mode]"),

      warning:
        $("aiLiveWarning") ||
        qs("[data-ai-live-warning]"),

      demoNote:
        $("aiDemoNote") ||
        qs("[data-ai-demo-note]")
    };
  }


  /* =========================================================
     8. CONFIG VALUES
  ========================================================= */

  function getCurrentConfig() {

    const config = getAIConfig();

    if (!config) return null;

    try {
      if (typeof config.getConfig === "function") {
        return config.getConfig();
      }

      if (typeof config.get === "function") {
        return config.get();
      }

      if (config.config) {
        return config.config;
      }

      return null;

    } catch (error) {
      console.warn(
        "SNK AI Mentor: unable to read AI config",
        error
      );

      return null;
    }
  }


  /* =========================================================
     9. CONFIG SETTER
  ========================================================= */

  function updateAIConfig(patch) {

    const config = getAIConfig();

    if (!config) {
      showToast(
        "AI configuration module is not loaded.",
        "error"
      );

      return false;
    }

    try {

      if (typeof config.update === "function") {
        config.update(patch);
        return true;
      }

      if (typeof config.setConfig === "function") {
        config.setConfig(patch);
        return true;
      }

      if (typeof config.set === "function") {
        Object.entries(patch).forEach(
          ([key, value]) => config.set(key, value)
        );

        return true;
      }

      return false;

    } catch (error) {

      console.error(
        "SNK AI Mentor: AI config update failed",
        error
      );

      showToast(
        "Could not update AI configuration.",
        "error"
      );

      return false;
    }
  }


  /* =========================================================
     10. MODE
  ========================================================= */

  function getSelectedMode() {

    const configEls = getConfigElements();

    const selected = configEls.modeInputs.find(
      input => input.checked
    );

    if (selected) {

      return (
        selected.value ||
        selected.dataset.aiMode ||
        "demo"
      ).toLowerCase();
    }

    const config = getCurrentConfig();

    return (
      config?.mode ||
      state.aiMode ||
      "demo"
    ).toLowerCase();
  }


  function setModeUI(mode) {

    mode = mode === "live"
      ? "live"
      : "demo";

    state.aiMode = mode;

    const root = document.documentElement;

    root.dataset.aiMode = mode;

    const configEls = getConfigElements();

    configEls.modeInputs.forEach(input => {

      const value = (
        input.value ||
        input.dataset.aiMode ||
        ""
      ).toLowerCase();

      input.checked = value === mode;
    });

    if (configEls.warning) {
      configEls.warning.hidden = mode !== "live";
    }

    if (configEls.demoNote) {
      configEls.demoNote.hidden = mode !== "demo";
    }

    if (configEls.modeLabel) {
      configEls.modeLabel.textContent =
        mode === "live"
          ? "Live"
          : "Demo";
    }
  }


  /* =========================================================
     11. PROVIDER
  ========================================================= */

  function getProviderValue() {

    const configEls = getConfigElements();

    if (configEls.provider) {
      return (
        configEls.provider.value ||
        "demo"
      );
    }

    const config = getCurrentConfig();

    return (
      config?.provider ||
      state.aiProvider ||
      "demo"
    );
  }


  function setProviderUI(provider) {

    provider = safeText(provider || "demo");

    state.aiProvider = provider;

    const configEls = getConfigElements();

    if (configEls.provider) {
      configEls.provider.value = provider;
    }

    if (configEls.providerLabel) {
      configEls.providerLabel.textContent =
        provider || "Demo";
    }
  }


  /* =========================================================
     12. CONFIG UI REFRESH
  ========================================================= */

  function refreshAIConfigUI() {

    const config = getCurrentConfig();
    const configEls = getConfigElements();

    if (!config) {

      setModeUI("demo");
      setProviderUI("demo");

      if (configEls.status) {
        configEls.status.textContent =
          "Configuration module unavailable";

        configEls.status.classList.remove(
          "connected",
          "error"
        );
      }

      return;
    }

    const mode =
      config.mode ||
      "demo";

    const provider =
      config.provider ||
      "demo";

    state.aiMode = mode;
    state.aiProvider = provider;

    setModeUI(mode);
    setProviderUI(provider);

    if (configEls.apiBaseUrl) {
      configEls.apiBaseUrl.value =
        config.apiBaseUrl || "";
    }

    if (configEls.generateEndpoint) {
      configEls.generateEndpoint.value =
        config.generateEndpoint ||
        "/api/ai/video/generate";
    }

    if (configEls.statusEndpoint) {
      configEls.statusEndpoint.value =
        config.statusEndpoint ||
        "/api/ai/video/status";
    }

    if (configEls.endpointLabel) {

      let endpoint = "";

      try {

        if (
          typeof config.getGenerateUrl ===
          "function"
        ) {
          endpoint =
            config.getGenerateUrl() || "";
        } else {
          endpoint =
            config.providerEndpoint ||
            config.apiBaseUrl ||
            "";
        }

      } catch {
        endpoint = "";
      }

      configEls.endpointLabel.textContent =
        endpoint || "Not configured";
    }

    updateConnectionState();
  }


  /* =========================================================
     13. CONNECTION STATE
  ========================================================= */

  function updateConnectionState(
    connected = state.aiConnected
  ) {

    state.aiConnected = Boolean(connected);

    const configEls = getConfigElements();

    if (!configEls.status) return;

    if (state.aiMode === "demo") {

      configEls.status.textContent =
        "Demo Engine Ready";

      configEls.status.classList.remove(
        "error"
      );

      configEls.status.classList.add(
        "connected"
      );

      return;
    }

    if (state.aiConnected) {

      configEls.status.textContent =
        "Connected";

      configEls.status.classList.remove(
        "error"
      );

      configEls.status.classList.add(
        "connected"
      );

    } else {

      configEls.status.textContent =
        "Not Connected";

      configEls.status.classList.remove(
        "connected"
      );

      configEls.status.classList.add(
        "error"
      );
    }
  }


  /* =========================================================
     14. SAVE AI CONFIG
  ========================================================= */

  function saveAIConfiguration() {

    const config = getAIConfig();

    if (!config) {
      showToast(
        "AI configuration module is unavailable.",
        "error"
      );

      return;
    }

    const configEls = getConfigElements();

    const mode =
      getSelectedMode();

    const provider =
      configEls.provider?.value ||
      "demo";

    const patch = {
      mode,
      provider
    };

    if (configEls.apiBaseUrl) {
      patch.apiBaseUrl =
        configEls.apiBaseUrl.value.trim();
    }

    if (configEls.generateEndpoint) {
      patch.generateEndpoint =
        configEls.generateEndpoint.value.trim();
    }

    if (configEls.statusEndpoint) {
      patch.statusEndpoint =
        configEls.statusEndpoint.value.trim();
    }

    /*
      API key intentionally remains in memory.
      ai-config.js controls whether/how it is stored.
    */

    if (configEls.apiKey) {

      const key =
        configEls.apiKey.value.trim();

      if (key) {
        patch.apiKey = key;
      }
    }

    const updated =
      updateAIConfig(patch);

    if (!updated) {

      showToast(
        "Unable to save AI configuration.",
        "error"
      );

      return;
    }

    state.aiMode = mode;
    state.aiProvider = provider;

    setModeUI(mode);
    setProviderUI(provider);

    showToast(
      "AI configuration saved.",
      "success"
    );

    updateConnectionState(false);

    saveStudioState();
  }


  /* =========================================================
     15. TEST CONNECTION
  ========================================================= */

  async function testAIConnection() {

    const config = getAIConfig();

    if (!config) {

      showToast(
        "AI configuration module is unavailable.",
        "error"
      );

      return;
    }

    const configEls = getConfigElements();

    const mode =
      getSelectedMode();

    if (mode === "demo") {

      state.aiConnected = true;

      updateConnectionState(true);

      showToast(
        "Demo AI engine is ready.",
        "success"
      );

      return;
    }

    /*
      Apply unsaved UI values before testing.
    */

    const patch = {
      mode,
      provider:
        configEls.provider?.value ||
        "demo"
    };

    if (configEls.apiBaseUrl) {
      patch.apiBaseUrl =
        configEls.apiBaseUrl.value.trim();
    }

    if (configEls.generateEndpoint) {
      patch.generateEndpoint =
        configEls.generateEndpoint.value.trim();
    }

    if (configEls.statusEndpoint) {
      patch.statusEndpoint =
        configEls.statusEndpoint.value.trim();
    }

    if (configEls.apiKey) {

      const key =
        configEls.apiKey.value.trim();

      if (key) {
        patch.apiKey = key;
      }
    }

    updateAIConfig(patch);

    if (configEls.testButton) {

      configEls.testButton.disabled = true;
      configEls.testButton.dataset.originalText =
        configEls.testButton.textContent;

      configEls.testButton.textContent =
        "Testing...";
    }

    try {

      let result;

      if (
        typeof config.testConnection ===
        "function"
      ) {

        result =
          await config.testConnection();

      } else {

        /*
          Fallback if config module does not
          expose testConnection().
        */

        const endpoint =
          typeof config.getGenerateUrl ===
          "function"
            ? config.getGenerateUrl()
            : "";

        if (!endpoint) {
          throw new Error(
            "No API endpoint configured."
          );
        }

        const controller =
          new AbortController();

        const timeout =
          setTimeout(
            () => controller.abort(),
            10000
          );

        const response =
          await fetch(
            endpoint,
            {
              method:"OPTIONS",
              headers:
                typeof config.buildHeaders ===
                "function"
                  ? config.buildHeaders()
                  : {},
              signal:
                controller.signal
            }
          );

        clearTimeout(timeout);

        result = {
          ok:
            response.ok ||
            response.status < 500,
          status:
            response.status
        };
      }

      const success =
        result === true ||
        result?.ok === true ||
        result?.connected === true ||
        result?.success === true;

      state.aiConnected =
        Boolean(success);

      updateConnectionState(success);

      if (success) {

        showToast(
          "AI provider connection successful.",
          "success"
        );

      } else {

        showToast(
          result?.message ||
          "AI provider could not be reached.",
          "error"
        );
      }

    } catch (error) {

      console.error(
        "SNK AI Mentor connection test:",
        error
      );

      state.aiConnected = false;

      updateConnectionState(false);

      showToast(
        error?.message ||
        "Connection test failed.",
        "error"
      );

    } finally {

      if (configEls.testButton) {

        configEls.testButton.disabled = false;

        configEls.testButton.textContent =
          configEls.testButton.dataset.originalText ||
          "Test Connection";
      }
    }
  }


  /* =========================================================
     16. RESET AI CONFIG
  ========================================================= */

  function resetAIConfiguration() {

    const config = getAIConfig();

    if (!config) return;

    const confirmed =
      window.confirm(
        "Reset AI configuration to Demo mode?"
      );

    if (!confirmed) return;

    try {

      if (
        typeof config.reset ===
        "function"
      ) {
        config.reset();
      } else {
        updateAIConfig({
          mode:"demo",
          provider:"demo",
          apiBaseUrl:"",
          generateEndpoint:
            "/api/ai/video/generate",
          statusEndpoint:
            "/api/ai/video/status"
        });
      }

      state.aiMode = "demo";
      state.aiProvider = "demo";
      state.aiConnected = true;

      refreshAIConfigUI();

      showToast(
        "AI configuration reset to Demo.",
        "success"
      );

    } catch (error) {

      console.error(error);

      showToast(
        "Could not reset AI configuration.",
        "error"
      );
    }
  }


  /* =========================================================
     17. API KEY TOGGLE
  ========================================================= */

  function toggleAPIKey() {

    const configEls = getConfigElements();

    if (!configEls.apiKey) return;

    const isPassword =
      configEls.apiKey.type === "password";

    configEls.apiKey.type =
      isPassword
        ? "text"
        : "password";

    if (configEls.keyToggle) {

      configEls.keyToggle.textContent =
        isPassword
          ? "Hide"
          : "Show";
    }
  }


  /* =========================================================
     18. AI CONFIG EVENTS
  ========================================================= */

  function bindAIConfigEvents() {

    const configEls =
      getConfigElements();

    configEls.modeInputs.forEach(input => {

      input.addEventListener(
        "change",
        () => {

          const mode =
            (
              input.value ||
              input.dataset.aiMode ||
              "demo"
            ).toLowerCase();

          setModeUI(mode);

          updateAIConfig({
            mode
          });

          state.aiConnected =
            mode === "demo";

          updateConnectionState(
            state.aiConnected
          );

          showToast(
            mode === "live"
              ? "Live AI mode selected."
              : "Demo AI mode selected.",
            "info"
          );
        }
      );
    });


    if (configEls.provider) {

      configEls.provider.addEventListener(
        "change",
        () => {

          const provider =
            configEls.provider.value ||
            "demo";

          state.aiProvider =
            provider;

          updateAIConfig({
            provider
          });

          setProviderUI(provider);

          if (state.aiMode === "live") {
            state.aiConnected = false;
            updateConnectionState(false);
          }
        }
      );
    }


    if (configEls.saveButton) {

      configEls.saveButton.addEventListener(
        "click",
        saveAIConfiguration
      );
    }


    if (configEls.testButton) {

      configEls.testButton.addEventListener(
        "click",
        testAIConnection
      );
    }


    if (configEls.resetButton) {

      configEls.resetButton.addEventListener(
        "click",
        resetAIConfiguration
      );
    }


    if (configEls.keyToggle) {

      configEls.keyToggle.addEventListener(
        "click",
        toggleAPIKey
      );
    }
  }


  /* =========================================================
     19. FACE VIDEO
  ========================================================= */

  function handleFaceVideo(file) {

    if (!file) return;

    if (!file.type.startsWith("video/")) {

      showToast(
        "Please select a valid video file.",
        "error"
      );

      return;
    }

    state.faceFile = file;

    if (state.faceUrl) {
      URL.revokeObjectURL(
        state.faceUrl
      );
    }

    state.faceUrl =
      URL.createObjectURL(file);

    if (els.faceVideoPreview) {

      els.faceVideoPreview.src =
        state.faceUrl;

      els.faceVideoPreview.load();
    }

    if (els.facePreviewWrapper) {
      els.facePreviewWrapper.hidden =
        false;
    }

    if (els.faceUploadEmpty) {
      els.faceUploadEmpty.hidden =
        true;
    }

    updateReadiness();

    saveStudioState();

    showToast(
      `Face video loaded: ${file.name}`,
      "success"
    );
  }


  function clearFaceVideo() {

    if (state.faceUrl) {

      URL.revokeObjectURL(
        state.faceUrl
      );

      state.faceUrl = "";
    }

    state.faceFile = null;

    if (els.faceVideoPreview) {
      els.faceVideoPreview.removeAttribute(
        "src"
      );

      els.faceVideoPreview.load();
    }

    if (els.facePreviewWrapper) {
      els.facePreviewWrapper.hidden =
        true;
    }

    if (els.faceUploadEmpty) {
      els.faceUploadEmpty.hidden =
        false;
    }

    if (els.faceVideoInput) {
      els.faceVideoInput.value = "";
    }

    updateReadiness();

    saveStudioState();
  }


  /* =========================================================
     20. VOICE
  ========================================================= */

  function handleVoiceFile(file) {

    if (!file) return;

    if (
      !file.type.startsWith("audio/")
    ) {

      showToast(
        "Please select a valid audio file.",
        "error"
      );

      return;
    }

    state.voiceFile = file;

    if (state.voiceUrl) {

      URL.revokeObjectURL(
        state.voiceUrl
      );
    }

    state.voiceUrl =
      URL.createObjectURL(file);

    if (els.voiceAudioPlayer) {

      els.voiceAudioPlayer.src =
        state.voiceUrl;

      els.voiceAudioPlayer.load();
    }

    if (els.voiceFileName) {
      els.voiceFileName.textContent =
        file.name;
    }

    if (els.voiceFileMeta) {

      els.voiceFileMeta.textContent =
        `${formatBytes(file.size)} • ${file.type || "Audio"}`;
    }

    if (els.voicePreview) {
      els.voicePreview.hidden =
        false;
    }

    if (els.voiceUploadEmpty) {
      els.voiceUploadEmpty.hidden =
        true;
    }

    updateReadiness();

    saveStudioState();

    showToast(
      `Voice sample loaded: ${file.name}`,
      "success"
    );
  }


  function clearVoiceFile() {

    if (state.voiceUrl) {

      URL.revokeObjectURL(
        state.voiceUrl
      );

      state.voiceUrl = "";
    }

    state.voiceFile = null;

    if (els.voiceAudioPlayer) {
      els.voiceAudioPlayer.removeAttribute(
        "src"
      );

      els.voiceAudioPlayer.load();
    }

    if (els.voiceFileName) {
      els.voiceFileName.textContent =
        "No voice sample";
    }

    if (els.voiceFileMeta) {
      els.voiceFileMeta.textContent =
        "";
    }

    if (els.voicePreview) {
      els.voicePreview.hidden =
        true;
    }

    if (els.voiceUploadEmpty) {
      els.voiceUploadEmpty.hidden =
        false;
    }

    if (els.voiceInput) {
      els.voiceInput.value = "";
    }

    updateReadiness();

    saveStudioState();
  }


  /* =========================================================
     21. SCRIPT COUNTER
  ========================================================= */

  function updateScriptStats() {

    if (!els.lessonScript) return;

    const text =
      els.lessonScript.value || "";

    const chars =
      text.length;

    const words =
      text.trim()
        ? text.trim().split(/\s+/).length
        : 0;

    if (els.wordCount) {
      els.wordCount.textContent =
        words;
    }

    if (els.charCount) {
      els.charCount.textContent =
        chars;
    }

    if (els.autosaveStatus) {

      els.autosaveStatus.textContent =
        "Saving…";

      els.autosaveStatus.classList.remove(
        "saved"
      );
    }

    clearTimeout(
      updateScriptStats.timer
    );

    updateScriptStats.timer =
      setTimeout(() => {

        saveStudioState();

        if (els.autosaveStatus) {

          els.autosaveStatus.textContent =
            "Auto-saved";

          els.autosaveStatus.classList.add(
            "saved"
          );
        }

      }, 650);

    updateReadiness();
  }


  /* =========================================================
     22. CLEAR SCRIPT
  ========================================================= */

  function clearLessonScript() {

    if (!els.lessonScript) return;

    if (
      els.lessonScript.value.trim() &&
      !window.confirm(
        "Clear the current lesson script?"
      )
    ) {
      return;
    }

    els.lessonScript.value = "";

    updateScriptStats();

    showToast(
      "Lesson script cleared.",
      "info"
    );
  }


  /* =========================================================
     23. PROJECT NAME
  ========================================================= */

  function updateProjectName(value) {

    const name =
      safeText(value).trim() ||
      "My AI Lesson";

    state.projectName = name;

    if (
      els.projectName &&
      els.projectName.value !== name
    ) {
      els.projectName.value =
        name;
    }

    if (
      els.projectNameTop &&
      els.projectNameTop.value !== name
    ) {
      els.projectNameTop.value =
        name;
    }
  }


  function bindProjectNameSync() {

    if (els.projectName) {

      els.projectName.addEventListener(
        "input",
        () => {

          updateProjectName(
            els.projectName.value
          );

          saveStudioState();
        }
      );
    }

    if (els.projectNameTop) {

      els.projectNameTop.addEventListener(
        "input",
        () => {

          updateProjectName(
            els.projectNameTop.value
          );

          saveStudioState();
        }
      );
    }
  }


  /* =========================================================
     24. READINESS
  ========================================================= */

  function updateCheckElement(
    element,
    done
  ) {

    if (!element) return;

    const item =
      element.closest(
        ".readiness-item"
      ) ||
      element.parentElement;

    if (done) {

      element.textContent = "✓";

      item?.classList.add(
        "done"
      );

    } else {

      element.textContent = "•";

      item?.classList.remove(
        "done"
      );
    }
  }


  function calculateReadiness() {

    const faceReady =
      Boolean(state.faceFile);

    const voiceReady =
      Boolean(state.voiceFile);

    const scriptReady =
      Boolean(
        els.lessonScript &&
        els.lessonScript.value.trim().length >= 10
      );

    const settingsReady =
      Boolean(
        els.videoFormat?.value &&
        els.videoResolution?.value &&
        els.mentorPosition?.value &&
        els.videoBackground?.value
      );

    /*
      Live mode requires provider connection.
      Demo mode is ready automatically.
    */

    const aiReady =
      state.aiMode === "demo"
        ? true
        : state.aiConnected;

    updateCheckElement(
      els.checkFace,
      faceReady
    );

    updateCheckElement(
      els.checkVoice,
      voiceReady
    );

    updateCheckElement(
      els.checkScript,
      scriptReady
    );

    updateCheckElement(
      els.checkSettings,
      settingsReady && aiReady
    );

    /*
      Four primary readiness areas:
      Face
      Voice
      Script
      Settings / AI
    */

    const total =
      [
        faceReady,
        voiceReady,
        scriptReady,
        settingsReady && aiReady
      ].filter(Boolean).length;

    const percent =
      Math.round(
        (total / 4) * 100
      );

    return {
      faceReady,
      voiceReady,
      scriptReady,
      settingsReady,
      aiReady,
      percent
    };
  }


  function updateReadiness() {

    const result =
      calculateReadiness();

    if (els.readinessPercent) {

      els.readinessPercent.textContent =
        `${result.percent}%`;
    }

    if (els.readinessProgress) {

      els.readinessProgress.style.width =
        `${result.percent}%`;
    }

    updateStudioStatus(
      result
    );

    if (els.prepareVideoBtn) {

      /*
        The button can be clicked in demo mode
        only when the basic inputs are ready.
      */

      const ready =
        result.percent === 100;

      els.prepareVideoBtn.disabled =
        !ready ||
        state.generating;
    }

    return result;
  }


  /* =========================================================
     25. STUDIO STATUS
  ========================================================= */

  function updateStudioStatus(
    readiness
  ) {

    if (!els.studioStatus) return;

    const {
      percent,
      aiReady
    } = readiness;

    let text =
      "Ready to configure";

    let statusClass =
      "";

    if (percent === 100) {

      text =
        state.aiMode === "live"
          ? "Ready for live generation"
          : "Ready for demo generation";

      statusClass =
        "ready";

    } else if (
      state.aiMode === "live" &&
      !aiReady
    ) {

      text =
        "Connect AI provider";

      statusClass =
        "error";

    } else {

      text =
        "Complete the preparation steps";
    }

    els.studioStatus.textContent =
      text;

    const parent =
      els.studioStatus.closest(
        ".studio-status"
      );

    if (parent) {

      parent.classList.remove(
        "ready",
        "error"
      );

      if (statusClass) {
        parent.classList.add(
          statusClass
        );
      }
    }
  }


  /* =========================================================
     26. PROJECT DATA
  ========================================================= */

  function collectProjectData() {

    return {
      version: 22,

      projectName:
        state.projectName ||
        "My AI Lesson",

      savedAt:
        new Date().toISOString(),

      ai: {
        mode:
          state.aiMode,

        provider:
          state.aiProvider,

        connected:
          state.aiConnected
      },

      face: {
        name:
          state.faceFile?.name ||
          "",

        size:
          state.faceFile?.size ||
          0,

        type:
          state.faceFile?.type ||
          ""
      },

      voice: {
        name:
          state.voiceFile?.name ||
          "",

        size:
          state.voiceFile?.size ||
          0,

        type:
          state.voiceFile?.type ||
          ""
      },

      lesson: {
        script:
          els.lessonScript?.value ||
          "",

        language:
          els.scriptLanguage?.value ||
          "en",

        style:
          els.scriptStyle?.value ||
          "professional"
      },

      video: {
        format:
          els.videoFormat?.value ||
          "mp4",

        resolution:
          els.videoResolution?.value ||
          "1080p",

        mentorPosition:
          els.mentorPosition?.value ||
          "right",

        background:
          els.videoBackground?.value ||
          "studio"
      }
    };
  }


  /* =========================================================
     27. SAVE PROJECT
  ========================================================= */

  function saveStudioState() {

    try {

      const project =
        collectProjectData();

      project.savedAt =
        new Date().toISOString();

      localStorage.setItem(
        STORAGE.project,
        JSON.stringify(project)
      );

      localStorage.setItem(
        STORAGE.studio,
        JSON.stringify({
          projectName:
            state.projectName,
          savedAt:
            project.savedAt,
          aiMode:
            state.aiMode,
          aiProvider:
            state.aiProvider
        })
      );

      state.savedAt =
        project.savedAt;

      if (els.savedTime) {

        els.savedTime.textContent =
          `Saved ${formatDateTime(
            new Date(project.savedAt)
          )}`;
      }

      return true;

    } catch (error) {

      console.warn(
        "SNK AI Mentor: project save failed",
        error
      );

      return false;
    }
  }


  /* =========================================================
     28. LOAD PROJECT
  ========================================================= */

  function loadStudioState() {

    try {

      const raw =
        localStorage.getItem(
          STORAGE.project
        );

      if (!raw) return;

      const project =
        JSON.parse(raw);

      if (!project) return;

      updateProjectName(
        project.projectName ||
        "My AI Lesson"
      );

      if (
        els.lessonScript &&
        typeof project.lesson?.script ===
        "string"
      ) {
        els.lessonScript.value =
          project.lesson.script;
      }

      if (
        els.scriptLanguage &&
        project.lesson?.language
      ) {
        els.scriptLanguage.value =
          project.lesson.language;
      }

      if (
        els.scriptStyle &&
        project.lesson?.style
      ) {
        els.scriptStyle.value =
          project.lesson.style;
      }

      if (
        els.videoFormat &&
        project.video?.format
      ) {
        els.videoFormat.value =
          project.video.format;
      }

      if (
        els.videoResolution &&
        project.video?.resolution
      ) {
        els.videoResolution.value =
          project.video.resolution;
      }

      if (
        els.mentorPosition &&
        project.video?.mentorPosition
      ) {
        els.mentorPosition.value =
          project.video.mentorPosition;
      }

      if (
        els.videoBackground &&
        project.video?.background
      ) {
        els.videoBackground.value =
          project.video.background;
      }

      state.savedAt =
        project.savedAt ||
        null;

      if (
        project.ai?.mode
      ) {
        state.aiMode =
          project.ai.mode;
      }

      if (
        project.ai?.provider
      ) {
        state.aiProvider =
          project.ai.provider;
      }

      if (els.savedTime && state.savedAt) {

        els.savedTime.textContent =
          `Saved ${formatDateTime(
            new Date(state.savedAt)
          )}`;
      }

      updateScriptStats();
      refreshAIConfigUI();
      updateReadiness();

    } catch (error) {

      console.warn(
        "SNK AI Mentor: could not load saved project",
        error
      );
    }
  }


  /* =========================================================
     29. MANUAL SAVE
  ========================================================= */

  function manualSaveProject() {

    const saved =
      saveStudioState();

    if (saved) {

      showToast(
        "Project saved successfully.",
        "success"
      );

    } else {

      showToast(
        "Could not save project.",
        "error"
      );
    }
  }


  /* =========================================================
     30. EXPORT PROJECT JSON
  ========================================================= */

  function exportProject() {

    const project =
      collectProjectData();

    const json =
      JSON.stringify(
        project,
        null,
        2
      );

    const blob =
      new Blob(
        [json],
        {
          type:"application/json"
        }
      );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;

    anchor.download =
      `${slugify(
        state.projectName
      ) || "snk-ai-lesson"}.json`;

    document.body.appendChild(anchor);

    anchor.click();

    anchor.remove();

    URL.revokeObjectURL(url);

    showToast(
      "Project exported.",
      "success"
    );
  }


  /* =========================================================
     31. SLUG
  ========================================================= */

  function slugify(value) {

    return safeText(value)
      .toLowerCase()
      .trim()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );
  }


  /* =========================================================
     32. VIDEO ENGINE
  ========================================================= */

  function getVideoEngine() {

    return window.SNKAI &&
      window.SNKAI.AI &&
      window.SNKAI.AI.Video
      ? window.SNKAI.AI.Video
      : (
        window.SNKAI &&
        window.SNKAI.Video
          ? window.SNKAI.Video
          : null
      );
  }


  /* =========================================================
     33. GENERATION
  ========================================================= */

  async function prepareVideo() {

    if (state.generating) return;

    const readiness =
      updateReadiness();

    if (readiness.percent !== 100) {

      showToast(
        "Please complete all preparation steps first.",
        "error"
      );

      return;
    }

    if (
      state.aiMode === "live" &&
      !state.aiConnected
    ) {

      showToast(
        "Please test and connect the live AI provider first.",
        "error"
      );

      return;
    }

    const engine =
      getVideoEngine();

    if (!engine) {

      showToast(
        "Video engine is not loaded.",
        "error"
      );

      return;
    }

    state.generating = true;
    state.generationStartedAt =
      Date.now();

    if (els.prepareVideoBtn) {

      els.prepareVideoBtn.disabled =
        true;

      els.prepareVideoBtn.dataset.originalText =
        els.prepareVideoBtn.textContent;

      els.prepareVideoBtn.textContent =
        "Preparing...";
    }

    document.body.classList.add(
      "is-processing"
    );

    showPreparationModal();

    try {

      const project =
        collectProjectData();

      let result;

      if (
        typeof engine.generate ===
        "function"
      ) {

        result =
          await engine.generate(
            project
          );

      } else if (
        typeof engine.create ===
        "function"
      ) {

        result =
          await engine.create(
            project
          );

      } else {

        throw new Error(
          "Video engine does not expose a generation method."
        );
      }

      showGenerationResult(
        result
      );

      showToast(
        "AI video preparation completed.",
        "success"
      );

    } catch (error) {

      console.error(
        "SNK AI Mentor generation:",
        error
      );

      updatePreparationModal(
        100,
        error?.message ||
        "Video generation failed.",
        true
      );

      showToast(
        error?.message ||
        "Video generation failed.",
        "error",
        5000
      );

    } finally {

      state.generating =
        false;

      document.body.classList.remove(
        "is-processing"
      );

      if (els.prepareVideoBtn) {

        els.prepareVideoBtn.disabled =
          false;

        els.prepareVideoBtn.textContent =
          els.prepareVideoBtn.dataset.originalText ||
          "Prepare Video";
      }

      updateReadiness();
    }
  }


  /* =========================================================
     34. PREPARATION MODAL
  ========================================================= */

  let preparationModal = null;

  function showPreparationModal() {

    removePreparationModal();

    preparationModal =
      document.createElement("div");

    preparationModal.className =
      "ai-preparation-backdrop";

    preparationModal.innerHTML = `
      <div class="ai-preparation-modal"
           role="dialog"
           aria-modal="true"
           aria-labelledby="aiPreparationTitle">

        <div class="ai-preparation-box">

          <button
            type="button"
            class="ai-preparation-close"
            aria-label="Close"
            data-preparation-close>
            ×
          </button>

          <div class="ai-preparation-icon">
            ✦
          </div>

          <div class="ai-preparation-kicker">
            SNK AI ENGINE
          </div>

          <div
            class="ai-preparation-provider"
            id="aiPreparationTitle">
            ${escapeHTML(
              state.aiProvider || "Demo Engine"
            )}
          </div>

          <div class="ai-preparation-progress">
            <div
              class="ai-preparation-progress-bar"
              data-preparation-progress>
            </div>
          </div>

          <div
            class="ai-preparation-percent"
            data-preparation-percent>
            0%
          </div>

          <div
            class="ai-preparation-status"
            data-preparation-status>
            Preparing your lesson...
          </div>

          <ul class="ai-preparation-list">
            <li>Checking mentor assets</li>
            <li>Preparing lesson script</li>
            <li>Building AI generation request</li>
            <li>Preparing video output</li>
          </ul>

          <div class="ai-preparation-actions">

            <button
              type="button"
              class="mentor-btn ai-modal-secondary"
              data-preparation-close>
              Run in Background
            </button>

          </div>

        </div>
      </div>
    `;

    document.body.appendChild(
      preparationModal
    );

    qsa(
      "[data-preparation-close]",
      preparationModal
    ).forEach(button => {

      button.addEventListener(
        "click",
        () => {

          /*
            Closing the modal does not cancel
            the underlying generation.
          */

          removePreparationModal();
        }
      );
    });

    simulatePreparationStart();
  }


  function updatePreparationModal(
    percent,
    status,
    error = false
  ) {

    if (!preparationModal) return;

    const progress =
      qs(
        "[data-preparation-progress]",
        preparationModal
      );

    const percentEl =
      qs(
        "[data-preparation-percent]",
        preparationModal
      );

    const statusEl =
      qs(
        "[data-preparation-status]",
        preparationModal
      );

    if (progress) {
      progress.style.width =
        `${clamp(percent,0,100)}%`;
    }

    if (percentEl) {
      percentEl.textContent =
        `${Math.round(
          clamp(percent,0,100)
        )}%`;
    }

    if (statusEl) {
      statusEl.textContent =
        safeText(status);
    }

    if (error && statusEl) {
      statusEl.style.color =
        "var(--mentor-red)";
    }
  }


  let preparationTimer = null;

  function simulatePreparationStart() {

    clearInterval(
      preparationTimer
    );

    let progress = 0;

    preparationTimer =
      setInterval(() => {

        if (!preparationModal) {

          clearInterval(
            preparationTimer
          );

          return;
        }

        if (progress >= 78) {

          clearInterval(
            preparationTimer
          );

          return;
        }

        progress +=
          Math.floor(
            Math.random() * 7
          ) + 2;

        const status =
          progress < 25
            ? "Checking mentor assets..."
            : progress < 48
              ? "Preparing lesson script..."
              : progress < 70
                ? "Building AI generation request..."
                : "Waiting for video engine...";

        updatePreparationModal(
          progress,
          status
        );

      }, 420);
  }


  function removePreparationModal() {

    clearInterval(
      preparationTimer
    );

    preparationTimer =
      null;

    if (preparationModal) {

      preparationModal.remove();

      preparationModal =
        null;
    }
  }


  /* =========================================================
     35. GENERATION RESULT
  ========================================================= */

  function showGenerationResult(
    result
  ) {

    removePreparationModal();

    const videoUrl =
      result?.videoUrl ||
      result?.url ||
      result?.downloadUrl ||
      "";

    const existing =
      document.querySelector(
        ".ai-video-result"
      );

    if (existing) {
      existing.remove();
    }

    const output =
      document.querySelector(
        ".video-output"
      );

    if (!output) return;

    const resultBox =
      document.createElement("div");

    resultBox.className =
      "ai-video-result show";

    resultBox.innerHTML = `
      <div class="ai-video-result-header">

        <div class="ai-video-result-title">
          AI Video Ready
        </div>

        <div class="ai-video-result-status">
          ${state.aiMode === "demo"
            ? "DEMO"
            : "GENERATED"}
        </div>

      </div>

      ${
        videoUrl
          ? `
            <div style="margin-top:13px;">
              <video
                controls
                playsinline
                style="width:100%;border-radius:14px;display:block;"
                src="${escapeAttribute(videoUrl)}">
              </video>
            </div>
          `
          : `
            <div style="margin-top:12px;color:var(--mentor-text-muted);font-size:10px;line-height:1.6;">
              The generation engine returned successfully.
              A final video URL will appear here when the
              connected provider returns one.
            </div>
          `
      }

      <div class="ai-video-result-actions">

        ${
          videoUrl
            ? `
              <button
                type="button"
                class="mentor-btn mentor-btn-primary"
                data-download-video>
                Download Video
              </button>

              <button
                type="button"
                class="mentor-btn"
                data-open-video>
                Open Video
              </button>
            `
            : ""
        }

        <button
          type="button"
          class="mentor-btn"
          data-close-result>
          Close
        </button>

      </div>
    `;

    output.parentElement?.appendChild(
      resultBox
    );

    const downloadBtn =
      resultBox.querySelector(
        "[data-download-video]"
      );

    const openBtn =
      resultBox.querySelector(
        "[data-open-video]"
      );

    const closeBtn =
      resultBox.querySelector(
        "[data-close-result]"
      );

    if (downloadBtn) {

      downloadBtn.addEventListener(
        "click",
        () => {

          const anchor =
            document.createElement("a");

          anchor.href =
            videoUrl;

          anchor.download =
            `${slugify(
              state.projectName
            ) || "snk-ai-video"}.mp4`;

          anchor.target = "_blank";

          document.body.appendChild(
            anchor
          );

          anchor.click();

          anchor.remove();
        }
      );
    }

    if (openBtn) {

      openBtn.addEventListener(
        "click",
        () => {

          window.open(
            videoUrl,
            "_blank",
            "noopener,noreferrer"
          );
        }
      );
    }

    if (closeBtn) {

      closeBtn.addEventListener(
        "click",
        () => resultBox.remove()
      );
    }

    /*
      Scroll user toward output.
    */

    resultBox.scrollIntoView({
      behavior:"smooth",
      block:"center"
    });
  }


  /* =========================================================
     36. HTML ESCAPE
  ========================================================= */

  function escapeHTML(value) {

    return safeText(value)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }


  function escapeAttribute(value) {
    return escapeHTML(value);
  }


  /* =========================================================
     37. FILE INPUT EVENTS
  ========================================================= */

  function bindFileEvents() {

    if (els.faceVideoInput) {

      els.faceVideoInput.addEventListener(
        "change",
        event => {

          const file =
            event.target.files?.[0];

          handleFaceVideo(file);
        }
      );
    }

    if (els.voiceInput) {

      els.voiceInput.addEventListener(
        "change",
        event => {

          const file =
            event.target.files?.[0];

          handleVoiceFile(file);
        }
      );
    }


    if (els.selectFaceVideoBtn) {

      els.selectFaceVideoBtn.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          els.faceVideoInput?.click();
        }
      );
    }


    if (els.changeFaceVideoBtn) {

      els.changeFaceVideoBtn.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          els.faceVideoInput?.click();
        }
      );
    }


    if (els.selectVoiceBtn) {

      els.selectVoiceBtn.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          els.voiceInput?.click();
        }
      );
    }


    if (els.removeVoiceBtn) {

      els.removeVoiceBtn.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          clearVoiceFile();
        }
      );
    }


    if (els.faceUploadArea) {

      els.faceUploadArea.addEventListener(
        "dragover",
        event => {

          event.preventDefault();

          els.faceUploadArea.classList.add(
            "dragover"
          );
        }
      );

      els.faceUploadArea.addEventListener(
        "dragleave",
        () => {

          els.faceUploadArea.classList.remove(
            "dragover"
          );
        }
      );

      els.faceUploadArea.addEventListener(
        "drop",
        event => {

          event.preventDefault();

          els.faceUploadArea.classList.remove(
            "dragover"
          );

          const file =
            event.dataTransfer.files?.[0];

          handleFaceVideo(file);
        }
      );
    }


    if (els.voiceUploadArea) {

      els.voiceUploadArea.addEventListener(
        "dragover",
        event => {

          event.preventDefault();

          els.voiceUploadArea.classList.add(
            "dragover"
          );
        }
      );

      els.voiceUploadArea.addEventListener(
        "dragleave",
        () => {

          els.voiceUploadArea.classList.remove(
            "dragover"
          );
        }
      );

      els.voiceUploadArea.addEventListener(
        "drop",
        event => {

          event.preventDefault();

          els.voiceUploadArea.classList.remove(
            "dragover"
          );

          const file =
            event.dataTransfer.files?.[0];

          handleVoiceFile(file);
        }
      );
    }
  }


  /* =========================================================
     38. SCRIPT EVENTS
  ========================================================= */

  function bindScriptEvents() {

    if (els.lessonScript) {

      els.lessonScript.addEventListener(
        "input",
        updateScriptStats
      );
    }

    if (els.clearScriptBtn) {

      els.clearScriptBtn.addEventListener(
        "click",
        clearLessonScript
      );
    }

    [
      els.scriptLanguage,
      els.scriptStyle,
      els.videoFormat,
      els.videoResolution,
      els.mentorPosition,
      els.videoBackground
    ].forEach(element => {

      if (!element) return;

      element.addEventListener(
        "change",
        () => {

          saveStudioState();

          updateReadiness();
        }
      );
    });
  }


  /* =========================================================
     39. PROJECT EVENTS
  ========================================================= */

  function bindProjectEvents() {

    bindProjectNameSync();

    if (els.saveProjectBtn) {

      els.saveProjectBtn.addEventListener(
        "click",
        manualSaveProject
      );
    }

    if (els.sidebarSaveBtn) {

      els.sidebarSaveBtn.addEventListener(
        "click",
        manualSaveProject
      );
    }

    if (els.exportProjectBtn) {

      els.exportProjectBtn.addEventListener(
        "click",
        exportProject
      );
    }

    if (els.prepareVideoBtn) {

      els.prepareVideoBtn.addEventListener(
        "click",
        prepareVideo
      );
    }
  }


  /* =========================================================
     40. KEYBOARD SHORTCUTS
  ========================================================= */

  function bindKeyboardShortcuts() {

    document.addEventListener(
      "keydown",
      event => {

        /*
          Ctrl/Cmd + S
        */

        if (
          (event.ctrlKey ||
           event.metaKey) &&
          event.key.toLowerCase() === "s"
        ) {

          event.preventDefault();

          manualSaveProject();
        }


        /*
          Escape
        */

        if (
          event.key === "Escape" &&
          preparationModal
        ) {

          removePreparationModal();
        }
      }
    );
  }


  /* =========================================================
     41. AI CONFIG EVENTS FROM MODULE
  ========================================================= */

  function bindAIConfigModuleEvents() {

    const config =
      getAIConfig();

    if (!config) return;

    if (
      typeof config.on !==
      "function"
    ) {
      return;
    }

    try {

      config.on(
        "change",
        payload => {

          const next =
            payload?.config ||
            payload;

          if (
            next &&
            typeof next === "object"
          ) {

            if (next.mode) {
              state.aiMode =
                next.mode;
            }

            if (next.provider) {
              state.aiProvider =
                next.provider;
            }
          }

          refreshAIConfigUI();
          updateReadiness();
        }
      );

      config.on(
        "connection",
        payload => {

          state.aiConnected =
            Boolean(
              payload?.connected ??
              payload?.ok
            );

          updateConnectionState(
            state.aiConnected
          );

          updateReadiness();
        }
      );

    } catch (error) {

      console.warn(
        "SNK AI Mentor: config event binding failed",
        error
      );
    }
  }


  /* =========================================================
     42. INIT
  ========================================================= */

  function init() {

    if (state.initialized) {
      return;
    }

    state.initialized =
      true;

    bindFileEvents();

    bindScriptEvents();

    bindProjectEvents();

    bindAIConfigEvents();

    bindAIConfigModuleEvents();

    bindKeyboardShortcuts();

    /*
      Load config first.
    */

    refreshAIConfigUI();

    /*
      Load project after config.
    */

    loadStudioState();

    /*
      Initial counters.
    */

    updateScriptStats();

    /*
      Initial readiness.
    */

    updateReadiness();

    /*
      Demo mode starts as ready.
    */

    if (state.aiMode === "demo") {
      state.aiConnected = true;
      updateConnectionState(true);
    }

    /*
      Public API.
    */

    window.SNKAI =
      window.SNKAI || {};

    window.SNKAI.MentorStudio = {

      state,

      getProject:
        collectProjectData,

      save:
        manualSaveProject,

      exportProject,

      updateReadiness,

      prepareVideo,

      saveAIConfiguration,

      testAIConnection,

      resetAIConfiguration,

      clearFaceVideo,

      clearVoiceFile
    };

    console.log(
      "SNK AI Mentor Studio initialized."
    );
  }


  /* =========================================================
     43. START
  ========================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init,
      {
        once:true
      }
    );

  } else {

    init();
  }

})();
