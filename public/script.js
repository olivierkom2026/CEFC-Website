/* ==========================================
   CEFC SARL — SCRIPT CINÉMATOGRAPHIQUE INTERACTIF
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Navbar Scroll Effect (Floating Island Morphing) ---------- */
  const navbar = document.getElementById('navbar');
  const onScroll = () => {
    if (navbar) {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile Navigation Drawer ---------- */
  const toggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');
  const navCta = document.querySelector('.floating-island .nav-cta');

  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      navLinks.classList.toggle('open');
      if (navCta) navCta.classList.toggle('open');
    });

    // Close mobile menu on click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('active');
        navLinks.classList.remove('open');
        if (navCta) navCta.classList.remove('open');
      });
    });
  }

  /* ---------- Smooth Anchor Scrolling ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  /* ---------- Stats Counters Animation ---------- */
  const counters = document.querySelectorAll('.stat-num');
  let countersDone = false;

  function animateCounters() {
    if (countersDone) return;
    counters.forEach(counter => {
      const target = +counter.dataset.target;
      const duration = 2000; // 2 seconds
      const steps = 60;
      const stepValue = target / steps;
      let current = 0;
      let stepCount = 0;

      const timer = setInterval(() => {
        current += stepValue;
        stepCount++;
        if (stepCount >= steps) {
          counter.textContent = target;
          clearInterval(timer);
        } else {
          counter.textContent = Math.floor(current);
        }
      }, duration / steps);
    });
    countersDone = true;
  }

  /* ---------- Scroll Reveal Observer ---------- */
  const revealElements = document.querySelectorAll('[data-aos]');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const siblings = Array.from(entry.target.parentElement.children);
        const index = siblings.indexOf(entry.target);
        
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, index * 100);
        
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  revealElements.forEach(el => revealObserver.observe(el));

  /* ---------- Trigger Stats Counter on Scroll ---------- */
  const statsSection = document.getElementById('stats');
  if (statsSection) {
    const statsObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        animateCounters();
        statsObserver.unobserve(statsSection);
      }
    }, { threshold: 0.2 });
    statsObserver.observe(statsSection);
  }



  /* ---------- Contact & Devis Form Submission (Back-end) ---------- */
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const btn = contactForm.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi de la demande...';
      btn.disabled = true;

      const devisData = {
        name: document.getElementById('fname').value,
        phone: document.getElementById('fphone').value,
        email: document.getElementById('femail').value || '',
        company: document.getElementById('fcompany').value || '',
        service: document.getElementById('fservice').value,
        message: document.getElementById('fmsg').value || ''
      };

      fetch('/api/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(devisData)
      })
      .then(res => {
        if (!res.ok) throw new Error("Erreur serveur");
        return res.json();
      })
      .then(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> Demande Envoyée !';
        btn.style.background = '#22c55e';
        btn.style.borderColor = '#22c55e';
        if (formSuccess) formSuccess.classList.remove('hidden');
        contactForm.reset();

        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.background = '';
          btn.style.borderColor = '';
          btn.disabled = false;
          if (formSuccess) formSuccess.classList.add('hidden');
        }, 4000);
      })
      .catch(err => {
        console.warn("Erreur API, sauvegarde locale temporaire :", err);
        devisData.id = Date.now();
        devisData.date = new Date().toLocaleString('fr-FR');
        const devisList = JSON.parse(localStorage.getItem('cefc_devis') || '[]');
        devisList.push(devisData);
        localStorage.setItem('cefc_devis', JSON.stringify(devisList));

        btn.innerHTML = '<i class="fas fa-check"></i> Envoyé (Hors ligne) !';
        btn.style.background = '#eab308';
        btn.style.borderColor = '#eab308';
        if (formSuccess) formSuccess.classList.remove('hidden');
        contactForm.reset();

        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.background = '';
          btn.style.borderColor = '';
          btn.disabled = false;
          if (formSuccess) formSuccess.classList.add('hidden');
        }, 4000);
      });
    });
  }

  /* ---------- Rendez-vous Modal Controllers ---------- */
  const rdvOverlay = document.getElementById('rdvOverlay');
  const rdvClose = document.getElementById('rdvClose');
  const rdvForm = document.getElementById('rdvForm');
  const rdvSuccess = document.getElementById('rdvSuccess');
  const openRdvBtns = document.querySelectorAll('.open-rdv-btn');

  // Open modal handler
  openRdvBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (rdvOverlay) {
        rdvOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        const dateInput = document.getElementById('rdvDate');
        if (dateInput) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const yyyy = tomorrow.getFullYear();
          const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
          const dd = String(tomorrow.getDate()).padStart(2, '0');
          dateInput.value = `${yyyy}-${mm}-${dd}`;
          dateInput.min = `${yyyy}-${mm}-${dd}`;
        }
      }
    });
  });

  const closeModal = () => {
    if (rdvOverlay) {
      rdvOverlay.classList.remove('active');
      document.body.style.overflow = '';
      if (rdvSuccess) rdvSuccess.classList.add('hidden');
    }
  };

  if (rdvClose) rdvClose.addEventListener('click', closeModal);

  if (rdvOverlay) {
    rdvOverlay.addEventListener('click', (e) => {
      if (e.target === rdvOverlay) closeModal();
    });
  }

  // Appointment Form Submission
  if (rdvForm) {
    rdvForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const btn = rdvForm.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement du créneau...';
      btn.disabled = true;

      const rdvData = {
        name: document.getElementById('rdvName').value,
        phone: document.getElementById('rdvPhone').value,
        email: document.getElementById('rdvEmail').value || '',
        company: document.getElementById('rdvCompany').value || '',
        service: document.getElementById('rdvService').value,
        date: document.getElementById('rdvDate').value,
        time: document.getElementById('rdvTime').value,
        mode: document.querySelector('input[name="rdvMode"]:checked').value,
        notes: document.getElementById('rdvNotes').value || ''
      };

      fetch('/api/rdv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rdvData)
      })
      .then(res => {
        if (!res.ok) throw new Error("Erreur serveur");
        return res.json();
      })
      .then(() => {
        btn.innerHTML = '<i class="fas fa-calendar-check"></i> Rendez-vous Confirmé !';
        btn.style.background = '#22c55e';
        btn.style.borderColor = '#22c55e';
        if (rdvSuccess) rdvSuccess.classList.remove('hidden');

        setTimeout(() => {
          closeModal();
          rdvForm.reset();
          btn.innerHTML = originalText;
          btn.style.background = '';
          btn.style.borderColor = '';
          btn.disabled = false;
        }, 2500);
      })
      .catch(err => {
        console.warn("Erreur API rdv, sauvegarde locale temporaire :", err);
        rdvData.id = Date.now();
        rdvData.timestamp = new Date().toLocaleString('fr-FR');
        const rdvList = JSON.parse(localStorage.getItem('cefc_rdvs') || '[]');
        rdvList.push(rdvData);
        localStorage.setItem('cefc_rdvs', JSON.stringify(rdvList));

        btn.innerHTML = '<i class="fas fa-calendar-check"></i> Confirmé (Hors ligne) !';
        btn.style.background = '#eab308';
        btn.style.borderColor = '#eab308';
        if (rdvSuccess) rdvSuccess.classList.remove('hidden');

        setTimeout(() => {
          closeModal();
          rdvForm.reset();
          btn.innerHTML = originalText;
          btn.style.background = '';
          btn.style.borderColor = '';
          btn.disabled = false;
        }, 2500);
      });
    });
  }

  /* ---------- Devis Modal Controllers ---------- */
  const devisOverlay = document.getElementById('devisOverlay');
  const devisClose = document.getElementById('devisClose');
  const devisForm = document.getElementById('devisForm');
  const devisSuccess = document.getElementById('devisSuccess');
  const openDevisBtns = document.querySelectorAll('.open-devis-btn');

  openDevisBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (devisOverlay) {
        devisOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  const closeDevisModal = () => {
    if (devisOverlay) {
      devisOverlay.classList.remove('active');
      document.body.style.overflow = '';
      if (devisSuccess) devisSuccess.classList.add('hidden');
    }
  };

  if (devisClose) devisClose.addEventListener('click', closeDevisModal);

  if (devisOverlay) {
    devisOverlay.addEventListener('click', (e) => {
      if (e.target === devisOverlay) closeDevisModal();
    });
  }

  // Devis Form Submission
  if (devisForm) {
    devisForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const btn = devisForm.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi de la demande...';
      btn.disabled = true;

      const devisData = {
        name: document.getElementById('devisName').value,
        phone: document.getElementById('devisPhone').value,
        email: document.getElementById('devisEmail').value || '',
        company: document.getElementById('devisCompany').value || '',
        service: document.getElementById('devisService').value,
        message: document.getElementById('devisMsg').value || ''
      };

      fetch('/api/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(devisData)
      })
      .then(res => {
        if (!res.ok) throw new Error("Erreur serveur");
        return res.json();
      })
      .then(() => {
        btn.innerHTML = '<i class="fas fa-check-circle"></i> Demande Envoyée !';
        btn.style.background = '#22c55e';
        btn.style.borderColor = '#22c55e';
        if (devisSuccess) devisSuccess.classList.remove('hidden');

        setTimeout(() => {
          closeDevisModal();
          devisForm.reset();
          btn.innerHTML = originalText;
          btn.style.background = '';
          btn.style.borderColor = '';
          btn.disabled = false;
        }, 2500);
      })
      .catch(err => {
        console.warn("Erreur API devis, sauvegarde locale :", err);
        devisData.id = Date.now();
        devisData.timestamp = new Date().toLocaleString('fr-FR');
        const devisList = JSON.parse(localStorage.getItem('cefc_devis') || '[]');
        devisList.push(devisData);
        localStorage.setItem('cefc_devis', JSON.stringify(devisList));

        btn.innerHTML = '<i class="fas fa-check-circle"></i> Envoyée (Hors ligne) !';
        btn.style.background = '#eab308';
        btn.style.borderColor = '#eab308';
        if (devisSuccess) devisSuccess.classList.remove('hidden');

        setTimeout(() => {
          closeDevisModal();
          devisForm.reset();
          btn.innerHTML = originalText;
          btn.style.background = '';
          btn.style.borderColor = '';
          btn.disabled = false;
        }, 2500);
      });
    });
  }

  /* ---------- Admin Dashboard Controllers (Accès sécurisé API + Local fallback) ---------- */
  const adminOverlay = document.getElementById('adminOverlay');
  const adminClose = document.getElementById('adminClose');
  const tabBtnRdv = document.getElementById('tabBtnRdv');
  const tabBtnDevis = document.getElementById('tabBtnDevis');
  const tabRdvContent = document.getElementById('tab-rdv-content');
  const tabDevisContent = document.getElementById('tab-devis-content');
  const adminRdvList = document.getElementById('admin-rdv-list');
  const adminDevisList = document.getElementById('admin-devis-list');
  const countRdv = document.getElementById('count-rdv');
  const countDevis = document.getElementById('count-devis');
  const btnExportCsv = document.getElementById('btnExportCsv');
  const btnClearData = document.getElementById('btnClearData');

  /* ---------- Admin Auth Components ---------- */
  const adminLoginOverlay = document.getElementById('adminLoginOverlay');
  const adminLoginClose = document.getElementById('adminLoginClose');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminLoginError = document.getElementById('adminLoginError');
  const adminPasswordInput = document.getElementById('adminPassword');

  let currentLoadedData = { appointments: [], quotes: [] };

  function getAdminToken() {
    return sessionStorage.getItem('cefc_admin_token');
  }

  function setAdminToken(token) {
    sessionStorage.setItem('cefc_admin_token', token);
  }

  function clearAdminToken() {
    sessionStorage.removeItem('cefc_admin_token');
  }

  // Load and render data in the dashboard
  function loadAndRenderAdminData() {
    const token = getAdminToken();
    if (!token) {
      if (adminOverlay) adminOverlay.classList.remove('active');
      if (adminLoginOverlay) {
        if (adminLoginError) adminLoginError.classList.add('hidden');
        if (adminPasswordInput) adminPasswordInput.value = '';
        adminLoginOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
      return;
    }

    fetch('/api/admin/data', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (res.status === 401 || res.status === 403) {
        clearAdminToken();
        throw new Error("Session expirée");
      }
      if (!res.ok) throw new Error("Erreur serveur");
      return res.json();
    })
    .then(data => {
      currentLoadedData = data;
      renderTables(data.appointments, data.quotes);
    })
    .catch(err => {
      console.warn("Impossible de charger les données du serveur, chargement local (fallback) :", err);
      if (err.message === "Session expirée") {
        alert("Votre session a expiré. Veuillez vous reconnecter.");
        loadAndRenderAdminData();
        return;
      }
      const localRdvs = JSON.parse(localStorage.getItem('cefc_rdvs') || '[]');
      const localDevis = JSON.parse(localStorage.getItem('cefc_devis') || '[]');
      currentLoadedData = { appointments: localRdvs, quotes: localDevis };
      renderTables(localRdvs, localDevis);
    });
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderTables(rdvs, devis) {
    if (countRdv) countRdv.textContent = rdvs.length;
    if (countDevis) countDevis.textContent = devis.length;

    // Render RDVs
    if (adminRdvList) {
      if (rdvs.length === 0) {
        adminRdvList.innerHTML = `
          <tr>
            <td colspan="7" class="admin-empty-state">
              <i class="fas fa-calendar-xmark"></i>
              Aucun rendez-vous enregistré pour le moment.
            </td>
          </tr>
        `;
      } else {
        adminRdvList.innerHTML = rdvs.map(item => {
          let badgeClass = 'admin-badge-cabinet';
          let badgeText = 'Au cabinet';
          if (item.mode === 'visio') { badgeClass = 'admin-badge-visio'; badgeText = 'Visioconférence'; }
          if (item.mode === 'phone') { badgeClass = 'admin-badge-phone'; badgeText = 'Téléphone'; }

          return `
            <tr data-id="${item.id}">
              <td><strong>${escapeHTML(item.name)}</strong><br><span style="font-size:0.75rem; color:var(--gray-500);">${escapeHTML(item.company)}</span></td>
              <td>${escapeHTML(item.phone)}<br><span style="font-size:0.75rem; color:var(--gray-500);">${escapeHTML(item.email)}</span></td>
              <td><span style="font-weight:600; color:var(--primary-skyblue);">${escapeHTML(item.service)}</span></td>
              <td><i class="far fa-calendar"></i> ${escapeHTML(item.date)}<br><i class="far fa-clock"></i> ${escapeHTML(item.time)}</td>
              <td><span class="admin-badge ${badgeClass}">${badgeText}</span></td>
              <td style="max-width:150px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHTML(item.notes)}">${escapeHTML(item.notes || '')}</td>
              <td><button class="admin-btn-delete delete-rdv-btn" data-id="${item.id}"><i class="fas fa-trash-can"></i></button></td>
            </tr>
          `;
        }).join('');

        // Attach delete events
        adminRdvList.querySelectorAll('.delete-rdv-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            if (confirm('Voulez-vous supprimer ce rendez-vous ?')) {
              deleteRdv(id);
            }
          });
        });
      }
    }

    // Render Devis
    if (adminDevisList) {
      if (devis.length === 0) {
        adminDevisList.innerHTML = `
          <tr>
            <td colspan="5" class="admin-empty-state">
              <i class="fas fa-envelope-open-text"></i>
              Aucune demande de devis reçue pour le moment.
            </td>
          </tr>
        `;
      } else {
        adminDevisList.innerHTML = devis.map(item => {
          const msgText = item.message || item.msg || 'Aucun message';
          return `
            <tr data-id="${item.id}">
              <td><strong>${escapeHTML(item.name)}</strong><br><span style="font-size:0.75rem; color:var(--gray-500);">${escapeHTML(item.company)}</span></td>
              <td>${escapeHTML(item.phone)}<br><span style="font-size:0.75rem; color:var(--gray-500);">${escapeHTML(item.email)}</span></td>
              <td><span style="font-weight:600; color:var(--primary-skyblue);">${escapeHTML(item.service)}</span></td>
              <td style="max-width:200px; word-break:break-word;">${escapeHTML(msgText)}</td>
              <td><button class="admin-btn-delete delete-devis-btn" data-id="${item.id}"><i class="fas fa-trash-can"></i></button></td>
            </tr>
          `;
        }).join('');

        // Attach delete events
        adminDevisList.querySelectorAll('.delete-devis-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            if (confirm('Voulez-vous supprimer cette demande ?')) {
              deleteDevis(id);
            }
          });
        });
      }
    }
  }

  function deleteRdv(id) {
    const token = getAdminToken();
    if (!token) {
      let list = JSON.parse(localStorage.getItem('cefc_rdvs') || '[]');
      list = list.filter(item => item.id != id);
      localStorage.setItem('cefc_rdvs', JSON.stringify(list));
      loadAndRenderAdminData();
      return;
    }

    fetch(`/api/admin/rdv/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (res.status === 401 || res.status === 403) {
        clearAdminToken();
        throw new Error("Session expirée");
      }
      if (!res.ok) throw new Error("Erreur suppression");
      return res.json();
    })
    .then(() => {
      loadAndRenderAdminData();
    })
    .catch(err => {
      console.warn("Échec de la suppression sur le serveur, suppression locale :", err);
      let list = JSON.parse(localStorage.getItem('cefc_rdvs') || '[]');
      list = list.filter(item => item.id != id);
      localStorage.setItem('cefc_rdvs', JSON.stringify(list));
      loadAndRenderAdminData();
    });
  }

  function deleteDevis(id) {
    const token = getAdminToken();
    if (!token) {
      let list = JSON.parse(localStorage.getItem('cefc_devis') || '[]');
      list = list.filter(item => item.id != id);
      localStorage.setItem('cefc_devis', JSON.stringify(list));
      loadAndRenderAdminData();
      return;
    }

    fetch(`/api/admin/devis/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (res.status === 401 || res.status === 403) {
        clearAdminToken();
        throw new Error("Session expirée");
      }
      if (!res.ok) throw new Error("Erreur suppression");
      return res.json();
    })
    .then(() => {
      loadAndRenderAdminData();
    })
    .catch(err => {
      console.warn("Échec de la suppression sur le serveur, suppression locale :", err);
      let list = JSON.parse(localStorage.getItem('cefc_devis') || '[]');
      list = list.filter(item => item.id != id);
      localStorage.setItem('cefc_devis', JSON.stringify(list));
      loadAndRenderAdminData();
    });
  }

  // Open Admin Login modal via SECRET keyboard shortcut: Ctrl + Shift + A
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      
      const token = getAdminToken();
      if (token) {
        if (adminOverlay) {
          loadAndRenderAdminData();
          adminOverlay.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      } else {
        if (adminLoginOverlay) {
          if (adminLoginError) adminLoginError.classList.add('hidden');
          if (adminPasswordInput) adminPasswordInput.value = '';
          adminLoginOverlay.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      }
    }
  });

  // Admin login form submit
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const password = adminPasswordInput.value;
      const btn = adminLoginForm.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
      btn.disabled = true;
      if (adminLoginError) adminLoginError.classList.add('hidden');

      fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      .then(res => {
        if (!res.ok) {
          return res.json().then(data => { throw new Error(data.error || "Mot de passe incorrect.") });
        }
        return res.json();
      })
      .then(data => {
        setAdminToken(data.token);
        btn.innerHTML = originalText;
        btn.disabled = false;
        
        if (adminLoginOverlay) adminLoginOverlay.classList.remove('active');
        if (adminOverlay) {
          loadAndRenderAdminData();
          adminOverlay.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      })
      .catch(err => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        if (adminLoginError) {
          adminLoginError.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${err.message}`;
          adminLoginError.classList.remove('hidden');
        }
      });
    });
  }

  // Close Login modal
  if (adminLoginClose) {
    adminLoginClose.addEventListener('click', () => {
      if (adminLoginOverlay) {
        adminLoginOverlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  if (adminLoginOverlay) {
    adminLoginOverlay.addEventListener('click', (e) => {
      if (e.target === adminLoginOverlay) {
        adminLoginOverlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // Close Admin Dashboard modal
  if (adminClose) {
    adminClose.addEventListener('click', () => {
      if (adminOverlay) {
        adminOverlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  if (adminOverlay) {
    adminOverlay.addEventListener('click', (e) => {
      if (e.target === adminOverlay) {
        adminOverlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // Tab switching
  if (tabBtnRdv && tabBtnDevis) {
    tabBtnRdv.addEventListener('click', () => {
      tabBtnRdv.classList.add('active');
      tabBtnDevis.classList.remove('active');
      if (tabRdvContent) tabRdvContent.classList.remove('hidden');
      if (tabDevisContent) tabDevisContent.classList.add('hidden');
    });

    tabBtnDevis.addEventListener('click', () => {
      tabBtnDevis.classList.add('active');
      tabBtnRdv.classList.remove('active');
      if (tabDevisContent) tabDevisContent.classList.remove('hidden');
      if (tabRdvContent) tabRdvContent.classList.add('hidden');
    });
  }

  // Export as CSV
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', () => {
      const isRdvTab = tabBtnRdv.classList.contains('active');
      let csvContent = "\uFEFF";
      
      if (isRdvTab) {
        const rdvs = currentLoadedData.appointments || [];
        if (rdvs.length === 0) { alert('Aucun rendez-vous à exporter.'); return; }
        
        csvContent += "Nom,Téléphone,Email,Entreprise,Objet,Date,Heure,Mode,Notes\n";
        rdvs.forEach(r => {
          csvContent += `"${r.name}","${r.phone}","${r.email}","${r.company}","${r.service}","${r.date}","${r.time}","${r.mode}","${r.notes || ''}"\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "rendez_vous_cefc.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const devis = currentLoadedData.quotes || [];
        if (devis.length === 0) { alert('Aucune demande de devis à exporter.'); return; }
        
        csvContent += "Nom,Téléphone,Email,Entreprise,Service,Message,Date\n";
        devis.forEach(d => {
          const msgText = d.message || d.msg || 'Aucun message';
          const dateText = d.timestamp || d.date || '';
          csvContent += `"${d.name}","${d.phone}","${d.email}","${d.company}","${d.service}","${msgText}","${dateText}"\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "demandes_devis_cefc.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  }

  // Clear all data
  if (btnClearData) {
    btnClearData.addEventListener('click', () => {
      if (confirm('Êtes-vous sûr de vouloir vider toutes les données de la base ? Cette action est irréversible.')) {
        const token = getAdminToken();
        if (!token) {
          localStorage.removeItem('cefc_rdvs');
          localStorage.removeItem('cefc_devis');
          loadAndRenderAdminData();
          return;
        }

        fetch('/api/admin/clear-all', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => {
          if (res.status === 401 || res.status === 403) {
            clearAdminToken();
            throw new Error("Session expirée");
          }
          return res.json();
        })
        .then(() => {
          localStorage.removeItem('cefc_rdvs');
          localStorage.removeItem('cefc_devis');
          loadAndRenderAdminData();
        })
        .catch(err => {
          console.warn("Échec nettoyage serveur, nettoyage local :", err);
          localStorage.removeItem('cefc_rdvs');
          localStorage.removeItem('cefc_devis');
          loadAndRenderAdminData();
        });
      }
    });
  }

  /* ---------- Highlight active link on Scroll ---------- */
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 150;
      if (window.scrollY >= top) {
        current = section.getAttribute('id');
      }
    });
    navItems.forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('href') === '#' + current) {
        item.classList.add('active');
      }
    });
  }, { passive: true });

  /* ---------- FAQ Accordion ---------- */
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    if (trigger) {
      trigger.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        faqItems.forEach(otherItem => {
          otherItem.classList.remove('active');
        });
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });

});
