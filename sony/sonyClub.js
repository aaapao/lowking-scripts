/*
索尼俱乐部签到-lowking-v1.4

⚠️v1.2之后需要订阅BoxJs之后填写帐号密码

************************
Surge 4.2.0+ 脚本配置(其他APP自行转换配置):
************************

[Script]
# > 索尼俱乐部签到
索尼俱乐部签到 = type=cron,cronexp="0 0 0 * * ?",wake-system=1,script-path=https://raw.githubusercontent.com/lowking/Scripts/master/sony/sonyClub.js
*/
const sonyClubTokenKey = 'lkSonyClubToken'
const lk = new ToolKit('索尼俱乐部签到', 'SonyClub')
const signurlVal = `https://www.sonystyle.com.cn/eSolverOmniChannel/account/signupPoints.do?channel=WAP&access_token=`
var sonyClubToken = lk.getVal(sonyClubTokenKey)
const userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`

if (!lk.isExecComm) {
    all()

    async function all() {
        lk.boxJsJsonBuilder({"author": "@lowking"})
        await signIn() //签到
        await notify() //通知
    }

    function signIn() {
        return new Promise(async (resolve, reject) => {
            try {
                let url = {
                    url: `${signurlVal}${sonyClubToken}`,
                    headers: {
                        "User-Agent": userAgent
                    }
                }
                lk.log(`${JSON.stringify(url)}`)
                lk.post(url, async (error, response, data) => {
                    try {
                        lk.log(data)
                        if (data == undefined || data.startsWith("<")) {
                            lk.log(`进入自动登录`)
                            // 不通知直接登录获取token
                            if (loginCount > 3) {
                                lk.appendNotifyInfo(`登录尝试3次，均失败❌请确认帐号密码是否正确！`)
                                lk.execFail()
                            } else {
                                await loginSonyClub()
                            }
                        } else {
                            const result = JSON.parse(data)
                            if (result.resultMsg[0].code == "00") {
                                lk.appendNotifyInfo(`连续签到${result.resultData.successiveSignupDays}天🎉\n本次签到获得【${result.resultData.signupRankingOfDay}】成长值，共【${result.resultData.totalPoints}】成长值`)
                            } else if (result.resultMsg[0].code == "99") {
                                lk.appendNotifyInfo(`重复签到🔁`)
                            } else if (result.resultMsg[0].code == "98") {
                                if (loginCount > 3) {
                                    lk.appendNotifyInfo(`登录尝试3次，均失败❌请确认帐号密码是否正确！`)
                                    lk.execFail()
                                } else {
                                    await loginSonyClub()
                                }
                            } else {
                                lk.appendNotifyInfo(`签到失败❌\\n${result.resultMsg[0].message}`)
                                lk.execFail()
                            }
                        }
                    } catch (ee) {
                        throw ee
                    } finally {
                        resolve()
                    }
                })
            } catch (e) {
                lk.log(`${lk.name}异常：\n${e}`)
                lk.execFail()
                lk.appendNotifyInfo(`签到异常，请带上日志联系作者❌`)
                return resolve()
            }
        })
    }

    var loginCount = 0

    async function loginSonyClub() {
        ++loginCount
        return new Promise(async (resolve, reject) => {
            lk.log(`第${loginCount}次尝试登录`)
            let loginId = lk.getVal("lkSonyClubLoginId")
            let pwd = lk.getVal("lkSonyClubPassword")
            if (lk.isEmpty(loginId) || lk.isEmpty(pwd)) {
                lk.appendNotifyInfo(`请到BoxJs填写帐号密码⚠️`)
                lk.execFail()
                return resolve()
            }
            let loginUrl = {
                url: `https://www.sonystyle.com.cn/eSolverOmniChannel/account/login.do`,
                headers: {
                    "User-Agent": userAgent,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "channel": "WAP",
                    "loginID": loginId,
                    "password": pwd
                })
            };
            try {
                lk.log(JSON.stringify(loginUrl))
                lk.post(loginUrl, async (error, response, data) => {
                    try {
                        lk.log(data)
                        if (data == undefined) {
                            if (loginCount > 3) {
                                lk.appendNotifyInfo(`登录尝试3次，均失败❌请确认帐号密码是否正确！`)
                                lk.execFail()
                                return resolve()
                            } else {
                                await loginSonyClub()
                            }
                        } else {
                            const result = JSON.parse(data)
                            if (result.resultMsg[0].code == "00") {
                                //登录成功，调用签到
                                let accessToken = result.resultData["access_token"]
                                lk.log(`登录成功，token：${accessToken}`)
                                lk.setVal(sonyClubTokenKey, accessToken)
                                sonyClubToken = accessToken
                                await signIn()
                            } else {
                                lk.appendNotifyInfo(`登录失败❌\n${result.resultMsg[0].message}`)
                                lk.execFail()
                                return resolve()
                            }
                        }
                    } finally {
                        resolve()
                    }
                })
            } catch (e) {
                lk.execFail()
                throw e
            }
        })
    }
}

