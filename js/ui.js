// UI Rendering - DOM manipulation and view updates

window.UIRenderer = {
  currentView:'grid',
  selectedColumnForCard:null,

  init:function() {
    this.renderHeader();
    this.renderSidebar();
    this.renderMainContent();
    this.attachUIEvents();
    this.startClock();
    this.applyDashboardState();
  },

  renderHeader:function() {
    const header = document.querySelector('.header');
    if (!header) {
      console.error('Header element not found');
      return;
    }

    const htmlContent = `
      <div class="header-left">
        <button class="menu-toggle" onclick="window.UIRenderer.toggleSidebar()">☰</button>
        <div class="header-title" id="headerTitle">${t('title')}</div>
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" class="search-input" id="searchInput" 
                 placeholder="${t('search')}" oninput="window.handleSearch()">
        </div>
      </div>
      <div class="header-center">
        <div class="header-datetime" id="headerDateTime">
          <span class="header-date">--</span>
          <span class="header-time">--:--:--</span>
        </div>
      </div>
      <div class="header-right">
        <div id="viewSwitcher" style="display:flex; gap:4px;">
          <button onclick="window.UIRenderer.switchView('grid')" id="gridViewBtn"
                  style="padding:6px 12px; background:var(--accent-primary); color:white; border:1px solid var(--accent-primary); border-radius:6px; cursor:pointer; font-size:12px; font-weight:500; transition:all 0.2s;" 
                  title="Grid View">📊 Grid</button>
          <button onclick="window.UIRenderer.switchView('list')" id="listViewBtn"
                  style="padding:6px 12px; background:var(--bg-tertiary); border:1px solid var(--border-light); border-radius:6px; cursor:pointer; font-size:12px; font-weight:500; transition:all 0.2s;" 
                  title="List View">📋 List</button>
          <button onclick="window.UIRenderer.switchView('flashcard')" id="flashcardViewBtn"
                  style="padding:6px 12px; background:var(--bg-tertiary); border:1px solid var(--border-light); border-radius:6px; cursor:pointer; font-size:12px; font-weight:500; transition:all 0.2s;" 
                  title="Flashcard View">🎴 Flash</button>
        </div>
        <div class="lang-switcher" id="langSwitcher"></div>
        <button class="icon-btn" id="dashboardToggleBtn" onclick="window.UIRenderer.toggleDashboardBar()" title="${t('hideDashboard')}">
          <span id="dashboardToggleText"></span>
        </button>
        <button class="icon-btn" onclick="window.UIRenderer.toggleTheme()" title="Toggle Theme">
          <span id="themeIcon">🌙</span>
        </button>
      </div>
    `;
    header.innerHTML = htmlContent;
    this.renderLanguageSwitcher();
    this.updateViewButtons();
    this.ensureFloatingDashboardToggle();
    this.updateDashboardToggle();
  },

  startClock:function() {
    const updateClock = function() {
      const container = document.getElementById('headerDateTime');
      if (!container) return;
      const now = new Date();
      const locale = window.APP.lang === 'zh' ? 'zh-CN' :window.APP.lang === 'ja' ? 'ja-JP' :'en-US';
      const dateText = now.toLocaleDateString(locale, {
        weekday:'short',
        month:'short',
        day:'numeric'
      });
      const timeText = now.toLocaleTimeString(locale, {
        hour:'2-digit',
        minute:'2-digit',
        second:'2-digit'
      });
      const dateEl = container.querySelector('.header-date');
      const timeEl = container.querySelector('.header-time');
      if (dateEl) dateEl.textContent = dateText;
      if (timeEl) timeEl.textContent = timeText;
    };

    updateClock();
    if (window.APP.clockInterval) {
      clearInterval(window.APP.clockInterval);
    }
    window.APP.clockInterval = setInterval(updateClock, 1000);
  },

  updateViewButtons:function() {
    document.getElementById('gridViewBtn').style.background = this.currentView === 'grid' ? 'var(--accent-primary)' :'var(--bg-tertiary)';
    document.getElementById('gridViewBtn').style.color = this.currentView === 'grid' ? 'white' :'var(--text-primary)';
    document.getElementById('gridViewBtn').style.borderColor = this.currentView === 'grid' ? 'var(--accent-primary)' :'var(--border-light)';

    document.getElementById('listViewBtn').style.background = this.currentView === 'list' ? 'var(--accent-primary)' :'var(--bg-tertiary)';
    document.getElementById('listViewBtn').style.color = this.currentView === 'list' ? 'white' :'var(--text-primary)';
    document.getElementById('listViewBtn').style.borderColor = this.currentView === 'list' ? 'var(--accent-primary)' :'var(--border-light)';

    document.getElementById('flashcardViewBtn').style.background = this.currentView === 'flashcard' ? 'var(--accent-primary)' :'var(--bg-tertiary)';
    document.getElementById('flashcardViewBtn').style.color = this.currentView === 'flashcard' ? 'white' :'var(--text-primary)';
    document.getElementById('flashcardViewBtn').style.borderColor = this.currentView === 'flashcard' ? 'var(--accent-primary)' :'var(--border-light)';
  },

  switchView:function(viewName) {
    this.currentView = viewName;
    this.updateViewButtons();
    this.renderMainContent();
  },

  renderLanguageSwitcher:function() {
    const container = document.getElementById('langSwitcher');
    const langs = ['ja', 'zh', 'en'];
    const labels = {
      'ja':'日本語',
      'zh':'中文',
      'en':'EN'
    };

    let html = '';
    for (let i = 0; i < langs.length; i++) {
      const lang = langs[i];
      const isActive = window.APP.lang === lang ?  'active' :'';
      html += `<button class="lang-btn ${isActive}" data-lang="${lang}" 
                      onclick="window.UIRenderer.switchLanguage('${lang}')">${labels[lang]}</button>`;
    }
    container.innerHTML = html;
  },

  renderSidebar:function() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) {
      console.error('Sidebar element not found');
      return;
    }

    let html = `<div class="sidebar-title">${t('modules')}</div><div id="sidebarNav"></div>`;
    sidebar.innerHTML = html;

    const nav = document.getElementById('sidebarNav');
    for (let i = 0; i < window.APP.db.length; i++) {
      const module = window.APP.db[i];
      const isActive = window.APP.currentModule === module.id ? 'active' :'';
      const editClass = window.APP.editMode ? 'edit-mode' :'';

      const itemHtml = `
        <div class="nav-item ${isActive} ${editClass}" data-module-id="${module.id}" onclick="window.UIRenderer.selectModule('${module.id}')">
          <div class="nav-item-content">
            <span class="nav-icon">${module.icon || '📁'}</span>
            <span class="nav-item-text">${window.txt(module.name)}</span>
          </div>
          ${window.APP.editMode ? `
            <div class="nav-item-actions" onclick="event.stopPropagation()">
              <button class="nav-action-btn" title="${t('moveUp')}" onclick="window.EventHandler.moveModule('${module.id}', -1)">⬆️</button>
              <button class="nav-action-btn" title="${t('moveDown')}" onclick="window.EventHandler.moveModule('${module.id}', 1)">⬇️</button>
              <button class="nav-action-btn" title="Edit" onclick="window.EventHandler.editModule('${module.id}')">✏️</button>
              <button class="nav-action-btn" title="Delete" onclick="window.EventHandler.deleteModule('${module.id}')">🗑️</button>
            </div>
          ` :''}
        </div>
      `;
      nav.innerHTML += itemHtml;
    }

    const footer = document.createElement('div');
    footer.className = 'sidebar-footer';
    footer.innerHTML = `
      <button class="trash-btn" onclick="window.EventHandler.openTrashModal()">
        🗑️ ${t('trash')}
        <span class="trash-count ${window.APP.trash && window.APP.trash.length ? '' :'hidden'}">${window.APP.trash ? window.APP.trash.length : 0}</span>
      </button>
    `;
    sidebar.appendChild(footer);
  },

  renderMainContent:function() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) {
      console.error('Main content element not found');
      return;
    }

    if (!  window.APP.currentModule) {
      mainContent.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><h3>Select a module</h3></div>';
      return;
    }

    switch (this.currentView) {
      case 'grid':
        this.renderGridView();
        break;
      case 'list':
        this.renderListView();
        break;
      case 'flashcard':
        this.renderFlashcardView();
        break;
      default:
        this.renderGridView();
    }
  },

