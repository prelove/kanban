// Storage management - LocalStorage and IndexedDB

window.StorageManager = {
  DB_NAME:'DashboardDB',
  STORE_NAME:'dashboardStore',
  DB_VERSION:1,
  db:null,
  encryptionKey:null,

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
  saveDatabase:async function(db, trash) {
    const payload = {
      db:db || window.APP.db || [],
      trash:trash || window.APP.trash || []
    };
    const encrypted = await this.encryptData(payload);
    await this.saveToIndexedDB('dashboard_db', encrypted);
  },

  // Load database
  loadDatabase:async function() {
    const stored = await this.loadFromIndexedDB('dashboard_db');
    if (!stored) return null;
    if (typeof stored === 'string') {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return null;
      }
    }
    return await this.decryptData(stored);
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

// Encryption helpers
window.StorageManager.getEncryptionKey = async function() {
  if (this.encryptionKey) return this.encryptionKey;

  const saltKey = 'dashboard_crypto_salt';
  let salt = localStorage.getItem(saltKey);
  if (!salt) {
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    salt = this.toBase64(saltBytes);
    localStorage.setItem(saltKey, salt);
  }

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode('dashboard-secure-v1:' + navigator.userAgent),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name:'PBKDF2',
      salt:this.fromBase64(salt),
      iterations:100000,
      hash:'SHA-256'
    },
    keyMaterial,
    { name:'AES-GCM', length:256 },
    false,
    ['encrypt', 'decrypt']
  );

  this.encryptionKey = derivedKey;
  return derivedKey;
};

window.StorageManager.encryptData = async function(data) {
  const key = await this.getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const encrypted = await crypto.subtle.encrypt(
    { name:'AES-GCM', iv:iv },
    key,
    encoded
  );
  return {
    v:1,
    iv:this.toBase64(iv),
    payload:this.toBase64(new Uint8Array(encrypted))
  };
};

window.StorageManager.decryptData = async function(stored) {
  if (!stored) return null;
  if (!stored.payload || !stored.iv) return stored;

  const key = await this.getEncryptionKey();
  const decrypted = await crypto.subtle.decrypt(
    { name:'AES-GCM', iv:this.fromBase64(stored.iv) },
    key,
    this.fromBase64(stored.payload)
  );
  const decoded = new TextDecoder().decode(decrypted);
  return JSON.parse(decoded);
};

window.StorageManager.toBase64 = function(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

window.StorageManager.fromBase64 = function(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};
