const { AsyncParallelBailHook } = require("tapable");

const hook = new AsyncParallelBailHook(["name", "age"]);

console.time("cost");
// 有返回值结束执行，并行
hook.tapAsync("1", (name, age, callback) => {
  setTimeout(() => {
    console.log(1, name, age);
    callback();
  }, 1000);
});

hook.tapAsync("2", (name, age, callback) => {
  setTimeout(() => {
    console.log(2, name, age);
    callback(null, "结果2");
  }, 2000);
});

hook.tapAsync("3", (name, age, callback) => {
  setTimeout(() => {
    console.log(3, name, age);
    callback();
  }, 3000);
});

hook.callAsync("zhufeng", 12, () => {
  console.timeEnd("cost");
});
