//const {AsyncParallelHook} = require('tapable');
const { AsyncParallelHook } = require("../tapable-core");

const hook = new AsyncParallelHook(["name", "age"]);

console.time("cost");

hook.tapPromise("1", (name, age) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(1, name, age);
      resolve();
    }, 1000);
  });
});

hook.tapPromise("2", (name, age) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(2, name, age);
      resolve();
    }, 2000);
  });
});

hook.tapPromise("3", (name, age) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(3, name, age);
      resolve();
    }, 3000);
  });
});

debugger;
hook.promise("zhufeng", 12).then(() => {
  console.timeEnd("cost");
});
