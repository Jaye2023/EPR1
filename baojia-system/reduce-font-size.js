const fs = require('fs');
const path = require('path');

const htmlDir = path.join(__dirname, 'public', 'html');
const files = fs.readdirSync(htmlDir).filter(file => file.endsWith('.html'));

const replacements = [
  // 页面整体字体大小
  { from: /font-size:\s*16px/g, to: 'font-size: 14px' },
  { from: /font-size:\s*15px/g, to: 'font-size: 13px' },
  
  // 标题字体
  { from: /font-size:\s*24px/g, to: 'font-size: 20px' },
  { from: /font-size:\s*20px/g, to: 'font-size: 18px' },
  { from: /font-size:\s*18px/g, to: 'font-size: 16px' },
  
  // 表格字体
  { from: /font-size:\s*14px/g, to: 'font-size: 12px' },
  { from: /font-size:\s*13px/g, to: 'font-size: 11px' },
  
  // Bootstrap 默认字体大小
  { from: /text-sm/g, to: 'text-xs' },
  
  // 自定义小字体
  { from: /font-size:\s*12px/g, to: 'font-size: 11px' },
];

files.forEach(file => {
  const filePath = path.join(htmlDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;
  
  replacements.forEach(replacement => {
    const beforeCount = (content.match(replacement.from) || []).length;
    content = content.replace(replacement.from, replacement.to);
    const afterCount = (content.match(replacement.to) || []).length;
    
    if (beforeCount > 0) {
      changed = true;
    }
  });
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated font sizes: ${file}`);
  } else {
    console.log(`No changes needed: ${file}`);
  }
});

console.log('\n字体大小调整完成！');