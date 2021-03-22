class Dep{
    constructor() {
        // 通知和手机
        this.sub = [];
    }
    // 收集观察者
    addSub(watcher){
        this.sub.push(watcher);
    }
    // 通知观察者更新
    notify(){
        this.sub.forEach(w=>{
            // 通知观察者
            w.update()
        })
    }

}

class Watcher{
    constructor(vm,expr,cb) {
        this.vm = vm;
        this.expr = expr;
        this.cb = cb;
        this.oldVal = this.getOldVal()
    }
    update(){
        const newVal =  compileUtil.getVal(this.expr, this.vm)
        if (newVal !==this.oldVal){
            this.cb(newVal)
        }

    }
    getOldVal(){
        Dep.target = this
        const oldVal = compileUtil.getVal(this.expr, this.vm)
        Dep.target = null
        return oldVal
    }
}

class Observer {
    constructor(data) {
        this.observer(data)
    }
    observer(data){
        if (data && typeof data ==='object'){
            // 取到所有的 key
            // console.log(Object.keys(data));
            Object.keys(data).forEach(key=>{
                this.definedReactive(data,key,data[key]);
            })

            // 如果还是个对象,要递归遍历

        }
    }
//     劫持方法
    definedReactive(obj,key,value){
        // 递归遍历
        this.observer(value);
        const dep = new Dep();
        // 劫持并监听所有属性
        Object.defineProperty(obj,key,{
            enumerable:true,
            configurable:false,
            get(){
                // 初始化的时候
                // 订阅数据变化 往 dep 中添加观察者
                Dep.target&&dep.addSub(Dep.target);
                return value
            },
            set:(newVal)=>{
                if (newVal !== value){
                    this.observer(newVal);
                    value=newVal
                }
                // 告诉 dep 变化
                dep.notify()
            }
        })
    }
}
