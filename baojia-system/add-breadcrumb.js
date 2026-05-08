const fs = require('fs');
const path = require('path');

const htmlDir = path.join(__dirname, 'public', 'html');
const files = ['plugs.html', 'tail-processings.html'];

// 定义每个页面的面包屑配置
const breadcrumbConfig = {
  'plugs.html': [
    { name: '首页', url: '/' },
    { name: '插头价格', url: '/plugs' }
  ],
  'tail-processings.html': [
    { name: '首页', url: '/' },
    { name: '尾部处理', url: '/tail-processings' }
  ]
};

function generateBreadcrumb(crumbs) {
  return `
  <nav style="--bs-breadcrumb-divider: '>';" aria-label="breadcrumb">
    <ol class="breadcrumb">
      ${crumbs.map((crumb, index) => {
        if (crumb.url) {
          return `<li class="breadcrumb-item"><a href="${crumb.url}" class="text-primary text-decoration-none">${crumb.name}</a></li>`;
        } else {
          return `<li class="breadcrumb-item active" aria-current="page">${crumb.name}</li>`;
        }
      }).join('')}
    </ol>
  </nav>`;
}

files.forEach(file => {
  const filePath = path.join(htmlDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  if (content.includes('<ol class="breadcrumb">')) {
    console.log(`Already has breadcrumb: ${file}`);
    return;
  }
  
  const crumbs = breadcrumbConfig[file] || [];
  if (crumbs.length === 0) {
    console.log(`No config for: ${file}`);
    return;
  }
  
  const breadcrumbHTML = generateBreadcrumb(crumbs);
  content = content.replace(
    /(<h[12]>)/,
    `${breadcrumbHTML}\n        $1`
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`Added breadcrumb to: ${file}`);
});

console.log('\n面包屑导航添加完成！');