function notify() {
    return new Promise((resolve, reject) => {
        lk.msg(``)
        lk.done()
        return resolve()
    })
}

//ToolKit-start
function ToolKit(t,s,i){return new class{constructor(t,s,i){this.tgEscapeCharMapping={"&":"＆","#":"＃"};this.userAgent=`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`;this.prefix=`lk`;this.name=t;this.id=s;this.data=null;this.dataFile=this.getRealPath(`${this.prefix}${this.id}.dat`);this.boxJsJsonFile=this.getRealPath(`${this.prefix}${this.id}.boxjs.json`);this.options=i;this.isExecComm=false;this.isEnableLog=this.getVal(`${this.prefix}IsEnableLog${this.id}`);this.isEnableLog=this.isEmpty(this.isEnableLog)?true:JSON.parse(this.isEnableLog);this.isNotifyOnlyFail=this.getVal(`${this.prefix}NotifyOnlyFail${this.id}`);this.isNotifyOnlyFail=this.isEmpty(this.isNotifyOnlyFail)?false:JSON.parse(this.isNotifyOnlyFail);this.isEnableTgNotify=this.getVal(`${this.prefix}IsEnableTgNotify${this.id}`);this.isEnableTgNotify=this.isEmpty(this.isEnableTgNotify)?false:JSON.parse(this.isEnableTgNotify);this.tgNotifyUrl=this.getVal(`${this.prefix}TgNotifyUrl${this.id}`);this.isEnableTgNotify=this.isEnableTgNotify?!this.isEmpty(this.tgNotifyUrl):this.isEnableTgNotify;this.costTotalStringKey=`${this.prefix}CostTotalString${this.id}`;this.costTotalString=this.getVal(this.costTotalStringKey);this.costTotalString=this.isEmpty(this.costTotalString)?`0,0`:this.costTotalString.replace('"',"");this.costTotalMs=this.costTotalString.split(",")[0];this.execCount=this.costTotalString.split(",")[1];this.costTotalMs=this.isEmpty(this.costTotalMs)?0:parseInt(this.costTotalMs);this.execCount=this.isEmpty(this.execCount)?0:parseInt(this.execCount);this.logSeparator="\n██";this.now=new Date;this.startTime=this.now.getTime();this.node=(()=>{if(this.isNode()){const t=require("request");return{request:t}}else{return null}})();this.execStatus=true;this.notifyInfo=[];this.boxjsCurSessionKey="chavy_boxjs_cur_sessions";this.boxjsSessionsKey="chavy_boxjs_sessions";this.log(`${this.name}, 开始执行!`);this.execComm()}getRealPath(t){if(this.isNode()){let s=process.argv.slice(1,2)[0].split("/");s[s.length-1]=t;return s.join("/")}return t}async execComm(){if(this.isNode()){this.comm=process.argv.slice(1);let t=false;if(this.comm[1]=="p"){this.isExecComm=true;this.log(`开始执行指令【${this.comm[1]}】=> 发送到其他终端测试脚本！`);if(this.isEmpty(this.options)||this.isEmpty(this.options.httpApi)){this.log(`未设置options，使用默认值`);if(this.isEmpty(this.options)){this.options={}}this.options.httpApi=`ffff@10.0.0.9:6166`}else{if(!/.*?@.*?:[0-9]+/.test(this.options.httpApi)){t=true;this.log(`❌httpApi格式错误！格式：ffff@3.3.3.18:6166`);this.done()}}if(!t){this.callApi(this.comm[2])}}}}callApi(t){let s=this.comm[0];let i=this.options.httpApi.split("@")[1];this.log(`获取【${s}】内容传给【${i}】`);let e="";this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const o=this.path.resolve(s);const h=this.path.resolve(process.cwd(),s);const r=this.fs.existsSync(o);const n=!r&&this.fs.existsSync(h);if(r||n){const t=r?o:h;try{e=this.fs.readFileSync(t)}catch(t){e=""}}else{e=""}let a={url:`http://${i}/v1/scripting/evaluate`,headers:{"X-Key":`${this.options.httpApi.split("@")[0]}`},body:{script_text:`${e}`,mock_type:"cron",timeout:!this.isEmpty(t)&&t>5?t:5},json:true};this.post(a,(t,e,o)=>{this.log(`已将脚本【${s}】发给【${i}】`);this.done()})}getCallerFileNameAndLine(){let t;try{throw Error("")}catch(s){t=s}const s=t.stack;const i=s.split("\n");let e=1;if(e!==0){const t=i[e];this.path=this.path?this.path:require("path");return`[${t.substring(t.lastIndexOf(this.path.sep)+1,t.lastIndexOf(":"))}]`}else{return"[-]"}}getFunName(t){var s=t.toString();s=s.substr("function ".length);s=s.substr(0,s.indexOf("("));return s}boxJsJsonBuilder(t,s){if(this.isNode()){let i="/Users/lowking/Desktop/Scripts/lowking.boxjs.json";if(s&&s.hasOwnProperty("target_boxjs_json_path")){i=s["target_boxjs_json_path"]}if(!this.fs.existsSync(i)){return}if(!this.isJsonObject(t)||!this.isJsonObject(s)){this.log("构建BoxJsJson传入参数格式错误，请传入json对象");return}this.log("using node");let e=["settings","keys"];const o="https://raw.githubusercontent.com/Orz-3";let h={};let r="#lk{script_url}";if(s&&s.hasOwnProperty("script_url")){r=this.isEmpty(s["script_url"])?"#lk{script_url}":s["script_url"]}h.id=`${this.prefix}${this.id}`;h.name=this.name;h.desc_html=`⚠️使用说明</br>详情【<a href='${r}?raw=true'><font class='red--text'>点我查看</font></a>】`;h.icons=[`${o}/mini/master/Alpha/${this.id.toLocaleLowerCase()}.png`,`${o}/mini/master/Color/${this.id.toLocaleLowerCase()}.png`];h.keys=[];h.settings=[{id:`${this.prefix}IsEnableLog${this.id}`,name:"开启/关闭日志",val:true,type:"boolean",desc:"默认开启"},{id:`${this.prefix}NotifyOnlyFail${this.id}`,name:"只当执行失败才通知",val:false,type:"boolean",desc:"默认关闭"},{id:`${this.prefix}IsEnableTgNotify${this.id}`,name:"开启/关闭Telegram通知",val:false,type:"boolean",desc:"默认关闭"},{id:`${this.prefix}TgNotifyUrl${this.id}`,name:"Telegram通知地址",val:"",type:"text",desc:"Tg的通知地址，如：https://api.telegram.org/bot-token/sendMessage?chat_id=-100140&parse_mode=Markdown&text="}];h.author="#lk{author}";h.repo="#lk{repo}";h.script=`${r}?raw=true`;if(!this.isEmpty(t)){for(let s in e){let i=e[s];if(!this.isEmpty(t[i])){if(i==="settings"){for(let s=0;s<t[i].length;s++){let e=t[i][s];for(let t=0;t<h.settings.length;t++){let s=h.settings[t];if(e.id===s.id){h.settings.splice(t,1)}}}}h[i]=h[i].concat(t[i])}delete t[i]}}Object.assign(h,t);if(this.isNode()){this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const t=this.path.resolve(this.boxJsJsonFile);const e=this.path.resolve(process.cwd(),this.boxJsJsonFile);const o=this.fs.existsSync(t);const r=!o&&this.fs.existsSync(e);const n=JSON.stringify(h,null,"\t");if(o){this.fs.writeFileSync(t,n)}else if(r){this.fs.writeFileSync(e,n)}else{this.fs.writeFileSync(t,n)}let a=JSON.parse(this.fs.readFileSync(i));if(a.hasOwnProperty("apps")&&Array.isArray(a["apps"])&&a["apps"].length>0){let t=a.apps;let e=t.indexOf(t.filter(t=>{return t.id==h.id})[0]);if(e>=0){a.apps[e]=h}else{a.apps.push(h)}let o=JSON.stringify(a,null,2);if(!this.isEmpty(s)){for(const t in s){let i="";if(s.hasOwnProperty(t)){i=s[t]}else if(t==="author"){i="@lowking"}else if(t==="repo"){i="https://github.com/lowking/Scripts"}o=o.replace(`#lk{${t}}`,i)}}const r=/(?:#lk\{)(.+?)(?=\})/;let n=r.exec(o);if(n!==null){this.log(`生成BoxJs还有未配置的参数，请参考https://github.com/lowking/Scripts/blob/master/util/example/ToolKitDemo.js#L17-L18传入参数：\n`)}let l=new Set;while((n=r.exec(o))!==null){l.add(n[1]);o=o.replace(`#lk{${n[1]}}`,``)}l.forEach(t=>{console.log(`${t} `)});this.fs.writeFileSync(i,o)}}}}isJsonObject(t){return typeof t=="object"&&Object.prototype.toString.call(t).toLowerCase()=="[object object]"&&!t.length}appendNotifyInfo(t,s){if(s==1){this.notifyInfo=t}else{this.notifyInfo.push(t)}}prependNotifyInfo(t){this.notifyInfo.splice(0,0,t)}execFail(){this.execStatus=false}isRequest(){return typeof $request!="undefined"}isSurge(){return typeof $httpClient!="undefined"}isQuanX(){return typeof $task!="undefined"}isLoon(){return typeof $loon!="undefined"}isJSBox(){return typeof $app!="undefined"&&typeof $http!="undefined"}isStash(){return"undefined"!==typeof $environment&&$environment["stash-version"]}isNode(){return typeof require=="function"&&!this.isJSBox()}sleep(t){return new Promise(s=>setTimeout(s,t))}log(t){if(this.isEnableLog)console.log(`${this.logSeparator}${t}`)}logErr(t){this.execStatus=true;if(this.isEnableLog){console.log(`${this.logSeparator}${this.name}执行异常:`);console.log(t);console.log(`\n${t.message}`)}}msg(t,s,i,e){if(!this.isRequest()&&this.isNotifyOnlyFail&&this.execStatus){}else{if(this.isEmpty(s)){if(Array.isArray(this.notifyInfo)){s=this.notifyInfo.join("\n")}else{s=this.notifyInfo}}if(!this.isEmpty(s)){if(this.isEnableTgNotify){this.log(`${this.name}Tg通知开始`);for(let t in this.tgEscapeCharMapping){if(!this.tgEscapeCharMapping.hasOwnProperty(t)){continue}s=s.replace(t,this.tgEscapeCharMapping[t])}this.get({url:encodeURI(`${this.tgNotifyUrl}📌${this.name}\n${s}`)},(t,s,i)=>{this.log(`Tg通知完毕`)})}else{let o={};const h=!this.isEmpty(i);const r=!this.isEmpty(e);if(this.isQuanX()){if(h)o["open-url"]=i;if(r)o["media-url"]=e;$notify(this.name,t,s,o)}if(this.isSurge()||this.isStash()){if(h)o["url"]=i;$notification.post(this.name,t,s,o)}if(this.isNode())this.log("⭐️"+this.name+"\n"+t+"\n"+s);if(this.isJSBox())$push.schedule({title:this.name,body:t?t+"\n"+s:s})}}}}getVal(t,s=""){let i;if(this.isSurge()||this.isLoon()||this.isStash()){i=$persistentStore.read(t)}else if(this.isQuanX()){i=$prefs.valueForKey(t)}else if(this.isNode()){this.data=this.loadData();i=process.env[t]||this.data[t]}else{i=this.data&&this.data[t]||null}return!i?s:i}updateBoxjsSessions(t,s){if(t==this.boxjsSessionsKey){return}const i=`${this.prefix}${this.id}`;let e=JSON.parse(this.getVal(this.boxjsCurSessionKey,"{}"));if(!e.hasOwnProperty(i)){return}let o=e[i];let h=JSON.parse(this.getVal(this.boxjsSessionsKey,"[]"));if(h.length==0){return}let r=[];h.forEach(t=>{if(t.id==o){r=t.datas}});if(r.length==0){return}r.forEach(i=>{if(i.key==t){i.val=s}});h.forEach(t=>{if(t.id==o){t.datas=r}});this.setVal(this.boxjsSessionsKey,JSON.stringify(h))}setVal(t,s){if(this.isSurge()||this.isLoon()||this.isStash()){this.updateBoxjsSessions(t,s);return $persistentStore.write(s,t)}else if(this.isQuanX()){this.updateBoxjsSessions(t,s);return $prefs.setValueForKey(s,t)}else if(this.isNode()){this.data=this.loadData();this.data[t]=s;this.writeData();return true}else{return this.data&&this.data[t]||null}}loadData(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile);const s=this.path.resolve(process.cwd(),this.dataFile);const i=this.fs.existsSync(t);const e=!i&&this.fs.existsSync(s);if(i||e){const e=i?t:s;try{return JSON.parse(this.fs.readFileSync(e))}catch(t){return{}}}else return{}}else return{}}writeData(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile);const s=this.path.resolve(process.cwd(),this.dataFile);const i=this.fs.existsSync(t);const e=!i&&this.fs.existsSync(s);const o=JSON.stringify(this.data);if(i){this.fs.writeFileSync(t,o)}else if(e){this.fs.writeFileSync(s,o)}else{this.fs.writeFileSync(t,o)}}}adapterStatus(t){if(t){if(t.status){t["statusCode"]=t.status}else if(t.statusCode){t["status"]=t.statusCode}}return t}get(t,s=(()=>{})){if(this.isQuanX()){if(typeof t=="string")t={url:t};t["method"]="GET";$task.fetch(t).then(t=>{s(null,this.adapterStatus(t),t.body)},t=>s(t.error,null,null))}if(this.isSurge()||this.isLoon()||this.isStash())$httpClient.get(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)});if(this.isNode()){this.node.request(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)})}if(this.isJSBox()){if(typeof t=="string")t={url:t};t["header"]=t["headers"];t["handler"]=function(t){let i=t.error;if(i)i=JSON.stringify(t.error);let e=t.data;if(typeof e=="object")e=JSON.stringify(t.data);s(i,this.adapterStatus(t.response),e)};$http.get(t)}}post(t,s=(()=>{})){if(this.isQuanX()){if(typeof t=="string")t={url:t};t["method"]="POST";$task.fetch(t).then(t=>{s(null,this.adapterStatus(t),t.body)},t=>s(t.error,null,null))}if(this.isSurge()||this.isLoon()||this.isStash()){$httpClient.post(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)})}if(this.isNode()){this.node.request.post(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)})}if(this.isJSBox()){if(typeof t=="string")t={url:t};t["header"]=t["headers"];t["handler"]=function(t){let i=t.error;if(i)i=JSON.stringify(t.error);let e=t.data;if(typeof e=="object")e=JSON.stringify(t.data);s(i,this.adapterStatus(t.response),e)};$http.post(t)}}put(t,s=(()=>{})){if(this.isQuanX()){if(typeof t=="string")t={url:t};t["method"]="PUT";$task.fetch(t).then(t=>{s(null,this.adapterStatus(t),t.body)},t=>s(t.error,null,null))}if(this.isSurge()||this.isLoon()||this.isStash()){t.method="PUT";$httpClient.put(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)})}if(this.isNode()){t.method="PUT";this.node.request.put(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)})}if(this.isJSBox()){if(typeof t=="string")t={url:t};t["header"]=t["headers"];t["handler"]=function(t){let i=t.error;if(i)i=JSON.stringify(t.error);let e=t.data;if(typeof e=="object")e=JSON.stringify(t.data);s(i,this.adapterStatus(t.response),e)};$http.post(t)}}costTime(){let t=`${this.name}执行完毕！`;if(this.isNode()&&this.isExecComm){t=`指令【${this.comm[1]}】执行完毕！`}const s=(new Date).getTime();const i=s-this.startTime;const e=i/1e3;this.execCount++;this.costTotalMs+=i;this.log(`${t}耗时【${e}】秒\n总共执行【${this.execCount}】次，平均耗时【${(this.costTotalMs/this.execCount/1e3).toFixed(4)}】秒`);this.setVal(this.costTotalStringKey,JSON.stringify(`${this.costTotalMs},${this.execCount}`))}done(t={}){this.costTime();if(this.isSurge()||this.isQuanX()||this.isLoon()||this.isStash()){$done(t)}}getRequestUrl(){return $request.url}getResponseBody(){return $response.body}isGetCookie(t){return!!($request.method!="OPTIONS"&&this.getRequestUrl().match(t))}isEmpty(t){return typeof t=="undefined"||t==null||t==""||t=="null"||t=="undefined"||t.length===0}randomString(t,s="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890"){t=t||32;var i=s.length;var e="";for(let o=0;o<t;o++){e+=s.charAt(Math.floor(Math.random()*i))}return e}autoComplete(t,s,i,e,o,h,r,n,a,l){t+=``;if(t.length<o){while(t.length<o){if(h==0){t+=e}else{t=e+t}}}if(r){let s=``;for(var f=0;f<n;f++){s+=l}t=t.substring(0,a)+s+t.substring(n+a)}t=s+t+i;return this.toDBC(t)}customReplace(t,s,i,e){try{if(this.isEmpty(i)){i="#{"}if(this.isEmpty(e)){e="}"}for(let o in s){t=t.replace(`${i}${o}${e}`,s[o])}}catch(t){this.logErr(t)}return t}toDBC(t){var s="";for(var i=0;i<t.length;i++){if(t.charCodeAt(i)==32){s=s+String.fromCharCode(12288)}else if(t.charCodeAt(i)<127){s=s+String.fromCharCode(t.charCodeAt(i)+65248)}}return s}hash(t){let s=0,i,e;for(i=0;i<t.length;i++){e=t.charCodeAt(i);s=(s<<5)-s+e;s|=0}return String(s)}formatDate(t,s){let i={"M+":t.getMonth()+1,"d+":t.getDate(),"H+":t.getHours(),"m+":t.getMinutes(),"s+":t.getSeconds(),"q+":Math.floor((t.getMonth()+3)/3),S:t.getMilliseconds()};if(/(y+)/.test(s))s=s.replace(RegExp.$1,(t.getFullYear()+"").substr(4-RegExp.$1.length));for(let t in i)if(new RegExp("("+t+")").test(s))s=s.replace(RegExp.$1,RegExp.$1.length==1?i[t]:("00"+i[t]).substr((""+i[t]).length));return s}}(t,s,i)}
//ToolKit-end