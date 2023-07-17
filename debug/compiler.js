// 引入path模块，用于处理文件和目录路径
const path = require("path");

// 引入Node.js的文件系统模块，用于操作文件
const fs = require("fs");

// 订阅发布插件，实现plugins的核心插件
const { SyncHook } = require("tapable");

// 引入自定义的Complication模块
const Complication = require("./complication");

// 这里是存储webpack核心方法的地方，方法层
class Compiler {
  constructor(options) {
    // 配置
    this.options = options;

    // 生命周期钩子函数
    this.hooks = {
      // 创建同步钩子，会在开始编译的时候触发的钩子
      run: new SyncHook(),

      // 创建同步钩子，会在结束编译的时候触发的钩子
      done: new SyncHook(),
    };
  }

  // run启动webpack编译方法，接收一个回调函数callback
  run(callback) {

    // 调用run钩子
    this.hooks.run.call();

    // 定义onCompiled回调函数，用于处理编译结果
    const onCompiled = (err, stats, fileDependencies) => {
      // 获取编译生成的资源
      const { assets } = stats;

      // 遍历资源，将资源写入输出目录
      for (let filename in assets) {
        // 获取输出文件的绝对路径，path.posix跨平台路径，win\, mac是/
        let filePath = path.posix.join(this.options.output.path, filename);

        fs.writeFileSync(filePath, assets[filename], "utf-8");
      }

      // 这里调用compiler.run的回调
      callback(err, {
        toJson: () => stats,
      });

      // fileDependencies指的是本次打包涉及哪些文件
      // 监听这些文件的变化，当文件发生变化，重新开启一个新的编译
      [...fileDependencies].forEach((file) => {
        fs.watch(file, () => this.compile(onCompiled));
      });
    };

    // 开始一次新的编译
    this.compile(onCompiled);

    // 调用done钩子
    this.hooks.done.call();
  }

  // 编译方法，可以多次调用
  compile(onCompiled) {
    // 拿到完整的配置，创建Complication实例
    const complication = new Complication(this.options);

    // 调用Complication的build方法开始构建，将处理好的chunk，modules,assets等参数传递给onCompiled回调
    complication.build(onCompiled);
  }
}

module.exports = Compiler;
