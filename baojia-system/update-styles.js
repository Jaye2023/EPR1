const fs = require('fs');
const path = require('path');

const htmlDir = path.join(__dirname, 'public', 'html');
const files = fs.readdirSync(htmlDir).filter(file => file.endsWith('.html') && file !== 'login.html');

files.forEach(file => {
  const filePath = path.join(htmlDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // 添加CSS引用
  if (!content.includes('/css/sidebar.css')) {
    content = content.replace(
      '<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@',
      '<link rel="stylesheet" href="/css/sidebar.css">\n  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@'
    );
  }
  
  // 移除所有内联样式标签中的侧边栏相关样式
  content = content.replace(/<style>([\s\S]*?)<\/style>/g, (match, styles) => {
    // 移除所有.sidebar开头的样式规则
    let cleaned = styles.replace(/\.sidebar[\s\S]*?(?=\}\s*(?:\.[a-z]|$))/g, '');
    // 移除其他侧边栏相关类
    cleaned = cleaned.replace(/\.(sidebar-toggle|sidebar-header|sidebar-logo|sidebar-title|sidebar-subtitle|sidebar-nav|sidebar-footer|nav-link|nav-divider|nav-section-title|user-info|user-avatar|user-name|user-role|main-content|card|btn-primary)[\s\S]*?(?=\}\s*(?:\.[a-z]|$))/g, '');
    // 移除::-webkit-scrollbar
    cleaned = cleaned.replace(/::-webkit-scrollbar[\s\S]*?(?=\}\s*(?:\.[a-z]|$))/g, '');
    // 清理多余的空白
    cleaned = cleaned.replace(/\n\s*\n/g, '\n').trim();
    
    if (cleaned) {
      return `<style>\n${cleaned}\n  </style>`;
    } else {
      return '';
    }
  });
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated: ${file}`);
});

console.log('All files updated successfully!');