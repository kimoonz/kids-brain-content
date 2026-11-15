// content.json 검사기 — 앱(content.js)과 같은 규칙. GitHub 에 올리면 Actions 가 자동으로 실행한다.
// 실행: node check.js [content.json]
const fs = require('fs');
const file = process.argv[2] || require('path').join(__dirname, 'content.json');
const errs = [], warn = [];
let c;
try { c = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { console.error('❌ JSON 형식 오류:', e.message); process.exit(1); }

const str = (t, n) => typeof t === 'string' && t.trim() && t.length <= (n || 120) && !/[<>&]/.test(t);
function list(name, a, min, ok) {
  if (a === undefined) return warn.push(`${name}: 없음 (앱 기본값 사용)`);
  if (!Array.isArray(a)) return errs.push(`${name}: 목록([ ])이어야 함`);
  a.forEach((x, i) => { const m = ok(x); if (m) errs.push(`${name} ${i + 1}번째 ${JSON.stringify(x)}: ${m}`); });
  if (a.length < min) errs.push(`${name}: 최소 ${min}개 필요 (지금 ${a.length}개)`);
  const seen = new Set(); a.forEach(x => { const k = JSON.stringify(Array.isArray(x) ? x[0] : x); if (seen.has(k)) warn.push(`${name}: 중복 ${k}`); seen.add(k); });
}
const ox = x => !Array.isArray(x) || x.length !== 3 ? '[문장, 1 또는 0, 풀이] 세 칸이어야 함' : !str(x[0]) ? '문장이 비었거나 너무 길거나 < > & 가 있음' : x[1] !== 0 && x[1] !== 1 ? '두 번째 칸은 1(맞음) 또는 0(틀림)' : !str(x[2]) ? '풀이가 비었거나 너무 김' : '';
const ko = x => !Array.isArray(x) || !str(x[0], 8) ? '[그림 이모지, 낱말]' : !/^[가-힣]{2,6}$/.test(x[1] || '') ? '낱말은 한글 2~6글자' : '';
const en = x => !Array.isArray(x) || !str(x[0], 8) ? '[그림 이모지, word]' : !/^[a-z]{2,9}$/.test(x[1] || '') ? '낱말은 영어 소문자 2~9글자' : '';
const s = x => str(x, 60) ? '' : '60자 이하 글자 (< > & 금지)';

if (!(Number.isInteger(c.version) && c.version > 0)) errs.push('version: 1 이상의 정수여야 함');
['ox', 'ko'].forEach(k => { if (c[k] !== undefined && !(Array.isArray(c[k]) && c[k].length === 2)) errs.push(`${k}: [7살 목록, 10살 목록] 두 개여야 함`); });
if (Array.isArray(c.ox) && c.ox.length === 2) { list('OX 7살', c.ox[0], 10, ox); list('OX 10살', c.ox[1], 10, ox); }
if (Array.isArray(c.ko) && c.ko.length === 2) { list('한글 7살', c.ko[0], 8, ko); list('한글 10살', c.ko[1], 8, ko); }
list('영어(앞 25개는 7살용 쉬운 낱말)', c.en, 30, en);
list('농담', c.jokes, 5, s); list('이겼을 때 한마디', c.wins, 3, s); list('졌을 때 한마디', c.loses, 3, s);

warn.forEach(w => console.log('⚠️ ', w));
if (errs.length) { errs.forEach(e => console.error('❌', e)); console.error(`\n${errs.length}개 오류 — 이대로 두면 앱은 틀린 항목을 무시하고 기본 문제를 씁니다.`); process.exit(1); }
console.log(`✅ 통과 (version ${c.version}) — OX ${c.ox ? c.ox[0].length + '/' + c.ox[1].length : '-'}, 한글 ${c.ko ? c.ko[0].length + '/' + c.ko[1].length : '-'}, 영어 ${c.en ? c.en.length : '-'}`);
