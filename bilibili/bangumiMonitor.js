/*
哔哩哔哩番剧监控-lowking-v1.6.1

⚠️注意，如果频繁出现“追番列表数据处理错误❌请带上日志联系作者”这个提示，多半是返回的数据太长，接收不完整破坏了原有json结构
只需在BoxJs配置调小“页大小”，即可解决，建议10
该参数决定每次请求多少个番剧信息，自己平衡

按下面配置完之后，手机哔哩哔哩点击我的-动态，即可获取cookie

************************
Surge 4.2.0+ 脚本配置(其他APP自行转换配置):
************************

[Script]
# > 哔哩哔哩番剧监控
哔哩哔哩番剧监控cookie = type=http-request,pattern=https?:\/\/app.bilibili.com\/x\/v2\/space\/bangumi,script-path=https://raw.githubusercontent.com/lowking/Scripts/master/bilibili/bangumiMonitor.js
哔哩哔哩番剧监控 = type=cron,cronexp="0 0 0,1 * * ?",wake-system=1,script-path=https://raw.githubusercontent.com/lowking/Scripts/master/bilibili/bangumiMonitor.js

[MITM]
hostname = %APPEND% *.bilibili.com
*/
const lk = new ToolKit('哔哩哔哩番剧监控', 'BilibiliBangumiMonitor', {"httpApi": "ffff@10.0.0.19:6166"})
const vmid = lk.getVal('lkVmidBilibiliBangumiMonitor')
const followStatus = lk.getVal('lkBilibiliBangumiFollowStatus', 2)
const bangumiListKey = `lkBilibiliBangumiList${followStatus}`
const pageSize = lk.getVal('lkBilibiliBangumiPageSize', 15)
const limitNo = lk.getVal('lkBilibiliBangumiLimitNo', 10)
const errCountKey = "lkBilibiliBangumiErrCount"
let errCount = lk.getVal(errCountKey, 0)

if (!lk.isExecComm) {
    if (lk.isRequest()) {
        getCookie();
        lk.done();
    } else {
        lk.boxJsJsonBuilder({
            "icons": [
                "https://raw.githubusercontent.com/Orz-3/mini/master/Alpha/bilibili.png",
                "https://raw.githubusercontent.com/Orz-3/mini/master/Color/bilibili.png"
            ],
            "settings": [
                {
                    "id": "lkIsEnableLogBilibiliBangumiMonitor",
                    "name": "开启/关闭日志",
                    "val": true,
                    "type": "boolean",
                    "desc": "默认开启"
                },
                {
                    "id": "lkNotifyOnlyFailBilibiliBangumiMonitor",
                    "name": "只当有番剧更新了才通知",
                    "val": false,
                    "type": "boolean",
                    "desc": "默认关闭"
                },
                {
                    "id": "lkIsEnableTgNotifyBilibiliBangumiMonitor",
                    "name": "开启/关闭Telegram通知",
                    "val": false,
                    "type": "boolean",
                    "desc": "默认关闭"
                },
                {
                    "id": "lkTgNotifyUrlBilibiliBangumiMonitor",
                    "name": "Telegram通知地址",
                    "val": "",
                    "type": "text",
                    "desc": "Tg的通知地址，如：https://api.telegram.org/bot-token/sendMessage?chat_id=-100140&parse_mode=Markdown&text="
                },
                {
                    "id": "lkBilibiliBangumiPageSize",
                    "name": "页大小",
                    "val": 15,
                    "type": "number",
                    "desc": "每次请求番剧数量，避免数据太大导致错误"
                },
                {
                    "id": "lkBilibiliBangumiLimitNo",
                    "name": "番剧异常通知限制数量",
                    "val": 10,
                    "type": "number",
                    "desc": "有时候B站番剧会更新数据，导致大量番剧更新，设置一个数字，番剧更新数量超过这个数字不通知"
                },
                {
                    "id": "lkBilibiliBangumiFollowStatus",
                    "name": "追番筛选",
                    "val": "2",
                    "type": "radios",
                    "items": [
                        {
                            "key": "0",
                            "label": "全部"
                        },
                        {
                            "key": "1",
                            "label": "想看"
                        },
                        {
                            "key": "2",
                            "label": "在看"
                        },
                        {
                            "key": "3",
                            "label": "看过"
                        }
                    ],
                    "desc": "默认-在看"
                }
            ],
            "keys": [
                "lkVmidBilibiliBangumiMonitor",
                "lkBilibiliBangumiList0",
                "lkBilibiliBangumiList1",
                "lkBilibiliBangumiList2",
                "lkBilibiliBangumiList3"
            ]
        }, {
            "author": "@lowking",
            "repo": "https://github.com/lowking/Scripts",
            "script_url": "https://github.com/lowking/Scripts/blob/master/bilibili/bangumiMonitor.js"
        });
        all();
    }
}

