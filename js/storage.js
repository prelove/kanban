// Storage management - LocalStorage and IndexedDB

window.StorageManager = {
  DB_NAME:'DashboardDB',
  STORE_NAME:'dashboardStore',
  DB_VERSION:1,
  db:null,

  // Initialize IndexedDB
  initIndexedDB:function() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = function() {
        console.error('IndexedDB open failed');
        reject(request.error);
      };

      request.onsuccess = function() {
        window.StorageManager.db = request.result;
        console.log('IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = function(event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(window.StorageManager.STORE_NAME)) {
          db.createObjectStore(window.StorageManager.STORE_NAME);
        }
      };
    });
  },

  // Save data to IndexedDB
  saveToIndexedDB:function(key, data) {
    if (!this.db) {
      console.warn('IndexedDB not initialized, falling back to localStorage');
      this.saveToLocal(key, data);
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.put(data, key);

        request.onerror = function() {
          console.error('IndexedDB save failed');
          reject(request.error);
        };

        request.onsuccess = function() {
          resolve();
        };
      } catch (e) {
        console.error('IndexedDB operation failed:', e);
        this.saveToLocal(key, data);
        resolve();
      }
    });
  },

  // Load data from IndexedDB
  loadFromIndexedDB:function(key) {
    if (!this.db) {
      console.warn('IndexedDB not initialized, falling back to localStorage');
      return Promise.resolve(this.loadFromLocal(key));
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.get(key);

        request.onerror = function() {
          console.error('IndexedDB load failed');
          reject(request.error);
        };

        request.onsuccess = function() {
          resolve(request.result || null);
        };
      } catch (e) {
        console.error('IndexedDB operation failed:', e);
        resolve(this.loadFromLocal(key));
      }
    });
  },

  // Save to localStorage (fallback)
  saveToLocal:function(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('LocalStorage error:', e);
    }
  },

  // Load from localStorage (fallback)
  loadFromLocal:function(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) :null;
    } catch (e) {
      console.error('LocalStorage error:', e);
      return null;
    }
  },

  // Save database (uses IndexedDB first, then localStorage)
  saveDatabase:async function(db) {
    await this.saveToIndexedDB('dashboard_db', db);
  },

  // Load database
  loadDatabase:async function() {
    return await this.loadFromIndexedDB('dashboard_db');
  },

  // Save theme preference
  saveTheme:function(theme) {
    localStorage.setItem('dashboard_theme', theme);
  },

  // Load theme preference
  loadTheme:function() {
    return localStorage.getItem('dashboard_theme') || 'light';
  },

  // Save language preference
  saveLanguage:function(lang) {
    localStorage.setItem('dashboard_lang', lang);
  },

  // Load language preference
  loadLanguage:function() {
    return localStorage.getItem('dashboard_lang') || 'ja';
  },

  // Download JSON file
  downloadJSON:function(db) {
    try {
      const blob = new Blob([JSON.stringify(db, null, 2)], {
        type:'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'wiki-data-' + new Date().toISOString().split('T')[0] + '.json';
      link.click();
      URL.revokeObjectURL(url);

      window.showToast(t('exported'));
    } catch (e) {
      console.error(e);
    }
  },

  // Import JSON file
  importJSON:function(callback) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
      const file = e.target.files[0];
      if (! file) return;

      const reader = new FileReader();
      reader.onload = function(event) {
        try {
          const imported = JSON.parse(event.target.result);
          callback(imported);
          window.showToast(t('imported'));
        } catch (err) {
          window.showToast(t('jsonError'));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  },

  // Clear all data from IndexedDB
  clearIndexedDB:function() {
    if (! this.db) return Promise.resolve();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.clear();

        request.onerror = function() {
          reject(request.error);
        };

        request.onsuccess = function() {
          console.log('IndexedDB cleared');
          resolve();
        };
      } catch (e) {
        reject(e);
      }
    });
  }
};