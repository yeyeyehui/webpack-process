const { writeFileSync } = require("fs");

// 获取webpack配置
const config = require("../webpack.config");

// 执行webpack核心方法,使用配置文件创建一个webpack编译器实例
const compiler = require("./webpackCore")(config);

// 执行对象的 run 方法开始执行编译
compiler.run((err, stats) => {
  console.log("====================================");

  console.log(
    stats.toJson({
      modules: true, //每个文件都是一个模块
      chunks: true, //打印所有的代码块，模块的集合会成一个代码块
      assets: true, //输出的文件列表
    })
  );

  console.log("====================================");

  console.log(err);

  // 将构建统计数据转换为JSON字符串，包括模块、代码块和资源信息
  let statsString = JSON.stringify(
    stats.toJson({
      modules: true, //每个文件都是一个模块
      chunks: true, //打印所有的代码块，模块的集合会成一个代码块
      assets: true, //输出的文件列表
    })
  );

  // 将统计数据字符串写入文件myStats.json，用于分析构建过程
  writeFileSync("./myStats.json", statsString);
});