function getCookie() {
    const url = $request.url
    if ($request && $request.method != 'OPTIONS' && url.match(/\/x\/v2\/space\/bangumi/)) {
        lk.setVal('lkVmidBilibiliBangumiMonitor', url.split("vmid=")[1].split("&")[0])
        lk.msg(``, `获取Cookie成功🎉`)
    }
}

async function all() {
    if (lk.isEmpty(vmid)) {
        lk.execFail()
        lk.appendNotifyInfo(`请获取Cookie之后再试❌`)
    } else {
        let resultList = []
        let bangumi1List = await getFollowList(1, pageSize, {}, 1)
        let bangumi2List = await getFollowList(1, pageSize, {}, 2)
        resultList = Object.assign(bangumi1List, resultList)
        resultList = Object.assign(bangumi2List, resultList)
        if (!lk.isEmpty(resultList) && Object.keys(resultList).length > 0) {
            await compareDiff(resultList)
        }
    }
    lk.msg(``)
    lk.done()
}

function compareDiff(curList) {
    return new Promise((resolve, reject) => {
        if ((!lk.isEmpty(curList)) && (Object.keys(curList).length > 0)) {
            let storedList = lk.getVal(bangumiListKey)
            lk.setVal(bangumiListKey, curList.s())
            if (lk.isEmpty(storedList)) {
                lk.appendNotifyInfo(`首次运行，已保存追番列表`)
            } else {
                try {
                    storedList = storedList.o()
                    if (Object.keys(storedList).length > 0) {
                        //curList转成对象
                        let curKeyList = []
                        for (let i in curList) {
                            curKeyList.push(i)
                        }
                        let storedKeyList = []
                        for (let i in storedList) {
                            storedKeyList.push(i)
                        }
                        let result = findDifferentElements2(storedKeyList, curKeyList)
                        if (lk.isEmpty(result) || result.length == 0) {
                            if (lk.execStatus) {
                                lk.appendNotifyInfo(`无番剧更新🔉`)
                            }
                        } else {
                            lk.log(`番剧更新如下：`)
                            if (result.length >= limitNo) {
                                lk.log(`番剧更新数量超过限制，不通知`) 
                            } else {
                                for (let i in result) {
                                    lk.execFail()
                                    lk.appendNotifyInfo(`【${curList[result[i]].title}】- ${curList[result[i]].indexShow}`)
                                    lk.log(`【${curList[result[i]].title}】- ${curList[result[i]].indexShow}`)
                                }
                            }
                        }
                    } else {
                        lk.execFail()
                        lk.appendNotifyInfo(`已保存的追番列表无数据，下次运行才有更新提醒⚠️`)
                    }
                } catch (e) {
                    lk.logErr(e)
                    lk.execFail()
                    lk.appendNotifyInfo(`已保存的追番列表数据格式错误❌，请使用BoxJs手动清空后再试`)
                }
            }
        } else {
            lk.execFail()
            lk.appendNotifyInfo(`未发现番剧更新⚠️`)
        }
        resolve()
    })
}

function findDifferentElements2(array1, array2) {
    // 定义一个空数res组作为返回值的容器，基本操作次数1。
    const res = []
    // 定义一个对象用于装数组一的元素，基本操作次数1。
    const objectA = {}
    // 使用对象的 hash table 存储元素，并且去重。基本操作次数2n。
    for(const ele of array1) { // 取出n个元素n次
        objectA[ele] = undefined // 存入n个元素n次
    }
    // 定义一个对象用于装数组二的元素，基本操作次数1。
    const objectB = {}
    // 使用对象的 hash table 存储元素，并且去重。基本操作次数2n。
    for(const ele of array2){ // 取出n个元素n次
        objectB[ele] = undefined // 存入n个元素n次
    }
    // 使用对象的 hash table 删除相同元素。基本操作次数4n。
    for(const key in objectA){ //取出n个key (n次操作)
        if(key in objectB){ // 基本操作1次 (外层循环n次)
            delete objectB[key] // 基本操作1次 (外层循环n次)
            delete objectA[key] // 基本操作1次 (外层循环n次)（总共是3n 加上n次取key的操作 一共是4n）
        }
    }
    // 将第二个对象剩下来的key push到res容器中，基本操作次数也是3n次(最糟糕的情况)。
    for(const key in objectB){ // 取出n个元素n次(最糟糕的情况)。
        res[res.length] = key // 读取n次length n次，存入n个元素n次，一共2n(最糟糕的情况)。
    }
    // 返回结果，基本操作次数1。
    return res
}

