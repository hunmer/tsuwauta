String.prototype.replaceAll = function(s1, s2) {
    return this.replace(new RegExp(s1, "gm"), s2);
}
var g_api = './api/';
var g_api = 'https://neysummer-api.glitch.me/';
var _GET = getGETArray();
var g_localKey = 'tsuwauta_';
var g_socket = 'wss://tsuwata-server.glitch.me';
// var g_socket = 'ws://'+location.host+':8000';
// 本地储存前缀
var g_config = local_readJson('config', {
    lastId: 'DD1JfUPaPp4',
    history: {},
    audioMode: false,
    darkMode: false,
});
var g_data = local_readJson('datas', {});
var g_favorite = local_readJson('favorite', {});
var g_utaten = local_readJson('utaten', {});
var g_lyric = local_readJson('lyric', {});


function local_saveJson(key, data) {
    if (window.localStorage) {
        key = g_localKey + key;
        data = JSON.stringify(data);
        if (data == undefined) data = '[]';
        return localStorage.setItem(key, data);
    }
    return false;
}

function toastPAlert(msg, type, time, title) {
    halfmoon.initStickyAlert({
        content: msg,
        title: title || '',
        alertType: type || "alert-primary",
        hasDismissButton: false,
        timeShown: time || 3000
    });
}


function local_readJson(key, defaul) {
    if (!window.localStorage) return defaul;
    key = g_localKey + key;
    var r = JSON.parse(localStorage.getItem(key));
    return r === null ? defaul : r;
}


function getGETArray() {
    var a_result = [],
        a_exp;
    var a_params = window.location.search.slice(1).split('&');
    for (var k in a_params) {
        a_exp = a_params[k].split('=');
        if (a_exp.length > 1) {
            a_result[a_exp[0]] = decodeURIComponent(a_exp[1]);
        }
    }
    return a_result;
}


function randNum(min, max) {
    return parseInt(Math.random() * (max - min + 1) + min, 10);
}

function arrayRand(arr){
    var len = arr.length - 1;
    return arr[randNum(0, len)]
}


function toTime(s) {
    var a = s.split(':');
    if (a.length == 2) {
        a.unshift(0);
    }
    return a[0] * 3600 + a[1] * 60 + a[2] * 1;
}


function IsPC() {
    var userAgentInfo = navigator.userAgent;
    var Agents = new Array("Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod");
    var flag = true;
    for (var v = 0; v < Agents.length; v++) {
        if (userAgentInfo.indexOf(Agents[v]) > 0) { flag = false; break; }
    }
    return flag;
}


var g_actions = {};

function registerAction(name, callback) {
    g_actions[name] = callback;
}

var g_revices = {};

function registerRevice(name, callback) {
    g_revices[name] = callback;
}


function addAnimation(d, x, callback) {
    removeAnimation(d);
    d.attr('animated', x).addClass('animated ' + x).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend',

        function() {
            if (removeAnimation(d)) { // 确保有移除过动画
                if (callback != undefined) {
                    callback();
                }
            }

        })
}

function removeAnimation(d) {
    var x = d.attr('animated');
    if (x != undefined) {
        d.removeClass('animated ' + x).attr('animated', null);
    }
    return x;
}

function cutString(s_text, s_start, s_end, i_start = 0) {
    i_start = s_text.indexOf(s_start, i_start);
    if (i_start === -1) return '';
    i_start += s_start.length;
    i_end = s_text.indexOf(s_end, i_start);
    if (i_end === -1) return '';
    return s_text.substr(i_start, i_end - i_start);
}

function getTime(t){ // 00:00.460
    let a = t.split(':');
    return parseInt(a[0]) * 60 + a[1] * 1;
}

function getText(text, s, e){
    let i_s = text.indexOf(s);
    if(i_s != -1){
        i_s++;
        let i_e = text.indexOf(e, i_s);
        if(i_e != -1){
            return text.substr(i_s, i_e - i_s);
        }
    }
    return '';
}


function getTime1(s) {
    s = Number(s);
    var h = 0,
        m = 0;
    if (s >= 3600) {
        h = parseInt(s / 3600);
        s %= 3600;
    }
    if (s >= 60) {
        m = parseInt(s / 60);
        s %= 60;
    }
    return _s1(h, ':') + _s(m, ':') + _s(s);
}



function copyText(text) {
    if (!$('#modal-copy').length) {
        $(`<div class="modal" id="modal-copy" tabindex="-1" role="dialog" style="z-index: 99999;">
        <div class="modal-dialog" role="document">
            <div class="modal-content modal-content-media w-500">
                <a class="close" role="button" aria-label="Close" onclick="halfmoon.toggleModal('modal-copy');">
                    <span aria-hidden="true">&times;</span>
                </a>
                <h5 class="modal-title text-center">copy</h5>
                <div class="modal-html"><div class="input-group">
          <textarea class="form-control" id="input_copy" disbaled>` + text + `</textarea>
        </div>
        <button class="form-control bg-primary btn-block" onclick="$('#input_copy').select();document.execCommand('copy');halfmoon.toggleModal('modal-copy');">copy</button>
                </div>
            </div>
        </div>
    </div>`).appendTo('body');
    }
    halfmoon.toggleModal('modal-copy');
}


function _s1(s, j = '') {
    s = parseInt(s);
    return (s == 0 ? '' : (s < 10 ? '0' + s : s) + j);
}

function _s(i, j = '') {
    return (i < 10 ? '0' + i : i) + j;
}

 function downloadImg(url, fileName){
        var a = document.createElement('a');
        var event = new MouseEvent('click');
        a.download = fileName;
        a.href = url;
        a.dispatchEvent(event);
    }