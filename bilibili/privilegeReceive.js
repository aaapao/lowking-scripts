/*
哔哩哔哩大会员特权领取-lowking-v1.0

⚠️注意，本月领取过如果再执行，会提示"网络繁忙"。由于每个月一次，未验证Cookie存活时间

按下面配置完之后，手机哔哩哔哩点击我的-我的大会员-卡券包，领取一张券获取Cookie

************************
Surge 4.2.0+ 脚本配置(其他APP自行转换配置):
************************

[Script]
# > 哔哩哔哩大会员特权领取
哔哩哔哩大会员特权领取cookie = type=http-request,pattern=https:\/\/api.bilibili.com\/x\/vip\/privilege\/receive,script-path=https://raw.githubusercontent.com/lowking/Scripts/master/bilibili/privilegeReceive.js
哔哩哔哩大会员特权领取 = type=cron,cronexp="0 1 0 1 * ?",wake-system=1,script-path=https://raw.githubusercontent.com/lowking/Scripts/master/bilibili/privilegeReceive.js

[MITM]
hostname = %APPEND% *.bilibili.com
*/

const lk = new ToolKit(`哔哩哔哩大会员特权领取`, `BilibiliPrivilegeReceive`)
const isEnableNotifyForGetCookie = lk.getVal('lkIsEnableNotifyForGetCookieBilibiliPrivilegeReceive', true).o()
let requestHeaders = lk.getVal('lkBilibiliPrivilegeReceiveRequestHeaders').o()

const headerTemp = {
    "Host": "api.bilibili.com",
    "Accept": "*/*",
    "native_api_from": "h5",
    "Accept-Language": "zh-cn",
    "Accept-Encoding": "gzip, deflate, br",
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_2 like Mac OS X) AppleWebKit/610.2.11.0.1 (KHTML, like Gecko) Mobile/18B92 BiliApp/10350 os/ios model/iPhone XS mobi_app/iphone build/10350 osVer/14.2 network/2 channel/AppStore Buvid/YD43A7D5F4FAEF7E4551BE51DC357E37908C",
    "Connection": "keep-alive",
    "Referer": "https://big.bilibili.com/mobile/cardBag",
}

let realHeader

if(!lk.isExecComm) {
    if (lk.isRequest()) {
        getCookie()
        lk.done()
    } else {
        lk.boxJsJsonBuilder({
            "settings": [
                {
                    "id": "lkBilibiliPrivilegeReceiveRequestHeaders",
                    "name": "哔哩哔哩大会员特权领取Headers",
                    "val": "",
                    "type": "text",
                    "desc": "哔哩哔哩大会员特权领取Headers"
                },
                {
                    "id": "lkIsEnableNotifyForGetCookieBilibiliPrivilegeReceive",
                    "name": "开启/关闭获取Cookie时的通知",
                    "val": true,
                    "type": "boolean",
                    "desc": "默认开启"
                }
            ],
            "keys": ["lkBilibiliPrivilegeReceiveRequestHeaders"]
        })
        all()
    }
}

function getCookie() {
    if (lk.isMatch(/\/log\/mobile/)) {
        let cookieStr = ''
        if ($request.headers.hasOwnProperty('Cookie')) {
            let header = $request.headers
            cookieStr = header.Cookie

            if (cookieStr.match(/sid=/g) == null ||
                cookieStr.match(/DedeUserID=/g) == null ||
                cookieStr.match(/DedeUserID__ckMd5=/g) == null ||
                cookieStr.match(/bili_jct=/g) == null ||
                cookieStr.match(/SESSDATA=/g) == null) {
                lk.appendNotifyInfo(`❌获取Cookie无效`)
            } else {
                lk.setVal('lkBilibiliPrivilegeReceiveRequestHeaders', header.s())
                lk.appendNotifyInfo(`🎉获取Cookie成功`)
            }
        } else {
            lk.appendNotifyInfo(`❌未获取到Cookie`)
        }
        if (isEnableNotifyForGetCookie) {
            lk.msg(``)
        }
    }
}

