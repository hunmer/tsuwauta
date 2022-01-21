var g_player = {
    lrc: [],
    last_lrctime: 0,
    lrc_lines: [],
    data: undefined,
    audio: $('#music')[0],
    init: () => {
        g_player.audio.onerror = (e) => {
            if(!g_player.audio.src) return;
            if(!g_player.audio.errored ){
                if(connection && connection.readyState == 1) return;
                g_player.audio.errored = true;
                g_player.audio.src = g_player.getPlayerUrl();
            }
        }
        g_player.audio.onloaded = (e) => {
            delete g_player.audio.errored;
        }

        g_player.audio.ontimeupdate = (e) => {
            g_player.updateTime(g_player.audio.currentTime, g_player.audio.duration);

        }
        g_player.audio.onended = (e) => {
            g_player.audio.currentTime = 0;
            g_player.audio.play();
        }

    },
    updateTime: (now, max) => {
        g_cache.max = max;
        if (g_cache.scrollTime) {
            g_cache.scrollTime -= 1;
            return;
        }
        $('#progress_music').css('width', Math.round(now / max * 100) + '%');

        var d;
        for (let i = g_player.lrc.length; i > 0; i--) {
            d = g_player.lrc[i - 1];
            if (d.time <= now) {
                if (g_player.last_lrctime != d.time) {
                    g_player.toTime(d.time);
                }
                return;
            }
        }
    },

    getKey: () => {
        return g_player.data.source+'_'+ g_player.data.id;
    },
    toTime: (time, animation) => {
        g_player.last_lrctime = time;
        $('.lyric_layout').remove();
        $('.active[data-time]').removeClass('active');
        if(!time) return;
        var div = $('[data-time="' + time + '"]').addClass('active');
        if (!div.length) return;
        var next = div.next();
        $('[data-action="replay"]').css('display', next.length ? 'none' : 'unset');


        var lyric = div.find('.lyric');
        var lrc = lyric.find('.lrc');
        var endTime = Number(next.length ? next.attr('data-time') : g_cache.max);
        $(lyric.html()).addClass('lyric_layout').css('left', lrc[0].offsetLeft + 'px').appendTo(lyric);
        $.keyframe.define([{
            name: 'lyric',
            '0%': { width: "0px" },
            '100%': { width: lrc.width() + "px" },
        }]);


        $('.lyric_layout').playKeyframe({
            name: 'lyric',
            duration: (Number(endTime - time).toFixed(1)) + 's',

        });

        g_player.updateScroll(animation);
    },
    setCurrentTime: (time) => {
        if (time < 0) time = 0;
        if (g_player.audio.readyState == 0) {
            queryMsg({ type: 'setPos', data: time });
        } else {
            g_player.audio.currentTime = time;
        }
    },
    parseUrl: (url) => {
        if (!url) url = prompt('link', 'https://open.spotify.com/track/3vR2rJExXg1H5jdh81G9vc?si=989081f41bcd4a40');
        if (!url || url == '') return;
        // https://open.spotify.com/track/3vR2rJExXg1H5jdh81G9vc?si=989081f41bcd4a40
        for (var d of [{
                s: 'server=muffon&type=song&track_id={id}&source_id=spotify',
                a: 'open.spotify.com/track/',
                b: '?si=',
            }]) {
            var id = cutString(url, d.a, d.b);
            if (id != '') {
                $.getJSON(g_api + 'music.php?' + d.s.replace('{id}', id), function(json, textStatus) {
                    if (textStatus == 'success') {
                        g_player.setPlaying(json);
                    }
                });

            }
        }
    },


  initSigner: (datas) => {
       g_cache.signer = datas;
    for(var time in datas){
        var div = $('li.list-group-item[data-time="'+time+'"]').find('.hover-show-child');
                var h = '';
                for(var user of datas[time]){
                    h += `<img src="res/`+user+`.jpg" class="singer">`
                }
                div.addClass('show').html(h);
    }
 },

    setPlaying: (json, audio = true, utaten = false) => {
            delete g_player.audio.errored;
        
        $('.singer').removeClass('singer');
        var key = json['source'] + '_' + json['id'];
        g_player.last_lrctime = 0;
        $('#div_player ul').html('').prop('scrollTop', 0)
        $('.lyric_layout').remove();
        $('[data-action="play"]').find('i').attr('class', 'bi bi-pause font-size-20');
        $('#songName').html(json['name']);
        $('#artistName').html(json['artist']);
        $('#input_utaten, #input_genius').val(json['name']);
        g_player.data = json;
        document.title = json['name'];
        $('#cover').attr('src', json['pic']);
        $('#progress_music').css('width', '0%');
        if (audio) {
            g_player.audio.src = g_player.getPlayerUrl(json);
            $('#input_search').val(json['name']);
            //queryMsg({ type: 'close' });
        } else {
            g_player.audio.src = '';

        }
        if (utaten) {
            g_player.lrc = utaten;
            g_player.initLyric();
        } else {

            g_player.searchLyric(json);
        }

        var signer = {};
        $('#favorite').attr('data-action', 'favorite,' + key).find('i').attr('class', 'bi text-danger bi-heart');
        if (g_favorite[key]) {
            $('[data-action="favorite,' + key + '"] i').attr('class', 'bi text-danger bi-heart-fill');
           // if(g_favorite[key].signer) signer =g_favorite[key].signer;          
        }


         if(!signer && json.signer) signer = json.signer;
        g_player.initSigner(signer);
        checkBgBlur();
      
    },

    searchGeniusLyric: (s) => {
        if (!s) s = $('#input_genius').val();
        $('#input_genius').prop('disabled', 1);
        $('#genius_result').html('');

        $.getJSON(g_api + 'music.php?type=lyric&server=muffon&name=' + s, function(json, textStatus) {
            $('#input_genius').prop('disabled', 0);

            if (textStatus == 'success') {
                var h = '';
                for (var d of json) {
                    h += `<div class="card sponsor-section-card mw-full m-0 p-0 d-flex" rel="noopener" data-json='` + JSON.stringify(d) + `'>
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
            <button class="btn btn-success btn-square rounded-circle mt-10 float-right" onclick="g_player.fetchGenuisLyric(` + d.id + `)"><i class="bi bi-check-circle font-size-20"></i></button>
        </div>
    </div>
</div>`;
                }
                $('#genius_result').html(h).find('.lazyload').lazyload();
            }
        });
    },

    fetchGenuisLyric: (id) => {
        $.getJSON(g_api + 'music.php?server=genius&id=' + id, function(json, textStatus) {
            if (textStatus == 'success') {
                g_lyric[g_player.data.source + '_' + g_player.data.id] = json;
                //g_lyric[key].name = data.name;
                local_saveJson('lyric', g_lyric);
                var h = '';
                for (var lrc of json['lyric'].split("\n")) {
                    h += '<li>' + lrc + '</li>';
                }
                $('#div_player ul').html(h);
                halfmoon.toggleModal('modal-custom');
            }
        });
    },

    getPlayerUrl: (json) => {
        if (!json) json = g_player.data;
        if(location.host == '127.0.0.1' && !g_player.audio.errored){
            return './client/download/'+json['source']+'_'+json['id']+'.mp3';
        }
        //if (json['url']) return json['url'];
        if (json['source'] == 'muffon') {
            return g_api + 'music.php?server=muffon&type=url&track_id=' + json.meta['track_id'] + '&source_id=' + json.meta['source_id'];
        }
        return json['url'] ? json['url'] : g_api + 'music.php?server=' + json['source'] + '&type=url&id=' + json['id']
    },

    updateScroll: (animation = 800, b = true) => {
        var con = $('#div_player ul').scroll();
        var top = $('.active[data-time]');
        if (!top.length) return;
        if (b && $('li:hover').length) return;
        top = top[0].offsetTop + top.height() / 2;
        if (top) {
            if (top <= con.height() / 2) {
                top = 0;
            } else {
                top -= con.height();
            }
            $(con).stop().animate({
                scrollTop: top
            }, { duration: animation, easing: "swing" });
        }
    },
    searchUtaten: (name) => {
        if (!name) return;
        $('#utaten_result').html('<h4 class="text-center">読み込み中...</h4>');
        $.getJSON(g_api + 'utaten.php?name=' + name, function(json, textStatus) {
            html = '';
            for (let detail of json) {
                html += `
                <div class="card" >
                  <h2 class="card-title">
                    ` + detail['name'] + `/` + detail['artist'] + `
                  </h2>
                  <p>
                    ` + detail['lyric'] + `
                  </p>
                  <div class="text-right">
                    <a onclick="g_player.searchUtatenContent('` + detail['url'] + `', '` + name + `');" class="btn" data-toggle="tooltip" data-title="選択">✔</a>
                  </div>
                </div>
                `;
            }
            $('#utaten_result').html(html);
            $(window).resize();
        });
    },

    searchUtatenContent: (url, name) => {
        if (!url) return;
        toastPAlert('読み込み中...', 'alert-primary', 2000);
        $.getJSON(g_api + 'getUtatenLyric.php?url=' + url, function(json, textStatus) {
            if (textStatus == 'success') {
                //$('#utaten_result').html('');
                $('[data-action="show,query"]')[0].click();
                var key = g_player.data.source + '_' + g_player.data.id;
                g_utaten[key] = json;
                g_utaten[key].name = name;
                local_saveJson('utaten', g_utaten);

                g_player.initUtatenContent(json);
            }


        });
    },

    initUtatenContent: (json) => {
        g_player.utaten = json;
        var replaces = [];

        var lrc = g_player.lrc_lines.join("\n");
        var i = 0;
        for (var kanji of json.hiragana.kanji) {
            lrc = lrc.replace(kanji, '{{' + (replaces.push(i) - 1) + '}}')
            i++;
        }
        for (var i = 0; i < replaces.length; i++) {
            lrc = lrc.replace('{{' + i + '}}', '<span class="ruby"><span class="rb">' + json.hiragana.kanji[replaces[i]] + '</span><span class="rt">' + json.hiragana.japanese[replaces[i]] + '</span></span>');
        }
        var lrcs = lrc.split("\n");
        for (var i in g_player.lrc) {
            g_player.lrc[i].m1 = lrcs[i];
        }
        g_player.initLyric();
        queryMsg({ type: 'utaten', data: g_player.lrc })
    },

    search: (name) => {
        $('#input_search').val(name);
        $('[data-action="show,search"]')[0].click();
        $('#div_search .collapse-group').html('');
        $('#div_search h4').removeClass('hide');
        // 'xiami', baidu
        // , '
        for (let site of ['netease', 'tencent', 'kugou', 'youtube', 'spotify']) {
            $.getJSON(g_api + 'music.php?server=' + site + '&type=search&name=' + name, function(json, textStatus) {
                var cnt = Object.keys(json).length;
                if (textStatus == 'success' && cnt > 0) {
                    // console.log(site, json)
                    var html = `
                    <details data-server="` + site + `" class="collapse-panel" ` + (site == 'netease' ? 'open' : '') + `>
                    <summary class="collapse-header">
                      <strong>` + site + `</strong>
                        <span class="badge badge-success float-right">` + cnt + `</span>
                    </summary>
                    <div class="collapse-content">`;

                    for (let detail of json) {
                        if (typeof(detail['artist']) == 'object') {
                            detail['artist'] = detail['artist'].join('&');
                            detail['pic'] = g_api + 'music.php?server=' + site + '&type=cover&id=' + detail['pic_id'];
                        } else { // youtube spotify
                            detail['album'] = ''; // 没有专辑信息
                        }

                        html += `<div class="card sponsor-section-card w-full m-0 p-0 d-flex" rel="noopener" data-json='` + JSON.stringify(detail) + `'>
                        <div class="w-100 h-100 m-10 align-self-center">
                            <div class="w-100 h-100 rounded d-flex align-items-center justify-content-center" data-action="preview">
                                    <i class="bi bi-play text-white font-size-20" aria-hidden="true" style="position: relative;left: 70px;"></i>
                                <img data-src="` + detail['pic'] + `" class="w-100 h-100 lazyload">
                            </div>
                        </div>
                        <div class="flex-grow-1 overflow-hidden d-flex align-items-center position-relative h-120">
                            <div class="p-10 w-full m-auto">
                                <p class="font-size-10 text-dark-lm text-light-dm m-0 mb-5 text-truncate font-weight-medium">
                                     ` + detail['name'] + `
                                </p>
                                <p class="font-size-12 mt-5 mb-0 text-muted">
                                     ` + detail['artist'] + `
                                </p>
                                    <div class="progress mt-10 mb-10 hide">
                                                          <div class="progress-bar progress-bar-animated" role="progressbar" style="width: 0%" aria-valuenow="80" aria-valuemin="0" aria-valuemax="100"></div>
                                                        </div>
                                                        <div class="float-right">` + (site != 'youtube' ? `<span data-action="applyLyric,false" data-placement="left" data-toggle="tooltip" data-title="歌詞"><i class="bi bi-file-text font-size-20"></i></span>` : '') + `
                                                        
                                                        <button class="btn btn-success btn-square rounded-circle" data-action="addToQuery"  data-placement="left" data-toggle="tooltip" data-title="追加"><i class="bi bi-plus-circle font-size-20"></i></button>

                                  </div>

                            </div>
                            <div class="sponsor-section-card-scroll-block"></div>
                        </div>
                    </div>`;
                    }
                    html += '</div></details>';
                    var div = $('#div_search .collapse-group')
                    div.find('[data-server="' + site + '"]').remove();
                    div.append(html).find('.lazyload').lazyload();
                    $(window).resize();
                }
                $('#div_search h4').addClass('hide');
            });
        }

    },
    searchLyric: (data, cache = true) => {
        var key = data['source'] + '_' + data['id'];
        if (cache && g_lyric[key]) {
            return g_player.parseLyric(g_lyric[key], data);
        }
        var s = ``
        //if (g_player.data && key == g_player.data['source'] + '_' + g_player.data['id']) return g_player.initLyric();
        $('#div_player ul').html('<li><h3 class="text-center">読み込み中...</h3></li>');
        var url = g_api + 'music.php?server=' + data['source'] + '&type=lyric&id=' + data['id'];
        $.ajax({
                url: url,
                dataType: 'json',
            })
            .done(function(json) {
                if (json.lyric != undefined) {
                    g_lyric[key] = json;
                    g_lyric[key].name = data.name;
                    local_saveJson('lyric', g_lyric);
                    g_player.parseLyric(json, data);
                }
            })
            .fail(function() {
                for (var k in g_lyric) {
                    if (g_lyric[k].name.indexOf(data.name) != -1 || data.name.indexOf(g_lyric[k].name) != -1) {
                        return g_player.parseLyric(g_lyric[k], data);
                    }
                }
                $('#div_player ul').html(`<li><h3 class="text-center" onclick="showContent('search')">歌詞探す！</h3></li>`);
            })
    },

    parseLyric: (json, data) => {
        g_player.lrc = [];
        g_player.lrc_lines = [];
        var lrc = {},
            tlrc, time, detail;
        if (json.lyric) lrc = json.lyric.split("\n");
        if (json.tlyric) tlrc = json.tlyric.split("\n");
        for (let i in lrc) {
            time = getText(lrc[i], '[', ']');
            detail = {
                time: getTime(time),
                lrc: lrc[i].replace('[' + time + ']', '').trim(),
                tlrc: undefined,
            };
            if (detail.lrc) { // 去除空文本
                g_player.lrc_lines.push(detail.lrc);
                if (tlrc) {
                    for (let t of tlrc) {
                        if (t.indexOf('[' + time + ']') == 0) {
                            detail.tlrc = t.replace('[' + time + ']', '');
                            break;
                        }
                    }
                }
                g_player.lrc.push(detail);
            }
        }
        if (g_config.utaten) {
            var key = data['source'] + '_' + data['id'];
            if (!g_utaten[key]) {
                for (var key in g_utaten) {
                    if (g_utaten[key] && g_utaten[key].name == data['name']) {
                        break;
                    }
                    key = undefined;
                }
            }
            if (g_utaten[key]) {
                g_player.initUtatenContent(g_utaten[key]);
                return;
            }
            showContent('utaten');
            $('[data-action=searchUtaten]')[0].click();
        }
        g_player.initLyric();
    },

    initLyric: () => {
        var b_tlrc = g_config.tlrc;
        let html = '';
        var len = g_player.lrc.length;
        for (let detail of g_player.lrc) {
            lrc = g_config.utaten && detail.m1 ? detail.m1 : detail.lrc;
            html += `
          <li class="list-group-item p-10" data-time="` + detail.time + `">
            <div class="row">
                <div class="col-1 hover-show-parent" data-action="setSigner">
                    <div class="hover-show-child">
                       <i class="bi bi-plus-circle text-primary"></i>
                    </div>
                </div>
                <div class="col-11 lyric" data-action="setPos">
                    <span class="lrc">` + lrc + `</span>
                    ` + (detail.tlrc != undefined && detail.tlrc != '' && b_tlrc ? '</br><span class="tlrc">' + detail.tlrc + '</span>' : '') + `
                </div>
               
            </div>
          </li>`;
        }
        $('#div_player ul').html(html);
        initFont();
        g_player.toTime(g_player.last_lrctime, 0);
        $(window).resize();

    }
}
g_player.init();