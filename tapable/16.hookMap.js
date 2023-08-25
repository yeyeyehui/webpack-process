const { HookMap, AsyncParallelHook } = require("../tapable-core");

const map = new HookMap(() => new AsyncParallelHook(["name", "age"]));

/* 
map.for('key1').tap('plugin1',(name,age)=>console.log('plugin1',name,age));
map.for('key1').tap('plugin2',(name,age)=>console.log('plugin2',name,age));
map.for('key2').tap('plugin3',(name,age)=>console.log('plugin3',name,age));
map.get('key1').call('zhufeng',16);
map.get('key2').call('zhufeng2',17); */

// pubsub的触发方式，批量触发
map.for("key1").tapAsync("plugin1", (name, age, callback) => {
  console.log("plugin1", name, age);
  callback();
});

map.get("key1").callAsync("zhufeng", 16, () => {
  console.log("done");
});
