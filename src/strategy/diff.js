/**
 * ------------------------------------------------------------
 * diff 对比新旧两个虚拟DOM树,根据directive中的diff方法为新虚拟DOM树
 * 添加change, afterChange更新钩子
 * ------------------------------------------------------------
 */
var emptyArr = []
// 防止被引用
var emptyObj = function () {
    return {
        children: [], props: {}
    }
}
var directives = avalon.directives
var rbinding = /^ms-(\w+)-?(.*)/

function diff(copys, sources) {
    for (var i = 0; i < copys.length; i++) {
        var copy = copys[i]
        var src = sources[i] || emptyObj()

        switch (copy.nodeType) {
            case 3:
                if (copy.dynamic) {
                    directives.expr.diff(copy, src)
                }
                break
            case 8:
                if (copy.dynamic === 'for') {//比较循环区域的元素位置
                    directives['for'].diff(copy, src, copys, sources, i)
                } else if (src.afterChange) {
                    execHooks(src, src.afterChange)
                }
                break
            case 1:
                if (copy.order) {
                    diffProps(copys[i], sources[i], copys, sources, i)
                }
                copy = copys[i]
                src = sources[i]
                if (copy.nodeType === 1 && !copy.skipContent && !copy.isVoidTag) {
                    diff(copy.children, src && src.children || [])
                }
                if (src && src.afterChange) {
                    execHooks(src, src.afterChange)
                }
                break
            default:
                if (Array.isArray(copy)) {
                    diff(copy, src)//比较循环区域的内容
                }
                break
        }
    }
}

function execHooks(el, hooks) {
    if (hooks.length) {
        for (var hook, i = 0; hook = hooks[i++]; ) {
            hook(el.dom, el)
        }
    }
    delete el.afterChange
}

function diffProps(copy, source, copys, sources, index) {
    var order = copy.order
    if (order) {
        var directiveType
        try {
            order.replace(avalon.rword, function (name) {
                var match = name.match(rbinding)
                var type = match && match[1]
                directiveType = type
                if (directives[type]) {
                    directives[type].diff(copy, source || emptyObj(), name, copys, sources, index)
                }
                if (copy.order !== order) {
                    throw 'break'
                }
            })

        } catch (e) {
            if (e !== 'break') {
                avalon.warn(directiveType, e, e.stack || e.message, 'diffProps error')
            } else {
                diffProps(copy, source, copys, sources, index)
            }
        }
    }
}
avalon.diffProps = diffProps
module.exports = diff
/*
 VstartComment, [VtemplateNode], VendComment
 startComment, templateNode, endComment
 
 arr.length = 2
 
 VstartComment, [VtemplateNode,VplaceHode, VtemplateNode,VplaceHode], VendComment
 startComment, templateNode, placeHode, templateNode, placeHode, endComment
 */