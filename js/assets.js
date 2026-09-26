/**
 * POLAR-OPS — Integrated Polar Expedition Operations & Logistics Platform
 * Asset & Equipment Maintenance Module (Phase 4 / Final Prototype)
 */

const AssetModule = {
  initialized: false,
  assets: [],
  filteredAssets: [],

  init() {
    if (typeof PolarStorage !== 'undefined') {
      PolarStorage.init();
    }
    this.loadData();
    this.setupListeners();
    this.render();
    this.initialized = true;
    console.log('[POLAR-OPS] Asset Module initialized with', this.assets.length, 'records.');
  },

  loadData() {
    if (typeof PolarStorage !== 'undefined') {
      this.assets = PolarStorage.getAll(STORAGE_KEYS.assets) || [];
    } else {
      this.assets = [];
    }
    this.filteredAssets = [...this.assets];
  },

  setupListeners() {
    const searchInput = document.getElementById('assetSearchInput');
    const categoryFilter = document.getElementById('assetCategoryFilter');
    const stationFilter = document.getElementById('assetStationFilter');
    const statusFilter = document.getElementById('assetStatusFilter');
    const resetBtn = document.getElementById('assetResetFiltersBtn');
    const refreshBtn = document.getElementById('assetsRefreshBtn');

    if (searchInput) {
      searchInput.addEventListener('input', () => this.filterAndSearch());
    }
    if (categoryFilter) {
      categoryFilter.addEventListener('change', () => this.filterAndSearch());
    }
    if (stationFilter) {
      stationFilter.addEventListener('change', () => this.filterAndSearch());
    }
    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.filterAndSearch());
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = 'ALL';
        if (stationFilter) stationFilter.value = 'ALL';
        if (statusFilter) statusFilter.value = 'ALL';
        this.filterAndSearch();
      });
    }
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadData();
        this.render();
        if (typeof PolarUI !== 'undefined' && PolarUI.showToast) {
          PolarUI.showToast('Fleet telemetry synchronized with local storage.', 'info');
        }
      });
    }

    // Modal forms
    const createForm = document.getElementById('createAssetForm');
    if (createForm) {
      createForm.addEventListener('submit', (e) => this.handleCreateSubmit(e));
    }

    const editForm = document.getElementById('editAssetForm');
    if (editForm) {
      editForm.addEventListener('submit', (e) => this.handleEditSubmit(e));
    }
  },

  filterAndSearch() {
    const query = (document.getElementById('assetSearchInput')?.value || '').toLowerCase().trim();
    const cat = document.getElementById('assetCategoryFilter')?.value || 'ALL';
    const station = document.getElementById('assetStationFilter')?.value || 'ALL';
    const status = document.getElementById('assetStatusFilter')?.value || 'ALL';

    this.filteredAssets = this.assets.filter(asset => {
      // Category filter
      if (cat !== 'ALL' && asset.category !== cat) return false;

      // Station location filter
      if (station !== 'ALL') {
        const loc = (asset.location || '').toLowerCase();
        if (!loc.includes(station.toLowerCase())) return false;
      }

      // Status filter
      if (status !== 'ALL' && asset.status !== status) return false;

      // Text search
      if (query) {
        const matchId = (asset.id || '').toLowerCase().includes(query);
        const matchName = (asset.assetName || '').toLowerCase().includes(query);
        const matchCat = (asset.category || '').toLowerCase().includes(query);
        const matchLoc = (asset.location || '').toLowerCase().includes(query);
        const matchCond = (asset.condition || '').toLowerCase().includes(query);
        const matchStatus = (asset.status || '').toLowerCase().includes(query);
        if (!matchId && !matchName && !matchCat && !matchLoc && !matchCond && !matchStatus) {
          return false;
        }
      }

      return true;
    });

    this.renderTableOnly();
  },

  render() {
    this.renderMetrics();
    this.filterAndSearch();
  },

  renderMetrics() {
    const total = this.assets.length;
    const operational = this.assets.filter(a => a.status === 'Operational').length;
    const standby = this.assets.filter(a => a.status === 'Standby').length;
    const maint = this.assets.filter(a => a.status === 'Maintenance' || a.status === 'Critical').length;

    const elTotal = document.getElementById('statTotalAssets');
    const elOp = document.getElementById('statOperationalAssets');
    const elSt = document.getElementById('statStandbyAssets');
    const elMn = document.getElementById('statMaintenanceAssets');

    if (elTotal) elTotal.textContent = total;
    if (elOp) elOp.textContent = operational;
    if (elSt) elSt.textContent = standby;
    if (elMn) elMn.textContent = maint;
  },

  renderTableOnly() {
    const tbody = document.getElementById('assetsTableBody');
    const emptyState = document.getElementById('assetsEmptyState');
    const countChip = document.getElementById('assetResultCount');

    if (countChip) {
      countChip.textContent = `Showing ${this.filteredAssets.length} of ${this.assets.length} assets`;
    }

    if (!tbody) return;
    tbody.innerHTML = '';

    if (this.filteredAssets.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    this.filteredAssets.forEach(asset => {
      const tr = document.createElement('tr');

      // Status badge styling
      let statusBadgeClass = 'badge-operational';
      if (asset.status === 'Standby') statusBadgeClass = 'badge-planned';
      else if (asset.status === 'Maintenance') statusBadgeClass = 'badge-amber';
      else if (asset.status === 'Critical') statusBadgeClass = 'badge-emergency';

      // Condition badge styling
      let condColor = 'var(--status-green)';
      if (asset.condition === 'Fair') condColor = 'var(--status-amber)';
      else if (asset.condition === 'Degraded') condColor = 'var(--status-red)';

      const escapedId = this.escapeHtml(asset.id);
      const escapedName = this.escapeHtml(asset.assetName);
      const escapedCat = this.escapeHtml(asset.category);
      const escapedLoc = this.escapeHtml(asset.location);
      const escapedCond = this.escapeHtml(asset.condition);
      const escapedStatus = this.escapeHtml(asset.status);
      const maintDate = asset.nextMaintenance || 'Not Scheduled';

      tr.innerHTML = `
        <td style="font-family: var(--font-mono); font-weight: 600; color: var(--polar-cyan-primary);">${escapedId}</td>
        <td>
          <div style="font-weight: 600; color: var(--polar-text-primary);">${escapedName}</div>
          <div style="font-size: 11px; color: var(--polar-text-muted);">Last serviced: ${asset.lastMaintenance || 'N/A'}</div>
        </td>
        <td>
          <span style="font-size: var(--text-xs); color: var(--polar-text-secondary); background: rgba(255,255,255,0.04); padding: 2px 6px; border-radius: 3px; border: 1px solid var(--polar-border-subtle);">${escapedCat}</span>
        </td>
        <td style="font-size: var(--text-xs); color: var(--polar-text-secondary);">${escapedLoc}</td>
        <td>
          <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: ${condColor};">
            <span style="width: 6px; height: 6px; border-radius: 50%; background-color: ${condColor};"></span>
            ${escapedCond}
          </span>
        </td>
        <td style="font-size: var(--text-xs); font-family: var(--font-mono); color: var(--polar-text-secondary);">${maintDate}</td>
        <td>
          <span class="badge ${statusBadgeClass}">
            <span class="badge-dot"></span>
            ${escapedStatus}
          </span>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <button class="btn btn-secondary btn-sm" style="padding: 3px 7px; font-size: 11px; margin-right: 4px;" onclick="AssetModule.openViewModal('${escapedId}')" title="Inspect Asset Dossier">
            View
          </button>
          <button class="btn btn-secondary btn-sm" style="padding: 3px 7px; font-size: 11px; margin-right: 4px;" onclick="AssetModule.openEditModal('${escapedId}')" title="Edit Parameters">
            Edit
          </button>
          <button class="btn btn-danger btn-sm" style="padding: 3px 7px; font-size: 11px;" onclick="AssetModule.handleDelete('${escapedId}')" title="De-register Asset">
            &times;
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });
  },

  handleCreateSubmit(e) {
    e.preventDefault();
    const idInput = document.getElementById('newAssetId');
    const nameInput = document.getElementById('newAssetName');
    const catInput = document.getElementById('newAssetCategory');
    const condInput = document.getElementById('newAssetCondition');
    const locInput = document.getElementById('newAssetLocation');
    const statusInput = document.getElementById('newAssetStatus');
    const nextMaintInput = document.getElementById('newAssetNextMaint');

    const id = idInput?.value.trim().toUpperCase();
    const assetName = nameInput?.value.trim();
    const category = catInput?.value;
    const condition = condInput?.value || 'Good';
    const location = locInput?.value.trim();
    const status = statusInput?.value || 'Operational';
    const nextMaintenance = nextMaintInput?.value || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];

    if (!id || !assetName || !location) {
      if (typeof PolarUI !== 'undefined') PolarUI.showToast('Please fill all mandatory fields.', 'error');
      return;
    }

    if (this.assets.some(a => a.id === id)) {
      if (typeof PolarUI !== 'undefined') PolarUI.showToast(`Asset ID ${id} already exists.`, 'error');
      return;
    }

    const newAsset = {
      id,
      assetName,
      category,
      location,
      condition,
      status,
      lastMaintenance: new Date().toISOString().split('T')[0],
      nextMaintenance
    };

    if (typeof PolarStorage !== 'undefined') {
      PolarStorage.create(STORAGE_KEYS.assets, newAsset);
      this.recordActivity(`Registered asset ${id} (${assetName}) at ${location}`);
    }

    this.loadData();
    this.render();

    if (typeof PolarUI !== 'undefined') {
      PolarUI.closeModal('createAssetModal');
      PolarUI.showToast(`Asset ${id} registered successfully.`, 'success');
    }

    const form = document.getElementById('createAssetForm');
    if (form) form.reset();
  },

  openEditModal(id) {
    const asset = this.assets.find(a => a.id === id);
    if (!asset) return;

    const idHidden = document.getElementById('editAssetId');
    const idDisplay = document.getElementById('editAssetIdDisplay');
    const nameInput = document.getElementById('editAssetName');
    const catInput = document.getElementById('editAssetCategory');
    const condInput = document.getElementById('editAssetCondition');
    const locInput = document.getElementById('editAssetLocation');
    const statusInput = document.getElementById('editAssetStatus');
    const nextMaintInput = document.getElementById('editAssetNextMaint');

    if (idHidden) idHidden.value = asset.id;
    if (idDisplay) idDisplay.value = asset.id;
    if (nameInput) nameInput.value = asset.assetName;
    if (catInput) catInput.value = asset.category;
    if (condInput) condInput.value = asset.condition;
    if (locInput) locInput.value = asset.location;
    if (statusInput) statusInput.value = asset.status;
    if (nextMaintInput) nextMaintInput.value = asset.nextMaintenance || '';

    if (typeof PolarUI !== 'undefined') {
      PolarUI.openModal('editAssetModal');
    }
  },

  handleEditSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('editAssetId')?.value;
    if (!id) return;

    const changes = {
      assetName: document.getElementById('editAssetName')?.value.trim(),
      category: document.getElementById('editAssetCategory')?.value,
      condition: document.getElementById('editAssetCondition')?.value,
      location: document.getElementById('editAssetLocation')?.value.trim(),
      status: document.getElementById('editAssetStatus')?.value,
      nextMaintenance: document.getElementById('editAssetNextMaint')?.value
    };

    if (typeof PolarStorage !== 'undefined') {
      PolarStorage.update(STORAGE_KEYS.assets, id, changes);
      this.recordActivity(`Updated telemetry & parameters for asset ${id}`);
    }

    this.loadData();
    this.render();

    if (typeof PolarUI !== 'undefined') {
      PolarUI.closeModal('editAssetModal');
      PolarUI.showToast(`Asset ${id} updated successfully.`, 'success');
    }
  },

  handleDelete(id) {
    if (!confirm(`Are you sure you want to decommission and remove asset ${id}?`)) {
      return;
    }

    if (typeof PolarStorage !== 'undefined') {
      PolarStorage.delete(STORAGE_KEYS.assets, id);
      this.recordActivity(`Decommissioned asset ${id} from fleet registry`);
    }

    this.loadData();
    this.render();

    if (typeof PolarUI !== 'undefined') {
      PolarUI.showToast(`Asset ${id} removed from fleet registry.`, 'info');
    }
  },

  openViewModal(id) {
    const asset = this.assets.find(a => a.id === id);
    if (!asset) return;

    const idEl = document.getElementById('viewAssetId');
    const titleEl = document.getElementById('viewAssetTitle');
    const contentEl = document.getElementById('viewAssetContent');

    if (idEl) idEl.textContent = asset.id;
    if (titleEl) titleEl.textContent = asset.assetName;

    if (contentEl) {
      contentEl.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 16px;">
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--polar-border-subtle); padding: 10px; border-radius: 4px;">
            <div style="font-size: 11px; color: var(--polar-text-muted); text-transform: uppercase;">Category</div>
            <div style="font-size: 13px; font-weight: 600; color: var(--polar-text-primary); margin-top: 2px;">${this.escapeHtml(asset.category)}</div>
          </div>
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--polar-border-subtle); padding: 10px; border-radius: 4px;">
            <div style="font-size: 11px; color: var(--polar-text-muted); text-transform: uppercase;">Current Station / Bay</div>
            <div style="font-size: 13px; font-weight: 600; color: var(--polar-cyan-primary); margin-top: 2px;">${this.escapeHtml(asset.location)}</div>
          </div>
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--polar-border-subtle); padding: 10px; border-radius: 4px;">
            <div style="font-size: 11px; color: var(--polar-text-muted); text-transform: uppercase;">Mechanical Condition</div>
            <div style="font-size: 13px; font-weight: 600; color: var(--status-green); margin-top: 2px;">${this.escapeHtml(asset.condition)}</div>
          </div>
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--polar-border-subtle); padding: 10px; border-radius: 4px;">
            <div style="font-size: 11px; color: var(--polar-text-muted); text-transform: uppercase;">Operational State</div>
            <div style="font-size: 13px; font-weight: 600; color: var(--status-cyan); margin-top: 2px;">${this.escapeHtml(asset.status)}</div>
          </div>
        </div>

        <div style="background: rgba(14,24,42,0.6); border: 1px solid var(--polar-border-subtle); padding: 14px; border-radius: 6px; margin-bottom: 16px;">
          <div style="font-size: 12px; font-weight: 600; color: var(--polar-text-primary); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Maintenance Telemetry</div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; color: var(--polar-text-secondary);">
            <span>Last Routine Overhaul:</span>
            <span style="font-family: var(--font-mono); color: var(--polar-text-primary);">${asset.lastMaintenance || 'N/A'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--polar-text-secondary);">
            <span>Next Inspection Due:</span>
            <span style="font-family: var(--font-mono); color: var(--status-cyan); font-weight: 600;">${asset.nextMaintenance || 'Scheduled On Demand'}</span>
          </div>
        </div>

        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button class="btn btn-secondary btn-sm" onclick="PolarUI.closeModal('viewAssetModal'); AssetModule.openEditModal('${this.escapeHtml(asset.id)}')">
            Edit Parameters
          </button>
        </div>
      `;
    }

    if (typeof PolarUI !== 'undefined') {
      PolarUI.openModal('viewAssetModal');
    }
  },

  recordActivity(description) {
    if (typeof PolarStorage === 'undefined') return;
    try {
      const act = {
        id: 'ACT-' + Date.now(),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
        type: 'asset',
        description
      };
      PolarStorage.create(STORAGE_KEYS.activities, act);
    } catch (e) {
      console.warn('[POLAR-OPS] Could not record activity:', e);
    }
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    AssetModule.init();
  });
}

if (typeof window !== 'undefined') {
  window.AssetModule = AssetModule;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AssetModule;
}
