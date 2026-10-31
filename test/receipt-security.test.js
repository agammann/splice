const {test}=require('node:test'), assert=require('node:assert/strict');
const {receipt}=require('../splice');
test('receipt neutralizes formula and control prefixes without changing CSV structure',()=>{
  for(const s of ['=1+1','+1+1','-1+1','@x',' \t=1+1','\tordinary','\rordinary','\nordinary'])
    assert.equal(receipt([[s]]), `"'${s}"\n`);
  assert.equal(receipt([['ordinary','a,"b"\nc','123']]), '"ordinary","a,""b""\nc","123"\n');
});

