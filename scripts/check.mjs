import { readFile, access } from 'node:fs/promises';
import vm from 'node:vm';
const data = JSON.parse(await readFile('dist/greeting.json','utf8'));
if (!data.recipient || !Array.isArray(data.letter.paragraphs) || data.wishes.length !== 3) throw Error('Invalid default content');
new vm.Script(await readFile('dist/app.js', 'utf8'));
new vm.Script(await readFile('dist/experience.js', 'utf8'));
for (const file of ['dist/index.html','dist/styles.css','dist/assets/candles-roses.webp','dist/assets/candle-glow.gif','dist/assets/candle-still.png','dist/assets/candle-lit.png']) await access(file);
console.log('Content JSON, JavaScript syntax and required static assets verified. Ready to deploy dist/.');
