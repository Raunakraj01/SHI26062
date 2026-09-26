/**
 * POLAR-OPS — Integrated Polar Expedition Operations & Logistics Platform
 * Standard Master Dummy Datasets (Phase 1 Foundation & Phase 2 Core)
 *
 * Modeled for Indian Antarctic & Arctic Research Programs (NCPOR / MoES):
 * Maitri Station, Bharati Station, Himadri Station, and Gateway Logistics Nodes.
 */

// Helper to calculate inventory status dynamically based on threshold
function calculateInventoryStatus(quantity, minimumRequired) {
  if (quantity <= minimumRequired * 0.25) {
    return 'Critical';
  } else if (quantity < minimumRequired) {
    return 'Low Stock';
  } else if (quantity < minimumRequired * 1.5) {
    return 'Adequate';
  }
  return 'Optimal';
}

const dummyExpeditions = [
  {
    id: 'EXP-43-BHR',
    name: '43rd ISEA — Larsemann Hills Bedrock Drilling',
    destination: 'Bharati Station, East Antarctica',
    departureDate: '2026-11-15',
    expectedReturn: '2027-04-10',
    teamSize: 24,
    missionType: 'Deep Cryosphere Drilling & Paleoclimate Sampling',
    status: 'Preparing',
    progress: 35
  },
  {
    id: 'EXP-42-MAI',
    name: 'Maitri Atmospheric & Ozone Monitoring Traverse',
    destination: 'Maitri Station, Schirmacher Oasis',
    departureDate: '2026-01-05',
    expectedReturn: '2026-12-20',
    teamSize: 18,
    missionType: 'Atmospheric Physics & Geomagnetic Survey',
    status: 'Active',
    progress: 78
  },
  {
    id: 'EXP-ARC-26',
    name: 'Himadri High-Arctic Permafrost Dynamics',
    destination: 'Himadri Station, Ny-Ålesund, Svalbard',
    departureDate: '2026-06-01',
    expectedReturn: '2026-09-15',
    teamSize: 10,
    missionType: 'Glaciology & Marine Ecosystem Transect',
    status: 'Completed',
    progress: 100
  },
  {
    id: 'EXP-44-WNT',
    name: 'Winter-Over Critical Infrastructure Overhaul',
    destination: 'Maitri Station & Bharati Station',
    departureDate: '2026-12-01',
    expectedReturn: '2027-11-28',
    teamSize: 28,
    missionType: 'Station Engineering, Fuel Depot & Power Systems',
    status: 'Planned',
    progress: 10
  },
  {
    id: 'EXP-AMY-02',
    name: 'Amery Ice Shelf Crevasse Mapping & Radar Recon',
    destination: 'Amery Ice Shelf Forward Camp',
    departureDate: '2026-10-20',
    expectedReturn: '2027-02-15',
    teamSize: 12,
    missionType: 'Radar Topography & Ice Sheet Kinematics',
    status: 'Delayed',
    progress: 20
  }
];

const dummyCargo = [
  {
    id: 'CRG-8801',
    containerId: 'ISO-POLAR-4012',
    cargoType: 'Scientific Equipment',
    description: 'Ice Core Drill Rig Motors, Winch Assembly & Cryo-Tubes',
    origin: 'NCPOR Logistics Staging, Vasco da Gama, Goa',
    destination: 'Bharati Station',
    weight: 4850,
    status: 'In Transit',
    expectedArrival: '2026-11-28',
    lastUpdated: '2026-09-26 14:30 UTC'
  },
  {
    id: 'CRG-8802',
    containerId: 'CRYO-TANK-098',
    cargoType: 'Fuel & Energy',
    description: 'Arctic-grade Jet-A1 Kerosene & Low-pour Lubricants',
    origin: 'Cape Town Logistics Terminal, South Africa',
    destination: 'Maitri Station',
    weight: 18200,
    status: 'Processing',
    expectedArrival: '2026-12-10',
    lastUpdated: '2026-09-26 09:15 UTC'
  },
  {
    id: 'CRG-8803',
    containerId: 'MED-ENV-014',
    cargoType: 'Medical',
    description: 'High-altitude Hyperbaric Chamber & Emergency Trauma Kits',
    origin: 'Cape Town Port Gateway',
    destination: 'Bharati Station',
    weight: 620,
    status: 'Ready for Dispatch',
    expectedArrival: '2026-11-22',
    lastUpdated: '2026-09-26 16:45 UTC'
  },
  {
    id: 'CRG-8804',
    containerId: 'FOOD-DRY-330',
    cargoType: 'Food',
    description: 'Freeze-dried High-Calorie Rations & Long-term Provisions',
    origin: 'Mormugao Port Trust, Goa',
    destination: 'Maitri Station',
    weight: 7400,
    status: 'At Station',
    expectedArrival: '2026-09-20',
    lastUpdated: '2026-09-21 11:00 UTC'
  },
  {
    id: 'CRG-8805',
    containerId: 'ENG-CAT-771',
    cargoType: 'Spare Parts',
    description: 'Caterpillar 3406C Generator Overhaul Parts & Filters',
    origin: 'Cape Town Heavy Spares Warehouse',
    destination: 'Maitri Station',
    weight: 2300,
    status: 'Delivered',
    expectedArrival: '2026-09-18',
    lastUpdated: '2026-09-19 13:20 UTC'
  },
  {
    id: 'CRG-8806',
    containerId: 'SAT-COM-502',
    cargoType: 'Communication',
    description: 'Iridium Extreme High-Gain Phased Array Radome Spares',
    origin: 'Tromsø Maritime Depot, Norway',
    destination: 'Himadri Station',
    weight: 340,
    status: 'Delayed',
    expectedArrival: '2026-10-05',
    lastUpdated: '2026-09-26 18:00 UTC'
  }
];

