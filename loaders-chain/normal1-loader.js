function loader(sourceCode) {
  console.log("normal1");

  const callback = this.async();

  // 异步
  setTimeout(() => {
    callback(null, sourceCode + "//normal1");
  }, 3000);

  //return sourceCode+'//normal1'
}

loader.pitch = function () {
  this.data.age = 18;
  console.log("normal1-pitch");
  //return 'normal1-pitch';
};

// 决定将传入的参数转换为 buffer
// loader.raw = true;

module.exports = loader;
