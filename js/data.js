// Data management - CRUD operations for cards

window.DataManager = {
  // Initialize database
  init:function(initialData) {
    let dbData = initialData;
    let trashData = [];

    if (initialData && initialData.db) {
      dbData = initialData.db;
      trashData = initialData.trash || [];
    }

    window.APP.db = window.deepClone(dbData || []);
    window.APP.trash = window.deepClone(trashData || []);
    this.normalizeWipLimits(window.APP.db, window.APP.trash);
    window.StorageManager.saveDatabase(window.APP.db, window.APP.trash);
  },

  // Get effective WIP limit for a column (0 = unlimited)
  getColumnWipLimit:function(column) {
    if (column && Number.isSafeInteger(column.wipLimit) && column.wipLimit > 0) {
      return column.wipLimit;
    }
    return 0;
  },

  // Check whether a card may enter a column (capacity check only, no mutation)
  canEnterColumn:function(moduleId, columnId) {
    const module = this.getModule(moduleId);
    if (!module) return { allowed:false, reason:'notFound' };
    const column = module.columns.find(function(col) { return col.id === columnId; });
    if (!column) return { allowed:false, reason:'notFound' };
    const limit = this.getColumnWipLimit(column);
    if (limit === 0 || column.cards.length < limit) return { allowed:true };
    return { allowed:false, reason:'wipLimit', count:column.cards.length, limit:limit };
  },

  // Remove malformed wipLimit properties in place
  normalizeWipLimits:function(db, trash) {
    const normalizeColumn = function(column, getLimit) {
      if (!column || typeof column !== 'object') return;
      if (Object.prototype.hasOwnProperty.call(column, 'wipLimit') && getLimit(column) === 0) {
        delete column.wipLimit;
      }
    };
    const getLimit = this.getColumnWipLimit;

    if (Array.isArray(db)) {
      for (let i = 0; i < db.length; i++) {
        const module = db[i];
        if (!module || !Array.isArray(module.columns)) continue;
        for (let j = 0; j < module.columns.length; j++) {
          normalizeColumn(module.columns[j], getLimit);
        }
      }
    }

    if (Array.isArray(trash)) {
      for (let i = 0; i < trash.length; i++) {
        const item = trash[i];
        if (!item || typeof item !== 'object' || !item.data) continue;
        if (item.type === 'column') {
          normalizeColumn(item.data, getLimit);
        } else if (item.type === 'module' && Array.isArray(item.data.columns)) {
          for (let j = 0; j < item.data.columns.length; j++) {
            normalizeColumn(item.data.columns[j], getLimit);
          }
        }
      }
    }
  },

  // Get module by ID
  getModule:function(moduleId) {
    for (let i = 0; i < window.APP.db.length; i++) {
      if (window.APP.db[i].id === moduleId) {
        return window.APP.db[i];
      }
    }
    return null;
  },

  // Get all cards sorted by priority and pinned status
  getCardsSorted:function(moduleId) {
    const module = this.getModule(moduleId);
    if (!module) return [];

    const allCards = [];
    for (let i = 0; i < module.columns.length; i++) {
      for (let j = 0; j < module.columns[i].cards.length; j++) {
        allCards.push({
          card:module.columns[i].cards[j],
          columnId:module.columns[i].id,
          moduleName:module.name
        });
      }
    }

    // Sort:pinned first, then by priority
    const priorityOrder = { 'high':0, 'medium':1, 'low':2 };
    allCards.sort(function(a, b) {
      if (a.card.pinned && !b.card.pinned) return -1;
      if (!a.card.pinned && b.card.pinned) return 1;
      const aPriority = priorityOrder[a.card.priority] || 3;
      const bPriority = priorityOrder[b.card.priority] || 3;
      return aPriority - bPriority;
    });

    return allCards;
  },

  // Add new card to column
  addCard:function(moduleId, columnId, card) {
    const module = this.getModule(moduleId);
    if (!module) return false;

    for (let i = 0; i < module.columns.length; i++) {
      if (module.columns[i].id === columnId) {
        const check = this.canEnterColumn(moduleId, columnId);
        if (!check.allowed) return false;
        module.columns[i].cards.push(card);
        window.StorageManager.saveDatabase(window.APP.db, window.APP.trash);
        return true;
      }
    }
    return false;
  },

  // Transfer a card to another column (or reorder within the same column)
  transferCard:function(moduleId, sourceColumnId, targetColumnId, cardId, targetIndex) {
    const module = this.getModule(moduleId);
    if (!module) return { moved:false, reason:'notFound' };
    const sourceColumn = module.columns.find(function(col) { return col.id === sourceColumnId; });
    const targetColumn = module.columns.find(function(col) { return col.id === targetColumnId; });
    if (!sourceColumn || !targetColumn) return { moved:false, reason:'notFound' };
    const cardIndex = sourceColumn.cards.findIndex(function(card) { return card.id === cardId; });
    if (cardIndex === -1) return { moved:false, reason:'notFound' };

    if (targetIndex !== undefined && !Number.isInteger(targetIndex)) {
      return { moved:false, reason:'invalidIndex' };
    }

    if (sourceColumn !== targetColumn) {
      const check = this.canEnterColumn(moduleId, targetColumnId);
      if (!check.allowed) {
        const result = { moved:false, reason:check.reason };
        if (check.reason === 'wipLimit') {
          result.count = check.count;
          result.limit = check.limit;
        }
        return result;
      }
    }

    const card = sourceColumn.cards.splice(cardIndex, 1)[0];
    let insertIndex = (targetIndex === undefined) ? targetColumn.cards.length : targetIndex;
    insertIndex = Math.min(Math.max(insertIndex, 0), targetColumn.cards.length);
    targetColumn.cards.splice(insertIndex, 0, card);
    window.StorageManager.saveDatabase(window.APP.db, window.APP.trash);
    return { moved:true };
  },

  // Update card
  updateCard:function(moduleId, columnId, cardId, updates) {
    const card = window.findCard(cardId, columnId, moduleId);
    if (!card) return false;

    Object.assign(card, updates);
    card.updatedAt = new Date().toISOString().split('T')[0];
    window.StorageManager.saveDatabase(window.APP.db, window.APP.trash);
    return true;
  },

  // Delete card
  deleteCard:function(moduleId, columnId, cardId) {
    const module = this.getModule(moduleId);
    if (!module) return false;

    for (let i = 0; i < module.columns.length; i++) {
      if (module.columns[i].id === columnId) {
        const newCards = [];
        for (let j = 0; j < module.columns[i].cards.length; j++) {
          if (module.columns[i].cards[j].id !== cardId) {
            newCards.push(module.columns[i].cards[j]);
          }
        }
        module.columns[i].cards = newCards;
        window.StorageManager.saveDatabase(window.APP.db, window.APP.trash);
        return true;
      }
    }
    return false;
  },

  // Toggle card pinned status
  togglePin:function(moduleId, columnId, cardId) {
    const card = window.findCard(cardId, columnId, moduleId);
    if (!card) return false;

    card.pinned = ! card.pinned;
    window.StorageManager.saveDatabase(window.APP.db, window.APP.trash);
    return true;
  },

  // Search cards across all modules
  searchCards:function(searchTerm) {
    const term = searchTerm.toLowerCase();
    const results = [];

    for (let i = 0; i < window.APP.db.length; i++) {
      const module = window.APP.db[i];
      for (let j = 0; j < module.columns.length; j++) {
        const column = module.columns[j];
        for (let k = 0; k < column.cards.length; k++) {
          const card = column.cards[k];
          const title = window.txt(card.title).toLowerCase();
          const content = window.txt(card.content).toLowerCase();
          const description = card.description ?  window.txt(card.description).toLowerCase() :'';

          if (title.indexOf(term) >= 0 || content.indexOf(term) >= 0 || description.indexOf(term) >= 0) {
            results.push({
              card:card,
              columnId:column.id,
              moduleId:module.id,
              moduleName:module.name,
              columnName:column.name
            });
          }
        }
      }
    }

    return results;
  },

  // Filter cards by tag
  filterByTag:function(moduleId, tag) {
    const module = this.getModule(moduleId);
    if (!module) return [];

    const results = [];
    for (let i = 0; i < module.columns.length; i++) {
      const column = module.columns[i];
      for (let j = 0; j < column.cards.length; j++) {
        const card = column.cards[j];
        if (card.tags && card.tags.indexOf(tag) >= 0) {
          results.push({
            card:card,
            columnId:column.id
          });
        }
      }
    }
    return results;
  },

  // Get all unique tags in module
  getAllTags:function(moduleId) {
    const module = this.getModule(moduleId);
    if (!module) return [];

    const tags = [];
    for (let i = 0; i < module.columns.length; i++) {
      const column = module.columns[i];
      for (let j = 0; j < column.cards.length; j++) {
        const card = column.cards[j];
        if (card.tags) {
          for (let k = 0; k < card.tags.length; k++) {
            if (tags.indexOf(card.tags[k]) === -1) {
              tags.push(card.tags[k]);
            }
          }
        }
      }
    }
    return tags.sort();
  },

  // Get expiring cards (within N days)
  getExpiringCards:function(moduleId, days) {
    if (!days) days = 7;
    const module = this.getModule(moduleId);
    if (!module) return [];

    const results = [];
    for (let i = 0; i < module.columns.length; i++) {
      const column = module.columns[i];
      for (let j = 0; j < column.cards.length; j++) {
        const card = column.cards[j];
        if (card.expiryDate) {
          const daysLeft = window.getDaysUntilExpiry(card.expiryDate);
          if (daysLeft !== null && daysLeft >= 0 && daysLeft <= days) {
            results.push({
              card:card,
              columnId:column.id,
              daysLeft:daysLeft
            });
          }
        }
      }
    }
    return results;
  },

  // Reset database to initial state
  resetDatabase:function(initialData) {
    if (! confirm(t('confirmReset'))) return false;

    window.APP.db = window.deepClone(initialData);
    window.APP.trash = [];
    window.StorageManager.saveDatabase(window.APP.db, window.APP.trash);
    return true;
  },

  reorderArray:function(list, fromIndex, toIndex) {
    if (fromIndex === toIndex) return list;
    const item = list.splice(fromIndex, 1)[0];
    list.splice(toIndex, 0, item);
    return list;
  },

  moveModule:function(moduleId, direction) {
    const index = window.APP.db.findIndex(function(item) { return item.id === moduleId; });
    if (index === -1) return false;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= window.APP.db.length) return false;
    this.reorderArray(window.APP.db, index, targetIndex);
    window.StorageManager.saveDatabase(window.APP.db, window.APP.trash);
    return true;
  },

  moveColumn:function(moduleId, columnId, direction) {
    const module = this.getModule(moduleId);
    if (!module) return false;
    const index = module.columns.findIndex(function(col) { return col.id === columnId; });
    if (index === -1) return false;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= module.columns.length) return false;
    this.reorderArray(module.columns, index, targetIndex);
    window.StorageManager.saveDatabase(window.APP.db, window.APP.trash);
    return true;
  },

  moveCard:function(moduleId, columnId, cardId, direction) {
    const module = this.getModule(moduleId);
    if (!module) return false;
    const column = module.columns.find(function(col) { return col.id === columnId; });
    if (!column) return false;
    const index = column.cards.findIndex(function(card) { return card.id === cardId; });
    if (index === -1) return false;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= column.cards.length) return false;
    this.reorderArray(column.cards, index, targetIndex);
    window.StorageManager.saveDatabase(window.APP.db, window.APP.trash);
    return true;
  },

  addToTrash:function(item) {
    window.APP.trash = window.APP.trash || [];
    window.APP.trash.push(item);
    window.StorageManager.saveDatabase(window.APP.db, window.APP.trash);
  },

  removeTrashAt:function(index) {
    if (!window.APP.trash || index < 0 || index >= window.APP.trash.length) return false;
    window.APP.trash.splice(index, 1);
    window.StorageManager.saveDatabase(window.APP.db, window.APP.trash);
    return true;
  }
};