const dummyInventory = [
  {
    id: 'INV-1001',
    itemName: 'Arctic-Grade Jet-A1 Polar Kerosene',
    category: 'Fuel',
    quantity: 14200,
    unit: 'Liters',
    minimumRequired: 6000,
    status: 'Optimal',
    location: 'Fuel Depot Tank Farm Alpha, Maitri',
    lastUpdated: '2026-09-26 08:00 UTC'
  },
  {
    id: 'INV-1002',
    itemName: 'Extreme Low-Temp Engine Oil (0W-40 Synthetic)',
    category: 'Fuel',
    quantity: 420,
    unit: 'Liters',
    minimumRequired: 500,
    status: 'Low Stock',
    location: 'Vehicle Workshop Bay 1, Bharati',
    lastUpdated: '2026-09-25 14:15 UTC'
  },
  {
    id: 'INV-1003',
    itemName: 'High-Altitude Oxygen Cylinders (40L / 200 bar)',
    category: 'Medical',
    quantity: 18,
    unit: 'Cylinders',
    minimumRequired: 20,
    status: 'Low Stock',
    location: 'Medical Ward Cryo-Bay, Maitri',
    lastUpdated: '2026-09-26 10:30 UTC'
  },
  {
    id: 'INV-1004',
    itemName: 'Sub-Zero Surgical Trauma Kits & Antibiotics Pack',
    category: 'Medical',
    quantity: 32,
    unit: 'Kits',
    minimumRequired: 15,
    status: 'Optimal',
    location: 'Infirmary Supply Vault, Bharati',
    lastUpdated: '2026-09-24 16:00 UTC'
  },
  {
    id: 'INV-1005',
    itemName: 'Vacuum-Insulated Freeze-Dried Rations (Meal Pack 5000 kcal)',
    category: 'Food',
    quantity: 840,
    unit: 'Packs',
    minimumRequired: 400,
    status: 'Optimal',
    location: 'Main Habitation Cold Store, Maitri',
    lastUpdated: '2026-09-26 12:00 UTC'
  },
  {
    id: 'INV-1006',
    itemName: 'Diamond Core Drill Bits (98mm Cryogenic)',
    category: 'Scientific Equipment',
    quantity: 8,
    unit: 'Units',
    minimumRequired: 12,
    status: 'Low Stock',
    location: 'Drilling Lab Storage, Bharati',
    lastUpdated: '2026-09-25 18:20 UTC'
  },
  {
    id: 'INV-1007',
    itemName: 'LiFePO4 Heated Polar Battery Packs (24V 200Ah)',
    category: 'Batteries',
    quantity: 3,
    unit: 'Packs',
    minimumRequired: 10,
    status: 'Critical',
    location: 'Emergency Power Shelter, Maitri',
    lastUpdated: '2026-09-26 21:00 UTC'
  },
  {
    id: 'INV-1008',
    itemName: 'Iridium Extreme Satellite Handheld Phones',
    category: 'Communication',
    quantity: 14,
    unit: 'Units',
    minimumRequired: 10,
    status: 'Adequate',
    location: 'Comms Control Tower, Bharati',
    lastUpdated: '2026-09-26 15:45 UTC'
  },
  {
    id: 'INV-1009',
    itemName: 'Crevasse Rescue Harness & Dynamic Climbing Ropes (60m)',
    category: 'Safety',
    quantity: 26,
    unit: 'Sets',
    minimumRequired: 20,
    status: 'Adequate',
    location: 'SAR Ready Room, Maitri',
    lastUpdated: '2026-09-25 09:30 UTC'
  },
  {
    id: 'INV-1010',
    itemName: 'Snowcat Track Replacement Shoes & Pins',
    category: 'Spare Parts',
    quantity: 45,
    unit: 'Units',
    minimumRequired: 40,
    status: 'Adequate',
    location: 'Heavy Machinery Garage, Bharati',
    lastUpdated: '2026-09-23 11:20 UTC'
  }
];

