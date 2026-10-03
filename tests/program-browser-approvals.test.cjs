const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
async function panel(data,rpcError=null){
 const values=[],calls=[];let effect,index=0;
 const react={useState(initial){const i=index++;if(!(i in values))values[i]=initial;return [values[i],v=>values[i]=v]},useEffect(fn){effect=fn}};
 const client={from(table){calls.push({table});const q={select(){return q},eq(){return q},in(){return q},order(){return q},limit:async()=>({data,error:null})};return q},rpc:async(name,args)=>{calls.push({name,args});return {error:rpcError}}};
 const source=fs.readFileSync(require.resolve('../components/ProgramBrowserApprovals.tsx'),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const mod={exports:{}};new Function('module','exports','require',compiled)(mod,mod.exports,name=>name==='react'?react:name==='@/lib/supabase'?{supabase:client}:{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})});
 const render=()=>{index=0;return mod.exports.default()};render();await effect();await new Promise(resolve=>setImmediate(resolve));
 const flatten=node=>!node?[]:Array.isArray(node)?node.flatMap(flatten):typeof node==='object'?[node,...flatten(node.props?.children)]:[];
 return {values,calls,buttons:()=>flatten(render()).filter(n=>n.type==='button')};
}
const page={id:'test-id',selected_official_url:'https://program.example/apply',outcome_reason:'Official page lacks usable content; browser or manual review required.',browser_approved_url:null};
test('approval sends the displayed exact URL to the admin RPC',async()=>{
 const p=await panel([page]);const button=p.buttons().find(b=>b.props.children==='Approve browser reading');assert.ok(button);
 await button.props.onClick();assert.deepEqual(p.calls.find(c=>c.name),{name:'approve_program_browser_read',args:{p_discovery_id:'test-id',p_expected_url:page.selected_official_url}});assert.equal(p.values[1],'');
});
test('failed approval retains the held page and shows an error',async()=>{
 const p=await panel([page],{message:'Refresh the queue'});await p.buttons().find(b=>b.props.children==='Approve browser reading').props.onClick();assert.equal(p.values[1],'Refresh the queue');assert.equal(p.values[0].length,1);assert.equal(p.values[2],false);
});
test('already-approved URL cannot be approved again',async()=>{
 const p=await panel([{...page,browser_approved_url:page.selected_official_url}]);assert.ok(!p.buttons().some(b=>b.props.children==='Approve browser reading'));
});
