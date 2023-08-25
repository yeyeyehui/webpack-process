const { SyncLoopHook } = require("tapable");

// 同步遇到某个不返回undefined的监听函数，就重复执行
const hook = new SyncLoopHook(["name", "age"]);

let counter1 = 0;
let counter2 = 0;
let counter3 = 0;

hook.tap("1", () => {
  console.log(1, "counter1", counter1);
  if (++counter1 == 1) {
    counter1 = 0;
    return undefined;
  }
  return true;
});

hook.tap("2", () => {
  console.log(2, "counter2", counter2);
  if (++counter2 == 2) {
    counter2 = 0;
    return undefined;
  }
  return true;
});

hook.tap("3", () => {
  console.log(3, "counter3", counter3);
  if (++counter3 == 3) {
    counter3 = 0;
    return undefined;
  }
  return true;
});

hook.call("zhufeng", 12);
// 1 counter1 0
// 2 counter2 0
// 1 counter1 0
// 2 counter2 1
// 3 counter3 0
