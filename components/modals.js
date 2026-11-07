import confetti from 'canvas-confetti';
import { TUTORS_DATA } from './tutorsData.js';

export function initModals() {
  const tutorModal = document.getElementById('tutor-modal');
  const tutorModalContent = document.getElementById('tutor-modal-content');
  const tutorModalClose = document.getElementById('tutor-modal-close');

  const requestModal = document.getElementById('request-modal');
  const requestModalClose = document.getElementById('request-modal-close');
  const requestForm = document.getElementById('connection-request-form');
  const requestSuccessBox = document.getElementById('request-success-box');
  const btnCloseSuccess = document.getElementById('btn-close-success');
  const selectedTutorInput = document.getElementById('selected-tutor-name');

  const becomeModal = document.getElementById('become-modal');
  const becomeModalClose = document.getElementById('become-modal-close');
  const becomeForm = document.getElementById('tutor-apply-form');
  const becomeSuccessBox = document.getElementById('tutor-apply-success');
  const btnCloseTutorSuccess = document.getElementById('btn-close-tutor-success');

  const authModal = document.getElementById('auth-modal');
  const authModalClose = document.getElementById('auth-modal-close');

  // Multi-step navigation for Parent Request
  const step1 = document.getElementById('form-step-1');
  const step2 = document.getElementById('form-step-2');
  const step3 = document.getElementById('form-step-3');

  const btnNext1 = document.getElementById('btn-next-step-1');
  const btnPrev2 = document.getElementById('btn-prev-step-2');
  const btnNext2 = document.getElementById('btn-next-step-2');
  const btnPrev3 = document.getElementById('btn-prev-step-3');

  // Helper to open/close modals
  const openModal = (m) => {
    if (!m) return;
    m.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = (m) => {
    if (!m) return;
    m.classList.remove('active');
    document.body.style.overflow = '';
  };

  // Close triggers
  if (tutorModalClose) tutorModalClose.addEventListener('click', () => closeModal(tutorModal));
  if (requestModalClose) requestModalClose.addEventListener('click', () => closeModal(requestModal));
  if (becomeModalClose) becomeModalClose.addEventListener('click', () => closeModal(becomeModal));
  if (authModalClose) authModalClose.addEventListener('click', () => closeModal(authModal));

  // Close on backdrop click
  [tutorModal, requestModal, becomeModal, authModal].forEach((modal) => {
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  // ESC key to close
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [tutorModal, requestModal, becomeModal, authModal].forEach(closeModal);
    }
  });

  // ==========================================
  // 1. TUTOR DETAIL & VIDEO DEMO MODAL
  // ==========================================
  window.openTutorDetail = (tutorId) => {
    const tutor = TUTORS_DATA[tutorId] || TUTORS_DATA['elena'];
    if (!tutorModalContent) return;

    tutorModalContent.innerHTML = `
      <div class="tmd-grid">
        <div class="tmd-video-player">
          <img src="${tutor.image}" alt="${tutor.name} Teaching Demo" id="tmd-player-img" />
          <div class="tmd-player-controls">
            <button class="tmd-play-toggle" id="tmd-play-btn" title="Toggle Demo Playback">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </button>
            <div class="tmd-timeline">
              <div class="tmd-timeline-progress" id="tmd-progress-bar"></div>
            </div>
            <span class="tmd-time-text" id="tmd-time-display">00:42 / ${tutor.demoDuration}</span>
          </div>
        </div>

        <div class="tmd-meta">
          <div class="tmd-top-row">
            <div>
              <h3 class="tmd-name">${tutor.name}</h3>
              <span class="tmd-uni">${tutor.university}</span>
            </div>
            <div class="tc-rate">${tutor.rate}</div>
          </div>

          <p class="tmd-bio">${tutor.bio}</p>

          <div class="tmd-spec-list">
            <div class="tmd-spec-item">
              <span>Degree & Standing:</span>
              <strong>${tutor.degree}</strong>
            </div>
            <div class="tmd-spec-item">
              <span>AI Pedagogy Score:</span>
              <strong style="color: #38bdf8;">99.2% (Top 5% Collegiate)</strong>
            </div>
            <div class="tmd-spec-item">
              <span>Demo Topic:</span>
              <strong>${tutor.demoTitle}</strong>
            </div>
          </div>

          <div class="tc-tags">
            ${tutor.subjects.map(s => `<span class="tc-tag">${s}</span>`).join('')}
          </div>

          <div class="form-buttons-row" style="margin-top: 14px;">
            <button class="btn btn-secondary" id="btn-tmd-close">Close</button>
            <button class="btn btn-primary" id="btn-tmd-request" data-tutor="${tutor.id}">Request Connection with ${tutor.name.split(' ')[0]}</button>
          </div>
        </div>
      </div>

      <div class="tmd-reviews-section" style="margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08);">
        <h4 style="font-size: 1rem; margin-bottom: 12px; color: #38bdf8;">Verified Family Feedback</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          ${tutor.sampleReviews.map(r => `
            <div style="background: rgba(255,255,255,0.03); padding: 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06);">
              <p style="font-size: 0.85rem; color: #f8fafc; font-style: italic; margin-bottom: 6px;">“${r.text}”</p>
              <span style="font-size: 0.75rem; color: #94a3b8; font-family: monospace;">— ${r.author}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    openModal(tutorModal);

    // Interactive video player simulation
    const playBtn = document.getElementById('tmd-play-btn');
    const progressBar = document.getElementById('tmd-progress-bar');
    let isPlaying = true;
    let progress = 45;
    let interval = setInterval(() => {
      if (!isPlaying) return;
      progress = (progress + 1) % 100;
      if (progressBar) progressBar.style.width = `${progress}%`;
    }, 150);

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        isPlaying = !isPlaying;
        playBtn.innerHTML = isPlaying 
          ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
          : `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
      });
    }

    const btnTmdClose = document.getElementById('btn-tmd-close');
    if (btnTmdClose) btnTmdClose.addEventListener('click', () => {
      clearInterval(interval);
      closeModal(tutorModal);
    });

    const btnTmdReq = document.getElementById('btn-tmd-request');
    if (btnTmdReq) btnTmdReq.addEventListener('click', () => {
      clearInterval(interval);
      closeModal(tutorModal);
      window.openRequestModal(tutor.id);
    });
  };

  // ==========================================
  // 2. PARENT REQUEST WIZARD MODAL
  // ==========================================
  window.openRequestModal = (tutorId) => {
    const tutor = TUTORS_DATA[tutorId];
    if (selectedTutorInput && tutor) {
      selectedTutorInput.value = tutor.name;
      const reqSubject = document.getElementById('req-subject');
      if (reqSubject) reqSubject.value = tutor.subjects[0];
    }
    // Reset steps
    step1.classList.add('active');
    step2.classList.remove('active');
    step3.classList.remove('active');
    if (requestForm) requestForm.style.display = 'flex';
    if (requestSuccessBox) requestSuccessBox.style.display = 'none';

    openModal(requestModal);
  };

  // Step 1 -> 2
  if (btnNext1) {
    btnNext1.addEventListener('click', () => {
      const grade = document.getElementById('req-student-grade').value;
      const sub = document.getElementById('req-subject').value;
      const goals = document.getElementById('req-goals').value;
      if (!grade || !sub || !goals) {
        showToast('Please fill out student grade, subject, and goals.');
        return;
      }
      step1.classList.remove('active');
      step2.classList.add('active');
    });
  }

  // Step 2 -> 1
  if (btnPrev2) {
    btnPrev2.addEventListener('click', () => {
      step2.classList.remove('active');
      step1.classList.add('active');
    });
  }

  // Step 2 -> 3
  if (btnNext2) {
    btnNext2.addEventListener('click', () => {
      step2.classList.remove('active');
      step3.classList.add('active');
    });
  }

  // Step 3 -> 2
  if (btnPrev3) {
    btnPrev3.addEventListener('click', () => {
      step3.classList.remove('active');
      step2.classList.add('active');
    });
  }

  // Request Submit
  if (requestForm) {
    requestForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const parentName = document.getElementById('req-parent-name').value;
      const consent = document.getElementById('req-consent').checked;
      if (!consent) {
        showToast('Please accept the managed connection terms.');
        return;
      }

      // Confetti celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      requestForm.style.display = 'none';
      if (requestSuccessBox) requestSuccessBox.style.display = 'flex';
    });
  }

  if (btnCloseSuccess) {
    btnCloseSuccess.addEventListener('click', () => closeModal(requestModal));
  }

  // ==========================================
  // 3. BECOME A TUTOR MODAL
  // ==========================================
  window.openBecomeModal = () => {
    if (becomeForm) becomeForm.style.display = 'flex';
    if (becomeSuccessBox) becomeSuccessBox.style.display = 'none';
    openModal(becomeModal);
  };

  if (becomeForm) {
    becomeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.6 }
      });
      becomeForm.style.display = 'none';
      if (becomeSuccessBox) becomeSuccessBox.style.display = 'flex';
    });
  }

  if (btnCloseTutorSuccess) {
    btnCloseTutorSuccess.addEventListener('click', () => closeModal(becomeModal));
  }

  // ==========================================
  // 4. AUTH MODAL
  // ==========================================
  window.openAuthModal = () => {
    openModal(authModal);
  };

  const roleParent = document.getElementById('auth-role-parent');
  const roleTutor = document.getElementById('auth-role-tutor');
  if (roleParent && roleTutor) {
    roleParent.addEventListener('click', () => {
      roleParent.classList.add('active');
      roleTutor.classList.remove('active');
    });
    roleTutor.addEventListener('click', () => {
      roleTutor.classList.add('active');
      roleParent.classList.remove('active');
    });
  }

  const authActionMain = document.getElementById('auth-action-main');
  if (authActionMain) {
    authActionMain.addEventListener('click', () => {
      showToast('Redirecting to secure SSO gateway...');
      setTimeout(() => closeModal(authModal), 1000);
    });
  }

  const authActionEmail = document.getElementById('auth-action-email');
  if (authActionEmail) {
    authActionEmail.addEventListener('click', () => {
      showToast('Magic sign-in link dispatched to your inbox!');
      setTimeout(() => closeModal(authModal), 1200);
    });
  }

  // Attach global button triggers
  document.querySelectorAll('.modal-trigger-tutor').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.openBecomeModal();
    });
  });

  document.querySelectorAll('.modal-trigger-find').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const el = document.getElementById('find-tutor');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    });
  });

  const heroFindBtn = document.getElementById('hero-find-tutor-btn');
  if (heroFindBtn) {
    heroFindBtn.addEventListener('click', () => {
      const el = document.getElementById('find-tutor');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    });
  }

  const heroBecomeBtn = document.getElementById('hero-become-tutor-btn');
  if (heroBecomeBtn) {
    heroBecomeBtn.addEventListener('click', () => window.openBecomeModal());
  }

  const navLogin = document.getElementById('nav-login-btn');
  if (navLogin) navLogin.addEventListener('click', () => window.openAuthModal());

  const navCta = document.getElementById('nav-cta-btn');
  if (navCta) navCta.addEventListener('click', () => window.openAuthModal());

  const mobileLogin = document.getElementById('mobile-login-btn');
  if (mobileLogin) mobileLogin.addEventListener('click', () => window.openAuthModal());

  const mobileCta = document.getElementById('mobile-cta-btn');
  if (mobileCta) mobileCta.addEventListener('click', () => window.openAuthModal());
}

// Toast helper
export function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
