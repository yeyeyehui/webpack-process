function loader(sourceCode) {
  console.log("pre2");

  // 获取loader配置项options
  let options = this.getOptions();
  console.log(options);

//   需要处理的文件的路径，源文件路径
  let resourcePath = this.resourcePath;

  let resourceQuery = this.resourceQuery;

  let resource = this.resource;
  
  console.log(resourcePath, "resourcePath");
  console.log(resourceQuery, "resourceQuery");
  console.log(resource, "resource");

  return sourceCode + "//pre2";
}

loader.pitch = function () {
  console.log("pre2-pitch");
};

module.exports = loader;
