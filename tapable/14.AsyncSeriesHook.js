//const {AsyncSeriesHook} = require('tapable');
const { AsyncSeriesHook } = require("../tapable-core");

const hook = new AsyncSeriesHook(["name", "age"]);

console.time("cost");

hook.tapAsync("1", (name, age, callback) => {
  setTimeout(() => {
    console.log(1, name, age);
    callback();
  }, 1000);
});

hook.tapAsync("2", (name, age, callback) => {
  setTimeout(() => {
    console.log(2, name, age);
    callback(null);
  }, 2000);
});

hook.tapAsync("3", (name, age, callback) => {
  setTimeout(() => {
    console.log(3, name, age);
    callback();
  }, 3000);
});

debugger;

hook.callAsync("zhufeng", 12, () => {
  console.log("====================================");
  console.log("done");
  console.log("====================================");
  console.timeEnd("cost");
});
