const fs = require('fs');
const path = require('path');

const htmlDir = path.join(__dirname, 'public', 'html');
const files = fs.readdirSync(htmlDir).filter(file => file.endsWith('.html') && file !== 'login.html');

files.forEach(file => {
  const filePath = path.join(htmlDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  if (content.includes('/js/tabs.js')) {
    console.log(`Already has tabs: ${file}`);
    return;
  }
  
  content = content.replace(
    /(<script src="\/js\/auth\.js"><\/script>)/,
    '$1\n  <script src="/js/tabs.js"></script>'
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`Added tabs to: ${file}`);
});

console.log('\n标签页切换功能添加完成！');