async function all() {
    if (requestHeaders == '') {
        lk.execFail()
        lk.appendNotifyInfo(`⚠️请先打开哔哩哔哩获取Cookie`)
    } else {
        realHeader = requestHeaders
        // 生成X-CSRF-TOKEN
        let cookieStr = realHeader.Cookie
        cookieStr = cookieStr.split(";");
        for (let i = 0; i < cookieStr.length; ++i) {
            cookieStr[i] = cookieStr[i].trim();
        }
        let csrf = "";
        for (let i = 0; i < cookieStr.length; ++i) {
            if (cookieStr[i].indexOf("bili_jct=") == 0) {
                csrf = cookieStr[i].slice(cookieStr[i].indexOf("=") + 1);
            }
        }
        realHeader["X-CSRF-TOKEN"] = csrf
        Object.assign(realHeader, headerTemp)
        await getBBTicket()
        await getVipGoTicket()
    }
    lk.msg(``)
    lk.done()
}

function getBBTicket() {
    return new Promise((resolve, reject) => {
        lk.log('领取每月B币券')
        const t = '领取B币券'
        let url = {
            url: 'https://api.bilibili.com/x/vip/privilege/receive',
            body: `csrf=${realHeader['X-CSRF-TOKEN']}&type=1`,
            headers: realHeader
        }
        realHeader["Content-Length"] = url.body.length
        url.headers = realHeader
        lk.post(url, (error, response, data) => {
            try {
                lk.log(error)
                if (error) {
                    lk.execFail()
                    lk.appendNotifyInfo(`${t}失败❌请稍后再试`)
                } else {
                    let ret = data.o()
                    if (ret.code == 0) {
                        lk.appendNotifyInfo(`🎉${t}成功`)
                    } else {
                        lk.execFail()
                        lk.appendNotifyInfo(`❌${t}失败：${ret.message}`)
                    }
                }
                if (!lk.execStatus) {
                    lk.log(`请求内容：${url.s()}`)
                }
                resolve()
            } catch (e) {
                lk.logErr(e)
                lk.log(`b站返回数据：${data}`)
                lk.execFail()
                lk.appendNotifyInfo(`${t}错误❌请带上日志联系作者`)
            }
        })
    })
}

function getVipGoTicket() {
    return new Promise((resolve, reject) => {
        lk.log('领取每月会员购券')
        const t = '领取会员购券'
        let url = {
            url: 'https://api.bilibili.com/x/vip/privilege/receive',
            body: `csrf=${realHeader['X-CSRF-TOKEN']}&type=2`,
            headers: realHeader
        }
        realHeader["Content-Length"] = url.body.length
        url.headers = realHeader
        lk.post(url, (error, response, data) => {
            try {
                lk.log(error)
                if (error) {
                    lk.execFail()
                    lk.appendNotifyInfo(`${t}失败❌请稍后再试`)
                } else {
                    let ret = data.o()
                    if (ret.code == 0) {
                        lk.appendNotifyInfo(`🎉${t}成功`)
                    } else {
                        lk.execFail()
                        lk.appendNotifyInfo(`❌${t}失败：${ret.message}`)
                    }
                }
                if (!lk.execStatus) {
                    lk.log(`请求内容：${url.s()}`)
                }
                resolve()
            } catch (e) {
                lk.logErr(e)
                lk.log(`b站返回数据：${data}`)
                lk.execFail()
                lk.appendNotifyInfo(`${t}错误❌请带上日志联系作者`)
            }
        })
    })
}

