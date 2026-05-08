const StatusBar = {
  updateInterval: null,

  init() {
    this.createStatusBar();
    this.startClock();
    this.updateUserInfo();
  },

  createStatusBar() {
    let statusBar = document.getElementById('statusBar');
    if (statusBar) return;

    statusBar = document.createElement('div');
    statusBar.id = 'statusBar';
    statusBar.className = 'status-bar';
    statusBar.innerHTML = `
      <style>
        .status-bar {
          position: fixed;
          bottom: 0;
          left: 180px;
          right: 0;
          height: 28px;
          background: #f8f9fa;
          border-top: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px;
          font-size: 12px;
          color: #6b7280;
          z-index: 1000;
        }

        .status-bar .status-left,
        .status-bar .status-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .status-bar .status-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .status-bar .status-item i {
          font-size: 11px;
        }

        .status-bar .status-online {
          color: #10b981;
        }

        .status-bar .status-offline {
          color: #ef4444;
        }

        .sidebar.collapsed ~ .status-bar {
          left: 55px;
        }

        .main-content-with-status {
          padding-bottom: 28px;
        }

        @media (max-width: 768px) {
          .status-bar {
            left: 55px;
          }
          .sidebar.collapsed ~ .status-bar {
            left: 0;
          }
        }
      </style>
      <div class="status-left">
        <span class="status-item" id="statusUser">
          <i class="bi bi-person"></i>
          <span id="statusUserName">-</span>
        </span>
        <span class="status-item" id="statusRole">
          <i class="bi bi-shield"></i>
          <span id="statusRoleName">-</span>
        </span>
      </div>
      <div class="status-right">
        <span class="status-item" id="statusConnection">
          <i class="bi bi-circle-fill status-online" style="font-size: 8px;"></i>
          <span>已连接</span>
        </span>
        <span class="status-item" id="statusTime">
          <i class="bi bi-clock"></i>
          <span id="currentTime">-</span>
        </span>
      </div>
    `;

    document.body.appendChild(statusBar);

    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.classList.add('main-content-with-status');
    }
  },

  startClock() {
    this.updateTime();
    this.updateInterval = setInterval(() => this.updateTime(), 1000);
  },

  updateTime() {
    const timeEl = document.getElementById('currentTime');
    if (timeEl) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      timeEl.textContent = `${hours}:${minutes}:${seconds}`;
    }
  },

  updateUserInfo() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user) {
      const userNameEl = document.getElementById('statusUserName');
      const roleNameEl = document.getElementById('statusRoleName');

      if (userNameEl) {
        userNameEl.textContent = user.name || '未知用户';
      }
      if (roleNameEl) {
        roleNameEl.textContent = user.role === 'admin' ? '管理员' : '普通用户';
      }
    }
  },

  setConnectionStatus(online) {
    const connectionEl = document.getElementById('statusConnection');
    if (connectionEl) {
      const icon = online ? 'bi-circle-fill status-online' : 'bi-circle-fill status-offline';
      const text = online ? '已连接' : '已断开';
      connectionEl.innerHTML = `
        <i class="bi ${icon}" style="font-size: 8px;"></i>
        <span>${text}</span>
      `;
    }
  },

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname !== '/login') {
    StatusBar.init();
  }
});