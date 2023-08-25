const { SyncWaterfallHook } = require("tapable");
const hook = new SyncWaterfallHook(["name", "age"]);

// 前一个返回值是后一个的参数
hook.tap("1", (name, age) => {
  console.log(1, name, age);
  return "结果1";
});

hook.tap("2", (name, age) => {
  console.log(2, name, age);
  return "结果2";
});

hook.tap("3", (name, age) => {
  console.log(3, name, age);
});

hook.call("zhufeng", 12);
