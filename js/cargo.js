/**
 * POLAR-OPS — Integrated Polar Expedition Operations & Logistics Platform
 * Cargo Logistics & Supply Chain Tracking Module (Phase 3 Core Operations)
 *
 * Implements interactive 5-stage pipeline, full CRUD, search, filter,
 * stage-advancement, and operational activity logging.
 */

const CargoModule = {
  cargo: [],
  filteredCargo: [],
  activeStageFilter: 'ALL',

  /**
   * Initialize module, attach event listeners, and render initial dataset
   */
  init() {
    this.loadData();
    this.setupListeners();
    this.render();
    console.log('[POLAR-OPS] Cargo Logistics Module initialized with', this.cargo.length, 'manifests.');
  },

  /**
   * Load cargo manifests from centralized storage
   */
  loadData() {
    if (typeof getData === 'function' && typeof STORAGE_KEYS !== 'undefined') {
      this.cargo = getData(STORAGE_KEYS.cargo) || [];
    } else {
      this.cargo = [];
    }
    this.filteredCargo = [...this.cargo];
  },

  /**
   * Setup UI controls and form submission listeners
   */
  setupListeners() {
    if (typeof document === 'undefined') return;

    // Search input listener
    const searchInput = document.getElementById('cargoSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.filterAndSearch());
    }

    // Status filter dropdown
    const statusFilter = document.getElementById('cargoStatusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.activeStageFilter = e.target.value;
        this.updatePipelineRibbonHighlight();
        this.filterAndSearch();
      });
    }

    // Category filter dropdown
    const categoryFilter = document.getElementById('cargoCategoryFilter');
    if (categoryFilter) {
      categoryFilter.addEventListener('change', () => this.filterAndSearch());
    }

    // Reset filters button
    const resetBtn = document.getElementById('cargoResetFiltersBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (statusFilter) statusFilter.value = 'ALL';
        if (categoryFilter) categoryFilter.value = 'ALL';
        this.activeStageFilter = 'ALL';
        this.updatePipelineRibbonHighlight();
        this.filterAndSearch();
      });
    }

    // Refresh telemetry button
    const refreshBtn = document.getElementById('cargoRefreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadData();
        this.render();
        if (typeof PolarUI !== 'undefined' && typeof PolarUI.showToast === 'function') {
          PolarUI.showToast('Cargo logistics manifest synchronized.', 'info', 'Cargo Sync');
        }
      });
    }

    // Interactive Pipeline Ribbon Stage Click handlers
    const stageNodes = document.querySelectorAll('.pipeline-stage-node');
    stageNodes.forEach((node) => {
      node.addEventListener('click', () => {
        const stage = node.getAttribute('data-stage');
        if (this.activeStageFilter === stage) {
          // Toggle off
          this.activeStageFilter = 'ALL';
          if (statusFilter) statusFilter.value = 'ALL';
        } else {
          this.activeStageFilter = stage;
          if (statusFilter) statusFilter.value = stage;
        }
        this.updatePipelineRibbonHighlight();
        this.filterAndSearch();
      });
    });

    // Create Cargo Form submission
    const createForm = document.getElementById('createCargoForm');
    if (createForm) {
      createForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleCreateSubmit();
      });
    }

    // Edit Cargo Form submission
    const editForm = document.getElementById('editCargoForm');
    if (editForm) {
      editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleEditSubmit();
      });
    }

    // Pre-populate unique ID when opening Create Modal
    const openCreateBtn = document.getElementById('openCreateCargoBtn');
    if (openCreateBtn) {
      openCreateBtn.addEventListener('click', () => {
        const idInput = document.getElementById('newCargoId');
        const containerInput = document.getElementById('newCargoContainer');
        if (idInput && (!idInput.value || idInput.value.trim() === '')) {
          const nextIndex = this.cargo.length + 8801;
          idInput.value = `CRG-${nextIndex}`;
        }
        if (containerInput && (!containerInput.value || containerInput.value.trim() === '')) {
          const rand = Math.floor(1000 + Math.random() * 9000);
          containerInput.value = `ISO-POLAR-${rand}`;
        }
      });
    }
  },

  /**
   * Highlight active stage node in pipeline ribbon
   */
  updatePipelineRibbonHighlight() {
    if (typeof document === 'undefined') return;
    const stageNodes = document.querySelectorAll('.pipeline-stage-node');
    stageNodes.forEach((node) => {
      const stage = node.getAttribute('data-stage');
      if (this.activeStageFilter === stage) {
        node.classList.add('active-filter');
      } else {
        node.classList.remove('active-filter');
      }
    });
  },

  /**
   * Filter and search client-side dataset and update table
   */
  filterAndSearch() {
    if (typeof document === 'undefined') return;

    const query = (document.getElementById('cargoSearchInput')?.value || '').toLowerCase().trim();
    const status = this.activeStageFilter;
    const category = document.getElementById('cargoCategoryFilter')?.value || 'ALL';

    this.filteredCargo = this.cargo.filter((c) => {
      // Text search match across ID, containerId, cargoType, description, origin, destination
      const matchesQuery = !query ||
        (c.id && c.id.toLowerCase().includes(query)) ||
        (c.containerId && c.containerId.toLowerCase().includes(query)) ||
        (c.cargoType && c.cargoType.toLowerCase().includes(query)) ||
        (c.description && c.description.toLowerCase().includes(query)) ||
        (c.origin && c.origin.toLowerCase().includes(query)) ||
        (c.destination && c.destination.toLowerCase().includes(query));

      // Status / stage filter match
      const matchesStatus = status === 'ALL' || c.status === status;

      // Category match
      const matchesCategory = category === 'ALL' || c.cargoType === category;

      return matchesQuery && matchesStatus && matchesCategory;
    });

    this.renderTableOnly();
  },

  /**
   * Render metrics, pipeline ribbon, and table
   */
  render() {
    this.renderPipelineRibbon();
    this.renderMetrics();
    this.renderTableOnly();
  },

  /**
   * Compute counts and render pipeline stage ribbon
   */
  renderPipelineRibbon() {
    if (typeof document === 'undefined') return;

    const counts = {
      Processing: 0,
      'Ready for Dispatch': 0,
      'In Transit': 0,
      'At Station': 0,
      Delivered: 0,
      Delayed: 0
    };

    this.cargo.forEach((c) => {
      if (counts[c.status] !== undefined) {
        counts[c.status]++;
      }
    });

    const elProc = document.getElementById('countProcessing');
    const elReady = document.getElementById('countReady');
    const elInTransit = document.getElementById('countInTransit');
    const elAtStation = document.getElementById('countAtStation');
    const elDelivered = document.getElementById('countDelivered');
    const elDelayed = document.getElementById('countDelayed');

    if (elProc) elProc.textContent = counts.Processing;
    if (elReady) elReady.textContent = counts['Ready for Dispatch'];
    if (elInTransit) elInTransit.textContent = counts['In Transit'];
    if (elAtStation) elAtStation.textContent = counts['At Station'];
    if (elDelivered) elDelivered.textContent = counts.Delivered;
    if (elDelayed) elDelayed.textContent = counts.Delayed;
  },

  /**
   * Compute and update summary statistics
   */
  renderMetrics() {
    if (typeof document === 'undefined') return;

    const total = this.cargo.length;
    const inTransit = this.cargo.filter((c) => c.status === 'In Transit').length;
    const ready = this.cargo.filter((c) => c.status === 'Ready for Dispatch').length;
    const totalWeightKg = this.cargo.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
    const totalTons = (totalWeightKg / 1000).toFixed(1);

    const elTotal = document.getElementById('statTotalCargo');
    const elInTransit = document.getElementById('statInTransitCargo');
    const elReady = document.getElementById('statReadyCargo');
    const elWeight = document.getElementById('statTotalWeight');
    const elTons = document.getElementById('statTonnageTons');

    if (elTotal) elTotal.textContent = total;
    if (elInTransit) elInTransit.textContent = inTransit;
    if (elReady) elReady.textContent = ready;
    if (elWeight) elWeight.innerHTML = `${totalWeightKg.toLocaleString()} <span style="font-size: 0.9rem; font-weight: normal; color: var(--polar-text-muted);">kg</span>`;
    if (elTons) elTons.textContent = `${totalTons} metric tonnes`;
  },

  /**
   * Render table rows and update result count chip
   */
  renderTableOnly() {
    if (typeof document === 'undefined') return;

    const tbody = document.getElementById('cargoTableBody');
    const emptyState = document.getElementById('cargoEmptyState');
    const countChip = document.getElementById('cargoResultCount');

    if (countChip) {
      countChip.textContent = `Showing ${this.filteredCargo.length} of ${this.cargo.length} manifests`;
    }

    if (!tbody) return;

    if (this.filteredCargo.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = this.filteredCargo.map((c) => {
      const statusBadgeClass = `badge-${(c.status || '').toLowerCase().replace(/\s+/g, '-')}`;
      const weightFormatted = (Number(c.weight) || 0).toLocaleString();

      return `
        <tr data-cargo-id="${c.id}">
          <td>
            <div class="cell-mono" style="font-weight: 700;">${c.id}</div>
            <div style="font-size: 0.72rem; font-family: var(--font-mono); color: var(--polar-text-muted); margin-top: 2px;">
              ${c.containerId || 'N/A'}
            </div>
          </td>
          <td>
            <div style="font-weight: 600; color: var(--polar-ice-white); display: flex; align-items: center; gap: 6px;">
              <span>${c.cargoType || 'Cargo Consignment'}</span>
            </div>
            <div style="font-size: var(--text-xs); color: var(--polar-text-secondary); margin-top: 2px; max-width: 320px;">
              ${c.description || 'No description logged'}
            </div>
          </td>
          <td>
            <div style="font-size: var(--text-xs); display: flex; flex-direction: column; gap: 2px;">
              <span style="color: var(--polar-text-muted); font-size: 0.72rem;">Origin: ${c.origin || 'Gateway Terminal'}</span>
              <span style="color: var(--polar-cyan-primary); font-weight: 600;">&darr; ${c.destination || 'Polar Station'}</span>
            </div>
          </td>
          <td>
            <span style="font-family: var(--font-mono); font-weight: 600; color: var(--polar-ice-white);">${weightFormatted}</span>
            <span style="font-size: var(--text-xs); color: var(--polar-text-muted);"> kg</span>
          </td>
          <td>
            <div style="font-family: var(--font-mono); font-size: var(--text-xs); color: var(--polar-text-secondary);">
              ${c.expectedArrival || 'TBD'}
            </div>
          </td>
          <td>
            <span class="badge ${statusBadgeClass}">
              <span class="badge-dot"></span>
              ${c.status}
            </span>
          </td>
          <td style="text-align: right;">
            <div class="table-actions-group" style="justify-content: flex-end;">
              ${c.status !== 'Delivered' ? `
                <button class="table-action-btn btn-action-primary" onclick="CargoModule.advanceStage('${c.id}')" title="Advance to next pipeline stage">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px;">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  <span>Advance</span>
                </button>
              ` : ''}
              <button class="table-action-btn" onclick="CargoModule.openEditModal('${c.id}')" title="Modify Manifest Parameters">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px;">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span>Edit</span>
              </button>
              <button class="table-action-btn btn-action-delete" onclick="CargoModule.handleDelete('${c.id}')" title="Delete Manifest Record">
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
   * Handle Create Cargo Form submission
   */
  handleCreateSubmit() {
    const id = (document.getElementById('newCargoId')?.value || '').trim();
    const containerId = (document.getElementById('newCargoContainer')?.value || '').trim();
    const cargoType = document.getElementById('newCargoType')?.value || 'Scientific Equipment';
    const description = (document.getElementById('newCargoDesc')?.value || '').trim();
    const origin = (document.getElementById('newCargoOrigin')?.value || '').trim();
    const destination = document.getElementById('newCargoDestination')?.value || 'Maitri Station';
    const weight = parseInt(document.getElementById('newCargoWeight')?.value, 10) || 100;
    const status = document.getElementById('newCargoStatus')?.value || 'Ready for Dispatch';
    const expectedArrival = document.getElementById('newCargoEta')?.value || '';

    if (!id || !containerId || !description || !origin) {
      if (typeof PolarUI !== 'undefined' && typeof PolarUI.showToast === 'function') {
        PolarUI.showToast('Please provide all mandatory cargo manifest fields.', 'warning', 'Validation Warning');
      }
      return;
    }

    const existing = getItemById(STORAGE_KEYS.cargo, id);
    if (existing) {
      if (typeof PolarUI !== 'undefined' && typeof PolarUI.showToast === 'function') {
        PolarUI.showToast(`Manifest ID "${id}" is already registered.`, 'error', 'Duplicate Manifest');
      }
      return;
    }

    const now = new Date();
    const lastUpdated = now.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

    const newCargo = {
      id,
      containerId,
      cargoType,
      description,
      origin,
      destination,
      weight,
      status,
      expectedArrival,
      lastUpdated
    };

    // Persist via centralized storage
    addData(STORAGE_KEYS.cargo, newCargo);

    // Record meaningful operational activity
    this.recordActivity(`Cargo manifest ${id} (${containerId}, ${weight} kg) logged for ${destination}.`, 'cargo');

    // Close modal
    if (typeof PolarUI !== 'undefined' && typeof PolarUI.closeModal === 'function') {
      PolarUI.closeModal('createCargoModal');
    }

    document.getElementById('createCargoForm')?.reset();

    this.loadData();
    this.filterAndSearch();
    this.renderPipelineRibbon();
    this.renderMetrics();

    if (typeof PolarUI !== 'undefined' && typeof PolarUI.showToast === 'function') {
      PolarUI.showToast(`Manifest ${id} successfully registered.`, 'success', 'Cargo Dispatched');
    }
  },

  /**
   * Open Edit Cargo Modal
   * @param {string} id 
   */
  openEditModal(id) {
    const c = getItemById(STORAGE_KEYS.cargo, id);
    if (!c) return;

    document.getElementById('editCargoId').value = c.id;
    document.getElementById('editCargoIdDisplay').value = c.id;
    document.getElementById('editCargoContainer').value = c.containerId || '';
    document.getElementById('editCargoType').value = c.cargoType || 'Scientific Equipment';
    document.getElementById('editCargoWeight').value = c.weight || 0;
    document.getElementById('editCargoDesc').value = c.description || '';
    document.getElementById('editCargoOrigin').value = c.origin || '';
    document.getElementById('editCargoDestination').value = c.destination || 'Maitri Station';
    document.getElementById('editCargoStatus').value = c.status || 'In Transit';
    document.getElementById('editCargoEta').value = c.expectedArrival || '';

    if (typeof PolarUI !== 'undefined' && typeof PolarUI.openModal === 'function') {
      PolarUI.openModal('editCargoModal');
    }
  },

  /**
   * Handle Edit Cargo Form submission
   */
  handleEditSubmit() {
    const id = document.getElementById('editCargoId')?.value;
    if (!id) return;

    const now = new Date();
    const lastUpdated = now.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

    const updates = {
      containerId: (document.getElementById('editCargoContainer')?.value || '').trim(),
      cargoType: document.getElementById('editCargoType')?.value,
      weight: parseInt(document.getElementById('editCargoWeight')?.value, 10) || 0,
      description: (document.getElementById('editCargoDesc')?.value || '').trim(),
      origin: (document.getElementById('editCargoOrigin')?.value || '').trim(),
      destination: document.getElementById('editCargoDestination')?.value,
      status: document.getElementById('editCargoStatus')?.value,
      expectedArrival: document.getElementById('editCargoEta')?.value || '',
      lastUpdated
    };

    updateData(STORAGE_KEYS.cargo, id, updates);

    this.recordActivity(`Cargo ${id} updated (Status: ${updates.status}, Dest: ${updates.destination}).`, 'cargo');

    if (typeof PolarUI !== 'undefined' && typeof PolarUI.closeModal === 'function') {
      PolarUI.closeModal('editCargoModal');
    }

    this.loadData();
    this.filterAndSearch();
    this.renderPipelineRibbon();
    this.renderMetrics();

    if (typeof PolarUI !== 'undefined' && typeof PolarUI.showToast === 'function') {
      PolarUI.showToast(`Manifest ${id} updated.`, 'success', 'Manifest Saved');
    }
  },

  /**
   * Quick action: Advance cargo along the 5-stage pipeline
   * Processing -> Ready for Dispatch -> In Transit -> At Station -> Delivered
   * @param {string} id 
   */
  advanceStage(id) {
    const c = getItemById(STORAGE_KEYS.cargo, id);
    if (!c) return;

    const pipelineOrder = [
      'Processing',
      'Ready for Dispatch',
      'In Transit',
      'At Station',
      'Delivered'
    ];

    let currentIdx = pipelineOrder.indexOf(c.status);
    if (c.status === 'Delayed') currentIdx = 1; // Delayed defaults forward to In Transit

    const nextIdx = Math.min(pipelineOrder.length - 1, currentIdx + 1);
    const nextStatus = pipelineOrder[nextIdx];

    const now = new Date();
    const lastUpdated = now.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

    updateData(STORAGE_KEYS.cargo, id, { status: nextStatus, lastUpdated });

    this.recordActivity(`Cargo ${id} advanced to "${nextStatus}".`, 'cargo');

    this.loadData();
    this.filterAndSearch();
    this.renderPipelineRibbon();
    this.renderMetrics();

    if (typeof PolarUI !== 'undefined' && typeof PolarUI.showToast === 'function') {
      PolarUI.showToast(`Manifest ${id} advanced to ${nextStatus}.`, 'success', 'Pipeline Advanced');
    }
  },

  /**
   * Delete cargo manifest by ID
   * @param {string} id 
   */
  handleDelete(id) {
    const c = getItemById(STORAGE_KEYS.cargo, id);
    const desc = c ? c.description : id;

    const confirmed = typeof confirm === 'function' ?
      confirm(`Delete manifest record "${id}: ${desc}"?`) :
      true;

    if (!confirmed) return;

    deleteData(STORAGE_KEYS.cargo, id);
    this.recordActivity(`Cargo manifest ${id} deleted from logistics records.`, 'cargo');

    this.loadData();
    this.filterAndSearch();
    this.renderPipelineRibbon();
    this.renderMetrics();

    if (typeof PolarUI !== 'undefined' && typeof PolarUI.showToast === 'function') {
      PolarUI.showToast(`Manifest ${id} deleted.`, 'info', 'Manifest Removed');
    }
  },

  /**
   * Helper to append an entry to polar_activity in storage
   */
  recordActivity(message, type = 'cargo') {
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
    CargoModule.init();
  });
}

// Global window exposure
if (typeof window !== 'undefined') {
  window.CargoModule = CargoModule;
}

// Node.js module export support for automated verification test suites
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CargoModule;
}
