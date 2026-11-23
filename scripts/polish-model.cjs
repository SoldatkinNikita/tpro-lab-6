// Presentation fixes applied inside StarUML; reusable after a fresh build.
module.exports=function(app){
  const T=app.type;
  const lab=app.repository.getInstancesOf('UMLPackage').find(p=>p.name==='06. Проектирование и инженерия');
  const under=x=>{for(let p=x;p;p=p._parent)if(p===lab)return true;return false;};
  const diagrams=()=>app.repository.getInstancesOf('Diagram').filter(under);
  const d=id=>diagrams().find(x=>x.name.startsWith(id+'.'));
  const physical=app.repository.getInstancesOf('ERDDataModel').find(under);
  // ERDDataModel has no UMLPackageView: show a real package containing it.
  if(physical._parent.getClassName()!=='UMLPackage'||physical._parent.name!=='02. Даталогическая модель'){
    const db=physical._parent;
    const wrapper=app.factory.createModel({id:'UMLPackage',parent:db,modelInitializer:m=>m.name='02. Даталогическая модель'});
    app.engine.relocate(physical,wrapper,'ownedElements');
    for(const v of d('35').ownedViews)if(v.model===physical)app.engine.setProperty(v,'model',wrapper);
    for(const v of d('35').ownedViews)if(v.model instanceof T.UMLDependency){
      if(v.model.source===physical)app.engine.setProperty(v.model,'source',wrapper);
      if(v.model.target===physical)app.engine.setProperty(v.model,'target',wrapper);
    }
  }
  function node(diag,m,x,y,w=370){
    const v=new T.UMLClassView();v.model=m;v.initialize(null,x,y,x+w,y+1);v.showNamespace=false;v.showShadow=false;v.suppressOperations=true;v.font.face='Arial';v.font.size=14;app.engine.addViews(diag,[v]);return v;
  }
  for(const v of d('35').ownedViews)if(v.model instanceof T.UMLDependency&&v.model.stereotype==='trace')app.engine.setProperty(v.model,'name','');
  function association(diag,r){
    const a=diag.ownedViews.find(v=>v.model===r.end1.reference),b=diag.ownedViews.find(v=>v.model===r.end2.reference);
    if(!a||!b)return;
    const v=new T.UMLAssociationView();v.model=r;v.tail=a;v.head=b;v.initialize(null,a.left+100,a.top+30,b.left+100,b.top+30);app.engine.addViews(diag,[v]);
  }
  // Separate conceptual settings from jobs, keeping the same entity objects.
  const original=d('29'),logical=original._parent;
  let config=d('39');
  if(!config){
    config=app.factory.createDiagram({id:'UMLClassDiagram',parent:logical,diagramInitializer:x=>x.name='39. Инфологическая модель — модели и параметры'});
    const names=new Set(['Модель','Профиль весов','Порог уверенности']);
    const models=original.ownedViews.filter(v=>v.model instanceof T.UMLClass&&names.has(v.model.name)).map(v=>v.model);
    const remove=original.ownedViews.filter(v=>models.includes(v.model)||v.model instanceof T.UMLAssociation);
    app.engine.deleteElements([],remove);
    models.forEach((m,i)=>node(config,m,i?530:30,i===2?350:30));
    app.engine.setProperty(original,'name','29. Инфологическая модель — задания и оценки');
    const positions={'Пользователь':[30,30],'Аудиозапись':[530,30],'Задание анализа':[30,350],'Оценка уверенности':[530,450]};
    for(const v of original.ownedViews)if(v.model instanceof T.UMLClass){const p=positions[v.model.name];if(p)app.engine.setProperties(v,{left:p[0],top:p[1],width:370,height:1,suppressOperations:true,suppressAttributes:false});}
    for(const r of app.repository.getInstancesOf('UMLAssociation').filter(under)){association(original,r);association(config,r);}
  }
  // Remove redundant ER relationships left by splitting the initial ER page.
  const unique=new Map();
  for(const r of [...app.repository.getInstancesOf('ERDRelationship').filter(under)]){
    const key=[r.end1.reference._id,r.end2.reference._id,r.name,r.end1.cardinality,r.end2.cardinality].join('|');
    if(unique.has(key)){
      const keep=unique.get(key);
      for(const diag of diagrams())for(const v of diag.ownedViews)if(v.model===r)app.engine.setProperty(v,'model',keep);
      app.engine.deleteElements([r],[]);
    }else unique.set(key,r);
  }
  // Compact excess blank compartments. Geometry remains editable in the MDJ.
  for(const diag of diagrams())for(const v of diag.ownedViews){
    if(v instanceof T.UMLClassView&&v.model instanceof T.UMLClass){
      const hidden=v.suppressAttributes&&v.suppressOperations;
      app.engine.setProperty(v,'height',hidden?60:1);
      if(v.model.stereotype==='entity')app.engine.setProperty(v,'suppressOperations',true);
    }
    if(v instanceof T.ERDEntityView)app.engine.setProperty(v,'height',1);
  }
  const corePositions={
    '28':{'Аудиозапись':[30,30],'Файл':[450,30],'Тег':[30,350],'Эмоциональная метка':[450,350]},
    '30':{audio_recording:[30,30],audio_file:[520,30],audio_recording_tag:[30,300],audio_recording_emotion:[520,300],tag:[30,540],emotion_label:[520,540]}
  };
  for(const [id,positions] of Object.entries(corePositions))for(const v of d(id).ownedViews){
    const pos=v.model&&positions[v.model.name];if(pos)app.engine.setProperties(v,{left:pos[0],top:pos[1]});
  }
  for(const v of d('37').ownedViews)if(v.model instanceof T.ERDEntity){
    const pos={principal:[30,30],audio_recording:[530,30],analysis_job:[30,320],confidence_score:[530,420]}[v.model.name];
    if(pos)app.engine.setProperties(v,{left:pos[0],top:pos[1]});
  }
};
