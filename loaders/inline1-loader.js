function loader(sourceCode) {
  console.log("inline1");

  console.log(this.data);

  //如果你调用了async函数，必须手工调用它返回callback方法才可以继续向后执行loader
  //const callback = this.async();
  //callback(null,sourceCode+'//inline1');
  return sourceCode + "//inline1";
}

loader.pitch = function () {
  console.log("inline1-pitch");
  //return 'let a = 1;';
};

module.exports = loader;
