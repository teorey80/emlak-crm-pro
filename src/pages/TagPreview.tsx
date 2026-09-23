import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { HashRouter, Link, Route, Routes } from 'react-router-dom';
import TagSearch from './TagSearch';
import { TagChips } from '../components/EntityTags';
import { matchingContexts, uniqueTags, type CrmTag, type TagDocument, type TagEntity, type TagSearchResult } from '../utils/tags';
const tag=(group:string,value:string,label=value):CrmTag=>({key:`${group}:${value}`,group,label});
const nef=tag('site','nef','Nef Çamlıtepe'),other=tag('site','other','Diğer Site'),room=tag('rooms','3+1'),done=tag('event','showing_done','Yer gösterimi yapıldı'),planned=tag('event','showing_planned','Yer gösterimi planlandı'),role=tag('role','Alıcı'),owner=tag('role','Mal Sahibi');
const docs:TagDocument[]=[
 {entity_type:'customer',entity_id:'demo-1',title:'Örnek müşteri — Nef’te yer gösterildi',href:'/customers/demo-1',contexts:[{label:'Gösterilen ev',subtitle:'Nef Çamlıtepe · 3+1 · 21.09.2026',tags:[role,nef,room,done],links:[{label:'İlgili görüşme',href:'/activities/demo-a1'},{label:'Gösterilen portföy',href:'/properties/demo-p1'}]}]},
 {entity_type:'customer',entity_id:'demo-2',title:'Örnek müşteri — farklı sitede yer gösterildi',href:'/customers/demo-2',contexts:[{label:'Gösterilen ev',tags:[role,other,room,done],links:[]},{label:'Telefon görüşmesi',tags:[role,nef,room,tag('event','Giden Arama')],links:[]}]},
 {entity_type:'customer',entity_id:'demo-3',title:'Örnek müşteri — gösterim planlandı',href:'/customers/demo-3',contexts:[{label:'Planlanan gösterim',tags:[role,nef,room,planned],links:[]}]},
 ...Array.from({length:62},(_,i):TagDocument=>({entity_type:'customer',entity_id:`owner-${i}`,title:`Örnek mal sahibi ${String(i+1).padStart(2,'0')}`,href:`/customers/owner-${i}`,contexts:[{label:'Sahibi olduğu ev',tags:[owner,i%2?other:nef,tag('rooms',i%2?'2+1':'3+1')],links:[]}]})),
];
docs.push({entity_type:'property',entity_id:'demo-p1',title:'Örnek Nef Çamlıtepe 3+1',href:'/properties/demo-p1',contexts:docs[0].contexts});
docs.push({entity_type:'activity',entity_id:'demo-a1',title:'Örnek müşteri — yer gösterimi',href:'/activities/demo-a1',contexts:docs[0].contexts});
docs.push({entity_type:'prospect',entity_id:'demo-f1',title:'Örnek FSBO takibi',href:'/prospecting/demo-f1',contexts:[{label:'Takipte',tags:[owner,nef,room,tag('source','fsbo','FSBO'),tag('stage','follow_up','Takipte')],links:[]}]});
async function repository(selected:string[],kind:TagEntity,search='',offset=0):Promise<TagSearchResult>{
 const matches=docs.map(doc=>({...doc,contexts:matchingContexts(doc.contexts,selected)})).filter(doc=>doc.contexts.length && doc.title.toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr')));
 const counts:TagSearchResult['counts']={};matches.forEach(doc=>{counts[doc.entity_type]=(counts[doc.entity_type] || 0)+1;});
 const facets=uniqueTags(docs.flatMap(doc=>doc.contexts.flatMap(c=>c.tags))).map(t=>({...t,count:docs.filter(d=>d.contexts.some(c=>c.tags.some(t2=>t2.key===t.key))).length}));
 return {rows:matches.filter(d=>d.entity_type===kind).slice(offset,offset+30),counts,facets};
}
function PreviewDetail(){const id=window.location.hash.split('/').pop();const doc=docs.find(d=>d.entity_id===id);return <div className="space-y-4"><Link to="/tags" className="underline">Etiket aramasına dön</Link><h1 className="text-2xl font-bold">{doc?.title}</h1>{doc?.contexts.map((c,i)=><div key={i}><p className="mb-2">{c.label}</p><TagChips tags={c.tags}/></div>)}</div>;}
if(import.meta.env.DEV) {
 const root: Root = import.meta.hot?.data.root || createRoot(document.getElementById('root')!);
 if(import.meta.hot) import.meta.hot.data.root = root;
 root.render(<HashRouter><div className="max-w-6xl mx-auto p-4 md:p-8"><div className="mb-5 rounded-lg bg-amber-100 p-3 text-sm text-amber-900">Deneme ekranı · Tamamı örnek kayıtlar · Canlı müşteri verisi kullanılmaz.</div><Routes><Route path="/" element={<TagSearch repository={repository}/>}/><Route path="/tags" element={<TagSearch repository={repository}/>}/><Route path="*" element={<PreviewDetail/>}/></Routes></div></HashRouter>);
}
