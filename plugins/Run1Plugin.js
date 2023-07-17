class RunPlugin {
  apply(compiler) {
    compiler.hooks.run.tap("RunPlugin", () => {
      console.log("run1 开始编译");
    });
  }
}

module.exports = RunPlugin;