// * ToolKit v1.3.1 build 80
function ToolKit(scriptName,scriptId,options){class Request{constructor(tk){this.tk=tk}fetch(options,method="GET"){options=typeof options=="string"?{url:options}:options;let fetcher;switch(method){case"PUT":fetcher=this.put;break;case"POST":fetcher=this.post;break;default:fetcher=this.get}const doFetch=new Promise((resolve,reject)=>{fetcher.call(this,options,(error,resp,data)=>error?reject({error,resp,data}):resolve({error,resp,data}))}),delayFetch=(promise,timeout=5e3)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error("请求超时")),timeout))]);return options.timeout>0?delayFetch(doFetch,options.timeout):doFetch}async get(options){return this.fetch.call(this.tk,options)}async post(options){return this.fetch.call(this.tk,options,"POST")}async put(options){return this.fetch.call(this.tk,options,"PUT")}}return new class{constructor(scriptName,scriptId,options){Object.prototype.s=function(replacer,space){return typeof this=="string"?this:JSON.stringify(this,replacer,space)},Object.prototype.o=function(reviver){return JSON.parse(this,reviver)},this.userAgent=`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`,this.prefix=`lk`,this.name=scriptName,this.id=scriptId,this.req=new Request(this),this.data=null,this.dataFile=this.getRealPath(`${this.prefix}${this.id}.dat`),this.boxJsJsonFile=this.getRealPath(`${this.prefix}${this.id}.boxjs.json`),this.options=options,this.isExecComm=!1,this.isEnableLog=this.getVal(`${this.prefix}IsEnableLog${this.id}`),this.isEnableLog=!!this.isEmpty(this.isEnableLog)||this.isEnableLog.o(),this.isNotifyOnlyFail=this.getVal(`${this.prefix}NotifyOnlyFail${this.id}`),this.isNotifyOnlyFail=!this.isEmpty(this.isNotifyOnlyFail)&&this.isNotifyOnlyFail.o(),this.isEnableTgNotify=this.getVal(`${this.prefix}IsEnableTgNotify${this.id}`),this.isEnableTgNotify=!this.isEmpty(this.isEnableTgNotify)&&this.isEnableTgNotify.o(),this.tgNotifyUrl=this.getVal(`${this.prefix}TgNotifyUrl${this.id}`),this.isEnableTgNotify=this.isEnableTgNotify?!this.isEmpty(this.tgNotifyUrl):this.isEnableTgNotify,this.costTotalStringKey=`${this.prefix}CostTotalString${this.id}`,this.costTotalString=this.getVal(this.costTotalStringKey),this.costTotalString=this.isEmpty(this.costTotalString)?`0,0`:this.costTotalString.replace('"',""),this.costTotalMs=this.costTotalString.split(",")[0],this.execCount=this.costTotalString.split(",")[1],this.sleepTotalMs=0,this.logSeparator=`
██`,this.twoSpace="  ",this.now=new Date,this.startTime=this.now.getTime(),this.node=(()=>{if(this.isNode()){const request=require("request");return{request}}return null})(),this.execStatus=!0,this.notifyInfo=[],this.boxjsCurSessionKey="chavy_boxjs_cur_sessions",this.boxjsSessionsKey="chavy_boxjs_sessions",this.preTgEscapeCharMapping={"|`|":",backQuote,"},this.finalTgEscapeCharMapping={",backQuote,":"`","%2CbackQuote%2C":"`"},this.tgEscapeCharMapping={"_":"\\_","*":"\\*","`":"\\`"},this.tgEscapeCharMappingV2={"_":"\\_","*":"\\*","[":"\\[","]":"\\]","(":"\\(",")":"\\)","~":"\\~","`":"\\`",">":"\\>","#":"\\#","+":"\\+","-":"\\-","=":"\\=","|":"\\|","{":"\\{","}":"\\}",".":"\\.","!":"\\!"},this.log(`${this.name}, 开始执行!`),this.execComm()}getRealPath(fileName){if(!this.isNode())return fileName;let targetPath=process.argv.slice(1,2)[0].split("/");return targetPath[targetPath.length-1]=fileName,targetPath.join("/")}checkPath(fileName){const curDirDataFilePath=this.path.resolve(fileName),rootDirDataFilePath=this.path.resolve(process.cwd(),fileName),isCurDirDataFile=this.fs.existsSync(curDirDataFilePath),isRootDirDataFile=!isCurDirDataFile&&this.fs.existsSync(rootDirDataFilePath);return{curDirDataFilePath,rootDirDataFilePath,isCurDirDataFile,isRootDirDataFile}}async execComm(){if(!this.isNode())return;if(this.comm=process.argv.slice(1),this.comm[1]!="p")return;this.isExecComm=!0,this.log(`开始执行指令【${this.comm[1]}】=> 发送到其他终端测试脚本!`);let httpApi=this.options.httpApi;if(this.isEmpty(this?.options?.httpApi))this.log(`未设置options,使用默认值`),this.isEmpty(this?.options)&&(this.options={}),this.options.httpApi=`ffff@10.0.0.6:6166`;else{if(typeof httpApi=="object"){const targetDevice=this.comm[2];if(httpApi[targetDevice])httpApi=httpApi[targetDevice];else{const keys=Object.keys(httpApi);httpApi=keys[0]?httpApi[keys[0]]:"error"}}if(!/.*?@.*?:[0-9]+/.test(httpApi)){this.log(`❌httpApi格式错误!格式: ffff@3.3.3.18:6166`),this.done();return}}this.callApi(this.comm[2],httpApi)}callApi(timeout,httpApi){let fname=this.comm[0];const[xKey,httpApiHost]=httpApi.split("@"),deviceName=this.isNumeric(this.comm[2])?this.comm[3]||httpApiHost:this.comm[2],targetDevice=deviceName||httpApiHost;this.log(`获取【${fname}】内容传给【${targetDevice}】`),this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const{curDirDataFilePath,rootDirDataFilePath,isCurDirDataFile,isRootDirDataFile}=this.checkPath(fname);if(!isCurDirDataFile&&!isRootDirDataFile){lk.done();return}const datPath=isCurDirDataFile?curDirDataFilePath:rootDirDataFilePath;let options={url:`http://${httpApiHost}/v1/scripting/evaluate`,headers:{"X-Key":xKey},body:{script_text:String(this.fs.readFileSync(datPath)),mock_type:"cron",timeout:!this.isEmpty(timeout)&&timeout>5?timeout:5},json:!0};this.req.post(options).then(({error,resp,data})=>{this.log(`已将脚本【${fname}】发给【${targetDevice}】,执行结果: 
${this.twoSpace}error: ${error}
${this.twoSpace}resp: ${resp?.s()}
${this.twoSpace}data: ${this.responseDataAdapter(data)}`),this.done()})}boxJsJsonBuilder(info,param){if(!this.isNode())return;if(!this.isJsonObject(info)||!this.isJsonObject(param)){this.log("构建BoxJsJson传入参数格式错误,请传入json对象");return}let boxjsJsonPath=param?.targetBoxjsJsonPath||"/Users/lowking/Desktop/Scripts/lowking.boxjs.json";if(!this.fs.existsSync(boxjsJsonPath))return;this.log("using node");let needAppendKeys=["settings","keys"];const domain="https://raw.githubusercontent.com/Orz-3";let boxJsJson={},scritpUrl="#lk{script_url}";if(boxJsJson.id=`${this.prefix}${this.id}`,boxJsJson.name=this.name,boxJsJson.desc_html=`⚠️使用说明</br>详情【<a href='${scritpUrl}?raw=true'><font class='red--text'>点我查看</font></a>】`,boxJsJson.icons=[`${domain}/mini/master/Alpha/${this.id.toLocaleLowerCase()}.png`,`${domain}/mini/master/Color/${this.id.toLocaleLowerCase()}.png`],boxJsJson.keys=[],boxJsJson.settings=[{id:`${this.prefix}IsEnableLog${this.id}`,name:"开启/关闭日志",val:!0,type:"boolean",desc:"默认开启"},{id:`${this.prefix}NotifyOnlyFail${this.id}`,name:"只当执行失败才通知",val:!1,type:"boolean",desc:"默认关闭"},{id:`${this.prefix}IsEnableTgNotify${this.id}`,name:"开启/关闭Telegram通知",val:!1,type:"boolean",desc:"默认关闭"},{id:`${this.prefix}TgNotifyUrl${this.id}`,name:"Telegram通知地址",val:"",type:"text",desc:"Tg的通知地址,如: https://api.telegram.org/bot-token/sendMessage?chat_id=-100140&parse_mode=Markdown&text="}],boxJsJson.author="#lk{author}",boxJsJson.repo="#lk{repo}",boxJsJson.script=`${scritpUrl}?raw=true`,!this.isEmpty(info))for(let key of needAppendKeys){if(this.isEmpty(info[key]))break;if(key==="settings")for(let i=0;i<info[key].length;i++){let input=info[key][i];for(let j=0;j<boxJsJson.settings.length;j++){let def=boxJsJson.settings[j];input.id===def.id&&boxJsJson.settings.splice(j,1)}}boxJsJson[key]=boxJsJson[key].concat(info[key]),delete info[key]}Object.assign(boxJsJson,info),this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const{curDirDataFilePath,rootDirDataFilePath,isCurDirDataFile,isRootDirDataFile}=this.checkPath(this.boxJsJsonFile),jsondata=boxJsJson.s(null,"	");isCurDirDataFile?this.fs.writeFileSync(curDirDataFilePath,jsondata):isRootDirDataFile?this.fs.writeFileSync(rootDirDataFilePath,jsondata):this.fs.writeFileSync(curDirDataFilePath,jsondata);let boxjsJson=this.fs.readFileSync(boxjsJsonPath).o();if(!boxjsJson?.apps||!Array.isArray(boxjsJson.apps)){this.log(`⚠️请在boxjs订阅json文件中添加根属性: apps, 否则无法自动构建`);return}let apps=boxjsJson.apps,targetIdx=apps.indexOf(apps.filter(app=>app.id==boxJsJson.id)[0]);targetIdx>=0?boxjsJson.apps[targetIdx]=boxJsJson:boxjsJson.apps.push(boxJsJson);let ret=boxjsJson.s(null,2);if(!this.isEmpty(param))for(const key in param){let val=param[key];if(!val)switch(key){case"author":val="@lowking";break;case"repo":val="https://github.com/lowking/Scripts";break;default:continue}ret=ret.replaceAll(`#lk{${key}}`,val)}const regex=/(?:#lk\{)(.+?)(?=\})/;let m=regex.exec(ret);m!==null&&this.log(`⚠️生成BoxJs还有未配置的参数,请参考:
${this.twoSpace}https://github.com/lowking/Scripts/blob/master/util/example/ToolKitDemo.js#L17-L19
${this.twoSpace}传入参数: `);let loseParamSet=new Set;for(;(m=regex.exec(ret))!==null;)loseParamSet.add(m[1]),ret=ret.replace(`#lk{${m[1]}}`,``);loseParamSet.forEach(p=>console.log(`${this.twoSpace}${p}`)),this.fs.writeFileSync(boxjsJsonPath,ret)}isJsonObject(obj){return typeof obj=="object"&&Object.prototype.toString.call(obj).toLowerCase()=="[object object]"&&!obj.length}appendNotifyInfo(info,type){type==1?this.notifyInfo=info:this.notifyInfo.push(info)}prependNotifyInfo(info){this.notifyInfo.splice(0,0,info)}execFail(){this.execStatus=!1}isRequest(){return typeof $request!="undefined"}isSurge(){return typeof $httpClient!="undefined"}isQuanX(){return typeof $task!="undefined"}isLoon(){return typeof $loon!="undefined"}isJSBox(){return typeof $app!="undefined"&&typeof $http!="undefined"}isStash(){return"undefined"!=typeof $environment&&$environment["stash-version"]}isNode(){return typeof require=="function"&&!this.isJSBox()}sleep(ms){return this.sleepTotalMs+=ms,new Promise(resolve=>setTimeout(resolve,ms))}randomSleep(minMs,maxMs){return this.sleep(this.randomNumber(minMs,maxMs))}randomNumber(min,max){return Math.floor(Math.random()*(max-min+1)+min)}log(message){this.isEnableLog&&console.log(`${this.logSeparator}${message}`)}logErr(message){if(this.execStatus=!0,this.isEnableLog){let msg="";this.isEmpty(message.error)||(msg=`${msg}
${this.twoSpace}${message.error.s()}`),this.isEmpty(message.message)||(msg=`${msg}
${this.twoSpace}${message.message.s()}`),msg=`${this.logSeparator}${this.name}执行异常:${this.twoSpace}${msg}`,message&&(msg=`${msg}
${this.twoSpace}${message.s()}`),console.log(msg)}}replaceUseMap(mapping,message){for(let key in mapping){if(!mapping.hasOwnProperty(key))continue;message=message.replaceAll(key,mapping[key])}return message}msg(subtitle,message,openUrl,mediaUrl,copyText,disappearS){if(!this.isRequest()&&this.isNotifyOnlyFail&&this.execStatus)return;if(this.isEmpty(message)&&(Array.isArray(this.notifyInfo)?message=this.notifyInfo.join(`
`):message=this.notifyInfo),this.isEmpty(message))return;if(this.isEnableTgNotify){this.log(`${this.name}Tg通知开始`);const isMarkdown=this.tgNotifyUrl&&this.tgNotifyUrl.indexOf("parse_mode=Markdown")!=-1;if(isMarkdown){message=this.replaceUseMap(this.preTgEscapeCharMapping,message);let targetMapping=this.tgEscapeCharMapping;this.tgNotifyUrl.indexOf("parse_mode=MarkdownV2")!=-1&&(targetMapping=this.tgEscapeCharMappingV2),message=this.replaceUseMap(targetMapping,message)}message=`📌${this.name}
${message}`,isMarkdown&&(message=this.replaceUseMap(this.finalTgEscapeCharMapping,message));let u=`${this.tgNotifyUrl}${encodeURIComponent(message)}`;this.req.get({url:u})}else{let options={};const hasOpenUrl=!this.isEmpty(openUrl),hasMediaUrl=!this.isEmpty(mediaUrl),hasCopyText=!this.isEmpty(copyText),hasAutoDismiss=disappearS>0;this.isSurge()||this.isLoon()||this.isStash()?(hasOpenUrl&&(options.url=openUrl,options.action="open-url"),hasCopyText&&(options.text=copyText,options.action="clipboard"),this.isSurge()&&hasAutoDismiss&&(options["auto-dismiss"]=disappearS),hasMediaUrl&&(options["media-url"]=mediaUrl),$notification.post(this.name,subtitle,message,options)):this.isQuanX()?(hasOpenUrl&&(options["open-url"]=openUrl),hasMediaUrl&&(options["media-url"]=mediaUrl),$notify(this.name,subtitle,message,options)):this.isNode()?this.log("⭐️"+this.name+`
`+subtitle+`
`+message):this.isJSBox()&&$push.schedule({title:this.name,body:subtitle?subtitle+`
`+message:message})}}getVal(key,defaultValue){let value;return this.isSurge()||this.isLoon()||this.isStash()?value=$persistentStore.read(key):this.isQuanX()?value=$prefs.valueForKey(key):this.isNode()?(this.data=this.loadData(),value=process.env[key]||this.data[key]):value=this.data&&this.data[key]||null,value||defaultValue}updateBoxjsSessions(key,val){if(key==this.boxjsSessionsKey)return;const boxJsId=`${this.prefix}${this.id}`;let boxjsCurSession=this.getVal(this.boxjsCurSessionKey,"{}").o();if(!boxjsCurSession.hasOwnProperty(boxJsId))return;let curSessionId=boxjsCurSession[boxJsId],boxjsSessions=this.getVal(this.boxjsSessionsKey,"[]").o();if(boxjsSessions.length==0)return;let curSessionDatas=[];if(boxjsSessions.forEach(session=>{session.id==curSessionId&&(curSessionDatas=session.datas)}),curSessionDatas.length==0)return;let isExists=!1;curSessionDatas.forEach(kv=>{kv.key==key&&(kv.val=val,isExists=!0)}),isExists||curSessionDatas.push({key,val}),boxjsSessions.forEach(session=>{session.id==curSessionId&&(session.datas=curSessionDatas)}),this.setVal(this.boxjsSessionsKey,boxjsSessions.s())}setVal(key,val){return this.isSurge()||this.isLoon()||this.isStash()?(this.updateBoxjsSessions(key,val),$persistentStore.write(val,key)):this.isQuanX()?(this.updateBoxjsSessions(key,val),$prefs.setValueForKey(val,key)):this.isNode()?(this.data=this.loadData(),this.data[key]=val,this.writeData(),!0):this.data&&this.data[key]||null}loadData(){if(!this.isNode())return{};this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const{curDirDataFilePath,rootDirDataFilePath,isCurDirDataFile,isRootDirDataFile}=this.checkPath(this.dataFile);if(isCurDirDataFile||isRootDirDataFile){const datPath=isCurDirDataFile?curDirDataFilePath:rootDirDataFilePath;return this.fs.readFileSync(datPath).o()}return{}}writeData(){if(!this.isNode())return;this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const{curDirDataFilePath,rootDirDataFilePath,isCurDirDataFile,isRootDirDataFile}=this.checkPath(this.dataFile),jsondata=this.data.s();isCurDirDataFile?this.fs.writeFileSync(curDirDataFilePath,jsondata):isRootDirDataFile?this.fs.writeFileSync(rootDirDataFilePath,jsondata):this.fs.writeFileSync(curDirDataFilePath,jsondata)}responseDataAdapter(data){const tabString=`${this.twoSpace}${this.twoSpace}`;let ret="";return Object.keys(data).forEach(key=>{let lines=data[key]?.s().split(`
`);key=="output"&&(lines=lines.slice(0,-2)),ret=`${ret}
${tabString}${key}:
${tabString}${this.twoSpace}${lines?.join(`
${tabString}${this.twoSpace}`)}`}),ret}statusAdapter(response){return response.status=response?.status||response?.statusCode,delete response.statusCode,response}get(options,callback=()=>{}){this.isSurge()||this.isLoon()||this.isStash()?$httpClient.get(options,(error,response,body)=>{callback(error,this.statusAdapter(response),body)}):this.isQuanX()?(typeof options=="string"&&(options={url:options}),options.method="GET",$task.fetch(options).then(response=>{callback(null,this.statusAdapter(response),response.body)},reason=>callback(reason.error,null,null))):this.isNode()?this.node.request(options,(error,response,body)=>{callback(error,this.statusAdapter(response),body)}):this.isJSBox()&&(typeof options=="string"&&(options={url:options}),options.header=options.headers,options.handler=function(resp){let error=resp.error;error&&(error=resp.error.s());let body=resp.data;typeof body=="object"&&(body=resp.data.s()),callback(error,this.adapterStatus(resp.response),body)},$http.get(options))}post(options,callback=()=>{}){this.isSurge()||this.isLoon()||this.isStash()?$httpClient.post(options,(error,response,body)=>{callback(error,this.statusAdapter(response),body)}):this.isQuanX()?(typeof options=="string"&&(options={url:options}),options.method="POST",$task.fetch(options).then(response=>{callback(null,this.statusAdapter(response),response.body)},reason=>callback(reason.error,null,null))):this.isNode()?this.node.request.post(options,(error,response,body)=>{callback(error,this.statusAdapter(response),body)}):this.isJSBox()&&(typeof options=="string"&&(options={url:options}),options.header=options.headers,options.handler=function(resp){let error=resp.error;error&&(error=resp.error.s());let body=resp.data;typeof body=="object"&&(body=resp.data.s()),callback(error,this.adapterStatus(resp.response),body)},$http.post(options))}put(options,callback=()=>{}){this.isSurge()||this.isLoon()||this.isStash()?(options.method="PUT",$httpClient.put(options,(error,response,body)=>{callback(error,this.statusAdapter(response),body)})):this.isQuanX()?(typeof options=="string"&&(options={url:options}),options.method="PUT",$task.fetch(options).then(response=>{callback(null,this.statusAdapter(response),response.body)},reason=>callback(reason.error,null,null))):this.isNode()?(options.method="PUT",this.node.request.put(options,(error,response,body)=>{callback(error,this.statusAdapter(response),body)})):this.isJSBox()&&(typeof options=="string"&&(options={url:options}),options.header=options.headers,options.handler=function(resp){let error=resp.error;error&&(error=resp.error.s());let body=resp.data;typeof body=="object"&&(body=resp.data.s()),callback(error,this.adapterStatus(resp.response),body)},$http.post(options))}sum(a,b){let aa=Array.from(a,Number),bb=Array.from(b,Number),ret=[],c=0,i=Math.max(a.length,b.length);for(;i--;)c+=(aa.pop()||0)+(bb.pop()||0),ret.unshift(c%10),c=Math.floor(c/10);for(;c;)ret.unshift(c%10),c=Math.floor(c/10);return ret.join("")}costTime(){let info=`${this.name}, 执行完毕!`;this.isNode()&&this.isExecComm&&(info=`指令【${this.comm[1]}】执行完毕!`);const endTime=(new Date).getTime(),ms=endTime-this.startTime,costTime=ms/1e3,count=this.sum(this.execCount,"1"),total=this.sum(this.costTotalMs,ms.s()),average=(Number(total)/Number(count)/1e3).toFixed(4);info=`${info}
${this.twoSpace}耗时【${costTime}】秒(含休眠${this.sleepTotalMs?(this.sleepTotalMs/1e3).toFixed(4):0}秒)`,info=`${info}
${this.twoSpace}总共执行【${count}】次,平均耗时【${average}】秒`,info=`${info}
${this.twoSpace}ToolKit v1.3.1 build 80 by lowking.`,this.log(info),this.setVal(this.costTotalStringKey,`${total},${count}`.s())}done(value={}){this.costTime(),(this.isSurge()||this.isQuanX()||this.isLoon()||this.isStash())&&$done(value)}getRequestUrl(){return $request.url}getResponseBody(){return $response.body}isMatch(reg){return!!($request.method!="OPTIONS"&&this.getRequestUrl().match(reg))}isEmpty(obj){return typeof obj=="undefined"||obj==null||obj==""||obj=="null"||obj=="undefined"||obj.length===0}isNumeric(s){return!isNaN(parseFloat(s))&&isFinite(s)}randomString(len,chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890"){len=len||32;let maxPos=chars.length,pwd="";for(let i=0;i<len;i++)pwd+=chars.charAt(Math.floor(Math.random()*maxPos));return pwd}autoComplete(str,prefix,suffix,fill,len,direction,ifCode,clen,startIndex,cstr){if(str+=``,str.length<len)for(;str.length<len;)direction==0?str+=fill:str=fill+str;if(ifCode){let temp=``;for(let i=0;i<clen;i++)temp+=cstr;str=str.substring(0,startIndex)+temp+str.substring(clen+startIndex)}return str=prefix+str+suffix,this.toDBC(str)}customReplace(str,param,prefix,suffix){try{this.isEmpty(prefix)&&(prefix="#{"),this.isEmpty(suffix)&&(suffix="}");for(let i in param)str=str.replace(`${prefix}${i}${suffix}`,param[i])}catch(e){this.logErr(e)}return str}toDBC(txtstring){let tmp="";for(let i=0;i<txtstring.length;i++)txtstring.charCodeAt(i)==32?tmp=tmp+String.fromCharCode(12288):txtstring.charCodeAt(i)<127&&(tmp=tmp+String.fromCharCode(txtstring.charCodeAt(i)+65248));return tmp}hash(str){let h=0,i,chr;for(i=0;i<str.length;i++)chr=str.charCodeAt(i),h=(h<<5)-h+chr,h|=0;return String(h)}formatDate(date,format){let o={"M+":date.getMonth()+1,"d+":date.getDate(),"H+":date.getHours(),"m+":date.getMinutes(),"s+":date.getSeconds(),"q+":Math.floor((date.getMonth()+3)/3),S:date.getMilliseconds()};/(y+)/.test(format)&&(format=format.replace(RegExp.$1,(date.getFullYear()+"").substr(4-RegExp.$1.length)));for(let k in o)new RegExp("("+k+")").test(format)&&(format=format.replace(RegExp.$1,RegExp.$1.length==1?o[k]:("00"+o[k]).substr((""+o[k]).length)));return format}getCookieProp(ca,cname){const name=cname+"=";ca=ca.split(";");for(let i=0;i<ca.length;i++){let c=ca[i].trim();if(c.indexOf(name)==0)return c.substring(name.length).replace('"',"").trim()}return""}parseHTML(htmlString){let parser=new DOMParser,document=parser.parseFromString(htmlString,"text/html");return document.body}}(scriptName,scriptId,options)}