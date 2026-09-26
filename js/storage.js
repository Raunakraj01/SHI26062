/**
 * POLAR-OPS — Integrated Polar Expedition Operations & Logistics Platform
 * Centralized Storage Engine (Phase 1 Foundation & Phase 2 Core)
 *
 * Implements a unified abstraction layer over localStorage.
 * No module should directly call localStorage.setItem/getItem.
 */

const STORAGE_KEYS = Object.freeze({
  expeditions: 'polar_expeditions',
  cargo: 'polar_cargo',
  inventory: 'polar_inventory',
  assets: 'polar_assets',
  personnel: 'polar_personnel',
  emergencies: 'polar_emergencies',
  notifications: 'polar_notifications',
  activity: 'polar_activity'
});

/**
 * Retrieve parsed data array or object for a given storage key.
 * Returns an empty array if key does not exist or parse fails.
 * @param {string} key
 * @returns {Array|Object}
 */
function getData(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) {
      return [];
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error(`[POLAR-OPS Storage] Failed to parse data for key "${key}":`, error);
    return [];
  }
}

/**
 * Persist data to localStorage under the specified key.
 * @param {string} key
 * @param {any} data
 * @returns {boolean} Success status
 */
function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`[POLAR-OPS Storage] Failed to save data for key "${key}":`, error);
    return false;
  }
}

/**
 * Append a new item to an existing collection in storage.
 * @param {string} key
 * @param {Object} item
 * @returns {Object|null} The added item or null on error
 */
function addData(key, item) {
  try {
    const data = getData(key);
    if (!Array.isArray(data)) {
      console.warn(`[POLAR-OPS Storage] Target for key "${key}" is not an array. Converting to array.`);
    }
    const collection = Array.isArray(data) ? data : [];
    collection.push(item);
    saveData(key, collection);
    return item;
  } catch (error) {
    console.error(`[POLAR-OPS Storage] Failed to add item to key "${key}":`, error);
    return null;
  }
}

/**
 * Update an existing item by its ID.
 * Merges updated fields with existing fields while preserving ID.
 * @param {string} key
 * @param {string|number} id
 * @param {Object} updatedItem
 * @returns {Object|null} Updated item or null if not found/error
 */
function updateData(key, id, updatedItem) {
  try {
    const data = getData(key);
    if (!Array.isArray(data)) return null;

    const index = data.findIndex((item) => String(item.id) === String(id));
    if (index === -1) {
      console.warn(`[POLAR-OPS Storage] Item with ID "${id}" not found in "${key}".`);
      return null;
    }

    const merged = { ...data[index], ...updatedItem, id: data[index].id };
    data[index] = merged;
    saveData(key, data);
    return merged;
  } catch (error) {
    console.error(`[POLAR-OPS Storage] Failed to update item "${id}" in key "${key}":`, error);
    return null;
  }
}

/**
 * Delete an item by ID from a collection in storage.
 * @param {string} key
 * @param {string|number} id
 * @returns {boolean} True if deleted, false if not found
 */
function deleteData(key, id) {
  try {
    const data = getData(key);
    if (!Array.isArray(data)) return false;

    const initialLength = data.length;
    const filtered = data.filter((item) => String(item.id) !== String(id));

    if (filtered.length === initialLength) {
      return false;
    }

    saveData(key, filtered);
    return true;
  } catch (error) {
    console.error(`[POLAR-OPS Storage] Failed to delete item "${id}" from key "${key}":`, error);
    return false;
  }
}

/**
 * Remove an entire key from localStorage.
 * @param {string} key
 */
function clearData(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`[POLAR-OPS Storage] Failed to clear key "${key}":`, error);
  }
}

/**
 * Find and return a single item by ID from a collection in storage.
 * @param {string} key
 * @param {string|number} id
 * @returns {Object|null}
 */
function getItemById(key, id) {
  try {
    const data = getData(key);
    if (!Array.isArray(data)) return null;
    return data.find((item) => String(item.id) === String(id)) || null;
  } catch (error) {
    console.error(`[POLAR-OPS Storage] Failed to get item "${id}" from key "${key}":`, error);
    return null;
  }
}

/**
 * High-level PolarStorage object API
 */
const PolarStorage = {
  init() { return true; },
  getAll(key) { return getData(key); },
  getById(key, id) { return getItemById(key, id); },
  create(key, item) { return addData(key, item); },
  update(key, id, updates) { return updateData(key, id, updates); },
  delete(key, id) { return deleteData(key, id); },
  clear(key) { return clearData(key); }
};

// Expose to window/global for browser script tags
if (typeof window !== 'undefined') {
  window.STORAGE_KEYS = STORAGE_KEYS;
  window.getData = getData;
  window.saveData = saveData;
  window.addData = addData;
  window.updateData = updateData;
  window.deleteData = deleteData;
  window.clearData = clearData;
  window.getItemById = getItemById;
  window.PolarStorage = PolarStorage;
}

// Node.js module export support for automated testing and headless runners
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    STORAGE_KEYS,
    getData,
    saveData,
    addData,
    updateData,
    deleteData,
    clearData,
    getItemById,
    PolarStorage
  };
}
