// 这里是把订阅的事件进行存储和前置处理，组合成一个事件对象
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
class Hook {
  constructor(args) {
    //指的是回调函数参数列表数组['name']
    if (!Array.isArray(args)) args = [];

    //保存参数数组
    this.args = args;

    //用来存放所有的回调函数对象
    this.taps = []; //this.taps.map(tap=>tap.fn)

    //此变量刚开始是没有值的，后面会设置为回调函数的数组
    this._x = undefined;

    // 触发同步，发布事件
    this.call = CALL_DELEGATE;

    // 触发异步回调，发布事件
    this.callAsync = CALL_ASYNC_DELEGATE;

    // 触发异步promise，发布事件
    this.promise = PROMISE_DELEGATE;

    //存放拦截器的数组
    this.interceptors = [];
  }

  /**
   * 同步tap
   * 注册事件函数或者说回调函数
   * @param {*} options 可以是一个对象，也可以是字符串,如果是字符串等同于{name:字符串}
   * @param {*} fn
   */
  tap(options, fn) {
    //用tap注册的就是sync类型的tapInfo
    this._tap("sync", options, fn);
  }

  /**
   * 异步回调方式
   * @param {*} options 可以是一个对象，也可以是字符串,如果是字符串等同于{name:字符串}
   * @param {*} fn
   */
  tapAsync(options, fn) {
    this._tap("async", options, fn);
  }

  /**
   * 异步promise方式
   * @param {*} options 可以是一个对象，也可以是字符串,如果是字符串等同于{name:字符串}
   * @param {*} fn
   */
  tapPromise(options, fn) {
    this._tap("promise", options, fn);
  }

  // 对注册的函数进行一些转换和操作
  _tap(type, options, fn) {
    // options.name用来区分方法
    if (typeof options === "string") {
      options = { name: options };
    }

    // { name: '1', type: 'sync', fn: [Function] }
    let tapInfo = { ...options, type, fn };

    //注册拦截器可以用来对tapInfo做一些修改
    tapInfo = this._runRegisterInterceptors(tapInfo);

    this._insert(tapInfo);
  }

  // 拦截器AOP，触发register方法，调用tap方法，注册一个tapInfo都会触发register方法
  _runRegisterInterceptors(tapInfo) {
    for (const interceptor of this.interceptors) {
      if (interceptor.register) {
        // 拦截方法，修改tapInfo信息
        let newTapInfo = interceptor.register(tapInfo);

        // 有返回最新的info就覆盖旧的
        if (newTapInfo) tapInfo = newTapInfo;
      }
    }

    return tapInfo;
  }

  _insert(tapInfo) {
    let before;

    // 稍后
    if (typeof tapInfo.before === "string") {
      before = new Set([tapInfo.before]);
    } else if (Array.isArray(tapInfo.before)) {
      before = new Set(tapInfo.before); //tap3,tap5
    }

    // 稍后
    let stage = 0;
    if (typeof tapInfo.stage === "number") {
      stage = tapInfo.stage; //2
    }

    // 获取订阅的所有回调函数的长度
    let i = this.taps.length; //3 现在有的回调数组长度为3

    //从下往上找，找到第一个比当前要插入的stage小的元素，插到那个元素下面就可以
    while (i > 0) {
      i--;

      // 拿到当前需要处理的订阅事件
      const x = this.taps[i];
      this.taps[i + 1] = x;
      const xStage = x.stage || 0;
      if (before) {
        if (before.has(x.name)) {
          before.delete(x.name);
          continue;
        }
        if (before.size > 0) {
          continue;
        }
      }
      if (xStage > stage) {
        continue;
      }
      i++;
      break;
    }

    this.taps[i] = tapInfo;
    /*  this.taps.push(tapInfo);
        this.taps.sort((a,b)=>(a.stage||0)-(b.stage||0)) */
  }

  // 存储拦截器
  intercept(interceptor) {
    this.interceptors.push(interceptor);
  }

  // 编译方法，需要使用者覆盖
  compile(options) {
    throw new Error(`方法错误，应该被覆盖`);
  }

  // 创建行动，触发编译
  _createCall(type) {
    return this.compile({
      type, //类型 sync async promise
      taps: this.taps, //回调数组
      interceptors: this.interceptors, // 拦截器
      args: this.args, //形参数组
    });
  }
}

/**
 * 这是一个代理的call方法，同步，AOP
 * @param  {...any} args 参数列表，args是一个数组
 * @returns
 */
const CALL_DELEGATE = function (...args) {
  //动态编译出来一个函数赋给this.call new Function()
  this.call = this._createCall("sync");

  //返回this.call的结果
  return this.call(...args);
};

/**
 * 这是一个代理的call方法，回调异步，AOP
 * @param  {...any} args 参数列表，args是一个数组
 * @returns
 */
const CALL_ASYNC_DELEGATE = function (...args) {
  //动态编译出来一个函数赋给this.call new Function()
  this.callAsync = this._createCall("async");

  //返回this.call的结果
  return this.callAsync(...args);
};

/**
 * 这是一个代理的call方法，peomise异步，AOP
 * @param  {...any} args 参数列表，args是一个数组
 * @returns
 */
const PROMISE_DELEGATE = function (...args) {
  //动态编译出来一个函数赋给this.call new Function()
  this.promise = this._createCall("promise");

  //返回this.call的结果
  return this.promise(...args);
};

module.exports = Hook;
