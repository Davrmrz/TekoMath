/* ============================================
   TEKO Math — Auth Script (Login & Registro)
   Role selector toggle + form handling (PHP)
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const roleSelector = document.getElementById('role-selector');
  const studentBtn   = document.getElementById('role-student');
  const teacherBtn   = document.getElementById('role-teacher');
  const rolInput     = document.getElementById('rol-input');
  
  // Submit buttons
  const loginBtn    = document.getElementById('login-btn');
  const registroBtn = document.getElementById('registro-btn');
  const activeBtn   = loginBtn || registroBtn;

  // Switch links
  const regSwitchLink   = document.getElementById('register-switch-link');
  const loginSwitchLink = document.getElementById('login-switch-link');
  const activeSwitchLink = regSwitchLink || loginSwitchLink;

  // Forms
  const loginForm    = document.getElementById('login-form');
  const registroForm = document.getElementById('registro-form');

  // Inputs
  const formInputs = document.querySelectorAll('.form-input');

  // ---- Role Selector Toggle ----
  function setRole(role) {
    if (!roleSelector || !studentBtn || !teacherBtn) return;
    
    const isStudent = role === 'student';
    roleSelector.dataset.active = role;

    // Update hidden input for form POST
    if (rolInput) {
      rolInput.value = isStudent ? 'estudiante' : 'docente';
    }

    // Update active states
    studentBtn.classList.toggle('role-selector__option--active', isStudent);
    teacherBtn.classList.toggle('role-selector__option--active', !isStudent);

    // Update ARIA
    studentBtn.setAttribute('aria-checked', isStudent);
    teacherBtn.setAttribute('aria-checked', !isStudent);
    studentBtn.tabIndex = isStudent ? 0 : -1;
    teacherBtn.tabIndex = !isStudent ? 0 : -1;

    // Toggle button and input colors
    if (activeBtn) {
      activeBtn.classList.toggle('btn--purple', !isStudent);
    }

    if (activeSwitchLink) {
      activeSwitchLink.classList.toggle('purple-link', !isStudent);
    }

    formInputs.forEach(input => {
      input.classList.toggle('purple-focus', !isStudent);
    });
  }

  if (studentBtn && teacherBtn) {
    studentBtn.addEventListener('click', () => setRole('student'));
    teacherBtn.addEventListener('click', () => setRole('teacher'));
  }

  // Keyboard navigation for role selector
  if (roleSelector) {
    roleSelector.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const current = roleSelector.dataset.active;
        const next = current === 'student' ? 'teacher' : 'student';
        setRole(next);
        const targetBtn = document.getElementById(`role-${next}`);
        if (targetBtn) targetBtn.focus();
      }
    });
  }

  // ---- Login Form Submit ----
  if (loginForm && loginBtn) {
    loginForm.addEventListener('submit', (e) => {
      const email = document.getElementById('email')?.value.trim();
      const password = document.getElementById('password')?.value.trim();

      if (!email || !password) {
        e.preventDefault();
        return;
      }

      loginBtn.innerHTML = `
        <span style="display:inline-flex;align-items:center;gap:8px;">
          ⏳ Verificando...
        </span>
      `;
      loginBtn.style.pointerEvents = 'none';
    });
  }

  // ---- Registration Form Submit ----
  if (registroForm && registroBtn) {
    registroForm.addEventListener('submit', (e) => {
      const nombre = document.getElementById('nombre')?.value.trim();
      const email = document.getElementById('email')?.value.trim();
      const pass = document.getElementById('password')?.value;
      const passConf = document.getElementById('password_confirm')?.value;

      if (!nombre || !email || !pass || !passConf) {
        e.preventDefault();
        return;
      }

      if (pass !== passConf) {
        e.preventDefault();
        alert('Las contraseñas no coinciden. Por favor verifícalas.');
        return;
      }

      registroBtn.innerHTML = `
        <span style="display:inline-flex;align-items:center;gap:8px;">
          🚀 Creando tu cuenta...
        </span>
      `;
      registroBtn.style.pointerEvents = 'none';
    });
  }

  // ---- Input focus micro-interactions ----
  formInputs.forEach(input => {
    input.addEventListener('focus', () => {
      const group = input.closest('.form-group');
      if (group) {
        group.style.transform = 'translateY(-1px)';
        group.style.transition = `transform var(--duration) ease`;
      }
    });
    input.addEventListener('blur', () => {
      const group = input.closest('.form-group');
      if (group) {
        group.style.transform = 'translateY(0)';
      }
    });
  });
});
