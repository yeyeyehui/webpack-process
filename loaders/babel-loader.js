const babel = require("@babel/core");

// 手写一个loader
function loader(sourceCode, inputSourceMap, inputAst) {
  //正在处理的文件绝对路径  C:\aproject\zhufengwebpack20230305\8.loader\src\index.js
  const filename = this.resourcePath;

  // 获取配置的参数，获取loader选项
  // { presets: [ '@babel/preset-env' ] }
  const useOptions = this.getOptions();

  const options = {
    filename, // 配置Babel的filename选项
    inputSourceMap, //指定输入代码的sourcemap
    sourceMaps: true, //表示是否要生成sourcemap
    sourceFileName: filename, //指定编译 后的文件所属的文件名
    ast: true, //是否生成ast
    ...useOptions, // 将loader选项和Babel选项合并
  };

  //.babelrc babel.config.js
  // 加载Babel的配置
  const config = babel.loadPartialConfig(options);

  if (config) {
    // 使用Babel转换代码
    babel.transformAsync(sourceCode, config.options, (err, result) => {
      console.log(result);

      // code 转译后的代码
      // map sourcemap映射文件
      // ast 抽象语法树
      // 调用Webpack提供的callback返回转换后的代码
      this.callback(null, result.code, result.map, result.ast);

      return;

      // return result.code;
    });
  }

  return sourceCode;
}

module.exports = loader;

/**
 * babel-loader只是提供一个转换函数，但是它并不知道要干啥要转啥
 * @babel/core 负责把源代码转成AST，然后遍历AST，然后重新生成新的代码
 * 但是它并不知道如何转换语换法，它并不认识箭头函数，也不知道如何转换
 * @babel/transform-arrow-functions 插件其实是一个访问器，它知道如何转换AST语法树
 * 因为要转换的语法太多，插件也太多。所以可一堆插件打包大一起，成为预设preset-env
 */
