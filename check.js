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
['ox', 'ko'].forEach(k => { if (c[k] !== undefined && !(Array.isArray(c[k]) && c[k].length === 2)) errs.push(`${k}: [8살 목록, 11살 목록] 두 개여야 함`); });
if (Array.isArray(c.ox) && c.ox.length === 2) { list('OX 8살', c.ox[0], 10, ox); list('OX 11살', c.ox[1], 10, ox); }
if (Array.isArray(c.ko) && c.ko.length === 2) { list('한글 8살', c.ko[0], 8, ko); list('한글 11살', c.ko[1], 8, ko); }
list('영어(앞 25개는 8살용 쉬운 낱말)', c.en, 30, en);
list('농담', c.jokes, 5, s); list('이겼을 때 한마디', c.wins, 3, s); list('졌을 때 한마디', c.loses, 3, s);

// v2.2 영어 문장 은행 — 앱 content.js 와 같은 규칙
const W = (a, n, max) => Array.isArray(a) && a.length >= n && a.length <= max && a.every(w => str(w, 24));
const sent2 = x => !Array.isArray(x) ? '[영어 문장, 우리말 뜻, [헷갈리는 낱말]]' : !str(x[0], 160) || !/[.?!]$/.test(x[0].trim()) ? '영어 문장은 . ? ! 로 끝나야 함' : x[0].trim().split(' ').length < 3 ? '3낱말 이상' : !str(x[1]) ? '우리말 뜻이 없음' : !(x[2] === undefined || W(x[2], 0, 4)) ? '헷갈리는 낱말은 4개까지' : '';
const ctx = x => !Array.isArray(x) || x.length !== 4 ? '[빈칸 문장, 정답, [오답 3개], 뜻]' : x[0].split('___').length !== 2 ? '빈칸 ___ 이 정확히 하나' : !str(x[1], 24) ? '정답 낱말' : !W(x[2], 3, 3) ? '오답은 3개' : x[2].includes(x[1]) ? '오답에 정답이 섞임' : !str(x[3]) ? '뜻' : '';
const gram = x => !Array.isArray(x) || x.length !== 4 ? '[빈칸 문장, [보기], 정답 번호(0부터), 규칙 설명]' : x[0].split('___').length !== 2 ? '빈칸 ___ 이 정확히 하나' : !W(x[1], 2, 4) || new Set(x[1]).size !== x[1].length ? '보기 2~4개, 서로 달라야' : !(Number.isInteger(x[2]) && x[2] >= 0 && x[2] < x[1].length) ? '정답 번호가 보기 범위 밖' : !str(x[3]) ? '규칙 설명' : '';
const lis2 = x => !Array.isArray(x) || x.length !== 3 ? '[들려줄 글, 질문, [보기 3개 — 첫 번째가 정답]]' : !str(x[0], 300) ? '들려줄 글(300자 이하)' : !str(x[1]) ? '질문' : !(Array.isArray(x[2]) && x[2].length === 3 && x[2].every(c => str(c, 60))) || new Set(x[2]).size !== 3 ? '보기 3개(각 60자 이하), 서로 달라야' : '';
const read = x => !Array.isArray(x) || !str(x[0], 800) ? '[글, [[질문, [보기 3개 — 첫 번째가 정답], 근거 문장], 질문2]]' : !Array.isArray(x[1]) || x[1].length !== 2 ? '질문은 2개' :
  x[1].map((q, k) => !Array.isArray(q) || !str(q[0]) ? `질문${k + 1}` : !(Array.isArray(q[1]) && q[1].length === 3 && q[1].every(c => str(c, 60))) || new Set(q[1]).size !== 3 ? `질문${k + 1} 보기 3개(각 60자 이하)` : !str(q[2], 200) || !x[0].includes(q[2]) ? `질문${k + 1} 근거 문장이 글에 그대로 있어야 함` : '').filter(Boolean).join(', ');
for (const [k, nm, min, f] of [['sent2', '영어 문장', 8, sent2], ['ctx', '알맞은 낱말', 10, ctx], ['gram', '문법 빈칸', 10, gram], ['lis2', '듣기 대화', 7, lis2], ['read', '독해 글', 3, read]]) {
  if (c[k] === undefined) { warn.push(`${nm}: 없음 (앱 기본값 사용)`); continue; }
  if (!(Array.isArray(c[k]) && c[k].length === 2)) { errs.push(`${k}: [8살 목록, 11살 목록] 두 개여야 함`); continue; }
  list(`${nm} 8살`, c[k][0], min, f); list(`${nm} 11살`, c[k][1], min, f);
}

warn.forEach(w => console.log('⚠️ ', w));
if (errs.length) { errs.forEach(e => console.error('❌', e)); console.error(`\n${errs.length}개 오류 — 이대로 두면 앱은 틀린 항목을 무시하고 기본 문제를 씁니다.`); process.exit(1); }
const n2 = k => c[k] ? c[k][0].length + '/' + c[k][1].length : '-';
console.log(`✅ 통과 (version ${c.version}) — OX ${n2('ox')}, 한글 ${n2('ko')}, 영어 낱말 ${c.en ? c.en.length : '-'}, 문장 ${n2('sent2')}, 알맞은 낱말 ${n2('ctx')}, 문법 ${n2('gram')}, 듣기 ${n2('lis2')}, 독해 ${n2('read')}`);
