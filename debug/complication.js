// 导入Node.js内置的path模块，用于处理文件路径
const path = require("path");

// 导入Node.js内置的fs模块，用于操作文件系统
const fs = require("fs");

// 导入babel-types库，用于处理AST节点
const types = require("babel-types");

// 导入@babel/parser库，用于将源代码解析成抽象语法树（AST）
const parser = require("@babel/parser");

// 导入@babel/traverse库，用于遍历和操作AST
const traverse = require("@babel/traverse").default;

// 导入@babel/generator库，用于将修改过的AST重新生成源代码
const generator = require("@babel/generator").default;

// 定义toUnixSeq函数，将Windows风格的文件路径转换为Unix风格
function toUnixSeq(filePath) {
  // 使用正则表达式替换所有的反斜杠（\）为正斜杠（/）
  return filePath.replace(/\\/g, "/");
}

// 创建模块环境，就是这里生成modules对象和模块作用域
function getSourceCode(chunk) {
  return `
  (() => {
    var modules = {
      ${chunk.modules
        .filter((module) => module.id !== chunk.entryModule.id)
        .map(
          (module) => `
            "${module.id}": module => {
               ${module._source}
              }
            `
        )}  
    };
    var cache = {};
    function require(moduleId) {
      var cachedModule = cache[moduleId];
      if (cachedModule !== undefined) {
        return cachedModule.exports;
      }
      var module = cache[moduleId] = {
        exports: {}
      };
      modules[moduleId](module, module.exports, require);
      return module.exports;
    }
    var exports = {};
    (() => {
      ${chunk.entryModule._source}
    })();
  })();
  `;
}

