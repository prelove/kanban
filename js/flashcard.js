// Flashcard functionality - full screen card view

window.FlashcardManager = {
  cards:[],
  currentIndex:0,
  autoPlayActive:false,
  autoPlayInterval:null,

  // Initialize flashcard view
  init:function(cardsData) {
    this.cards = cardsData;
    this.currentIndex = 0;
    this.autoPlayActive = false;
    this.render();
    this.attachEvents();
  },

  // Render flashcard UI
  render:function() {
    const container = document.getElementById('flashcardContainer');
    if (!container) return;

    if (this.cards.length === 0) {
      container.innerHTML = '<div class="empty-state"><h3>No cards</h3></div>';
      return;
    }

    const card = this.cards[this.currentIndex].card;
    const title = window.txt(card.title);
    const content = window.txt(card.content);
    const priority = window.getPriorityBadge(card.priority || 'low');

    const html = `
      <div style="display:flex; flex-direction:column; height:100%; align-items:center; justify-content:center; padding:40px;">
        <div style="max-width:800px; width:100%;">
          <!-- Progress bar -->
          <div style="margin-bottom:24px; display:flex; justify-content:space-between; align-items:center;">
            <div style="font-size:14px; color:var(--text-secondary);">
              ${this.currentIndex + 1} / ${this.cards.length}
            </div>
            <div style="flex:1; height:4px; background:var(--border-color); border-radius:2px; margin:0 16px; overflow:hidden;">
              <div style="height:100%; background:var(--accent-primary); width:${((this.currentIndex + 1) / this.cards.length) * 100}%; transition:width 0.3s;"></div>
            </div>
          </div>

          <!-- Main card -->
          <div style="background:var(--bg-secondary); border:2px solid var(--border-color); border-radius:16px; padding:60px 40px; text-align:center; min-height:400px; display:flex; flex-direction:column; justify-content:center;">
            <div style="margin-bottom:20px; font-size:24px;">${priority}</div>
            <h2 style="margin-bottom:30px; font-size:32px; font-weight:600;">${window.escapeHtml(title)}</h2>
            <div style="font-size:16px; line-height:1.8; color:var(--text-secondary);">
              ${this.formatFlashcardContent(card)}
            </div>
          </div>

          <!-- Controls -->
          <div style="margin-top:40px; display:flex; justify-content:center; gap:16px; flex-wrap:wrap;">
            <button onclick="window.FlashcardManager.previous()" style="padding:12px 24px; background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:8px; cursor:pointer; font-size:16px;">⬅ ${t('previous')}</button>

            <button id="autoPlayBtn" onclick="window.FlashcardManager.toggleAutoPlay()" style="padding:12px 24px; background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:8px; cursor:pointer; font-size:16px;">⏯ ${t('autoPlay')}</button>

            <button onclick="window.FlashcardManager.next()" style="padding:12px 24px; background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:8px; cursor:pointer; font-size:16px;">${t('next')} ➡</button>

            <button onclick="window.FlashcardManager.shuffle()" style="padding:12px 24px; background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:8px; cursor:pointer; font-size:16px;">🔀 ${t('shuffle')}</button>

            <button onclick="window.UIRenderer.currentView='grid'; window.UIRenderer.renderMainContent()" style="padding:12px 24px; background:var(--accent-primary); color:white; border:none; border-radius:8px; cursor:pointer; font-size:16px;">✕ Exit</button>
          </div>

          <!-- Info -->
          <div style="margin-top:32px; text-align:center; font-size:12px; color:var(--text-secondary);">
            <p>Use arrow keys (← →) to navigate | Space to auto-play</p>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    this.updateAutoPlayButton();
  },

  // Format content for flashcard display
  formatFlashcardContent:function(card) {
    const content = window.txt(card.content);
    const type = card.type;

    if (type === 'url') {
      if (content.indexOf('http') === 0) {
        return `<a href="${window.escapeHtml(content)}" target="_blank" style="color:var(--accent-primary); text-decoration:underline;">🌐 ${window.escapeHtml(content)}</a>`;
      }
      return `<span style="color:var(--text-secondary);">🔗 ${window.escapeHtml(content)}</span>`;
    }

    if (type === 'code') {
      return `<pre style="text-align:left; background:var(--bg-tertiary); padding:16px; border-radius:8px; overflow-x:auto; max-height:200px;">${window.escapeHtml(content)}</pre>`;
    }

    if (type === 'list') {
      const items = content.split('\n');
      let html = '<ul style="text-align:left; margin:0 auto; display:inline-block;">';
      for (let i = 0; i < items.length; i++) {
        if (items[i].trim()) {
          html += `<li>${window.escapeHtml(items[i])}</li>`;
        }
      }
      html += '</ul>';
      return html;
    }

    return `<p>${window.escapeHtml(content).replace(/\n/g, '<br>')}</p>`;
  },

  // Navigate to next card
  next:function() {
    if (this.currentIndex < this.cards.length - 1) {
      this.currentIndex++;
      this.render();
    } else {
      window.showToast('Last card');
    }
  },

  // Navigate to previous card
  previous:function() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.render();
    } else {
      window.showToast('First card');
    }
  },

  // Shuffle cards
  shuffle:function() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = this.cards[i];
      this.cards[i] = this.cards[j];
      this.cards[j] = temp;
    }
    this.currentIndex = 0;
    this.render();
    window.showToast('Shuffled');
  },

  // Toggle auto-play
  toggleAutoPlay:function() {
    this.autoPlayActive = !this.autoPlayActive;

    if (this.autoPlayActive) {
      this.autoPlayInterval = setInterval(() => {
        if (this.currentIndex < this.cards.length - 1) {
          this.currentIndex++;
          this.render();
        } else {
          this.autoPlayActive = false;
          clearInterval(this.autoPlayInterval);
          this.updateAutoPlayButton();
        }
      }, 5000);
      window.showToast('Auto-play started');
    } else {
      clearInterval(this.autoPlayInterval);
      window.showToast('Auto-play stopped');
    }

    this.updateAutoPlayButton();
  },

  // Update auto-play button appearance
  updateAutoPlayButton:function() {
    const btn = document.getElementById('autoPlayBtn');
    if (btn) {
      if (this.autoPlayActive) {
        btn.style.background = 'var(--accent-primary)';
        btn.style.color = 'white';
      } else {
        btn.style.background = 'var(--bg-tertiary)';
        btn.style.color = 'var(--text-primary)';
      }
    }
  },

  // Attach keyboard events
  attachEvents:function() {
    const self = this;
    const keyListener = function(e) {
      if (window.UIRenderer.currentView !== 'flashcard') {
        document.removeEventListener('keydown', keyListener);
        return;
      }

      if (e.key === 'ArrowRight') {
        self.next();
      } else if (e.key === 'ArrowLeft') {
        self.previous();
      } else if (e.key === ' ') {
        e.preventDefault();
        self.toggleAutoPlay();
      }
    };

    document.addEventListener('keydown', keyListener);
  }
};