const dummyAssets = [
  {
    id: 'AST-3001',
    assetName: 'Kässbohrer PistenBully 300 Polar Snowcat (Vehicle PB-01)',
    category: 'Heavy Vehicles',
    location: 'Bharati Station Vehicle Bay 2',
    condition: 'Excellent',
    status: 'Operational',
    lastMaintenance: '2026-08-14',
    nextMaintenance: '2026-11-14'
  },
  {
    id: 'AST-3002',
    assetName: 'Caterpillar 3406C 250kVA Primary Diesel Generator (GEN-01)',
    category: 'Power Generation',
    location: 'Maitri Station Power House',
    condition: 'Good',
    status: 'Operational',
    lastMaintenance: '2026-09-02',
    nextMaintenance: '2026-10-02'
  },
  {
    id: 'AST-3003',
    assetName: 'Caterpillar 3406C 250kVA Secondary Diesel Generator (GEN-02)',
    category: 'Power Generation',
    location: 'Maitri Station Power House',
    condition: 'Fair',
    status: 'Maintenance',
    lastMaintenance: '2026-09-24',
    nextMaintenance: '2026-09-28'
  },
  {
    id: 'AST-3004',
    assetName: 'Iridium Multi-Line Primary Satellite Ground Station',
    category: 'Communication',
    location: 'Bharati Communications Dome',
    condition: 'Excellent',
    status: 'Operational',
    lastMaintenance: '2026-07-20',
    nextMaintenance: '2026-12-20'
  },
  {
    id: 'AST-3005',
    assetName: 'Kassbohrer Heavy Freight Polar Sledge S-04 (15 Ton)',
    category: 'Heavy Vehicles',
    location: 'Maitri Logistics Yard',
    condition: 'Good',
    status: 'Standby',
    lastMaintenance: '2026-08-30',
    nextMaintenance: '2026-11-30'
  },
  {
    id: 'AST-3006',
    assetName: 'Scintrex CG-5 Relative Micro-Gravimeter',
    category: 'Scientific Equipment',
    location: 'Larsemann Hills Field Camp',
    condition: 'Degraded',
    status: 'Critical',
    lastMaintenance: '2026-05-11',
    nextMaintenance: '2026-09-22'
  },
  {
    id: 'AST-3007',
    assetName: 'Zodiac Milpro Extreme Cold Heavy Inflatable Boat (Z-02)',
    category: 'Maritime Operations',
    location: 'Prydz Bay Coastal Slipway, Bharati',
    condition: 'Good',
    status: 'Standby',
    lastMaintenance: '2026-03-15',
    nextMaintenance: '2026-10-15'
  }
];

