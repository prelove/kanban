// Event handling - user interactions

window.EMOJI_OPTIONS = {
  module:['🚀', '📁', '⚙️', '📋', '💼', '🔧', '🌐', '📊', '🎯', '👥', '📚', '🏆', '🎨', '⚡', '🔐'],
  other:['📝', '🔍', '✅', '❌', '⚠️', '💡', '🎁', '❤️', '⭐']
};

window.EventHandler = {
  copyCard:function(cardId, columnId, moduleId, btn) {
    const card = window.findCard(cardId, columnId, moduleId);
    if (!card) return;

    const content = window.txt(card.content);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(content).then(function() {
        window.EventHandler.showCopied(btn);
      }).catch(function() {
        window.EventHandler.fallbackCopy(content, btn);
      });
    } else {
      window.EventHandler.fallbackCopy(content, btn);
    }
  },

  fallbackCopy:function(text, btn) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      window.EventHandler.showCopied(btn);
    } catch (e) {
      window.showToast(t('copyFailed'));
    }
    document.body.removeChild(ta);
  },

  showCopied:function(btn) {
    const original = btn.innerHTML;
    btn.classList.add('copied');
    btn.innerHTML = '✓';
    setTimeout(function() {
      btn.classList.remove('copied');
      btn.innerHTML = original;
    }, 2000);
  },

  togglePin:function(cardId, columnId, moduleId) {
    if (window.DataManager.togglePin(moduleId, columnId, cardId)) {
      window.UIRenderer.renderMainContent();
      window.showToast('⭐ Pinned updated');
    }
  },

  openAddCardModal:function(columnId, moduleId) {
    window.UIRenderer.selectedColumnForCard = columnId;
    this.openEditModal(null, columnId, moduleId);
  },

  openEditModal:function(cardId, columnId, moduleId) {
    if (! window.APP.editMode && cardId) return;

    let card = null;
    if (cardId) {
      card = window.findCard(cardId, columnId, moduleId);
      if (!card) return;
    }

    window.APP.editingCard = {
      id:cardId,
      columnId:columnId,
      moduleId:moduleId,
      original:card ?  window.deepClone(card) :null
    };

    const titleJa = card ?  (card.title && card.title.ja ?  card.title.ja :(typeof card.title === 'string' ? card.title :'')) :'';
    const titleZh = card ? (card.title && card.title.zh ? card.title.zh :(typeof card.title === 'string' ?  card.title :'')) :'';
    const titleEn = card ? (card.title && card.title.en ?  card.title.en :(typeof card.title === 'string' ? card.title :'')) :'';
    const cardContent = card ? (typeof card.content === 'string' ? card.content :(card.content && card.content.ja ? card.content.ja :'')) :'';

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
      <div class="form-group">
        <label class="form-label">${t('titleJa')}</label>
        <input type="text" class="form-input" id="eTitleJa" value="${window.escapeHtml(titleJa)}">
      </div>
      <div class="form-group">
        <label class="form-label">${t('titleZh')}</label>
        <input type="text" class="form-input" id="eTitleZh" value="${window.escapeHtml(titleZh)}">
      </div>
      <div class="form-group">
        <label class="form-label">${t('titleEn')}</label>
        <input type="text" class="form-input" id="eTitleEn" value="${window.escapeHtml(titleEn)}">
      </div>
      <div class="form-group">
        <label class="form-label">${t('type')}</label>
        <select class="form-input" id="eType">
          <option value="url" ${card && card.type === 'url' ? 'selected' :''}>URL</option>
          <option value="code" ${card && card.type === 'code' ? 'selected' :''}>Code</option>
          <option value="memo" ${card && card.type === 'memo' ? 'selected' :''}>Memo</option>
          <option value="list" ${card && card.type === 'list' ? 'selected' :''}>List</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">${t('content')}</label>
        <textarea class="form-input" id="eContent" style="min-height:150px;">${window.escapeHtml(cardContent)}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">${t('priority')}</label>
        <select class="form-input" id="ePriority">
          <option value="high" ${card && card.priority === 'high' ? 'selected' :''}>🔴 High</option>
          <option value="medium" ${card && card.priority === 'medium' ? 'selected' :''}>🟡 Medium</option>
          <option value="low" ${card && card.priority === 'low' ?  'selected' :''}>🟢 Low</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">${t('tags')}</label>
        <input type="text" class="form-input" id="eTags" placeholder="tag1, tag2, tag3" value="${card && card.tags ? card.tags.join(', ') :''}">
      </div>
      <div class="form-group">
        <label class="form-label">${t('expiryDate')}</label>
        <input type="date" class="form-input" id="eExpiryDate" value="${card && card.expiryDate ? card.expiryDate :''}">
      </div>
      <div class="form-group">
        <label class="form-label">${t('author')}</label>
        <input type="text" class="form-input" id="eAuthor" value="${window.escapeHtml(card && card.author ? card.author :'')}">
      </div>
    `;

    document.getElementById('modalOverlay').classList.add('active');
  },

  saveEditModal:function() {
    if (!window.APP.editingCard) return;

    const titleJa = document.getElementById('eTitleJa').value;
    const titleZh = document.getElementById('eTitleZh').value;
    const titleEn = document.getElementById('eTitleEn').value;
    const type = document.getElementById('eType').value;
    const content = document.getElementById('eContent').value;
    const priority = document.getElementById('ePriority').value;
    const tags = document.getElementById('eTags').value.split(',').map(function(t) { return t.trim(); }).filter(function(t) { return t.length > 0; });
    const expiryDate = document.getElementById('eExpiryDate').value;
    const author = document.getElementById('eAuthor').value;

    const editCard = window.APP.editingCard;

    if (editCard.id) {
      const updates = {
        title:{ ja:titleJa, zh:titleZh, en:titleEn },
        type:type,
        content:content,
        priority:priority,
        tags:tags,
        expiryDate:expiryDate,
        author:author
      };

      if (window.DataManager.updateCard(editCard.moduleId, editCard.columnId, editCard.id, updates)) {
        window.EventHandler.closeEditModal();
        window.UIRenderer.renderMainContent();
        window.showToast(t('saved'));
      }
    } else {
      const newCard = {
        id:'card-' + Date.now(),
        title:{ ja:titleJa, zh:titleZh, en:titleEn },
        type:type,
        content:content,
        priority:priority,
        pinned:false,
        tags:tags,
        status:'active',
        expiryDate:expiryDate,
        author:author,
        updatedAt:new Date().toISOString().split('T')[0]
      };

      if (window.DataManager.addCard(editCard.moduleId, editCard.columnId, newCard)) {
        window.EventHandler.closeEditModal();
        window.UIRenderer.renderMainContent();
        window.showToast(t('added'));
      }
    }
  },

  closeEditModal:function() {
    document.getElementById('modalOverlay').classList.remove('active');
    window.APP.editingCard = null;
  },

  deleteCard:function(cardId, columnId, moduleId) {
    if (!confirm(t('confirmDelete'))) return;

    if (window.DataManager.deleteCard(moduleId, columnId, cardId)) {
      window.UIRenderer.renderMainContent();
      window.showToast(t('deleted'));
    }
  },

  showEmojiPicker:function(type, callback) {
    const emojis = window.EMOJI_OPTIONS[type] || window.EMOJI_OPTIONS.other;
    const emojiHtml = emojis.map(function(e) {
      return '<button style="padding:8px 12px; font-size:20px; border:1px solid var(--border-light); border-radius:6px; background:var(--bg-tertiary); cursor:pointer; transition:all 0.2s;" onclick="' + callback + '(\'' + e + '\')">' + e + '</button>';
    }).join('');

    const picker = document.createElement('div');
    picker.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:var(--bg-secondary); border:2px solid var(--border-color); border-radius:12px; padding:20px; z-index:3000; box-shadow:0 4px 12px rgba(0,0,0,0.3);';
    picker.innerHTML = '<div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:8px;">' + emojiHtml + '</div>';
    picker.onclick = function(e) { e.stopPropagation(); };

    document.body.appendChild(picker);

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; inset:0; z-index:2999; background:rgba(0,0,0,0.5);';
    overlay.onclick = function() {
      document.body.removeChild(picker);
      document.body.removeChild(overlay);
    };
    document.body.appendChild(overlay);
  },

	editModule:function(moduleId) {
	  const module = window.DataManager.getModule(moduleId);
	  if (!module) return;

	  const newName = prompt('Edit module name (or format:ja|中文|English):', window.txt(module.name));
	  if (!newName) return;

	  const parts = newName.split('|');
	  module.name = parts.length === 3
	    ? { ja:parts[0].trim(), zh:parts[1].trim(), en:parts[2].trim() }
	    :{ ja:newName, zh:newName, en:newName };

	  window.APP.pendingModuleId = moduleId;
	  window.APP.pendingModule = module;
	  window.EventHandler.showEmojiPicker('module', 'window.EventHandler.updateModuleIcon');
	},

	updateModuleIcon:function(icon) {
	  const module = window.APP.pendingModule;
	  module.icon = icon;

	  window.StorageManager.saveDatabase(window.APP.db);
	  window.UIRenderer.renderSidebar();
	  window.UIRenderer.renderMainContent();
	  window.showToast('✅ Module updated');
	},
		
	addNewModule:function() {
	  const moduleName = prompt('Enter module name (or format:ja|中文|English):');
	  if (!moduleName) return;

	  window.APP.pendingModuleName = moduleName;
	  window.EventHandler.showEmojiPicker('module', 'window.EventHandler.createModule');
	},

	createModule:function(icon) {
	  const moduleName = window.APP.pendingModuleName;
	  const parts = moduleName.split('|');

	  const newModule = {
	    id:'mod-' + Date.now(),
	    name:parts.length === 3
	      ? { ja:parts[0].trim(), zh:parts[1].trim(), en:parts[2].trim() }
	      :{ ja:moduleName, zh:moduleName, en:moduleName },
	    icon:icon,
	    columns:[
	      {
	        id:'col-' + Date.now(),
	        name:{ ja:'新しい列', zh:'新列', en:'New Column' },
	        cards:[]
	      }
	    ]
	  };

	  window.APP.db.push(newModule);
	  window.StorageManager.saveDatabase(window.APP.db);
	  window.UIRenderer.renderSidebar();
	  window.UIRenderer.renderMainContent();
	  window.showToast('✅ Module added');
	},
	
  deleteModule:function(moduleId) {
    if (! confirm('Delete this module?  This cannot be undone.')) return;

    const newDb = [];
    for (let i = 0; i < window.APP.db.length; i++) {
      if (window.APP.db[i].id !== moduleId) {
        newDb.push(window.APP.db[i]);
      }
    }

    window.APP.db = newDb;

    if (window.APP.currentModule === moduleId) {
      window.APP.currentModule = window.APP.db.length > 0 ? window.APP.db[0].id :null;
    }

    window.StorageManager.saveDatabase(window.APP.db);
    window.UIRenderer.renderSidebar();
    window.UIRenderer.renderMainContent();
    window.showToast('🗑️ Module deleted');
  },

  editColumn:function(columnId, moduleId) {
    const module = window.DataManager.getModule(moduleId);
    if (!module) return;

    let column = null;
    for (let i = 0; i < module.columns.length; i++) {
      if (module.columns[i].id === columnId) {
        column = module.columns[i];
        break;
      }
    }

    if (! column) return;

    const newName = prompt('Edit column name (or format:ja|中文|English):', window.txt(column.name));
    if (!newName) return;

    const parts = newName.split('|');
    column.name = parts.length === 3
      ? { ja:parts[0].trim(), zh:parts[1].trim(), en:parts[2].trim() }
      :{ ja:newName, zh:newName, en:newName };

    window.StorageManager.saveDatabase(window.APP.db);
    window.UIRenderer.renderMainContent();
    window.showToast('✅ Column updated');
  },

  deleteColumn:function(columnId, moduleId) {
    if (!confirm('Delete this column and all its cards? This cannot be undone.')) return;

    const module = window.DataManager.getModule(moduleId);
    if (!module) return;

    const newColumns = [];
    for (let i = 0; i < module.columns.length; i++) {
      if (module.columns[i].id !== columnId) {
        newColumns.push(module.columns[i]);
      }
    }

    if (newColumns.length === 0) {
      window.showToast('⚠️ Cannot delete the last column');
      return;
    }

    module.columns = newColumns;
    window.StorageManager.saveDatabase(window.APP.db);
    window.UIRenderer.renderMainContent();
    window.showToast('🗑️ Column deleted');
  },

  openColumnSelector:function() {
    const module = window.DataManager.getModule(window.APP.currentModule);
    if (!module || !module.columns.length) {
      window.showToast('No columns available');
      return;
    }

    const columns = module.columns;
    const colHtml = columns.map(function(col) {
      return '<button style="padding:12px 16px; width:100%; background:var(--bg-tertiary); border:1px solid var(--border-light); border-radius:6px; cursor:pointer; margin-bottom:8px; transition:all 0.2s;" onclick="window.EventHandler.selectColumnAndAddCard(\'' + col.id + '\')">' + window.txt(col.name) + '</button>';
    }).join('');

    const selector = document.createElement('div');
    selector.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:var(--bg-secondary); border:2px solid var(--border-color); border-radius:12px; padding:20px; z-index:3000; box-shadow:0 4px 12px rgba(0,0,0,0.3); max-width:400px; width:90%;';
    selector.innerHTML = '<h3 style="margin-bottom:16px;">Select Column</h3><div>' + colHtml + '</div>';
    selector.onclick = function(e) { e.stopPropagation(); };

    document.body.appendChild(selector);

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; inset:0; z-index:2999; background:rgba(0,0,0,0.5);';
    overlay.onclick = function() {
      document.body.removeChild(selector);
      document.body.removeChild(overlay);
    };
    document.body.appendChild(overlay);
  },

  selectColumnAndAddCard:function(columnId) {
    document.querySelectorAll('[style*="position:fixed"]').forEach(function(el) {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });

    window.EventHandler.openAddCardModal(columnId, window.APP.currentModule);
  },

  addNewCard:function() {
    window.EventHandler.openColumnSelector();
  },

	addNewColumn:function(moduleId) {
	  // 如果没有传入 moduleId，使用当前选中的 module
	  if (!moduleId) {
	    moduleId = window.APP.currentModule;
	  }
	  
	  if (!moduleId) {
	    window.showToast('Please select a module first');
	    return;
	  }

	  const module = window.DataManager.getModule(moduleId);
	  if (!module) return;

	  const columnName = prompt('Enter column name (or format:ja|中文|English):');
	  if (!columnName) return;

	  const parts = columnName.split('|');
	  const newColumn = {
	    id:'col-' + Date.now(),
	    name:parts.length === 3
	      ? { ja:parts[0].trim(), zh:parts[1].trim(), en:parts[2].trim() }
	      :{ ja:columnName, zh:columnName, en:columnName },
	    cards:[]
	  };

	  module.columns.push(newColumn);
	  window.StorageManager.saveDatabase(window.APP.db);
	  window.UIRenderer.renderMainContent();
	  window.showToast('✅ Column added');
	},

  handleSearch:function() {
    const searchTerm = document.getElementById('searchInput').value;

    if (!searchTerm.trim()) {
      window.UIRenderer.renderMainContent();
      return;
    }

    const results = window.DataManager.searchCards(searchTerm);
    const mainContent = document.querySelector('.main-content');

    if (results.length === 0) {
      mainContent.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><h3>No results found</h3></div>';
      return;
    }

    const grouped = {};
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (!grouped[result.moduleId]) {
        grouped[result.moduleId] = [];
      }
      grouped[result.moduleId].push(result);
    }

    let html = '<div class="search-results">';
    for (let moduleId in grouped) {
      const moduleResults = grouped[moduleId];
      const module = window.DataManager.getModule(moduleId);

      html += '<div style="margin-bottom:32px;">';
      html += '<h3 style="margin-bottom:16px; color:var(--accent-primary);">' + window.txt(module.name) + '</h3>';
      html += '<div class="list-view">';

      for (let i = 0; i < moduleResults.length; i++) {
        const result = moduleResults[i];
        const card = result.card;
        const title = window.txt(card.title);
        const priorityEmoji = window.getPriorityBadge(card.priority || 'low');

        html += `
          <div class="list-item" onclick="window.UIRenderer.selectModule('${moduleId}')">
            <div class="list-item-icon">${card.type === 'url' ? '🌐' :card.type === 'code' ? '💻' :'📝'}</div>
            <div class="list-item-content">
              <div class="list-item-title">${window.escapeHtml(title)}</div>
              <div class="list-item-meta">${priorityEmoji} ${card.updatedAt || ''}</div>
            </div>
          </div>
        `;
      }
      html += '</div></div>';
    }
    html += '</div>';

    mainContent.innerHTML = html;
  },

  toggleEditMode:function() {
    window.APP.editMode = !window.APP.editMode;
    const ind = document.getElementById('editModeIndicator');
    const txt = document.getElementById('editModeText');

    if (window.APP.editMode) {
      ind.classList.add('active');
      txt.textContent = t('disableEdit');
      window.showToast(t('enableEdit'));
    } else {
      ind.classList.remove('active');
      txt.textContent = t('enableEdit');
      window.showToast(t('disableEdit'));
    }

    window.UIRenderer.renderMainContent();
  },

  resetData:function() {
    if (! confirm(t('confirmReset'))) return;

    const initialData = window.WIKI_DATA_INITIAL || window.WIKI_DATA;
    window.APP.db = window.deepClone(initialData);
    window.StorageManager.saveDatabase(window.APP.db);
    window.UIRenderer.renderSidebar();
    window.UIRenderer.renderMainContent();
    window.showToast(t('reset'));
  }
};

window.handleSearch = function() {
  window.EventHandler.handleSearch();
};

let ctrlECount = 0;
document.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
    e.preventDefault();
    ctrlECount++;
    if (ctrlECount >= 3) {
      const toolbar = document.getElementById('adminToolbar');
      if (toolbar) {
        toolbar.classList.toggle('active');
      }
      window.showToast(t('adminActive'));
      ctrlECount = 0;
    }
    setTimeout(function() {
      ctrlECount = 0;
    }, 2000);
  }

  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('searchInput').focus();
  }
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const modal = document.getElementById('modalOverlay');
    if (modal && modal.classList.contains('active')) {
      window.EventHandler.closeEditModal();
    }
  }
});