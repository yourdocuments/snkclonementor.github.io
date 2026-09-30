/* =========================================================
   SNK AI MENTOR
   Mentor Studio JavaScript
   File: mentor/ai-mentor.js

   Features:
   - Face video upload + preview
   - Voice audio upload + preview
   - Drag & drop upload
   - Lesson script editor
   - Word count
   - Character count
   - Auto-save
   - Project save
   - Project restore
   - Project name sync
   - AI readiness percentage
   - Video settings persistence
   - Clear script
   - Export project as JSON
   - Prepare AI Video workflow
   - Toast notifications
   ========================================================= */

(() => {
  "use strict";


  /* =======================================================
     CONFIG
  ======================================================== */

  const STORAGE_KEY = "snkAiMentorStudioProject";

  const AUTOSAVE_DELAY = 700;

  let faceVideoURL = null;
  let voiceAudioURL = null;

  let autoSaveTimer = null;


  /* =======================================================
     DOM HELPERS
  ======================================================== */

  const $ = (selector) => document.querySelector(selector);

  const $$ = (selector) => document.querySelectorAll(selector);


  /* =======================================================
     ELEMENTS
  ======================================================== */

  const faceVideoInput =
    $("#faceVideoInput");

  const faceUploadArea =
    $("#faceUploadArea");

  const faceUploadEmpty =
    $("#faceUploadEmpty");

  const facePreviewWrapper =
    $("#facePreviewWrapper");

  const faceVideoPreview =
    $("#faceVideoPreview");

  const selectFaceVideoBtn =
    $("#selectFaceVideoBtn");

  const changeFaceVideoBtn =
    $("#changeFaceVideoBtn");


  const voiceInput =
    $("#voiceInput");

  const voiceUploadArea =
    $("#voiceUploadArea");

  const voiceUploadEmpty =
    $("#voiceUploadEmpty");

  const voicePreview =
    $("#voicePreview");

  const voiceAudioPlayer =
    $("#voiceAudioPlayer");

  const voiceFileName =
    $("#voiceFileName");

  const voiceFileMeta =
    $("#voiceFileMeta");

  const selectVoiceBtn =
    $("#selectVoiceBtn");

  const removeVoiceBtn =
    $("#removeVoiceBtn");


  const lessonScript =
    $("#lessonScript");

  const scriptLanguage =
    $("#scriptLanguage");

  const scriptStyle =
    $("#scriptStyle");

  const wordCount =
    $("#wordCount");

  const charCount =
    $("#charCount");

  const autosaveStatus =
    $("#autosaveStatus");

  const clearScriptBtn =
    $("#clearScriptBtn");


  const projectName =
    $("#projectName");

  const projectNameTop =
    $("#projectNameTop");

  const saveProjectBtn =
    $("#saveProjectBtn");

  const sidebarSaveBtn =
    $("#sidebarSaveBtn");

  const savedTime =
    $("#savedTime");


  const videoFormat =
    $("#videoFormat");

  const videoResolution =
    $("#videoResolution");

  const mentorPosition =
    $("#mentorPosition");

  const videoBackground =
    $("#videoBackground");


  const studioStatus =
    $("#studioStatus");

  const readinessPercent =
    $("#readinessPercent");

  const readinessProgress =
    $("#readinessProgress");

  const checkFace =
    $("#checkFace");

  const checkVoice =
    $("#checkVoice");

  const checkScript =
    $("#checkScript");

  const checkSettings =
    $("#checkSettings");


  const prepareVideoBtn =
    $("#prepareVideoBtn");

  const exportProjectBtn =
    $("#exportProjectBtn");


  const mentorToast =
    $("#mentorToast");

  const toastMessage =
    $("#toastMessage");


  /* =======================================================
     INTERNAL STATE
  ======================================================== */

  const state = {
    faceVideo: null,
    voiceAudio: null,

    projectName:
      "Untitled Mentor Project",

    script: "",

    language: "bn",

    style: "teaching",

    videoFormat: "16:9",

    videoResolution: "1080",

    mentorPosition: "center",

    videoBackground: "original",

    savedAt: null
  };


  /* =======================================================
     INIT
  ======================================================== */

  function init() {

    restoreProject();

    bindEvents();

    updateProjectName();

    updateScriptStats();

    updateReadiness();

    updateSettingsStatus();

    setupDragAndDrop();

    setStudioStatus(
      "Ready to build"
    );

  }


  /* =======================================================
     EVENTS
  ======================================================== */

  function bindEvents() {

    /* -----------------------------------------------
       Face video
    ------------------------------------------------ */

    if (selectFaceVideoBtn) {

      selectFaceVideoBtn.addEventListener(
        "click",
        () => {

          faceVideoInput?.click();

        }
      );

    }


    if (changeFaceVideoBtn) {

      changeFaceVideoBtn.addEventListener(
        "click",
        () => {

          faceVideoInput?.click();

        }
      );

    }


    if (faceVideoInput) {

      faceVideoInput.addEventListener(
        "change",
        (event) => {

          const file =
            event.target.files?.[0];

          if (file) {

            handleFaceVideo(file);

          }

        }
      );

    }


    /* -----------------------------------------------
       Voice
    ------------------------------------------------ */

    if (selectVoiceBtn) {

      selectVoiceBtn.addEventListener(
        "click",
        () => {

          voiceInput?.click();

        }
      );

    }


    if (voiceInput) {

      voiceInput.addEventListener(
        "change",
        (event) => {

          const file =
            event.target.files?.[0];

          if (file) {

            handleVoiceAudio(file);

          }

        }
      );

    }


    if (removeVoiceBtn) {

      removeVoiceBtn.addEventListener(
        "click",
        removeVoiceAudio
      );

    }


    /* -----------------------------------------------
       Script
    ------------------------------------------------ */

    if (lessonScript) {

      lessonScript.addEventListener(
        "input",
        () => {

          state.script =
            lessonScript.value;

          updateScriptStats();

          scheduleAutoSave();

          updateReadiness();

        }
      );

    }


    if (scriptLanguage) {

      scriptLanguage.addEventListener(
        "change",
        () => {

          state.language =
            scriptLanguage.value;

          scheduleAutoSave();

        }
      );

    }


    if (scriptStyle) {

      scriptStyle.addEventListener(
        "change",
        () => {

          state.style =
            scriptStyle.value;

          scheduleAutoSave();

        }
      );

    }


    if (clearScriptBtn) {

      clearScriptBtn.addEventListener(
        "click",
        clearScript
      );

    }


    /* -----------------------------------------------
       Project name
    ------------------------------------------------ */

    if (projectName) {

      projectName.addEventListener(
        "input",
        () => {

          state.projectName =
            projectName.value.trim()
            ||
            "Untitled Mentor Project";

          updateProjectName();

          scheduleAutoSave();

        }
      );

    }


    /* -----------------------------------------------
       Save
    ------------------------------------------------ */

    saveProjectBtn?.addEventListener(
      "click",
      saveProject
    );

    sidebarSaveBtn?.addEventListener(
      "click",
      saveProject
    );


    /* -----------------------------------------------
       Settings
    ------------------------------------------------ */

    videoFormat?.addEventListener(
      "change",
      () => {

        state.videoFormat =
          videoFormat.value;

        scheduleAutoSave();

        updateReadiness();

      }
    );


    videoResolution?.addEventListener(
      "change",
      () => {

        state.videoResolution =
          videoResolution.value;

        scheduleAutoSave();

      }
    );


    mentorPosition?.addEventListener(
      "change",
      () => {

        state.mentorPosition =
          mentorPosition.value;

        scheduleAutoSave();

      }
    );


    videoBackground?.addEventListener(
      "change",
      () => {

        state.videoBackground =
          videoBackground.value;

        scheduleAutoSave();

      }
    );


    /* -----------------------------------------------
       Export
    ------------------------------------------------ */

    exportProjectBtn?.addEventListener(
      "click",
      exportProject
    );


    /* -----------------------------------------------
       Prepare AI video
    ------------------------------------------------ */

    prepareVideoBtn?.addEventListener(
      "click",
      prepareAIVideo
    );


    /* -----------------------------------------------
       Page exit
    ------------------------------------------------ */

    window.addEventListener(
      "beforeunload",
      () => {

        saveProjectToStorage(
          false
        );

      }
    );

  }


  /* =======================================================
     FACE VIDEO
  ======================================================== */

  function handleFaceVideo(file) {

    if (!file.type.startsWith("video/")) {

      showToast(
        "Please choose a video file.",
        "error"
      );

      return;

    }


    const maxSize =
      500 * 1024 * 1024;

    if (file.size > maxSize) {

      showToast(
        "Video is larger than 500 MB.",
        "error"
      );

      return;

    }


    if (faceVideoURL) {

      URL.revokeObjectURL(
        faceVideoURL
      );

    }


    faceVideoURL =
      URL.createObjectURL(file);


    state.faceVideo = {

      name: file.name,

      type: file.type,

      size: file.size,

      lastModified:
        file.lastModified

    };


    if (faceVideoPreview) {

      faceVideoPreview.src =
        faceVideoURL;

      faceVideoPreview.load();

    }


    if (faceUploadEmpty) {

      faceUploadEmpty.hidden =
        true;

    }


    if (facePreviewWrapper) {

      facePreviewWrapper.hidden =
        false;

    }


    updateReadiness();

    setStudioStatus(
      "Face video added"
    );

    scheduleAutoSave();

    showToast(
      "Face video uploaded successfully."
    );

  }


  /* =======================================================
     VOICE AUDIO
  ======================================================== */

  function handleVoiceAudio(file) {

    if (!file.type.startsWith("audio/")) {

      showToast(
        "Please choose an audio file.",
        "error"
      );

      return;

    }


    const maxSize =
      200 * 1024 * 1024;

    if (file.size > maxSize) {

      showToast(
        "Audio file is larger than 200 MB.",
        "error"
      );

      return;

    }


    if (voiceAudioURL) {

      URL.revokeObjectURL(
        voiceAudioURL
      );

    }


    voiceAudioURL =
      URL.createObjectURL(file);


    state.voiceAudio = {

      name: file.name,

      type: file.type,

      size: file.size,

      lastModified:
        file.lastModified

    };


    if (voiceAudioPlayer) {

      voiceAudioPlayer.src =
        voiceAudioURL;

      voiceAudioPlayer.load();

    }


    if (voiceFileName) {

      voiceFileName.textContent =
        file.name;

    }


    if (voiceFileMeta) {

      voiceFileMeta.textContent =
        `${formatBytes(file.size)} · ${file.type || "Audio"}`;

    }


    if (voiceUploadEmpty) {

      voiceUploadEmpty.hidden =
        true;

    }


    if (voicePreview) {

      voicePreview.hidden =
        false;

    }


    updateReadiness();

    setStudioStatus(
      "Voice sample added"
    );

    scheduleAutoSave();

    showToast(
      "Voice sample uploaded successfully."
    );

  }


  /* =======================================================
     REMOVE VOICE
  ======================================================== */

  function removeVoiceAudio() {

    if (voiceAudioURL) {

      URL.revokeObjectURL(
        voiceAudioURL
      );

      voiceAudioURL =
        null;

    }


    state.voiceAudio =
      null;


    if (voiceAudioPlayer) {

      voiceAudioPlayer.pause();

      voiceAudioPlayer.removeAttribute(
        "src"
      );

      voiceAudioPlayer.load();

    }


    if (voicePreview) {

      voicePreview.hidden =
        true;

    }


    if (voiceUploadEmpty) {

      voiceUploadEmpty.hidden =
        false;

    }


    if (voiceInput) {

      voiceInput.value =
        "";

    }


    updateReadiness();

    scheduleAutoSave();

    showToast(
      "Voice sample removed."
    );

  }


  /* =======================================================
     DRAG & DROP
  ======================================================== */

  function setupDragAndDrop() {

    setupDropZone(
      faceUploadArea,
      (file) => {

        if (file.type.startsWith("video/")) {

          handleFaceVideo(file);

        } else {

          showToast(
            "Please drop a video file.",
            "error"
          );

        }

      }
    );


    setupDropZone(
      voiceUploadArea,
      (file) => {

        if (file.type.startsWith("audio/")) {

          handleVoiceAudio(file);

        } else {

          showToast(
            "Please drop an audio file.",
            "error"
          );

        }

      }
    );

  }


  function setupDropZone(
    element,
    callback
  ) {

    if (!element) return;


    const events = [
      "dragenter",
      "dragover"
    ];


    events.forEach(
      (eventName) => {

        element.addEventListener(
          eventName,
          (event) => {

            event.preventDefault();

            element.classList.add(
              "drag-active"
            );

          }
        );

      }
    );


    [
      "dragleave",
      "dragend",
      "drop"
    ].forEach(
      (eventName) => {

        element.addEventListener(
          eventName,
          (event) => {

            event.preventDefault();

            element.classList.remove(
              "drag-active"
            );

          }
        );

      }
    );


    element.addEventListener(
      "drop",
      (event) => {

        const file =
          event.dataTransfer?.files?.[0];

        if (file) {

          callback(file);

        }

      }
    );

  }


  /* =======================================================
     SCRIPT STATISTICS
  ======================================================== */

  function updateScriptStats() {

    if (!lessonScript) return;


    const text =
      lessonScript.value || "";


    const trimmed =
      text.trim();


    const words =
      trimmed
        ? trimmed.split(/\s+/).length
        : 0;


    const characters =
      text.length;


    if (wordCount) {

      wordCount.textContent =
        `${words} ${words === 1 ? "word" : "words"}`;

    }


    if (charCount) {

      charCount.textContent =
        `${characters} ${characters === 1 ? "character" : "characters"}`;

    }

  }


  /* =======================================================
     AUTO SAVE
  ======================================================== */

  function scheduleAutoSave() {

    if (autosaveStatus) {

      autosaveStatus.textContent =
        "● Saving...";

    }


    clearTimeout(
      autoSaveTimer
    );


    autoSaveTimer =
      setTimeout(
        () => {

          saveProjectToStorage(
            false
          );

        },
        AUTOSAVE_DELAY
      );

  }


  /* =======================================================
     SAVE PROJECT
  ======================================================== */

  function saveProject() {

    state.savedAt =
      new Date().toISOString();


    saveProjectToStorage(
      true
    );


    updateSavedTime();

    setStudioStatus(
      "Project saved"
    );

    showToast(
      "Project saved successfully."
    );

  }


  function saveProjectToStorage(
    notify = false
  ) {

    syncStateFromUI();


    state.savedAt =
      state.savedAt
      ||
      new Date().toISOString();


    try {

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
      );


      updateSavedTime();


      if (autosaveStatus) {

        autosaveStatus.textContent =
          "● Auto-save enabled";

      }


      if (notify) {

        showToast(
          "Project saved locally."
        );

      }

    } catch (error) {

      console.error(
        "SNK AI Mentor save error:",
        error
      );


      if (autosaveStatus) {

        autosaveStatus.textContent =
          "● Save unavailable";

      }


      if (notify) {

        showToast(
          "Could not save the project.",
          "error"
        );

      }

    }

  }


  /* =======================================================
     SYNC STATE
  ======================================================== */

  function syncStateFromUI() {

    if (projectName) {

      state.projectName =
        projectName.value.trim()
        ||
        "Untitled Mentor Project";

    }


    if (lessonScript) {

      state.script =
        lessonScript.value;

    }


    if (scriptLanguage) {

      state.language =
        scriptLanguage.value;

    }


    if (scriptStyle) {

      state.style =
        scriptStyle.value;

    }


    if (videoFormat) {

      state.videoFormat =
        videoFormat.value;

    }


    if (videoResolution) {

      state.videoResolution =
        videoResolution.value;

    }


    if (mentorPosition) {

      state.mentorPosition =
        mentorPosition.value;

    }


    if (videoBackground) {

      state.videoBackground =
        videoBackground.value;

    }

  }


  /* =======================================================
     RESTORE PROJECT
  ======================================================== */

  function restoreProject() {

    let stored = null;


    try {

      const raw =
        localStorage.getItem(
          STORAGE_KEY
        );


      if (raw) {

        stored =
          JSON.parse(raw);

      }

    } catch (error) {

      console.warn(
        "SNK AI Mentor restore error:",
        error
      );

    }


    if (!stored) {

      return;

    }


    Object.assign(
      state,
      stored
    );


    if (projectName) {

      projectName.value =
        state.projectName
        ||
        "Untitled Mentor Project";

    }


    if (lessonScript) {

      lessonScript.value =
        state.script
        ||
        "";

    }


    if (
      scriptLanguage &&
      state.language
    ) {

      scriptLanguage.value =
        state.language;

    }


    if (
      scriptStyle &&
      state.style
    ) {

      scriptStyle.value =
        state.style;

    }


    if (
      videoFormat &&
      state.videoFormat
    ) {

      videoFormat.value =
        state.videoFormat;

    }


    if (
      videoResolution &&
      state.videoResolution
    ) {

      videoResolution.value =
        state.videoResolution;

    }


    if (
      mentorPosition &&
      state.mentorPosition
    ) {

      mentorPosition.value =
        state.mentorPosition;

    }


    if (
      videoBackground &&
      state.videoBackground
    ) {

      videoBackground.value =
        state.videoBackground;

    }


    /*
      Browser security does not allow a saved File object
      to be restored into an <input type="file">.

      Therefore only metadata is restored.
      The user must select the actual media again after
      refreshing the page.
    */

    if (state.faceVideo) {

      showToast(
        "Saved project restored. Please re-select the face video.",
        "info"
      );

    }


    if (state.voiceAudio) {

      setTimeout(
        () => {

          showToast(
            "Voice sample metadata restored. Please re-select the audio.",
            "info"
          );

        },
        1800
      );

    }

  }


  /* =======================================================
     PROJECT NAME
  ======================================================== */

  function updateProjectName() {

    const name =
      projectName?.value.trim()
      ||
      state.projectName
      ||
      "Untitled Mentor Project";


    if (projectNameTop) {

      projectNameTop.textContent =
        name;

    }

  }


  /* =======================================================
     SAVED TIME
  ======================================================== */

  function updateSavedTime() {

    if (!savedTime) return;


    if (!state.savedAt) {

      savedTime.textContent =
        "Not saved yet";

      return;

    }


    const date =
      new Date(
        state.savedAt
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      savedTime.textContent =
        "Not saved yet";

      return;

    }


    savedTime.textContent =
      `Saved ${date.toLocaleString()}`;

  }


  /* =======================================================
     READINESS
  ======================================================== */

  function updateReadiness() {

    const hasFace =
      Boolean(
        state.faceVideo
      );


    const hasVoice =
      Boolean(
        state.voiceAudio
      );


    const hasScript =
      Boolean(
        lessonScript &&
        lessonScript.value.trim().length >= 5
      );


    const hasSettings =
      Boolean(
        videoFormat?.value &&
        videoResolution?.value
      );


    const checks = [
      hasFace,
      hasVoice,
      hasScript,
      hasSettings
    ];


    const readyCount =
      checks.filter(Boolean).length;


    const percentage =
      Math.round(
        (readyCount / checks.length) * 100
      );


    if (readinessPercent) {

      readinessPercent.textContent =
        `${percentage}%`;

    }


    if (readinessProgress) {

      readinessProgress.style.width =
        `${percentage}%`;

    }


    setCheckState(
      checkFace,
      hasFace
    );

    setCheckState(
      checkVoice,
      hasVoice
    );

    setCheckState(
      checkScript,
      hasScript
    );

    setCheckState(
      checkSettings,
      hasSettings
    );


    if (percentage === 100) {

      setStudioStatus(
        "Ready for AI preparation"
      );

    } else if (percentage >= 50) {

      setStudioStatus(
        "Almost ready"
      );

    } else {

      setStudioStatus(
        "Ready to build"
      );

    }

  }


  function setCheckState(
    element,
    ready
  ) {

    if (!element) return;


    element.classList.toggle(
      "ready",
      ready
    );

  }


  function updateSettingsStatus() {

    if (
      videoFormat &&
      videoResolution
    ) {

      state.videoFormat =
        videoFormat.value;

      state.videoResolution =
        videoResolution.value;

    }

  }


  /* =======================================================
     CLEAR SCRIPT
  ======================================================== */

  function clearScript() {

    if (!lessonScript) return;


    const hasContent =
      lessonScript.value.trim().length > 0;


    if (!hasContent) {

      showToast(
        "The script is already empty.",
        "info"
      );

      return;

    }


    const confirmed =
      window.confirm(
        "Clear the entire lesson script?"
      );


    if (!confirmed) {

      return;

    }


    lessonScript.value =
      "";

    state.script =
      "";


    updateScriptStats();

    updateReadiness();

    scheduleAutoSave();


    showToast(
      "Lesson script cleared."
    );

  }


  /* =======================================================
     EXPORT PROJECT
  ======================================================== */

  function exportProject() {

    syncStateFromUI();


    const exportData = {

      app:
        "SNK AI Mentor",

      version:
        "1.0",

      exportedAt:
        new Date().toISOString(),

      project: {

        name:
          state.projectName,

        script:
          state.script,

        language:
          state.language,

        teachingStyle:
          state.style,

        video: {

          format:
            state.videoFormat,

          resolution:
            state.videoResolution,

          mentorPosition:
            state.mentorPosition,

          background:
            state.videoBackground

        },

        media: {

          faceVideo:
            state.faceVideo,

          voiceAudio:
            state.voiceAudio

        }

      }

    };


    const json =
      JSON.stringify(
        exportData,
        null,
        2
      );


    const blob =
      new Blob(
        [json],
        {
          type:
            "application/json"
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    const anchor =
      document.createElement(
        "a"
      );


    anchor.href =
      url;

    anchor.download =
      `${safeFileName(
        state.projectName
      ) || "snk-ai-mentor-project"}.json`;


    document.body.appendChild(
      anchor
    );


    anchor.click();


    anchor.remove();


    URL.revokeObjectURL(
      url
    );


    showToast(
      "Project exported as JSON."
    );

  }


  /* =======================================================
     PREPARE AI VIDEO
  ======================================================== */

  function prepareAIVideo() {

    syncStateFromUI();

    updateReadiness();


    const hasFace =
      Boolean(
        state.faceVideo
      );


    const hasVoice =
      Boolean(
        state.voiceAudio
      );


    const hasScript =
      Boolean(
        state.script.trim()
      );


    if (!hasFace) {

      showToast(
        "Please upload your face video first.",
        "error"
      );

      scrollToElement(
        faceUploadArea
      );

      return;

    }


    if (!hasVoice) {

      showToast(
        "Please upload your voice sample first.",
        "error"
      );

      scrollToElement(
        voiceUploadArea
      );

      return;

    }


    if (!hasScript) {

      showToast(
        "Please write your lesson script first.",
        "error"
      );

      scrollToElement(
        lessonScript
      );

      return;

    }


    /*
      This is intentionally a preparation layer.

      Actual AI avatar generation will later connect to:
      ai/ai-config.js
      ai/avatar.js
      ai/voice.js
      ai/video.js

      No API key is placed in this browser-side file.
    */


    setStudioStatus(
      "Preparing AI workflow..."
    );


    if (prepareVideoBtn) {

      prepareVideoBtn.disabled =
        true;

      prepareVideoBtn.innerHTML =
        "<span>⟳</span> Preparing...";

    }


    setTimeout(
      () => {

        if (prepareVideoBtn) {

          prepareVideoBtn.disabled =
            false;

          prepareVideoBtn.innerHTML =
            "<span>✦</span> Prepare AI Video <span>→</span>";

        }


        setStudioStatus(
          "AI workflow prepared"
        );


        showToast(
          "Project is ready for AI provider integration."
        );


        showPreparationDialog();

      },
      1200
    );

  }


  /* =======================================================
     PREPARATION DIALOG
  ======================================================== */

  function showPreparationDialog() {

    const existing =
      document.querySelector(
        ".ai-preparation-modal"
      );


    if (existing) {

      existing.remove();

    }


    const modal =
      document.createElement(
        "div"
      );


    modal.className =
      "ai-preparation-modal";


    modal.innerHTML = `
      <div class="ai-preparation-backdrop"></div>

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

        <span class="ai-preparation-kicker">
          AI VIDEO WORKFLOW
        </span>

        <h3>
          Your project is prepared
        </h3>

        <p>
          The face, voice and lesson script are ready.
          The next stage will connect this project to an
          external AI avatar and voice provider.
        </p>

        <div class="ai-preparation-list">

          <div>
            <span>✓</span>
            <strong>Face identity ready</strong>
          </div>

          <div>
            <span>✓</span>
            <strong>Voice identity ready</strong>
          </div>

          <div>
            <span>✓</span>
            <strong>Lesson script ready</strong>
          </div>

          <div>
            <span>✓</span>
            <strong>Video settings ready</strong>
          </div>

        </div>

        <div class="ai-preparation-actions">

          <button
            type="button"
            class="ai-modal-primary"
            data-action="continue"
          >
            Continue to AI Setup →
          </button>

          <button
            type="button"
            class="ai-modal-secondary"
            data-action="close"
          >
            Close
          </button>

        </div>

        <small>
          API integration will be added in the next AI module steps.
        </small>

      </div>
    `;


    document.body.appendChild(
      modal
    );


    requestAnimationFrame(
      () => {

        modal.classList.add(
          "show"
        );

      }
    );


    const close =
      () => {

        modal.classList.remove(
          "show"
        );


        setTimeout(
          () => {

            modal.remove();

          },
          220
        );

      };


    modal
      .querySelector(
        ".ai-preparation-close"
      )
      ?.addEventListener(
        "click",
        close
      );


    modal
      .querySelector(
        ".ai-preparation-backdrop"
      )
      ?.addEventListener(
        "click",
        close
      );


    modal
      .querySelector(
        '[data-action="close"]'
      )
      ?.addEventListener(
        "click",
        close
      );


    modal
      .querySelector(
        '[data-action="continue"]'
      )
      ?.addEventListener(
        "click",
        () => {

          close();

          showToast(
            "AI Setup module will be connected next."
          );

        }
      );


    const escapeHandler =
      (event) => {

        if (
          event.key === "Escape"
        ) {

          close();

          document.removeEventListener(
            "keydown",
            escapeHandler
          );

        }

      };


    document.addEventListener(
      "keydown",
      escapeHandler
    );

  }


  /* =======================================================
     STUDIO STATUS
  ======================================================== */

  function setStudioStatus(
    message
  ) {

    if (!studioStatus) return;


    studioStatus.textContent =
      message;

  }


  /* =======================================================
     TOAST
  ======================================================== */

  let toastTimer = null;


  function showToast(
    message,
    type = "success"
  ) {

    if (!mentorToast) return;


    if (toastMessage) {

      toastMessage.textContent =
        message;

    }


    const icon =
      mentorToast.querySelector(
        ".toast-icon"
      );


    if (icon) {

      if (type === "error") {

        icon.textContent =
          "!";

      } else if (type === "info") {

        icon.textContent =
          "i";

      } else {

        icon.textContent =
          "✓";

      }

    }


    mentorToast.classList.add(
      "show"
    );


    clearTimeout(
      toastTimer
    );


    toastTimer =
      setTimeout(
        () => {

          mentorToast.classList.remove(
            "show"
          );

        },
        3000
      );

  }


  /* =======================================================
     SCROLL
  ======================================================== */

  function scrollToElement(
    element
  ) {

    if (!element) return;


    element.scrollIntoView({
      behavior:
        "smooth",

      block:
        "center"
    });

  }


  /* =======================================================
     FORMAT BYTES
  ======================================================== */

  function formatBytes(
    bytes
  ) {

    if (!Number.isFinite(bytes)) {

      return "0 Bytes";

    }


    if (bytes === 0) {

      return "0 Bytes";

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


    const safeIndex =
      Math.min(
        index,
        units.length - 1
      );


    const value =
      bytes /
      Math.pow(
        1024,
        safeIndex
      );


    return `${value.toFixed(
      safeIndex === 0 ? 0 : 1
    )} ${units[safeIndex]}`;

  }


  /* =======================================================
     SAFE FILE NAME
  ======================================================== */

  function safeFileName(
    value
  ) {

    return String(
      value || ""
    )
      .trim()
      .replace(
        /[<>:"/\\|?*\x00-\x1F]/g,
        "-"
      )
      .replace(
        /\s+/g,
        "-"
      )
      .replace(
        /-+/g,
        "-"
      )
      .slice(
        0,
        100
      );

  }


  /* =======================================================
     GLOBAL API
  ======================================================== */

  window.SNKAI =
    window.SNKAI || {};


  window.SNKAI.MentorStudio = {

    getState() {

      syncStateFromUI();

      return {
        ...state
      };

    },


    save() {

      saveProject();

    },


    exportProject() {

      exportProject();

    },


    prepareVideo() {

      prepareAIVideo();

    },


    showToast(
      message,
      type
    ) {

      showToast(
        message,
        type
      );

    }

  };


  /* =======================================================
     START
  ======================================================== */

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
