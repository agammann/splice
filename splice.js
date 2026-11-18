const fs = require('node:fs');
function rat(n,d=1n){n=BigInt(n); d=BigInt(d); if(d<=0n) throw Error('invalid denominator'); let a=n<0n?-n:n, b=d; while(b){let t=a%b;a=b;b=t} return [n/a,d/a]}
function parseDecimal(s){if(!/^-?\d+(\.\d+)?$/.test(s)) throw Error('unsupported numeric time'); let [a,b='']=s.split('.'); return rat(BigInt(a+b),10n**BigInt(b.length))}
function parse(x){if(!Number.isFinite(x)) throw Error('invalid time'); return parseDecimal(String(x))}
function add(a,b){return rat(a[0]*b[1]+b[0]*a[1],a[1]*b[1])} function sub(a,b){return rat(a[0]*b[1]-b[0]*a[1],a[1]*b[1])} function div(a,b){return rat(a[0]*b[1],a[1]*b[0])} function cmp(a,b){let x=a[0]*b[1]-b[0]*a[1]; return x<0n?-1:x>0n?1:0} function fmt(a){return `${a[0]}/${a[1]}`}
function time(t){if(!t || t.OTIO_SCHEMA!=='RationalTime.1' || !(t.rate>0)) throw Error('invalid RationalTime'); return div(parse(t.value),parse(t.rate))}
function readText(path) {
  return fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
}

function externalMediaUrl(item) {
  let reference = item.media_reference;
  if (Object.hasOwn(item, 'media_references') || Object.hasOwn(item, 'active_media_reference_key')) {
    const references = item.media_references;
    const activeKey = item.active_media_reference_key;
    if (!references || typeof references !== 'object' || Array.isArray(references) ||
        typeof activeKey !== 'string' || !activeKey || !Object.hasOwn(references, activeKey)) {
      throw Error('clip needs an active media reference in media_references');
    }
    reference = references[activeKey];
  }
  if (typeof reference?.OTIO_SCHEMA !== 'string' || !reference.OTIO_SCHEMA.startsWith('ExternalReference.') ||
      typeof reference.target_url !== 'string' || !reference.target_url) {
    throw Error('external media target_url must be a nonempty string');
  }
  return reference.target_url;
}

function timeline(path) {
  const root = JSON.parse(readText(path));
  if (!root.OTIO_SCHEMA?.startsWith('Timeline.')) throw Error('expected OTIO Timeline');
  const tracks = root.tracks?.children;
  if (!Array.isArray(tracks) || tracks.length !== 1 || tracks[0].kind !== 'Video') throw Error('only one video track is supported');
  const track = tracks[0];
  if (track.source_range != null || root.tracks.source_range != null) throw Error('track and stack trims unsupported');
  if (track.effects?.length || root.tracks.effects?.length) throw Error('track effects unsupported');
  let pos = rat(0);
  const clips = [];
  for (const item of track.children) {
    if (!/^(Clip|Gap)\./.test(item.OTIO_SCHEMA || '')) throw Error('unsupported timeline item');
    if (item.effects?.length) throw Error('effects and retimes unsupported');
    const range = item.source_range;
    if (!range) throw Error('explicit source_range required');
    const start = time(range.start_time), duration = time(range.duration);
    if (cmp(start, rat(0)) < 0 || cmp(duration, rat(0)) <= 0) throw Error('invalid source range');
    if (item.OTIO_SCHEMA.startsWith('Clip.')) {
      clips.push({id: externalMediaUrl(item), start, end: add(start, duration), pos});
    }
    pos = add(pos, duration);
  }
  return clips;
}
function csv(text){let rows=[],row=[],field='',quote=false; for(let i=0;i<text.length;i++){let c=text[i]; if(quote){if(c==='"'&&text[i+1]==='"'){field+='"';i++}else if(c==='"') quote=false; else field+=c}else if(c==='"'&&field==='') quote=true; else if(c===','){row.push(field);field=''} else if(c==='\n'){row.push(field.replace(/\r$/,''));rows.push(row);row=[];field=''}else field+=c} if(quote) throw Error('unclosed CSV quote'); if(field||row.length){row.push(field);rows.push(row)} return rows}
function q(x){let s=String(x); if(/^[\t\r\n]|^\s*[=+\-@]/u.test(s)) s="'"+s; return '"'+s.replace(/"/g,'""')+'"'}
function build(oldPath,newPath,notePath) {
  const old = timeline(oldPath), next = timeline(newPath), rows = csv(readText(notePath));
  const header = rows.shift();
  if (header?.length !== 3 || header.join(',') !== 'id,seconds,text') throw Error('CSV header must be id,seconds,text');
  const seen = new Set();
  const output = [['id','old_seconds','text','status','source_url','source_seconds','new_seconds','candidates']];
  for (const row of rows) {
    if (row.length !== 3 || !row[0] || seen.has(row[0])) throw Error('each note needs a unique id and 3 columns');
    seen.add(row[0]);
    if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(row[1])) throw Error('invalid note seconds');
    const t = parseDecimal(row[1]);
    if (cmp(t, rat(0)) < 0) throw Error('negative note time');
    const source = old.filter(clip => cmp(t, clip.pos) >= 0 && cmp(t, add(clip.pos, sub(clip.end, clip.start))) < 0);
    if (source.length !== 1) {
      output.push([...row,'old_gap_or_outside','','','','']);
      continue;
    }
    const clip = source[0], sourceTime = add(clip.start, sub(t, clip.pos));
    const matches = next.filter(item => item.id === clip.id && cmp(sourceTime, item.start) >= 0 && cmp(sourceTime, item.end) < 0)
      .map(item => add(item.pos, sub(sourceTime, item.start)));
    const status = matches.length === 1 ? 'mapped' : matches.length ? 'ambiguous' : 'deleted_or_unresolved';
    output.push([...row,status,clip.id,fmt(sourceTime),matches.length === 1 ? fmt(matches[0]) : '',matches.map(fmt).join(';')]);
  }
  return output;
}
function receipt(rows){return rows.map(r=>r.map(q).join(',')).join('\n')+'\n'}
function run(oldPath,newPath,notePath,outPath){let rows=build(oldPath,newPath,notePath);require('./safe-output').writeNewFiles([[outPath,receipt(rows)]]);return rows}
if(require.main===module){try{if(process.argv.length!==6) throw Error('usage: node splice.js OLD.otio NEW.otio NOTES.csv RECEIPT.csv'); run(...process.argv.slice(2))}catch(e){console.error(e.message);process.exitCode=1}} module.exports={run,build,receipt,timeline};





