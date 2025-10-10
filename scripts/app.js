// ================================
// Lottie Hero Animation
// ================================
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('hero-animation');
    if (!container) return;

    // Load Lottie
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.10.1/lottie.min.js';
    script.onload = () => {
      lottie.loadAnimation({
        container: container,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'images/robot-hello.json', // path to your JSON animation
      });
    };
    document.body.appendChild(script);
  });
})();

// ================================
// Lottie About Me Animation
// ================================
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("about-animation");
    if (!container) return;

    function initLottie() {
      lottie.loadAnimation({
        container: container,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "images/Coding-Slide1.json",
      });
    }

    if (window.lottie) {
      initLottie();
    } else {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.10.1/lottie.min.js";
      script.onload = initLottie;
      document.body.appendChild(script);
    }
  });
})();

// ================================
// Modal Logic (Consultation Form)
// ================================
(function () {
  const openBtn = document.getElementById('open-consult');
  const navContactBtn = document.getElementById('nav-contact');
  const modal = document.getElementById('consult-modal');
  const closeBtn = document.getElementById('close-modal');
  const cancelBtn = document.getElementById('cancel-modal');
  const form = document.getElementById('consult-form');

  function openModal() {
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    setTimeout(() => {
      const nameInput = document.getElementById('client-name');
      if (nameInput) nameInput.focus();
    }, 40);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (navContactBtn) navContactBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  form?.addEventListener('submit', function (e) {
    e.preventDefault();
    const nameRaw = document.getElementById('client-name')?.value.trim() || '';
    const emailRaw = document.getElementById('client-email')?.value.trim() || '';
    const messageRaw = document.getElementById('client-message')?.value.trim() || '';

    const name = encodeURIComponent(nameRaw);
    const email = encodeURIComponent(emailRaw);
    const message = encodeURIComponent(messageRaw);

    const recipient = 'example@gmail.com';
    const subject = encodeURIComponent('Consult Request — ' + (nameRaw || 'No name'));

    let body = `Name: ${name || ''}%0D%0A`;
    body += `Email: ${email || ''}%0D%0A%0D%0A`;
    body += `Message:%0D%0A${message || ''}%0D%0A%0D%0A`;
    body += 'Source: Website consultation form';

    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
    closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('open')) closeModal();
  });
})();

// ================================
// Menu Toggle Logic
// ================================
(function () {
  const menuBar = document.querySelector('.menu-bar');
  const navigation = document.querySelector('.navbar ul');
  const navLinks = document.querySelectorAll('.navbar ul a');

  menuBar?.addEventListener('click', () => {
    const isOpened = menuBar.getAttribute('aria-expanded') === 'true';
    menuBar.setAttribute('aria-expanded', String(!isOpened));
    navigation.classList.toggle('opened', !isOpened);
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navigation.classList.contains('opened')) {
        navigation.classList.remove('opened');
        menuBar?.setAttribute('aria-expanded', 'false');
      }
    });
  });
})();

// ================================
// Theme Toggle Logic
// ================================
// Theme toggle sync: desktop <-> mobile
(function () {
  const root = document.documentElement; // <html data-theme="...">
  const desktopToggle = document.getElementById('theme-toggle');
  const mobileToggle = document.getElementById('theme-toggle-mobile');

  function getTheme() {
    return root.getAttribute('data-theme') || 'light';
  }
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    // update icons
    const iconClass = t === 'dark' ? 'fa-sun' : 'fa-moon';
    if (desktopToggle && desktopToggle.querySelector('i')) {
      desktopToggle.querySelector('i').className = `fas ${iconClass}`;
    }
    if (mobileToggle && mobileToggle.querySelector('i')) {
      mobileToggle.querySelector('i').className = `fas ${iconClass}`;
    }
  }

  function toggleTheme() {
    const next = getTheme() === 'light' ? 'dark' : 'light';
    setTheme(next);
    try { localStorage.setItem('theme', next); } catch (e) { /* ignore */ }
  }

  // restore saved preference
  try {
    const saved = localStorage.getItem('theme');
    if (saved) setTheme(saved);
  } catch (e) {}

  if (desktopToggle) desktopToggle.addEventListener('click', toggleTheme);
  if (mobileToggle) mobileToggle.addEventListener('click', toggleTheme);

  // If the mobile button may not exist at load-time (rare), try to attach later
  // (not necessary if you added the HTML).
})();

// ================================
// Typing / Deleting Animation on Scroll
// ================================
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const subtitleSpan = document.querySelector(".subtitle span");
    if (!subtitleSpan) return;

    let lastScrollTop = window.scrollY;
    subtitleSpan.classList.add("typing");

    window.addEventListener("scroll", () => {
      const currentScrollTop = window.scrollY;
      if (currentScrollTop > lastScrollTop) {
        subtitleSpan.classList.replace("typing", "deleting");
      } else {
        subtitleSpan.classList.replace("deleting", "typing");
      }
      lastScrollTop = Math.max(0, currentScrollTop);
    });
  });
})();

