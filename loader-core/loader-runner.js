// 引入 url 模块
const url = require("url");

/**运行 Loader
@param {*} options
@param {*} finalCallback // 执行结果回调
*/
function runLoaders(options, finalCallback) {
  const {
    resource, // 资源路径
    loaders = [], // 需要执行的 loader 列表
    context = {}, // 上下文对象
    readResource = fs.readFile.bind(fs),
  } = options;

  let loaderContext = context;

  // 创建loader对象集
  let loaderObjects = loaders.map(createLoaderObject);

  // 定义 resource资源路径 属性
  Object.defineProperty(loaderContext, "resource", {
    get: function () {
      return loaderContext.resourcePath + loaderContext.resourceQuery;
    },
    set: function (value) {
      var splittedResource = url.parse(value);
      loaderContext.resourcePath = splittedResource.pathname;
      loaderContext.resourceQuery = splittedResource.query;
    },
  });

  loaderContext.resource = resource;
  loaderContext.readResource = readResource;
  loaderContext.loaders = loaderObjects;
  loaderContext.loaderIndex = 0;
  loaderContext.callback = null;
  loaderContext.async = null;

  // 定义 request、remainingRequest、currentRequest、previousRequest 和 data 属性
  Object.defineProperty(loaderContext, "request", {
    get() {
      return loaderContext.loaders
        .map((loader) => loader.path)
        .concat(resource)
        .join("!");
    },
  });

  Object.defineProperty(loaderContext, "remainingRequest", {
    get() {
      return loaderContext.loaders
        .slice(loaderContext.loaderIndex + 1)
        .map((loader) => loader.path)
        .concat(resource)
        .join("!");
    },
  });

  Object.defineProperty(loaderContext, "currentRequest", {
    get() {
      return loaderContext.loaders
        .slice(loaderContext.loaderIndex)
        .map((loader) => loader.path)
        .concat(resource)
        .join("!");
    },
  });

  Object.defineProperty(loaderContext, "previousRequest", {
    get() {
      return loaderContext.loaders
        .slice(0, loaderContext.loaderIndex)
        .map((loader) => loader.path)
        .join("!");
    },
  });

  Object.defineProperty(loaderContext, "data", {
    get() {
      return loaderContext.loaders[loaderContext.loaderIndex].data;
    },
  });

  // 定义 processOptions 对象
  let processOptions = {
    resourceBuffer: null,
    readResource,
  };

  // 依次执行 pitching loader 和 normal loader
  iteratePitchingLoaders(processOptions, loaderContext, (err, result) => {
    finalCallback(err, {
      result,
      resourceBuffer: processOptions.resourceBuffer,
    });
  });
}

// 创建 loader 对象的函数
// {
//   path: '/Users/yehui/Desktop/github/webpack-process/loaders-chain/post1-loader.js',
//   query: null,
//   normal: [Function: loader] { pitch: [Function (anonymous)] },
//   pitch: [Function (anonymous)],
//   normalExecuted: false,
//   pitchExecuted: false,
//   data: {},
//   raw: true
// }
function createLoaderObject(loader) {
  // 通过 require 函数加载 loader
  let normal = require(loader);

  // 从 loader 中取出 pitch 函数和 raw 属性
  let pitch = normal.pitch;

  let raw = normal.raw || true;

  // 返回一个包含 loader 相关信息的对象
  const obj = {
    path: null,
    query: null,
    normal,
    pitch,
    normalExecuted: false,
    pitchExecuted: false,
    data: {},
    raw,
  };

  Object.defineProperty(obj, "request", {
    get: function () {
      return obj.path + obj.query;
    },
    set: function (value) {
      const { pathname, query } = url.parse(value);
      obj.path = pathname;
      obj.query = query;
    },
  });

  obj.request = loader;

  return obj;
}