function getFollowList(pn, ps, preList, type) {
    return new Promise((resolve, reject) => {
        let listApi = `https://api.bilibili.com/x/space/bangumi/follow/list?type=#{type}&follow_status=#{followStatus}&pn=#{pn}&ps=#{ps}&vmid=#{vmid}&ts=#{ts}`
        let param = {
            "pn": pn,
            "ps": ps,
            "vmid": vmid,
            "type": type,
            "ts": new Date().getTime(),
            "followStatus": followStatus
        }
        listApi = lk.customReplace(listApi, param)
        lk.log(listApi)
        let url = {
            url: listApi,
            headers: {
                "User-Agent": lk.userAgent
            }
        }
        lk.get(url, async (error, response, data) => {
            let curList = {}
            try {
                lk.log(error)
                if (error) {
                    lk.execFail()
                    lk.appendNotifyInfo(`获取追番列表失败❌请稍后再试`)
                } else {
                    let ret = data.o()
                    if (ret.code == 0) {
                        let list = ret.data.list
                        let total = ret.data.total
                        for (let i in list) {
                            let bangumit = {}
                            let bangumi = list[i]
                            let sessionId = bangumi["season_id"]
                            let newEpId = bangumi["new_ep"].id
                            let title = bangumi.title
                            let indexShow = bangumi["new_ep"]["index_show"]
                            // lk.log(`番剧【${sessionId}-${title}】最新【${newEpId}-${indexShow}】更新时间【${bangumi["new_ep"]["pub_time"]}】`)
                            //记录信息
                            bangumit.sessionId = sessionId
                            bangumit.newEpId = newEpId
                            bangumit.title = title
                            bangumit.indexShow = indexShow
                            //判断是否有效数据，无效数据跳过
                            if (lk.isEmpty(indexShow) || lk.isEmpty(title) || lk.isEmpty(sessionId) || lk.isEmpty(newEpId)) {
                                continue
                            }
                            curList[`${sessionId}${newEpId}`] = bangumit
                        }
                        if (!lk.isEmpty(preList)) {
                            curList = Object.assign(preList, curList)
                        } else {
                            preList = {}
                        }
                        // lk.log(curList.s())
                        // lk.appendNotifyInfo(`${pn}-${ps}-${total}-${preList.length}-${curList.length}`)
                        if (pn * ps < total) {
                            curList = await getFollowList(++pn, ps, curList, type)
                        }
                        lk.setVal(errCountKey, "0")
                    } else {
                        if (errCount >= 5) {
                            lk.execFail()
                            lk.appendNotifyInfo(`❌获取追番列表失败：${ret.message}`)
                            lk.setVal(errCountKey, "0")
                        } else {
                            ++errCount
                            lk.setVal(errCountKey, errCount.s())
                        }
                    }
                }
            } catch (e) {
                lk.logErr(e)
                lk.log(`b站返回数据：${data}`)
                if (errCount >= 5) {
                    lk.execFail()
                    lk.appendNotifyInfo(`追番列表数据处理错误❌请带上日志联系作者`)
                    lk.setVal(errCountKey, "0")
                } else {
                    ++errCount
                    lk.setVal(errCountKey, errCount.s())
                }
            } finally {
                resolve(curList)
            }
        })
    })
}

