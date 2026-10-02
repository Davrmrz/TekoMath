/* ============================================
   TEKO Math — Dashboard Script
   Navigation, mobile menu, user dropdown
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---- Mobile Hamburger Menu ----
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (hamburgerBtn && mobileMenu) {
    hamburgerBtn.addEventListener('click', () => {
      hamburgerBtn.classList.toggle('topnav__hamburger--open');
      mobileMenu.classList.toggle('topnav__mobile-menu--open');
    });
  }

  // ---- User Dropdown ----
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userDropdown = document.getElementById('user-dropdown');

  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('topnav__user-dropdown--open');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!userDropdown.contains(e.target) && e.target !== userMenuBtn) {
        userDropdown.classList.remove('topnav__user-dropdown--open');
      }
    });
  }

  // ---- Dashboard Arcade Preview Navigation ----
  const arcadeIframe = document.getElementById('dashboard-arcade-iframe');
  const arcadeTabs = document.querySelectorAll('.tekoarcade-preview-tab-btn[data-route]');
  const arcadeGamePills = document.querySelectorAll('.tekoarcade-game-pill[data-game-route]');

  if (arcadeIframe) {
    const navigateArcade = (route) => {
      try {
        const url = new URL(arcadeIframe.src, window.location.href);
        url.hash = route;
        arcadeIframe.src = url.toString();
      } catch (e) {
        arcadeIframe.src = `TEKOARCADE/JUEGOS/dist/index.html${route}`;
      }
    };

    arcadeTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        arcadeTabs.forEach(t => t.classList.remove('tekoarcade-preview-tab-btn--active'));
        btn.classList.add('tekoarcade-preview-tab-btn--active');
        const route = btn.getAttribute('data-route');
        if (route) navigateArcade(route);
      });
    });

    arcadeGamePills.forEach(pill => {
      pill.addEventListener('click', () => {
        const route = pill.getAttribute('data-game-route');
        if (route) {
          navigateArcade(route);
          arcadeTabs.forEach(t => t.classList.remove('tekoarcade-preview-tab-btn--active'));
        }
      });
    });
  }

});

