import test from 'node:test';
import assert from 'node:assert/strict';
import { matchingContexts, matchesTagContext, tagSearchUrl, type CrmTag } from './tags.ts';
const tags=(...keys:string[]):CrmTag[]=>keys.map(key=>({key,group:key.split(':')[0],label:key}));
test('criteria must belong to the same showing, not different customer history entries',()=>{
 const contexts=[{label:'Gösterim',tags:tags('event:showing_done','site:other','rooms:3+1'),links:[]},{label:'Arama',tags:tags('event:Giden Arama','site:nef','rooms:3+1'),links:[]}];
 assert.equal(matchingContexts(contexts,['event:showing_done','site:nef','rooms:3+1']).length,0);
});
test('planned showing is not completed',()=>{
 assert.equal(matchesTagContext(tags('event:showing_planned','site:nef'),['event:showing_done','site:nef']),false);
});
test('alternatives within a group, intersection across groups and custom tags',()=>{
 assert.equal(matchesTagContext(tags('rooms:3+1','site:nef'),['rooms:2+1','rooms:3+1','site:nef']),true);
 assert.equal(matchesTagContext(tags('rooms:3+1','site:other'),['rooms:3+1','site:nef']),false);
 assert.equal(matchesTagContext(tags('custom:a'),['custom:a','custom:b']),false);
});
test('links round-trip Turkish names, plus signs, special characters and remove duplicates',()=>{
 const path=tagSearchUrl(['site:name=Nef Çamlıtepe & Orman','rooms:3+1','rooms:3+1'],'activity');
 const url=new URL(path,'http://localhost');
 assert.deepEqual(url.searchParams.getAll('tag'),['site:name=Nef Çamlıtepe & Orman','rooms:3+1']);
 assert.equal(url.searchParams.get('kind'),'activity');
});
