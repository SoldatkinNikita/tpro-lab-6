// Model editing and orchestration only. Python and DDL are generated exclusively
// by the installed standard extensions: python:generate / python:reverse / ddl:generate.
module.exports=async function(app,job){
  const fs=require('fs'),path=require('path'),T=app.type;
  const root=job.root,labRoot=path.join(root,'lab6');
  const json=(n,v)=>fs.writeFileSync(path.join(labRoot,n),JSON.stringify(v,null,2)+'\n');
  let lab=app.repository.getInstancesOf('UMLPackage').find(p=>p.name==='06. Проектирование и инженерия');
  const under=(x,p=lab)=>{for(let e=x;e;e=e._parent)if(e===p)return true;return false;};
  const norm=s=>s.replace(/\s+/g,' ').trim();
  const model=(parent,id,name,props={},field='ownedElements')=>app.factory.createModel({parent,id,field,modelInitializer:m=>Object.assign(m,{name,...props})});
  const diagrams=()=>app.repository.getInstancesOf('Diagram').filter(d=>under(d));
  const byId=n=>diagrams().find(d=>d.name.startsWith(n+'.'));
  let design=lab.ownedElements.find(p=>p.name==='01. Подсистемы проектирования'||p.name==='Design');
  const classByName=n=>app.repository.getInstancesOf('UMLClass').find(c=>under(c,design)&&c.name===n);
  function node(d,c,x,y,w=440){
    const V=c instanceof T.ERDEntity?T.ERDEntityView:T.UMLClassView;
    const v=new V();v.model=c;v.initialize(null,x,y,x+w,y+1);
    Object.assign(v,{showNamespace:false,showShadow:false,suppressAttributes:false,suppressOperations:false,suppressColumns:false});
    v.font.face='Arial';v.font.size=16;app.engine.addViews(d,[v]);return v;
  }
  function diagram(parent,name){return app.factory.createDiagram({id:'UMLClassDiagram',parent,diagramInitializer:d=>d.name=name});}
  function dependency(d,a,b,r){
    if(!r){r=new T.UMLDependency();r.source=a.model;r.target=b.model;r.stereotype='trace';app.engine.addModel(d._parent,'ownedElements',r);}
    const v=new T.UMLDependencyView();v.model=r;v.tail=a;v.head=b;v.initialize(null,a.left+100,a.top+20,b.left+100,b.top+20);v.font.face='Arial';v.font.size=15;app.engine.addViews(d,[v]);
  }
  function tracePages(id,title,rows,perPage=2){
    const first=byId(id),parent=first._parent;
    const remove=diagrams().filter(d=>d!==first&&d.name.startsWith(id+'.'));
    if(remove.length)app.engine.deleteElements(remove,[]);
    app.engine.deleteElements([],first.ownedViews.slice());
    const names=[];
    for(let start=0;start<rows.length;start+=perPage){
      const page=start/perPage+1;
      const d=start?diagram(parent,id+'.'+page+' '+title):first;
      app.engine.setProperty(d,'name',start?id+'.'+page+' '+title:id+'. '+title);
      names.push(d.name);
      for(let i=start;i<Math.min(start+perPage,rows.length);i++){
        const {source,target,relation}=rows[i],row=i-start;
        const a=node(d,source,30,30+row*600,450),b=node(d,target,670,30+row*600,650);
        dependency(d,a,b,relation);
      }
    }
    return names;
  }
  app.project.save(path.join(labRoot,'ARIA-Lab6.mdj'));
  if(job.phase==='prepare'){
    const obsolete=lab.ownedElements.find(p=>p.name==='04. Обратное проектирование Python');
    if(obsolete)app.engine.deleteElements([obsolete],[]);
    const fields={
      AudioAnalysisForm:[['title','str'],['author','str'],['duration','float'],['format','str'],['last_analysis','datetime'],['filters','dict'],['audio_ids','list']],
      CatalogAnalysisForm:[['filters','dict'],['model_name','str'],['scheduled_at','datetime'],['audio_count','int']],
      AudioSearchForm:[['description','str'],['filters','dict'],['sort_order','str'],['audio_ids','list']],
      ActiveJobsForm:[['job_ids','list'],['selected_job_id','UUID'],['status','str'],['progress','float']],
      AnalysisHistoryForm:[['filters','dict'],['analysis_ids','list'],['selected_analysis_id','UUID'],['export_file','str']],
      AnalysisResultForm:[['audio_id','UUID'],['job_id','UUID'],['scores','dict'],['thresholds_snapshot','dict']],
      AnalysisSettingsForm:[['model_name','str'],['thresholds','dict']],
      LoginForm:[['login','str'],['password','str']]
    };
    for(const [name,attributes] of Object.entries(fields)){
      const c=classByName(name);
      for(const [n,t] of attributes)if(!c.attributes.some(a=>a.name===n))model(c,'UMLAttribute',n,{type:t,visibility:'private'},'attributes');
    }
    // The boundary-to-form mapping also includes separate classes for form controls.
    const search=classByName('AudioSearchForm'),controls=[];
    for(const [name,attribute,type] of [['SearchDescriptionInput','value','str'],['SearchFiltersPanel','values','dict'],['SearchResultsTable','audio_ids','list'],['SearchButton','enabled','bool']]){
      let c=classByName(name);
      if(!c){c=model(search._parent,'UMLClass',name,{stereotype:'control'});model(c,'UMLAttribute',attribute,{type,visibility:'private'},'attributes');
        const o=model(c,'UMLOperation',name==='SearchButton'?'click':'update',{visibility:'public'},'operations');
        if(name!=='SearchButton')model(o,'UMLParameter',attribute,{type,direction:'in'},'parameters');
        model(o,'UMLParameter','return',{type:'None',direction:'return'},'parameters');}
      controls.push(c);
    }
    let ui=byId('40');
    if(!ui)ui=diagram(design,'40. Форма поиска и элементы интерфейса');
    else app.engine.deleteElements([],ui.ownedViews.slice());
    const form=node(ui,search,250,30,600);
    controls.forEach((c,i)=>{
      const v=node(ui,c,30+(i%2)*700,420+Math.floor(i/2)*260,500);
      let r=app.repository.getRelationshipsOf(search).find(r=>r instanceof T.UMLAssociation&&r.end2.reference===c);
      if(!r){r=new T.UMLAssociation();r.end1.reference=search;r.end1.aggregation='composite';r.end1.multiplicity='1';r.end2.reference=c;r.end2.multiplicity='1';app.engine.addModel(search,'ownedElements',r);}
      const edge=new T.UMLAssociationView();edge.model=r;edge.tail=form;edge.head=v;edge.initialize(null,form.left+100,form.top+100,v.left+100,v.top+30);app.engine.addViews(ui,[edge]);
    });
    // Native Python packages need valid identifiers.
    const packageNames={'Анализ аудиозаписей':'analysis','Поиск аудиозаписей':'search','Задания и результаты':'jobs','Модели и параметры':'settings','Аудиозаписи':'audio','Интеграция с Auth Service':'auth','Интеграция с Catalog Service':'catalog','Доступ к файловому хранилищу':'storage'};
    app.engine.setProperty(design,'name','Design');
    const codePackages=[];
    for(const subsystem of design.ownedElements.filter(p=>p instanceof T.UMLSubsystem)){
      const name=packageNames[norm(subsystem.name)];
      let p=subsystem.ownedElements.find(p=>p instanceof T.UMLPackage&&p.name===name);
      if(!p)p=model(subsystem,'UMLPackage',name);
      for(const c of subsystem.ownedElements.filter(c=>c instanceof T.UMLClass))app.engine.relocate(c,p,'ownedElements');
      codePackages.push(p);
    }
    const manifest=[];
    for(const [id,title] of [['22','Граничные классы — формы'],['23','Граничные классы — адаптеры'],['24','Управляющие классы — проектирование'],['32','Сущности анализа — инфологическая модель'],['33','Инфологическая модель — таблицы']]){
      const relations=new Map();
      for(const d of diagrams().filter(d=>d.name.startsWith(id+'.')))for(const v of d.ownedViews)if(v.model instanceof T.UMLDependency)relations.set(v.model._id,v.model);
      const rows=[...relations.values()].map(r=>({source:r.source,target:r.target,relation:r}));
      manifest.push(...tracePages(id,title,rows,2));
    }
    // Model documentation contains subject information only.
    app.engine.setProperty(lab,'documentation','Модель проектирования ARIA: формы, сервисы, подсистемы и база данных.');
    for(const c of app.repository.getInstancesOf('UMLClass').filter(c=>under(c,design)))
      if(/каркас|скелет|сценар|EJS|Enterprise/i.test(c.documentation||''))app.engine.setProperty(c,'documentation','Класс '+c.name+' подсистемы '+c._parent.name+'.');
    const output=path.resolve(labRoot,'generated/python');
    if(fs.existsSync(output)&&fs.readdirSync(output).length){
      const backup=path.resolve(root,'build','native-generation-'+Date.now());
      if(!output.startsWith(path.resolve(root)+path.sep)||!backup.startsWith(path.resolve(root)+path.sep))throw new Error('Invalid generation paths');
      fs.renameSync(output,backup);
    }
    fs.mkdirSync(output,{recursive:true});
    for(const p of codePackages)await app.commands.execute('python:generate',p,output,{installPath:'#!/usr/bin/env python3',useTab:false,indentSpaces:4,docString:true,lowerCase:false});
    const physical=app.repository.getInstancesOf('ERDDataModel').find(x=>under(x));
    if(!physical)throw new Error('No ER data model selected');
    await app.commands.execute('ddl:generate',physical,path.join(labRoot,'sql/native.sql'),{quoteIdentifiers:false,dropTable:false,dbms:'PostgreSQL',useTab:false,indentSpaces:4});
    function pyFiles(p){return fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?pyFiles(path.join(p,e.name)):(e.name.endsWith('.py')?[path.join(p,e.name)]:[]));}
    const files=pyFiles(output);
    if(files.filter(p=>!p.endsWith('__init__.py')).length!==22||!fs.existsSync(path.join(labRoot,'sql/native.sql')))throw new Error('Native outputs are incomplete');
    json('validation/native-generation.json',{tool:'StarUML '+app.metadata.version,commands:['python:generate','ddl:generate'],pythonExtension:'niklauslee.staruml-python 0.9.2',ddlExtension:'niklauslee.staruml-ddl 0.9.2',basePackages:codePackages.map(p=>p.name),classes:22,files:files.map(p=>path.relative(root,p))});
    json('trace-pages.json',manifest);
  }
  if(job.phase==='reverse'){
    process.env.PYTHONUTF8='1';process.env.PYTHONIOENCODING='utf-8';
    const previous=lab.ownedElements.filter(p=>p.name==='04. Обратное проектирование Python');
    if(previous.length)app.engine.deleteElements(previous,[]);
    const before=new Set(app.project.getProject().ownedElements.map(m=>m._id));
    await app.commands.execute('python:reverse',path.join(labRoot,'reverse-input/python'),{pythonPath:'"P:/Programs/Python 3.13.11/python.exe"',skipSelfParam:true,skipMagicMethods:true,typeHierarchy:false,packageOverview:false,packageStructure:false});
    const roots=app.project.getProject().ownedElements.filter(m=>!before.has(m._id)&&m.name==='PythonReverse');
    if(!roots.length)throw new Error('The standard Python reverse command did not create a model');
    const reverse=roots[roots.length-1];
    // The extension can register its root twice; keep one ownership entry.
    const owner=app.project.getProject();
    while(owner.ownedElements.filter(x=>x===reverse).length>1){
      const b=app.repository.getOperationBuilder();b.begin('Normalize reverse model ownership');b.fieldRemove(owner,'ownedElements',reverse);b.end();app.repository.doOperation(b.getOperation());
    }
    app.engine.relocate(reverse,lab,'ownedElements');
    app.engine.setProperty(reverse,'name','04. Обратное проектирование Python');
    const nativeClasses=app.repository.getInstancesOf('UMLClass').filter(c=>under(c,reverse));
    const comparisons=[];
    for(const [n,id] of [['AudioSearchService','38'],['AudioAnalysisService','41']]){
      const c=nativeClasses.find(c=>c.name===n);if(!c)throw new Error('Native reverse class missing: '+n);
      const d=diagram(reverse,id+'. '+n+' после обратного проектирования');
      const a=node(d,classByName(n),30,30,850),b=node(d,c,30,600,850);dependency(d,a,b);
      comparisons.push({name:n,before:{attributes:classByName(n).attributes.map(a=>a.name),operations:classByName(n).operations.map(o=>o.name)},after:{attributes:c.attributes.map(a=>a.name),operations:c.operations.map(o=>o.name)}});
    }
    const search=nativeClasses.find(c=>c.name==='AudioSearchService'),analysis=nativeClasses.find(c=>c.name==='AudioAnalysisService');
    const passed=search.attributes.some(a=>a.name==='limit')&&search.operations.some(o=>o.name==='set_limit')&&!analysis.attributes.some(a=>a.name==='model_name');
    json('validation/native-reverse.json',{command:'python:reverse',extension:'niklauslee.staruml-python 0.9.2',classes:nativeClasses.length,changesVerified:passed,comparisons});
    if(!passed)throw new Error('Native reverse did not reflect the requested changes');
  }
  // Keep the reverse model's single package ownership after the standard
  // extension registers and imports its root using the same identifiers.
  const reverseRoot=lab.ownedElements.find(p=>p.name==='04. Обратное проектирование Python');
  if(reverseRoot&&app.project.getProject().ownedElements.some(p=>p._id===reverseRoot._id)){
    const data=JSON.parse(app.repository.writeObject(app.project.getProject()));
    data.ownedElements=data.ownedElements.filter(p=>p._id!==reverseRoot._id);
    app.project.loadFromJson(data);
    lab=app.repository.getInstancesOf('UMLPackage').find(p=>p.name==='06. Проектирование и инженерия');
    design=lab.ownedElements.find(p=>p.name==='Design');
  }
  // Validate and export using StarUML's standard commands.
  const errors=app.validator.validate();
  json('validation/staruml-validation.json',{tool:'StarUML '+app.metadata.version,method:'app.validator.validate()',errors,sourceErrors:errors.filter(e=>!under(app.repository.get(e.id))),lab6Errors:errors.filter(e=>under(app.repository.get(e.id)))});
  app.project.save(path.join(labRoot,'ARIA-Lab6.mdj'));
  const files=[];
  for(const d of diagrams()){
    const code=d.name.match(/^\d+(?:\.\d+)?/)[0];
    app.commands.execute('project:export-diagram-to-svg',d,path.join(labRoot,'diagrams',code+'.svg'));
    files.push({code,name:d.name,id:d._id});
  }
  json('diagram-manifest.json',files);
  app.commands.execute('html-export:export',path.join(labRoot,'docs/html'));
  if(errors.length)throw new Error('Native model validation errors: '+JSON.stringify(errors));
};