const dummyPersonnel = [
  {
    id: 'PRS-501',
    name: 'Dr. Rajeshwar Sharma',
    role: 'Expedition Leader / Chief Geologist',
    expeditionId: 'EXP-43-BHR',
    currentLocation: 'Bharati Station Main Complex',
    movementStatus: 'At Station',
    lastCheckIn: '2026-09-26 19:30 UTC',
    emergencyContactStatus: 'Verified'
  },
  {
    id: 'PRS-502',
    name: 'Dr. Sunita Deshmukh',
    role: 'Senior Glaciologist & Cryosphere Lead',
    expeditionId: 'EXP-42-MAI',
    currentLocation: 'Maitri Station Field Outpost 3',
    movementStatus: 'At Base',
    lastCheckIn: '2026-09-26 21:00 UTC',
    emergencyContactStatus: 'Verified'
  },
  {
    id: 'PRS-503',
    name: 'Commander Vikram Rathore',
    role: 'Logistics & Overland Traverse Commander',
    expeditionId: 'EXP-43-BHR',
    currentLocation: 'En route: Cape Town Logistics Gateway',
    movementStatus: 'In Transit',
    lastCheckIn: '2026-09-26 14:10 UTC',
    emergencyContactStatus: 'Verified'
  },
  {
    id: 'PRS-504',
    name: 'Dr. Aravind Menon',
    role: 'Station Medical Officer & Hyperbaric Physician',
    expeditionId: 'EXP-42-MAI',
    currentLocation: 'Maitri Medical Infirmary',
    movementStatus: 'At Station',
    lastCheckIn: '2026-09-26 20:00 UTC',
    emergencyContactStatus: 'Verified'
  },
  {
    id: 'PRS-505',
    name: 'Er. Gurpreet Singh',
    role: 'Chief Mechanical & Generator Engineer',
    expeditionId: 'EXP-44-WNT',
    currentLocation: 'NCPOR Logistics Base, Goa',
    movementStatus: 'At Base',
    lastCheckIn: '2026-09-26 11:45 UTC',
    emergencyContactStatus: 'Verified'
  },
  {
    id: 'PRS-506',
    name: 'Dr. Kavita Nambiar',
    role: 'Atmospheric & Space Physicist',
    expeditionId: 'EXP-ARC-26',
    currentLocation: 'Returning to New Delhi via Tromsø',
    movementStatus: 'Returning',
    lastCheckIn: '2026-09-25 18:25 UTC',
    emergencyContactStatus: 'Verified'
  },
  {
    id: 'PRS-507',
    name: 'Tsering Dorje',
    role: 'High-Altitude Polar Mountain Guide & SAR Lead',
    expeditionId: 'EXP-42-MAI',
    currentLocation: 'Schirmacher Oasis Crevasse Zone',
    movementStatus: 'At Station',
    lastCheckIn: '2026-09-26 21:40 UTC',
    emergencyContactStatus: 'Verified'
  },
  {
    id: 'PRS-508',
    name: 'Lt. Col. Ananya Sen',
    role: 'Communications & Satellite Telemetry Specialist',
    expeditionId: 'EXP-43-BHR',
    currentLocation: 'New Delhi Headquarters (R&R Leave)',
    movementStatus: 'On Leave',
    lastCheckIn: '2026-09-20 09:00 UTC',
    emergencyContactStatus: 'Verified'
  }
];

const dummyEmergencies = [
  {
    id: 'EMG-2026-01',
    title: 'Katabatic Blizzard Whiteout & Generator 2 Supercharger Lock',
    type: 'Severe Weather & Power Grid Degradation',
    location: 'Maitri Station Power House & Perimeter',
    severity: 'CRITICAL',
    affectedPersonnel: 4,
    reportedAt: '2026-09-26 21:15 UTC',
    status: 'Response In Progress',
    responseTeam: 'Polar SAR Team & Engineering Emergency Duty Unit',
    requiredEquipment: 'Portable 25kW Kubota Generator, Thermal Insulated Lines, Snowcat PB-01',
    description: 'Sudden Category 4 katabatic storm with sustained winds at 84 knots. Generator 2 intake icing triggered emergency shutdown. GEN-01 holding 92% station life-support load.'
  },
  {
    id: 'EMG-2026-02',
    title: 'Crevasse Route Subsidence on Central Dronning Maud Traverse',
    type: 'Field Route Hazard',
    location: 'WayPoint Alpha-7 (Lat 70°46S, Long 11°44E)',
    severity: 'HIGH',
    affectedPersonnel: 3,
    reportedAt: '2026-09-26 17:30 UTC',
    status: 'Acknowledged',
    responseTeam: 'Maitri Forward Recon Team',
    requiredEquipment: 'Ground Penetrating Radar, Crevasse Bridging Ramps, Satellite Pinger',
    description: 'Snow bridge collapse under heavy cargo sledge S-04 track. Vehicle stable on rim; safe extraction corridor must be probed before nightfall.'
  },
  {
    id: 'EMG-2026-03',
    title: 'Severe Grade-2 Frostbite during Outpost Meteorology Check',
    type: 'Medical Evacuation',
    location: 'Bharati Ridge Weather Station 4',
    severity: 'MEDIUM',
    affectedPersonnel: 1,
    reportedAt: '2026-09-26 12:40 UTC',
    status: 'Reported',
    responseTeam: 'Bharati Medical Quick Reaction Unit',
    requiredEquipment: 'Heated Medical Evacuation Litter, Rapid Rewarming Bath, Oxygen Unit',
    description: 'Team member experienced protective glove puncture during anemometer servicing in -42°C with wind chill factor of -61°C.'
  },
  {
    id: 'EMG-2026-04',
    title: 'Primary C-Band Satellite Transceiver Oscillator Drift',
    type: 'Telecommunications Anomaly',
    location: 'Bharati Station Comms Dome',
    severity: 'LOW',
    reportedAt: '2026-09-25 08:10 UTC',
    status: 'Resolved',
    responseTeam: 'SATCOM Telemetry Unit',
    requiredEquipment: 'Spectrum Analyzer, Spare Local Oscillator Board',
    description: 'Carrier signal dropped by 18dB due to extreme sub-zero thermal cycling. Switched to redundant Iridium BGAN terminal; replacement oscillator calibrated and locked.'
  }
];

