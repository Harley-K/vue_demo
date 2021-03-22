const compileUtil = {
    getVal(expr,vm){
        return  expr.split('.').reduce((data,current)=>{
            return data[current]
        },vm.$data)
    },
    getContentVal(expr,vm){
        return expr.replace(/{{(.+?)}}/g,(...args)=>{

            return this.getVal(args[1],vm)
        })
    },
    setVal(expr,vm,newVal){
        return  expr.split('.').reduce((data,current)=>{
            data[current] = newVal
        },vm.$data)
    },
    text(node,expr,vm){
        let value;
        if (expr.indexOf('{{')!==-1){
            // 处理花括号
            value = expr.replace(/{{(.+?)}}/g,(...args)=>{
                // console.log(args)
                // console.log(vm)
                //绑定观察者,数据发生变化的时候,触发回调进行更新
                new Watcher(vm,args[1],(newVal)=>{
                    this.updater.textUpdater(node,this.getContentVal(expr,vm));
                })
                return this.getVal(args[1],vm)
            })
        }else{

            value = this.getVal(expr,vm)
            new Watcher(vm,expr,(newVal)=>{
                this.updater.textUpdater(node,newVal);
            })
            // console.log(expr)
            // expr :msg
        }
        this.updater.textUpdater(node,value)

    },
    html(node,expr,vm){
        const value = this.getVal(expr,vm)
        new Watcher(vm,expr,(newVal)=>{
            this.updater.htmlUpdater(node,newVal);
        })
        this.updater.htmlUpdater(node,value)
    },
    model(node,expr,vm){
        // 数据
        const value = this.getVal(expr,vm)
        // 绑定更新函数
        new Watcher(vm,expr,(newVal)=>{
            this.updater.modelUpdater(node,newVal);
        })
        // 视图=>数据
        node.addEventListener('input',e=>{
            // 设置值

            this.setVal(expr,vm,e.target.value)
        })
        this.updater.modelUpdater(node,value)
    },
    on(node,expr,vm,eventName){
        // console.log(node,expr,eventName)
        // console.log(vm.$options.methods)
        const fn = vm.$options.methods&&vm.$options.methods[expr];
        node.addEventListener(eventName,fn.bind(vm),false);
    },
    // 更新函数
    updater:{
        textUpdater(node,value){
            node.textContent = value;
        },
        htmlUpdater(node,value){
            node.innerHTML=value
        },
        modelUpdater(node,value){
            node.value = value
        }
    }
}

class Compile{
    constructor(el,vm) {
        this.el = this.isElementNode(el)?el:document.querySelector(el);
        this.vm = vm
        // 获取文档碎片对象,放入内存中
        const  fragment= this.node2Fragment(this.el);
        // 编译模板
        this.compile(fragment)

        // 追加子元素到根元素
        this.el.appendChild(fragment);
    }
    compile(fragment){
        // 获取子节点
        const childNodes = fragment.childNodes;
        [...childNodes].forEach(child=>{
            if (this.isElementNode(child)){
                // 是元素节点 => 编译元素节点
                // console.log('元素节点',child)
                this.compileElement(child)
            }else{
                // 文本节点 => 编译文本节点
                // console.log('文本节点',child)
                this.compileText(child)

            }
            if (child.childNodes&& child.childNodes.length){
                this.compile(child);
            }
        })
    }
    compileElement(node){
        const attributes = node.attributes;
        [...attributes].forEach(attr=>{
            const {name,value}  = attr;
            // console.log(name,value)
            //判断是不是一个指令
            if (this.isDirective(name)){
                // console.log(name)
                const [,dirctive]=name.split('-');
                const [dirName,eventName] = dirctive.split(':');
                compileUtil[dirName](node,value,this.vm,eventName);
            //  删除有指令的标签
                node.removeAttribute('v-'+dirctive)
            }else if(this.isEventName(name)){
                // 处理缩写
                let [,eventName] = name.split('@')
                compileUtil['on'](node,value,this.vm,eventName);
            }
        })
    }
    compileText(node){
        const content = node.textContent;
        if(/{{(.+?)}}/.test(content)){
            console.log(content)
        //    处理文本
            compileUtil['text'](node,content,this.vm)
        }
    }
    isEventName(attr){
        return attr.startsWith('@');
    }
    isElementNode(node){
        return node.nodeType===1
    }
    isDirective(attr){
        return attr.startsWith('v-');
    }
    node2Fragment(el){
        //获取所有子节点
        let firstChild;

        // 创建文档碎片
        const framgment = document.createDocumentFragment();

        while( firstChild = el.firstChild){
            /*
            * 这个语句进行了2个操作：
            *   执行赋值操作firstChild=el.firstChild
            *   执行while(firstChild)，
            * while是条件为真的情况下才执行，也就是必须el.firstChild有值的情况下才执行
            * 当判定while(firstChild)为真的情况执行fragment.appendChild(firstChild);
            * 把el.firstChild即el.children[0]抽出插入到fragment。注意这个操作是movedom，el.children[0]被抽出，
            * 在下次while循环执行firstChild=el.firstChild时读取的是相对本次循环的el.children[1]以此达到循环转移dom的目的
            * */
            framgment.appendChild(firstChild)
        }
        return framgment


    }
}


class MyVue{
    constructor(options) {
        this.$el = options.el
        this.$data = options.data
        this.$options = options
        if (this.$el){
            // 实现一个观察者
            new Observer(this.$data);
            // 实现一个编译器
            new Compile(this.$el,this)
            this.proxyData(this.$data)
        }
    }
    proxyData(data){
        for (const key in data){
            Object.defineProperty(this,key,{
                enumerable:true,
                configurable:false,
                get(){
                    return  data[key]
                },
                set(val){
                    data[key] = val
                }
            })
        }
    }
}

