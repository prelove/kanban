// Application initialization and main entry point

window.APP = {
  lang:'ja',
  theme:'light',
  currentModule:null,
  db:[],
  editMode:false,
  editingCard:null
};

// Initialize application
async function initializeApp() {
  // Initialize IndexedDB first
  try {
    await window.StorageManager.initIndexedDB();
  } catch (e) {
    console.warn('IndexedDB initialization failed, using localStorage');
  }

  // Load preferences
  window.APP.lang = window.StorageManager.loadLanguage();
  window.APP.theme = window.StorageManager.loadTheme();

  // Set initial data
  let storedDB = null;
  try {
    storedDB = await window.StorageManager.loadDatabase();
  } catch (e) {
    console.warn('Failed to load from IndexedDB');
  }

  const initialData = storedDB || (window.WIKI_DATA_INITIAL || window.WIKI_DATA);

  window.DataManager.init(initialData);
  window.WIKI_DATA_INITIAL = window.deepClone(initialData);

  // Set theme and language
  document.documentElement.setAttribute('data-theme', window.APP.theme);
  window.APP.currentModule = window.APP.db.length > 0 ? window.APP.db[0].id :null;

  // Initialize UI
  window.UIRenderer.init();
  window.UIRenderer.currentView = 'grid';

  // Setup keyboard shortcuts
  setupKeyboardShortcuts();

  console.log('App initialized successfully');
}

// 修改 DOMContentLoaded 事件处理
document.addEventListener('DOMContentLoaded', async function() {
  await initializeApp();
});

// 修改 beforeunload 事件处理
window.addEventListener('beforeunload', function() {
  window.StorageManager.saveDatabase(window.APP.db);
});

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', function(e) {
    // F - Flashcard mode
    if (e.key.toLowerCase() === 'f' && ! e.ctrlKey && !e.metaKey) {
      if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        window.UIRenderer.currentView = 'flashcard';
        window.UIRenderer.renderMainContent();
      }
    }

    // G - Grid mode
    if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.metaKey) {
      if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        window.UIRenderer.currentView = 'grid';
        window.UIRenderer.renderMainContent();
      }
    }

    // L - List mode
    if (e.key.toLowerCase() === 'l' && !e.ctrlKey && !e.metaKey) {
      if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        window.UIRenderer.currentView = 'list';
        window.UIRenderer.renderMainContent();
      }
    }
  });
}

// Auto-save on interval
setInterval(function() {
  window.StorageManager.saveDatabase(window.APP.db);
}, 30000);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

// Handle browser unload
window.addEventListener('beforeunload', function() {
  window.StorageManager.saveDatabase(window.APP.db);
});