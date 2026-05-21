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



  /* ---------- Contact & Devis Form Simulation ---------- */
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const btn = contactForm.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi de la demande...';
      btn.disabled = true;

      // Récupérer et sauvegarder le devis en local
      const devisData = {
        id: Date.now(),
        name: document.getElementById('fname').value,
        phone: document.getElementById('fphone').value,
        email: document.getElementById('femail').value || 'Non renseigné',
        company: document.getElementById('fcompany').value || 'Non renseignée',
        service: document.getElementById('fservice').value,
        message: document.getElementById('fmsg').value || 'Aucun message',
        date: new Date().toLocaleString('fr-FR')
      };
      
      const devisList = JSON.parse(localStorage.getItem('cefc_devis') || '[]');
      devisList.push(devisData);
      localStorage.setItem('cefc_devis', JSON.stringify(devisList));

      setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> Demande Envoyée !';
        btn.style.background = '#22c55e';
        btn.style.borderColor = '#22c55e';
        if (formSuccess) {
          formSuccess.classList.remove('hidden');
        }
        contactForm.reset();

        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.background = '';
          btn.style.borderColor = '';
          btn.disabled = false;
          if (formSuccess) {
            formSuccess.classList.add('hidden');
          }
        }, 4000);
      }, 1500);
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
        document.body.style.overflow = 'hidden'; // Stop background scrolling
        
        // Pre-fill date picker to tomorrow by default
        const dateInput = document.getElementById('rdvDate');
        if (dateInput) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const yyyy = tomorrow.getFullYear();
          const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
          const dd = String(tomorrow.getDate()).padStart(2, '0');
          dateInput.value = `${yyyy}-${mm}-${dd}`;
          dateInput.min = `${yyyy}-${mm}-${dd}`; // Set minimum date to tomorrow
        }
      }
    });
  });

  // Close modal handler
  const closeModal = () => {
    if (rdvOverlay) {
      rdvOverlay.classList.remove('active');
      document.body.style.overflow = ''; // Restore background scrolling
      if (rdvSuccess) {
        rdvSuccess.classList.add('hidden');
      }
    }
  };

  if (rdvClose) {
    rdvClose.addEventListener('click', closeModal);
  }

  if (rdvOverlay) {
    rdvOverlay.addEventListener('click', (e) => {
      if (e.target === rdvOverlay) {
        closeModal();
      }
    });
  }

  // Appointment Form submission
  if (rdvForm) {
    rdvForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const btn = rdvForm.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement du créneau...';
      btn.disabled = true;

      // Récupérer et sauvegarder le rendez-vous en local
      const rdvData = {
        id: Date.now(),
        name: document.getElementById('rdvName').value,
        phone: document.getElementById('rdvPhone').value,
        email: document.getElementById('rdvEmail').value || 'Non renseigné',
        company: document.getElementById('rdvCompany').value || 'Non renseignée',
        service: document.getElementById('rdvService').value,
        date: document.getElementById('rdvDate').value,
        time: document.getElementById('rdvTime').value,
        mode: document.querySelector('input[name="rdvMode"]:checked').value,
        notes: document.getElementById('rdvNotes').value || 'Aucune note',
        timestamp: new Date().toLocaleString('fr-FR')
      };
      
      const rdvList = JSON.parse(localStorage.getItem('cefc_rdvs') || '[]');
      rdvList.push(rdvData);
      localStorage.setItem('cefc_rdvs', JSON.stringify(rdvList));

      // Simulate backend rendezvous insertion
      setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-calendar-check"></i> Rendez-vous Confirmé !';
        btn.style.background = '#22c55e';
        btn.style.borderColor = '#22c55e';
        
        if (rdvSuccess) {
          rdvSuccess.classList.remove('hidden');
        }

        setTimeout(() => {
          closeModal();
          rdvForm.reset();
          btn.innerHTML = originalText;
          btn.style.background = '';
          btn.style.borderColor = '';
          btn.disabled = false;
        }, 2500);
      }, 1500);
    });
  }

  /* ---------- Admin Dashboard Controllers (Accès secret : Ctrl+Shift+A) ---------- */
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

  // Load and render data in the dashboard
  function renderAdminData() {
    const rdvs = JSON.parse(localStorage.getItem('cefc_rdvs') || '[]');
    const devis = JSON.parse(localStorage.getItem('cefc_devis') || '[]');

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
              <td><strong>${item.name}</strong><br><span style="font-size:0.75rem; color:var(--gray-500);">${item.company}</span></td>
              <td>${item.phone}<br><span style="font-size:0.75rem; color:var(--gray-500);">${item.email}</span></td>
              <td><span style="font-weight:600; color:var(--primary-skyblue);">${item.service}</span></td>
              <td><i class="far fa-calendar"></i> ${item.date}<br><i class="far fa-clock"></i> ${item.time}</td>
              <td><span class="admin-badge ${badgeClass}">${badgeText}</span></td>
              <td style="max-width:150px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${item.notes}">${item.notes}</td>
              <td><button class="admin-btn-delete delete-rdv-btn" data-id="${item.id}"><i class="fas fa-trash-can"></i></button></td>
            </tr>
          `;
        }).join('');

        // Attach delete events
        adminRdvList.querySelectorAll('.delete-rdv-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            if (confirm('Voulez-vous supprimer ce rendez-vous ?')) {
              let list = JSON.parse(localStorage.getItem('cefc_rdvs') || '[]');
              list = list.filter(item => item.id != id);
              localStorage.setItem('cefc_rdvs', JSON.stringify(list));
              renderAdminData();
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
        adminDevisList.innerHTML = devis.map(item => `
          <tr data-id="${item.id}">
            <td><strong>${item.name}</strong><br><span style="font-size:0.75rem; color:var(--gray-500);">${item.company}</span></td>
            <td>${item.phone}<br><span style="font-size:0.75rem; color:var(--gray-500);">${item.email}</span></td>
            <td><span style="font-weight:600; color:var(--primary-skyblue);">${item.service}</span></td>
            <td style="max-width:200px; word-break:break-word;">${item.message}</td>
            <td><button class="admin-btn-delete delete-devis-btn" data-id="${item.id}"><i class="fas fa-trash-can"></i></button></td>
          </tr>
        `).join('');

        // Attach delete events
        adminDevisList.querySelectorAll('.delete-devis-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            if (confirm('Voulez-vous supprimer cette demande ?')) {
              let list = JSON.parse(localStorage.getItem('cefc_devis') || '[]');
              list = list.filter(item => item.id != id);
              localStorage.setItem('cefc_devis', JSON.stringify(list));
              renderAdminData();
            }
          });
        });
      }
    }
  }

  // Open Admin Dashboard via SECRET keyboard shortcut: Ctrl + Shift + A
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      if (adminOverlay) {
        renderAdminData();
        adminOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    }
  });

  // Close Admin modal
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
      let csvContent = "\uFEFF"; // Add BOM for Excel UTF-8 support
      
      if (isRdvTab) {
        const rdvs = JSON.parse(localStorage.getItem('cefc_rdvs') || '[]');
        if (rdvs.length === 0) { alert('Aucun rendez-vous à exporter.'); return; }
        
        csvContent += "Nom,Téléphone,Email,Entreprise,Objet,Date,Heure,Mode,Notes\n";
        rdvs.forEach(r => {
          csvContent += `"${r.name}","${r.phone}","${r.email}","${r.company}","${r.service}","${r.date}","${r.time}","${r.mode}","${r.notes}"\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "rendez_vous_cefc.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const devis = JSON.parse(localStorage.getItem('cefc_devis') || '[]');
        if (devis.length === 0) { alert('Aucune demande de devis à exporter.'); return; }
        
        csvContent += "Nom,Téléphone,Email,Entreprise,Service,Message,Date\n";
        devis.forEach(d => {
          csvContent += `"${d.name}","${d.phone}","${d.email}","${d.company}","${d.service}","${d.message}","${d.date}"\n`;
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

  // Clear all local data
  if (btnClearData) {
    btnClearData.addEventListener('click', () => {
      if (confirm('Êtes-vous sûr de vouloir vider toutes les données locales de rendez-vous et de devis ? Cette action est irréversible.')) {
        localStorage.removeItem('cefc_rdvs');
        localStorage.removeItem('cefc_devis');
        renderAdminData();
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

});