//  定义tryExtensions函数，用于尝试不同的文件扩展名，找到对应的模块文件
function tryExtensions(modulePath, extensions) {
  // 如果此绝对路径上的文件是真实存在的，直接返回
  if (fs.existsSync(modulePath)) {
    return modulePath;
  }

  // 遍历所有提供的扩展名
  for (let i = 0; i < extensions.length; i++) {
    // 生成一个新的文件路径，将扩展名添加到原始路径后
    let filePath = modulePath + extensions[i];

    // 如果新路径的文件存在，则返回该路径
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  throw new Error(`模块${modulePath}未找到`);
}

// 定义Complication类，用于处理编译过程，数据层
class Complication {
  constructor(options) {
    // webpack配置 + shell配置
    this.options = options;

    // 项目的根目录
    this.options.context = this.options.context || toUnixSeq(process.cwd());

    // 初始化一个Set，用于存储文件依赖，避免重复添加
    this.fileDependencies = new Set();

    // 初始化一个数组，用于存储模块信息
    this.modules = [];

    // 初始化一个数组，用于存储代码块信息
    this.chunks = [];

    // 初始化一个空对象，用于存储输出文件的资源信息
    this.assets = {};
  }

  build(onCompiled) {
    // 定义一个空对象，用于存储入口信息
    let entry = {};

    // 判断options.entry的类型
    if (typeof this.options.entry === "string") {
      // 如果是字符串类型，将其作为默认入口文件，将main作为键名
      entry.main = this.options.entry;
    } else {
      // 否则直接使用options.entry作为入口信息
      entry = this.options.entry;
    }

    // 遍历entry对象，处理每个入口文件
    for (let entryName in entry) {
      // 获取入口文件的完整路径
      let entryFilePath = path.posix.join(
        this.options.context,
        entry[entryName]
      );

      // 添加入口文件路径到文件依赖集合
      this.fileDependencies.add(entryFilePath);

      //从入口文件发出，开始编译模块，通过ast编译获取源码内容
      let entryModule = this.buildModule(entryName, entryFilePath);

      // 创建一个chunk对象，包含名称、入口模块和与该入口关联的模块
      // 根据入口和模块之间的依赖关系，组装成一个个包含多个模块的 Chunk
      let chunk = {
        name: entryName, // 入口的名称
        entryModule, // 入口的模块 ./src/entry1.js
        modules: this.modules.filter((module) =>
          module.names.includes(entryName)
        ), // 此入口对应的模块
      };

      // 将chunk对象添加到chunks数组
      this.chunks.push(chunk);
    }

    // 遍历chunks数组，为每个chunk生成输出文件
    this.chunks.forEach((chunk) => {
      // 替换输出文件名模板中的[name]为chunk名称
      let outputFilename = this.options.output.filename.replace(
        "[name]",
        chunk.name
      );

      // 调用getSourceCode方法获取chunk的源码，将其添加到assets对象
      this.assets[outputFilename] = getSourceCode(chunk);
    });

    // 调用onCompiled回调函数，传入构建结果
    onCompiled(
      null,
      {
        modules: this.modules,
        chunks: this.chunks,
        assets: this.assets,
      },
      this.fileDependencies
    );
  }

  /**
   *
   * @param {*} name 入口的名称 main,entry1,entry2
   * @param {*} modulePath 入口模块的文件的绝对路径
   */
  buildModule(entryName, modulePath) {
    // 读取模块文件的原始源代码
    let rawSourceCode = fs.readFileSync(modulePath, "utf8");

    // 获取loader的配置规则
    let { rules } = this.options.module;

    // 定义一个空数组，用于存储模块加载器
    let loaders = [];

    // 遍历规则，根据匹配的规则将加载器添加到loaders数组中
    rules.forEach((rule) => {
      if (modulePath.match(rule.test)) {
        loaders.push(...rule.use);
      }
    });

    // 使用reduceRight逐个应用加载器，将原始源代码转换为处理后的源代码
    // 从右往左执行loader
    let transformedSourceCode = loaders.reduceRight(
      (sourceCode, loaderPath) => {
        // 加载loader
        const loaderFn = require(loaderPath);

        // 代码传递给loader处理
        return loaderFn(sourceCode);
      },
      rawSourceCode // 原始源代码
    );

    // 生成模块ID（相对路径）
    let moduleId = "./" + path.posix.relative(this.options.context, modulePath);

    // 创建模块对象
    let module = { id: moduleId, names: [entryName], dependencies: new Set() };

    // 将模块对象添加到模块数组中
    this.modules.push(module);

    // 使用@babel/parser解析处理后的源代码，生成AST（抽象语法树）
    // 再找出该模块依赖的模块，再递归本步骤直到所有入口依赖的文件都经过了本步骤的处理
    let ast = parser.parse(transformedSourceCode, { sourceType: "module" });

    // 使用@babel/traverse遍历AST，处理require调用
    traverse(ast, {
      CallExpression: ({ node }) => {
        //如果调用的方法名是require的话，说明就要依赖一个其它模块
        if (node.callee.name === "require") {
          // .代表当前的模块所有的目录，不是工作目录
          let depModuleName = node.arguments[0].value; // ./title

          //获取当前的模块所在的目录 C:\7.flow\src
          let dirName = path.posix.dirname(modulePath);

          // C:/7.flow/src/title
          let depModulePath = path.posix.join(dirName, depModuleName);
          let { extensions } = this.options.resolve;

          //尝试添加扩展名找到真正的模块路径
          depModulePath = tryExtensions(depModulePath, extensions);

          //把依赖的模块路径添加到文件依赖列表
          this.fileDependencies.add(depModulePath);

          //获取此模块的ID,也就相对于根目录的相对路径
          let depModuleId =
            "./" + path.posix.relative(this.options.context, depModulePath);

          //修改语法树，把引入模块路径改为模块的ID
          node.arguments[0] = types.stringLiteral(depModuleId);

          //node.arguments [ { type: 'StringLiteral', value: './src/title.js' } ]
          //给当前的entry1模块添加依赖信息
          module.dependencies.add({ depModuleId, depModulePath });
        }
      },
    });

    // 使用@babel/generator将AST转换回源代码
    const { code } = generator(ast);

    // 将生成的源代码添加到模块对象中
    module._source = code;

    // 处理模块依赖
    [...module.dependencies].forEach(({ depModuleId, depModulePath }) => {
      // 判断此模块是否已经编译过了，如果编译过了，则不需要重复编译
      let existModule = this.modules.find((item) => item.id === depModuleId);

      if (existModule) {
        // 只需要把新的入口名称添回到模块的names数组里就可以
        existModule.names.push(entryName);
      } else {
        // 继续解析新的模块
        this.buildModule(entryName, depModulePath);
      }
    });
    return module;
  }
}

module.exports = Complication;
