const fs = require('fs');
function init() {
  async function run(jobPath) {
    const job=JSON.parse(fs.readFileSync(jobPath,'utf8'));
    try {
      await require(job.module)(app,job);
      fs.writeFileSync(job.done,JSON.stringify({status:'passed',phase:job.phase})+'\n');
    } catch(error) {
      fs.writeFileSync(job.error,error.stack+'\n');
      fs.writeFileSync(job.done,JSON.stringify({status:'failed',phase:job.phase,error:String(error)})+'\n');
      console.error(error);
    }
  }
  app.commands.register('aria-lab6:run',run);
  let busy=false;
  const pointer=require('path').join(__dirname,'workflow-path.json');
  setInterval(async ()=>{
    if(busy||!fs.existsSync(pointer))return;
    const jobPath=JSON.parse(fs.readFileSync(pointer,'utf8')).path;
    if(!fs.existsSync(jobPath))return;
    const job=JSON.parse(fs.readFileSync(jobPath,'utf8'));
    if(!job.autorun||fs.existsSync(job.done))return;
    let lock;
    try{lock=fs.openSync(job.done+'.lock','wx');}catch(error){return;}
    busy=true;
    try{app.project.load(job.model);await run(jobPath);}finally{busy=false;fs.closeSync(lock);fs.unlinkSync(job.done+'.lock');}
  },2000);
}
exports.init=init;
