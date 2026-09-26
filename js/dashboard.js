/**
 * POLAR-OPS — Integrated Polar Expedition Operations & Logistics Platform
 * Antarctic Expedition Command Center Controller
 *
 * Drives the full-screen mission control workspace:
 * - High-precision SVG Polar Operations Visualizer with animated route vectors & pulsing station beacons
 * - Interactive station & expedition route inspection HUD
 * - Compact horizontal mission telemetry strip with count-up animations
 * - Logistics pipeline stage diagram and incident monitor
 */

const DashboardModule = {
  initialized: false,
  clockTimer: null,
  activeHoverId: null,

  /**
   * Initialize Command Center on page load
   */
  init() {
    if (typeof STORAGE_KEYS === 'undefined' || typeof getData !== 'function') {
      console.warn('[POLAR-OPS Command Center] Storage dependencies missing. Retrying in 100ms...');
      setTimeout(() => this.init(), 100);
      return;
    }

    this.startClock();
    this.render();
    this.setupListeners();
    this.initialized = true;
    console.log('[POLAR-OPS Command Center] Antarctic Expedition Operations workspace online.');
  },

  /**
   * Live Mission UTC Clock loop
   */
  startClock() {
    if (typeof window === 'undefined') return;
    const update = () => {
      const el = document.getElementById('commandUtcClock');
      if (!el) return;
      const now = new Date();
      const yr = now.getUTCFullYear();
      const mo = String(now.getUTCMonth() + 1).padStart(2, '0');
      const da = String(now.getUTCDate()).padStart(2, '0');
      const hr = String(now.getUTCHours()).padStart(2, '0');
      const mi = String(now.getUTCMinutes()).padStart(2, '0');
      const se = String(now.getUTCSeconds()).padStart(2, '0');
      el.textContent = `${yr}.${mo}.${da} // ${hr}:${mi}:${se} UTC`;
    };
    if (typeof clearInterval === 'function' && this.clockTimer) clearInterval(this.clockTimer);
    if (typeof setInterval === 'function') {
      this.clockTimer = setInterval(update, 1000);
    }
  },

  /**
   * Re-read storage and refresh all operational sections
   * @param {boolean} notify Whether to display a toast notification
   */
  refresh(notify = false) {
    const metrics = this.getDashboardMetrics();
    this.renderMetrics(metrics);

    // Visual scanline feedback on SVG map
    const map = document.getElementById('polarOpsMapContainer');
    if (map) {
      map.classList.add('telemetry-syncing');
      setTimeout(() => map.classList.remove('telemetry-syncing'), 800);
    }

    if (notify && typeof PolarUI !== 'undefined' && typeof PolarUI.showToast === 'function') {
      PolarUI.showToast('Telemetry and operations status refreshed.', 'info', 'Mission Sync');
    }
  },

  /**
   * Setup cross-tab synchronization and manual listeners
   */
  setupListeners() {
    if (typeof window === 'undefined') return;

    // Cross-tab synchronization
    window.addEventListener('storage', (event) => {
      if (event.key && event.key.startsWith('polar_')) {
        console.log(`[POLAR-OPS Command Center] Storage key "${event.key}" updated in another tab. Syncing...`);
        this.refresh(false);
      }
    });

    // Wire up manual telemetry refresh button
    const refreshBtn = document.getElementById('dashboardRefreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.refresh(true);
      });
    }
  },

  /**
   * Retrieve and compute all operational metrics from localStorage
   * @returns {Object} Comprehensive dashboard telemetry metrics
   */
  getDashboardMetrics() {
    const expeditions = typeof getData === 'function' ? getData(STORAGE_KEYS.expeditions) : [];
    const cargo = typeof getData === 'function' ? getData(STORAGE_KEYS.cargo) : [];
    const inventory = typeof getData === 'function' ? getData(STORAGE_KEYS.inventory) : [];
    const assets = typeof getData === 'function' ? getData(STORAGE_KEYS.assets) : [];
    const personnel = typeof getData === 'function' ? getData(STORAGE_KEYS.personnel) : [];
    const emergencies = typeof getData === 'function' ? getData(STORAGE_KEYS.emergencies) : [];
    const activities = typeof getData === 'function' ? getData(STORAGE_KEYS.activity) : [];

    // 1. Expeditions Calculations
    const activeExpeditions = expeditions.filter((e) => e.status === 'Active');
    const preparingExpeditions = expeditions.filter((e) => e.status === 'Preparing');
    const delayedExpeditions = expeditions.filter((e) => e.status === 'Delayed');

    // 2. Cargo Calculations
    const cargoInTransit = cargo.filter((c) => c.status === 'In Transit');
    const cargoDelayed = cargo.filter((c) => c.status === 'Delayed');
    const cargoReady = cargo.filter((c) => c.status === 'Ready for Dispatch');
    const totalCargoWeight = cargo.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);

    // 3. Personnel Calculations (Deployed = At Station or In Transit)
    const personnelDeployed = personnel.filter(
      (p) => p.movementStatus === 'At Station' || p.movementStatus === 'In Transit'
    );
    const personnelInTransit = personnel.filter((p) => p.movementStatus === 'In Transit');
    const personnelAtBase = personnel.filter((p) => p.movementStatus === 'At Base');

    // 4. Emergencies Calculations (Active = not Resolved)
    const activeEmergencies = emergencies.filter((e) => e.status !== 'Resolved');
    const criticalEmergencies = activeEmergencies.filter((e) => e.severity === 'CRITICAL');
    const highEmergencies = activeEmergencies.filter((e) => e.severity === 'HIGH');

    // 5. Inventory Health Calculations (Derived from quantity vs minimumRequired)
    let invOptimalCount = 0;
    let invLowCount = 0;
    let invCriticalCount = 0;
    const criticalItems = [];

    inventory.forEach((item) => {
      const qty = Number(item.quantity) || 0;
      const min = Number(item.minimumRequired) || 0;

      if (qty <= min * 0.25) {
        invCriticalCount++;
        criticalItems.push(item);
      } else if (qty <= min) {
        invLowCount++;
      } else {
        invOptimalCount++;
      }
    });

    // 6. Assets Calculations
    const operationalAssets = assets.filter((a) => a.status === 'Operational');
    const maintenanceAssets = assets.filter((a) => a.status === 'Maintenance');
    const criticalAssets = assets.filter((a) => a.status === 'Critical');

    // 7. Recent Activity (sorted chronologically descending)
    const sortedActivities = [...activities].reverse();

    // 8. Rule-based Operational Insights (Deterministic)
    const insights = this.generateOperationalInsights({
      activeEmergencies,
      criticalEmergencies,
      cargoDelayed,
      criticalItems,
      invLowCount,
      maintenanceAssets,
      criticalAssets,
      personnelInTransit
    });

    return {
      raw: {
        expeditions,
        cargo,
        inventory,
        assets,
        personnel,
        emergencies,
        activities
      },
      kpi: {
        activeExpeditionsCount: activeExpeditions.length,
        totalExpeditionsCount: expeditions.length,
        preparingExpeditionsCount: preparingExpeditions.length,
        delayedExpeditionsCount: delayedExpeditions.length,

        cargoInTransitCount: cargoInTransit.length,
        cargoDelayedCount: cargoDelayed.length,
        cargoReadyCount: cargoReady.length,
        totalCargoWeight,

        personnelDeployedCount: personnelDeployed.length,
        personnelInTransitCount: personnelInTransit.length,
        totalPersonnelCount: personnel.length,

        activeEmergenciesCount: activeEmergencies.length,
        criticalEmergenciesCount: criticalEmergencies.length,
        highEmergenciesCount: highEmergencies.length
      },
      inventoryHealth: {
        optimalCount: invOptimalCount,
        lowCount: invLowCount,
        criticalCount: invCriticalCount,
        totalItems: inventory.length,
        criticalItems
      },
      assetHealth: {
        operationalCount: operationalAssets.length,
        maintenanceCount: maintenanceAssets.length,
        criticalCount: criticalAssets.length
      },
      sortedActivities,
      insights
    };
  },

  /**
   * Deterministic rule-based operational insights generator
   */
  generateOperationalInsights({
    activeEmergencies,
    criticalEmergencies,
    cargoDelayed,
    criticalItems,
    invLowCount,
    maintenanceAssets,
    criticalAssets,
    personnelInTransit
  }) {
    const list = [];

    if (criticalEmergencies.length > 0) {
      list.push({
        type: 'critical',
        headline: `CRITICAL INCIDENT: ${criticalEmergencies[0].title}`,
        detail: `Location: ${criticalEmergencies[0].location}. Response unit: ${criticalEmergencies[0].responseTeam}. SAR escalation active.`
      });
    }

    if (criticalItems.length > 0) {
      const item = criticalItems[0];
      list.push({
        type: 'critical',
        headline: `CRITICAL SHORTAGE: ${item.itemName}`,
        detail: `Current reserve is ${item.quantity} ${item.unit} (Minimum threshold: ${item.minimumRequired}). Location: ${item.location}.`
      });
    } else if (invLowCount > 0) {
      list.push({
        type: 'warning',
        headline: `INVENTORY ALERT: ${invLowCount} consumable items approaching minimum threshold`,
        detail: 'Depletion review recommended prior to winter-over transport closure.'
      });
    }

    if (cargoDelayed.length > 0) {
      const delayed = cargoDelayed[0];
      list.push({
        type: 'warning',
        headline: `SUPPLY CHAIN DELAY: Container ${delayed.containerId}`,
        detail: `Shipment of ${delayed.cargoType} en route to ${delayed.destination} is delayed. Check logistics gateway logs.`
      });
    }

    if (criticalAssets.length > 0) {
      const asset = criticalAssets[0];
      list.push({
        type: 'warning',
        headline: `ASSET ALERT: ${asset.assetName} status is ${asset.status}`,
        detail: `Location: ${asset.location}. Scheduled maintenance overdue.`
      });
    } else if (maintenanceAssets.length > 0) {
      list.push({
        type: 'info',
        headline: `SCHEDULED MAINTENANCE: ${maintenanceAssets.length} primary asset(s) under inspection`,
        detail: 'Power plant and vehicle bay maintenance progressing nominally.'
      });
    }

    if (personnelInTransit.length > 0) {
      list.push({
        type: 'info',
        headline: `PERSONNEL EN ROUTE: ${personnelInTransit.length} researcher(s) in active transit`,
        detail: 'Traverse and flight tracking telemetry active.'
      });
    }

    if (list.length === 0) {
      list.push({
        type: 'info',
        headline: 'ALL OPERATIONS NOMINAL',
        detail: 'All Antarctic and Arctic station links reporting nominal operational parameters.'
      });
    }

    return list;
  },

  /**
   * Main render orchestrator
   */
  render() {
    const metrics = this.getDashboardMetrics();
    this.renderMetrics(metrics);
  },

  /**
   * Render all dashboard components with computed metrics
   * @param {Object} metrics 
   */
  renderMetrics(metrics) {
    this.renderPolarMap(metrics.raw);
    this.renderKPICards(metrics.kpi);
    this.renderExpeditions(metrics.raw.expeditions);
    this.renderCargo(metrics.raw.cargo);
    this.renderCargoPipeline(metrics.raw.cargo);
    this.renderInventoryHealth(metrics.inventoryHealth);
    this.renderEmergencies(metrics.raw.emergencies, metrics.kpi);
    this.renderActivityTimeline(metrics.sortedActivities);
    this.renderInsights(metrics.insights);
  },

  /**
   * Render Interactive SVG Polar Operations Visualizer
   */
  renderPolarMap(raw) {
    const container = document.getElementById('polarOpsMapContainer');
    if (!container) return;

    const expeditions = raw.expeditions || [];
    const activeExp = expeditions.find((e) => e.status === 'Active') || expeditions[0] || {};

    container.innerHTML = `
      <svg class="polar-svg-map" viewBox="0 0 1000 420" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="poleGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#00e5ff" stop-opacity="0.12" />
            <stop offset="60%" stop-color="#0284c7" stop-opacity="0.04" />
            <stop offset="100%" stop-color="#070c17" stop-opacity="0" />
          </radialGradient>
          <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Polar Range Coordinate Rings (Antarctica Center approx 480, 240) -->
        <circle cx="480" cy="240" r="190" class="polar-grid-ring" />
        <circle cx="480" cy="240" r="140" class="polar-grid-ring" />
        <circle cx="480" cy="240" r="90" class="polar-grid-ring" />
        <circle cx="480" cy="240" r="40" class="polar-grid-ring" />
        <circle cx="480" cy="240" r="280" fill="url(#poleGlow)" />

        <!-- South Pole Marker & Crosshair -->
        <line x1="472" y1="240" x2="488" y2="240" stroke="#00e5ff" stroke-width="1.5" opacity="0.7" />
        <line x1="480" y1="232" x2="480" y2="248" stroke="#00e5ff" stroke-width="1.5" opacity="0.7" />
        <text x="490" y="244" class="polar-grid-label" fill="#00e5ff">SOUTH POLE 90°S</text>

        <!-- Latitude Rings Labels -->
        <text x="485" y="152" class="polar-grid-label">80°S</text>
        <text x="485" y="102" class="polar-grid-label">70°S</text>
        <text x="485" y="52" class="polar-grid-label">60°S (CONVERGENCE)</text>

        <!-- Longitude Meridian Lines -->
        <line x1="480" y1="40" x2="480" y2="400" class="polar-axis-line" />
        <line x1="280" y1="240" x2="680" y2="240" class="polar-axis-line" />
        <line x1="340" y1="100" x2="620" y2="380" class="polar-axis-line" />
        <line x1="620" y1="100" x2="340" y2="380" class="polar-axis-line" />
        <text x="485" y="395" class="polar-grid-label">0° MERIDIAN</text>
        <text x="685" y="244" class="polar-grid-label">90°E</text>
        <text x="220" y="244" class="polar-grid-label">90°W</text>

        <!-- Stylized Antarctic Coastline & Ice Shelf Wireframe -->
        <!-- Queen Maud Land, Princess Elizabeth Land, Amery, Peninsula -->
        <path class="polar-coastline" d="
          M 290,140
          C 320,120 370,130 420,135
          C 460,138 520,125 560,130
          C 600,135 640,150 670,180
          C 700,210 710,250 690,290
          C 670,330 620,360 560,370
          C 500,380 430,375 380,350
          C 330,320 290,280 270,230
          C 250,180 260,155 290,140 Z
        " />

        <!-- Amery Ice Shelf & Queen Maud Glacier Features -->
        <path class="ice-shelf-feature" d="M 640,180 Q 660,220 620,240 Q 600,200 640,180 Z" />
        <text x="615" y="215" class="polar-grid-label" style="font-size: 8px;">AMERY ICE SHELF</text>

        <path class="ice-shelf-feature" d="M 340,200 Q 330,240 370,250 Q 380,210 340,200 Z" />
        <text x="320" y="235" class="polar-grid-label" style="font-size: 8px;">SCHIRMACHER OASIS</text>

        <!-- Logistics Gateway Corridor (Cape Town / Goa Entry Link) -->
        <path d="M 120,60 Q 220,110 340,200" fill="none" stroke="rgba(6, 182, 212, 0.45)" stroke-width="1.5" stroke-dasharray="4 4" />
        <path d="M 120,60 Q 380,40 640,180" fill="none" stroke="rgba(6, 182, 212, 0.3)" stroke-width="1" stroke-dasharray="3 5" />
        
        <!-- Gateway Logistics Node -->
        <g class="station-group" id="nodeGateway" data-name="LOGISTICS GATEWAY (GOA &amp; CAPE TOWN)" data-coords="33°55'S 18°25'E" data-status="ACTIVE MARITIME INGRESS" data-info="Staging node for oceanographic vessels &amp; sub-zero cargo charters">
          <circle cx="120" cy="60" r="5" fill="#06b6d4" stroke="#ffffff" stroke-width="1.5" />
          <text x="132" y="58" class="station-label" fill="#06b6d4">GATEWAY HUB</text>
          <text x="132" y="68" class="station-sublabel">Cape Town / Goa Port</text>
        </g>

        <!-- Expedition Traverse 1: EXP-42-MAI (Active Field Mission) -->
        <path id="routeExp42" class="expedition-route-path" d="M 340,200 Q 380,250 430,300" 
              data-id="EXP-42-MAI" data-name="Maitri Atmospheric Traverse" data-progress="68%" data-team="18" data-dest="Maitri Station" />

        <!-- Moving Beacon on Active Traverse -->
        <circle cx="395" cy="265" r="4" class="route-beacon-dot">
          <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
        </circle>

        <!-- Expedition Traverse 2: EXP-43-BHR (Preparing Bedrock Drilling) -->
        <path id="routeExp43" class="expedition-route-path" d="M 640,180 Q 690,220 730,270" stroke-dasharray="4 6" opacity="0.8"
              data-id="EXP-43-BHR" data-name="43rd ISEA Bedrock Drilling" data-progress="35%" data-team="24" data-dest="Bharati Station" />

        <!-- Station Node 1: MAITRI STATION (Schirmacher Oasis, 70°45'S 11°44'E) -->
        <g class="station-group" id="nodeMaitri" data-name="MAITRI STATION" data-coords="70°45'S, 11°44'E" data-status="NOMINAL // ACTIVE" data-info="18 Personnel Deployed &bull; Life-support Nominal &bull; Active Traverse EXP-42">
          <circle cx="340" cy="200" r="6" class="station-pulse-outer" />
          <circle cx="340" cy="200" r="5" class="station-node-center" />
          <text x="250" y="196" class="station-label">MAITRI STATION</text>
          <text x="250" y="206" class="station-sublabel">70°45'S, 11°44'E &bull; ALT 117m</text>
        </g>

        <!-- Station Node 2: BHARATI STATION (Larsemann Hills, 69°24'S 76°11'E) -->
        <g class="station-group" id="nodeBharati" data-name="BHARATI STATION" data-coords="69°24'S, 76°11'E" data-status="NOMINAL // ACTIVE" data-info="24 Personnel Deployed &bull; Deep drilling operations &bull; Ingress Manifest C-101">
          <circle cx="640" cy="180" r="6" class="station-pulse-outer" />
          <circle cx="640" cy="180" r="5" class="station-node-center" />
          <text x="655" y="176" class="station-label">BHARATI STATION</text>
          <text x="655" y="186" class="station-sublabel">69°24'S, 76°11'E &bull; COASTAL</text>
        </g>

        <!-- Station Node 3: ARCTIC SECTOR INSET (HIMADRI STATION, Ny-Ålesund 78°55'N) -->
        <g class="arctic-inset-group">
          <rect x="740" y="15" width="245" height="115" class="arctic-inset-frame" />
          <text x="752" y="32" class="polar-grid-label" fill="#00e5ff" style="font-weight: 700; font-size: 9px;">ARCTIC SECTOR // SVALBARD</text>
          <line x1="740" y1="38" x2="985" y2="38" stroke="#1c2b48" stroke-width="1" />
          
          <!-- Svalbard Spitsbergen Wireframe -->
          <path d="M 830,55 C 840,48 870,45 880,60 C 890,75 870,95 850,90 C 835,85 825,65 830,55 Z" 
                fill="rgba(2, 132, 199, 0.08)" stroke="rgba(0, 229, 255, 0.4)" stroke-width="1" />

          <g class="station-group" id="nodeHimadri" data-name="HIMADRI STATION" data-coords="78°55'N, 11°56'E" data-status="NOMINAL // ARCTIC" data-info="Ny-Ålesund, Spitsbergen &bull; 8 Arctic Researchers &bull; Atmospheric Fjord Telemetry">
            <circle cx="855" cy="70" r="5" class="station-pulse-outer" style="stroke: #38bdf8;" />
            <circle cx="855" cy="70" r="4.5" class="station-node-center" style="fill: #38bdf8;" />
            <text x="866" y="68" class="station-label" style="font-size: 9.5px;">HIMADRI STATION</text>
            <text x="866" y="78" class="station-sublabel">78°55'N, 11°56'E &bull; Arctic Base</text>
          </g>
        </g>
      </svg>
    `;

    // Attach interactive SVG hover handlers
    this.setupMapInteractivity();
  },

  /**
   * Bind hover and selection interactions to SVG map elements
   */
  setupMapInteractivity() {
    const hudTitle = document.getElementById('hudTitle');
    const hudStatus = document.getElementById('hudStatus');
    const hudBody = document.getElementById('hudBody');
    if (!hudTitle || !hudBody) return;

    // Station nodes hover
    const stations = document.querySelectorAll('.station-group');
    stations.forEach((stn) => {
      stn.addEventListener('mouseenter', () => {
        const name = stn.getAttribute('data-name');
        const coords = stn.getAttribute('data-coords');
        const status = stn.getAttribute('data-status');
        const info = stn.getAttribute('data-info');

        hudTitle.textContent = name;
        hudStatus.textContent = status;
        hudStatus.style.color = 'var(--polar-cyan-primary)';
        hudBody.innerHTML = `
          <div><strong>COORDINATES:</strong> ${coords}</div>
          <div style="margin-top: 3px;"><strong>TELEMETRY:</strong> ${info}</div>
        `;
      });

      stn.addEventListener('mouseleave', () => {
        hudTitle.textContent = 'SYSTEM TELEMETRY HUD';
        hudStatus.textContent = 'READY';
        hudStatus.style.color = 'var(--status-green)';
        hudBody.textContent = 'Hover or select an operational route or station marker to inspect active mission coordinates and telemetry.';
      });
    });

    // Route paths hover
    const routes = document.querySelectorAll('.expedition-route-path');
    routes.forEach((rt) => {
      rt.addEventListener('mouseenter', () => {
        rt.classList.add('hovered');
        const id = rt.getAttribute('data-id');
        const name = rt.getAttribute('data-name');
        const dest = rt.getAttribute('data-dest');
        const progress = rt.getAttribute('data-progress');
        const team = rt.getAttribute('data-team');

        hudTitle.textContent = `TRAVERSE ${id} // ACTIVE`;
        hudStatus.textContent = `${progress} COMPLETE`;
        hudStatus.style.color = 'var(--polar-cyan-primary)';
        hudBody.innerHTML = `
          <div><strong>MISSION:</strong> ${name}</div>
          <div><strong>CORRIDOR:</strong> ${dest}</div>
          <div><strong>CREW ROSTER:</strong> ${team} Specialists &bull; <strong>WAYPOINT:</strong> Nominal</div>
        `;
      });

      rt.addEventListener('mouseleave', () => {
        rt.classList.remove('hovered');
        hudTitle.textContent = 'SYSTEM TELEMETRY HUD';
        hudStatus.textContent = 'READY';
        hudStatus.style.color = 'var(--status-green)';
        hudBody.textContent = 'Hover or select an operational route or station marker to inspect active mission coordinates and telemetry.';
      });
    });
  },

  /**
   * Animate numeric KPI count-up smoothly to actual stored values
   */
  animateKPICounter(element, targetValue) {
    if (!element) return;
    const target = Number(targetValue) || 0;

    // Check prefers-reduced-motion
    const isReduced = typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isReduced || target === 0 || typeof requestAnimationFrame !== 'function') {
      element.textContent = target;
      return;
    }

    const duration = 500;
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    const updateFrame = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(ease * target);
      element.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(updateFrame);
      } else {
        element.textContent = target;
      }
    };

    requestAnimationFrame(updateFrame);
  },

  /**
   * Render the compact horizontal mission telemetry strip
   */
  renderKPICards(kpi) {
    const container = document.getElementById('kpiCardsContainer');
    if (!container) return;

    container.innerHTML = `
      <!-- Telemetry Metric 1: Expeditions -->
      <div class="kpi-card kpi-expeditions">
        <div class="kpi-card-header">
          <div class="kpi-icon-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9 12 2"></polygon>
            </svg>
          </div>
          <span class="kpi-tag">Mission operations // [EXP-TRK]</span>
        </div>
        <div class="kpi-body">
          <div class="kpi-value" id="kpiValExpeditions" data-target="${kpi.activeExpeditionsCount}">${kpi.activeExpeditionsCount}</div>
          <div class="kpi-label">Active Expeditions</div>
        </div>
        <div class="kpi-footer">
          <span class="indicator-dot" style="background-color: var(--polar-cyan-primary);"></span>
          <span>${kpi.preparingExpeditionsCount} preparing &bull; ${kpi.totalExpeditionsCount} total missions</span>
        </div>
      </div>

      <!-- Telemetry Metric 2: Cargo Pipeline -->
      <div class="kpi-card kpi-cargo">
        <div class="kpi-card-header">
          <div class="kpi-icon-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
          </div>
          <span class="kpi-tag">Logistics pipeline // [CGO-MVT]</span>
        </div>
        <div class="kpi-body">
          <div class="kpi-value" id="kpiValCargo" data-target="${kpi.cargoInTransitCount}">${kpi.cargoInTransitCount}</div>
          <div class="kpi-label">Cargo in Transit</div>
        </div>
        <div class="kpi-footer">
          <span class="indicator-dot" style="background-color: ${kpi.cargoDelayedCount > 0 ? 'var(--status-amber)' : 'var(--status-cyan)'};"></span>
          <span>${kpi.cargoDelayedCount > 0 ? `${kpi.cargoDelayedCount} delayed &bull; ` : ''}${(kpi.totalCargoWeight / 1000).toFixed(1)}t moving</span>
        </div>
      </div>

      <!-- Telemetry Metric 3: Personnel Roster -->
      <div class="kpi-card kpi-personnel">
        <div class="kpi-card-header">
          <div class="kpi-icon-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            </svg>
          </div>
          <span class="kpi-tag">Field operations // [PRS-DEP]</span>
        </div>
        <div class="kpi-body">
          <div class="kpi-value" id="kpiValPersonnel" data-target="${kpi.personnelDeployedCount}">${kpi.personnelDeployedCount}</div>
          <div class="kpi-label">Personnel Deployed</div>
        </div>
        <div class="kpi-footer">
          <span class="indicator-dot" style="background-color: var(--status-green);"></span>
          <span>${kpi.personnelInTransitCount} en route &bull; ${kpi.totalPersonnelCount} registered</span>
        </div>
      </div>

      <!-- Telemetry Metric 4: Emergencies / SAR -->
      <div class="kpi-card kpi-emergencies ${kpi.criticalEmergenciesCount > 0 ? 'has-critical' : ''}">
        <div class="kpi-card-header">
          <div class="kpi-icon-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            </svg>
          </div>
          <span class="kpi-tag">Response status // [SAR-INC]</span>
        </div>
        <div class="kpi-body">
          <div class="kpi-value" id="kpiValEmergencies" data-target="${kpi.activeEmergenciesCount}" style="color: ${kpi.activeEmergenciesCount > 0 ? '#f87171' : 'var(--status-green)'};">
            ${kpi.activeEmergenciesCount}
          </div>
          <div class="kpi-label">Active Emergencies</div>
        </div>
        <div class="kpi-footer">
          <span class="indicator-dot" style="background-color: ${kpi.criticalEmergenciesCount > 0 ? 'var(--status-red)' : (kpi.activeEmergenciesCount > 0 ? 'var(--status-amber)' : 'var(--status-green)')};"></span>
          <span>${kpi.criticalEmergenciesCount > 0 ? `${kpi.criticalEmergenciesCount} CRITICAL ALERT` : (kpi.activeEmergenciesCount > 0 ? `${kpi.activeEmergenciesCount} under response` : 'All stations nominal')}</span>
        </div>
      </div>
    `;

    // Trigger subtle count-up animation if in active browser
    if (typeof window !== 'undefined' && typeof requestAnimationFrame === 'function') {
      this.animateKPICounter(document.getElementById('kpiValExpeditions'), kpi.activeExpeditionsCount);
      this.animateKPICounter(document.getElementById('kpiValCargo'), kpi.cargoInTransitCount);
      this.animateKPICounter(document.getElementById('kpiValPersonnel'), kpi.personnelDeployedCount);
      this.animateKPICounter(document.getElementById('kpiValEmergencies'), kpi.activeEmergenciesCount);
    }
  },

  /**
   * Render Active Operations structured monitor
   */
  renderExpeditions(expeditions) {
    const container = document.getElementById('dashboardExpeditionsList');
    if (!container) return;

    // Prioritize active and preparing expeditions
    const priorityExpeditions = [...expeditions]
      .sort((a, b) => {
        const order = { Active: 1, Preparing: 2, Delayed: 3, Planned: 4, Completed: 5 };
        return (order[a.status] || 99) - (order[b.status] || 99);
      })
      .slice(0, 3);

    if (priorityExpeditions.length === 0) {
      container.innerHTML = '<div class="polar-table-empty">No active field expeditions logged.</div>';
      return;
    }

    container.innerHTML = priorityExpeditions
      .map((exp) => {
        const statusBadgeClass = `badge-${exp.status.toLowerCase().replace(/\s+/g, '-')}`;
        const progressClass = exp.progress >= 100 ? 'completed' : (exp.status === 'Delayed' ? 'delayed' : '');

        return `
          <div class="expedition-item" data-id="${exp.id}">
            <div class="expedition-item-header">
              <div>
                <span class="expedition-name">${exp.name}</span>
                <span style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--polar-text-muted); margin-left: 0.4rem;">[${exp.id}]</span>
              </div>
              <span class="badge ${statusBadgeClass}"><span class="badge-dot"></span>${exp.status}</span>
            </div>

            <div class="expedition-meta-row">
              <span class="expedition-meta-item">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px;">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                </svg>
                ${exp.destination}
              </span>
              <span class="expedition-meta-item">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px;">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                </svg>
                Team: ${exp.teamSize} crew
              </span>
              <span class="expedition-meta-item">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px;">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                </svg>
                Return: ${exp.expectedReturn}
              </span>
            </div>

            <div class="expedition-route-track">
              <div class="progress-meta-text">
                <span>Traverse Completion</span>
                <span>${exp.progress}%</span>
              </div>
              <div class="progress-track" style="margin-top: 3px;">
                <div class="progress-fill ${progressClass}" style="width: ${Math.min(100, Math.max(0, exp.progress))}%;"></div>
              </div>
              <div class="route-nodes-bar">
                <span>Origin [Base]</span>
                <span>Waypoint Beta</span>
                <span>${exp.destination}</span>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    // Attach row hover interaction to highlight SVG route
    if (typeof container.querySelectorAll === 'function') {
      const items = container.querySelectorAll('.expedition-item');
      items.forEach((item) => {
        const expId = item.getAttribute('data-id');
        item.addEventListener('mouseenter', () => {
          const svgRoute = typeof document.querySelector === 'function' ? document.querySelector(`.expedition-route-path[data-id="${expId}"]`) : null;
          if (svgRoute && svgRoute.classList) svgRoute.classList.add('hovered');
        });
        item.addEventListener('mouseleave', () => {
          const svgRoute = typeof document.querySelector === 'function' ? document.querySelector(`.expedition-route-path[data-id="${expId}"]`) : null;
          if (svgRoute && svgRoute.classList) svgRoute.classList.remove('hovered');
        });
      });
    }
  },

  /**
   * Render Cargo Logistics Stage Flow Pipeline
   */
  renderCargoPipeline(cargoList) {
    const container = document.getElementById('cargoPipelineDiagram');
    if (!container) return;

    const baseCount = cargoList.filter((c) => c.status === 'Ready for Dispatch' || c.status === 'Processing').length;
    const transitCount = cargoList.filter((c) => c.status === 'In Transit').length;
    const stationCount = cargoList.filter((c) => c.status === 'At Station' || c.status === 'Delivered').length;
    const delayedCount = cargoList.filter((c) => c.status === 'Delayed').length;

    container.innerHTML = `
      <div class="flow-stage">
        <span class="flow-stage-count">${baseCount}</span>
        <span class="flow-stage-label">BASE STAGING</span>
      </div>
      <div class="flow-arrow">&rarr;</div>
      <div class="flow-stage">
        <span class="flow-stage-count" style="color: var(--status-cyan);">${transitCount}</span>
        <span class="flow-stage-label">IN TRANSIT</span>
      </div>
      <div class="flow-arrow">&rarr;</div>
      <div class="flow-stage">
        <span class="flow-stage-count" style="color: var(--status-green);">${stationCount}</span>
        <span class="flow-stage-label">AT STATION</span>
      </div>
      <div class="flow-arrow" style="color: var(--status-amber);">&bull;</div>
      <div class="flow-stage flow-delayed">
        <span class="flow-stage-count">${delayedCount}</span>
        <span class="flow-stage-label">DELAYED</span>
      </div>
    `;
  },

  /**
   * Render Cargo Manifest Table
   */
  renderCargo(cargoList) {
    const container = document.getElementById('dashboardCargoList');
    if (!container) return;

    const priorityCargo = [...cargoList]
      .sort((a, b) => {
        const order = { 'In Transit': 1, Delayed: 2, 'Ready for Dispatch': 3, Processing: 4, 'At Station': 5, Delivered: 6 };
        return (order[a.status] || 99) - (order[b.status] || 99);
      })
      .slice(0, 4);

    if (priorityCargo.length === 0) {
      container.innerHTML = '<div class="polar-table-empty">No active cargo manifests.</div>';
      return;
    }

    container.innerHTML = `
      <div class="cargo-table-wrapper">
        <table class="polar-table">
          <thead>
            <tr>
              <th>Container / Type</th>
              <th>Routing Corridor</th>
              <th>Weight</th>
              <th>Status</th>
              <th>ETA</th>
            </tr>
          </thead>
          <tbody>
            ${priorityCargo
              .map((c) => {
                const badgeClass = `badge-${c.status.toLowerCase().replace(/\s+/g, '-')}`;
                return `
                  <tr>
                    <td>
                      <div style="font-family: var(--font-mono); font-weight: 700; color: var(--polar-ice-white);">${c.containerId}</div>
                      <div style="font-size: 0.68rem; color: var(--polar-text-secondary);">${c.cargoType}</div>
                    </td>
                    <td>
                      <div class="cargo-route-cell">
                        <span class="cargo-route-origin">${c.origin}</span>
                        <div class="cargo-route-dest">
                          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 11px; height: 11px; color: var(--polar-cyan-primary);">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                          </svg>
                          ${c.destination}
                        </div>
                      </div>
                    </td>
                    <td class="cell-mono">${(Number(c.weight) || 0).toLocaleString()} kg</td>
                    <td>
                      <span class="badge ${badgeClass}"><span class="badge-dot"></span>${c.status}</span>
                    </td>
                    <td class="cell-mono" style="font-size: var(--text-xs);">${c.expectedArrival}</td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  /**
   * Render Station Inventory Health & Supplies
   */
  renderInventoryHealth(health) {
    const container = document.getElementById('dashboardInventoryHealth');
    if (!container) return;

    const total = health.totalItems || 1;
    const optimalPct = ((health.optimalCount / total) * 100).toFixed(1);
    const lowPct = ((health.lowCount / total) * 100).toFixed(1);
    const criticalPct = ((health.criticalCount / total) * 100).toFixed(1);

    let criticalListHtml = '';
    if (health.criticalItems.length > 0) {
      criticalListHtml = `
        <div style="margin-top: var(--space-3);">
          <div style="font-size: 0.68rem; font-weight: 700; color: var(--status-red); text-transform: uppercase; margin-bottom: var(--space-1); display: flex; align-items: center; gap: 4px;">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px;">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
            </svg>
            Items Below Minimum Reserve Threshold
          </div>
          <div class="inventory-critical-list">
            ${health.criticalItems
              .map(
                (item) => `
              <div class="inv-critical-item">
                <div class="inv-critical-info">
                  <span class="inv-critical-name">${item.itemName}</span>
                  <span class="inv-critical-loc">${item.location}</span>
                </div>
                <div class="inv-critical-stock">
                  <div>${item.quantity} ${item.unit}</div>
                  <div style="font-size: 0.62rem; color: var(--polar-text-muted);">Reserve: ${item.minimumRequired}</div>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `;
    } else {
      criticalListHtml = `
        <div style="padding: var(--space-3); text-align: center; color: var(--status-green); background: rgba(16, 185, 129, 0.05); border-radius: var(--radius-sm); border: 1px dashed var(--status-green-border); font-size: 0.72rem;">
          All station supplies and life-support consumables are above mandatory reserve limits.
        </div>
      `;
    }

    container.innerHTML = `
      <div class="inventory-segmented-bar" title="Optimal: ${optimalPct}%, Low: ${lowPct}%, Critical: ${criticalPct}%">
        <div class="seg-optimal" style="width: ${optimalPct}%;"></div>
        <div class="seg-low" style="width: ${lowPct}%;"></div>
        <div class="seg-critical" style="width: ${criticalPct}%;"></div>
      </div>

      <div class="inventory-health-summary">
        <div class="inv-health-stat stat-optimal">
          <div class="count">${health.optimalCount}</div>
          <div class="label">Optimal</div>
        </div>
        <div class="inv-health-stat stat-low">
          <div class="count">${health.lowCount}</div>
          <div class="label">Low Stock</div>
        </div>
        <div class="inv-health-stat stat-critical">
          <div class="count">${health.criticalCount}</div>
          <div class="label">Critical</div>
        </div>
      </div>
      ${criticalListHtml}
    `;
  },

  /**
   * Render Dedicated Incident Monitor & SAR Alert Area
   */
  renderEmergencies(emergencies, kpi) {
    const container = document.getElementById('dashboardEmergenciesList');
    if (!container) return;

    const activeEmergencies = emergencies.filter((e) => e.status !== 'Resolved');

    // Update Header Alert Badge
    const headerBadge = document.getElementById('headerEmergencyBadge');
    if (headerBadge) {
      if (activeEmergencies.length > 0) {
        headerBadge.textContent = `${activeEmergencies.length} ALERTS`;
        headerBadge.style.display = 'inline-flex';
      } else {
        headerBadge.textContent = `NOMINAL`;
        headerBadge.style.background = 'rgba(16, 185, 129, 0.16)';
        headerBadge.style.color = '#6ee7b7';
        headerBadge.style.borderColor = 'rgba(16, 185, 129, 0.35)';
      }
    }

    if (activeEmergencies.length === 0) {
      container.innerHTML = `
        <div class="emergency-all-clear">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <div style="font-weight: 700; font-size: 0.8rem;">ALL SECTORS NOMINAL</div>
          <div style="font-size: 0.7rem; color: var(--polar-text-muted);">No active Search &amp; Rescue or critical weather incidents reported.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="emergency-card-list">
        ${activeEmergencies
          .map((emg) => {
            const severityClass = emg.severity.toLowerCase();
            const isCritical = emg.severity === 'CRITICAL';
            return `
              <div class="emergency-alert-card ${severityClass}">
                <div class="emergency-alert-header">
                  <div class="emergency-alert-title">${emg.title}</div>
                  <span class="severity-indicator-pill ${severityClass}">
                    ${isCritical ? '<span class="severity-pulse-dot"></span>' : ''}
                    ${emg.severity}
                  </span>
                </div>
                <div class="emergency-alert-desc">${emg.description}</div>
                <div class="emergency-alert-meta" style="margin-top: var(--space-1);">
                  <span><strong>Loc:</strong> ${emg.location}</span>
                  <span><strong>Affected:</strong> ${emg.affectedPersonnel} crew</span>
                  <span><strong>Status:</strong> ${emg.status}</span>
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  },

  /**
   * Render Live Operational Event Stream
   */
  renderActivityTimeline(activities) {
    const container = document.getElementById('dashboardActivityTimeline');
    if (!container) return;

    const recent = activities.slice(0, 5);

    if (recent.length === 0) {
      container.innerHTML = '<div class="polar-table-empty">No recent activity logged.</div>';
      return;
    }

    container.innerHTML = `
      <div class="activity-timeline">
        ${recent
          .map((act) => {
            const type = act.type || 'info';
            const categoryTag = type === 'emergency' ? 'INCIDENT' : (type === 'cargo' ? 'LOGISTICS' : (type === 'personnel' ? 'PERSONNEL' : 'EXPEDITION'));
            return `
              <div class="activity-item">
                <div class="activity-node ${type}">
                  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <div class="activity-content">
                  <div class="activity-meta-tag-row">
                    <span class="activity-category-tag">[${categoryTag}]</span>
                    <span class="activity-timestamp">${act.timestamp}</span>
                  </div>
                  <div class="activity-msg">${act.message}</div>
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  },

  /**
   * Render Autonomous Operational Insights
   */
  renderInsights(insights) {
    const container = document.getElementById('dashboardInsightsList');
    if (!container) return;

    container.innerHTML = `
      <div class="insights-grid">
        ${insights
          .map(
            (ins) => `
          <div class="insight-card">
            <div class="insight-icon ${ins.type}">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${
                  ins.type === 'critical'
                    ? '<polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'
                    : ins.type === 'warning'
                    ? '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>'
                    : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>'
                }
              </svg>
            </div>
            <div class="insight-text-group">
              <div class="insight-headline">${ins.headline}</div>
              <div class="insight-detail">${ins.detail}</div>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  }
};

// Global Exposure for browser scripts
if (typeof window !== 'undefined') {
  window.DashboardModule = DashboardModule;
  document.addEventListener('DOMContentLoaded', () => {
    DashboardModule.init();
  });
}

// Node.js module export support for automated verification test runners
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DashboardModule;
}
