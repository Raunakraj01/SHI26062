/**
 * POLAR-OPS — Integrated Polar Expedition Operations & Logistics Platform
 * Core Application Engine & Global UI Shell Controller (Phase 1 & Phase 2)
 */

/* ==========================================================================
   1. STORAGE INITIALIZATION & LIFECYCLE (PHASE 1 CORE)
   ========================================================================== */

/**
 * Initialize application storage by seeding default dummy data IF AND ONLY IF
 * the respective storage key is not already present in localStorage.
 *
 * Guaranteed Behavior:
 * - First load: Populates empty keys with realistic polar operational data.
 * - Refresh / subsequent loads: Preserves all existing user modifications and data.
 * - Idempotent: Safe to invoke multiple times without data duplication.
 *
 * @returns {Object} Initialization report
 */
function initializeStorage() {
  if (typeof STORAGE_KEYS === 'undefined') {
    console.error('[POLAR-OPS] Critical Error: STORAGE_KEYS is not defined. Ensure storage.js is loaded prior to app.js.');
    return { success: false, reason: 'STORAGE_KEYS missing' };
  }

  // Dataset map pairing storage key to master initial data
  const datasets = [
    { key: STORAGE_KEYS.expeditions, data: typeof dummyExpeditions !== 'undefined' ? dummyExpeditions : [] },
    { key: STORAGE_KEYS.cargo, data: typeof dummyCargo !== 'undefined' ? dummyCargo : [] },
    { key: STORAGE_KEYS.inventory, data: typeof dummyInventory !== 'undefined' ? dummyInventory : [] },
    { key: STORAGE_KEYS.assets, data: typeof dummyAssets !== 'undefined' ? dummyAssets : [] },
    { key: STORAGE_KEYS.personnel, data: typeof dummyPersonnel !== 'undefined' ? dummyPersonnel : [] },
    { key: STORAGE_KEYS.emergencies, data: typeof dummyEmergencies !== 'undefined' ? dummyEmergencies : [] },
    { key: STORAGE_KEYS.notifications, data: typeof dummyNotifications !== 'undefined' ? dummyNotifications : [] },
    { key: STORAGE_KEYS.activity, data: typeof dummyActivity !== 'undefined' ? dummyActivity : [] }
  ];

  const seededKeys = [];
  const existingKeys = [];

  datasets.forEach(({ key, data }) => {
    // Only populate when key does NOT exist in localStorage
    if (localStorage.getItem(key) === null) {
      saveData(key, data);
      seededKeys.push(key);
    } else {
      existingKeys.push(key);
    }
  });

  return {
    success: true,
    totalKeys: datasets.length,
    seededCount: seededKeys.length,
    seededKeys,
    existingKeys
  };
}

/**
 * Force reset of all POLAR-OPS keys back to original dummy data.
 * Use for debugging, testing, or explicit system reset.
 */
function resetStorageToDefault() {
  if (typeof STORAGE_KEYS === 'undefined') return false;

  Object.values(STORAGE_KEYS).forEach((key) => {
    clearData(key);
  });

  return initializeStorage();
}

/**
 * Inspect platform data status and return counts of all entities.
 * @returns {Object}
 */
function getPlatformStatus() {
  if (typeof STORAGE_KEYS === 'undefined') {
    return { initialized: false, error: 'STORAGE_KEYS undefined' };
  }

  const counts = {};
  let totalRecords = 0;

  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    const records = getData(key);
    const count = Array.isArray(records) ? records.length : 0;
    counts[name] = count;
    totalRecords += count;
  });

  return {
    initialized: true,
    platform: 'POLAR-OPS Enterprise Operations',
    environment: 'Phase 2 Global Shell',
    counts,
    totalRecords
  };
}

/* ==========================================================================
   2. GLOBAL UI SHELL & INTERACTION ENGINE (PHASE 2 CORE)
   ========================================================================== */

