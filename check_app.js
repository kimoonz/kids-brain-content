// app.json 검사 — 앱의 '새 버전 알림'(앱 2.4 이상)이 읽는 파일
// 형식: { "code": 15, "version": "2.4", "url": "https://drive.google.com/…" 또는 "https://github.com/kimoonz/…", "note": "한 줄 설명(160자 이하)" }
// code 는 앱의 versionCode(정수). 폰에 깔린 앱보다 크면 부모님 화면에 '받아서 설치하기'가 뜬다.
const fs = require('fs');
const file = process.argv[2] || require('path').join(__dirname, 'app.json');
let j;
try { j = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { console.error('❌ app.json JSON 형식 오류:', e.message); process.exit(1); }
const errs = [];
if (!Number.isInteger(j.code) || j.code < 1) errs.push('code 는 1 이상의 정수(앱 versionCode)');
if (!/^\d+(\.\d+){0,3}$/.test(String(j.version || ''))) errs.push('version 은 2.4 같은 숫자');
if (!(typeof j.url === 'string' && j.url.length <= 300 && /^https:\/\/(drive\.google\.com\/|github\.com\/kimoonz\/)[^\s<>"'`]*$/.test(j.url))) errs.push('url 은 https://drive.google.com/… 또는 https://github.com/kimoonz/… 만 (앱이 다른 주소는 열지 않음)');
if (j.note != null && (typeof j.note !== 'string' || j.note.length > 160 || /[<>&]/.test(j.note))) errs.push('note 는 160자 이하 글자, < > & 금지');
if (errs.length) { errs.forEach(e => console.error('❌', e)); process.exit(1); }
console.log(`✅ app.json 통과 — v${j.version} (code ${j.code})`);