const dummyNotifications = [
  {
    id: 'NOTIF-001',
    title: 'CRITICAL: Katabatic Storm Alert Level Red',
    message: 'Maitri Station anemometers reading 84 knots. All outdoor vehicular operations halted.',
    type: 'alert',
    timestamp: '2026-09-26 21:20 UTC',
    read: false
  },
  {
    id: 'NOTIF-002',
    title: 'Cargo Dispatched: ISO-POLAR-4012 En Route',
    message: 'Cryogenic drilling gear container departed Cape Town aboard R/V Polar Pioneer.',
    type: 'info',
    timestamp: '2026-09-26 15:00 UTC',
    read: false
  },
  {
    id: 'NOTIF-003',
    title: 'Inventory Alert: Polar Heated Battery Packs Low',
    message: 'Emergency Power Shelter LiFePO4 batteries are at 30% of mandatory minimum reserve.',
    type: 'warning',
    timestamp: '2026-09-26 11:30 UTC',
    read: true
  },
  {
    id: 'NOTIF-004',
    title: 'Emergency Resolved: C-Band SATCOM Restored',
    message: 'Bharati Station C-Band uplink returned to nominal SNR of 14.2 dB.',
    type: 'success',
    timestamp: '2026-09-25 10:45 UTC',
    read: true
  }
];

const dummyActivity = [
  {
    id: 'ACT-001',
    message: 'Katabatic Blizzard Emergency EMG-2026-01 escalated to CRITICAL severity by Maitri SAR.',
    type: 'emergency',
    timestamp: '2026-09-26 21:18 UTC'
  },
  {
    id: 'ACT-002',
    message: 'Personnel Tsering Dorje checked in from Schirmacher Oasis Crevasse Zone.',
    type: 'personnel',
    timestamp: '2026-09-26 21:40 UTC'
  },
  {
    id: 'ACT-003',
    message: 'Cargo CRG-8801 status updated to "In Transit" from Cape Town Logistics Terminal.',
    type: 'cargo',
    timestamp: '2026-09-26 14:30 UTC'
  },
  {
    id: 'ACT-004',
    message: 'Asset AST-3003 (GEN-02) placed into Scheduled Maintenance status for intake overhaul.',
    type: 'asset',
    timestamp: '2026-09-24 16:30 UTC'
  },
  {
    id: 'ACT-005',
    message: 'Expedition EXP-43-BHR readiness increased to 35% following deep drill gear staging.',
    type: 'expedition',
    timestamp: '2026-09-24 09:00 UTC'
  }
];

// Provide bundled export for convenience
const dummyData = {
  dummyExpeditions,
  dummyCargo,
  dummyInventory,
  dummyAssets,
  dummyPersonnel,
  dummyEmergencies,
  dummyNotifications,
  dummyActivity,
  calculateInventoryStatus
};

// Expose to window/global for browser script tags
if (typeof window !== 'undefined') {
  window.dummyExpeditions = dummyExpeditions;
  window.dummyCargo = dummyCargo;
  window.dummyInventory = dummyInventory;
  window.dummyAssets = dummyAssets;
  window.dummyPersonnel = dummyPersonnel;
  window.dummyEmergencies = dummyEmergencies;
  window.dummyNotifications = dummyNotifications;
  window.dummyActivity = dummyActivity;
  window.dummyData = dummyData;
  window.calculateInventoryStatus = calculateInventoryStatus;
}

// Node.js module export support for testing runners
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    dummyExpeditions,
    dummyCargo,
    dummyInventory,
    dummyAssets,
    dummyPersonnel,
    dummyEmergencies,
    dummyNotifications,
    dummyActivity,
    calculateInventoryStatus,
    dummyData
  };
}