/** 依次执行 pitching loader 和 normal loader
@param {*} processOptions // 资源过程选项，被loader处理后的最新代码
@param {*} loaderContext // loader上下文
*/
function iteratePitchingLoaders(
  processOptions,
  loaderContext,
  pitchingCallback
) {
  // loader pitch执行完毕，开始从右到左执行loader
  if (loaderContext.loaderIndex >= loaderContext.loaders.length) {
    return processResource(processOptions, loaderContext, pitchingCallback);
  }

  // 执行下一个loader pitch
  let currentLoader = loaderContext.loaders[loaderContext.loaderIndex];

  // 当前pitch已经执行过，直接走下一个
  if (currentLoader.pitchExecuted) {
    loaderContext.loaderIndex++;
    return iteratePitchingLoaders(
      processOptions,
      loaderContext,
      pitchingCallback
    );
  }

  let fn = currentLoader.pitch;

  // 记录pith执行完毕
  currentLoader.pitchExecuted = true;

  // 没有pitch执行走下一步
  if (!fn) {
    return iteratePitchingLoaders(
      processOptions,
      loaderContext,
      pitchingCallback
    );
  }

  // 执行pitch函数
  runSyncOrAsync(
    fn,
    loaderContext,
    [
      loaderContext.remainingRequest,
      loaderContext.previousRequest,
      loaderContext.data,
    ],
    (err, ...args) => {
      // 判断走loader pitch还是loader normal
      if (args.length > 0 && args.some((item) => item)) {
        loaderContext.loaderIndex--;
        return iterateNormalLoaders(
          processOptions,
          loaderContext,
          args,
          pitchingCallback
        );
      } else {
        return iteratePitchingLoaders(
          processOptions,
          loaderContext,
          pitchingCallback
        );
      }
    }
  );
}

// 处理资源文件的函数，pitch执行完毕开始执行normal loader
function processResource(processOptions, loaderContext, pitchingCallback) {
  // 读取资源文件的内容，存入 processOptions.resourceBuffer 中
  processOptions.readResource(
    loaderContext.resourcePath,
    (err, resourceBuffer) => {
      processOptions.resourceBuffer = resourceBuffer;
      // 向前遍历 loader 数组，然后开始迭代执行 normal loader
      loaderContext.loaderIndex--;
      iterateNormalLoaders(
        processOptions,
        loaderContext,
        [resourceBuffer],
        pitchingCallback
      );
    }
  );
}

// 迭代执行 normal loader 的函数
function iterateNormalLoaders(
  processOptions,
  loaderContext,
  args,
  pitchingCallback
) {
  // 如果已经遍历完所有的 normal loader，则调用 pitchingCallback 函数，流程走完
  if (loaderContext.loaderIndex < 0) {
    return pitchingCallback(null, args);
  }

  // 取出当前要执行的 loader 对象
  let currentLoader = loaderContext.loaders[loaderContext.loaderIndex];

  // 如果当前 loader 已经执行过 normal 函数，则向前遍历 loader 数组
  if (currentLoader.normalExecuted) {
    loaderContext.loaderIndex--;
    return iterateNormalLoaders(
      processOptions,
      loaderContext,
      args,
      pitchingCallback
    );
  }

  // 取出 normal 函数并标记当前 loader 已经执行过 normal 函数
  let fn = currentLoader.normal;

  currentLoader.normalExecuted = true;

  // 根据 loader 的 raw 属性将传入的参数转换为 buffer 类型或者 string 类型
  // convertArgs(args, currentLoader.raw);

  // 执行 normal 函数，将返回值传入下一次迭代
  runSyncOrAsync(fn, loaderContext, args, (err, ...returnArgs) => {
    return iterateNormalLoaders(
      processOptions,
      loaderContext,
      returnArgs,
      pitchingCallback
    );
  });
}

// 将 loader 函数的参数转换为 buffer 类型或者 string 类型
function convertArgs(args, raw) {
  if (raw && !Buffer.isBuffer(args[0])) {
    args[0] = Buffer.from(args[0]);
  } else if (!raw && Buffer.isBuffer(args[0])) {
    args[0] = args[0].toString("utf-8");
  }
}

// 处理异步函数
function runSyncOrAsync(fn, loaderContext, args, runCallback) {
  // 异步开始
  let isSync = true;

  // 回调函数的调用
  loaderContext.callback = (err, ...args) => {
    runCallback(err, ...args);
  };

  // 异步结束
  loaderContext.async = () => {
    isSync = false;

    // 返回回调提供调用
    return loaderContext.callback;
  };

  // 当前上下文对象
  let result = fn.apply(loaderContext, args)
  
  if (isSync) {
    runCallback(null, result);
  }
}

exports.runLoaders = runLoaders;