renderGridView:function() {
  const mainContent = document.querySelector('.main-content');
  const module = window.DataManager.getModule(window.APP.currentModule);

  if (!module) {
    mainContent.innerHTML = '<div class="empty-state"><div class="empty-icon">❌</div><h3>Module not found</h3></div>';
    return;
  }

  let boardHtml = '<div class="board">';

  for (let i = 0; i < module.columns.length; i++) {
    const column = module.columns[i];
    const columnHtml = `
      <div class="column" data-column-id="${column.id}">
        <div class="column-header">
          <div class="column-title" style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
            <div style="flex:1;">
              ${window.txt(column.name)}
              <span class="column-count">${column.cards.length} ${t('cards')}</span>
            </div>
            ${window.APP.editMode ? `
              <div style="display:flex; gap:4px; flex-shrink:0;">
                <button class="move-btn" title="${t('moveUp')}" onclick="event.stopPropagation(); window.EventHandler.moveColumn('${window.APP.currentModule}', '${column.id}', -1)">⬆️</button>
                <button class="move-btn" title="${t('moveDown')}" onclick="event.stopPropagation(); window.EventHandler.moveColumn('${window.APP.currentModule}', '${column.id}', 1)">⬇️</button>
                <button style="padding:4px 8px; background:var(--bg-tertiary); border:1px solid var(--border-light); border-radius:4px; cursor:pointer; font-size:12px; color:var(--text-secondary);" title="Edit" onclick="event.stopPropagation(); window.EventHandler.editColumn('${column.id}', '${window.APP.currentModule}')">✏️</button>
                <button style="padding:4px 8px; background:var(--bg-tertiary); border:1px solid var(--border-light); border-radius:4px; cursor:pointer; font-size:12px; color:var(--text-secondary);" title="Delete" onclick="event.stopPropagation(); window.EventHandler.deleteColumn('${column.id}', '${window.APP.currentModule}')">🗑️</button>
              </div>
            ` :''}
          </div>
        </div>
        <div class="cards-container" id="col-${column.id}"></div>
        ${window.APP.editMode ? `
          <button class="card-add-btn" onclick="window.EventHandler.openAddCardModal('${column.id}', '${window.APP.currentModule}')">
            ➕ Add Card Here
          </button>
        ` :''}
      </div>
    `;
    boardHtml += columnHtml;
  }

  // 只在 Edit Mode 时显示 Add Column 按钮
  if (window.APP.editMode) {
    boardHtml += `
      <div class="column-add-btn" onclick="window.EventHandler.addNewColumn('${window.APP.currentModule}')" 
           style="min-height:300px; display:flex; align-items:center; justify-content:center;">
        ➕ Add Column
      </div>
    `;
  }

  boardHtml += '</div>';
  mainContent.innerHTML = boardHtml;

  for (let i = 0; i < module.columns.length; i++) {
    const column = module.columns[i];
    const container = document.getElementById('col-' + column.id);

    for (let j = 0; j < column.cards.length; j++) {
      const card = column.cards[j];
      const cardElement = this.createCardElement(card, column.id, window.APP.currentModule);
      container.appendChild(cardElement);
    }
  }
},

  createCardElement:function(card, columnId, moduleId) {
    const div = document.createElement('div');
    div.className = 'card';
    div.dataset.cardId = card.id;
    div.dataset.columnId = columnId;
    div.dataset.moduleId = moduleId;

    if (window.isExpired(card.expiryDate)) {
      div.classList.add('expired');
    } else if (card.expiryDate) {
      const daysLeft = window.getDaysUntilExpiry(card.expiryDate);
      if (daysLeft !== null && daysLeft <= 3) {
        div.classList.add('expiring-soon');
      }
    }

    const title = window.txt(card.title);
    const priority = card.priority || 'low';
    const priorityEmoji = window.getPriorityBadge(priority);

    let metaHtml = '';
    if (card.updatedAt) {
      metaHtml += `<div class="card-meta-item">🕐 ${card.updatedAt}</div>`;
    }
    if (card.expiryDate) {
      const daysLeft = window.getDaysUntilExpiry(card.expiryDate);
      if (window.isExpired(card.expiryDate)) {
        metaHtml += `<div class="card-meta-item" style="color:var(--priority-high);">⏰ Expired</div>`;
      } else if (daysLeft !== null && daysLeft <= 7) {
        metaHtml += `<div class="card-meta-item" style="color:var(--priority-medium);">⏰ ${daysLeft}d left</div>`;
      }
    }

    let tagsHtml = '';
    if (card.tags && card.tags.length > 0) {
      for (let i = 0; i < card.tags.length; i++) {
        tagsHtml += `<span class="tag">${card.tags[i]}</span>`;
      }
    }

    let actionsHtml = `
      <button class="pin-btn ${card.pinned ? 'pinned' :''}" title="${t('pin')}"
              onclick="window.EventHandler.togglePin('${card.id}', '${columnId}', '${moduleId}')">⭐</button>
      <button class="copy-btn" title="${t('copy')}"
              onclick="window.EventHandler.copyCard('${card.id}', '${columnId}', '${moduleId}', this)">📋</button>
    `;

    if (window.APP.editMode) {
      actionsHtml += `
        <button class="move-btn" title="${t('moveUp')}"
                onclick="event.stopPropagation(); window.EventHandler.moveCard('${moduleId}', '${columnId}', '${card.id}', -1)">⬆️</button>
        <button class="move-btn" title="${t('moveDown')}"
                onclick="event.stopPropagation(); window.EventHandler.moveCard('${moduleId}', '${columnId}', '${card.id}', 1)">⬇️</button>
        <button class="edit-btn" title="${t('edit')}"
                onclick="window.EventHandler.openEditModal('${card.id}', '${columnId}', '${moduleId}')">✏️</button>
        <button class="delete-btn" title="${t('delete')}"
                onclick="window.EventHandler.deleteCard('${card.id}', '${columnId}', '${moduleId}')">🗑️</button>
      `;
    }

    const content = this.formatContent(card);

    const cardHtml = `
      <div class="card-header">
        <div class="card-title-area">
          <div class="card-title" ondblclick="window.APP.editMode && window.EventHandler.openEditModal('${card.id}', '${columnId}', '${moduleId}')">
            ${window.escapeHtml(title)}
          </div>
          <div class="card-meta">
            <div class="card-meta-item"><span class="card-priority">${priorityEmoji}</span></div>
            ${metaHtml}
          </div>
          <div class="card-tags">
            <span class="card-tag type-${card.type}">${card.type.toUpperCase()}</span>
            ${tagsHtml}
          </div>
        </div>
        <div class="card-actions">
          ${actionsHtml}
        </div>
      </div>
      <div class="card-content">${content}</div>
    `;

    div.innerHTML = cardHtml;
    return div;
  },

  formatContent:function(card) {
    const content = window.txt(card.content);
    const type = card.type;

    if (type === 'url') {
      if (content.indexOf('http') === 0) {
        return `<a href="${window.escapeHtml(content)}" target="_blank">🌐 ${window.escapeHtml(content)}</a>`;
      } else if (content.indexOf('\\\\') === 0) {
        return `<span title="⚠️ Localhost paths not supported in browser">🔗 ${window.escapeHtml(content)}</span>`;
      }
      const lines = content.split('\n');
      let result = '';
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.indexOf('http') === 0) {
          result += `<a href="${window.escapeHtml(line)}" target="_blank">🌐 ${window.escapeHtml(line)}</a>`;
        } else if (line.length > 0) {
          result += window.escapeHtml(line);
        }
        if (i < lines.length - 1) result += '<br>';
      }
      return result;
    }

    if (type === 'code') {
      return `<pre>${window.escapeHtml(content)}</pre>`;
    }

    if (type === 'list') {
      const items = content.split('\n');
      let html = '<ul>';
      for (let i = 0; i < items.length; i++) {
        if (items[i].trim()) {
          html += `<li>${window.escapeHtml(items[i])}</li>`;
        }
      }
      html += '</ul>';
      return html;
    }

    return window.escapeHtml(content).replace(/\n/g, '<br>');
  },

  toggleSidebar:function() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('open');
    }
  },

  selectModule:function(moduleId) {
    window.APP.currentModule = moduleId;
    window.StorageManager.saveLanguage(window.APP.lang);

    document.querySelectorAll('.nav-item').forEach(function(item) {
      item.classList.remove('active');
    });

    const selected = document.querySelector('[data-module-id="' + moduleId + '"]');
    if (selected) {
      selected.classList.add('active');
    }

    this.renderMainContent();

    if (window.innerWidth <= 768) {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        sidebar.classList.remove('open');
      }
    }
  },

  toggleTheme:function() {
    const newTheme = window.APP.theme === 'light' ? 'dark' :'light';
    window.APP.theme = newTheme;
    document.documentElement.setAttribute('data-theme', newTheme);
    document.getElementById('themeIcon').textContent = newTheme === 'light' ? '🌙' :'☀️';
    window.StorageManager.saveTheme(newTheme);
  },

  switchLanguage:function(lang) {
    window.APP.lang = lang;
    window.StorageManager.saveLanguage(lang);

    document.querySelectorAll('.lang-btn').forEach(function(btn) {
      btn.classList.remove('active');
    });

    const active = document.querySelector('[data-lang="' + lang + '"]');
    if (active) {
      active.classList.add('active');
    }

    this.updateUIText();
    this.renderSidebar();
    this.renderMainContent();
    this.startClock();
    this.updateDashboardToggle();
  },

  updateUIText:function() {
    document.getElementById('headerTitle').textContent = t('title');
    document.getElementById('searchInput').placeholder = t('search');
  },

  ensureFloatingDashboardToggle:function() {
    if (document.getElementById('dashboardFloatingToggle')) return;
    const btn = document.createElement('button');
    btn.id = 'dashboardFloatingToggle';
    btn.className = 'dashboard-toggle-floating';
    btn.onclick = function() {
      window.UIRenderer.toggleDashboardBar();
    };
    document.body.appendChild(btn);
  },

  applyDashboardState:function() {
    document.body.classList.toggle('dashboard-hidden', window.APP.dashboardHidden);
    this.updateDashboardToggle();
  },

  updateDashboardToggle:function() {
    const label = window.APP.dashboardHidden ? t('showDashboard') : t('hideDashboard');
    const headerBtn = document.getElementById('dashboardToggleBtn');
    const headerText = document.getElementById('dashboardToggleText');
    const floatingBtn = document.getElementById('dashboardFloatingToggle');

    if (headerText) headerText.textContent = label;
    if (headerBtn) headerBtn.title = label;
    if (floatingBtn) {
      floatingBtn.textContent = t('showDashboard');
      floatingBtn.title = t('showDashboard');
    }
  },

  toggleDashboardBar:function() {
    window.APP.dashboardHidden = !window.APP.dashboardHidden;
    window.StorageManager.saveDashboardVisibility(window.APP.dashboardHidden);
    this.applyDashboardState();
  },

  renderListView:function() {
    const mainContent = document.querySelector('.main-content');
    const cards = window.DataManager.getCardsSorted(window.APP.currentModule);

    if (cards.length === 0) {
      mainContent.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><h3>No cards</h3></div>';
      return;
    }

    let html = '<div class="list-view">';
    for (let i = 0; i < cards.length; i++) {
      const item = cards[i];
      const card = item.card;
      const title = window.txt(card.title);
      const priorityEmoji = window.getPriorityBadge(card.priority || 'low');

      html += `
        <div class="list-item" data-card-id="${card.id}">
          <div class="list-item-icon">${card.type === 'url' ? '🌐' :card.type === 'code' ? '💻' :'📝'}</div>
          <div class="list-item-content">
            <div class="list-item-title">${window.escapeHtml(title)}</div>
            <div class="list-item-meta">${priorityEmoji} ${card.updatedAt || ''}</div>
          </div>
        </div>
      `;
    }
    html += '</div>';
    mainContent.innerHTML = html;
  },

  renderFlashcardView:function() {
    const mainContent = document.querySelector('.main-content');
    const cards = window.DataManager.getCardsSorted(window.APP.currentModule);

    if (cards.length === 0) {
      mainContent.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><h3>No cards</h3></div>';
      return;
    }

    mainContent.innerHTML = '<div id="flashcardContainer"></div>';
    window.FlashcardManager.init(cards);
  },

  attachUIEvents:function() {
    window.addEventListener('resize', function() {
      if (window.innerWidth > 768) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
          sidebar.classList.remove('open');
        }
      }
    });
  }
};
