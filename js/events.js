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

    const module = window.DataManager.getModule(moduleId);
    if (!module) return;
    const column = module.columns.find(function(col) { return col.id === columnId; });
    if (!column) return;
    const cardIndex = column.cards.findIndex(function(card) { return card.id === cardId; });
    const card = cardIndex >= 0 ? column.cards[cardIndex] : null;

    if (!card) return;

    const trashItem = {
      id:'trash-' + Date.now(),
      type:'card',
      data:window.deepClone(card),
      location:{
        moduleId:moduleId,
        columnId:columnId,
        index:cardIndex
      },
      deletedAt:new Date().toISOString()
    };

    window.DataManager.addToTrash(trashItem);

    if (window.DataManager.deleteCard(moduleId, columnId, cardId)) {
      window.UIRenderer.renderMainContent();
      window.UIRenderer.renderSidebar();
      window.showToast(t('deleted'));
    }
  },

  showEmojiPicker:function(type, onConfirm, onCancel) {
    const existing = document.getElementById('emojiPickerOverlay');
    if (existing) {
      existing.parentNode.removeChild(existing);
    }

    const emojis = window.EMOJI_OPTIONS[type] || window.EMOJI_OPTIONS.other;
    let selectedEmoji = null;

    const overlay = document.createElement('div');
    overlay.id = 'emojiPickerOverlay';
    overlay.style.cssText = 'position:fixed; inset:0; z-index:2999; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center;';

    const picker = document.createElement('div');
    picker.style.cssText = 'background:var(--bg-secondary); border:2px solid var(--border-color); border-radius:12px; padding:20px; width:360px; max-width:90vw; box-shadow:0 4px 12px rgba(0,0,0,0.3);';

    const emojiButtons = emojis.map(function(e) {
      return '<button class="emoji-option-btn" data-emoji="' + e + '" style="padding:8px 12px; font-size:20px; border:1px solid var(--border-light); border-radius:8px; background:var(--bg-tertiary); cursor:pointer; transition:all 0.2s;">' + e + '</button>';
    }).join('');

    picker.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div style="font-weight:600; font-size:16px;">Select an icon</div>
        <button class="modal-close" data-action="cancel">✕</button>
      </div>
      <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:8px; margin-bottom:12px;">
        ${emojiButtons}
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
        <div style="font-size:12px; color:var(--text-secondary);">Selected: <span id="selectedEmojiText">—</span></div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-secondary" data-action="cancel">Cancel</button>
          <button class="btn btn-primary" data-action="confirm" disabled>Confirm</button>
        </div>
      </div>
    `;

    overlay.appendChild(picker);
    document.body.appendChild(overlay);

    const updateSelection = function(emoji) {
      selectedEmoji = emoji;
      const text = picker.querySelector('#selectedEmojiText');
      if (text) text.textContent = emoji;
      const confirmBtn = picker.querySelector('[data-action="confirm"]');
      if (confirmBtn) confirmBtn.disabled = false;
      picker.querySelectorAll('.emoji-option-btn').forEach(function(btn) {
        btn.style.borderColor = btn.dataset.emoji === emoji ? 'var(--accent-primary)' :'var(--border-light)';
        btn.style.background = btn.dataset.emoji === emoji ? 'var(--accent-bg)' :'var(--bg-tertiary)';
      });
    };

    picker.querySelectorAll('.emoji-option-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        updateSelection(btn.dataset.emoji);
      });
    });

    const closePicker = function() {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    };

    picker.querySelectorAll('[data-action="cancel"]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        closePicker();
        if (typeof onCancel === 'function') onCancel();
      });
    });

    const confirmBtn = picker.querySelector('[data-action="confirm"]');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function() {
        if (!selectedEmoji) return;
        closePicker();
        if (typeof onConfirm === 'function') onConfirm(selectedEmoji);
      });
    }
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
	  window.EventHandler.showEmojiPicker('module', window.EventHandler.updateModuleIcon, function() {
      window.APP.pendingModule = null;
    });
	},

	updateModuleIcon:function(icon) {
	  const module = window.APP.pendingModule;
    if (!module) return;
	  module.icon = icon;
    window.APP.pendingModule = null;

	  window.StorageManager.saveDatabase(window.APP.db);
	  window.UIRenderer.renderSidebar();
	  window.UIRenderer.renderMainContent();
	  window.showToast('✅ Module updated');
	},
		
	addNewModule:function() {
	  const moduleName = prompt('Enter module name (or format:ja|中文|English):');
	  if (!moduleName) return;

	  window.APP.pendingModuleName = moduleName;
	  window.EventHandler.showEmojiPicker('module', window.EventHandler.createModule, function() {
      window.APP.pendingModuleName = null;
    });
	},

	createModule:function(icon) {
	  const moduleName = window.APP.pendingModuleName;
    if (!moduleName) return;
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
    window.APP.pendingModuleName = null;
	  window.StorageManager.saveDatabase(window.APP.db);
	  window.UIRenderer.renderSidebar();
	  window.UIRenderer.renderMainContent();
	  window.showToast('✅ Module added');
	},
	
  deleteModule:function(moduleId) {
    if (! confirm(t('confirmDeleteModule'))) return;

    const index = window.APP.db.findIndex(function(module) { return module.id === moduleId; });
    if (index === -1) return;
    const module = window.APP.db[index];

    window.DataManager.addToTrash({
      id:'trash-' + Date.now(),
      type:'module',
      data:window.deepClone(module),
      location:{ index:index },
      deletedAt:new Date().toISOString()
    });

    window.APP.db.splice(index, 1);

    if (window.APP.currentModule === moduleId) {
      window.APP.currentModule = window.APP.db.length > 0 ? window.APP.db[0].id :null;
    }

    window.StorageManager.saveDatabase(window.APP.db, window.APP.trash);
    window.UIRenderer.renderSidebar();
    window.UIRenderer.renderMainContent();
    window.showToast(t('deleted'));
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
    if (!confirm(t('confirmDeleteColumn'))) return;

    const module = window.DataManager.getModule(moduleId);
    if (!module) return;

    const columnIndex = module.columns.findIndex(function(column) { return column.id === columnId; });
    if (columnIndex === -1) return;

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

    const column = module.columns[columnIndex];
    window.DataManager.addToTrash({
      id:'trash-' + Date.now(),
      type:'column',
      data:window.deepClone(column),
      location:{
        moduleId:moduleId,
        index:columnIndex
      },
      deletedAt:new Date().toISOString()
    });

    module.columns = newColumns;
    window.StorageManager.saveDatabase(window.APP.db, window.APP.trash);
    window.UIRenderer.renderMainContent();
    window.UIRenderer.renderSidebar();
    window.showToast(t('deleted'));
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

    const overlay = document.createElement('div');
    overlay.id = 'columnSelectorOverlay';
    overlay.style.cssText = 'position:fixed; inset:0; z-index:2999; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center;';

    const selector = document.createElement('div');
    selector.style.cssText = 'background:var(--bg-secondary); border:2px solid var(--border-color); border-radius:12px; padding:20px; max-width:400px; width:90%; box-shadow:0 4px 12px rgba(0,0,0,0.3);';
    selector.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h3 style="margin:0;">Select Column</h3>
        <button class="modal-close" onclick="window.EventHandler.closeColumnSelector()">✕</button>
      </div>
      <div>${colHtml}</div>
      <div style="display:flex; justify-content:flex-end; margin-top:12px;">
        <button class="btn btn-secondary" onclick="window.EventHandler.closeColumnSelector()">Cancel</button>
      </div>
    `;

    overlay.appendChild(selector);
    document.body.appendChild(overlay);
  },

  closeColumnSelector:function() {
    const overlay = document.getElementById('columnSelectorOverlay');
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
  },

  selectColumnAndAddCard:function(columnId) {
    window.EventHandler.closeColumnSelector();
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

  moveModule:function(moduleId, direction) {
    if (window.DataManager.moveModule(moduleId, direction)) {
      window.UIRenderer.renderSidebar();
    }
  },

  moveColumn:function(moduleId, columnId, direction) {
    if (window.DataManager.moveColumn(moduleId, columnId, direction)) {
      window.UIRenderer.renderMainContent();
    }
  },

  moveCard:function(moduleId, columnId, cardId, direction) {
    if (window.DataManager.moveCard(moduleId, columnId, cardId, direction)) {
      window.UIRenderer.renderMainContent();
    }
  },

  openTrashModal:function() {
    window.EventHandler.closeTrashModal();
    const trash = window.APP.trash || [];
    const modal = document.createElement('div');
    modal.className = 'trash-modal';
    modal.innerHTML = `
      <div class="trash-modal-header">
        <div class="trash-modal-title">${t('trash')}</div>
        <button class="trash-modal-close" onclick="window.EventHandler.closeTrashModal()">✕</button>
      </div>
      <div class="trash-modal-body">
        ${trash.length === 0 ? `<div class="trash-empty">${t('trashEmpty')}</div>` :''}
        ${trash.map(function(item, index) {
          return `
            <div class="trash-item">
              <div class="trash-item-info">
                <div class="trash-item-title">${window.escapeHtml(window.EventHandler.getTrashItemTitle(item))}</div>
                <div class="trash-item-meta">${window.EventHandler.getTrashItemMeta(item)}</div>
              </div>
              <div class="trash-item-actions">
                <button class="trash-action-btn" onclick="window.EventHandler.restoreTrashItem(${index})">${t('restore')}</button>
                <button class="trash-action-btn danger" onclick="window.EventHandler.deleteTrashItem(${index})">${t('deleteForever')}</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      ${trash.length > 0 ? `
        <div class="trash-modal-footer">
          <button class="trash-action-btn" onclick="window.EventHandler.restoreAllTrash()">${t('restoreAll')}</button>
          <button class="trash-action-btn danger" onclick="window.EventHandler.emptyTrash()">${t('emptyTrash')}</button>
        </div>
      ` :''}
    `;

    const overlay = document.createElement('div');
    overlay.className = 'trash-overlay';

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
  },

  closeTrashModal:function() {
    const modal = document.querySelector('.trash-modal');
    const overlay = document.querySelector('.trash-overlay');
    if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
  },

  getTrashItemTitle:function(item) {
    if (!item || !item.data) return t('trashItem');
    if (item.type === 'module') return window.txt(item.data.name);
    if (item.type === 'column') return window.txt(item.data.name);
    if (item.type === 'card') return window.txt(item.data.title);
    return t('trashItem');
  },

  getTrashItemMeta:function(item) {
    if (!item) return '';
    const typeLabel = item.type === 'module' ? t('module') : item.type === 'column' ? t('column') : t('card');
    return typeLabel + ' · ' + new Date(item.deletedAt).toLocaleString();
  },

  restoreTrashItem:function(index, skipModalRefresh) {
    const item = window.APP.trash[index];
    if (!item) return;

    if (item.type === 'module') {
      const insertIndex = item.location && typeof item.location.index === 'number' ? item.location.index : window.APP.db.length;
      const safeIndex = Math.min(Math.max(insertIndex, 0), window.APP.db.length);
      window.APP.db.splice(safeIndex, 0, window.deepClone(item.data));
    } else if (item.type === 'column') {
      const module = window.DataManager.getModule(item.location.moduleId);
      if (!module) {
        window.showToast(t('restoreFailed'));
        return;
      }
      const insertIndex = item.location && typeof item.location.index === 'number' ? item.location.index : module.columns.length;
      const safeIndex = Math.min(Math.max(insertIndex, 0), module.columns.length);
      module.columns.splice(safeIndex, 0, window.deepClone(item.data));
    } else if (item.type === 'card') {
      const module = window.DataManager.getModule(item.location.moduleId);
      if (!module) {
        window.showToast(t('restoreFailed'));
        return;
      }
      const column = module.columns.find(function(col) { return col.id === item.location.columnId; });
      if (!column) {
        window.showToast(t('restoreFailed'));
        return;
      }
      const insertIndex = item.location && typeof item.location.index === 'number' ? item.location.index : column.cards.length;
      const safeIndex = Math.min(Math.max(insertIndex, 0), column.cards.length);
      column.cards.splice(safeIndex, 0, window.deepClone(item.data));
    }

    window.DataManager.removeTrashAt(index);
    window.StorageManager.saveDatabase(window.APP.db, window.APP.trash);
    window.UIRenderer.renderSidebar();
    window.UIRenderer.renderMainContent();
    if (!skipModalRefresh) {
      window.EventHandler.closeTrashModal();
      window.EventHandler.openTrashModal();
    }
    window.showToast(t('restored'));
  },

  deleteTrashItem:function(index) {
    if (!confirm(t('confirmDeleteForever'))) return;
    window.DataManager.removeTrashAt(index);
    window.StorageManager.saveDatabase(window.APP.db, window.APP.trash);
    window.UIRenderer.renderSidebar();
    window.EventHandler.closeTrashModal();
    window.EventHandler.openTrashModal();
  },

  restoreAllTrash:function() {
    const items = window.APP.trash.slice();
    for (let i = items.length - 1; i >= 0; i--) {
      window.EventHandler.restoreTrashItem(i, true);
    }
    window.EventHandler.closeTrashModal();
    window.EventHandler.openTrashModal();
  },

  emptyTrash:function() {
    if (!confirm(t('confirmEmptyTrash'))) return;
    window.APP.trash = [];
    window.StorageManager.saveDatabase(window.APP.db, window.APP.trash);
    window.UIRenderer.renderSidebar();
    window.EventHandler.closeTrashModal();
    window.showToast(t('trashCleared'));
  },

  resetData:function() {
    if (! confirm(t('confirmReset'))) return;

    const initialData = window.WIKI_DATA_INITIAL || window.WIKI_DATA;
    window.APP.db = window.deepClone(initialData);
    window.APP.trash = [];
    window.StorageManager.saveDatabase(window.APP.db, window.APP.trash);
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
    return;
  }
});