// ================================
// Scroll-Reveal Animations
// ================================
(function () {
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  reveals.forEach(el => observer.observe(el));
})();

// ================================
// Project modal (open card to view details) + "Read More" link
// ================================
(function () {
  const cards = document.querySelectorAll('.portfolio-card');
  const projectModal = document.getElementById('project-modal');
  const closeProjectBtn = document.getElementById('close-project-modal');
  const projectTitle = document.getElementById('project-modal-title');
  const projectDesc = document.getElementById('project-modal-desc');
  const projectLink = document.getElementById('project-modal-link');

  function openProject(title, desc, link) {
    if (!projectModal) return;
    projectModal.style.display = 'flex';
    projectModal.classList.add('open');
    projectModal.setAttribute('aria-hidden', 'false');

    if (projectTitle) projectTitle.textContent = title || 'Project';
    if (projectDesc) projectDesc.textContent = desc || '';

    if (projectLink && link) {
      projectLink.href = link;
      projectLink.style.display = 'inline-block';
    }

    setTimeout(() => {
      if (closeProjectBtn) closeProjectBtn.focus();
    }, 40);
  }

  function closeProject() {
    if (!projectModal) return;
    projectModal.style.display = 'none';
    projectModal.classList.remove('open');
    projectModal.setAttribute('aria-hidden', 'true');
  }

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const title = card.dataset.title || card.querySelector('.meta-title')?.textContent;
      const desc = card.dataset.desc || '';
      const link = card.dataset.link || '';
      openProject(title, desc, link);
    });

    card.addEventListener('keyup', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const title = card.dataset.title || card.querySelector('.meta-title')?.textContent;
        const desc = card.dataset.desc || '';
        const link = card.dataset.link || '';
        openProject(title, desc, link);
      }
    });
  });

  if (closeProjectBtn) closeProjectBtn.addEventListener('click', closeProject);
  projectModal?.addEventListener('click', (e) => {
    if (e.target === projectModal) closeProject();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && projectModal?.classList.contains('open')) closeProject();
  });
})();

// ================================
// Robust "Show more" toggle for portfolio
// ================================
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggle-projects');
  const moreGrid = document.getElementById('portfolio-more') || document.querySelector('.more-grid');

  if (!toggleBtn) {
    console.warn('Portfolio toggle button (#toggle-projects) not found.');
    return;
  }
  if (!moreGrid) {
    console.warn('Hidden projects grid (id="portfolio-more" or class="more-grid") not found.');
    return;
  }

  moreGrid.style.display = 'none';
  moreGrid.setAttribute('aria-hidden', 'true');
  toggleBtn.setAttribute('aria-expanded', 'false');
  toggleBtn.textContent = 'Show more';

  function toggleMore() {
    const currentlyHidden = window.getComputedStyle(moreGrid).display === 'none';
    if (currentlyHidden) {
      moreGrid.style.display = 'grid';
      moreGrid.setAttribute('aria-hidden', 'false');
      toggleBtn.setAttribute('aria-expanded', 'true');
      toggleBtn.textContent = 'Show less';
      const first = moreGrid.querySelector('.portfolio-card');
      if (first) first.focus();
    } else {
      moreGrid.style.display = 'none';
      moreGrid.setAttribute('aria-hidden', 'true');
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.textContent = 'Show more';
      toggleBtn.focus();
    }
  }

  toggleBtn.addEventListener('click', toggleMore);
  toggleBtn.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' || e.key === ' ') toggleMore();
  });
});
// Simple fun-zone helper: keyboard activation + optional leaderboard preview
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('fun-zone script running');
    const card = document.getElementById('typing-challenge');
    const topScoreEl = document.getElementById('fun-top-score');

    if (!card) {
      console.info('typing-challenge card not found');
      return;
    }

    // keyboard support: Enter / Space opens the anchor
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (card.tagName.toLowerCase() === 'a' && card.href) {
          const target = card.getAttribute('target');
          if (target === '_blank') window.open(card.href, '_blank', 'noopener,noreferrer');
          else window.location.href = card.href;
        } else {
          card.click();
        }
      }
    });

    // Optional: fetch top score preview (silent fail if no endpoint)
    (async function () {
      try {
        const res = await fetch('/typing/leaderboard.json', { cache: 'no-cache' });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.top && topScoreEl) {
          topScoreEl.textContent = `${data.top.name} — ${data.top.wpm} WPM`;
          document.getElementById('fun-leaderboard')?.setAttribute('aria-hidden', 'false');
        }
      } catch (err) {
        // no backend → ignore
      }
    })();
  });
})();
