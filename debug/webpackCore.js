// webpack核心编译对象
const Compiler = require("./compiler");

function webpack(config) {
  // 初始化参数：从配置文件和 Shell 语句中读取并合并参数,得出最终的配置对象
  const argv = process.argv.slice(2);

  //[0node.exe文件路径,1 执行脚本.js,xxxx]
  const shellOptions = argv.reduce((shellOptions, options) => {
    const [key, value] = options.split("=");
    shellOptions[key.slice(2)] = value;
    return shellOptions;
  }, {});

  // 把脚本参数和配置文件合并
  const finalOptions = { ...config, ...shellOptions };

  // 用上一步得到的参数初始化 Compiler 对象
  const compiler = new Compiler(finalOptions);

  // 加载所有配置的插件
  finalOptions.plugins.forEach((plugin) => {
    plugin.apply(compiler);
  });

  return compiler;
}

module.exports = webpack;
