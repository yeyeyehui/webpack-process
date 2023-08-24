const Hook = require("./Hook");

const HookCodeFactory = require("./HookCodeFactory");

//生产代码的工厂
class SyncHookCodeFactory extends HookCodeFactory {
  // AOP,在这里主要是为了区分同步，异步串行和异步并行
  content() {
    // 同步执行
    return this.callTapsSeries();
  }
}

//创建工厂的实例
const factory = new SyncHookCodeFactory();

// 继承Hook类方法并且覆盖compile函数
// options是这一次事件的全部数据
class SyncHook extends Hook {
  // options: {
  //   type: 'sync',
  //   taps: [
  //     { name: '1', type: 'sync', fn: [Function] },
  //     { name: '2', type: 'sync', fn: [Function] },
  //     { name: '3', type: 'sync', fn: [Function] }
  //   ],
  //   interceptors: [],
  //   args: [ 'name', 'age' ]
  // }
  // 在这里进行订阅事件的触发和执行方式，这里的方式是同步
  compile(options) {
    //通过代码工厂创建函数
    //初始化工厂
    factory.setup(this, options);

    //调用代码工厂创建函数
    return factory.create(options);
  }
}

module.exports = SyncHook;
