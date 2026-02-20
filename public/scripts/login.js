/* login.js - Updated with fullscreen enforcement, Next.js status check, and bright red error text */

const FALLBACK_ANSWER_API_URL = "https://script.google.com/macros/s/AKfycby6B9OgDmMNJqGmDNBvF7MJnAaV1wXTnvmzjjCEqn8vIh1zEFx7Izn3jxEJIsvnuXF4/exec";

function apiUrl() {
  try {
    if (typeof window !== 'undefined' && window.ANSWER_API_URL) return window.ANSWER_API_URL;
  } catch (e) {}
  return FALLBACK_ANSWER_API_URL;
}

// Fullscreen helper functions
function requestFullscreen() {
  const el = document.documentElement;
  if (el.requestFullscreen) return el.requestFullscreen();
  if (el.mozRequestFullScreen) return el.mozRequestFullScreen();
  if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
  if (el.msRequestFullscreen) return el.msRequestFullscreen();
  return Promise.resolve();
}

function inFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement ||
            document.mozFullScreenElement || document.msFullscreenElement);
}

const startBtn = document.getElementById('startBtn');
const userForm = document.getElementById('userForm');
const instructionModal = new bootstrap.Modal(document.getElementById('instructionModal'));
const duplicateModal = new bootstrap.Modal(document.getElementById('duplicateModal'));
const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
const noInternetModal = new bootstrap.Modal(document.getElementById('noInternetModal'));

let checkData = { lastName: '', firstName: '', code: '' };

if (startBtn) {
  startBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const lastNameInput = document.getElementById('lastName');
    const firstNameInput = document.getElementById('firstName');
    const codeInput = document.getElementById('code');

    if (!lastNameInput || !firstNameInput || !codeInput) return;

    const lastName = lastNameInput.value.trim();
    const firstName = firstNameInput.value.trim();
    const code = codeInput.value.trim();

    if (!lastName || !firstName || !code) {
      alert('Please fill in all fields.');
      return;
    }

    checkData = { lastName, firstName, code: code.toUpperCase() };

    // Show loading spinner
    const spinner = document.getElementById('startLoadingSpinner');
    if (spinner) spinner.style.display = 'block';
    startBtn.disabled = true;

    try {
      // =========================================================
      // 1. NEW NEXT.JS STATUS CHECK (Is the exam active?)
      // =========================================================
      const nextJsUrl = window.NEXTJS_API_URL || '';
      if (nextJsUrl) {
        const verifyRes = await fetch(`${nextJsUrl}/api/exams/verify?code=${encodeURIComponent(checkData.code)}`);
        const verifyData = await verifyRes.json();

        if (!verifyData.success) {
           throw new Error(verifyData.message || "Invalid test code. Please check and try again.");
        }

        // Check specific status and shout errors if not active
        if (verifyData.status === 'draft') {
          throw new Error("The exam is still in draft mode. Please wait for your instructor to open it.");
        } else if (verifyData.status === 'completed') {
          throw new Error("This exam has already ended.");
        } else if (verifyData.status !== 'active') {
          throw new Error("This exam is currently not available.");
        }
      } else {
        console.warn("NEXTJS_API_URL is not defined. Skipping status check.");
      }

      // =========================================================
      // 2. EXISTING GOOGLE APPS SCRIPT DUPLICATE CHECK
      // =========================================================
      const params = new URLSearchParams({ action: 'checkDuplicate', lastName, firstName, code: checkData.code });
      const res = await fetch(apiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      });

      const json = await res.json();

      if (spinner) spinner.style.display = 'none';
      startBtn.disabled = false;

      if (json.exists) {
        const dt = document.getElementById('duplicateText');
        if (dt) dt.textContent = 'A student with this name has already taken this exam. Please contact your instructor.';
        duplicateModal.show();
        return;
      }

      // Show instructions modal if everything passes
      const instructionsText = document.getElementById('instructionsText');
      if (instructionsText) {
        instructionsText.innerHTML = `
          <p><strong>Welcome to the ${checkData.code} Exam</strong></p>
          <ol style="line-height: 2;">
            <li>You will be taken through a series of questions.</li>
            <li>Answer each question to the best of your ability.</li>
            <li>You can skip questions and return to them later.</li>
            <li><strong>Fullscreen mode will be enforced throughout the exam.</strong></li>
            <li>Exiting fullscreen will count as a violation.</li>
            <li>The exam will be submitted automatically after 3 violations.</li>
            <li>Make sure you have a stable internet connection.</li>
          </ol>
        `;
      }
      instructionModal.show();

    } catch (err) {
      if (spinner) spinner.style.display = 'none';
      startBtn.disabled = false;
      
      const et = document.getElementById('errorText');
      // Added a span with a bright red color (#ff6b6b) so it is highly visible on dark backgrounds
      if (et) {
        et.innerHTML = `<span style="color: #ff6b6b; font-size: 1.05rem;"><strong>Access Denied:</strong><br>${err.message}</span>`;
      }
      errorModal.show();
    }
  });
}

const agreeBtn = document.getElementById('agreeBtn');
if (agreeBtn) {
  agreeBtn.addEventListener('click', async () => {
    instructionModal.hide();
    
    // Mark that fullscreen is required
    sessionStorage.setItem('exam_fullscreen_required', 'true');
    
    // Request fullscreen before navigating
    try {
      await requestFullscreen();
      console.log('[Fullscreen] Entered fullscreen mode before exam start');
    } catch (e) {
      console.warn('[Fullscreen] Failed to enter fullscreen:', e);
    }
    
    // Small delay to ensure fullscreen is active
    setTimeout(() => {
      const url = new URL('exam.html', window.location.href);
      url.searchParams.set('lastName', checkData.lastName);
      url.searchParams.set('firstName', checkData.firstName);
      url.searchParams.set('code', checkData.code);
      window.location.href = url.toString();
    }, 500);
  });
}

const cancelStart = document.getElementById('cancelStart');
if (cancelStart) {
  cancelStart.addEventListener('click', () => {
    instructionModal.hide();
  });
}

const retryOnline = document.getElementById('retryOnline');
if (retryOnline) {
  retryOnline.addEventListener('click', () => {
    noInternetModal.hide();
    if (navigator.onLine) {
      startBtn.click();
    } else {
      alert('Still no internet connection. Please check your connection.');
    }
  });
}

window.addEventListener('online', () => {
  noInternetModal.hide();
});

window.addEventListener('offline', () => {
  const nit = document.getElementById('noInternetText');
  if (nit) nit.textContent = 'Internet connection lost. Please reconnect and try again.';
  noInternetModal.show();
});