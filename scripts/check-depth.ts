import fs from 'fs';

const languages = ['es', 'en', 'pt', 'zh-CN', 'ru', 'ja'];

languages.forEach((lang) => {
  const filePath = `./src/i18n/${lang}.ts`;
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Find lines
  const lines = content.split('\n');
  console.log(`\n=== ${lang} ===`);
  let depth = 0;
  let section = '';
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (depth === 1 && trimmed.includes(':{') || (depth === 1 && /^[a-zA-Z0-9_]+:\s*\{/.test(trimmed))) {
      section = trimmed.split(':')[0].trim();
    }
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    depth += opens - closes;
    if (depth < 0) {
      console.log(`Line ${idx + 1} went below 0 depth! ${line}`);
    }
  });
  console.log(`End depth for ${lang}: ${depth}`);
});
