/**
 * POLAR-OPS — Integrated Polar Expedition Operations & Logistics Platform
 * Expeditions & Traverse Operations Module (Phase 3 Core Operations)
 *
 * Implements full CRUD, interactive filtering, search, and activity tracking
 * backed by centralized localStorage via js/storage.js.
 */

const ExpeditionModule = {
  expeditions: [],
  filteredExpeditions: [],

  /**
   * Initialize module, attach event listeners, and render initial dataset
   */
  init() {
    this.loadData();
    this.setupListeners();
    this.render();
    console.log('[POLAR-OPS] Expedition Operations Module initialized with', this.expeditions.length, 'missions.');
  },

  /**
   * Load expeditions from centralized storage
   */
  loadData() {
    if (typeof getData === 'function' && typeof STORAGE_KEYS !== 'undefined') {
      this.expeditions = getData(STORAGE_KEYS.expeditions) || [];
    } else {
      this.expeditions = [];
    }
    this.filteredExpeditions = [...this.expeditions];
  },

  /**
   * Set up UI controls and form submission event listeners
   */
  setupListeners() {
    if (typeof document === 'undefined') return;

    // Search input listener
    const searchInput = document.getElementById('expeditionSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.filterAndSearch());
    }

    // Status filter dropdown
    const statusFilter = document.getElementById('expeditionStatusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.filterAndSearch());
    }

    // Destination filter dropdown
    const destFilter = document.getElementById('expeditionDestFilter');
    if (destFilter) {
      destFilter.addEventListener('change', () => this.filterAndSearch());
    }

    // Reset filters button
    const resetBtn = document.getElementById('expeditionResetFiltersBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (statusFilter) statusFilter.value = 'ALL';
        if (destFilter) destFilter.value = 'ALL';
        this.filterAndSearch();
      });
    }

    // Refresh telemetry button
    const refreshBtn = document.getElementById('expeditionRefreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadData();
        this.render();
        if (typeof PolarUI !== 'undefined' && typeof PolarUI.showToast === 'function') {
          PolarUI.showToast('Expedition telemetry synchronized.', 'info', 'Expedition Sync');
        }
      });
    }

    // Progress slider labels
    const newProg = document.getElementById('newExpProgress');
    const newProgVal = document.getElementById('newExpProgressVal');
    if (newProg && newProgVal) {
      newProg.addEventListener('input', (e) => {
        newProgVal.textContent = e.target.value;
      });
    }

    const editProg = document.getElementById('editExpProgress');
    const editProgVal = document.getElementById('editExpProgressVal');
    if (editProg && editProgVal) {
      editProg.addEventListener('input', (e) => {
        editProgVal.textContent = e.target.value;
      });
    }

    // Create Expedition Form submission
    const createForm = document.getElementById('createExpeditionForm');
    if (createForm) {
      createForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleCreateSubmit();
      });
    }

    // Edit Expedition Form submission
    const editForm = document.getElementById('editExpeditionForm');
    if (editForm) {
      editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleEditSubmit();
      });
    }

    // Pre-populate unique ID when opening Create Modal
    const openCreateBtn = document.getElementById('openCreateExpBtn');
    if (openCreateBtn) {
      openCreateBtn.addEventListener('click', () => {
        const idInput = document.getElementById('newExpId');
        if (idInput && (!idInput.value || idInput.value.trim() === '')) {
          const nextIndex = this.expeditions.length + 44;
          idInput.value = `EXP-${nextIndex}-MAI`;
        }
      });
    }
  },

  /**
   * Filter and search client-side dataset and update table
   */
  filterAndSearch() {
    if (typeof document === 'undefined') return;

    const query = (document.getElementById('expeditionSearchInput')?.value || '').toLowerCase().trim();
    const status = document.getElementById('expeditionStatusFilter')?.value || 'ALL';
    const destination = document.getElementById('expeditionDestFilter')?.value || 'ALL';

    this.filteredExpeditions = this.expeditions.filter((exp) => {
      // Text search match across name, id, destination, missionType, and leader
      const matchesQuery = !query ||
        (exp.name && exp.name.toLowerCase().includes(query)) ||
        (exp.id && exp.id.toLowerCase().includes(query)) ||
        (exp.destination && exp.destination.toLowerCase().includes(query)) ||
        (exp.missionType && exp.missionType.toLowerCase().includes(query)) ||
        (exp.leader && exp.leader.toLowerCase().includes(query));

      // Status match
      const matchesStatus = status === 'ALL' || exp.status === status;

      // Destination match
      const matchesDest = destination === 'ALL' ||
        (exp.destination && exp.destination.toLowerCase().includes(destination.toLowerCase()));

      return matchesQuery && matchesStatus && matchesDest;
    });

    this.renderTableOnly();
  },

  /**
   * Render metrics bar and table
   */
  render() {
    this.renderMetrics();
    this.renderTableOnly();
  },

  /**
   * Compute and update summary statistics
   */
  renderMetrics() {
    if (typeof document === 'undefined') return;

    const total = this.expeditions.length;
    const active = this.expeditions.filter((e) => e.status === 'Active').length;
    const preparing = this.expeditions.filter((e) => e.status === 'Preparing').length;
    const delayed = this.expeditions.filter((e) => e.status === 'Delayed').length;

    const elTotal = document.getElementById('statTotalExpeditions');
    const elActive = document.getElementById('statActiveExpeditions');
    const elPreparing = document.getElementById('statPreparingExpeditions');
    const elDelayed = document.getElementById('statDelayedExpeditions');

    if (elTotal) elTotal.textContent = total;
    if (elActive) elActive.textContent = active;
    if (elPreparing) elPreparing.textContent = preparing;
    if (elDelayed) elDelayed.textContent = delayed;
  },

  /**
   * Render table rows and update result count badge
   */
  renderTableOnly() {
    if (typeof document === 'undefined') return;

    const tbody = document.getElementById('expeditionsTableBody');
    const emptyState = document.getElementById('expeditionsEmptyState');
    const countChip = document.getElementById('expeditionResultCount');

    if (countChip) {
      countChip.textContent = `Showing ${this.filteredExpeditions.length} of ${this.expeditions.length} missions`;
    }

    if (!tbody) return;

    if (this.filteredExpeditions.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = this.filteredExpeditions.map((exp) => {
      const statusBadgeClass = `badge-${(exp.status || '').toLowerCase().replace(/\s+/g, '-')}`;
      const progress = Number(exp.progress) || 0;
      const progressColor = exp.status === 'Delayed' ? 'var(--status-red)' :
                           exp.status === 'Completed' ? 'var(--status-green)' :
                           progress > 50 ? 'var(--polar-cyan-primary)' : 'var(--status-amber)';

      return `
        <tr data-exp-id="${exp.id}">
          <td class="cell-mono" style="font-weight: 700;">${exp.id}</td>
          <td>
            <div style="font-weight: 600; color: var(--polar-ice-white);">${exp.name}</div>
            <div style="font-size: var(--text-xs); color: var(--polar-text-muted); margin-top: 2px;">
              ${exp.missionType || 'Scientific Polar Traverse'}
            </div>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 6px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px; color: var(--polar-cyan-primary); flex-shrink: 0;">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>${exp.destination || 'Unassigned Sector'}</span>
            </div>
          </td>
          <td>
            <span style="font-family: var(--font-mono); font-weight: 600;">${exp.teamSize || 0}</span>
            <span style="font-size: var(--text-xs); color: var(--polar-text-muted);"> crew</span>
          </td>
          <td>
            <div style="font-size: var(--text-xs); font-family: var(--font-mono);">
              <span style="color: var(--polar-text-secondary);">${exp.departureDate || 'TBD'}</span>
              <span style="color: var(--polar-text-muted);"> &rarr; </span>
              <span style="color: var(--polar-cyan-primary);">${exp.expectedReturn || 'TBD'}</span>
            </div>
          </td>
          <td>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 0.72rem; font-family: var(--font-mono); color: var(--polar-text-secondary);">Traverse Fill</span>
              <span style="font-size: 0.72rem; font-family: var(--font-mono); font-weight: 700; color: ${progressColor};">${progress}%</span>
            </div>
            <div style="height: 6px; background-color: rgba(255, 255, 255, 0.08); border-radius: 3px; overflow: hidden;">
              <div style="width: ${Math.min(100, Math.max(0, progress))}%; height: 100%; background-color: ${progressColor}; border-radius: 3px; transition: width 0.3s ease;"></div>
            </div>
          </td>
          <td>
            <span class="badge ${statusBadgeClass}">
              <span class="badge-dot"></span>
              ${exp.status}
            </span>
          </td>
          <td style="text-align: right;">
            <div class="table-actions-group" style="justify-content: flex-end;">
              <button class="table-action-btn btn-action-primary" onclick="ExpeditionModule.openViewModal('${exp.id}')" title="Inspect Mission Dossier">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px;">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>View</span>
              </button>
              <button class="table-action-btn" onclick="ExpeditionModule.openEditModal('${exp.id}')" title="Modify Expedition Parameters">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px;">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span>Edit</span>
              </button>
              <button class="table-action-btn btn-action-delete" onclick="ExpeditionModule.handleDelete('${exp.id}')" title="Decommission / Delete Record">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px;">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <span>Del</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  /**
   * Handle Create Form submission
   */
  handleCreateSubmit() {
    const id = (document.getElementById('newExpId')?.value || '').trim();
    const name = (document.getElementById('newExpName')?.value || '').trim();
    const destination = (document.getElementById('newExpDestination')?.value || '').trim();
    const teamSize = parseInt(document.getElementById('newExpTeamSize')?.value, 10) || 1;
    const missionType = (document.getElementById('newExpMissionType')?.value || '').trim();
    const departureDate = document.getElementById('newExpDepartureDate')?.value || '';
    const expectedReturn = document.getElementById('newExpReturnDate')?.value || '';
    const status = document.getElementById('newExpStatus')?.value || 'Preparing';
    const progress = parseInt(document.getElementById('newExpProgress')?.value, 10) || 0;

    if (!id || !name || !destination || !missionType) {
      if (typeof PolarUI !== 'undefined' && typeof PolarUI.showToast === 'function') {
        PolarUI.showToast('Please fill out all mandatory expedition fields.', 'warning', 'Validation Warning');
      }
      return;
    }

    // Check for ID collision
    const existing = getItemById(STORAGE_KEYS.expeditions, id);
    if (existing) {
      if (typeof PolarUI !== 'undefined' && typeof PolarUI.showToast === 'function') {
        PolarUI.showToast(`Expedition ID "${id}" is already registered.`, 'error', 'Duplicate Mission ID');
      }
      return;
    }

    const newExp = {
      id,
      name,
      destination,
      departureDate,
      expectedReturn,
      teamSize,
      missionType,
      status,
      progress
    };

    // Persist via centralized storage helper
    addData(STORAGE_KEYS.expeditions, newExp);

    // Record meaningful operational activity
    this.recordActivity(`New mission ${id} ("${name}") registered for ${destination}.`, 'expedition');

    // Close modal
    if (typeof PolarUI !== 'undefined' && typeof PolarUI.closeModal === 'function') {
      PolarUI.closeModal('createExpeditionModal');
    }

    // Reset form
    document.getElementById('createExpeditionForm')?.reset();

    // Reload and give toast feedback
    this.loadData();
    this.filterAndSearch();
    this.renderMetrics();

    if (typeof PolarUI !== 'undefined' && typeof PolarUI.showToast === 'function') {
      PolarUI.showToast(`Expedition ${id} successfully scheduled.`, 'success', 'Mission Created');
    }
  },

  /**
   * Open Edit Modal and pre-populate with item data
   * @param {string} id 
   */
  openEditModal(id) {
    const exp = getItemById(STORAGE_KEYS.expeditions, id);
    if (!exp) return;

    document.getElementById('editExpId').value = exp.id;
    document.getElementById('editExpIdDisplay').value = exp.id;
    document.getElementById('editExpName').value = exp.name || '';
    document.getElementById('editExpDestination').value = exp.destination || '';
    document.getElementById('editExpTeamSize').value = exp.teamSize || 1;
    document.getElementById('editExpMissionType').value = exp.missionType || '';
    document.getElementById('editExpDepartureDate').value = exp.departureDate || '';
    document.getElementById('editExpReturnDate').value = exp.expectedReturn || '';
    document.getElementById('editExpStatus').value = exp.status || 'Active';
    document.getElementById('editExpProgress').value = exp.progress || 0;
    document.getElementById('editExpProgressVal').textContent = exp.progress || 0;

    if (typeof PolarUI !== 'undefined' && typeof PolarUI.openModal === 'function') {
      PolarUI.openModal('editExpeditionModal');
    }
  },

  /**
   * Handle Edit Form submission
   */
  handleEditSubmit() {
    const id = document.getElementById('editExpId')?.value;
    if (!id) return;

    const updates = {
      name: (document.getElementById('editExpName')?.value || '').trim(),
      destination: (document.getElementById('editExpDestination')?.value || '').trim(),
      teamSize: parseInt(document.getElementById('editExpTeamSize')?.value, 10) || 1,
      missionType: (document.getElementById('editExpMissionType')?.value || '').trim(),
      departureDate: document.getElementById('editExpDepartureDate')?.value || '',
      expectedReturn: document.getElementById('editExpReturnDate')?.value || '',
      status: document.getElementById('editExpStatus')?.value || 'Active',
      progress: parseInt(document.getElementById('editExpProgress')?.value, 10) || 0
    };

    // Persist via centralized storage helper
    updateData(STORAGE_KEYS.expeditions, id, updates);

    // Record meaningful operational activity
    this.recordActivity(`Expedition ${id} parameters updated (Status: ${updates.status}, Progress: ${updates.progress}%).`, 'expedition');

    // Close modal
    if (typeof PolarUI !== 'undefined' && typeof PolarUI.closeModal === 'function') {
      PolarUI.closeModal('editExpeditionModal');
    }

    // Refresh UI
    this.loadData();
    this.filterAndSearch();
    this.renderMetrics();

    if (typeof PolarUI !== 'undefined' && typeof PolarUI.showToast === 'function') {
      PolarUI.showToast(`Expedition ${id} updated successfully.`, 'success', 'Mission Updated');
    }
  },

  /**
   * Delete an expedition by ID
   * @param {string} id 
   */
  handleDelete(id) {
    const exp = getItemById(STORAGE_KEYS.expeditions, id);
    const expName = exp ? exp.name : id;

    const confirmed = typeof confirm === 'function' ? 
      confirm(`Decommission expedition "${id}: ${expName}"? This action removes the mission from active tracking.`) : 
      true;

    if (!confirmed) return;

    deleteData(STORAGE_KEYS.expeditions, id);
    this.recordActivity(`Expedition ${id} decommissioned and removed from registry.`, 'expedition');

    this.loadData();
    this.filterAndSearch();
    this.renderMetrics();

    if (typeof PolarUI !== 'undefined' && typeof PolarUI.showToast === 'function') {
      PolarUI.showToast(`Expedition ${id} deleted.`, 'info', 'Mission Removed');
    }
  },

  /**
   * Open Mission Dossier view modal
   * @param {string} id 
   */
  openViewModal(id) {
    const exp = getItemById(STORAGE_KEYS.expeditions, id);
    if (!exp) return;

    const container = document.getElementById('viewExpeditionContent');
    const titleEl = document.getElementById('viewExpTitle');
    const idEl = document.getElementById('viewExpId');

    if (idEl) idEl.textContent = exp.id;
    if (titleEl) titleEl.textContent = exp.name;

    const statusBadgeClass = `badge-${(exp.status || '').toLowerCase().replace(/\s+/g, '-')}`;

    if (container) {
      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); border-bottom: 1px solid var(--polar-border-subtle); padding-bottom: var(--space-3);">
          <div>
            <div style="font-size: var(--text-xs); color: var(--polar-text-muted); text-transform: uppercase;">Mission Status</div>
            <span class="badge ${statusBadgeClass}" style="margin-top: 4px;">
              <span class="badge-dot"></span>
              ${exp.status}
            </span>
          </div>
          <div style="text-align: right;">
            <div style="font-size: var(--text-xs); color: var(--polar-text-muted); text-transform: uppercase;">Traverse Progress</div>
            <div style="font-family: var(--font-mono); font-size: var(--text-lg); font-weight: 700; color: var(--polar-cyan-primary);">${exp.progress}%</div>
          </div>
        </div>

        <div class="form-grid" style="margin-bottom: var(--space-4);">
          <div>
            <div style="font-size: var(--text-xs); color: var(--polar-text-muted); text-transform: uppercase;">Destination Corridor</div>
            <div style="font-weight: 600; color: var(--polar-ice-white); margin-top: 2px;">${exp.destination}</div>
          </div>
          <div>
            <div style="font-size: var(--text-xs); color: var(--polar-text-muted); text-transform: uppercase;">Deployed Team</div>
            <div style="font-weight: 600; color: var(--polar-ice-white); margin-top: 2px;">${exp.teamSize} Crew Specialists</div>
          </div>
        </div>

        <div style="margin-bottom: var(--space-4);">
          <div style="font-size: var(--text-xs); color: var(--polar-text-muted); text-transform: uppercase;">Scientific Objective</div>
          <div style="background-color: var(--polar-bg-surface-elevated); border: 1px solid var(--polar-border-subtle); border-radius: var(--radius-sm); padding: var(--space-3); margin-top: 4px; font-size: var(--text-sm); color: var(--polar-text-primary);">
            ${exp.missionType}
          </div>
        </div>

        <div class="form-grid">
          <div>
            <div style="font-size: var(--text-xs); color: var(--polar-text-muted); text-transform: uppercase;">Departure Date</div>
            <div style="font-family: var(--font-mono); color: var(--polar-text-secondary); margin-top: 2px;">${exp.departureDate || 'Unspecified'}</div>
          </div>
          <div>
            <div style="font-size: var(--text-xs); color: var(--polar-text-muted); text-transform: uppercase;">Expected Return</div>
            <div style="font-family: var(--font-mono); color: var(--polar-text-secondary); margin-top: 2px;">${exp.expectedReturn || 'Unspecified'}</div>
          </div>
        </div>

        ${(() => {
          if (typeof getData === 'function' && typeof STORAGE_KEYS !== 'undefined') {
            const allCrew = getData(STORAGE_KEYS.personnel) || [];
            const matched = allCrew.filter(c => c.expeditionId === exp.id);
            if (matched.length > 0) {
              return `
                <div style="margin-top: var(--space-4); border-top: 1px solid var(--polar-border-subtle); padding-top: var(--space-3);">
                  <div style="font-size: var(--text-xs); color: var(--polar-text-muted); text-transform: uppercase; margin-bottom: 6px;">Assigned Personnel Roster (${matched.length})</div>
                  <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                    ${matched.map(c => `<span style="font-size: 11px; background: rgba(0,217,255,0.06); border: 1px solid var(--polar-border-subtle); padding: 2px 6px; border-radius: 3px; color: var(--polar-ice-white);">${c.name} <span style="color: var(--polar-text-muted);">(${c.role})</span></span>`).join('')}
                  </div>
                </div>
              `;
            }
          }
          return '';
        })()}
      `;
    }

    if (typeof PolarUI !== 'undefined' && typeof PolarUI.openModal === 'function') {
      PolarUI.openModal('viewExpeditionModal');
    }
  },

  /**
   * Helper to append an entry to polar_activity in storage
   */
  recordActivity(message, type = 'expedition') {
    if (typeof addData !== 'function' || typeof STORAGE_KEYS === 'undefined') return;

    const now = new Date();
    const isoString = now.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

    const newActivity = {
      id: `ACT-${Date.now().toString().slice(-4)}`,
      message,
      type,
      timestamp: isoString
    };

    addData(STORAGE_KEYS.activity, newActivity);
  }
};

// Automatic initialization on DOMContentLoaded in active browser
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    ExpeditionModule.init();
  });
}

// Global window exposure
if (typeof window !== 'undefined') {
  window.ExpeditionModule = ExpeditionModule;
}

// Node.js module export support for automated verification test suites
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExpeditionModule;
}
