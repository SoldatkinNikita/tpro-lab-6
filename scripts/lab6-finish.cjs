// Runs inside the installed StarUML runtime. No external diagram renderer.
module.exports=function(app){
  const fs=require('fs'),path=require('path');
  const T=app.type,root=path.resolve('lab6');
  const write=(n,s)=>fs.writeFileSync(path.join(root,n),s);
  const json=(n,s)=>write(n,JSON.stringify(s,null,2)+'\n');
  const lab=app.repository.getInstancesOf('UMLPackage').find(p=>p.name==='06. Проектирование и инженерия');
  const under=(x,p=lab)=>{for(let a=x;a;a=a._parent)if(a===p)return true;return false;};
  function model(parent,id,name,props={},field='ownedElements'){
    return app.factory.createModel({parent,id,field,modelInitializer:m=>Object.assign(m,{name,...props})});
  }
  function dg(parent,id,name){return app.factory.createDiagram({id,parent,diagramInitializer:d=>d.name=name});}
  function node(d,m,x,y,w=730,h=170,props={}){
    const vt=m.getViewType();const V=m instanceof T.ERDEntity?T.ERDEntityView:(typeof vt==='string'?T[vt]:vt)||T.UMLPackageView;
    const v=new V();v.model=m;v.initialize(null,x,y,x+w,y+h);Object.assign(v,{showShadow:false,showNamespace:false,...props});v.font.face='Arial';v.font.size=14;app.engine.addViews(d,[v]);return v;
  }
  function link(d,a,b,label='trace'){
    const r=new T.UMLDependency();r._parent=d._parent;r.source=a.model;r.target=b.model;r.stereotype=label;app.engine.addModel(d._parent,'ownedElements',r);
    const v=new T.UMLDependencyView();v.model=r;v.tail=a;v.head=b;v.initialize(null,a.left+a.width/2,a.top+a.height/2,b.left+b.width/2,b.top+b.height/2);app.engine.addViews(d,[v]);
  }
  const imported=model(lab,'UMLPackage','04. Обратное проектирование Python',{
    documentation:'Отдельный снимок изменённого кода reverse-input/aria_design.py, разобранного модулем ast Python. Импорт выполнен пользовательским сценарием API StarUML; штатная синхронизация Python отсутствует.'});
  const contract=JSON.parse(fs.readFileSync(path.join(root,'reverse-contract.json'),'utf8'));
  const reverseClasses=[];
  for(const item of contract){
    const c=model(imported,'UMLClass',item.name,{documentation:'Импортировано из Python AST.'});reverseClasses.push(c);
    for(const a of item.attributes)model(c,'UMLAttribute',a.name,a,'attributes');
    for(const o of item.operations){const m=model(c,'UMLOperation',o.name,{visibility:'public'},'operations');for(const p of o.parameters)model(m,'UMLParameter',p.name,{type:p.type,direction:'in'},'parameters');model(m,'UMLParameter','return',{type:o.returns,direction:'return'},'parameters');}
  }
  const roundtrip=dg(imported,'UMLClassDiagram','38. Обратное проектирование — изменения поиска');
  const before=app.repository.getInstancesOf('UMLClass').find(c=>c.name==='AudioSearchService'&&under(c)&&!under(c,imported));
  const after=reverseClasses.find(c=>c.name==='AudioSearchService');
  link(roundtrip,node(roundtrip,before,30,30),node(roundtrip,after,30,380));
  const actual={};
  for(const c of reverseClasses)actual[c.name]={attributes:c.attributes.map(a=>({name:a.name,type:a.type,visibility:a.visibility})),operations:c.operations.map(o=>({name:o.name,parameters:o.parameters.filter(p=>p.direction!=='return').map(p=>({name:p.name,type:p.type})),returns:o.parameters.find(p=>p.direction==='return').type}))};
  json('validation/reverse-import.json',{classes:actual,verifiedAgainstPythonAST:contract.every(c=>JSON.stringify({attributes:c.attributes,operations:c.operations})===JSON.stringify(actual[c.name]))});
  // Split the relational analysis diagram into two readable pages.
  const physical=app.repository.getInstancesOf('ERDDataModel').find(m=>under(m));
  const er2=physical.ownedElements.find(x=>x.name==='31. Даталогическая модель — анализ');
  app.engine.setProperty(er2,'name','31. Даталогическая модель — модели и параметры');
  const er3=dg(physical,'ERDDiagram','37. Даталогическая модель — задания и оценки');
  const config=new Set(['analysis_model','weight_profile','confidence_threshold']);
  const moving=er2.ownedViews.filter(v=>v.model instanceof T.ERDEntity&&!config.has(v.model.name));
  const remove=er2.ownedViews.filter(v=>moving.includes(v)||v.model instanceof T.ERDRelationship);
  app.engine.deleteElements([],remove);
  for(const [name,x,y] of [['analysis_model',30,30],['weight_profile',530,30],['confidence_threshold',530,430]]){
    const v=er2.ownedViews.find(v=>v.model?.name===name);if(v)app.engine.setProperties(v,{left:x,top:y,width:370});
  }
  const table=n=>physical.ownedElements.find(e=>e instanceof T.ERDEntity&&e.name===n);
  for(const [name,x,y] of [['principal',30,30],['audio_recording',530,30],['analysis_job',30,400],['confidence_score',530,500]])node(er3,table(name),x,y,370,120);
  function erlink(d,a,b,col){
    const r=new T.ERDRelationship();r._parent=physical;r.end1.reference=a.model;r.end2.reference=b.model;r.end1.cardinality='1';r.end2.cardinality=col.unique?'0..1':'0..*';r.identifying=false;r.name=col.name;app.engine.addModel(physical,'ownedElements',r);
    const v=new T.ERDRelationshipView();v.model=r;v.tail=a;v.head=b;v.initialize(null,a.left+a.width/2,a.top+a.height/2,b.left+b.width/2,b.top+b.height/2);app.engine.addViews(d,[v]);
  }
  for(const d of [er2,er3])for(const v of [...d.ownedViews])if(v.model instanceof T.ERDEntity)for(const c of v.model.columns)if(c.referenceTo){const p=d.ownedViews.find(w=>w.model===c.referenceTo._parent);if(p)erlink(d,p,v,c);}
  // An optional principal is reflected at the parent end as 0..1.
  for(const r of app.repository.getInstancesOf('ERDRelationship'))if(under(r)&&r.name==='principal_id')app.engine.setProperty(r.end1,'cardinality','0..1');
  // Tables and columns remain the source of the DDL; supplemental constraints
  // not represented by ERDColumn properties are maintained explicitly here.
  const tables=physical.ownedElements.filter(e=>e instanceof T.ERDEntity);
  const order=['principal','audio_recording','audio_file','tag','emotion_label','analysis_model','weight_profile','confidence_threshold','analysis_job','confidence_score','audio_recording_tag','audio_recording_emotion'];
  const extra={
    confidence_threshold:['UNIQUE (model_id, name)'],
    analysis_job:["CHECK ((status IN ('completed','cancelled','failed')) = (finished_at IS NOT NULL))",'CHECK (started_at IS NULL OR started_at >= created_at)','CHECK (finished_at IS NULL OR finished_at >= COALESCE(started_at, created_at))'],
    confidence_score:['UNIQUE (job_id, characteristic, value)']
  };
  const cascade=new Set(['audio_file','weight_profile','confidence_threshold','confidence_score','audio_recording_tag','audio_recording_emotion']);
  let sql='-- Generated from native StarUML ERDColumn objects by scripts/lab6-finish.cjs.\n-- PostgreSQL. Supplemental CHECK / UNIQUE / deferred constraints are explicit.\nBEGIN;\nCREATE SCHEMA aria;\nSET search_path TO aria, public;\n\n';
  for(const name of order){
    const e=table(name);const lines=e.columns.map(c=>{
      let line='    '+c.name+' '+c.type+(c.length?'('+c.length+')':'');
      if(!c.nullable)line+=' NOT NULL';
      if(c.unique)line+=' UNIQUE';
      const d=c.documentation||'';const def=d.match(/DEFAULT ([^;]+)/);if(def)line+=' DEFAULT '+def[1];
      const ck=d.match(/CHECK ([^;]+)/);if(ck)line+=' CHECK ('+ck[1]+')';
      if(c.referenceTo){line+=' REFERENCES '+c.referenceTo._parent.name+'('+c.referenceTo.name+')';line+=' ON DELETE '+(cascade.has(name)?'CASCADE':'RESTRICT');}
      return line;
    });
    lines.push('    PRIMARY KEY ('+e.columns.filter(c=>c.primaryKey).map(c=>c.name).join(', ')+')');
    for(const x of extra[name]||[])lines.push('    '+x);
    sql+='CREATE TABLE '+name+' (\n'+lines.join(',\n')+'\n);\n\n';
  }
  sql+='-- Mandatory 1:1 audio/file and model/weights are checked at transaction end.\nALTER TABLE audio_recording ADD CONSTRAINT audio_requires_file\n    FOREIGN KEY (id) REFERENCES audio_file(audio_id) DEFERRABLE INITIALLY DEFERRED;\nALTER TABLE analysis_model ADD CONSTRAINT model_requires_weights\n    FOREIGN KEY (id) REFERENCES weight_profile(model_id) DEFERRABLE INITIALLY DEFERRED;\n';
  sql+='\nCREATE INDEX analysis_job_audio_idx ON analysis_job(audio_id);\nCREATE INDEX analysis_job_model_idx ON analysis_job(model_id);\nCREATE INDEX analysis_job_principal_idx ON analysis_job(principal_id);\nCREATE INDEX audio_tag_tag_idx ON audio_recording_tag(tag_id);\nCREATE INDEX audio_emotion_label_idx ON audio_recording_emotion(emotion_id);\nCOMMIT;\n';
  write('sql/aria.sql',sql);
  for(const [name,constraints] of Object.entries(extra))app.engine.setProperty(table(name),'documentation',table(name).documentation+'\n'+constraints.join('\n'));
  app.engine.setProperty(table('audio_recording'),'documentation',table('audio_recording').documentation+'\nMandatory file: FK id -> audio_file.audio_id, DEFERRABLE INITIALLY DEFERRED.');
  app.engine.setProperty(table('analysis_model'),'documentation',table('analysis_model').documentation+'\nMandatory weights: FK id -> weight_profile.model_id, DEFERRABLE INITIALLY DEFERRED.');
  require(path.resolve('scripts/polish-model.cjs'))(app);
  // Built-in validation, with source-model errors reported separately.
  const errors=app.validator.validate();
  json('validation/staruml-validation.json',{tool:'StarUML '+app.metadata.version,method:'app.validator.validate()',errors,sourceErrors:errors.filter(e=>!under(app.repository.get(e.id))),lab6Errors:errors.filter(e=>under(app.repository.get(e.id)))});
  const all=Object.values(app.repository.getIdMap());
  const diagrams=all.filter(e=>e instanceof T.Diagram);
  const added=all.filter(e=>under(e));
  function stats(items){return {packages:items.filter(e=>e instanceof T.UMLPackage).length,subsystems:items.filter(e=>e instanceof T.UMLSubsystem).length,diagrams:items.filter(e=>e instanceof T.Diagram).length,umlClasses:items.filter(e=>e instanceof T.UMLClass).length,relationships:items.filter(e=>e instanceof T.Relationship).length,logicalEntities:items.filter(e=>e instanceof T.UMLClass&&e.stereotype==='entity').length,tables:items.filter(e=>e instanceof T.ERDEntity).length};}
  const inv=JSON.parse(fs.readFileSync(path.join(root,'source-inventory.json'),'utf8'));
  json('statistics.json',{counting:'Native StarUML repository objects. Reused diagram views are not counted as additional model elements. UMLClass includes source copies in different packages.',total:stats(all),lab6:stats(added),canonicalAnalysis:inv.canonicalClasses.reduce((a,c)=>(a[c.stereotype]=(a[c.stereotype]||0)+1,a),{}),diagrams:diagrams.filter(d=>under(d)).map(d=>({id:d._id,name:d.name}))});
  app.project.save(path.join(root,'ARIA-Lab6.mdj'));
  // StarUML's own exporter produces every submitted diagram image.
  const exporter=require('C:/Program Files/StarUML/resources/app.asar/src/engine/diagram-export');
  for(const d of diagrams.filter(d=>under(d))){
    const id=d.name.slice(0,2);
    app.commands.execute('project:export-diagram-to-svg',d,path.join(root,'diagrams',id+'.svg'));
    app.commands.execute('project:export-diagram-to-png',d,path.join(root,'diagrams',id+'.png'));
    exporter.exportToPDF([d],path.join(root,'diagrams',id+'.pdf'),{size:'A4',layout:'portrait',showName:false});
  }
  app.commands.execute('html-export:export',path.join(root,'docs/html'));
  write('finish-status.txt','Saved native model, imported 7 Python classes, generated PostgreSQL DDL, exported '+diagrams.filter(d=>under(d)).length+' diagrams and HTML documentation.\n');
};
