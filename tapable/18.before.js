const { SyncHook } = require("../tapable-core");

const hook = new SyncHook(["name"]);

hook.tap({ name: "tap1" }, (name) => {
  console.log(1, name);
});

hook.tap({ name: "tap3" }, (name) => {
  console.log(3, name);
});

hook.tap({ name: "tap5" }, (name) => {
  console.log(5, name);
});

// 后置事件
hook.tap({ name: "tap2", before: ["tap3", "tap5"] }, (name) => {
  console.log(2, name);
});

debugger;

hook.call("zhufeng");
