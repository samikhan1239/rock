export function initInteractions() {
  // ==========================================
  // 1. NAVBAR SCROLL & ACTIVE LINK SPY
  // ==========================================
  const navbar = document.querySelector('.navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');
  const mobileToggle = document.getElementById('mobile-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;

    if (navbar) {
      if (scrollY > 40) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }

    // Scrollspy
    sections.forEach(sec => {
      const top = sec.offsetTop - 120;
      const height = sec.offsetHeight;
      const id = sec.getAttribute('id');

      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  });

  // Mobile menu toggle
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      const isExpanded = mobileMenu.classList.contains('open');
      mobileToggle.setAttribute('aria-expanded', isExpanded);
    });

    document.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
      });
    });
  }

  // ==========================================
  // 2. HORIZONTAL JOURNEY STAGE SWITCHER
  // ==========================================
  const stageBtns = document.querySelectorAll('.stage-nav-btn');
  const journeyTrack = document.getElementById('journey-track');

  stageBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const stageIdx = parseInt(btn.getAttribute('data-stage'), 10);

      stageBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      if (journeyTrack) {
        journeyTrack.style.transform = `translateX(-${stageIdx * 33.33333}%)`;
      }
    });
  });

  // ==========================================
  // 3. EDITORIAL GALLERY SUBJECT FILTERS
  // ==========================================
  const filterTabs = document.querySelectorAll('.filter-tab');
  const tutorCards = document.querySelectorAll('.tutor-card');

  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const filter = tab.getAttribute('data-filter');

      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      tutorCards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 20);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(15px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 250);
        }
      });
    });
  });

  // Footer filter links
  document.querySelectorAll('.filter-link').forEach(link => {
    link.addEventListener('click', (e) => {
      const subject = link.getAttribute('data-subject');
      const targetTab = document.querySelector(`.filter-tab[data-filter="${subject}"]`);
      if (targetTab) targetTab.click();
    });
  });

  // ==========================================
  // 4. CARD CLICKS & MODAL TRIGGERS
  // ==========================================
  // Play demo buttons
  document.querySelectorAll('.tc-play-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tutorId = btn.getAttribute('data-tutor');
      if (window.openTutorDetail) window.openTutorDetail(tutorId);
    });
  });

  // Detail buttons
  document.querySelectorAll('.btn-tutor-detail').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tutorId = btn.getAttribute('data-tutor');
      if (window.openTutorDetail) window.openTutorDetail(tutorId);
    });
  });

  // Connect buttons
  document.querySelectorAll('.btn-request-connect').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tutorId = btn.getAttribute('data-tutor');
      if (window.openRequestModal) window.openRequestModal(tutorId);
    });
  });

  // Card click defaults to open detail
  tutorCards.forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      const tutorId = card.getAttribute('data-id');
      if (window.openTutorDetail) window.openTutorDetail(tutorId);
    });
  });

  // ==========================================
  // 5. 3D CARD TILT ON MOUSEMOVE
  // ==========================================
  if (window.matchMedia('(min-width: 992px)').matches) {
    tutorCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // ==========================================
  // 6. DUAL-WORLD BRIDGE CLICK REACTION
  // ==========================================
  const bridgeCore = document.getElementById('bridge-core');
  if (bridgeCore) {
    bridgeCore.addEventListener('click', () => {
      bridgeCore.style.transform = 'scale(1.2) rotate(180deg)';
      setTimeout(() => {
        bridgeCore.style.transform = '';
      }, 500);
      const journey = document.getElementById('how-it-works');
      if (journey) journey.scrollIntoView({ behavior: 'smooth' });
    });
  }
}
