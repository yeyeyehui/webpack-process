const Hook = require("./Hook");

const HookCodeFactory = require("./HookCodeFactory");

//生产代码的工厂
class AsyncSeriesHookCodeFactory extends HookCodeFactory {
  // AOP,在这里主要是为了区分同步，异步串行和异步并行
  content({ onDone }) {
    // 异步串行
    return this.callTapsSeries({ onDone });
  }
}

//创建工厂的实例
const factory = new AsyncSeriesHookCodeFactory();

class AsyncSeriesHook extends Hook {
  compile(options) {
    //通过代码工厂创建函数
    //初始化工厂
    factory.setup(this, options);

    //调用代码工厂创建函数
    return factory.create(options);
  }
}

module.exports = AsyncSeriesHook;
