/* =========================================================
   SNK AI MENTOR
   mentor/ai-mentor.js
   ---------------------------------------------------------
   FULL AI ENGINE INTEGRATION

   Connected modules:
   ../ai/ai-config.js
   ../ai/avatar.js
   ../ai/voice.js
   ../ai/video.js

   Workflow:
   Face Video
        ↓
   Voice Sample
        ↓
   Lesson Script
        ↓
   Video Settings
        ↓
   Prepare AI Video
        ↓
   AI Video Engine
   ========================================================= */

(() => {

  "use strict";


  /* =======================================================
     1. GLOBAL NAMESPACE
     ======================================================= */

  window.SNKAI = window.SNKAI || {};


  /* =======================================================
     2. STORAGE
     ======================================================= */

  const STORAGE_KEY =
    "snkAiMentorStudioProject";


  const SETTINGS_KEY =
    "snkAiMentorVideoSettings";


  /* =======================================================
     3. DOM HELPER
     ======================================================= */

  const $ = (id) =>
    document.getElementById(id);


  /* =======================================================
     4. STATE
     ======================================================= */

  const state = {

    initialized: false,

    projectName:
      "My AI Mentor Project",

    faceFile: null,

    voiceFile: null,

    script: "",

    videoSettings: {

      format: "mp4",

      resolution: "1080p",

      mentorPosition: "right",

      background: "studio",

      aspectRatio: "16:9",

      fps: 30,

      subtitles: false,

      audio: true

    },

    lastSavedAt: null,

    videoPrepared: false,

    videoJobId: null,

    videoStatus: "idle",

    videoProgress: 0

  };


  /* =======================================================
     5. TOAST
     ======================================================= */

  function showToast(
    message,
    type = "info"
  ) {

    const toast =
      $("mentorToast");

    const text =
      $("toastMessage");


    if (!toast || !text) {
      return;
    }


    text.textContent =
      message;


    toast.classList.remove(
      "success",
      "error",
      "warning",
      "show"
    );


    if (
      ["success", "error", "warning"]
        .includes(type)
    ) {

      toast.classList.add(type);

    }


    requestAnimationFrame(
      () => {

        toast.classList.add(
          "show"
        );

      }
    );


    clearTimeout(
      showToast.timer
    );


    showToast.timer =
      setTimeout(
        () => {

          toast.classList.remove(
            "show"
          );

        },
        3500
      );

  }


  /* =======================================================
     6. FORMAT FILE SIZE
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
      Math.floor(
        Math.log(bytes) /
        Math.log(1024)
      );


    return (
      (
        bytes /
        Math.pow(
          1024,
          index
        )
      ).toFixed(
        index === 0
          ? 0
          : 1
      ) +
      " " +
      units[
        Math.min(
          index,
          units.length - 1
        )
      ]
    );

  }


  /* =======================================================
     7. FORMAT DATE
     ======================================================= */

  function formatDate(
    date
  ) {

    if (!date) {
      return "Not saved yet";
    }


    const d =
      new Date(date);


    if (
      Number.isNaN(
        d.getTime()
      )
    ) {

      return "Not saved yet";

    }


    return d.toLocaleString();

  }


  /* =======================================================
     8. WORD COUNT
     ======================================================= */

  function countWords(
    text
  ) {

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


  /* =======================================================
     9. UPDATE SCRIPT COUNTERS
     ======================================================= */

  function updateScriptCounters() {

    const input =
      $("lessonScript");


    if (!input) {
      return;
    }


    const text =
      input.value || "";


    const words =
      countWords(text);


    const chars =
      text.length;


    if ($("wordCount")) {

      $("wordCount").textContent =
        words;

    }


    if ($("charCount")) {

      $("charCount").textContent =
        chars;

    }

  }


  /* =======================================================
     10. SAVE TO LOCAL STORAGE
     ======================================================= */

  function saveProject(
    silent = false
  ) {

    const project =
      collectProject();


    state.lastSavedAt =
      new Date().toISOString();


    project.lastSavedAt =
      state.lastSavedAt;


    try {

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          project
        )
      );


      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(
          state.videoSettings
        )
      );


      updateSavedTime();


      if (!silent) {

        showToast(
          "Project saved successfully.",
          "success"
        );

      }


      return true;

    } catch (error) {

      console.error(
        "[SNK AI Mentor] Save error:",
        error
      );


      if (!silent) {

        showToast(
          "Could not save project.",
          "error"
        );

      }


      return false;

    }

  }


  /* =======================================================
     11. COLLECT PROJECT
     ======================================================= */

  function collectProject() {

    const projectName =
      $("projectName")
        ? $("projectName").value.trim()
        : state.projectName;


    const script =
      $("lessonScript")
        ? $("lessonScript").value
        : state.script;


    return {

      version: 2,

      projectName:
        projectName ||
        "My AI Mentor Project",


      face: state.faceFile
        ? {

            name:
              state.faceFile.name,

            type:
              state.faceFile.type,

            size:
              state.faceFile.size

          }

        : null,


      voice: state.voiceFile
        ? {

            name:
              state.voiceFile.name,

            type:
              state.voiceFile.type,

            size:
              state.voiceFile.size

          }

        : null,


      script: {

        text:
          script,

        words:
          countWords(script),

        characters:
          script.length

      },


      videoSettings:
        {
          ...state.videoSettings
        },


      lastSavedAt:
        state.lastSavedAt

    };

  }


  /* =======================================================
     12. RESTORE PROJECT
     ======================================================= */

  function restoreProject() {

    let saved = null;


    try {

      const raw =
        localStorage.getItem(
          STORAGE_KEY
        );


      if (raw) {

        saved =
          JSON.parse(raw);

      }

    } catch (error) {

      console.warn(
        "[SNK AI Mentor] Restore failed:",
        error
      );

    }


    if (!saved) {

      restoreSettingsOnly();

      return;

    }


    state.projectName =
      saved.projectName ||
      "My AI Mentor Project";


    state.lastSavedAt =
      saved.lastSavedAt ||
      null;


    if ($("projectName")) {

      $("projectName").value =
        state.projectName;

    }


    if ($("projectNameTop")) {

      $("projectNameTop").value =
        state.projectName;

    }


    if (
      $("lessonScript") &&
      saved.script
    ) {

      $("lessonScript").value =
        saved.script.text || "";

    }


    if (
      saved.videoSettings
    ) {

      state.videoSettings = {

        ...state.videoSettings,

        ...saved.videoSettings

      };

    }


    restoreSettingsToUI();

    updateScriptCounters();

    updateSavedTime();

    updateReadiness();


    /*
     * File objects cannot be restored from localStorage.
     */

    if (
      saved.face &&
      !state.faceFile
    ) {

      showToast(
        "Saved project found. Please re-select the mentor face video.",
        "warning"
      );

    }


    if (
      saved.voice &&
      !state.voiceFile
    ) {

      setTimeout(
        () => {

          showToast(
            "Please re-select the mentor voice sample.",
            "warning"
          );

        },
        900
      );

    }

  }


  /* =======================================================
     13. RESTORE SETTINGS ONLY
     ======================================================= */

  function restoreSettingsOnly() {

    try {

      const raw =
        localStorage.getItem(
          SETTINGS_KEY
        );


      if (!raw) {
        return;
      }


      const settings =
        JSON.parse(raw);


      state.videoSettings = {

        ...state.videoSettings,

        ...settings

      };


      restoreSettingsToUI();

    } catch (error) {

      console.warn(
        "[SNK AI Mentor] Settings restore failed:",
        error
      );

    }

  }


  /* =======================================================
     14. RESTORE SETTINGS TO UI
     ======================================================= */

  function restoreSettingsToUI() {

    setValue(
      "videoFormat",
      state.videoSettings.format
    );


    setValue(
      "videoResolution",
      state.videoSettings.resolution
    );


    setValue(
      "mentorPosition",
      state.videoSettings.mentorPosition
    );


    setValue(
      "videoBackground",
      state.videoSettings.background
    );

  }


  /* =======================================================
     15. SET VALUE
     ======================================================= */

  function setValue(
    id,
    value
  ) {

    const element =
      $(id);


    if (
      element &&
      value !== undefined &&
      value !== null
    ) {

      element.value =
        value;

    }

  }


  /* =======================================================
     16. UPDATE SAVED TIME
     ======================================================= */

  function updateSavedTime() {

    const element =
      $("savedTime");


    if (!element) {
      return;
    }


    if (
      state.lastSavedAt
    ) {

      element.textContent =
        "Saved " +
        formatDate(
          state.lastSavedAt
        );

    } else {

      element.textContent =
        "Not saved yet";

    }

  }


  /* =======================================================
     17. PROJECT NAME SYNC
     ======================================================= */

  function syncProjectName(
    source
  ) {

    const value =
      source.value.trim() ||
      "My AI Mentor Project";


    state.projectName =
      value;


    if (
      $("projectName") &&
      source !== $("projectName")
    ) {

      $("projectName").value =
        value;

    }


    if (
      $("projectNameTop") &&
      source !== $("projectNameTop")
    ) {

      $("projectNameTop").value =
        value;

    }

  }


  /* =======================================================
     18. FACE VIDEO UI
     ======================================================= */

  function handleFaceVideo(
    file
  ) {

    if (!file) {
      return;
    }


    const Avatar =
      window.SNKAI.Avatar;


    if (!Avatar) {

      showToast(
        "Avatar engine is not loaded.",
        "error"
      );

      return;

    }


    const success =
      Avatar.setSource(
        file
      );


    if (!success) {

      const avatarState =
        Avatar.getState();


      showToast(
        avatarState.error ||
          "Invalid mentor face video.",
        "error"
      );


      return;

    }


    state.faceFile =
      file;


    renderFacePreview();

    updateReadiness();


    showToast(
      "Mentor face video loaded.",
      "success"
    );

  }


  /* =======================================================
     19. RENDER FACE PREVIEW
     ======================================================= */

  function renderFacePreview() {

    const empty =
      $("faceUploadEmpty");


    const wrapper =
      $("facePreviewWrapper");


    const video =
      $("faceVideoPreview");


    if (
      !state.faceFile ||
      !video
    ) {

      if (empty) {
        empty.hidden = false;
      }

      if (wrapper) {
        wrapper.hidden = true;
      }

      return;

    }


    const Avatar =
      window.SNKAI.Avatar;


    const avatarState =
      Avatar
        ? Avatar.getState()
        : null;


    if (
      avatarState &&
      avatarState.objectUrl
    ) {

      video.src =
        avatarState.objectUrl;

    }


    if (empty) {
      empty.hidden = true;
    }


    if (wrapper) {
      wrapper.hidden = false;
    }

  }


  /* =======================================================
     20. REMOVE FACE VIDEO
     ======================================================= */

  function removeFaceVideo() {

    const Avatar =
      window.SNKAI.Avatar;


    if (Avatar) {

      Avatar.clearSource();

    }


    state.faceFile =
      null;


    const video =
      $("faceVideoPreview");


    if (video) {

      video.pause();

      video.removeAttribute(
        "src"
      );

      video.load();

    }


    if ($("facePreviewWrapper")) {

      $("facePreviewWrapper")
        .hidden = true;

    }


    if ($("faceUploadEmpty")) {

      $("faceUploadEmpty")
        .hidden = false;

    }


    updateReadiness();


    showToast(
      "Mentor face video removed.",
      "info"
    );

  }


  /* =======================================================
     21. VOICE AUDIO UI
     ======================================================= */

  function handleVoiceAudio(
    file
  ) {

    if (!file) {
      return;
    }


    const Voice =
      window.SNKAI.Voice;


    if (!Voice) {

      showToast(
        "Voice engine is not loaded.",
        "error"
      );

      return;

    }


    const success =
      Voice.setSource(
        file
      );


    if (!success) {

      const voiceState =
        Voice.getState();


      showToast(
        voiceState.error ||
          "Invalid voice sample.",
        "error"
      );


      return;

    }


    state.voiceFile =
      file;


    renderVoicePreview();

    updateReadiness();


    showToast(
      "Mentor voice sample loaded.",
      "success"
    );

  }


  /* =======================================================
     22. RENDER VOICE PREVIEW
     ======================================================= */

  function renderVoicePreview() {

    const empty =
      $("voiceUploadEmpty");


    const preview =
      $("voicePreview");


    const player =
      $("voiceAudioPlayer");


    if (
      !state.voiceFile ||
      !player
    ) {

      if (empty) {
        empty.hidden = false;
      }

      if (preview) {
        preview.hidden = true;
      }

      return;

    }


    const Voice =
      window.SNKAI.Voice;


    const voiceState =
      Voice
        ? Voice.getState()
        : null;


    if (
      voiceState &&
      voiceState.objectUrl
    ) {

      player.src =
        voiceState.objectUrl;

    }


    if ($("voiceFileName")) {

      $("voiceFileName")
        .textContent =
        state.voiceFile.name;

    }


    if ($("voiceFileMeta")) {

      $("voiceFileMeta")
        .textContent =
        formatBytes(
          state.voiceFile.size
        );

    }


    if (empty) {
      empty.hidden = true;
    }


    if (preview) {
      preview.hidden = false;
    }

  }


  /* =======================================================
     23. REMOVE VOICE
     ======================================================= */

  function removeVoice() {

    const Voice =
      window.SNKAI.Voice;


    if (Voice) {

      Voice.clearSource();

    }


    state.voiceFile =
      null;


    const player =
      $("voiceAudioPlayer");


    if (player) {

      player.pause();

      player.removeAttribute(
        "src"
      );

      player.load();

    }


    if ($("voicePreview")) {

      $("voicePreview")
        .hidden = true;

    }


    if ($("voiceUploadEmpty")) {

      $("voiceUploadEmpty")
        .hidden = false;

    }


    updateReadiness();


    showToast(
      "Mentor voice sample removed.",
      "info"
    );

  }


  /* =======================================================
     24. SCRIPT INPUT
     ======================================================= */

  function handleScriptInput() {

    const input =
      $("lessonScript");


    if (!input) {
      return;
    }


    state.script =
      input.value;


    updateScriptCounters();

    updateReadiness();

  }


  /* =======================================================
     25. CLEAR SCRIPT
     ======================================================= */

  function clearScript() {

    const input =
      $("lessonScript");


    if (!input) {
      return;
    }


    if (
      input.value.trim()
    ) {

      const confirmed =
        window.confirm(
          "Clear the entire lesson script?"
        );


      if (!confirmed) {
        return;
      }

    }


    input.value =
      "";


    state.script =
      "";


    updateScriptCounters();

    updateReadiness();


    showToast(
      "Lesson script cleared.",
      "info"
    );

  }


  /* =======================================================
     26. VIDEO SETTINGS
     ======================================================= */

  function handleVideoSettings() {

    state.videoSettings = {

      ...state.videoSettings,

      format:
        getValue(
          "videoFormat",
          state.videoSettings.format
        ),

      resolution:
        getValue(
          "videoResolution",
          state.videoSettings.resolution
        ),

      mentorPosition:
        getValue(
          "mentorPosition",
          state.videoSettings.mentorPosition
        ),

      background:
        getValue(
          "videoBackground",
          state.videoSettings.background
        )

    };


    /*
     * Sync with Video engine.
     */

    const Video =
      window.SNKAI.Video;


    if (Video) {

      Video.setSettings({

        format:
          state.videoSettings.format,

        resolution:
          state.videoSettings.resolution,

        mentorPosition:
          state.videoSettings
            .mentorPosition,

        background:
          state.videoSettings
            .background,

        aspectRatio:
          state.videoSettings
            .aspectRatio,

        fps:
          state.videoSettings
            .fps,

        subtitles:
          state.videoSettings
            .subtitles,

        audio:
          state.videoSettings
            .audio

      });

    }


    saveProject(
      true
    );


    updateReadiness();

  }


  /* =======================================================
     27. GET VALUE
     ======================================================= */

  function getValue(
    id,
    fallback
  ) {

    const element =
      $(id);


    return element
      ? element.value
      : fallback;

  }


  /* =======================================================
     28. READINESS
     ======================================================= */

  function updateReadiness() {

    const faceReady =
      Boolean(
        state.faceFile
      );


    const voiceReady =
      Boolean(
        state.voiceFile
      );


    const scriptReady =
      Boolean(
        (
          $("lessonScript")
            ? $("lessonScript").value
            : state.script
        ).trim()
      );


    const settingsReady =
      Boolean(
        state.videoSettings.format &&
        state.videoSettings.resolution
      );


    const checks = [

      faceReady,

      voiceReady,

      scriptReady,

      settingsReady

    ];


    const completed =
      checks.filter(Boolean)
        .length;


    const percent =
      Math.round(
        (
          completed /
          checks.length
        ) * 100
      );


    setText(
      "readinessPercent",
      percent + "%"
    );


    const progress =
      $("readinessProgress");


    if (progress) {

      progress.style.width =
        percent + "%";

    }


    setCheck(
      "checkFace",
      faceReady
    );


    setCheck(
      "checkVoice",
      voiceReady
    );


    setCheck(
      "checkScript",
      scriptReady
    );


    setCheck(
      "checkSettings",
      settingsReady
    );


    setText(
      "studioStatus",
      percent === 100
        ? "Ready"
        : "Setup Required"
    );


    if (
      percent === 100
    ) {

      state.videoPrepared =
        false;

    }


    return percent;

  }


  /* =======================================================
     29. SET CHECK STATE
     ======================================================= */

  function setCheck(
    id,
    completed
  ) {

    const element =
      $(id);


    if (!element) {
      return;
    }


    element.classList.toggle(
      "complete",
      Boolean(completed)
    );


    element.classList.toggle(
      "pending",
      !completed
    );


    const icon =
      element.querySelector(
        "[data-check-icon]"
      );


    if (icon) {

      icon.textContent =
        completed
          ? "✓"
          : "○";

    }

  }


  /* =======================================================
     30. SET TEXT
     ======================================================= */

  function setText(
    id,
    value
  ) {

    const element =
      $(id);


    if (element) {

      element.textContent =
        value;

    }

  }


  /* =======================================================
     31. PREPARE AI VIDEO
     ======================================================= */

  async function prepareAIVideo() {

    const percent =
      updateReadiness();


    if (
      percent < 100
    ) {

      showToast(
        "Complete Face, Voice, Script and Video Settings first.",
        "warning"
      );


      scrollToFirstMissing();


      return;

    }


    const Avatar =
      window.SNKAI.Avatar;


    const Voice =
      window.SNKAI.Voice;


    const Video =
      window.SNKAI.Video;


    if (
      !Avatar ||
      !Voice ||
      !Video
    ) {

      showToast(
        "AI engine files are not loaded.",
        "error"
      );


      return;

    }


    /*
     * Make sure Video engine has the latest script.
     */

    Video.setScript(
      $("lessonScript")
        ? $("lessonScript").value
        : state.script
    );


    Video.setSettings(
      state.videoSettings
    );


    /*
     * Provider status.
     */

    const provider =
      window.SNKAI.AIConfig
        ? window.SNKAI.AIConfig.getProvider()
        : null;


    const config =
      window.SNKAI.AIConfig
        ? window.SNKAI.AIConfig.getConfig()
        : null;


    const mode =
      config
        ? config.mode
        : "demo";


    const providerName =
      provider
        ? provider.label
        : "AI Provider";


    /*
     * Show preparation modal.
     */

    const modal =
      createPreparationModal(
        providerName,
        mode
      );


    try {

      updatePreparationModal(
        modal,
        "Checking mentor face...",
        15
      );


      /*
       * Avatar validation
       */

      const avatarCheck =
        Avatar.checkProvider();


      if (
        !avatarCheck.available &&
        mode !== "demo"
      ) {

        throw new Error(
          avatarCheck.message
        );

      }


      updatePreparationModal(
        modal,
        "Checking mentor voice...",
        30
      );


      /*
       * Voice validation
       */

      const voiceCheck =
        Voice.checkProvider();


      if (
        !voiceCheck.available &&
        mode !== "demo"
      ) {

        throw new Error(
          voiceCheck.message
        );

      }


      updatePreparationModal(
        modal,
        "Preparing lesson script...",
        45
      );


      const script =
        $("lessonScript")
          ? $("lessonScript").value
          : state.script;


      Video.setScript(
        script
      );


      updatePreparationModal(
        modal,
        "Preparing AI video job...",
        60
      );


      state.videoPrepared =
        true;


      state.videoStatus =
        "preparing";


      /*
       * Start actual Video engine.
       */

      const result =
        await Video.generate({

          mentorName:
            state.projectName,

          video:
            state.videoSettings

        });


      state.videoJobId =
        result.jobId ||
        null;


      state.videoProgress =
        100;


      state.videoStatus =
        result.success
          ? "completed"
          : "error";


      if (
        result.success
      ) {

        updatePreparationModal(
          modal,
          result.demo
            ? "Demo video workflow completed."
            : "AI video generation completed.",
          100
        );


        setTimeout(
          () => {

            closePreparationModal(
              modal
            );


            if (
              result.videoUrl
            ) {

              showVideoResult(
                result.videoUrl
              );

            } else {

              showToast(
                result.demo
                  ? "Demo job completed. Real AI provider is ready to be connected."
                  : "AI video job completed.",
                "success"
              );

            }

          },
          900
        );

      }

    } catch (error) {

      console.error(
        "[SNK AI Mentor] AI video error:",
        error
      );


      state.videoStatus =
        "error";


      state.videoPrepared =
        false;


      updatePreparationModal(
        modal,
        error.message ||
          "AI video preparation failed.",
        100,
        true
      );


      showToast(
        error.message ||
          "AI video preparation failed.",
        "error"
      );

    }

  }


  /* =======================================================
     32. SCROLL TO FIRST MISSING
     ======================================================= */

  function scrollToFirstMissing() {

    const ids = [

      [
        "checkFace",
        "faceUploadArea"
      ],

      [
        "checkVoice",
        "voiceUploadArea"
      ],

      [
        "checkScript",
        "lessonScript"
      ],

      [
        "checkSettings",
        "videoFormat"
      ]

    ];


    for (
      const [checkId, targetId]
      of ids
    ) {

      const check =
        $(checkId);


      if (
        check &&
        !check.classList.contains(
          "complete"
        )
      ) {

        const target =
          $(targetId);


        if (target) {

          target.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });

        }


        return;

      }

    }

  }


  /* =======================================================
     33. PREPARATION MODAL
     ======================================================= */

  function createPreparationModal(
    providerName,
    mode
  ) {

    const backdrop =
      document.createElement(
        "div"
      );


    backdrop.className =
      "ai-preparation-backdrop";


    const modal =
      document.createElement(
        "div"
      );


    modal.className =
      "ai-preparation-modal";


    modal.innerHTML = `

      <div class="ai-preparation-box">

        <button
          type="button"
          class="ai-preparation-close"
          aria-label="Close"
        >
          ×
        </button>

        <div class="ai-preparation-icon">
          ✦
        </div>

        <div class="ai-preparation-kicker">
          SNK AI MENTOR
        </div>

        <h3>
          Preparing AI Video
        </h3>

        <p class="ai-preparation-provider">
          ${escapeHtml(providerName)}
          ·
          ${escapeHtml(
            mode === "demo"
              ? "Demo Mode"
              : "Live Mode"
          )}
        </p>

        <div class="ai-preparation-progress">
          <span></span>
        </div>

        <div class="ai-preparation-percent">
          0%
        </div>

        <p class="ai-preparation-status">
          Starting...
        </p>

        <ul class="ai-preparation-list">

          <li data-step="face">
            <span>○</span>
            Mentor Face
          </li>

          <li data-step="voice">
            <span>○</span>
            Mentor Voice
          </li>

          <li data-step="script">
            <span>○</span>
            Lesson Script
          </li>

          <li data-step="video">
            <span>○</span>
            Video Job
          </li>

        </ul>

        <div class="ai-preparation-actions">

          <button
            type="button"
            class="ai-modal-secondary"
          >
            Close
          </button>

        </div>

      </div>

    `;


    backdrop.appendChild(
      modal
    );


    document.body.appendChild(
      backdrop
    );


    const closeButtons =
      modal.querySelectorAll(
        ".ai-preparation-close, .ai-modal-secondary"
      );


    closeButtons.forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            closePreparationModal(
              backdrop
            );

          }
        );

      }
    );


    requestAnimationFrame(
      () => {

        backdrop.classList.add(
          "show"
        );

      }
    );


    return backdrop;

  }


  /* =======================================================
     34. UPDATE PREPARATION MODAL
     ======================================================= */

  function updatePreparationModal(
    backdrop,
    message,
    progress,
    error = false
  ) {

    if (!backdrop) {
      return;
    }


    const bar =
      backdrop.querySelector(
        ".ai-preparation-progress span"
      );


    const percent =
      backdrop.querySelector(
        ".ai-preparation-percent"
      );


    const status =
      backdrop.querySelector(
        ".ai-preparation-status"
      );


    if (bar) {

      bar.style.width =
        Math.max(
          0,
          Math.min(
            100,
            progress
          )
        ) + "%";

    }


    if (percent) {

      percent.textContent =
        Math.round(progress) +
        "%";

    }


    if (status) {

      status.textContent =
        message;


      status.classList.toggle(
        "error",
        Boolean(error)
      );

    }


    /*
     * Update workflow items.
     */

    const steps = [

      [
        "face",
        25
      ],

      [
        "voice",
        50
      ],

      [
        "script",
        60
      ],

      [
        "video",
        100
      ]

    ];


    steps.forEach(
      ([name, threshold]) => {

        const item =
          backdrop.querySelector(
            `[data-step="${name}"]`
          );


        if (!item) {
          return;
        }


        const icon =
          item.querySelector(
            "span"
          );


        const complete =
          progress >= threshold &&
          !error;


        item.classList.toggle(
          "complete",
          complete
        );


        if (icon) {

          icon.textContent =
            complete
              ? "✓"
              : "○";

        }

      }
    );

  }


  /* =======================================================
     35. CLOSE MODAL
     ======================================================= */

  function closePreparationModal(
    backdrop
  ) {

    if (!backdrop) {
      return;
    }


    backdrop.classList.remove(
      "show"
    );


    setTimeout(
      () => {

        backdrop.remove();

      },
      250
    );

  }


  /* =======================================================
     36. VIDEO RESULT
     ======================================================= */

  function showVideoResult(
    videoUrl
  ) {

    if (!videoUrl) {
      return;
    }


    const modal =
      document.createElement(
        "div"
      );


    modal.className =
      "ai-preparation-backdrop show";


    modal.innerHTML = `

      <div class="ai-preparation-modal">

        <div class="ai-preparation-box">

          <button
            type="button"
            class="ai-preparation-close"
            aria-label="Close"
          >
            ×
          </button>

          <div class="ai-preparation-icon">
            ✓
          </div>

          <div class="ai-preparation-kicker">
            GENERATION COMPLETE
          </div>

          <h3>
            Your AI Video Is Ready
          </h3>

          <div class="ai-video-result">

            <video
              controls
              playsinline
              preload="metadata"
              src="${escapeHtml(videoUrl)}"
            ></video>

          </div>

          <div class="ai-preparation-actions">

            <button
              type="button"
              class="ai-modal-primary"
              data-download-video
            >
              Download Video
            </button>

            <button
              type="button"
              class="ai-modal-secondary"
              data-close-video
            >
              Close
            </button>

          </div>

        </div>

      </div>

    `;


    document.body.appendChild(
      modal
    );


    const video =
      modal.querySelector(
        "video"
      );


    if (video) {

      video.addEventListener(
        "error",
        () => {

          showToast(
            "The generated video URL could not be played.",
            "error"
          );

        }
      );

    }


    const close =
      modal.querySelector(
        ".ai-preparation-close"
      );


    const closeButton =
      modal.querySelector(
        "[data-close-video]"
      );


    const download =
      modal.querySelector(
        "[data-download-video]"
      );


    const closeResult =
      () => {

        modal.remove();

      };


    if (close) {

      close.addEventListener(
        "click",
        closeResult
      );

    }


    if (closeButton) {

      closeButton.addEventListener(
        "click",
        closeResult
      );

    }


    if (download) {

      download.addEventListener(
        "click",
        () => {

          const Video =
            window.SNKAI.Video;


          if (Video) {

            Video.download(
              "snk-ai-mentor-video.mp4"
            );

          } else {

            window.open(
              videoUrl,
              "_blank"
            );

          }

        }
      );

    }

  }


  /* =======================================================
     37. EXPORT PROJECT
     ======================================================= */

  function exportProject() {

    const project =
      collectProject();


    const blob =
      new Blob(
        [
          JSON.stringify(
            project,
            null,
            2
          )
        ],
        {
          type:
            "application/json"
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        "a"
      );


    link.href =
      url;


    link.download =
      createFileName(
        state.projectName
      ) +
      ".json";


    document.body.appendChild(
      link
    );


    link.click();

    link.remove();


    URL.revokeObjectURL(
      url
    );


    showToast(
      "Project JSON exported.",
      "success"
    );

  }


  /* =======================================================
     38. CREATE FILE NAME
     ======================================================= */

  function createFileName(
    name
  ) {

    return String(
      name ||
        "snk-ai-mentor-project"
    )
      .trim()
      .replace(
        /[<>:"/\\|?*\x00-\x1F]/g,
        ""
      )
      .replace(
        /\s+/g,
        "-"
      )
      .slice(
        0,
        80
      ) ||
      "snk-ai-mentor-project";

  }


  /* =======================================================
     39. ESCAPE HTML
     ======================================================= */

  function escapeHtml(
    value
  ) {

    return String(
      value || ""
    )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );

  }


  /* =======================================================
     40. DRAG & DROP
     ======================================================= */

  function setupDropZone(
    areaId,
    inputId,
    callback
  ) {

    const area =
      $(areaId);


    const input =
      $(inputId);


    if (!area || !input) {
      return;
    }


    area.addEventListener(
      "dragover",
      event => {

        event.preventDefault();

        area.classList.add(
          "dragover"
        );

      }
    );


    area.addEventListener(
      "dragleave",
      () => {

        area.classList.remove(
          "dragover"
        );

      }
    );


    area.addEventListener(
      "drop",
      event => {

        event.preventDefault();

        area.classList.remove(
          "dragover"
        );


        const file =
          event.dataTransfer &&
          event.dataTransfer.files
            ? event.dataTransfer.files[0]
            : null;


        if (file) {

          callback(file);

        }

      }
    );


    input.addEventListener(
      "change",
      () => {

        const file =
          input.files &&
          input.files[0]
            ? input.files[0]
            : null;


        if (file) {

          callback(file);

        }


        input.value =
          "";

      }
    );

  }


  /* =======================================================
     41. BUTTON EVENTS
     ======================================================= */

  function setupEvents() {

    /*
     * Face upload
     */

    setupDropZone(
      "faceUploadArea",
      "faceVideoInput",
      handleFaceVideo
    );


    /*
     * Voice upload
     */

    setupDropZone(
      "voiceUploadArea",
      "voiceInput",
      handleVoiceAudio
    );


    /*
     * Face buttons
     */

    if ($("selectFaceVideoBtn")) {

      $("selectFaceVideoBtn")
        .addEventListener(
          "click",
          () => {

            $("faceVideoInput")
              ?.click();

          }
        );

    }


    if ($("changeFaceVideoBtn")) {

      $("changeFaceVideoBtn")
        .addEventListener(
          "click",
          () => {

            $("faceVideoInput")
              ?.click();

          }
        );

    }


    /*
     * Voice buttons
     */

    if ($("selectVoiceBtn")) {

      $("selectVoiceBtn")
        .addEventListener(
          "click",
          () => {

            $("voiceInput")
              ?.click();

          }
        );

    }


    if ($("removeVoiceBtn")) {

      $("removeVoiceBtn")
        .addEventListener(
          "click",
          removeVoice
        );

    }


    /*
     * Script
     */

    if ($("lessonScript")) {

      $("lessonScript")
        .addEventListener(
          "input",
          handleScriptInput
        );

    }


    if ($("clearScriptBtn")) {

      $("clearScriptBtn")
        .addEventListener(
          "click",
          clearScript
        );

    }


    /*
     * Project name
     */

    if ($("projectName")) {

      $("projectName")
        .addEventListener(
          "input",
          event =>
            syncProjectName(
              event.target
            )
        );

    }


    if ($("projectNameTop")) {

      $("projectNameTop")
        .addEventListener(
          "input",
          event =>
            syncProjectName(
              event.target
            )
        );

    }


    /*
     * Save buttons
     */

    if ($("saveProjectBtn")) {

      $("saveProjectBtn")
        .addEventListener(
          "click",
          () => saveProject()
        );

    }


    if ($("sidebarSaveBtn")) {

      $("sidebarSaveBtn")
        .addEventListener(
          "click",
          () => saveProject()
        );

    }


    /*
     * Export
     */

    if ($("exportProjectBtn")) {

      $("exportProjectBtn")
        .addEventListener(
          "click",
          exportProject
        );

    }


    /*
     * Prepare AI Video
     */

    if ($("prepareVideoBtn")) {

      $("prepareVideoBtn")
        .addEventListener(
          "click",
          prepareAIVideo
        );

    }


    /*
     * Video settings
     */

    [

      "videoFormat",

      "videoResolution",

      "mentorPosition",

      "videoBackground"

    ].forEach(
      id => {

        const element =
          $(id);


        if (element) {

          element.addEventListener(
            "change",
            handleVideoSettings
          );

        }

      }
    );


    /*
     * Auto-save
     */

    document.addEventListener(
      "input",
      event => {

        if (
          event.target &&
          event.target.id ===
            "lessonScript"
        ) {

          clearTimeout(
            setupEvents.autoSaveTimer
          );


          setupEvents.autoSaveTimer =
            setTimeout(
              () => {

                saveProject(
                  true
                );

                setText(
                  "autosaveStatus",
                  "Auto-saved"
                );

              },
              1200
            );

        }

      }
    );

  }


  /* =======================================================
     42. ENGINE EVENT CONNECTION
     ======================================================= */

  function connectEngineEvents() {

    const Video =
      window.SNKAI.Video;


    if (!Video) {
      return;
    }


    Video.on(
      "generationStarted",
      () => {

        state.videoStatus =
          "processing";


        state.videoProgress =
          5;


        showToast(
          "AI video generation started.",
          "info"
        );

      }
    );


    Video.on(
      "progress",
      data => {

        state.videoProgress =
          Number(
            data.progress
          ) || 0;


        state.videoStatus =
          data.status ||
          "processing";

      }
    );


    Video.on(
      "queued",
      data => {

        state.videoStatus =
          "queued";


        state.videoJobId =
          data.jobId ||
          null;

      }
    );


    Video.on(
      "generationCompleted",
      data => {

        state.videoStatus =
          "completed";


        state.videoProgress =
          100;


        state.videoJobId =
          data.jobId ||
          null;

      }
    );


    Video.on(
      "error",
      data => {

        state.videoStatus =
          "error";


        state.videoProgress =
          0;


        console.error(
          "[SNK AI Mentor]",
          data
        );

      }
    );


    Video.on(
      "cancelled",
      () => {

        state.videoStatus =
          "cancelled";

      }
    );

  }


  /* =======================================================
     43. KEYBOARD SHORTCUTS
     ======================================================= */

  function setupKeyboard() {

    document.addEventListener(
      "keydown",
      event => {

        /*
         * Ctrl/Cmd + S
         */

        if (
          (
            event.ctrlKey ||
            event.metaKey
          ) &&
          event.key.toLowerCase() ===
            "s"
        ) {

          event.preventDefault();

          saveProject();

        }

      }
    );

  }


  /* =======================================================
     44. INITIALIZE
     ======================================================= */

  function init() {

    if (
      state.initialized
    ) {

      return;

    }


    state.initialized =
      true;


    setupEvents();

    setupKeyboard();

    connectEngineEvents();

    restoreProject();

    updateScriptCounters();

    updateReadiness();


    /*
     * Sync Video engine with current UI.
     */

    const Video =
      window.SNKAI.Video;


    if (Video) {

      Video.setScript(
        $("lessonScript")
          ? $("lessonScript").value
          : ""
      );


      Video.setSettings(
        state.videoSettings
      );

    }


    console.log(
      "[SNK AI Mentor] Mentor Studio initialized."
    );

  }


  /* =======================================================
     45. PUBLIC API
     ======================================================= */

  window.SNKAI.MentorStudio = {

    getState() {

      return {

        ...state,

        videoSettings: {

          ...state.videoSettings

        }

      };

    },


    save() {

      return saveProject();

    },


    exportProject() {

      return exportProject();

    },


    prepareVideo() {

      return prepareAIVideo();

    },


    clearFace() {

      return removeFaceVideo();

    },


    clearVoice() {

      return removeVoice();

    },


    clearScript() {

      return clearScript();

    },


    showToast

  };


  /* =======================================================
     46. START
     ======================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init,
      {
        once: true
      }
    );

  } else {

    init();

  }


})();
