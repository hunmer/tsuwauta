 var g_cache = {
     query: [],
     blurImg: '',
     closeCustom: () => {},
     signer: {}
 };
 var g_id;

 function initUser() {
     $('#img_user').attr('src', getUserIcon(g_config.user.name));
 }

 function getUserIcon(user) {
     return './res/' + user + '.jpg';
 }


 function closeModal(id, type, fun) {
     var modal = $('#' + id)
     if (modal.hasClass('show')) {
         if (type && modal.attr('data-type') != type) {
             return;
         }
         fun();
     }
 }

 function checkConfig() {
     var btn = $('[data-action="darkMode"]');
     if (g_config.darkMode) {
         btn.addClass('btn-primary');
     } else {
         btn.removeClass('btn-primary');
     }
     btn = $('[data-action="tlrc"]');
     if (g_config.tlrc) {
         btn.addClass('btn-primary');
     } else {
         btn.removeClass('btn-primary');
     }
     btn = $('[data-action="utaten"]');
     if (g_config.utaten) {
         btn.addClass('btn-primary');
     } else {
         btn.removeClass('btn-primary');
     }
     initVolume();
 }

 function initFont() {
     $('li[data-time]').css('fontSize', Math.max(10, g_config.fontSize) + 'px');
     $('.rt').css('fontSize', (Math.max(10, g_config.fontSize / 2)) + 'px');
     g_player.updateScroll();
 }

 function initVolume() {
     $('#volume').css('width', g_config.volume_volume * 100 + '%');
     $('#subVolume').css('width', g_config.volume_subVolume * 100 + '%');
     $('#key').css('width', g_config.volume_key * 100 + '%');
 }

 function toggleFullScreen() {
     if (!document.fullscreenElement && // alternative standard method
         !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) { // current working methods
         if (document.documentElement.requestFullscreen) {
             document.documentElement.requestFullscreen();
         } else if (document.documentElement.msRequestFullscreen) {
             document.documentElement.msRequestFullscreen();
         } else if (document.documentElement.mozRequestFullScreen) {
             document.documentElement.mozRequestFullScreen();
         } else if (document.documentElement.webkitRequestFullscreen) {
             document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
         }
         return true;
     }
     if (document.exitFullscreen) {
         document.exitFullscreen();
     } else if (document.msExitFullscreen) {
         document.msExitFullscreen();
     } else if (document.mozCancelFullScreen) {
         document.mozCancelFullScreen();
     } else if (document.webkitExitFullscreen) {
         document.webkitExitFullscreen();
     }
     return false;
 }

 $(function() {

     var onFullscrren = (fullscreen) => {
         $('[data-action="fullScreen"]').find('i').attr('class', 'bi bi-fullscreen' + (fullscreen ? '-exit' : ''));
     }

     $(window).resize(function(event) {
         for (var d of $('.full-height')) {
             $(d).css('height', 'calc(100vh - ' + (d.getBoundingClientRect().top + 70) + 'px)');
         }
         var maxHeight = window.screen.height,
             maxWidth = window.screen.width,
             curHeight = window.innerHeight,
             curWidth = window.innerWidth;

         onFullscrren(maxWidth == curWidth && maxHeight == curHeight);

     }).resize();
     if (!g_config.fontSize) g_config.fontSize = 15;

     if (!g_config.user || !g_config.user.name) {
         var user = prompt('名前を入力ください', _GET['user']);
         if (user != '') {
             g_config.user = {
                 name: user,
                 icon: 'icons/default.icon'
             }
             local_saveJson('config', g_config);
             initUser();
         }
     } else {
         initUser();
     }

     checkConfig();
     $('.progress').click(function(event) {
         var pos = event.originalEvent.offsetX / $(this).width();
         var id = $(this).find('.progress-bar')[0].id;
         switch (id) {
             case 'volume':
             case 'key':
             case 'subVolume':
                 var value;
                 g_config['volume_' + id] = pos;
                 initVolume();
                 local_saveJson('config', g_config);
                 if (id == 'key') {
                     if (pos < 0.5) {
                         value = 44100 - (0.5 - pos) * 30000;
                     } else {
                         value = 44100 + pos * 40000;
                     }
                 } else {
                     value = 100 * pos;
                 }
                 queryMsg({ type: id, data: value });
                 break;
             default:
                 g_player.setCurrentTime(pos * (isNaN(g_player.audio.duration) ? g_cache.max : g_player.audio.duration));
                 break;
         }
     });

     initWebsock(false);
     //g_player.search('深海少女');

     // $('[data-change="darkMode"]').prop('checked', g_config.darkMode);
     $(document).on('click', '[data-action]', function(event) {
         doAction(this, $(this).attr('data-action'));
     }).on('dblclick', '[data-dbaction]', function(event) {
         doAction(this, $(this).attr('data-dbaction'));
     }).
     on('fullscreenchange webkitfullscreenchange mozfullscreenchange msfullscreenchange', (event) => {
         onFullscrren(document.fullscreenElement);
     }).
     on('change', function(event) {
         var d = $(event.target);
         switch (d.attr('data-change')) {
             case 'darkMode':
                 halfmoon.toggleDarkMode();
                 break;
         }
     });

     $('#div_player ul').on('scroll', function(event) {
         var active = $('.active[data-time]');
         if (!active.length) return;
         var top = active[0].offsetTop;
         let con = $('#div_player ul');
         var ptop = con.scrollTop();
         var s;
         if (top < ptop) {
             s = 'up';
         } else
         if (top - active.height() > ptop + con[0].offsetHeight) {
             s = 'down';
         }
         var btn = $('[data-action="scrollToLyric"]').css('display', s ? 'unset' : 'none');
         if (s) {
             btn.find('i').attr('class', 'bi bi-arrow-' + s);
         }
     })

     window.onkeydown = (e) => {
         if ($('input:focus').length) return;
         switch (e.code) {
             case 'Space':
                 $('[data-action="play"]')[0].click();

         }
     }

     initHistory();
     initGift();
 });


 function saveHistory(id, json = {}) {
     var d = g_config.history[id] ? g_config.history[id] : {};
     d.t = new Date().getTime();
     g_config.history[id] = Object.assign(d, json);
     var keys = Object.keys(g_config.history);
     for (var i = 50; i < keys.length; i++) {
         delete g_config.history[keys[i]];
     }
     local_saveJson('config', g_config);
     initHistory();
 }

 function initGift() {
     var gifts = {
         '冰淇淋,大拇指,拍手,666,call,爱心,猫掌,红嘴唇,红嘴唇1,皇冠,奖杯,星星,点赞,爱心1,爱心2,爱心3,爱心4,爱心5,爱心6,祝贺1,祝贺2,祝贺4,祝贺5': {
             audio: '',
         },
         '祝贺3': {
             audio: ['欢呼1', '欢呼2', '欢呼3', '欢呼4'],
         }
     }
     var h = '';
     for (var items in gifts) {
         for (var item of items.split(',')) {
             //  data-toggle="tooltip" data-title="`+item+`"
             h += `<div class="col-3" title="` + item + `">
                            <img data-action="sendGif,` + gifts[items].audio + `" src="gif/` + item + `.gif" class="gift lazyload">
            </div>`;
         }
     }
     $('.ftb .dropdown-menu').html('<div class="row">' + h + '</div>').find('.lazyload').lazyload();

 }


 function initHistory() {
     var h = '';
     var i = 0;
     // g_favorite[key].lastPlay 
     for (var key of Object.keys(g_favorite).sort(function(a, b) {
             var a1 = g_favorite[a].lastPlay || 0;
             var b1 = g_favorite[b].lastPlay || 0;
             return b1 - a1;
         })) {
         i++;
         var d = g_favorite[key];
         h += `<div class="card sponsor-section-card w-350 mw-full m-0 p-0 d-flex" rel="noopener" data-json='` + JSON.stringify(d) + `'>
    <div class="w-100 h-100 m-10 align-self-center">
        <div class="w-100 h-100 rounded d-flex align-items-center justify-content-center" style="background-color: #5352ed;" >
            <img data-src="` + d.pic + `" class="w-100 h-100 lazyload" data-action="preview">
        </div>
    </div>
    <div class="flex-grow-1 overflow-hidden d-flex align-items-center position-relative h-120">
        <div class="p-10 w-full m-auto">
            <p class="font-size-10 m-0 mb-5 text-truncate font-weight-medium">
                 ` + d.name + `
            </p>
            <p class="font-size-10 text-muted m-0 mb-5 text-truncate font-weight-medium">
                 ` + d.artist + `
            </p>
            <button class="btn btn-success btn-square rounded-circle mt-10 float-right" data-action="addToQuery"><i class="bi bi-plus-circle font-size-20"></i></button>
        </div>
    </div>
</div>`;
     }
     $('.sidebar').html('<h5 class="text-center">お気入り<span class="ml-10 badge badge-primary">' + i + '</span></h5>' + h).find('.lazyload').lazyload();
 }

 function soundTip(url) {
     $('#tip').attr('src', url)[0].play();
 }

 function getJson(dom, json = true) {
     var div = $(dom).parents('[data-json]');
     var str = div.attr('data-json');
     if (!str) return g_player.data;
     return json ? JSON.parse(str) : str;
 }

 function saveSigner() {
     var id = g_player.getKey();
     if (g_favorite[id]) {
         g_favorite[id].signer = g_cache.signer;
         local_saveJson('favorite', g_favorite);
     }

     queryMsg({ type: 'signer', data: g_cache.signer, id: id });
 }

 function doAction(dom, action, params) {
     var action = action.split(',');
     if (g_actions[action[0]]) {
         return g_actions[action[0]](dom, action, params);
     }
     switch (action[0]) {
        case 'copyInfo':
            const input = document.createElement('input');
            document.body.appendChild(input);
            input.setAttribute('value', g_player.data['source'] + '_' + g_player.data['id']+'.mp3');
            input.select();
            if (document.execCommand('copy')) {
                document.execCommand('copy');
            }
            document.body.removeChild(input);
            break;

         case 'sendGif':
             $('#gif_show').hide();
             halfmoon.deactivateAllDropdownToggles();
             var audio;
             if (action.length > 1) audio = action[1];
             queryMsg({ type: 'sendGif', data: dom.src, audio: audio }, true);
             break;

         case 'setSigner':
             var time = $(dom).parents('[data-time]').attr('data-time');
             if (action.length == 1) {
                 g_cache.signer_time = time;
                 $('#modal-custom').find('.modal-title').html('歌い手');
                 $('#modal-custom').attr('data-type', 'setSigner').find('.modal-html').html(`
                        <div class="row">
                            <div class="col-4">
                                <img src="res/maki.jpg" data-action="setSigner,maki" class="singer rounded-circle">
                            </div>
                            <div class="col-4">
                                <img src="res/chisato.jpg" data-action="setSigner,chisato" class="singer rounded-circle">
                            </div>
                        </div>
                       <div class="text-right mt-20">
                        <a class="btn btn-danger" role="button" data-action="resetSigner">Reset</a>
                        <a class="btn btn-primary" role="button" data-action="saveSigner">Save</a>
                      </div>
                         `);
                 if (g_cache.signer && g_cache.signer[time]) {
                     for (var signer of g_cache.signer[time]) {
                         $('[data-action="setSigner,' + signer + '"]').addClass('signer_active');
                     }
                 }
                 g_cache.closeCustom = () => {};
                 halfmoon.toggleModal('modal-custom');
             } else {
                 $(dom).toggleClass('signer_active');
             }
             break;

         case 'saveSigner':
             var signers = $('.signer_active');
             var div = $('li.list-group-item[data-time="' + g_cache.signer_time + '"]').find('.hover-show-child');
             if (!signers.length) {
                 delete g_cache.signer[g_cache.signer_time];
                 div.removeClass('show');
             } else {
                 var h = '';
                 var a = [];
                 for (var d of signers) {
                     var user = $(d).attr('data-action').split(',')[1];
                     a.push(user);
                     h += `<img src="res/` + user + `.jpg" class="singer">`
                 }
                 g_cache.signer[g_cache.signer_time] = a;
                 div.addClass('show');
                 div.html(h);
             }
             saveSigner();
             halfmoon.toggleModal('modal-custom');
             break;

         case 'resetSigner':
             delete g_cache.signer[g_cache.signer_time];
             saveSigner();
             $('li.list-group-item[data-time="' + g_cache.signer_time + '"]').find('.hover-show-child').html(`<i class="bi bi-plus-circle text-primary"></i>`);
             halfmoon.toggleModal('modal-custom');
             break;

         case 'replay':
             $('[data-action="setPos"]')[0].click();
             break;
         case 'scrollToLyric':
             g_player.updateScroll(800, false);
             break;
         case 'recorder':
             g_recorder.init(() => {
                 g_recorder.switchRecord()
             });

             break;
         case 'spleeter':
             var json = getJson(dom);
             queryMsg({ type: 'spleeter', play: action[1], data: json });
             break;

         case 'searchUtaten':
             var s = $('#input_utaten').val();
             if (s != '') {
                 g_player.searchUtaten(s);
             }
             break;
         case 'search':
             var s = $('#input_search').val();
             $('#input_utaten').val(s);
             if (s != '') {
                 g_player.search(s);
             }
             break;
         case 'addToQuery':
             $('[data-action="show,query"]')[0].click();;
             var data = getJson(dom);
             data.user = g_config.user.name;
             queryMsg({ type: 'addToQuery', data: data });
             break;

         case 'darkMode':
             halfmoon.toggleDarkMode();
             checkConfig();
             break;

         case 'utaten':
         case 'tlrc':
             var key = g_player.data['source'] + '_' + g_player.data['id'];
             g_config[action[0]] = !g_config[action[0]];
             if (action[0] == 'utaten' && g_config.utaten) {
                 if (g_utaten[key]) {
                     g_player.initUtatenContent(g_utaten[key]);
                 } else {
                     g_player.searchUtaten(g_player.data['name']);
                     $('[data-action="show,utaten"]')[0].click();
                 }
             }

             local_saveJson('config', g_config);
             checkConfig();
             g_player.initLyric();
             break;

         case 'setPos':
             var time = $(dom).parents('[data-time]').attr('data-time');
             g_player.toTime(time);
             g_player.setCurrentTime(time * 1 - 1);
             g_cache.scrollTime = 5;
             break;

         case 'play':
             var audio = g_player.audio;
             if (!audio.duration) {
                 return queryMsg({ type: 'pause' });
             }
             if (audio.paused) {
                 audio.play();
             } else {
                 audio.pause();
             }
             $('[data-action="play"]').find('i').attr('class', 'font-size-20 bi bi-' + (audio.paused ? 'play' : 'pause'));
             break;

         case 'preview':
             var json = JSON.parse($(dom).parents('[data-json]').attr('data-json'));
             var key = json['source'] + '_' + json['id'];
             if ($(dom).parents('.sidebar').length) {
                 g_favorite[key].lastPlay = new Date().getTime();
                 local_saveJson('favorite', g_favorite);
                 $(dom).parents('.card').insertAfter('.sidebar h5');
             }
             g_player.setPlaying(json)
             break;

         case 'deleteFromQuery':
             var div = $(dom).parents('[data-json]');
             queryMsg({ type: 'deleteFromQuery', data: JSON.parse(div.attr('data-json')) });
             break;

         case 'playQuery':
             queryMsg({ type: 'playQuery', data: JSON.parse($(dom).parents('[data-json]').attr('data-json')) });

             break;

         case 'applyLyric':
             g_player.searchLyric(getJson(dom), action.length == 1);
             break;

         case 'show':
             showContent(action[1]);

             break
         case 'fontSize_add':
             if (g_config.fontSize < 100) {
                 g_config.fontSize += 1;
                 local_saveJson('config', g_config);
                 initFont();
             }
             break;

         case 'fontSize_reduce':
             if (g_config.fontSize > 5) {
                 g_config.fontSize -= 1;
                 local_saveJson('config', g_config);
                 initFont();
             }
             break;

         case 'sidebar_hide':
             var i = $(dom).find('i');
             var r = i.hasClass('bi-arrow-bar-left');
             if (r) {
                 i.removeClass('bi-arrow-bar-left').addClass('bi-arrow-bar-right');
                 $('#div_player').addClass('col-12');
             } else {
                 i.addClass('bi-arrow-bar-left').removeClass('bi-arrow-bar-right');
                 $('#div_player').removeClass('col-12');

             }
             $('#div_side').css('display', r ? 'none' : 'unset');
             //$('ul.full-height').css('textAlign', r ? 'center' : 'left');
             $('.lyric_layout').css('left', $('.lyric_layout').prev()[0].offsetLeft + 'px');
             g_player.updateScroll();

             break;

         case 'key_reset':
             g_config.volume_key = 0.5;
             initVolume();
             local_saveJson('config', g_config);
             queryMsg({ type: 'key', data: 44100 });
             break;

         case 'next':
             break;

         case 'favorite':
             var json = getJson(dom);
             if (!json) json = g_player.data;
             var key = json.source + '_' + json.id;
             var exists = g_favorite[key];
             if (exists) {
                 delete g_favorite[key];
             } else {
                 g_favorite[key] = json;
             }
             $('[data-action="favorite,' + key + '"] i').attr('class', 'bi text-danger bi-heart' + (exists ? '' : '-fill'))
             local_saveJson('favorite', g_favorite);
             initHistory();
             break;

         case 'download':
             if (g_player.data) window.open(g_player.getPlayerUrl(), '_blank');
             break;

         case 'fullScreen':
             toggleFullScreen();
             break;

         case 'switchColor':
             initCss(g_cache.color2, g_cache.color1)
             break;

        case 'switchSign':
            var show = $('.hover-show-child.show').toggleClass('hide').hasClass('hide');
            if(show){
                $(dom).addClass('btn-primary');
            }else{
                $(dom).removeClass('btn-primary');
            }
            break;

         case 'searchLyric':
             if (!g_player.data) return;
             $('#modal-custom').find('.modal-title').html('歌詞検索');
             $('#modal-custom').attr('data-type', 'searchLyric').find('.modal-html').html(`
                <div class="input-group ml-auto m-10">
                    <input type="text" id='input_genius' class="form-control " style="max-width: 80% !important;margin: 0 auto;" placeholder="search" value="" onkeydown="if(event.keyCode==13) g_player.searchGeniusLyric()">
                    <div class="input-group-append">
                        <button class="btn btn-primary" type="button" onclick="g_player.searchGeniusLyric()"> <i class="bi bi-search" aria-hidden="true"></i></button>
                    </div>
                </div>
                <div id="genius_result">
                </div>
                 `);
             g_cache.closeCustom = () => {};

             halfmoon.toggleModal('modal-custom');
             break;

     }
 }

 function showContent(id) {
     $('#tabs_btns button.btn-primary').removeClass('btn-primary');
     var dom = $('[data-action="show,' + id + '"]').addClass('btn-primary');
     for (var d of $('.div')) {
         if (d.id == 'div_' + id) {
             $(d).removeClass('hide');
         } else {
             $(d).addClass('hide');
         }
     }
     $(window).resize();
 }


 function reviceMsg(data) {
     //console.log('revice', data);
     var type = data.type;
     delete data.type;
     if (g_revices[type]) {
         return g_revices[type](data);
     }
     switch (type) {

         case 'signer':
             if (g_player.getKey() == data.id) {
                 g_player.initSigner(data.data);
             }
             break;

         case 'sendGif':
             if (g_cache.gif_timer) {
                 clearTimeout(g_cache.gif_timer);
                 delete g_cache.gif_timer;
             }
             $('#gif_user').attr('src', getUserIcon(data.user));
             var dom = $('#gif_show').show().find('#gif_img').attr('src', data.data);
             addAnimation(dom, arrayRand(['bounceInRight', 'tada', 'jello', 'heartBeat', 'backInRight', 'fadeInRight', 'lightSpeedInRight', 'flipInX', 'flipInY']), () => {});
             g_cache.gif_timer = setTimeout(() => {
                 $('#gif_show').fadeOut('slow');
             }, 5000);
             break;
         case 'utaten':
             g_player.lrc = data.data;
             g_player.initLyric();
             break;
         case 'alert':
             if (data.json) {
                 return g_player.setPlaying(data.json);
             }
             toastPAlert(data.data, data.class || 'alert-success', data.time || 1000);
             break;
         case 'getQuery':
             $('#div_query').html('');
             for (var d in data.data) {
                 addToQuery(data.data[d]);
             }
             break;


         case 'setStatus':
             var pause = data.data == '0';
             $('[data-action="play"]').find('i').attr('class', 'font-size-20 bi bi-' + (pause ? 'play' : 'pause'));
             // if(pause){
             //     if( g_recorder.isRecording()) g_recorder.stopRecord(false, false);
             // }else{
             //     if($('[data-action="recorded_time"]').html() != '00:00' && !g_recorder.isRecording()){
             //         g_recorder.startRecord(false);
             //     }
             // }
             break;

         case 'progress':
             if (g_player.audio.duration > 0) return;
             g_player.updateTime(data.data + 0.3, data.max);
             break;
         case 'playQuery':
             var json = data.data;
             g_config.volume_volume = 0.8;
             g_config.volume_key = 0.5;
             $('.spleeter.btn-primary').removeClass('btn-primary')
             if (data.spleeter) {
                 $('[data-action="spleeter,' + data.spleeter + '"]').addClass('btn-primary');
                 g_config.volume_subVolume = 0.15;
                 $('#subVolume').parents('.w-150').removeClass('hide').find('span').html(data.spleeter == 'vocals' ? '伴奏' : 'ボーカル');
                 $('#volume').parents('.w-150').find('span').html(data.spleeter == 'vocals' ? 'ボーカル' : '伴奏');
             } else {
                 $('#volume').parents('span').html('サーバー');
                 $('#subVolume').parents('.w-150').addClass('hide');
             }
             initVolume();
             g_player.setPlaying(json, false, data.lyric);
             break;
         case 'login':
             toastPAlert('ログイン: ' + data.user, 'alert-success', 1000);
             break;
         case 'addToQuery':
             addToQuery(data.data);
             //g_player.setPlaying(json)
             break;

         case 'deleteFromQuery':
             var json = data.data;
             var key = json['source'] + '_' + json['id'];
             $('#div_query [data-key="' + key + '"]').remove();
             if (key == g_player.data['source'] + '_' + g_player.data['id']) {
                 g_player.audio.src = '';
             }
             break;

     }
 }

 function addToQuery(detail) {
     $('.bi-arrow-bar-right').click();
     $('#div_query').stop().animate({
         scrollTop: $('#div_query')[0].scrollHeight
     }, { duration: 800, easing: "swing" });

     var key = detail['source'] + '_' + detail['id'];
     html = `<div class="card sponsor-section-card w-full m-0 p-10 d-flex mb-10" rel="noopener" data-key="` + key + `" data-json='` + JSON.stringify(detail) + `'>
                        <div class="w-100 h-100 m-10 align-self-center">
                            <div class="w-100 h-100 rounded d-flex align-items-center justify-content-center" data-action="playQuery">
                                <a data-toggle="tooltip" data-title="再生" data-placement="bottom" class="btn btn-square rounded-circle" role="button" style="background-color: rgba(0, 0, 0, 0.3); position: relative;left: 65px;"><i class="bi bi-play font-size-20 text-white" aria-hidden="true" ></i></a>

                                    
                                <img src="` + detail['pic'] + `" class="w-100 h-100">
                            </div>
                        </div>
                        <div class="flex-grow-1 overflow-hidden d-flex align-items-center position-relative h-120">
                                <img src="` + getUserIcon(detail['user']) + `" class="user_icon" style="position: absolute;right: 10px;top: 10px">
                            <div class="p-10 w-full ml-10">
                                <p class="font-size-10 text-dark-lm text-light-dm m-0 mb-5 text-truncate font-weight-medium" style="width: 80%">
                                     ` + detail['name'] + `
                                </p>
                                <p class="font-size-12 mt-5 mb-0 text-muted">
                                     ` + detail['artist'] + `
                                </p>
                                <div class="float-right mt-10">
                                  <button class="btn btn-secondary" data-action="favorite,` + key + `" data-toggle="tooltip" data-title="お気入り"><i class="bi bi-heart` + (g_favorite[key] ? '-fill' : '') + ` text-danger"></i></button>
                                  <button class="btn btn-primary" data-action="spleeter,accompaniment" data-toggle="tooltip" data-title="伴奏"><i class="bi bi-music-note-beamed"></i></button>
                                  <button class="btn btn-success" data-action="spleeter,vocals" data-toggle="tooltip" data-title="ボーカル"><i class="bi bi-mic"></i></button>
                                  <button class="btn btn-danger" data-action="deleteFromQuery" data-toggle="tooltip" data-title="削除"> <i class="bi bi-trash"></i></button>
                            </div>
                            <div class="sponsor-section-card-scroll-block"></div>
                        </div>
                    </div>`;
     $('#div_query').append(html);

 }


 var connection;

 function initWebsock(enable) {

    var setShow = (show) => {
          var doms = $('[data-action="spleeter,accompaniment"], [data-action="spleeter,vocals"], [data-action="show,query"],#progress_subVolume_div, #progress_key_div');
          if(show){
              doms.show();
             $('#switch-server').prop('checked', 1);
         }else{
              doms.hide();
             $('#switch-server').prop('checked', 0);
         }
    }
   
     if (enable) {
         connection = new WebSocket(g_socket);
         connection.onopen = () => {
            setShow(true);
             for (var msg of g_cache.query) {
                 connection.send(msg);
             }
             g_cache.query = [];
             queryMsg({ type: 'login', clientType: 'client' }, true);
             queryMsg({ type: 'getQuery' });
         }

         connection.onmessage = (e) => {
             reviceMsg(JSON.parse(e.data));
         }


         connection.onclose = (e) => {
                      setShow(false);
         }

         connection.onerror = (e) => {
                      setShow(false);
         }
     } else {
         if (connection && connection.readyState == 1) {
             connection.close();
         }
                      setShow(false);

     }

 }


 function queryMsg(data, user = false) {
     if (user) {
         data.user = g_config.user ? g_config.user.name : undefined;
     }
     // console.log('send', data);
     var msg = JSON.stringify(data);
     if (!connection || connection.readyState != 1) {
         if (g_cache.query.indexOf(msg) == -1) {
             g_cache.query.push(msg);
         }
         return;
         return initWebsock();
     }
     connection.send(msg);
 }


 function blurText() {
     var color1 = 'rgb(0, 0, 0)';
     var color2 = 'rgb(255, 255, 255)';

     RGBaster.colors($("#cover")[0], {
         paletteSize: 3,
         exclude: [],
         success: function(payload) {
             // 取最相近的rgb
             $('meta[name="theme-color"], meta[name="msapplication-navbutton-color"], meta[name="apple-mobile-web-app-status-bar-style"]').attr('content', payload.dominant);
             var a = payload.dominant.substr(4, payload.dominant.length - 5).split(',');
             var r = parseInt(a[0]);
             var g = parseInt(a[1]);
             var b = parseInt(a[2]);
             var nr, ng, nb;
             if (r > 125 || g > 125 || b > 125) {
                 // 暗色
             } else {
                 color1 = 'rgb(255, 255, 255)';
                 color2 = 'rgb(0, 0, 0)';
             }

             initCss(color1, color2);
         },
         error: (event) => {
             initCss(color1, color2);
         }
     });


 }