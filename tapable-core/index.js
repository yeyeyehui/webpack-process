const SyncHook = require("./SyncHook");

const AsyncParallelHook = require("./AsyncParallelHook");

const AsyncSeriesHook = require("./AsyncSeriesHook");

const HookMap = require("./HookMap");

module.exports = {
  SyncHook, // 同步
  AsyncParallelHook, // 异步并行
  AsyncSeriesHook, // 异步串行
  HookMap, // 钩子循环
};
