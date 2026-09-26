/**
 * POLAR-OPS — Integrated Polar Expedition Operations & Logistics Platform
 * Station Inventory & Critical Life Support Reserves Module (Phase 3 Core Operations)
 *
 * Implements dynamic health evaluation, shortage alerting, quick stock adjustment,
 * full CRUD, search, filter, and operational activity tracking.
 */

const InventoryModule = {
  inventory: [],
  filteredInventory: [],

  /**
   * Initialize module, attach event listeners, and render initial dataset
   */
  init() {
    this.loadData();
    this.setupListeners();
    this.render();
    console.log('[POLAR-OPS] Station Inventory Module initialized with', this.inventory.length, 'SKUs.');
  },

  /**
   * Calculate inventory health status dynamically from actual quantity vs minimum threshold
   * @param {number} quantity 
   * @param {number} minimumRequired 
   * @returns {'Optimal'|'Adequate'|'Low Stock'|'Critical'|'Out of Stock'}
   */
  calculateHealth(quantity, minimumRequired) {
    const q = Number(quantity) || 0;
    const min = Number(minimumRequired) || 0;

    if (q === 0) {
      return 'Out of Stock';
    } else if (q <= min * 0.25) {
      return 'Critical';
    } else if (q <= min) {
      return 'Low Stock';
    } else if (q < min * 1.5) {
      return 'Adequate';
    }
    return 'Optimal';
  },

  /**
   * Load inventory from storage and dynamically evaluate health for all records
   */
  loadData() {
    if (typeof getData === 'function' && typeof STORAGE_KEYS !== 'undefined') {
      const raw = getData(STORAGE_KEYS.inventory) || [];
      this.inventory = raw.map((item) => {
        const evaluatedStatus = this.calculateHealth(item.quantity, item.minimumRequired);
        return {
          ...item,
          status: evaluatedStatus
        };
      });
    } else {
      this.inventory = [];
    }
    this.filteredInventory = [...this.inventory];
  },

  /**
   * Setup UI controls and form submission listeners
   */
  setupListeners() {
    if (typeof document === 'undefined') return;

    // Search input listener
    const searchInput = document.getElementById('inventorySearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.filterAndSearch());
    }

    // Category filter dropdown
    const catFilter = document.getElementById('inventoryCategoryFilter');
    if (catFilter) {
      catFilter.addEventListener('change', () => this.filterAndSearch());
    }

    // Station filter dropdown
    const stationFilter = document.getElementById('inventoryStationFilter');
    if (stationFilter) {
      stationFilter.addEventListener('change', () => this.filterAndSearch());
    }

    // Health filter dropdown
    const healthFilter = document.getElementById('inventoryHealthFilter');
    if (healthFilter) {
      healthFilter.addEventListener('change', () => this.filterAndSearch());
    }

    // Reset filters button
    const resetBtn = document.getElementById('inventoryResetFiltersBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (catFilter) catFilter.value = 'ALL';
        if (stationFilter) stationFilter.value = 'ALL';
        if (healthFilter) healthFilter.value = 'ALL';
        this.filterAndSearch();
      });
    }

    // Filter Critical Only quick button in alert banner
    const criticalOnlyBtn = document.getElementById('filterCriticalOnlyBtn');
    if (criticalOnlyBtn) {
      criticalOnlyBtn.addEventListener('click', () => {
        if (healthFilter) healthFilter.value = 'Critical';
        this.filterAndSearch();
      });
    }

    // Refresh telemetry button
    const refreshBtn = document.getElementById('inventoryRefreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadData();
        this.render();
        if (typeof PolarUI !== 'undefined' && typeof PolarUI.showToast === 'function') {
          PolarUI.showToast('Inventory life-support reserves synchronized.', 'info', 'Inventory Sync');
        }
      });
    }

    // Create Inventory Form submission
    const createForm = document.getElementById('createInventoryForm');
    if (createForm) {
      createForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleCreateSubmit();
      });
    }

    // Edit Inventory Form submission
    const editForm = document.getElementById('editInventoryForm');
    if (editForm) {
      editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleEditSubmit();
      });
    }

    // Quick Stock Adjustment Form submission
    const quickStockForm = document.getElementById('quickStockForm');
    if (quickStockForm) {
      quickStockForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleQuickStockSubmit();
      });
    }

    // Pre-populate unique ID when opening Create Modal
    const openCreateBtn = document.getElementById('openCreateInvBtn');
    if (openCreateBtn) {
      openCreateBtn.addEventListener('click', () => {
        const idInput = document.getElementById('newInvId');
        if (idInput && (!idInput.value || idInput.value.trim() === '')) {
          const nextIndex = this.inventory.length + 1001;
          idInput.value = `INV-${nextIndex}`;
        }
      });
    }
  },

  /**
   * Filter and search client-side dataset and update table
   */
  filterAndSearch() {
    if (typeof document === 'undefined') return;

    const query = (document.getElementById('inventorySearchInput')?.value || '').toLowerCase().trim();
    const category = document.getElementById('inventoryCategoryFilter')?.value || 'ALL';
    const station = document.getElementById('inventoryStationFilter')?.value || 'ALL';
    const health = document.getElementById('inventoryHealthFilter')?.value || 'ALL';

    this.filteredInventory = this.inventory.filter((item) => {
      // Text search match across itemName, id, category, location
      const matchesQuery = !query ||
        (item.itemName && item.itemName.toLowerCase().includes(query)) ||
        (item.id && item.id.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query)) ||
        (item.location && item.location.toLowerCase().includes(query));

      // Category match
      const matchesCategory = category === 'ALL' || item.category === category;

      // Station location match
      const matchesStation = station === 'ALL' ||
        (item.location && item.location.toLowerCase().includes(station.toLowerCase()));

      // Health status match
      const matchesHealth = health === 'ALL' || item.status === health;

      return matchesQuery && matchesCategory && matchesStation && matchesHealth;
    });

    this.renderTableOnly();
  },

  /**
   * Render alert banner, summary metrics, and table
   */
  render() {
    this.renderAlerts();
    this.renderMetrics();
    this.renderTableOnly();
  },

  /**
   * Check for critical shortages and update alert banner
   */
  renderAlerts() {
    if (typeof document === 'undefined') return;

    const alertBanner = document.getElementById('inventoryAlertBanner');
    const alertMsg = document.getElementById('inventoryAlertMessage');

    const criticalItems = this.inventory.filter((i) => i.status === 'Critical' || i.status === 'Out of Stock');

    if (!alertBanner) return;

    if (criticalItems.length > 0) {
      alertBanner.style.display = 'flex';
      const names = criticalItems.slice(0, 2).map((i) => i.itemName).join(', ');
      const extra = criticalItems.length > 2 ? ` (+${criticalItems.length - 2} more)` : '';
      if (alertMsg) {
        alertMsg.textContent = `${criticalItems.length} mission-critical SKU(s) at or below emergency buffer threshold: ${names}${extra}.`;
      }
    } else {
      alertBanner.style.display = 'none';
    }
  },

  /**
   * Compute and update summary statistics
   */
  renderMetrics() {
    if (typeof document === 'undefined') return;

    const total = this.inventory.length;
    const optimal = this.inventory.filter((i) => i.status === 'Optimal').length;
    const low = this.inventory.filter((i) => i.status === 'Low Stock').length;
    const critical = this.inventory.filter((i) => i.status === 'Critical' || i.status === 'Out of Stock').length;

    const elTotal = document.getElementById('statTotalItems');
    const elOptimal = document.getElementById('statOptimalItems');
    const elLow = document.getElementById('statLowItems');
    const elCritical = document.getElementById('statCriticalItems');

    if (elTotal) elTotal.textContent = total;
    if (elOptimal) elOptimal.textContent = optimal;
    if (elLow) elLow.textContent = low;
    if (elCritical) elCritical.textContent = critical;
  },

  /**
   * Render table rows and update result count chip
   */
  renderTableOnly() {
    if (typeof document === 'undefined') return;

    const tbody = document.getElementById('inventoryTableBody');
    const emptyState = document.getElementById('inventoryEmptyState');
    const countChip = document.getElementById('inventoryResultCount');

    if (countChip) {
      countChip.textContent = `Showing ${this.filteredInventory.length} of ${this.inventory.length} items`;
    }

    if (!tbody) return;

    if (this.filteredInventory.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = this.filteredInventory.map((item) => {
      const q = Number(item.quantity) || 0;
      const min = Number(item.minimumRequired) || 1;
      const ratio = Math.round((q / min) * 100);

      // Meter styling
      let fillClass = 'optimal';
      if (item.status === 'Critical' || item.status === 'Out of Stock') fillClass = 'critical';
      else if (item.status === 'Low Stock') fillClass = 'low';
      else if (item.status === 'Adequate') fillClass = 'adequate';

      const barWidth = Math.min(100, Math.max(0, (ratio / 2))); // 200% = 100% bar width

      // Health badge mapping
      let badgeClass = 'badge-operational';
      if (item.status === 'Critical' || item.status === 'Out of Stock') badgeClass = 'badge-critical';
      else if (item.status === 'Low Stock') badgeClass = 'badge-delayed';
      else if (item.status === 'Adequate') badgeClass = 'badge-in-transit';

      return `
        <tr data-inv-id="${item.id}">
          <td>
            <div class="cell-mono" style="font-weight: 700;">${item.id}</div>
          </td>
          <td>
            <div style="font-weight: 600; color: var(--polar-ice-white);">${item.itemName}</div>
            <div style="font-size: var(--text-xs); color: var(--polar-text-muted); margin-top: 2px;">
              Category: ${item.category || 'General'}
            </div>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 6px; font-size: var(--text-xs);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px; color: var(--polar-cyan-primary); flex-shrink: 0;">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>${item.location || 'Station Storage'}</span>
            </div>
          </td>
          <td>
            <span style="font-family: var(--font-mono); font-weight: 700; color: ${q <= min ? '#fca5a5' : 'var(--polar-ice-white)'}; font-size: var(--text-sm);">
              ${q.toLocaleString()}
            </span>
            <span style="font-size: var(--text-xs); color: var(--polar-text-muted);"> ${item.unit || 'Units'}</span>
          </td>
          <td>
            <span style="font-family: var(--font-mono); color: var(--polar-text-secondary); font-size: var(--text-xs);">
              ${min.toLocaleString()} ${item.unit || 'Units'}
            </span>
          </td>
          <td>
            <div class="stock-level-meter">
              <div class="stock-meter-track">
                <div class="stock-meter-fill ${fillClass}" style="width: ${barWidth}%;"></div>
              </div>
              <span class="stock-meter-ratio">${ratio}%</span>
            </div>
          </td>
          <td>
            <span class="badge ${badgeClass}">
              <span class="badge-dot"></span>
              ${item.status}
            </span>
          </td>
          <td style="text-align: right;">
            <div class="table-actions-group" style="justify-content: flex-end;">
              <button class="table-action-btn btn-action-primary" onclick="InventoryModule.openQuickStockModal('${item.id}')" title="Adjust / Log Consumption">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px;">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
                <span>Stock &plusmn;</span>
              </button>
              <button class="table-action-btn" onclick="InventoryModule.openEditModal('${item.id}')" title="Modify Item Parameters">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px;">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span>Edit</span>
              </button>
              <button class="table-action-btn btn-action-delete" onclick="InventoryModule.handleDelete('${item.id}')" title="Delete Inventory Item">
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
   * Handle Create Inventory Item submission
   */
  handleCreateSubmit() {
    const id = (document.getElementById('newInvId')?.value || '').trim();
    const itemName = (document.getElementById('newInvName')?.value || '').trim();
    const category = document.getElementById('newInvCategory')?.value || 'Fuel';
    const unit = (document.getElementById('newInvUnit')?.value || '').trim();
    const location = (document.getElementById('newInvLocation')?.value || '').trim();
    const quantity = parseInt(document.getElementById('newInvQuantity')?.value, 10) || 0;
    const minimumRequired = parseInt(document.getElementById('newInvMinRequired')?.value, 10) || 1;

    if (!id || !itemName || !unit || !location) {
      if (typeof PolarUI !== 'undefined' && typeof PolarUI.showToast === 'function') {
        PolarUI.showToast('Please provide all mandatory inventory fields.', 'warning', 'Validation Warning');
      }
      return;
    }

    const existing = getItemById(STORAGE_KEYS.inventory, id);
    if (existing) {
      if (typeof PolarUI !== 'undefined' && typeof PolarUI.showToast === 'function') {
        PolarUI.showToast(`SKU ID "${id}" is already registered.`, 'error', 'Duplicate SKU');
      }
      return;
    }

    const now = new Date();
    const lastUpdated = now.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
    const status = this.calculateHealth(quantity, minimumRequired);

    const newItem = {
      id,
      itemName,
      category,
      quantity,
      unit,
      minimumRequired,
      status,
      location,
      lastUpdated
    };

    addData(STORAGE_KEYS.inventory, newItem);

    this.recordActivity(`Inventory item ${id} ("${itemName}") registered at ${location}.`, 'inventory');

    if (typeof PolarUI !== 'undefined' && typeof PolarUI.closeModal === 'function') {
      PolarUI.closeModal('createInventoryModal');
    }

    document.getElementById('createInventoryForm')?.reset();

    this.loadData();
    this.filterAndSearch();
    this.renderAlerts();
    this.renderMetrics();

    if (typeof PolarUI !== 'undefined' && typeof PolarUI.showToast === 'function') {
      PolarUI.showToast(`Item ${id} added to inventory.`, 'success', 'Inventory Registered');
    }
  },

  /**
   * Open Edit Inventory Item Modal
   * @param {string} id 
   */
  openEditModal(id) {
    const item = getItemById(STORAGE_KEYS.inventory, id);
    if (!item) return;

    document.getElementById('editInvId').value = item.id;
    document.getElementById('editInvIdDisplay').value = item.id;
    document.getElementById('editInvName').value = item.itemName || '';
    document.getElementById('editInvCategory').value = item.category || 'Fuel';
    document.getElementById('editInvUnit').value = item.unit || '';
    document.getElementById('editInvLocation').value = item.location || '';
    document.getElementById('editInvQuantity').value = item.quantity || 0;
    document.getElementById('editInvMinRequired').value = item.minimumRequired || 1;

    if (typeof PolarUI !== 'undefined' && typeof PolarUI.openModal === 'function') {
      PolarUI.openModal('editInventoryModal');
    }
  },

  /**
   * Handle Edit Inventory Form submission
   */
  handleEditSubmit() {
    const id = document.getElementById('editInvId')?.value;
    if (!id) return;

    const quantity = parseInt(document.getElementById('editInvQuantity')?.value, 10) || 0;
    const minimumRequired = parseInt(document.getElementById('editInvMinRequired')?.value, 10) || 1;
    const status = this.calculateHealth(quantity, minimumRequired);

    const now = new Date();
    const lastUpdated = now.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

    const updates = {
      itemName: (document.getElementById('editInvName')?.value || '').trim(),
      category: document.getElementById('editInvCategory')?.value,
      unit: (document.getElementById('editInvUnit')?.value || '').trim(),
      location: (document.getElementById('editInvLocation')?.value || '').trim(),
      quantity,
      minimumRequired,
      status,
      lastUpdated
    };

    updateData(STORAGE_KEYS.inventory, id, updates);

    this.recordActivity(`Inventory ${id} updated: reserve is now ${quantity} ${updates.unit} (${status}).`, 'inventory');

    if (typeof PolarUI !== 'undefined' && typeof PolarUI.closeModal === 'function') {
      PolarUI.closeModal('editInventoryModal');
    }

    this.loadData();
    this.filterAndSearch();
    this.renderAlerts();
    this.renderMetrics();

    if (typeof PolarUI !== 'undefined' && typeof PolarUI.showToast === 'function') {
      PolarUI.showToast(`Item ${id} updated.`, 'success', 'Inventory Saved');
    }
  },

  /**
   * Open Quick Stock Adjustment Modal
   * @param {string} id 
   */
  openQuickStockModal(id) {
    const item = getItemById(STORAGE_KEYS.inventory, id);
    if (!item) return;

    document.getElementById('quickStockInvId').value = item.id;
    document.getElementById('quickStockItemName').textContent = item.itemName;
    document.getElementById('quickStockItemMeta').textContent = `${item.id} • Current Stock: ${item.quantity} ${item.unit} (Min: ${item.minimumRequired})`;
    document.getElementById('quickStockAdjustment').value = '';

    if (typeof PolarUI !== 'undefined' && typeof PolarUI.openModal === 'function') {
      PolarUI.openModal('quickStockModal');
    }
  },

  /**
   * Handle Quick Stock Adjustment Form submission
   */
  handleQuickStockSubmit() {
    const id = document.getElementById('quickStockInvId')?.value;
    const delta = parseInt(document.getElementById('quickStockAdjustment')?.value, 10);

    if (!id || isNaN(delta)) {
      if (typeof PolarUI !== 'undefined' && typeof PolarUI.showToast === 'function') {
        PolarUI.showToast('Please enter a valid numeric stock adjustment value.', 'warning', 'Invalid Input');
      }
      return;
    }

    const item = getItemById(STORAGE_KEYS.inventory, id);
    if (!item) return;

    const newQuantity = Math.max(0, (Number(item.quantity) || 0) + delta);
    const newStatus = this.calculateHealth(newQuantity, item.minimumRequired);

    const now = new Date();
    const lastUpdated = now.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

    updateData(STORAGE_KEYS.inventory, id, {
      quantity: newQuantity,
      status: newStatus,
      lastUpdated
    });

    const actionWord = delta >= 0 ? `replenished by +${delta}` : `consumed by ${delta}`;
    this.recordActivity(`Stock for ${id} (${item.itemName}) ${actionWord} ${item.unit} (New total: ${newQuantity}).`, 'inventory');

    if (typeof PolarUI !== 'undefined' && typeof PolarUI.closeModal === 'function') {
      PolarUI.closeModal('quickStockModal');
    }

    this.loadData();
    this.filterAndSearch();
    this.renderAlerts();
    this.renderMetrics();

    if (typeof PolarUI !== 'undefined' && typeof PolarUI.showToast === 'function') {
      PolarUI.showToast(`Stock updated to ${newQuantity} ${item.unit} (${newStatus}).`, 'success', 'Stock Adjusted');
    }
  },

  /**
   * Delete inventory item by ID
   * @param {string} id 
   */
  handleDelete(id) {
    const item = getItemById(STORAGE_KEYS.inventory, id);
    const name = item ? item.itemName : id;

    const confirmed = typeof confirm === 'function' ?
      confirm(`Delete inventory item "${id}: ${name}" from life-support registry?`) :
      true;

    if (!confirmed) return;

    deleteData(STORAGE_KEYS.inventory, id);
    this.recordActivity(`Inventory item ${id} deleted from life-support reserves.`, 'inventory');

    this.loadData();
    this.filterAndSearch();
    this.renderAlerts();
    this.renderMetrics();

    if (typeof PolarUI !== 'undefined' && typeof PolarUI.showToast === 'function') {
      PolarUI.showToast(`Item ${id} deleted.`, 'info', 'Item Removed');
    }
  },

  /**
   * Helper to append an entry to polar_activity in storage
   */
  recordActivity(message, type = 'inventory') {
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
    InventoryModule.init();
  });
}

// Global window exposure
if (typeof window !== 'undefined') {
  window.InventoryModule = InventoryModule;
}

// Node.js module export support for automated verification test suites
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InventoryModule;
}
