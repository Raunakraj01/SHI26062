/**
 * POLAR-OPS — Integrated Polar Expedition Operations & Logistics Platform
 * Personnel Movement & Roster Module (Phase 5 / Final Prototype)
 */

const PersonnelModule = {
  initialized: false,
  personnel: [],
  filteredPersonnel: [],

  init() {
    if (typeof PolarStorage !== 'undefined') {
      PolarStorage.init();
    }
    this.loadData();
    this.setupListeners();
    this.render();
    this.initialized = true;
    console.log('[POLAR-OPS] Personnel Module initialized with', this.personnel.length, 'crew records.');
  },

  loadData() {
    if (typeof PolarStorage !== 'undefined') {
      this.personnel = PolarStorage.getAll(STORAGE_KEYS.personnel) || [];
    } else {
      this.personnel = [];
    }
    this.filteredPersonnel = [...this.personnel];
  },

  setupListeners() {
    const searchInput = document.getElementById('personnelSearchInput');
    const statusFilter = document.getElementById('personnelStatusFilter');
    const expeditionFilter = document.getElementById('personnelExpeditionFilter');
    const resetBtn = document.getElementById('personnelResetFiltersBtn');
    const refreshBtn = document.getElementById('personnelRefreshBtn');

    if (searchInput) {
      searchInput.addEventListener('input', () => this.filterAndSearch());
    }
    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.filterAndSearch());
    }
    if (expeditionFilter) {
      expeditionFilter.addEventListener('change', () => this.filterAndSearch());
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (statusFilter) statusFilter.value = 'ALL';
        if (expeditionFilter) expeditionFilter.value = 'ALL';
        this.filterAndSearch();
      });
    }
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadData();
        this.render();
        if (typeof PolarUI !== 'undefined' && PolarUI.showToast) {
          PolarUI.showToast('Personnel telemetry synchronized with local storage.', 'info');
        }
      });
    }

    // Modal forms
    const createForm = document.getElementById('createPersonnelForm');
    if (createForm) {
      createForm.addEventListener('submit', (e) => this.handleCreateSubmit(e));
    }

    const editForm = document.getElementById('editPersonnelForm');
    if (editForm) {
      editForm.addEventListener('submit', (e) => this.handleEditSubmit(e));
    }
  },

  filterAndSearch() {
    const query = (document.getElementById('personnelSearchInput')?.value || '').toLowerCase().trim();
    const status = document.getElementById('personnelStatusFilter')?.value || 'ALL';
    const expedition = document.getElementById('personnelExpeditionFilter')?.value || 'ALL';

    this.filteredPersonnel = this.personnel.filter(person => {
      // Movement Status filter
      if (status !== 'ALL' && person.movementStatus !== status) return false;

      // Expedition filter
      if (expedition !== 'ALL' && person.expeditionId !== expedition) return false;

      // Search query
      if (query) {
        const matchId = (person.id || '').toLowerCase().includes(query);
        const matchName = (person.name || '').toLowerCase().includes(query);
        const matchRole = (person.role || '').toLowerCase().includes(query);
        const matchExp = (person.expeditionId || '').toLowerCase().includes(query);
        const matchLoc = (person.currentLocation || '').toLowerCase().includes(query);
        const matchStatus = (person.movementStatus || '').toLowerCase().includes(query);

        if (!matchId && !matchName && !matchRole && !matchExp && !matchLoc && !matchStatus) {
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
    const total = this.personnel.length;
    const atStation = this.personnel.filter(p => p.movementStatus === 'At Station' || p.movementStatus === 'At Base').length;
    const inTransit = this.personnel.filter(p => p.movementStatus === 'In Transit' || p.movementStatus === 'Returning').length;
    const verified = this.personnel.filter(p => p.emergencyContactStatus === 'Verified').length;

    const elTotal = document.getElementById('statTotalPersonnel');
    const elStation = document.getElementById('statAtStationPersonnel');
    const elTransit = document.getElementById('statInTransitPersonnel');
    const elVerified = document.getElementById('statVerifiedPersonnel');

    if (elTotal) elTotal.textContent = total;
    if (elStation) elStation.textContent = atStation;
    if (elTransit) elTransit.textContent = inTransit;
    if (elVerified) elVerified.textContent = verified;
  },

  renderTableOnly() {
    const tbody = document.getElementById('personnelTableBody');
    const emptyState = document.getElementById('personnelEmptyState');
    const countChip = document.getElementById('personnelResultCount');

    if (countChip) {
      countChip.textContent = `Showing ${this.filteredPersonnel.length} of ${this.personnel.length} crew members`;
    }

    if (!tbody) return;
    tbody.innerHTML = '';

    if (this.filteredPersonnel.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    this.filteredPersonnel.forEach(person => {
      const tr = document.createElement('tr');

      // Status badge styling
      let statusBadgeClass = 'badge-operational';
      if (person.movementStatus === 'At Base') statusBadgeClass = 'badge-planned';
      else if (person.movementStatus === 'In Transit') statusBadgeClass = 'badge-amber';
      else if (person.movementStatus === 'Returning') statusBadgeClass = 'badge-neutral';
      else if (person.movementStatus === 'On Leave') statusBadgeClass = 'badge-neutral';

      const escapedId = this.escapeHtml(person.id);
      const escapedName = this.escapeHtml(person.name);
      const escapedRole = this.escapeHtml(person.role);
      const escapedExp = this.escapeHtml(person.expeditionId);
      const escapedLoc = this.escapeHtml(person.currentLocation);
      const escapedStatus = this.escapeHtml(person.movementStatus);
      const checkinTime = person.lastCheckIn || 'Pending Ping';

      // Check-in status dot
      const isRecent = checkinTime.includes('2026') || checkinTime.includes('UTC');
      const dotColor = isRecent ? 'var(--status-green)' : 'var(--status-amber)';

      tr.innerHTML = `
        <td style="font-family: var(--font-mono); font-weight: 600; color: var(--polar-cyan-primary);">${escapedId}</td>
        <td>
          <div style="font-weight: 600; color: var(--polar-text-primary);">${escapedName}</div>
          <div style="font-size: 11px; color: var(--polar-text-muted);">${escapedRole}</div>
        </td>
        <td>
          <span style="font-family: var(--font-mono); font-size: 11px; color: var(--polar-cyan-primary); background: rgba(0,217,255,0.06); padding: 2px 6px; border-radius: 3px; border: 1px solid var(--polar-border-subtle);">${escapedExp}</span>
        </td>
        <td style="font-size: var(--text-xs); color: var(--polar-text-secondary);">${escapedLoc}</td>
        <td>
          <span class="badge ${statusBadgeClass}">
            <span class="badge-dot"></span>
            ${escapedStatus}
          </span>
        </td>
        <td style="font-size: 11px; font-family: var(--font-mono); color: var(--polar-text-secondary); white-space: nowrap;">
          <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background-color: ${dotColor}; margin-right: 5px;"></span>
          ${checkinTime}
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <button class="btn btn-secondary btn-sm" style="padding: 3px 7px; font-size: 11px; margin-right: 4px;" onclick="PersonnelModule.logCheckIn('${escapedId}')" title="Log Satellite Check-in Ping">
            Ping
          </button>
          <button class="btn btn-secondary btn-sm" style="padding: 3px 7px; font-size: 11px; margin-right: 4px;" onclick="PersonnelModule.openViewModal('${escapedId}')" title="Inspect Crew Dossier">
            View
          </button>
          <button class="btn btn-secondary btn-sm" style="padding: 3px 7px; font-size: 11px; margin-right: 4px;" onclick="PersonnelModule.openEditModal('${escapedId}')" title="Edit Deployment">
            Edit
          </button>
          <button class="btn btn-danger btn-sm" style="padding: 3px 7px; font-size: 11px;" onclick="PersonnelModule.handleDelete('${escapedId}')" title="De-enlist Crew Member">
            &times;
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });
  },

  logCheckIn(id) {
    const person = this.personnel.find(p => p.id === id);
    if (!person) return;

    const now = new Date();
    const formatted = now.toISOString().replace('T', ' ').substring(0, 16) + ' UTC';

    if (typeof PolarStorage !== 'undefined') {
      PolarStorage.update(STORAGE_KEYS.personnel, id, { lastCheckIn: formatted });
      this.recordActivity(`Satellite check-in ping recorded for ${person.name} (${id})`);
    }

    this.loadData();
    this.render();

    if (typeof PolarUI !== 'undefined') {
      PolarUI.showToast(`Check-in ping verified for ${person.name}.`, 'success');
    }
  },

  handleCreateSubmit(e) {
    e.preventDefault();
    const idInput = document.getElementById('newPersonnelId');
    const nameInput = document.getElementById('newPersonnelName');
    const roleInput = document.getElementById('newPersonnelRole');
    const expInput = document.getElementById('newPersonnelExpedition');
    const locInput = document.getElementById('newPersonnelLocation');
    const statusInput = document.getElementById('newPersonnelStatus');
    const contactInput = document.getElementById('newPersonnelContact');

    const id = idInput?.value.trim().toUpperCase();
    const name = nameInput?.value.trim();
    const role = roleInput?.value.trim();
    const expeditionId = expInput?.value || 'EXP-43-BHR';
    const currentLocation = locInput?.value.trim();
    const movementStatus = statusInput?.value || 'At Station';
    const emergencyContactStatus = contactInput?.value || 'Verified';

    if (!id || !name || !role || !currentLocation) {
      if (typeof PolarUI !== 'undefined') PolarUI.showToast('Please fill all required crew fields.', 'error');
      return;
    }

    if (this.personnel.some(p => p.id === id)) {
      if (typeof PolarUI !== 'undefined') PolarUI.showToast(`Crew ID ${id} is already registered.`, 'error');
      return;
    }

    const newCrew = {
      id,
      name,
      role,
      expeditionId,
      currentLocation,
      movementStatus,
      lastCheckIn: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
      emergencyContactStatus
    };

    if (typeof PolarStorage !== 'undefined') {
      PolarStorage.create(STORAGE_KEYS.personnel, newCrew);
      this.recordActivity(`Enlisted crew member ${name} (${id}) to mission ${expeditionId}`);
    }

    this.loadData();
    this.render();

    if (typeof PolarUI !== 'undefined') {
      PolarUI.closeModal('createPersonnelModal');
      PolarUI.showToast(`Crew member ${name} enlisted successfully.`, 'success');
    }

    const form = document.getElementById('createPersonnelForm');
    if (form) form.reset();
  },

  openEditModal(id) {
    const person = this.personnel.find(p => p.id === id);
    if (!person) return;

    const idHidden = document.getElementById('editPersonnelId');
    const idDisplay = document.getElementById('editPersonnelIdDisplay');
    const nameInput = document.getElementById('editPersonnelName');
    const roleInput = document.getElementById('editPersonnelRole');
    const expInput = document.getElementById('editPersonnelExpedition');
    const locInput = document.getElementById('editPersonnelLocation');
    const statusInput = document.getElementById('editPersonnelStatus');
    const contactInput = document.getElementById('editPersonnelContact');

    if (idHidden) idHidden.value = person.id;
    if (idDisplay) idDisplay.value = person.id;
    if (nameInput) nameInput.value = person.name;
    if (roleInput) roleInput.value = person.role;
    if (expInput) expInput.value = person.expeditionId;
    if (locInput) locInput.value = person.currentLocation;
    if (statusInput) statusInput.value = person.movementStatus;
    if (contactInput) contactInput.value = person.emergencyContactStatus || 'Verified';

    if (typeof PolarUI !== 'undefined') {
      PolarUI.openModal('editPersonnelModal');
    }
  },

  handleEditSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('editPersonnelId')?.value;
    if (!id) return;

    const changes = {
      name: document.getElementById('editPersonnelName')?.value.trim(),
      role: document.getElementById('editPersonnelRole')?.value.trim(),
      expeditionId: document.getElementById('editPersonnelExpedition')?.value.trim(),
      currentLocation: document.getElementById('editPersonnelLocation')?.value.trim(),
      movementStatus: document.getElementById('editPersonnelStatus')?.value,
      emergencyContactStatus: document.getElementById('editPersonnelContact')?.value
    };

    if (typeof PolarStorage !== 'undefined') {
      PolarStorage.update(STORAGE_KEYS.personnel, id, changes);
      this.recordActivity(`Updated deployment record for ${changes.name} (${id})`);
    }

    this.loadData();
    this.render();

    if (typeof PolarUI !== 'undefined') {
      PolarUI.closeModal('editPersonnelModal');
      PolarUI.showToast(`Personnel record ${id} updated.`, 'success');
    }
  },

  handleDelete(id) {
    const person = this.personnel.find(p => p.id === id);
    const name = person ? person.name : id;

    if (!confirm(`Are you sure you want to de-enlist crew member ${name} (${id})?`)) {
      return;
    }

    if (typeof PolarStorage !== 'undefined') {
      PolarStorage.delete(STORAGE_KEYS.personnel, id);
      this.recordActivity(`De-enlisted crew member ${name} (${id})`);
    }

    this.loadData();
    this.render();

    if (typeof PolarUI !== 'undefined') {
      PolarUI.showToast(`Crew member ${id} removed from roster.`, 'info');
    }
  },

  openViewModal(id) {
    const person = this.personnel.find(p => p.id === id);
    if (!person) return;

    const idEl = document.getElementById('viewPersonnelId');
    const titleEl = document.getElementById('viewPersonnelTitle');
    const contentEl = document.getElementById('viewPersonnelContent');

    if (idEl) idEl.textContent = person.id;
    if (titleEl) titleEl.textContent = person.name;

    if (contentEl) {
      contentEl.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 16px;">
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--polar-border-subtle); padding: 10px; border-radius: 4px;">
            <div style="font-size: 11px; color: var(--polar-text-muted); text-transform: uppercase;">Specialization / Role</div>
            <div style="font-size: 13px; font-weight: 600; color: var(--polar-text-primary); margin-top: 2px;">${this.escapeHtml(person.role)}</div>
          </div>
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--polar-border-subtle); padding: 10px; border-radius: 4px;">
            <div style="font-size: 11px; color: var(--polar-text-muted); text-transform: uppercase;">Assigned Mission</div>
            <div style="font-size: 13px; font-weight: 600; color: var(--polar-cyan-primary); margin-top: 2px;">${this.escapeHtml(person.expeditionId)}</div>
          </div>
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--polar-border-subtle); padding: 10px; border-radius: 4px;">
            <div style="font-size: 11px; color: var(--polar-text-muted); text-transform: uppercase;">Deployment Location</div>
            <div style="font-size: 13px; font-weight: 600; color: var(--status-cyan); margin-top: 2px;">${this.escapeHtml(person.currentLocation)}</div>
          </div>
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--polar-border-subtle); padding: 10px; border-radius: 4px;">
            <div style="font-size: 11px; color: var(--polar-text-muted); text-transform: uppercase;">Movement Status</div>
            <div style="font-size: 13px; font-weight: 600; color: var(--status-green); margin-top: 2px;">${this.escapeHtml(person.movementStatus)}</div>
          </div>
        </div>

        <div style="background: rgba(14,24,42,0.6); border: 1px solid var(--polar-border-subtle); padding: 14px; border-radius: 6px; margin-bottom: 16px;">
          <div style="font-size: 12px; font-weight: 600; color: var(--polar-text-primary); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Safety &amp; Telemetry</div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; color: var(--polar-text-secondary);">
            <span>Last Telemetry Check-in:</span>
            <span style="font-family: var(--font-mono); color: var(--polar-cyan-primary);">${person.lastCheckIn || 'Pending Ping'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--polar-text-secondary);">
            <span>Emergency Medical Contact:</span>
            <span style="color: var(--status-green); font-weight: 600;">${person.emergencyContactStatus || 'Verified'}</span>
          </div>
        </div>

        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button class="btn btn-secondary btn-sm" onclick="PersonnelModule.logCheckIn('${this.escapeHtml(person.id)}'); PersonnelModule.openViewModal('${this.escapeHtml(person.id)}')">
            Update Check-in Ping
          </button>
          <button class="btn btn-secondary btn-sm" onclick="PolarUI.closeModal('viewPersonnelModal'); PersonnelModule.openEditModal('${this.escapeHtml(person.id)}')">
            Edit Profile
          </button>
        </div>
      `;
    }

    if (typeof PolarUI !== 'undefined') {
      PolarUI.openModal('viewPersonnelModal');
    }
  },

  recordActivity(description) {
    if (typeof PolarStorage === 'undefined') return;
    try {
      const act = {
        id: 'ACT-' + Date.now(),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
        type: 'personnel',
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
    PersonnelModule.init();
  });
}

if (typeof window !== 'undefined') {
  window.PersonnelModule = PersonnelModule;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PersonnelModule;
}
