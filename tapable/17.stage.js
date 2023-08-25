const { SyncHook } = require("../tapable-core");

const hook = new SyncHook(["name"]);

// stage决定执行顺序
hook.tap({ name: "tap1", stage: 1 }, (name) => {
  console.log(1, name);
});

hook.tap({ name: "tap3", stage: 3 }, (name) => {
  console.log(3, name);
});

hook.tap({ name: "tap5", stage: 5 }, (name) => {
  console.log(5, name);
});

hook.tap({ name: "tap2", stage: 2 }, (name) => {
  console.log(2, name);
});

hook.call("zhufeng");
