const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
async function panel(data,rpcError=null){
 const values=[],calls=[];let effect,index=0;
 const react={useState(initial){const i=index++;if(!(i in values))values[i]=initial;return [values[i],v=>values[i]=typeof v==='function'?v(values[i]):v]},useEffect(fn){effect=fn}};
 const client={from(table){calls.push({table});const q={select(){return q},eq(key,value){calls.push({filter:[key,value]});return q},in(){return q},order(){return q},limit:async()=>({data,error:null})};return q},rpc:async(name,args)=>{calls.push({name,args});return {error:rpcError}}};
 const source=fs.readFileSync(require.resolve('../components/ProgramEvidenceHolds.tsx'),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const mod={exports:{}};new Function('module','exports','require',compiled)(mod,mod.exports,name=>name==='react'?react:name==='@/lib/supabase'?{supabase:client}:{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})});
 const render=()=>{index=0;return mod.exports.default()};render();await effect();await new Promise(resolve=>setImmediate(resolve));
 const flatten=node=>!node?[]:Array.isArray(node)?node.flatMap(flatten):typeof node==='object'?[node,...flatten(node.props?.children)]:[];
 return {values,calls,buttons:()=>flatten(render()).filter(n=>n.type==='button'),note:()=>flatten(render()).find(n=>n.type==='input')};
}
const page={id:'held-id',selected_official_url:'https://program.example/apply',outcome_reason:'Unclear ownership',attempt_count:1,updated_at:'2026-10-04T12:00:00Z'};
test('holds query only manual-review directory pages; recheck binds the displayed revision',async()=>{
 const p=await panel([page]);assert.ok(p.calls.some(c=>JSON.stringify(c.filter)===JSON.stringify(['status','MANUAL_REVIEW'])));
 p.note().props.onChange({target:{value:'Ownership confirmed'}});
 await p.buttons().find(b=>b.props.children==='Recheck page').props.onClick();
 assert.deepEqual(p.calls.find(c=>c.name),{name:'decide_program_evidence_hold',args:{p_discovery_id:page.id,p_expected_updated_at:page.updated_at,p_decision:'RECHECK',p_reason:'Ownership confirmed'}});
});
test('failed decision retains the held page',async()=>{
 const p=await panel([page],{message:'Held page changed'});p.note().props.onChange({target:{value:'Checked'}});
 await p.buttons().find(b=>b.props.children==='Dismiss').props.onClick();assert.equal(p.values[2],'Held page changed');assert.equal(p.values[0].length,1);
});
test('rechecking never resets the five-read limit',async()=>{
 const p=await panel([{...page,attempt_count:5}]);p.note().props.onChange({target:{value:'Checked'}});
 const button=p.buttons().find(b=>b.props.children==='Recheck page');assert.equal(button.props.disabled,true);await button.props.onClick();assert.ok(!p.calls.some(c=>c.name));
});
