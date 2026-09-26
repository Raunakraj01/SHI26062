/**
 * POLAR-OPS — Integrated Polar Expedition Operations & Logistics Platform
 * Emergency Incident & Rapid Response Module (Phase 6 / Final Prototype)
 */

const EmergencyModule = {
  initialized: false,
  emergencies: [],
  filteredEmergencies: [],

  init() {
    if (typeof PolarStorage !== 'undefined') {
      PolarStorage.init();
    }
    this.loadData();
    this.setupListeners();
    this.render();
    this.initialized = true;
    console.log('[POLAR-OPS] Emergency Module initialized with', this.emergencies.length, 'incidents.');
  },

  loadData() {
    if (typeof PolarStorage !== 'undefined') {
      this.emergencies = PolarStorage.getAll(STORAGE_KEYS.emergencies) || [];
    } else {
      this.emergencies = [];
    }
    this.filteredEmergencies = [...this.emergencies];
  },

  setupListeners() {
    const searchInput = document.getElementById('emergencySearchInput');
    const severityFilter = document.getElementById('emergencySeverityFilter');
    const statusFilter = document.getElementById('emergencyStatusFilter');
    const resetBtn = document.getElementById('emergencyResetFiltersBtn');
    const refreshBtn = document.getElementById('emergencyRefreshBtn');

    if (searchInput) {
      searchInput.addEventListener('input', () => this.filterAndSearch());
    }
    if (severityFilter) {
      severityFilter.addEventListener('change', () => this.filterAndSearch());
    }
    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.filterAndSearch());
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (severityFilter) severityFilter.value = 'ALL';
        if (statusFilter) statusFilter.value = 'ALL';
        this.filterAndSearch();
      });
    }
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadData();
        this.render();
        if (typeof PolarUI !== 'undefined' && PolarUI.showToast) {
          PolarUI.showToast('Emergency incident telemetry synchronized.', 'info');
        }
      });
    }

    // Modal forms
    const createForm = document.getElementById('createEmergencyForm');
    if (createForm) {
      createForm.addEventListener('submit', (e) => this.handleCreateSubmit(e));
    }

    const editForm = document.getElementById('editEmergencyForm');
    if (editForm) {
      editForm.addEventListener('submit', (e) => this.handleEditSubmit(e));
    }
  },

  filterAndSearch() {
    const query = (document.getElementById('emergencySearchInput')?.value || '').toLowerCase().trim();
    const severity = document.getElementById('emergencySeverityFilter')?.value || 'ALL';
    const status = document.getElementById('emergencyStatusFilter')?.value || 'ALL';

    this.filteredEmergencies = this.emergencies.filter(emg => {
      // Severity filter
      if (severity !== 'ALL' && emg.severity !== severity) return false;

      // Status filter
      if (status !== 'ALL' && emg.status !== status) return false;

      // Text search
      if (query) {
        const matchId = (emg.id || '').toLowerCase().includes(query);
        const matchTitle = (emg.title || '').toLowerCase().includes(query);
        const matchType = (emg.type || '').toLowerCase().includes(query);
        const matchLoc = (emg.location || '').toLowerCase().includes(query);
        const matchTeam = (emg.responseTeam || '').toLowerCase().includes(query);
        const matchDesc = (emg.description || '').toLowerCase().includes(query);

        if (!matchId && !matchTitle && !matchType && !matchLoc && !matchTeam && !matchDesc) {
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
    const active = this.emergencies.filter(e => e.status !== 'Resolved').length;
    const critical = this.emergencies.filter(e => e.severity === 'CRITICAL' && e.status !== 'Resolved').length;
    const inProgress = this.emergencies.filter(e => e.status === 'Response In Progress').length;
    const resolved = this.emergencies.filter(e => e.status === 'Resolved').length;

    const elActive = document.getElementById('statActiveEmergencies');
    const elCrit = document.getElementById('statCriticalEmergencies');
    const elProg = document.getElementById('statInProgressEmergencies');
    const elRes = document.getElementById('statResolvedEmergencies');

    if (elActive) elActive.textContent = active;
    if (elCrit) elCrit.textContent = critical;
    if (elProg) elProg.textContent = inProgress;
    if (elRes) elRes.textContent = resolved;
  },

  renderTableOnly() {
    const tbody = document.getElementById('emergenciesTableBody');
    const emptyState = document.getElementById('emergenciesEmptyState');
    const countChip = document.getElementById('emergencyResultCount');

    if (countChip) {
      countChip.textContent = `Showing ${this.filteredEmergencies.length} of ${this.emergencies.length} incidents`;
    }

    if (!tbody) return;
    tbody.innerHTML = '';

    if (this.filteredEmergencies.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    this.filteredEmergencies.forEach(emg => {
      const tr = document.createElement('tr');

      // Severity badge styling
      let sevBadgeClass = 'badge-neutral';
      let isPulse = false;
      if (emg.severity === 'CRITICAL') {
        sevBadgeClass = 'badge-emergency';
        isPulse = true;
      } else if (emg.severity === 'HIGH') {
        sevBadgeClass = 'badge-amber';
      } else if (emg.severity === 'MEDIUM') {
        sevBadgeClass = 'badge-planned';
      }

      // Status badge styling
      let statusBadgeClass = 'badge-neutral';
      if (emg.status === 'Acknowledged') statusBadgeClass = 'badge-planned';
      else if (emg.status === 'Response In Progress') statusBadgeClass = 'badge-amber';
      else if (emg.status === 'Resolved') statusBadgeClass = 'badge-operational';

      const escapedId = this.escapeHtml(emg.id);
      const escapedTitle = this.escapeHtml(emg.title);
      const escapedType = this.escapeHtml(emg.type);
      const escapedLoc = this.escapeHtml(emg.location);
      const escapedTeam = this.escapeHtml(emg.responseTeam || 'SAR Command');
      const escapedStatus = this.escapeHtml(emg.status);
      const personnelCount = emg.affectedPersonnel || 0;

      tr.innerHTML = `
        <td style="font-family: var(--font-mono); font-weight: 600; color: ${emg.severity === 'CRITICAL' ? 'var(--status-red)' : 'var(--polar-cyan-primary)'};">${escapedId}</td>
        <td>
          <div style="font-weight: 600; color: var(--polar-text-primary);">${escapedTitle}</div>
          <div style="font-size: 11px; color: var(--polar-text-muted);">${escapedType}</div>
        </td>
        <td>
          <div style="font-size: var(--text-xs); color: var(--polar-text-secondary);">${escapedLoc}</div>
          <div style="font-size: 11px; color: ${personnelCount > 0 ? 'var(--status-red)' : 'var(--polar-text-muted)'}; font-weight: 600;">
            ${personnelCount} crew affected
          </div>
        </td>
        <td>
          <span class="badge ${sevBadgeClass}">
            <span class="badge-dot ${isPulse ? 'pulse' : ''}"></span>
            ${emg.severity}
          </span>
        </td>
        <td>
          <span class="badge ${statusBadgeClass}">
            <span class="badge-dot"></span>
            ${escapedStatus}
          </span>
        </td>
        <td style="font-size: var(--text-xs); color: var(--polar-text-secondary);">${escapedTeam}</td>
        <td style="text-align: right; white-space: nowrap;">
          <button class="btn btn-secondary btn-sm" style="padding: 3px 7px; font-size: 11px; margin-right: 4px;" onclick="EmergencyModule.advanceStatus('${escapedId}')" title="Advance Protocol State">
            Advance
          </button>
          <button class="btn btn-secondary btn-sm" style="padding: 3px 7px; font-size: 11px; margin-right: 4px;" onclick="EmergencyModule.openViewModal('${escapedId}')" title="Inspect Incident Dossier">
            View
          </button>
          <button class="btn btn-secondary btn-sm" style="padding: 3px 7px; font-size: 11px; margin-right: 4px;" onclick="EmergencyModule.openEditModal('${escapedId}')" title="Edit Parameters">
            Edit
          </button>
          <button class="btn btn-danger btn-sm" style="padding: 3px 7px; font-size: 11px;" onclick="EmergencyModule.handleDelete('${escapedId}')" title="Delete Incident Record">
            &times;
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });
  },

  advanceStatus(id) {
    const emg = this.emergencies.find(e => e.id === id);
    if (!emg) return;

    const stages = ['Reported', 'Acknowledged', 'Response In Progress', 'Resolved'];
    const currentIndex = stages.indexOf(emg.status);

    if (currentIndex === -1 || currentIndex >= stages.length - 1) {
      if (typeof PolarUI !== 'undefined') {
        PolarUI.showToast(`Incident ${id} is already in Resolved status.`, 'info');
      }
      return;
    }

    const nextStatus = stages[currentIndex + 1];

    if (typeof PolarStorage !== 'undefined') {
      PolarStorage.update(STORAGE_KEYS.emergencies, id, { status: nextStatus });
      this.recordActivity(`Advanced emergency ${id} status to: ${nextStatus}`);
    }

    this.loadData();
    this.render();

    if (typeof PolarUI !== 'undefined') {
      PolarUI.showToast(`Emergency ${id} advanced to ${nextStatus}.`, 'success');
    }
  },

  handleCreateSubmit(e) {
    e.preventDefault();
    const idInput = document.getElementById('newEmergencyId');
    const titleInput = document.getElementById('newEmergencyTitle');
    const typeInput = document.getElementById('newEmergencyType');
    const sevInput = document.getElementById('newEmergencySeverity');
    const locInput = document.getElementById('newEmergencyLocation');
    const perInput = document.getElementById('newEmergencyPersonnel');
    const teamInput = document.getElementById('newEmergencyTeam');
    const eqInput = document.getElementById('newEmergencyEquipment');
    const descInput = document.getElementById('newEmergencyDesc');

    const id = idInput?.value.trim().toUpperCase();
    const title = titleInput?.value.trim();
    const type = typeInput?.value.trim();
    const severity = sevInput?.value || 'HIGH';
    const location = locInput?.value.trim();
    const affectedPersonnel = parseInt(perInput?.value || '0', 10);
    const responseTeam = teamInput?.value.trim() || 'Polar Emergency Duty Team';
    const requiredEquipment = eqInput?.value.trim() || 'Standard Field First Aid & Comms Unit';
    const description = descInput?.value.trim();

    if (!id || !title || !type || !location) {
      if (typeof PolarUI !== 'undefined') PolarUI.showToast('Please fill all mandatory emergency fields.', 'error');
      return;
    }

    if (this.emergencies.some(e => e.id === id)) {
      if (typeof PolarUI !== 'undefined') PolarUI.showToast(`Incident ID ${id} already exists.`, 'error');
      return;
    }

    const newEmergency = {
      id,
      title,
      type,
      location,
      severity,
      affectedPersonnel,
      reportedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
      status: 'Reported',
      responseTeam,
      requiredEquipment,
      description
    };

    if (typeof PolarStorage !== 'undefined') {
      PolarStorage.create(STORAGE_KEYS.emergencies, newEmergency);
      this.recordActivity(`Declared emergency ${id} (${severity}): ${title} at ${location}`);

      // Generate urgent notification if CRITICAL or HIGH
      if (severity === 'CRITICAL' || severity === 'HIGH') {
        const notif = {
          id: 'NOTIF-' + Date.now(),
          title: `${severity} INCIDENT: ${title}`,
          message: `${location} — SAR team ${responseTeam} dispatched.`,
          type: severity === 'CRITICAL' ? 'alert' : 'warning',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
          read: false
        };
        PolarStorage.create(STORAGE_KEYS.notifications, notif);
      }
    }

    this.loadData();
    this.render();

    if (typeof PolarUI !== 'undefined') {
      PolarUI.closeModal('createEmergencyModal');
      PolarUI.showToast(`Emergency ${id} broadcast to mission control network.`, 'error', 'Incident Broadcast');
    }

    const form = document.getElementById('createEmergencyForm');
    if (form) form.reset();
  },

  openEditModal(id) {
    const emg = this.emergencies.find(e => e.id === id);
    if (!emg) return;

    const idHidden = document.getElementById('editEmergencyId');
    const idDisplay = document.getElementById('editEmergencyIdDisplay');
    const titleInput = document.getElementById('editEmergencyTitle');
    const sevInput = document.getElementById('editEmergencySeverity');
    const statusInput = document.getElementById('editEmergencyStatus');
    const locInput = document.getElementById('editEmergencyLocation');
    const perInput = document.getElementById('editEmergencyPersonnel');
    const teamInput = document.getElementById('editEmergencyTeam');
    const eqInput = document.getElementById('editEmergencyEquipment');
    const descInput = document.getElementById('editEmergencyDesc');

    if (idHidden) idHidden.value = emg.id;
    if (idDisplay) idDisplay.value = emg.id;
    if (titleInput) titleInput.value = emg.title;
    if (sevInput) sevInput.value = emg.severity;
    if (statusInput) statusInput.value = emg.status;
    if (locInput) locInput.value = emg.location;
    if (perInput) perInput.value = emg.affectedPersonnel || 0;
    if (teamInput) teamInput.value = emg.responseTeam || '';
    if (eqInput) eqInput.value = emg.requiredEquipment || '';
    if (descInput) descInput.value = emg.description || '';

    if (typeof PolarUI !== 'undefined') {
      PolarUI.openModal('editEmergencyModal');
    }
  },

  handleEditSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('editEmergencyId')?.value;
    if (!id) return;

    const changes = {
      title: document.getElementById('editEmergencyTitle')?.value.trim(),
      severity: document.getElementById('editEmergencySeverity')?.value,
      status: document.getElementById('editEmergencyStatus')?.value,
      location: document.getElementById('editEmergencyLocation')?.value.trim(),
      affectedPersonnel: parseInt(document.getElementById('editEmergencyPersonnel')?.value || '0', 10),
      responseTeam: document.getElementById('editEmergencyTeam')?.value.trim(),
      requiredEquipment: document.getElementById('editEmergencyEquipment')?.value.trim(),
      description: document.getElementById('editEmergencyDesc')?.value.trim()
    };

    if (typeof PolarStorage !== 'undefined') {
      PolarStorage.update(STORAGE_KEYS.emergencies, id, changes);
      this.recordActivity(`Modified parameters for emergency ${id}`);
    }

    this.loadData();
    this.render();

    if (typeof PolarUI !== 'undefined') {
      PolarUI.closeModal('editEmergencyModal');
      PolarUI.showToast(`Emergency ${id} parameters updated.`, 'success');
    }
  },

  handleDelete(id) {
    if (!confirm(`Are you sure you want to permanently delete emergency record ${id}?`)) {
      return;
    }

    if (typeof PolarStorage !== 'undefined') {
      PolarStorage.delete(STORAGE_KEYS.emergencies, id);
      this.recordActivity(`Deleted emergency incident ${id}`);
    }

    this.loadData();
    this.render();

    if (typeof PolarUI !== 'undefined') {
      PolarUI.showToast(`Emergency ${id} deleted.`, 'info');
    }
  },

  openViewModal(id) {
    const emg = this.emergencies.find(e => e.id === id);
    if (!emg) return;

    const idEl = document.getElementById('viewEmergencyId');
    const titleEl = document.getElementById('viewEmergencyTitle');
    const contentEl = document.getElementById('viewEmergencyContent');

    if (idEl) idEl.textContent = emg.id;
    if (titleEl) titleEl.textContent = emg.title;

    const stages = ['Reported', 'Acknowledged', 'Response In Progress', 'Resolved'];
    const activeIdx = stages.indexOf(emg.status);

    const stepNodes = stages.map((stg, i) => {
      const isPastOrCurrent = i <= activeIdx;
      return `
        <div class="emergency-node ${isPastOrCurrent ? 'active' : ''}">
          <span class="emergency-node-num">${i + 1}</span>
          <span>${stg}</span>
        </div>
      `;
    }).join('');

    if (contentEl) {
      contentEl.innerHTML = `
        <div style="margin-bottom: 16px;">
          <div style="font-size: 11px; text-transform: uppercase; color: var(--polar-text-muted); margin-bottom: 8px;">Incident Escalation State</div>
          <div class="emergency-lifecycle-track">
            ${stepNodes}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 16px;">
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--polar-border-subtle); padding: 10px; border-radius: 4px;">
            <div style="font-size: 11px; color: var(--polar-text-muted); text-transform: uppercase;">Hazard Type</div>
            <div style="font-size: 13px; font-weight: 600; color: var(--polar-text-primary); margin-top: 2px;">${this.escapeHtml(emg.type)}</div>
          </div>
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--polar-border-subtle); padding: 10px; border-radius: 4px;">
            <div style="font-size: 11px; color: var(--polar-text-muted); text-transform: uppercase;">Location / Coordinates</div>
            <div style="font-size: 13px; font-weight: 600; color: var(--polar-cyan-primary); margin-top: 2px;">${this.escapeHtml(emg.location)}</div>
          </div>
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--polar-border-subtle); padding: 10px; border-radius: 4px;">
            <div style="font-size: 11px; color: var(--polar-text-muted); text-transform: uppercase;">Severity Tier</div>
            <div style="font-size: 13px; font-weight: 600; color: ${emg.severity === 'CRITICAL' ? 'var(--status-red)' : 'var(--status-amber)'}; margin-top: 2px;">${this.escapeHtml(emg.severity)}</div>
          </div>
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--polar-border-subtle); padding: 10px; border-radius: 4px;">
            <div style="font-size: 11px; color: var(--polar-text-muted); text-transform: uppercase;">Affected Crew</div>
            <div style="font-size: 13px; font-weight: 600; color: var(--status-red); margin-top: 2px;">${emg.affectedPersonnel || 0} Members</div>
          </div>
        </div>

        <div style="background: rgba(14,24,42,0.6); border: 1px solid var(--polar-border-subtle); padding: 14px; border-radius: 6px; margin-bottom: 16px;">
          <div style="font-size: 12px; font-weight: 600; color: var(--polar-text-primary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">SAR Dispatch Details</div>
          <div style="font-size: 12px; margin-bottom: 6px; color: var(--polar-text-secondary);">
            <strong style="color: var(--polar-text-primary);">Response Team:</strong> ${this.escapeHtml(emg.responseTeam || 'None assigned')}
          </div>
          <div style="font-size: 12px; margin-bottom: 6px; color: var(--polar-text-secondary);">
            <strong style="color: var(--polar-text-primary);">Equipment Deployed:</strong> ${this.escapeHtml(emg.requiredEquipment || 'None specified')}
          </div>
          <div style="font-size: 12px; color: var(--polar-text-secondary); line-height: 1.5; margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px;">
            ${this.escapeHtml(emg.description || 'No situation briefing recorded.')}
          </div>
        </div>

        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button class="btn btn-secondary btn-sm" onclick="EmergencyModule.advanceStatus('${this.escapeHtml(emg.id)}'); EmergencyModule.openViewModal('${this.escapeHtml(emg.id)}')">
            Advance Protocol Stage
          </button>
          <button class="btn btn-secondary btn-sm" onclick="PolarUI.closeModal('viewEmergencyModal'); EmergencyModule.openEditModal('${this.escapeHtml(emg.id)}')">
            Edit Incident
          </button>
        </div>
      `;
    }

    if (typeof PolarUI !== 'undefined') {
      PolarUI.openModal('viewEmergencyModal');
    }
  },

  recordActivity(description) {
    if (typeof PolarStorage === 'undefined') return;
    try {
      const act = {
        id: 'ACT-' + Date.now(),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
        type: 'emergency',
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
    EmergencyModule.init();
  });
}

if (typeof window !== 'undefined') {
  window.EmergencyModule = EmergencyModule;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EmergencyModule;
}
