import { setHeroScroll } from '../three/heroScene.js';

export function initScrollController(storyScene) {
  // Elements
  const heroSection = document.getElementById('hero');
  const kineticSection = document.getElementById('kinetic-type');
  const pinnedStorySection = document.getElementById('pinned-story');
  const horizontalSection = document.getElementById('horizontal-journey');
  const hTrack = document.getElementById('horizontal-track');
  const hProgressBar = document.getElementById('h-progress-bar');
  const beamFill = document.getElementById('scroll-beam-fill');

  // Kinetic typography elements
  const ktWord1 = document.getElementById('kt-phase-1');
  const ktWord2 = document.getElementById('kt-phase-2');
  const ktWord3 = document.getElementById('kt-phase-3');

  // Story step indicators
  const storySteps = document.querySelectorAll('.story-step-indicator');
  const storyCards = document.querySelectorAll('.story-scene-card');

  // Magnetic cursor elements
  const cursorDot = document.getElementById('cursor-dot');
  const cursorFollower = document.getElementById('cursor-follower');

  // ==========================================
  // 1. SCROLL LOOP (High Performance rAF)
  // ==========================================
  const handleScroll = () => {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const windowH = window.innerHeight;
    const docH = document.documentElement.scrollHeight - windowH;

    // A. Global Beam Progress
    const globalProgress = docH > 0 ? scrollY / docH : 0;
    if (beamFill) {
      beamFill.style.height = `${globalProgress * 100}%`;
    }

    // B. Hero 3D & Text Scroll Progress
    if (heroSection) {
      const heroTop = heroSection.offsetTop;
      const heroH = heroSection.offsetHeight;
      const heroProg = Math.max(0, Math.min(1, (scrollY - heroTop) / (heroH * 0.9)));
      setHeroScroll(heroProg);

      // Hero Text Parallax
      const heroNarrative = document.querySelector('.hero-narrative');
      if (heroNarrative) {
        heroNarrative.style.transform = `translateY(${heroProg * 80}px)`;
        heroNarrative.style.opacity = `${1 - heroProg * 1.1}`;
      }
    }

    // C. Kinetic Typography Morphing
    if (kineticSection) {
      const ktTop = kineticSection.offsetTop;
      const ktH = kineticSection.offsetHeight;
      const ktProg = Math.max(0, Math.min(1, (scrollY - ktTop) / (ktH - windowH)));

      if (scrollY >= ktTop && scrollY <= ktTop + ktH) {
        // Phase 1: 0 - 0.33
        // Phase 2: 0.33 - 0.66
        // Phase 3: 0.66 - 1.0
        if (ktWord1 && ktWord2 && ktWord3) {
          if (ktProg < 0.33) {
            const p1 = ktProg / 0.33;
            ktWord1.style.opacity = `${1 - p1 * 0.5}`;
            ktWord1.style.transform = `scale(${1 + p1 * 0.8})`;
            ktWord2.style.opacity = '0';
            ktWord2.style.transform = 'translateY(40px)';
            ktWord3.style.opacity = '0';
          } else if (ktProg < 0.66) {
            const p2 = (ktProg - 0.33) / 0.33;
            ktWord1.style.opacity = '0';
            ktWord2.style.opacity = '1';
            ktWord2.style.transform = `scale(${1 + p2 * 0.3}) translateY(0px)`;
            ktWord3.style.opacity = '0';
          } else {
            const p3 = (ktProg - 0.66) / 0.34;
            ktWord1.style.opacity = '0';
            ktWord2.style.opacity = '0';
            ktWord3.style.opacity = '1';
            ktWord3.style.transform = `scale(${0.9 + p3 * 0.2})`;
          }
        }
      }
    }

    // D. Pinned Storytelling 5-Scene Progress
    if (pinnedStorySection && storyScene) {
      const storyTop = pinnedStorySection.offsetTop;
      const storyH = pinnedStorySection.offsetHeight;
      const storyProg = Math.max(0, Math.min(1, (scrollY - storyTop) / (storyH - windowH)));

      storyScene.setProgress(storyProg);

      // 5 Stages: [0-0.20, 0.20-0.40, 0.40-0.60, 0.60-0.80, 0.80-1.0]
      const activeStage = Math.min(4, Math.floor(storyProg * 5));

      storySteps.forEach((step, idx) => {
        if (idx === activeStage) {
          step.classList.add('active');
        } else {
          step.classList.remove('active');
        }
      });

      storyCards.forEach((card, idx) => {
        if (idx === activeStage) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      });
    }

    // E. Vertical-to-Horizontal Scroll Translation
    if (horizontalSection && hTrack) {
      const hTop = horizontalSection.offsetTop;
      const hHeight = horizontalSection.offsetHeight;
      const maxScroll = hHeight - windowH;

      if (scrollY >= hTop && scrollY <= hTop + maxScroll) {
        const hProg = (scrollY - hTop) / maxScroll;
        // Total horizontal width is 400vw, so translate from 0 to -300vw
        const translateX = hProg * 75; // percentage of 400vw
        hTrack.style.transform = `translateX(-${translateX}%)`;
        if (hProgressBar) {
          hProgressBar.style.width = `${hProg * 100}%`;
        }
      } else if (scrollY < hTop) {
        hTrack.style.transform = 'translateX(0%)';
        if (hProgressBar) hProgressBar.style.width = '0%';
      } else {
        hTrack.style.transform = 'translateX(-75%)';
        if (hProgressBar) hProgressBar.style.width = '100%';
      }
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // Story step click-to-jump
  storySteps.forEach((step) => {
    step.addEventListener('click', () => {
      const stageIdx = parseInt(step.getAttribute('data-stage'), 10);
      if (!pinnedStorySection) return;
      const storyTop = pinnedStorySection.offsetTop;
      const storyH = pinnedStorySection.offsetHeight - window.innerHeight;
      const targetScroll = storyTop + (stageIdx / 5) * storyH + 50;
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    });
  });

  // ==========================================
  // 2. CUSTOM MAGNETIC CURSOR & 3D TILT GLARE
  // ==========================================
  let mouseX = -100;
  let mouseY = -100;
  let followerX = -100;
  let followerY = -100;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (cursorDot) {
      cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    }
  });

  const renderCursor = () => {
    followerX += (mouseX - followerX) * 0.15;
    followerY += (mouseY - followerY) * 0.15;

    if (cursorFollower) {
      cursorFollower.style.transform = `translate(${followerX}px, ${followerY}px)`;
    }
    requestAnimationFrame(renderCursor);
  };
  renderCursor();

  // Cursor expand on interactive elements
  const interactives = document.querySelectorAll('button, a, .tutor-card, .radio-card, canvas, .story-step-indicator');
  interactives.forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (cursorFollower) cursorFollower.classList.add('expanded');
    });
    el.addEventListener('mouseleave', () => {
      if (cursorFollower) cursorFollower.classList.remove('expanded');
    });
  });

  // Magnetic button physics
  const magneticBtns = document.querySelectorAll('.magnetic-btn');
  magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      btn.style.transform = `translate(${relX * 0.25}px, ${relY * 0.25}px) scale(1.03)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}
