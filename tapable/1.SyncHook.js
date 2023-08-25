const { SyncHook } = require("../tapable-core");

const hook = new SyncHook(["name", "age"]);

// 触发全部的订阅事件
hook.tap("1", (name, age) => {
  console.log(1, name, age);
});

hook.tap("2", (name, age) => {
  console.log(2, name, age);
});

hook.tap("3", (name, age) => {
  console.log(3, name, age);
});

hook.call("zhufeng", 12);
