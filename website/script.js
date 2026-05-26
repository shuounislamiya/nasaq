/* ============================================================
   نَسَق — Landing Page Interactions
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  setupReveal();
  setupCountUp();
  setupDemo();
  setupMobileNav();
});

/* ============================================================
   Mobile nav toggle (hamburger)
   ============================================================ */

function setupMobileNav() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (!toggle || !links) return;

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = links.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  // اغلق القائمة عند الضغط على رابط
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  // اغلق عند الضغط خارج القائمة
  document.addEventListener('click', (e) => {
    if (!links.contains(e.target) && !toggle.contains(e.target)) {
      links.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  // اغلق عند Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && links.classList.contains('is-open')) {
      links.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });
}

/* ============================================================
   Reveal on scroll (IntersectionObserver)
   ============================================================ */

function setupReveal() {
  const targets = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.revealDelay || '0', 10);
        setTimeout(() => {
          entry.target.classList.add('in-view');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -50px 0px'
  });

  targets.forEach(el => observer.observe(el));
}

/* ============================================================
   Count-up animation للأرقام في الـ Hero stats
   ============================================================ */

function setupCountUp() {
  const stats = document.querySelectorAll('.stat-num[data-count]');
  if (!stats.length) return;

  if (!('IntersectionObserver' in window)) {
    stats.forEach(el => {
      el.textContent = el.dataset.count + (el.dataset.suffix || '');
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateNumber(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(el => observer.observe(el));
}

function animateNumber(el) {
  const target = parseInt(el.dataset.count, 10) || 0;
  const suffix = el.dataset.suffix || '';
  const duration = 1500;
  const start = performance.now();

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // easeOutCubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);
    el.textContent = value + suffix;
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = target + suffix;
  }
  requestAnimationFrame(tick);
}

/* ============================================================
   Live Demo — تجربة الخط والاتجاه والحجم
   ============================================================ */

function setupDemo() {
  const demoText = document.getElementById('demoText');
  const sizeRange = document.getElementById('demoSize');
  const sizeVal = document.getElementById('demoSizeVal');
  if (!demoText) return;

  // أزرار الخط
  document.querySelectorAll('[data-font]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-font]').forEach(b => b.classList.remove('demo-btn-active'));
      btn.classList.add('demo-btn-active');
      demoText.style.fontFamily = `"${btn.dataset.font}"`;
    });
  });

  // أزرار الاتجاه
  document.querySelectorAll('[data-dir]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-dir]').forEach(b => b.classList.remove('demo-btn-active'));
      btn.classList.add('demo-btn-active');
      const dir = btn.dataset.dir;
      demoText.dir = dir;
      if (dir === 'ltr') {
        demoText.innerHTML = 'In the name of Allah<br>The Most Gracious, The Most Merciful<br><span style="font-size: 0.7em; opacity: 0.7;">Try changing font, size, and direction</span>';
      } else {
        demoText.innerHTML = 'بسم الله الرحمن الرحيم<br>﴿إِنَّ مَعَ الْعُسْرِ يُسْرًا﴾<br><span style="font-size: 0.7em; opacity: 0.7;">جرّب تغيير الخط والحجم والاتجاه</span>';
      }
    });
  });

  // حجم النص
  if (sizeRange && sizeVal) {
    sizeRange.addEventListener('input', () => {
      const v = sizeRange.value;
      demoText.style.fontSize = `${v}px`;
      sizeVal.textContent = `${v}px`;
    });
  }
}

/* ============================================================
   Smooth scroll للروابط الداخلية (احتياط إن لم يدعم المتصفح scroll-behavior)
   ============================================================ */

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href === '#' || href === '#top') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      const navHeight = 70;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

/* ============================================================
   Parallax خفيف لشاشة الـ mockup مع الماوس
   ============================================================ */

const heroMockup = document.querySelector('.hero-mockup');
const mockupWindow = document.querySelector('.mockup-window');
if (heroMockup && mockupWindow && window.matchMedia('(min-width: 968px)').matches) {
  heroMockup.addEventListener('mousemove', (e) => {
    const rect = heroMockup.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mockupWindow.style.transform = `rotateY(${-6 + x * 6}deg) rotateX(${2 - y * 6}deg) translateZ(0)`;
  });
  heroMockup.addEventListener('mouseleave', () => {
    mockupWindow.style.transform = '';
  });
}
