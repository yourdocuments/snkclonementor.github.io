<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <meta
    name="description"
    content="SNK AI Mentor Studio — Create AI-assisted teaching videos using your mentor face, voice and lesson script."
  >

  <meta name="theme-color" content="#070b14">

  <title>AI Mentor Studio | SNK AI Mentor</title>

  <!-- =====================================================
       GLOBAL CSS
       ===================================================== -->
  <link rel="stylesheet" href="../style.css">

  <!-- =====================================================
       MENTOR STUDIO CSS
       ===================================================== -->
  <link rel="stylesheet" href="ai-mentor.css">
</head>

<body class="mentor-studio-page">

  <!-- =====================================================
       APP BACKGROUND
       ===================================================== -->
  <div class="studio-bg" aria-hidden="true">
    <div class="studio-bg-grid"></div>
    <div class="studio-bg-glow studio-bg-glow-1"></div>
    <div class="studio-bg-glow studio-bg-glow-2"></div>
  </div>


  <!-- =====================================================
       TOP HEADER
       ===================================================== -->
  <header class="studio-header">

    <div class="studio-header-inner">

      <!-- Brand -->
      <a href="../index.html" class="studio-brand">

        <div class="studio-brand-mark">
          <span>SNK</span>
        </div>

        <div class="studio-brand-text">
          <strong>SNK AI Mentor</strong>
          <small>Mentor Studio</small>
        </div>

      </a>


      <!-- Project -->
      <div class="studio-project-top">

        <span class="project-top-label">
          CURRENT PROJECT
        </span>

        <strong id="projectNameTop">
          Untitled Mentor Project
        </strong>

      </div>


      <!-- Header Actions -->
      <div class="studio-header-actions">

        <button
          type="button"
          class="studio-header-btn"
          id="sidebarSaveBtn"
        >
          <span>💾</span>
          <span>Save</span>
        </button>

        <button
          type="button"
          class="studio-header-btn"
          id="exportProjectBtn"
        >
          <span>↗</span>
          <span>Export</span>
        </button>

        <a
          href="../index.html"
          class="studio-header-btn studio-home-btn"
        >
          <span>←</span>
          <span>Home</span>
        </a>

      </div>

    </div>

  </header>



  <!-- =====================================================
       MAIN APP
       ===================================================== -->
  <main class="studio-main">

    <!-- ===================================================
         PAGE HERO
         =================================================== -->
    <section class="studio-page-hero">

      <div class="studio-hero-copy">

        <div class="studio-eyebrow">
          <span class="eyebrow-dot"></span>
          AI TEACHING WORKSPACE
        </div>

        <h1>
          Build your
          <span>AI Mentor</span>
          video.
        </h1>

        <p>
          Add your face video, voice sample and lesson script.
          Prepare everything in one professional workspace.
        </p>

      </div>


      <div class="studio-hero-status">

        <div class="live-status-dot"></div>

        <div>
          <small>STUDIO STATUS</small>
          <strong id="studioStatus">
            Ready
          </strong>
        </div>

      </div>

    </section>



    <!-- ===================================================
         WORKFLOW STEPS
         =================================================== -->
    <section class="workflow-strip">

      <div class="workflow-step active">
        <span class="workflow-number">01</span>
        <div>
          <strong>Mentor Face</strong>
          <small>Upload face video</small>
        </div>
      </div>

      <div class="workflow-line"></div>

      <div class="workflow-step">
        <span class="workflow-number">02</span>
        <div>
          <strong>Voice</strong>
          <small>Add voice sample</small>
        </div>
      </div>

      <div class="workflow-line"></div>

      <div class="workflow-step">
        <span class="workflow-number">03</span>
        <div>
          <strong>Lesson</strong>
          <small>Write your script</small>
        </div>
      </div>

      <div class="workflow-line"></div>

      <div class="workflow-step">
        <span class="workflow-number">04</span>
        <div>
          <strong>Generate</strong>
          <small>Create AI video</small>
        </div>
      </div>

    </section>



    <!-- ===================================================
         STUDIO LAYOUT
         =================================================== -->
    <section class="studio-layout">

      <!-- =================================================
           LEFT / MAIN WORKSPACE
           ================================================= -->
      <div class="studio-workspace">


        <!-- ===============================================
             PROJECT NAME
             =============================================== -->
        <section class="studio-card project-card">

          <div class="card-heading">

            <div class="card-heading-icon">
              ✦
            </div>

            <div>
              <span class="card-kicker">
                PROJECT
              </span>

              <h2>
                Mentor Project
              </h2>
            </div>

          </div>


          <div class="field-group">

            <label for="projectName">
              Project Name
            </label>

            <input
              type="text"
              id="projectName"
              placeholder="Example: Digital Marketing Masterclass"
              autocomplete="off"
            >

          </div>

        </section>



        <!-- ===============================================
             FACE VIDEO
             =============================================== -->
        <section class="studio-card">

          <div class="card-heading">

            <div class="card-heading-icon">
              👤
            </div>

            <div>
              <span class="card-kicker">
                STEP 01
              </span>

              <h2>
                Mentor Face Video
              </h2>

              <p>
                Upload a clear video of yourself for the AI mentor.
              </p>
            </div>

          </div>


          <!-- Upload Area -->
          <div
            class="upload-area face-upload-area"
            id="faceUploadArea"
          >

            <!-- Empty -->
            <div
              class="upload-empty"
              id="faceUploadEmpty"
            >

              <div class="upload-icon">
                🎥
              </div>

              <h3>
                Upload Mentor Video
              </h3>

              <p>
                MP4, WebM or MOV
              </p>

              <span class="upload-hint">
                Use a clear front-facing recording
              </span>

              <button
                type="button"
                class="primary-btn"
                id="selectFaceVideoBtn"
              >
                Select Video
              </button>

            </div>


            <!-- Preview -->
            <div
              class="face-preview-wrapper"
              id="facePreviewWrapper"
              hidden
            >

              <video
                id="faceVideoPreview"
                class="face-video-preview"
                controls
                playsinline
                preload="metadata"
              ></video>

              <div class="preview-actions">

                <button
                  type="button"
                  class="secondary-btn"
                  id="changeFaceVideoBtn"
                >
                  Change Video
                </button>

              </div>

            </div>

          </div>


          <input
            type="file"
            id="faceVideoInput"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            hidden
          >

        </section>



        <!-- ===============================================
             VOICE SAMPLE
             =============================================== -->
        <section class="studio-card">

          <div class="card-heading">

            <div class="card-heading-icon">
              🎙️
            </div>

            <div>
              <span class="card-kicker">
                STEP 02
              </span>

              <h2>
                Mentor Voice
              </h2>

              <p>
                Upload your voice sample for AI voice generation.
              </p>
            </div>

          </div>


          <div
            class="upload-area voice-upload-area"
            id="voiceUploadArea"
          >

            <!-- Empty -->
            <div
              class="upload-empty"
              id="voiceUploadEmpty"
            >

              <div class="upload-icon">
                🎧
              </div>

              <h3>
                Upload Voice Sample
              </h3>

              <p>
                MP3, WAV, M4A or OGG
              </p>

              <span class="upload-hint">
                A clean voice recording works best
              </span>

              <button
                type="button"
                class="primary-btn"
                id="selectVoiceBtn"
              >
                Select Voice
              </button>

            </div>


            <!-- Voice Preview -->
            <div
              class="voice-preview"
              id="voicePreview"
              hidden
            >

              <div class="voice-file-icon">
                🎵
              </div>

              <div class="voice-file-info">

                <strong id="voiceFileName">
                  Voice Sample
                </strong>

                <span id="voiceFileMeta">
                  Audio file
                </span>

              </div>

              <audio
                id="voiceAudioPlayer"
                controls
              ></audio>

              <button
                type="button"
                class="danger-btn"
                id="removeVoiceBtn"
              >
                Remove
              </button>

            </div>

          </div>


          <input
            type="file"
            id="voiceInput"
            accept="audio/*,.mp3,.wav,.m4a,.ogg"
            hidden
          >

        </section>



        <!-- ===============================================
             LESSON SCRIPT
             =============================================== -->
        <section class="studio-card script-card">

          <div class="card-heading">

            <div class="card-heading-icon">
              📝
            </div>

            <div>
              <span class="card-kicker">
                STEP 03
              </span>

              <h2>
                Lesson Script
              </h2>

              <p>
                Write what your AI mentor should teach.
              </p>
            </div>

          </div>


          <!-- Script Settings -->
          <div class="script-toolbar">

            <div class="field-group">

              <label for="scriptLanguage">
                Language
              </label>

              <select id="scriptLanguage">

                <option value="bn">
                  বাংলা
                </option>

                <option value="en">
                  English
                </option>

                <option value="bn-en">
                  বাংলা + English
                </option>

              </select>

            </div>


            <div class="field-group">

              <label for="scriptStyle">
                Teaching Style
              </label>

              <select id="scriptStyle">

                <option value="professional">
                  Professional
                </option>

                <option value="friendly">
                  Friendly
                </option>

                <option value="energetic">
                  Energetic
                </option>

                <option value="calm">
                  Calm
                </option>

              </select>

            </div>

          </div>


          <!-- Textarea -->
          <div class="script-editor">

            <textarea
              id="lessonScript"
              placeholder="Write your lesson here...

