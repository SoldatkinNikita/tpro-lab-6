// Executed by StarUML's built-in EJS command. All models and views are
// constructed in the StarUML runtime and saved by ProjectManager.
module.exports = function (app) {
  const fs = require('fs');
  const path = require('path');
  const T = app.type;
  const root = path.resolve('lab6');
  for (const dir of ['', 'diagrams', 'generated', 'sql', 'validation', 'docs'])
    fs.mkdirSync(path.join(root, dir), {recursive:true});
  const json = (name,data) => fs.writeFileSync(path.join(root,name), JSON.stringify(data,null,2)+'\n');
  const project = app.project.getProject();
  // Change the active filename before modifying anything: StarUML autosave
  // must never write design changes back into the preserved source copy.
  app.project.save(path.join(root,'ARIA-Lab6.mdj'));
  const aria = project.ownedElements.find(x=>x.name==='ARIA');
  const original = app.repository.getInstancesOf('Model').map(x=>x._id);
  const canonical = app.repository.get('8c9bbbe8867446158a754fe3c5a30b1f');
  const analysisPackages = canonical.ownedElements.filter(x=>x instanceof T.UMLPackage);
  const sourceClasses = analysisPackages.flatMap(x=>x.ownedElements.filter(c=>c instanceof T.UMLClass));
  const norm=s=>s.replace(/\s+/g,' ').trim();
  const source=name=>sourceClasses.find(c=>norm(c.name)===name);
  function model(parent,id,name,props={},field='ownedElements') {
    return app.factory.createModel({id,parent,field,modelInitializer:m=>Object.assign(m,{name,...props})});
  }
  function diagram(parent,id,name) {
    return app.factory.createDiagram({id,parent,diagramInitializer:d=>{d.name=name;}});
  }
  function node(d,m,x,y,w=290,h=70,props={}) {
    const viewType = m.getViewType();
    const V = m instanceof T.ERDEntity ? T.ERDEntityView : (typeof viewType==='string'?T[viewType]:viewType) || T.UMLPackageView;
    const v=new V(); v.model=m; v.initialize(null,x,y,x+w,y+h);
    Object.assign(v,{showShadow:false,showNamespace:false,stereotypeDisplay:'label',...props});
    v.font.face='Arial'; v.font.size=13;
    app.engine.addViews(d,[v]); return v;
  }
  function dep(d,a,b,stereotype='trace',name='') {
    const r = new T.UMLDependency(); r._parent=d._parent; r.source=a.model;r.target=b.model;
    r.stereotype=stereotype;r.name=name;
    app.engine.addModel(d._parent,'ownedElements',r);
    const v=new T.UMLDependencyView(); v.model=r;v.tail=a;v.head=b;
    v.initialize(null,a.left+a.width/2,a.top+a.height/2,b.left+b.width/2,b.top+b.height/2);
    v.showShadow=false; v.font.face='Arial';v.font.size=12;
    app.engine.addViews(d,[v]);return r;
  }
  function assoc(d,a,b,ca,cb,name='',erd=false) {
    const r=erd?new T.ERDRelationship():new T.UMLAssociation();
    r._parent=d._parent;r.name=name;r.end1.reference=a.model;r.end2.reference=b.model;
    if(erd){r.end1.cardinality=ca;r.end2.cardinality=cb;r.identifying=false;}
    else {r.end1.multiplicity=ca;r.end2.multiplicity=cb;}
    app.engine.addModel(d._parent,'ownedElements',r);
    const v=erd?new T.ERDRelationshipView():new T.UMLAssociationView();
    v.model=r;v.tail=a;v.head=b;v.initialize(null,a.left+a.width/2,a.top+a.height/2,b.left+b.width/2,b.top+b.height/2);
    v.font.face='Arial';v.font.size=12;app.engine.addViews(d,[v]);return r;
  }
  function attr(c,name,type,visibility='private',extra={}) {
    return model(c,'UMLAttribute',name,{type,visibility,...extra},'attributes');
  }
  function op(c,name,parameters,returns,visibility='public') {
    const o=model(c,'UMLOperation',name,{visibility},'operations');
    for(const [n,t] of parameters) model(o,'UMLParameter',n,{type:t,direction:'in'},'parameters');
    model(o,'UMLParameter','return',{type:returns,direction:'return'},'parameters');
    return o;
  }
  const lab=model(aria,'UMLPackage','06. Проектирование и инженерия',{
    documentation:'ЛР №6. Проектные решения: Python 3, PostgreSQL. Исходная модель анализа сохранена. Catalog Service и Auth Service являются внешними системами. Модель создаётся API StarUML из пользовательского сценария; это не штатная трансформация Enterprise Architect.'});
  const design=model(lab,'UMLPackage','01. Подсистемы проектирования');
  const traces=model(lab,'UMLPackage','02. Трассировка');
  const db=model(lab,'UMLPackage','03. Проект базы данных');
  const logical=model(db,'UMLPackage','01. Инфологическая модель');
  const physical=model(db,'ERDDataModel','02. Даталогическая модель PostgreSQL');
  const deployment=model(db,'UMLPackage','03. Физическая структура');
  const subs={};
  for(const p of analysisPackages) subs[norm(p.name)]=model(design,'UMLSubsystem',norm(p.name),{
    documentation:'Реализует пакет анализа «'+norm(p.name)+'». Интеграционные подсистемы содержат адаптеры ARIA; внешние сервисы не входят в ARIA.'});
  const specs=[
    ['Анализ аудиозаписи','AudioAnalysisService','Анализ аудиозаписей', [['model_name','str'],['thresholds','dict[str, float]']], [['start',[['audio_id','UUID']],'UUID'],['get_audio_file',[['audio_id','UUID']],'bytes'],['extract_features',[['audio','bytes']],'dict[str, float]'],['filter_scores',[['scores','dict[str, float]']],'dict[str, float]']]],
    ['Повторный анализ каталога','CatalogAnalysisService','Анализ аудиозаписей',[['filters','dict[str, str]'],['scheduled_at','datetime | None']], [['start_catalog',[['filters','dict[str, str]'],['scheduled_at','datetime | None']],'list[UUID]'],['select_audio',[['filters','dict[str, str]']],'list[UUID]']]],
    ['Поиск аудиозаписи','AudioSearchService','Поиск аудиозаписей',[['description','str'],['filters','dict[str, str]']], [['search',[['description','str'],['filters','dict[str, str]']],'list[UUID]'],['build_conditions',[],'dict[str, str]']]],
    ['Управление заданием анализа','AnalysisJobService','Задания и результаты',[['current_job_id','UUID | None']], [['create',[['audio_id','UUID']],'UUID'],['save_result',[['job_id','UUID'],['scores','dict[str, float]']],'None'],['list_jobs',[],'list[UUID]'],['cancel',[['job_id','UUID']],'bool'],['get_status',[['job_id','UUID']],'str']]],
    ['Управление результатами анализа','AnalysisResultService','Задания и результаты',[['export_format','str']], [['get_history',[],'list[UUID]'],['get_result',[['job_id','UUID']],'dict[str, float]'],['delete_result',[['job_id','UUID']],'bool'],['export_history',[],'bytes']]],
    ['Настройка параметров анализа','AnalysisSettingsService','Модели и параметры',[['model_name','str'],['weights_path','str'],['thresholds','dict[str, float]']], [['select_model',[['name','str']],'None'],['import_model',[['file','str'],['name','str']],'None'],['set_thresholds',[['thresholds','dict[str, float]']],'None']]],
    ['Вход в систему','AuthServiceAdapter','Интеграция с Auth Service',[['principal_id','UUID | None']], [['login',[['login','str'],['password','str']],'UUID'],['get_permissions',[],'list[str]'],['check_permission',[['action','str']],'bool']]]
  ];
  const controllers={};
  for(const [s,n,p,attrs,ops] of specs){
    const c=model(subs[p],'UMLClass',n,{stereotype:'service',documentation:'Проектный класс для «'+s+'». Python 3. Каркас методов; реализация алгоритмов не входит в ЛР №6.'});
    for(const [an,at] of attrs)attr(c,an,at);
    for(const [on,ps,rt] of ops)op(c,on,ps,rt);
    controllers[n]=c;
  }
  const boundSpecs=[
    ['Форма Анализ аудиозаписи','AudioAnalysisForm','Анализ аудиозаписей','AudioAnalysisService'],
    ['Форма Анализ каталога','CatalogAnalysisForm','Анализ аудиозаписей','CatalogAnalysisService'],
    ['Форма Поиск аудиозаписи','AudioSearchForm','Поиск аудиозаписей','AudioSearchService'],
    ['Форма Активные задания','ActiveJobsForm','Задания и результаты','AnalysisJobService'],
    ['Форма История анализов','AnalysisHistoryForm','Задания и результаты','AnalysisResultService'],
    ['Форма Результат анализа','AnalysisResultForm','Задания и результаты','AnalysisResultService'],
    ['Форма Параметры анализа','AnalysisSettingsForm','Модели и параметры','AnalysisSettingsService'],
    ['Форма Вход','LoginForm','Интеграция с Auth Service','AuthServiceAdapter'],
    ['Интерфейс Catalog Service','CatalogServiceEndpoint','Интеграция с Catalog Service','AnalysisJobService'],
    ['Интерфейс Auth Service','AuthClient','Интеграция с Auth Service','AuthServiceAdapter'],
    ['Интерфейс файлового хранилища','AudioStorageAdapter','Доступ к файловому хранилищу','AudioAnalysisService']
  ];
  const boundaries={};
  for(const [s,n,p,target] of boundSpecs){
    const c=model(subs[p],'UMLClass',n,{stereotype:s.startsWith('Форма')?'form':'adapter',documentation:'Реализация граничного класса «'+s+'». '+(n==='AuthClient'?'Передаёт проверку учётных данных внешнему Auth Service; пароль не сохраняется.':'')});
    attr(c,'service',target);op(c,'handle',[['payload','dict[str, str]']],'dict[str, str]');boundaries[n]=c;
  }
  // Separate pages keep each mapping legible at A4 size.
  const ds=[];
  function mapping(number,title,rows,left,right){
    const d=diagram(traces,'UMLClassDiagram',number+'. '+title);ds.push(d);
    rows.forEach((r,i)=>{
      const a=node(d,left(r),30,30+i*110,290,75,{suppressAttributes:true,suppressOperations:true});
      const b=node(d,right(r),510,30+i*110,300,75,{suppressAttributes:true,suppressOperations:true});dep(d,a,b);
    });return d;
  }
  mapping('22','Граничные классы — формы',boundSpecs.slice(0,8),r=>source(r[0]),r=>boundaries[r[1]]);
  mapping('23','Граничные классы — адаптеры',boundSpecs.slice(8),r=>source(r[0]),r=>boundaries[r[1]]);
  mapping('24','Управляющие классы — проектирование',specs,r=>source(r[0]),r=>controllers[r[1]]);
  const dp=diagram(traces,'UMLPackageDiagram','25. Пакеты анализа — подсистемы');ds.push(dp);
  analysisPackages.forEach((p,i)=>{const a=node(dp,p,30,30+i*105,310,70);const b=node(dp,subs[norm(p.name)],550,30+i*105,310,70);dep(dp,a,b);});
  const dc1=diagram(design,'UMLClassDiagram','26. Проектные классы — анализ и поиск');ds.push(dc1);
  const dc2=diagram(design,'UMLClassDiagram','27. Проектные классы — задания, параметры и вход');ds.push(dc2);
  specs.forEach((s,i)=>node(i<3?dc1:dc2,controllers[s[1]],30,30+(i<3?i:i-3)*255,800,220));
  const dd=diagram(logical,'UMLClassDiagram','28. Инфологическая модель — аудиозаписи');ds.push(dd);
  const dl=diagram(logical,'UMLClassDiagram','29. Инфологическая модель — анализ');ds.push(dl);
  // Fields shared by the conceptual and relational models. SQL specifics are explicit.
  const entities=[
    ['Аудиозапись','audio_recording',[['id','UUID','PK'],['title','TEXT',''],['author','TEXT',''],['tempo','NUMERIC(7,3)','NULL; CHECK tempo > 0'],['tonic','SMALLINT','NULL; CHECK tonic BETWEEN 0 AND 11'],['mode','VARCHAR(16)',"NULL; CHECK mode IN ('major','minor')"],['detune','NUMERIC(8,3)','NULL']],0,0],
    ['Файл','audio_file',[['id','UUID','PK'],['audio_id','UUID','FK audio_recording.id; UNIQUE'],['location','TEXT','UNIQUE'],['duration','NUMERIC(12,3)','CHECK duration > 0'],['format','VARCHAR(16)','']],1,0],
    ['Тег','tag',[['id','UUID','PK'],['name','TEXT','UNIQUE']],0,1],
    ['Эмоциональная метка','emotion_label',[['id','UUID','PK'],['name','TEXT','UNIQUE'],['description','TEXT','']],1,1],
    ['Пользователь','principal',[['id','UUID','PK; external Auth Service ID'],['name','TEXT','']],0,0],
    ['Модель','analysis_model',[['id','UUID','PK'],['name','TEXT','UNIQUE'],['quality_metrics','JSONB',"DEFAULT '{}'::jsonb"],['active','BOOLEAN','DEFAULT FALSE']],1,0],
    ['Профиль весов','weight_profile',[['id','UUID','PK'],['model_id','UUID','FK analysis_model.id; UNIQUE'],['location','TEXT','']],2,0],
    ['Порог уверенности','confidence_threshold',[['id','UUID','PK'],['model_id','UUID','FK analysis_model.id'],['name','TEXT',''],['value','NUMERIC(6,5)','CHECK value BETWEEN 0 AND 1']],2,1],
    ['Задание анализа','analysis_job',[['id','UUID','PK'],['audio_id','UUID','FK audio_recording.id'],['model_id','UUID','FK analysis_model.id'],['principal_id','UUID','NULL; FK principal.id'],['status','VARCHAR(16)',"CHECK status IN ('queued','running','completed','cancelled','failed')"],['created_at','TIMESTAMPTZ','DEFAULT CURRENT_TIMESTAMP'],['started_at','TIMESTAMPTZ','NULL'],['finished_at','TIMESTAMPTZ','NULL'],['progress','NUMERIC(6,5)','CHECK progress BETWEEN 0 AND 1'],['error','TEXT','NULL'],['request_source','TEXT',''],['thresholds_snapshot','JSONB',"DEFAULT '{}'::jsonb"]],0,1],
    ['Оценка уверенности','confidence_score',[['id','UUID','PK'],['job_id','UUID','FK analysis_job.id'],['characteristic','TEXT',''],['value','TEXT',''],['confidence','NUMERIC(6,5)','CHECK confidence BETWEEN 0 AND 1'],['accepted','BOOLEAN','']],1,1]
  ];
  const concepts={},tables={},columns={};
  for(const [name,table,fields,col,row] of entities){
    const c=model(logical,'UMLClass',name,{stereotype:'entity',documentation:'Уточнение существующей сущности анализа. Технический идентификатор и ссылки введены при проектировании хранения. '+(table==='principal'?'Локальная проекция внешнего пользователя, без паролей.':'')});
    for(const [n,t,k] of fields)attr(c,n,t,'public',{stereotype:k.startsWith('PK')?'PK':'',documentation:k});
    concepts[name]=c;
    const d=['Аудиозапись','Файл','Тег','Эмоциональная метка'].includes(name)?dd:dl;
    node(d,c,30+col*420,30+row*530,340,250);
    const e=model(physical,'ERDEntity',table,{documentation:name});tables[table]=e;columns[table]={};
    for(const [n,t,k] of fields){
      const typ=t.match(/^([^()]+)(?:\((.*)\))?$/);
      columns[table][n]=model(e,'ERDColumn',n,{type:typ[1],length:typ[2]||'',primaryKey:k.startsWith('PK'),foreignKey:k.includes('FK '),nullable:k.startsWith('NULL'),unique:k.includes('UNIQUE'),documentation:k},'columns');
    }
  }
  const conceptView=(d,n)=>d.ownedViews.find(v=>v.model===concepts[n]);
  assoc(dd,conceptView(dd,'Аудиозапись'),conceptView(dd,'Файл'),'1','1','имеет');
  assoc(dd,conceptView(dd,'Аудиозапись'),conceptView(dd,'Тег'),'0..*','0..*','помечена');
  assoc(dd,conceptView(dd,'Аудиозапись'),conceptView(dd,'Эмоциональная метка'),'0..*','0..*','имеет метки');
  const audioRef=node(dl,concepts['Аудиозапись'],30,1120,340,80,{suppressAttributes:true,suppressOperations:true});
  for(const [a,b,ca,cb] of [['Пользователь','Задание анализа','0..1','0..*'],['Модель','Задание анализа','1','0..*'],['Модель','Профиль весов','1','1'],['Модель','Порог уверенности','1','0..*'],['Задание анализа','Оценка уверенности','1','0..*']]) assoc(dl,conceptView(dl,a),conceptView(dl,b),ca,cb);
  assoc(dl,audioRef,conceptView(dl,'Задание анализа'),'1','0..*');
  for(const [n,target] of [['audio_recording_tag','tag'],['audio_recording_emotion','emotion_label']]){
    const e=model(physical,'ERDEntity',n,{documentation:'Связующая таблица для M:N, не новая предметная сущность.'});tables[n]=e;columns[n]={};
    for(const [cn,tab] of [['audio_id','audio_recording'],[target==='tag'?'tag_id':'emotion_id',target]]) columns[n][cn]=model(e,'ERDColumn',cn,{type:'UUID',primaryKey:true,foreignKey:true,referenceTo:columns[tab].id},'columns');
  }
  for(const [name,table,fields] of entities) for(const [n,t,k] of fields){
    const m=k.match(/FK (\w+)\.(\w+)/);if(m)app.engine.setProperty(columns[table][n],'referenceTo',columns[m[1]][m[2]]);
  }
  const er1=diagram(physical,'ERDDiagram','30. Даталогическая модель — аудиозаписи');ds.push(er1);
  const er2=diagram(physical,'ERDDiagram','31. Даталогическая модель — анализ');ds.push(er2);
  const pos1={audio_recording:[30,30],audio_file:[520,30],tag:[30,700],emotion_label:[520,700],audio_recording_tag:[30,440],audio_recording_emotion:[520,440]};
  const pos2={principal:[30,30],analysis_model:[520,30],weight_profile:[1010,30],analysis_job:[30,330],confidence_score:[520,500],confidence_threshold:[1010,500],audio_recording:[30,1050]};
  for(const [d,positions] of [[er1,pos1],[er2,pos2]])for(const [n,[x,y]] of Object.entries(positions))node(d,tables[n],x,y,350,120);
  for(const d of [er1,er2])for(const v of [...d.ownedViews])if(v.model instanceof T.ERDEntity)for(const c of v.model.columns){
    if(c.referenceTo){const parent=d.ownedViews.find(x=>x.model===c.referenceTo._parent);if(parent)assoc(d,parent,v,'1',c.unique?'0..1':'0..*',c.name,true);}
  }
  mapping('32','Сущности анализа — инфологическая модель',entities,r=>source(r[0]),r=>concepts[r[0]]);
  const dt=diagram(traces,'UMLClassDiagram','33. Инфологическая модель — таблицы');ds.push(dt);
  entities.forEach(([n,t],i)=>{const a=node(dt,concepts[n],30,30+i*105,290,70,{suppressAttributes:true,suppressOperations:true});const b=node(dt,tables[t],510,30+i*105,290,70,{suppressColumns:true});dep(dt,a,b);});
  const dx=diagram(deployment,'UMLDeploymentDiagram','34. Физическая структура хранения');ds.push(dx);
  const runtime=model(deployment,'UMLNode','Среда выполнения ARIA');
  const pg=model(deployment,'UMLNode','PostgreSQL');
  const store=model(deployment,'UMLNode','Файловое хранилище');
  const a=node(dx,runtime,30,30,370,100),b=node(dx,pg,30,280,370,100),c=node(dx,store,550,280,370,100);
  dep(dx,a,b,'','SQL / метаданные');dep(dx,a,c,'','чтение аудио и весов');
  model(pg,'UMLArtifact','aria.sql',{documentation:'12 таблиц PostgreSQL, ключи и ограничения.'});
  const structure=diagram(db,'UMLPackageDiagram','35. Структура проекта базы данных');ds.push(structure);
  const l=node(structure,logical,30,30,360,90),p=node(structure,physical,30,240,360,90),f=node(structure,deployment,30,450,360,90);
  dep(structure,l,p,'trace','сущность → таблица');dep(structure,p,f,'','размещение');
  // Dependencies between the actual internal subsystems. External systems stay outside ARIA.
  const sd=diagram(design,'UMLPackageDiagram','36. Зависимости подсистем ARIA');ds.push(sd);
  const sn={};Object.entries(subs).forEach(([n,m],i)=>{sn[n]=node(sd,m,30+(i%2)*540,30+Math.floor(i/2)*230,370,100);});
  for(const [a,b] of [['Анализ аудиозаписей','Задания и результаты'],['Анализ аудиозаписей','Модели и параметры'],['Анализ аудиозаписей','Аудиозаписи'],['Анализ аудиозаписей','Доступ к файловому хранилищу'],['Поиск аудиозаписей','Аудиозаписи'],['Интеграция с Catalog Service','Анализ аудиозаписей'],['Интеграция с Catalog Service','Задания и результаты']])dep(sd,sn[a],sn[b],'');
  // Forward engineering from native UML attributes and operation parameters.
  let code='# Generated by StarUML 7.1.1 using scripts/lab6.ejs.\n# Educational design skeleton; algorithms are not implemented.\nfrom __future__ import annotations\nfrom datetime import datetime\nfrom uuid import UUID\n\n';
  for(const c of Object.values(controllers)){
    code+='class '+c.name+':\n    """'+c.documentation.replace(/"/g,"'")+'"""\n';
    for(const a of c.attributes)code+='    _'+a.name+': '+a.type+'\n';
    for(const o of c.operations){const ps=o.parameters.filter(p=>p.direction!=='return');const ret=o.parameters.find(p=>p.direction==='return');code+='\n    def '+o.name+'(self'+ps.map(p=>', '+p.name+': '+p.type).join('')+') -> '+ret.type+':\n        raise NotImplementedError\n';}
    code+='\n\n';
  }
  fs.writeFileSync(path.join(root,'generated/aria_design.py'),code);
  json('design-contract.json',specs.map(([source,name,subsystem])=>({source,name,subsystem})));
  json('database-contract.json',entities);
  json('source-inventory.json',{canonicalPackage:canonical._id,canonicalClasses:sourceClasses.map(c=>({id:c._id,name:norm(c.name),stereotype:c.stereotype})),originalModelIds:original});
  app.project.save(path.join(root,'ARIA-Lab6.mdj'));
  fs.writeFileSync(path.join(root,'build-status.txt'),'Created by StarUML '+app.metadata.version+'\n'+ds.length+' new diagrams\n');
};
