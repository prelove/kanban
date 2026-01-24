// Utility functions - shared helpers

// HTML encode to prevent XSS
window.escapeHtml = function(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Check if date is expired
window.isExpired = function(expiryDate) {
  if (!expiryDate) return false;
  const exp = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return exp < today;
};

// Get days until expiry
window.getDaysUntilExpiry = function(expiryDate) {
  if (!expiryDate) return null;
  const exp = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((exp - today) / (1000 * 60 * 60 * 24));
  return diff;
};

// Get priority badge style
window.getPriorityBadge = function(priority) {
  const badges = {
    'high':'🔴',
    'medium':'🟡',
    'low':'🟢'
  };
  return badges[priority] || '⚪';
};

// Format date to readable string
window.formatDate = function(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString(window.APP.lang === 'ja' ? 'ja-JP' :'zh-CN');
};

// Deep clone object (avoid reference issues)
window.deepClone = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};

// Find card by id in database
window.findCard = function(cardId, columnId, moduleId) {
  for (let i = 0; i < window.APP.db.length; i++) {
    if (window.APP.db[i].id === moduleId) {
      for (let j = 0; j < window.APP.db[i].columns.length; j++) {
        if (window.APP.db[i].columns[j].id === columnId) {
          for (let k = 0; k < window.APP.db[i].columns[j].cards.length; k++) {
            if (window.APP.db[i].columns[j].cards[k].id === cardId) {
              return window.APP.db[i].columns[j].cards[k];
            }
          }
        }
      }
    }
  }
  return null;
};

// Show toast notification
window.showToast = function(message, duration) {
  if (! duration) duration = 3000;
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('show');
  setTimeout(function() {
    el.classList.remove('show');
  }, duration);
};