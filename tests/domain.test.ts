import test from 'node:test'
import assert from 'node:assert/strict'
import {distance,tier,average,validPrice,isFresh,escapeHtml} from '../src/domain.ts'
test('distance returns miles and respects nearby search boundaries',()=>{assert.equal(distance([35,-78],[35,-78]),0);const miles=distance([35.7796,-78.6382],[35.8215,-78.6210]);assert.ok(miles>2.8&&miles<3.1);assert.ok(distance([35.7796,-78.6382],[40.7128,-74.006])>400)})
test('price tiers use local percentiles including ties',()=>{const prices=[2.8,2.9,3,3.1,3.2,3.3,3.4,3.5,3.6,3.7];assert.equal(tier(2.9,prices),'low');assert.equal(tier(3.2,prices),'mid');assert.equal(tier(3.6,prices),'high');assert.equal(tier(3,[3,3,3]),'mid');assert.equal(tier(3,[3]),'mid');assert.equal(tier(2.8,[2.8,2.8,3,4,4]),'low')})
test('empty averages do not become fabricated zero prices',()=>{assert.equal(average([]),null);assert.equal(average([3,4]),3.5)})
test('reports reject invalid, negative, zero, outlier and excessive-precision prices',()=>{for(const s of ['', '0','-3','0.99','15.01','NaN','Infinity','3.1234','2e1',' 3'])assert.equal(validPrice(s),false,s);for(const s of ['1','2.89','3.099','15'])assert.equal(validPrice(s),true,s)})
test('stale reports are excluded after 24 hours',()=>{assert.equal(isFresh(new Date(Date.now()-60000).toISOString()),true);assert.equal(isFresh(new Date(Date.now()-86401000).toISOString()),false)})
test('map tooltip text cannot inject HTML',()=>{assert.equal(escapeHtml('<img src=x onerror="x">'), '&lt;img src=x onerror=&quot;x&quot;&gt;')})

