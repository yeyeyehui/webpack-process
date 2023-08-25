//const {SyncHook} = require('tapable');
const {SyncHook} = require('../tapable-core');

const syncHook = new SyncHook(["name","age"]);

//注册拦截器对象
syncHook.intercept({
    register(tapInfo){
        console.log(`拦截器1开始register`,tapInfo.name);
        tapInfo.age = 10;
        tapInfo.name = tapInfo.name + 'ext';
        return tapInfo;
    },
    tap(tapInfo){
        console.log(`拦截器1开始tap`,tapInfo.name);
    },
    call(name,age){
        console.log(`拦截器1开始call`,name,age);
    }
})

//注册拦截器对象
syncHook.intercept({
    //每当你调用tap方法，注册一个tapInfo都会触发register方法
    register(tapInfo){
        console.log(`拦截器2开始register`,tapInfo.name);
        tapInfo.age = 20;
        tapInfo.name = tapInfo.name + 'ext';
        return tapInfo;
    },
    //当调用钩子的call的方法后，会触发回调函数执行，每个回调函数执行前都会走tap方法
    tap(tapInfo){
        console.log(`拦截器2开始tap`,tapInfo.name);
    },
    //当调用call方法的时候会执行此方法，一次call只会走一次
    call(name,age){
        console.log(`拦截器2开始call`,name,age);
    }
})

syncHook.tap({name:'回调函数1'},(name,age)=>{
    console.log(`回调函数1`,name,age);
});

syncHook.tap({name:'回调函数2'},(name,age)=>{
    console.log(`回调函数2`,name,age);
});

debugger
syncHook.call('zhufeng',12);
/**
拦截器1开始register 回调函数1
拦截器2开始register 回调函数1
拦截器1开始register 回调函数2
拦截器2开始register 回调函数2
拦截器1开始call zhufeng 12
拦截器2开始call zhufeng 12
拦截器1开始tap 回调函数1
拦截器2开始tap 回调函数1
回调函数1 zhufeng 12
拦截器1开始tap 回调函数2
拦截器2开始tap 回调函数2
回调函数2 zhufeng 12
 */