Example:

আজকের ক্লাসে আমরা Digital Marketing সম্পর্কে জানব।

প্রথমে আমরা জানব Digital Marketing কী।
তারপর Facebook Ads কীভাবে কাজ করে সেটা দেখব।

Let's begin today's lesson..."
              spellcheck="true"
            ></textarea>

            <div class="script-editor-footer">

              <div class="script-counts">

                <span>
                  <strong id="wordCount">0</strong>
                  words
                </span>

                <span>
                  <strong id="charCount">0</strong>
                  characters
                </span>

              </div>

              <div
                class="autosave-status"
                id="autosaveStatus"
              >
                ● Auto-save ready
              </div>

            </div>

          </div>


          <div class="script-actions">

            <button
              type="button"
              class="secondary-btn"
              id="clearScriptBtn"
            >
              Clear Script
            </button>

          </div>

        </section>



        <!-- ===============================================
             VIDEO SETTINGS
             =============================================== -->
        <section class="studio-card">

          <div class="card-heading">

            <div class="card-heading-icon">
              🎬
            </div>

            <div>
              <span class="card-kicker">
                STEP 04
              </span>

              <h2>
                Video Settings
              </h2>

              <p>
                Configure your AI teaching video output.
              </p>
            </div>

          </div>


          <div class="settings-grid">

            <!-- Format -->
            <div class="field-group">

              <label for="videoFormat">
                Format
              </label>

              <select id="videoFormat">

                <option value="mp4">
                  MP4
                </option>

                <option value="webm">
                  WebM
                </option>

              </select>

            </div>


            <!-- Resolution -->
            <div class="field-group">

              <label for="videoResolution">
                Resolution
              </label>

              <select id="videoResolution">

                <option value="1080p">
                  1920 × 1080 — Full HD
                </option>

                <option value="720p">
                  1280 × 720 — HD
                </option>

                <option value="4k">
                  3840 × 2160 — 4K
                </option>

              </select>

            </div>


            <!-- Mentor Position -->
            <div class="field-group">

              <label for="mentorPosition">
                Mentor Position
              </label>

              <select id="mentorPosition">

                <option value="right">
                  Right
                </option>

                <option value="left">
                  Left
                </option>

                <option value="center">
                  Center
                </option>

              </select>

            </div>


            <!-- Background -->
            <div class="field-group">

              <label for="videoBackground">
                Background
              </label>

              <select id="videoBackground">

                <option value="studio">
                  AI Studio
                </option>

                <option value="classroom">
                  Classroom
                </option>

                <option value="office">
                  Office
                </option>

                <option value="transparent">
                  Transparent
                </option>

              </select>

            </div>

          </div>

        </section>



        <!-- ===============================================
             AI VIDEO OUTPUT
             =============================================== -->
        <section
          class="studio-card ai-video-output-card"
          id="videoOutputCard"
        >

          <div class="card-heading">

            <div class="card-heading-icon">
              ✨
            </div>

            <div>

              <span class="card-kicker">
                AI VIDEO OUTPUT
              </span>

              <h2>
                Generated Teaching Video
              </h2>

              <p>
                Your generated AI mentor video will appear here.
              </p>

            </div>

          </div>


          <!-- Empty Output -->
          <div
            class="video-output-empty"
            id="videoOutputEmpty"
          >

            <div class="output-empty-icon">
              ▶
            </div>

            <h3>
              No video generated yet
            </h3>

            <p>
              Complete the mentor face, voice and lesson script,
              then prepare your AI video.
            </p>

          </div>


          <!-- Generated Video -->
          <div
            class="video-output-player"
            id="videoOutputPlayer"
            hidden
          >

            <div class="generated-video-frame">

              <video
                id="generatedVideo"
                controls
                playsinline
                preload="metadata"
              ></video>

            </div>


            <div class="generated-video-actions">

              <a
                href="#"
                class="primary-btn"
                id="downloadGeneratedVideo"
                download
              >
                Download MP4
              </a>

              <button
                type="button"
                class="secondary-btn"
                id="openGeneratedVideo"
              >
                Open Video
              </button>

            </div>

          </div>

        </section>

      </div>



      <!-- =================================================
           RIGHT SIDEBAR
           ================================================= -->
      <aside class="studio-sidebar">


        <!-- ===============================================
             READINESS
             =============================================== -->
        <section class="sidebar-card readiness-card">

          <div class="sidebar-card-heading">

            <div>

              <span class="sidebar-kicker">
                PROJECT READINESS
              </span>

              <h3>
                Ready to Generate
              </h3>

            </div>

            <strong id="readinessPercent">
              0%
            </strong>

          </div>


          <div class="readiness-progress">

            <div
              class="readiness-progress-bar"
              id="readinessProgress"
              style="width:0%"
            ></div>

          </div>


          <div class="readiness-checklist">

            <!-- Face -->
            <div
              class="readiness-item"
              id="checkFace"
            >

              <span class="check-icon">
                ○
              </span>

              <div>
                <strong>
                  Mentor Face
                </strong>

                <small>
                  Upload face video
                </small>
              </div>

            </div>


            <!-- Voice -->
            <div
              class="readiness-item"
              id="checkVoice"
            >

              <span class="check-icon">
                ○
              </span>

              <div>
                <strong>
                  Mentor Voice
                </strong>

                <small>
                  Upload voice sample
                </small>
              </div>

            </div>


            <!-- Script -->
            <div
              class="readiness-item"
              id="checkScript"
            >

              <span class="check-icon">
                ○
              </span>

              <div>
                <strong>
                  Lesson Script
                </strong>

                <small>
                  Add teaching content
                </small>
              </div>

            </div>


            <!-- Settings -->
            <div
              class="readiness-item"
              id="checkSettings"
            >

              <span class="check-icon">
                ○
              </span>

              <div>
                <strong>
                  Video Settings
                </strong>

                <small>
                  Output configuration
                </small>
              </div>

            </div>

          </div>


          <!-- Prepare -->
          <button
            type="button"
            class="prepare-video-btn"
            id="prepareVideoBtn"
          >

            <span class="prepare-icon">
              ✨
            </span>

            <span>
              Prepare AI Video
            </span>

            <span class="prepare-arrow">
              →
            </span>

          </button>

        </section>



        <!-- ===============================================
             SAVE PROJECT
             =============================================== -->
        <section class="sidebar-card">

          <span class="sidebar-kicker">
            PROJECT
          </span>

          <h3>
            Save your work
          </h3>

          <p>
            Your project data is automatically saved in this
            browser while you work.
          </p>


          <button
            type="button"
            class="sidebar-action-btn"
            id="saveProjectBtn"
          >
            <span>💾</span>
            Save Project
          </button>


          <div class="saved-time">

            <span>
              Last saved
            </span>

            <strong id="savedTime">
              Not saved yet
            </strong>

          </div>

        </section>



        <!-- ===============================================
             HOW IT WORKS
             =============================================== -->
        <section class="sidebar-card help-card">

          <span class="sidebar-kicker">
            HOW IT WORKS
          </span>

          <h3>
            Your AI Mentor Workflow
          </h3>


          <div class="help-flow">

            <div class="help-flow-item">

              <span>01</span>

              <div>
                <strong>
                  Face
                </strong>

                <small>
                  Add your mentor video
                </small>
              </div>

            </div>


            <div class="help-flow-item">

              <span>02</span>

              <div>
                <strong>
                  Voice
                </strong>

                <small>
                  Add your voice sample
                </small>
              </div>

            </div>


            <div class="help-flow-item">

              <span>03</span>

              <div>
                <strong>
                  Script
                </strong>

                <small>
                  Write your lesson
                </small>
              </div>

            </div>


            <div class="help-flow-item">

              <span>04</span>

              <div>
                <strong>
                  AI Video
                </strong>

                <small>
                  Connect provider and generate
                </small>
              </div>

            </div>

          </div>

        </section>



        <!-- ===============================================
             IMPORTANT NOTE
             =============================================== -->
        <section class="sidebar-card info-card">

          <div class="info-icon">
            ℹ
          </div>

          <div>

            <strong>
              AI Provider
            </strong>

            <p>
              This studio prepares your project for an external
              AI avatar and voice provider. Actual face/voice
              generation requires a provider connection and
              secure server-side API integration.
            </p>

          </div>

        </section>

      </aside>

    </section>

  </main>



  <!-- =====================================================
       TOAST
       ===================================================== -->
  <div
    class="mentor-toast"
    id="mentorToast"
    role="status"
    aria-live="polite"
  >

    <span class="toast-icon">
      ✓
    </span>

    <span id="toastMessage">
      Saved
    </span>

  </div>



  <!-- =====================================================
       REQUIRED ENGINE SCRIPTS
       
       IMPORTANT:
       Load order must remain:

       1. Global script
       2. AI config
       3. Avatar engine
       4. Voice engine
       5. Video engine
       6. Mentor Studio controller
       ===================================================== -->

  <script src="../script.js"></script>

  <script src="../ai/ai-config.js"></script>

  <script src="../ai/avatar.js"></script>

  <script src="../ai/voice.js"></script>

  <script src="../ai/video.js"></script>

  <script src="ai-mentor.js"></script>

</body>
</html>
