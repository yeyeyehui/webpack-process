// 这里是拿到处理好的订阅事件进行同步，异步等操作
class HookCodeFactory {
  /**
   * 初始化hook代码工厂
   * @param {*} hookInstance hook实例
   * @param {*} options 选项 type args taps
   */
  setup(hookInstance, options) {
    //把回调函数全部取出来变成数组赋给_x
    hookInstance._x = options.taps.map((item) => item.fn);
  }

  /**
   * 创建函数，这里判断同步还是异步，不同方式不同处理
   * @param {*} hookInstance hook实例
   * @param {*} options 选项 type args taps
   */
  create(options) {
    // 初始化，存储options
    this.init(options);

    let fn;

    // 判断同步还是回调异步还是promise异步
    switch (options.type) {
      case "sync":
        fn = new Function(
          this.args(), // 函数参数，name,age
          this.header() + this.content() // 函数执行内容，header：作用域和拦截器。content各种hooks覆盖的方法
        );
        break;
      case "async":
        fn = new Function(
          this.args({ after: "_callback" }),
          this.header() + this.content({ onDone: () => `_callback();` })
        );
        break;
      case "promise":
        let tapsContent = this.content({ onDone: () => `_resolve();` });
        let content = `
                    return new Promise(function (_resolve, _reject) {
                        ${tapsContent}
                    });
                    `;
        fn = new Function(this.args(), this.header() + content);
      default:
        break;
    }
    return fn;
  }

  // 存储options
  init(options) {
    //把选项对象保存到工厂的options属性上
    this.options = options;
  }

  // 创建的函数形参
  // return 'before,name,age,after'
  args(options = {}) {
    const { before, after } = options;

    // 获取原来的形参数组['name','age']
    let allArgs = this.options.args;

    // 添加前置形参
    if (before) {
      allArgs = [before, ...allArgs];
    }

    // 添加后置形参
    if (after) {
      allArgs = [...allArgs, after];
    }

    // 拼接成字符串给new Function当作参数名
    if (allArgs.length > 0) {
      return allArgs.join(", "); // name,age
    }

    return "";
  }

  // 拦截器和作用域代码生成
  header() {
    let code = "";

    // 当前作用域
    code += `var _x = this._x;\n`;

    // 拦截器
    const { interceptors } = this.options;

    if (interceptors.length > 0) {
      code += `var _taps = this.taps;`;
      code += `var _interceptors = this.interceptors;`;
    }

    // 有拦截器，生产触发call的代码，当调用call方法的时候会执行此方法，一次call只会走一次
    for (let i = 0; i < interceptors.length; i++) {
      const interceptor = interceptors[i];
      // _interceptors[0].call(name, age);
      if (interceptor.call) {
        code += `_interceptors[${i}].call(${this.args()});\n`;
      }
    }

    return code;
  }

  // 异步串行和同步执行方法
  callTapsSeries(options = { onDone: () => `` }) {
    // 获取所有的订阅事件
    let { taps = [] } = this.options;

    // 没有形参数组，直接走回调或者promise
    if (taps.length === 0) return options.onDone(); //_callback();

    let code = "";

    let current = options.onDone; //_callback();

    // 订阅事件循环,倒着
    for (let j = taps.length - 1; j >= 0; j--) {
      //j 2 1 0
      const i = j;
      //如果不一样，说是需要包裹
      //不是第一个，并且类型不同同步的话才会为true
      const unroll = current !== options.onDone && taps[i].type !== "sync"; //_callback();

      if (unroll) {
        // var _fn0 = _x[0];
        // _fn0(name, age, function () {
        //   _next0();
        // });
        code += `function _next${i}() {\n`;
        code += current();
        code += ` }`;
        current = () => `_next${i}();`;
      }

      //_next1();
      const done = current;

      // 同步：'var _fn2 = _x[2];\n_fn2(name, age);\n'
      // 异步串行：
      // _fn2(name, age, function () {
      //   _callback();
      // });
      const content = this.callTap(i, { onDone: done });

      current = () => content;
      //onDone: !onResult && done
    }

    code += current();

    return code;
  }

  // 异步并行执行方法
  callTapsParallel({ onDone }) {
    let { taps = [] } = this.options;

    // 获取订阅事件总长度，用于触发onDone事件
    let code = `var _counter = ${taps.length};\n`;

    // 这里创建一个_done函数，用于执行所有订阅事件触发完毕后执行的结束函数
    // 创建一个done方法
    //   var _done = function () {
    //     _callback();
    //   };
    code += `
          var _done = (function() {
            ${onDone()}
          });
        `;

    for (let i = 0; i < taps.length; i++) {
      const content = this.callTap(i, {});

      code += content;
    }

    return code;
  }

  //var _fn0 = _x[0];
  //_fn0(name, age);
  callTap(tapIndex, { onDone }) {
    let code = "";

    const { interceptors } = this.options;

    // 有拦截器
    if (interceptors.length > 0) {
      code += `var _tap${tapIndex} = _taps[${tapIndex}];\n`;
      for (let i = 0; i < interceptors.length; i++) {
        const interceptor = interceptors[i];
        // 生成拦截器的tap触发代码，当调用钩子的call的方法后，会触发回调函数执行，每个回调函数执行前都会走tap方法
        if (interceptor.tap) {
          // _interceptors[0].tap(_tap0);
          code += `_interceptors[${i}].tap(_tap${tapIndex});\n`;
        }
      }
    }

    // 根据下标在这里拿到需要执行的订阅事件
    // 'var _fn0 = _x[0];\n
    code += `var _fn${tapIndex} = _x[${tapIndex}];\n`;

    // fn:
    // name:'3'
    // type:'sync'
    let tapInfo = this.options.taps[tapIndex];

    // 判断同步还是异步
    switch (tapInfo.type) {
      case "sync":
        // 执行订阅事件
        // _fn0(name, age);\n'
        code += `_fn${tapIndex}(${this.args()});\n`;

        // 执行结束事件
        if (onDone) code += onDone();
        break;
      case "async":
        // _fn0(name, age, function () {
        //   if (--_counter === 0) _done();
        // });
        let cbCode = `(function(){\n`;
        if (onDone) cbCode += onDone(); //_callback(); _next1()
        cbCode += `})`;
        code += `
                _fn${tapIndex}(${this.args({
          after: cbCode,
        })});
                `;
        break;
      case "promise":
        // var _promise0 = _fn0(name, age);
        // _promise0.then(function () {
        //   if (--_counter === 0) _done();
        // });
        code += `
                var _promise${tapIndex} = _fn${tapIndex}(${this.args()});
                _promise${tapIndex}.then(function () {
                  if (--_counter === 0) _done();
                });
                `;
        break;
      default:
        break;
    }
    return code;
  }
}

module.exports = HookCodeFactory;