//ToolKit-start
function ToolKit(scriptName,scriptId,options){class Request{constructor(tk){this.tk=tk}fetch(options,method="GET"){options=typeof options==="string"?{url:options}:options;let fetcher;switch(method){case"PUT":fetcher=this.put;break;case"POST":fetcher=this.post;break;default:fetcher=this.get}const doFetch=new Promise((resolve,reject)=>{fetcher.call(this,options,(error,response,data)=>error?reject(error):resolve({error:error,response:response,data:data}))});const delayFetch=(promise,timeout=5e3)=>{return Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error("请求超时")),timeout))])};return options.timeout>0?delayFetch(doFetch,options.timeout):doFetch}async get(options){return this.fetch.call(this.tk,options)}async post(options){return this.fetch.call(this.tk,options,"POST")}async put(options){return this.fetch.call(this.tk,options,"PUT")}}return new class{constructor(scriptName,scriptId,options){Object.prototype.s=((replacer,space)=>{return JSON.stringify(this,replacer,space)});String.prototype.o=(reviver=>{return JSON.parse(this,reviver)});this.userAgent=`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`;this.prefix=`lk`;this.name=scriptName;this.id=scriptId;this.req=new Request(this);this.data=null;this.dataFile=this.getRealPath(`${this.prefix}${this.id}.dat`);this.boxJsJsonFile=this.getRealPath(`${this.prefix}${this.id}.boxjs.json`);this.options=options;this.isExecComm=false;this.isEnableLog=this.getVal(`${this.prefix}IsEnableLog${this.id}`);this.isEnableLog=this.isEmpty(this.isEnableLog)?true:this.isEnableLog.o();this.isNotifyOnlyFail=this.getVal(`${this.prefix}NotifyOnlyFail${this.id}`);this.isNotifyOnlyFail=this.isEmpty(this.isNotifyOnlyFail)?false:this.isNotifyOnlyFail.o();this.isEnableTgNotify=this.getVal(`${this.prefix}IsEnableTgNotify${this.id}`);this.isEnableTgNotify=this.isEmpty(this.isEnableTgNotify)?false:this.isEnableTgNotify.o();this.tgNotifyUrl=this.getVal(`${this.prefix}TgNotifyUrl${this.id}`);this.isEnableTgNotify=this.isEnableTgNotify?!this.isEmpty(this.tgNotifyUrl):this.isEnableTgNotify;this.costTotalStringKey=`${this.prefix}CostTotalString${this.id}`;this.costTotalString=this.getVal(this.costTotalStringKey);this.costTotalString=this.isEmpty(this.costTotalString)?`0,0`:this.costTotalString.replace('"',"");this.costTotalMs=this.costTotalString.split(",")[0];this.execCount=this.costTotalString.split(",")[1];this.costTotalMs=this.isEmpty(this.costTotalMs)?0:parseInt(this.costTotalMs);this.execCount=this.isEmpty(this.execCount)?0:parseInt(this.execCount);this.logSeparator="\n██";this.now=new Date;this.startTime=this.now.getTime();this.node=(()=>{if(this.isNode()){const request=require("request");return{request:request}}else{return null}})();this.execStatus=true;this.notifyInfo=[];this.boxjsCurSessionKey="chavy_boxjs_cur_sessions";this.boxjsSessionsKey="chavy_boxjs_sessions";this.preTgEscapeCharMapping={"|`|":",backQuote,"};this.finalTgEscapeCharMapping={",backQuote,":"`","%2CbackQuote%2C":"`"};this.tgEscapeCharMapping={_:"\\_","*":"\\*","`":"\\`"};this.tgEscapeCharMappingV2={_:"\\_","*":"\\*","[":"\\[","]":"\\]","(":"\\(",")":"\\)","~":"\\~","`":"\\`",">":"\\>","#":"\\#","+":"\\+","-":"\\-","=":"\\=","|":"\\|","{":"\\{","}":"\\}",".":"\\.","!":"\\!"};this.log(`${this.name}, 开始执行!`);this.execComm()}getRealPath(fileName){if(this.isNode()){let targetPath=process.argv.slice(1,2)[0].split("/");targetPath[targetPath.length-1]=fileName;return targetPath.join("/")}return fileName}async execComm(){if(!this.isNode()){return}this.comm=process.argv.slice(1);if(this.comm[1]!="p"){return}let isHttpApiErr=false;this.isExecComm=true;this.log(`开始执行指令【${this.comm[1]}】=> 发送到其他终端测试脚本！`);if(this.isEmpty(this.options)||this.isEmpty(this.options.httpApi)){this.log(`未设置options，使用默认值`);if(this.isEmpty(this.options)){this.options={}}this.options.httpApi=`ffff@10.0.0.6:6166`}else{if(!/.*?@.*?:[0-9]+/.test(this.options.httpApi)){isHttpApiErr=true;this.log(`❌httpApi格式错误！格式：ffff@3.3.3.18:6166`);this.done()}}if(!isHttpApiErr){this.callApi(this.comm[2])}}callApi(timeout){let fname=this.comm[0];let httpApiHost=this.options.httpApi.split("@")[1];this.log(`获取【${fname}】内容传给【${httpApiHost}】`);let scriptStr="";this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const curDirDataFilePath=this.path.resolve(fname);const rootDirDataFilePath=this.path.resolve(process.cwd(),fname);const isCurDirDataFile=this.fs.existsSync(curDirDataFilePath);const isRootDirDataFile=!isCurDirDataFile&&this.fs.existsSync(rootDirDataFilePath);if(isCurDirDataFile||isRootDirDataFile){const datPath=isCurDirDataFile?curDirDataFilePath:rootDirDataFilePath;try{scriptStr=this.fs.readFileSync(datPath)}catch(e){scriptStr=""}}else{scriptStr=""}let options={url:`http://${httpApiHost}/v1/scripting/evaluate`,headers:{"X-Key":`${this.options.httpApi.split("@")[0]}`},body:{script_text:`${scriptStr}`,mock_type:"cron",timeout:!this.isEmpty(timeout)&&timeout>5?timeout:5},json:true};this.post(options,(_error,_response,_data)=>{this.log(`已将脚本【${fname}】发给【${httpApiHost}】`);this.done()})}boxJsJsonBuilder(info,param){if(!this.isNode()){return}if(!this.isJsonObject(info)||!this.isJsonObject(param)){this.log("构建BoxJsJson传入参数格式错误，请传入json对象");return}let boxjsJsonPath="/Users/lowking/Desktop/Scripts/lowking.boxjs.json";if(param&&param.hasOwnProperty("target_boxjs_json_path")){boxjsJsonPath=param["target_boxjs_json_path"]}if(!this.fs.existsSync(boxjsJsonPath)){return}this.log("using node");let needAppendKeys=["settings","keys"];const domain="https://raw.githubusercontent.com/Orz-3";let boxJsJson={};let scritpUrl="#lk{script_url}";if(param&&param.hasOwnProperty("script_url")){scritpUrl=this.isEmpty(param["script_url"])?"#lk{script_url}":param["script_url"]}boxJsJson.id=`${this.prefix}${this.id}`;boxJsJson.name=this.name;boxJsJson.desc_html=`⚠️使用说明</br>详情【<a href='${scritpUrl}?raw=true'><font class='red--text'>点我查看</font></a>】`;boxJsJson.icons=[`${domain}/mini/master/Alpha/${this.id.toLocaleLowerCase()}.png`,`${domain}/mini/master/Color/${this.id.toLocaleLowerCase()}.png`];boxJsJson.keys=[];boxJsJson.settings=[{id:`${this.prefix}IsEnableLog${this.id}`,name:"开启/关闭日志",val:true,type:"boolean",desc:"默认开启"},{id:`${this.prefix}NotifyOnlyFail${this.id}`,name:"只当执行失败才通知",val:false,type:"boolean",desc:"默认关闭"},{id:`${this.prefix}IsEnableTgNotify${this.id}`,name:"开启/关闭Telegram通知",val:false,type:"boolean",desc:"默认关闭"},{id:`${this.prefix}TgNotifyUrl${this.id}`,name:"Telegram通知地址",val:"",type:"text",desc:"Tg的通知地址，如：https://api.telegram.org/bot-token/sendMessage?chat_id=-100140&parse_mode=Markdown&text="}];boxJsJson.author="#lk{author}";boxJsJson.repo="#lk{repo}";boxJsJson.script=`${scritpUrl}?raw=true`;if(!this.isEmpty(info)){for(let key of needAppendKeys){if(this.isEmpty(info[key])){break}if(key==="settings"){for(let i=0;i<info[key].length;i++){let input=info[key][i];for(let j=0;j<boxJsJson.settings.length;j++){let def=boxJsJson.settings[j];if(input.id===def.id){boxJsJson.settings.splice(j,1)}}}}boxJsJson[key]=boxJsJson[key].concat(info[key]);delete info[key]}}Object.assign(boxJsJson,info);this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const curDirDataFilePath=this.path.resolve(this.boxJsJsonFile);const rootDirDataFilePath=this.path.resolve(process.cwd(),this.boxJsJsonFile);const isCurDirDataFile=this.fs.existsSync(curDirDataFilePath);const isRootDirDataFile=!isCurDirDataFile&&this.fs.existsSync(rootDirDataFilePath);const jsondata=boxJsJson.s(null,"\t");if(isCurDirDataFile){this.fs.writeFileSync(curDirDataFilePath,jsondata)}else if(isRootDirDataFile){this.fs.writeFileSync(rootDirDataFilePath,jsondata)}else{this.fs.writeFileSync(curDirDataFilePath,jsondata)}let boxjsJson=this.fs.readFileSync(boxjsJsonPath).o();if(!(boxjsJson.hasOwnProperty("apps")&&Array.isArray(boxjsJson["apps"])&&boxjsJson["apps"].length>0)){return}let apps=boxjsJson.apps;let targetIdx=apps.indexOf(apps.filter(app=>{return app.id==boxJsJson.id})[0]);if(targetIdx>=0){boxjsJson.apps[targetIdx]=boxJsJson}else{boxjsJson.apps.push(boxJsJson)}let ret=boxjsJson.s(null,2);if(!this.isEmpty(param)){for(const key in param){let val=param[key];if(!val){switch(key){case"author":val="@lowking";break;case"repo":val="https://github.com/lowking/Scripts";break;default:continue}}ret=ret.replace(`#lk{${key}}`,val)}}const regex=/(?:#lk\{)(.+?)(?=\})/;let m=regex.exec(ret);if(m!==null){this.log(`生成BoxJs还有未配置的参数，请参考https://github.com/lowking/Scripts/blob/master/util/example/ToolKitDemo.js#L17-L19传入参数：`)}let loseParamSet=new Set;while((m=regex.exec(ret))!==null){loseParamSet.add(m[1]);ret=ret.replace(`#lk{${m[1]}}`,``)}loseParamSet.forEach(p=>{console.log(`${p} `)});this.fs.writeFileSync(boxjsJsonPath,ret)}isJsonObject(obj){return typeof obj=="object"&&Object.prototype.toString.call(obj).toLowerCase()=="[object object]"&&!obj.length}appendNotifyInfo(info,type){if(type==1){this.notifyInfo=info}else{this.notifyInfo.push(info)}}prependNotifyInfo(info){this.notifyInfo.splice(0,0,info)}execFail(){this.execStatus=false}isRequest(){return typeof $request!="undefined"}isSurge(){return typeof $httpClient!="undefined"}isQuanX(){return typeof $task!="undefined"}isLoon(){return typeof $loon!="undefined"}isJSBox(){return typeof $app!="undefined"&&typeof $http!="undefined"}isStash(){return"undefined"!==typeof $environment&&$environment["stash-version"]}isNode(){return typeof require=="function"&&!this.isJSBox()}sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms))}log(message){if(this.isEnableLog)console.log(`${this.logSeparator}${message}`)}logErr(message){this.execStatus=true;if(this.isEnableLog){console.log(`${this.logSeparator}${this.name}执行异常:`);console.log(message);if(!message.message){return}console.log(`\n${message.message}`)}}replaceUseMap(mapping,message){for(let key in mapping){if(!mapping.hasOwnProperty(key)){continue}message=message.replaceAll(key,mapping[key])}return message}msg(subtitle,message,openUrl,mediaUrl,copyText,autoDismiss){if(!this.isRequest()&&this.isNotifyOnlyFail&&this.execStatus){return}if(this.isEmpty(message)){if(Array.isArray(this.notifyInfo)){message=this.notifyInfo.join("\n")}else{message=this.notifyInfo}}if(this.isEmpty(message)){return}if(this.isEnableTgNotify){this.log(`${this.name}Tg通知开始`);const isMarkdown=this.tgNotifyUrl&&this.tgNotifyUrl.indexOf("parse_mode=Markdown")!=-1;if(isMarkdown){message=this.replaceUseMap(this.preTgEscapeCharMapping,message);let targetMapping=this.tgEscapeCharMapping;if(this.tgNotifyUrl.indexOf("parse_mode=MarkdownV2")!=-1){targetMapping=this.tgEscapeCharMappingV2}message=this.replaceUseMap(targetMapping,message)}message=`📌${this.name}\n${message}`;if(isMarkdown){message=this.replaceUseMap(this.finalTgEscapeCharMapping,message)}let u=`${this.tgNotifyUrl}${encodeURIComponent(message)}`;this.req.get({url:u})}else{let options={};const hasOpenUrl=!this.isEmpty(openUrl);const hasMediaUrl=!this.isEmpty(mediaUrl);const hasCopyText=!this.isEmpty(copyText);const hasAutoDismiss=autoDismiss>0;if(this.isSurge()||this.isLoon()||this.isStash()){if(hasOpenUrl){options["url"]=openUrl;options["action"]="open-url"}if(hasCopyText){options["text"]=copyText;options["action"]="clipboard"}if(this.isSurge()&&hasAutoDismiss){options["auto-dismiss"]=autoDismiss}if(hasMediaUrl){}options["media-url"]=mediaUrl;$notification.post(this.name,subtitle,message,options)}else if(this.isQuanX()){if(hasOpenUrl)options["open-url"]=openUrl;if(hasMediaUrl)options["media-url"]=mediaUrl;$notify(this.name,subtitle,message,options)}else if(this.isNode()){this.log("⭐️"+this.name+"\n"+subtitle+"\n"+message)}else if(this.isJSBox()){$push.schedule({title:this.name,body:subtitle?subtitle+"\n"+message:message})}}}getVal(key,defaultValue){let value;if(this.isSurge()||this.isLoon()||this.isStash()){value=$persistentStore.read(key)}else if(this.isQuanX()){value=$prefs.valueForKey(key)}else if(this.isNode()){this.data=this.loadData();value=process.env[key]||this.data[key]}else{value=this.data&&this.data[key]||null}return!value?defaultValue:value}updateBoxjsSessions(key,val){if(key==this.boxjsSessionsKey){return}const boxJsId=`${this.prefix}${this.id}`;let boxjsCurSession=this.getVal(this.boxjsCurSessionKey,"{}").o();if(!boxjsCurSession.hasOwnProperty(boxJsId)){return}let curSessionId=boxjsCurSession[boxJsId];let boxjsSessions=this.getVal(this.boxjsSessionsKey,"[]").o();if(boxjsSessions.length==0){return}let curSessionDatas=[];boxjsSessions.forEach(session=>{if(session.id==curSessionId){curSessionDatas=session.datas}});if(curSessionDatas.length==0){return}let isExists=false;curSessionDatas.forEach(kv=>{if(kv.key==key){kv.val=val;isExists=true}});if(!isExists){curSessionDatas.push({key:key,val:val})}boxjsSessions.forEach(session=>{if(session.id==curSessionId){session.datas=curSessionDatas}});this.setVal(this.boxjsSessionsKey,boxjsSessions.s())}setVal(key,val){if(this.isSurge()||this.isLoon()||this.isStash()){this.updateBoxjsSessions(key,val);return $persistentStore.write(val,key)}else if(this.isQuanX()){this.updateBoxjsSessions(key,val);return $prefs.setValueForKey(val,key)}else if(this.isNode()){this.data=this.loadData();this.data[key]=val;this.writeData();return true}else{return this.data&&this.data[key]||null}}loadData(){if(!this.isNode()){return{}}this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const curDirDataFilePath=this.path.resolve(this.dataFile);const rootDirDataFilePath=this.path.resolve(process.cwd(),this.dataFile);const isCurDirDataFile=this.fs.existsSync(curDirDataFilePath);const isRootDirDataFile=!isCurDirDataFile&&this.fs.existsSync(rootDirDataFilePath);if(isCurDirDataFile||isRootDirDataFile){const datPath=isCurDirDataFile?curDirDataFilePath:rootDirDataFilePath;try{return this.fs.readFileSync(datPath).o()}catch(e){return{}}}else{return{}}}writeData(){if(!this.isNode()){return}this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const curDirDataFilePath=this.path.resolve(this.dataFile);const rootDirDataFilePath=this.path.resolve(process.cwd(),this.dataFile);const isCurDirDataFile=this.fs.existsSync(curDirDataFilePath);const isRootDirDataFile=!isCurDirDataFile&&this.fs.existsSync(rootDirDataFilePath);const jsondata=this.data.s();if(isCurDirDataFile){this.fs.writeFileSync(curDirDataFilePath,jsondata)}else if(isRootDirDataFile){this.fs.writeFileSync(rootDirDataFilePath,jsondata)}else{this.fs.writeFileSync(curDirDataFilePath,jsondata)}}adapterStatus(response){if(response){if(response.status){response["statusCode"]=response.status}else if(response.statusCode){response["status"]=response.statusCode}}return response}get(options,callback=(()=>{})){if(this.isSurge()||this.isLoon()||this.isStash()){$httpClient.get(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)})}else if(this.isQuanX()){if(typeof options=="string")options={url:options};options["method"]="GET";$task.fetch(options).then(response=>{callback(null,this.adapterStatus(response),response.body)},reason=>callback(reason.error,null,null))}else if(this.isNode()){this.node.request(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)})}else if(this.isJSBox()){if(typeof options=="string")options={url:options};options["header"]=options["headers"];options["handler"]=function(resp){let error=resp.error;if(error)error=resp.error.s();let body=resp.data;if(typeof body=="object")body=resp.data.s();callback(error,this.adapterStatus(resp.response),body)};$http.get(options)}}post(options,callback=(()=>{})){if(this.isSurge()||this.isLoon()||this.isStash()){$httpClient.post(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)})}else if(this.isQuanX()){if(typeof options=="string")options={url:options};options["method"]="POST";$task.fetch(options).then(response=>{callback(null,this.adapterStatus(response),response.body)},reason=>callback(reason.error,null,null))}else if(this.isNode()){this.node.request.post(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)})}else if(this.isJSBox()){if(typeof options=="string")options={url:options};options["header"]=options["headers"];options["handler"]=function(resp){let error=resp.error;if(error)error=resp.error.s();let body=resp.data;if(typeof body=="object")body=resp.data.s();callback(error,this.adapterStatus(resp.response),body)};$http.post(options)}}put(options,callback=(()=>{})){if(this.isSurge()||this.isLoon()||this.isStash()){options.method="PUT";$httpClient.put(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)})}else if(this.isQuanX()){if(typeof options=="string")options={url:options};options["method"]="PUT";$task.fetch(options).then(response=>{callback(null,this.adapterStatus(response),response.body)},reason=>callback(reason.error,null,null))}else if(this.isNode()){options.method="PUT";this.node.request.put(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)})}else if(this.isJSBox()){if(typeof options=="string")options={url:options};options["header"]=options["headers"];options["handler"]=function(resp){let error=resp.error;if(error)error=resp.error.s();let body=resp.data;if(typeof body=="object")body=resp.data.s();callback(error,this.adapterStatus(resp.response),body)};$http.post(options)}}costTime(){let info=`${this.name}执行完毕！`;if(this.isNode()&&this.isExecComm){info=`指令【${this.comm[1]}】执行完毕！`}const endTime=(new Date).getTime();const ms=endTime-this.startTime;const costTime=ms/1e3;this.execCount++;this.costTotalMs+=ms;this.log(`${info}耗时【${costTime}】秒\n总共执行【${this.execCount}】次，平均耗时【${(this.costTotalMs/this.execCount/1e3).toFixed(4)}】秒`);this.setVal(this.costTotalStringKey,`${this.costTotalMs},${this.execCount}`.s())}done(value={}){this.costTime();if(this.isSurge()||this.isQuanX()||this.isLoon()||this.isStash()){$done(value)}}getRequestUrl(){return $request.url}getResponseBody(){return $response.body}isMatch(reg){return!!($request.method!="OPTIONS"&&this.getRequestUrl().match(reg))}isEmpty(obj){return typeof obj=="undefined"||obj==null||obj==""||obj=="null"||obj=="undefined"||obj.length===0}randomString(len,chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890"){len=len||32;let maxPos=chars.length;let pwd="";for(let i=0;i<len;i++){pwd+=chars.charAt(Math.floor(Math.random()*maxPos))}return pwd}autoComplete(str,prefix,suffix,fill,len,direction,ifCode,clen,startIndex,cstr){str+=``;if(str.length<len){while(str.length<len){if(direction==0){str+=fill}else{str=fill+str}}}if(ifCode){let temp=``;for(let i=0;i<clen;i++){temp+=cstr}str=str.substring(0,startIndex)+temp+str.substring(clen+startIndex)}str=prefix+str+suffix;return this.toDBC(str)}customReplace(str,param,prefix,suffix){try{if(this.isEmpty(prefix)){prefix="#{"}if(this.isEmpty(suffix)){suffix="}"}for(let i in param){str=str.replace(`${prefix}${i}${suffix}`,param[i])}}catch(e){this.logErr(e)}return str}toDBC(txtstring){let tmp="";for(let i=0;i<txtstring.length;i++){if(txtstring.charCodeAt(i)==32){tmp=tmp+String.fromCharCode(12288)}else if(txtstring.charCodeAt(i)<127){tmp=tmp+String.fromCharCode(txtstring.charCodeAt(i)+65248)}}return tmp}hash(str){let h=0,i,chr;for(i=0;i<str.length;i++){chr=str.charCodeAt(i);h=(h<<5)-h+chr;h|=0}return String(h)}formatDate(date,format){let o={"M+":date.getMonth()+1,"d+":date.getDate(),"H+":date.getHours(),"m+":date.getMinutes(),"s+":date.getSeconds(),"q+":Math.floor((date.getMonth()+3)/3),S:date.getMilliseconds()};if(/(y+)/.test(format))format=format.replace(RegExp.$1,(date.getFullYear()+"").substr(4-RegExp.$1.length));for(let k in o)if(new RegExp("("+k+")").test(format))format=format.replace(RegExp.$1,RegExp.$1.length==1?o[k]:("00"+o[k]).substr((""+o[k]).length));return format}getCookieProp(ca,cname){const name=cname+"=";ca=ca.split(";");for(let i=0;i<ca.length;i++){let c=ca[i].trim();if(c.indexOf(name)==0){return c.substring(name.length).replace('"',"").trim()}}return""}}(scriptName,scriptId,options)}
//ToolKit-end
