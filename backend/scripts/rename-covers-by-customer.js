const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '../..');
const dataPath = path.join(projectRoot, 'backend/data/customerPoints.json');
const coversDir = path.join(projectRoot, 'assets/case-covers');

function sanitize(s) {
  if (!s || typeof s !== 'string') return '';
  return s
    .replace(/[\s\n\r\\/:*?"<>|]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const used = {};

for (let i = 0; i < data.length; i++) {
  const showroomName = data[i].showroomName || ('客户' + (i + 1));
  let name = sanitize(showroomName);
  if (!name) name = '客户' + (i + 1);
  if (used[name]) {
    used[name]++;
    name = name + '_' + used[name];
  } else {
    used[name] = 1;
  }
  const newFilename = name + '.png';
  const currentPath = path.join(projectRoot, data[i].cover);
  const newPath = path.join(coversDir, newFilename);

  if (fs.existsSync(currentPath) && currentPath !== newPath) {
    fs.renameSync(currentPath, newPath);
    console.log('Renamed:', path.basename(data[i].cover), '->', newFilename);
  }
  data[i].cover = 'assets/case-covers/' + newFilename;
}

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Updated customerPoints.json cover paths (showroomName).');