const PolarUI = {
  initialized: false,
  currentTheme: 'hybrid',

  /**
   * Initialize Global UI Shell interactions.
   */
  init() {
    if (this.initialized || typeof document === 'undefined') return;

    this.initTheme();
    this.setupSidebar();
    this.setupActiveNavigation();
    this.setupModalListeners();
    this.setupToastContainer();
    this.setupNotificationsDrawer();
    this.updateNotificationCount();

    this.initialized = true;
    console.log('[POLAR-OPS] Global UI Shell and Interaction Controller initialized.');
  },

  /* ==========================================================================
     THEME CONTROLLER (HYBRID & MINIMAL SCIENTIFIC)
     ========================================================================== */

  /**
   * Initialize and restore active theme from localStorage
   */
  initTheme() {
    let savedTheme = 'hybrid';
    try {
      if (typeof localStorage !== 'undefined') {
        savedTheme = localStorage.getItem('polar_theme') || 'hybrid';
        if (savedTheme !== 'hybrid' && savedTheme !== 'minimal-scientific') {
          savedTheme = 'hybrid';
        }
      }
    } catch (e) {
      savedTheme = 'hybrid';
    }

    this.currentTheme = savedTheme;
    this.applyTheme(savedTheme, false);
    this.setupThemeSwitcher();
  },

  /**
   * Apply selected theme globally across HTML, Body, and components
   * @param {'hybrid'|'minimal-scientific'} theme
   * @param {boolean} notify Show notification toast
   */
  applyTheme(theme, notify = true) {
    if (theme !== 'hybrid' && theme !== 'minimal-scientific') {
      theme = 'hybrid';
    }
    this.currentTheme = theme;

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('polar_theme', theme);
      }
    } catch (e) {
      // Storage unavailable fallback
    }

    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      if (document.body) {
        document.body.setAttribute('data-theme', theme);
      }

      // Sync all theme switcher button states in the DOM
      const switchBtns = document.querySelectorAll('.theme-switch-btn');
      switchBtns.forEach(btn => {
        const val = btn.getAttribute('data-theme-val');
        const isActive = val === theme;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
      });
    }

    // Dispatch global custom event for any listening operational widgets
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(new CustomEvent('polar-theme-changed', { detail: { theme } }));
      } catch (e) {}
    }

    if (notify && this.initialized && typeof this.showToast === 'function') {
      const themeLabel = theme === 'hybrid' ? 'Hybrid Command Center' : 'Minimal Scientific';
      this.showToast(`Active Theme: ${themeLabel}`, 'info', 'Theme Switched', 2000);
    }
  },

  /**
   * Toggle between Hybrid and Minimal Scientific themes
   */
  toggleTheme() {
    const nextTheme = this.currentTheme === 'hybrid' ? 'minimal-scientific' : 'hybrid';
    this.applyTheme(nextTheme, true);
    return nextTheme;
  },

  /**
   * Get currently active theme
   * @returns {'hybrid'|'minimal-scientific'}
   */
  getTheme() {
    return this.currentTheme;
  },

  /**
   * Setup Theme Switcher UI and click delegation
   */
  setupThemeSwitcher() {
    if (typeof document === 'undefined') return;

    // 1. If switcher doesn't exist in header-right, inject it gracefully
    const headerRight = document.querySelector('.header-right');
    if (headerRight && !document.querySelector('.theme-switcher-wrapper')) {
      const switcher = document.createElement('div');
      switcher.className = 'theme-switcher-wrapper';
      switcher.setAttribute('role', 'group');
      switcher.setAttribute('aria-label', 'Interface Theme Switcher');
      switcher.innerHTML = `
        <button type="button" class="theme-switch-btn ${this.currentTheme === 'hybrid' ? 'active' : ''}" data-theme-val="hybrid" id="themeBtnHybrid" title="Switch to Hybrid Command Center Theme" aria-pressed="${this.currentTheme === 'hybrid'}">
          <svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="18" rx="1" fill="currentColor"></rect>
            <rect x="10" y="3" width="11" height="18" rx="1"></rect>
          </svg>
          <span class="theme-label">HYBRID</span>
        </button>
        <button type="button" class="theme-switch-btn ${this.currentTheme === 'minimal-scientific' ? 'active' : ''}" data-theme-val="minimal-scientific" id="themeBtnMinimal" title="Switch to Minimal Scientific Theme" aria-pressed="${this.currentTheme === 'minimal-scientific'}">
          <svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9"></circle>
            <line x1="12" y1="3" x2="12" y2="7"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
            <line x1="3" y1="12" x2="7" y2="12"></line>
            <line x1="17" y1="12" x2="21" y2="12"></line>
          </svg>
          <span class="theme-label">MINIMAL</span>
        </button>
      `;

      const notifWrapper = headerRight.querySelector('.header-notif-wrapper');
      if (notifWrapper) {
        headerRight.insertBefore(switcher, notifWrapper);
      } else {
        headerRight.prepend(switcher);
      }
    }

    // 2. Delegate click events to theme switcher buttons
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.theme-switch-btn');
      if (btn) {
        e.preventDefault();
        const targetTheme = btn.getAttribute('data-theme-val');
        if (targetTheme && targetTheme !== this.currentTheme) {
          this.applyTheme(targetTheme, true);
        }
      }
    });
  },

  /**
   * Setup Mobile Sidebar Toggle and Backdrop
   */
  setupSidebar() {
    const toggleBtn = document.getElementById('sidebarToggle') || document.querySelector('[data-sidebar-toggle]');
    const backdrop = document.getElementById('sidebarBackdrop') || document.querySelector('.sidebar-backdrop');
    const sidebar = document.getElementById('appSidebar') || document.querySelector('.app-sidebar');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSidebar();
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', () => {
        this.closeSidebar();
      });
    }

    // Close sidebar when clicking any navigation link on mobile
    if (sidebar) {
      sidebar.querySelectorAll('.sidebar-nav-item').forEach((link) => {
        link.addEventListener('click', () => {
          if (window.innerWidth <= 768) {
            this.closeSidebar();
          }
        });
      });
    }

    // Keyboard accessibility: ESC key closes open sidebar or modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeSidebar();
        this.closeActiveModals();
      }
    });
  },

  toggleSidebar() {
    document.body.classList.toggle('sidebar-open');
    const isOpen = document.body.classList.contains('sidebar-open');
    const toggleBtn = document.getElementById('sidebarToggle') || document.querySelector('[data-sidebar-toggle]');
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', String(isOpen));
    }
  },

  openSidebar() {
    document.body.classList.add('sidebar-open');
    const toggleBtn = document.getElementById('sidebarToggle') || document.querySelector('[data-sidebar-toggle]');
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', 'true');
    }
  },

  closeSidebar() {
    document.body.classList.remove('sidebar-open');
    const toggleBtn = document.getElementById('sidebarToggle') || document.querySelector('[data-sidebar-toggle]');
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  },

  /**
   * Automatically detect and mark active sidebar navigation link based on URL.
   */
  setupActiveNavigation() {
    const currentPath = window.location.pathname.toLowerCase();
    const navItems = document.querySelectorAll('.sidebar-nav-item');

    navItems.forEach((item) => {
      const href = item.getAttribute('href');
      const targetNav = item.getAttribute('data-nav');

      let isActive = false;

      if (targetNav) {
        if (targetNav === 'dashboard' && (currentPath.endsWith('dashboard.html') || currentPath.endsWith('/'))) {
          isActive = true;
        } else if (currentPath.includes(targetNav)) {
          isActive = true;
        }
      } else if (href) {
        const linkFilename = href.split('/').pop().toLowerCase();
        if (currentPath.endsWith(linkFilename)) {
          isActive = true;
        }
      }

      if (isActive) {
        item.classList.add('active');
        item.setAttribute('aria-current', 'page');
      } else {
        item.classList.remove('active');
        item.removeAttribute('aria-current');
      }
    });
  },

  /**
   * Global Modal Dialog System
   */
  setupModalListeners() {
    // Open trigger: elements with [data-modal-open="modalId"]
    document.addEventListener('click', (e) => {
      const openTrigger = e.target.closest('[data-modal-open]');
      if (openTrigger) {
        e.preventDefault();
        const modalId = openTrigger.getAttribute('data-modal-open');
        this.openModal(modalId);
      }

      // Close trigger: elements with [data-modal-close]
      const closeTrigger = e.target.closest('[data-modal-close]');
      if (closeTrigger) {
        e.preventDefault();
        const modalOverlay = closeTrigger.closest('.polar-modal-overlay');
        if (modalOverlay) {
          this.closeModal(modalOverlay.id);
        }
      }

      // Backdrop click on modal overlay
      if (e.target.classList.contains('polar-modal-overlay')) {
        this.closeModal(e.target.id);
      }
    });
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    modal.setAttribute('aria-hidden', 'false');
    const firstInput = modal.querySelector('input, select, textarea, button.btn-primary');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    // Restore body scrolling only if no other modal is open
    const openModals = document.querySelectorAll('.polar-modal-overlay.active');
    if (openModals.length === 0) {
      document.body.style.overflow = '';
    }
  },

  closeActiveModals() {
    const openModals = document.querySelectorAll('.polar-modal-overlay.active');
    openModals.forEach((modal) => {
      this.closeModal(modal.id);
    });
  },

  /**
   * Global Notification & Toast Engine
   */
  setupToastContainer() {
    if (!document.querySelector('.polar-toast-container')) {
      const container = document.createElement('div');
      container.className = 'polar-toast-container';
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
  },

  /**
   * Render and animate a global notification toast
   * @param {string} message 
   * @param {'info'|'success'|'warning'|'error'} type 
   * @param {string|null} title 
   * @param {number} duration Milliseconds
   */
  showToast(message, type = 'info', title = null, duration = 4000) {
    this.setupToastContainer();
    const container = document.querySelector('.polar-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `polar-toast toast-${type}`;
    toast.setAttribute('role', 'alert');

    const defaultTitles = {
      success: 'Operation Successful',
      warning: 'Operational Warning',
      error: 'Telemetry Alert / Error',
      info: 'Operations Notice'
    };

    const toastTitle = title || defaultTitles[type] || 'Notice';

    toast.innerHTML = `
      <div class="polar-toast-content">
        <div class="polar-toast-title">${toastTitle}</div>
        <div class="polar-toast-msg">${message}</div>
      </div>
      <button class="polar-toast-close" aria-label="Dismiss">&times;</button>
    `;

    const closeBtn = toast.querySelector('.polar-toast-close');
    closeBtn.addEventListener('click', () => {
      toast.remove();
    });

    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        setTimeout(() => toast.remove(), 250);
      }, duration);
    }
  },

  /**
   * Synchronize unread notifications badge in top header
   */
  updateNotificationCount() {
    const badge = document.getElementById('notifCountBadge');
    if (!badge || typeof getData !== 'function' || typeof STORAGE_KEYS === 'undefined') return;

    try {
      const notifs = getData(STORAGE_KEYS.notifications);
      if (Array.isArray(notifs)) {
        const unreadCount = notifs.filter((n) => !n.read).length;
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
      }
    } catch (e) {
      // Graceful fallback
    }
  },

  /**
   * Attach click listener to top header notification bell
   */
  setupNotificationsDrawer() {
    const bellBtn = document.getElementById('notifBellBtn');
    if (bellBtn) {
      bellBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openNotificationsModal();
      };
    }
  },

  /**
   * Open Accessible Notification Center Modal
   */
  openNotificationsModal() {
    let modal = document.getElementById('polarNotificationsModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'polar-modal-overlay';
      modal.id = 'polarNotificationsModal';
      modal.setAttribute('aria-hidden', 'true');
      modal.innerHTML = `
        <div class="polar-modal" style="max-width: 540px;">
          <div class="polar-modal-header">
            <div class="polar-modal-title">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--polar-cyan-primary); margin-right: 6px;">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span>Polar Telemetry Broadcasts</span>
            </div>
            <button class="polar-modal-close" data-modal-close aria-label="Close modal">&times;</button>
          </div>
          <div class="polar-modal-body" id="polarNotificationsBody" style="max-height: 420px; overflow-y: auto; padding: 12px 16px;">
          </div>
          <div class="polar-modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
            <button type="button" class="btn btn-secondary btn-sm" id="polarNotifMarkAllBtn">Mark All as Read</button>
            <button type="button" class="btn btn-secondary btn-sm" data-modal-close>Close</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const markAllBtn = document.getElementById('polarNotifMarkAllBtn');
      if (markAllBtn) {
        markAllBtn.addEventListener('click', () => {
          if (typeof getData === 'function' && typeof saveData === 'function') {
            const notifs = getData(STORAGE_KEYS.notifications) || [];
            notifs.forEach(n => n.read = true);
            saveData(STORAGE_KEYS.notifications, notifs);
            this.updateNotificationCount();
            this.renderNotificationsList();
            this.showToast('All notifications marked as read.', 'info');
          }
        });
      }
    }

    this.renderNotificationsList();
    this.openModal('polarNotificationsModal');
  },

  /**
   * Render notification items inside notification center modal
   */
  renderNotificationsList() {
    const body = document.getElementById('polarNotificationsBody');
    if (!body || typeof getData !== 'function') return;

    const notifs = getData(STORAGE_KEYS.notifications) || [];
    if (notifs.length === 0) {
      body.innerHTML = `
        <div style="text-align: center; padding: 24px 0; color: var(--polar-text-muted);">
          No active telemetry notices. All sectors normal.
        </div>
      `;
      return;
    }

    body.innerHTML = notifs.map(n => {
      const typeClass = n.type === 'alert' ? 'badge-emergency' :
                        n.type === 'warning' ? 'badge-amber' : 'badge-operational';
      const isUnread = !n.read;
      const bg = isUnread ? 'rgba(0, 217, 255, 0.04)' : 'rgba(255, 255, 255, 0.01)';
      const border = isUnread ? '1px solid rgba(0, 217, 255, 0.2)' : '1px solid var(--polar-border-subtle)';

      return `
        <div style="background: ${bg}; border: ${border}; border-radius: 4px; padding: 10px 12px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span class="badge ${typeClass}" style="font-size: 10px; padding: 1px 5px;">${(n.type || 'info').toUpperCase()}</span>
              <span style="font-size: 12px; font-weight: 600; color: var(--polar-text-primary);">${n.title}</span>
            </div>
            <div style="font-size: 12px; color: var(--polar-text-secondary); line-height: 1.4;">${n.message}</div>
            <div style="font-size: 10px; font-family: var(--font-mono); color: var(--polar-text-muted); margin-top: 4px;">${n.timestamp || ''}</div>
          </div>
          ${isUnread ? `
            <button class="btn btn-secondary btn-sm" style="padding: 2px 6px; font-size: 10px; white-space: nowrap;" onclick="PolarUI.markNotificationRead('${n.id}')">
              Mark Read
            </button>
          ` : ''}
        </div>
      `;
    }).join('');
  },

  /**
   * Mark individual notification as read
   */
  markNotificationRead(id) {
    if (typeof getData !== 'function' || typeof saveData !== 'function') return;
    const notifs = getData(STORAGE_KEYS.notifications) || [];
    const item = notifs.find(n => n.id === id);
    if (item) {
      item.read = true;
      saveData(STORAGE_KEYS.notifications, notifs);
      this.updateNotificationCount();
      this.renderNotificationsList();
    }
  }
};

/* ==========================================================================
   3. GLOBAL NAMESPACE & LIFECYCLE HOOKS
   ========================================================================== */

const PolarOps = {
  version: '2.0.0-phase2',
  init: initializeStorage,
  reset: resetStorageToDefault,
  getStatus: getPlatformStatus,
  ui: PolarUI
};

// Expose to window/global for browser script tags
if (typeof window !== 'undefined') {
  window.initializeStorage = initializeStorage;
  window.resetStorageToDefault = resetStorageToDefault;
  window.getPlatformStatus = getPlatformStatus;
  window.PolarOps = PolarOps;
  window.PolarUI = PolarUI;
}

// Automatic initialization hook on browser DOM ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize data storage
    const report = initializeStorage();
    if (report.success) {
      console.log(
        `%c[POLAR-OPS]%c Storage online. (${report.seededCount} keys seeded, ${report.existingKeys.length} preserved)`,
        'background: #003366; color: #00e5ff; font-weight: bold; padding: 2px 4px; border-radius: 2px;',
        'color: inherit;'
      );
    }

    // 2. Initialize Global UI Shell
    PolarUI.init();
  });
}

// Node.js module export support for testing runners
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeStorage,
    resetStorageToDefault,
    getPlatformStatus,
    PolarOps,
    PolarUI
  };
}
