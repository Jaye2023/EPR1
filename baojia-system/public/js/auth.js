const Auth = {
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  },

  isLoginPage() {
    return window.location.pathname === '/login';
  },

  async checkAuth() {
    if (!this.token) {
      if (!this.isLoginPage()) {
        this.redirectToLogin();
      }
      return false;
    }

    try {
      const res = await fetch('/api/auth/me', { headers: this.getHeaders() });
      if (!res.ok) {
        await this.logout();
        return false;
      }
      this.user = await res.json();
      localStorage.setItem('user', JSON.stringify(this.user));
      return true;
    } catch (error) {
      console.error('认证检查失败:', error);
      if (!this.isLoginPage()) {
        await this.logout();
      }
      return false;
    }
  },

  redirectToLogin() {
    if (this.isLoginPage()) return;
    window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
  },

  async logout() {
    if (this.token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: this.getHeaders()
        });
      } catch (error) {
        console.log('登出请求失败，继续执行本地登出');
      }
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.token = null;
    this.user = null;
    this.redirectToLogin();
  },

  updateUserInfo() {
    const userNameEl = document.getElementById('sidebarUserName');
    const userRoleEl = document.getElementById('sidebarUserRole');
    
    if (userNameEl && this.user) {
      userNameEl.textContent = this.user.name;
    }
    if (userRoleEl && this.user) {
      userRoleEl.textContent = this.user.role === 'admin' ? '系统管理员' : '普通用户';
    }
  },

  isAdmin() {
    return this.user && this.user.role === 'admin';
  },

  async init() {
    const authenticated = await this.checkAuth();
    if (authenticated) {
      this.updateUserInfo();
      this.addLogoutButton();
    }
    return authenticated;
  },

  addLogoutButton() {
    const userInfo = document.querySelector('.user-info');
    if (userInfo && !document.getElementById('logoutBtn')) {
      userInfo.style.cursor = 'pointer';
      userInfo.title = '点击退出登录';
      userInfo.onclick = () => {
        if (confirm('确定要退出登录吗？')) {
          this.logout();
        }
      };
    }
  }
};

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('mainContent');
  const icon = document.getElementById('toggleIcon');

  sidebar.classList.toggle('collapsed');
  mainContent.classList.toggle('expanded');

  if (sidebar.classList.contains('collapsed')) {
    icon.classList.remove('bi-chevron-left');
    icon.classList.add('bi-chevron-right');
    sessionStorage.setItem('sidebarCollapsed', 'true');
  } else {
    icon.classList.remove('bi-chevron-right');
    icon.classList.add('bi-chevron-left');
    sessionStorage.setItem('sidebarCollapsed', 'false');
  }
}

function initSidebarState() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('mainContent');
  const icon = document.getElementById('toggleIcon');
  const isCollapsed = sessionStorage.getItem('sidebarCollapsed') === 'true';

  if (isCollapsed) {
    sidebar.classList.add('collapsed');
    mainContent.classList.add('expanded');
    icon.classList.remove('bi-chevron-left');
    icon.classList.add('bi-chevron-right');
  }
}
