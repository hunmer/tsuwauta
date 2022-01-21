var g_recorder = {
    cache: {
        startRecord: 0,
        endRecord: 0,
        recordTimer: 0,
    },
    audio: $('#recoder')[0],
    chunks: [],
    mediaRecorder: undefined,
    sendRecord: () => {
        var reader = new FileReader();
        reader.readAsDataURL(chunks[0]);
        reader.onloadend = function() {
            // queryMsg({ type: 'voice', user: g_config.user.name, msg: reader.result });
            // closeModal('modal-custom', 'voice', () => {
            //     halfmoon.toggleModal('modal-custom')
            // });
        }
    },
    showUi: () => {
        $('#modal-custom').find('.modal-title').html('録音');
        $('#modal-custom').attr('data-type', 'voice').find('.modal-html').html(`
                <div class="row">
                    <div class="progress col-12" data-audio="record">
                        <div class="progress-bar" id='record_progress' role="progressbar" style="width: 0%" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    <div class="col-12 mt-3">
                        <span class="float-left" id='record_start'>00:00</span>
                        <span class="float-right" id='record_end'>`+$('[data-action="recorded_time"]').html()+`</span>
                    </div>
                    <div class="col-12 mt-10 text-center">
                        <i class="bi bi-trash float-left text-danger" style="font-size: 2.5rem;" aria-hidden="true" onclick="g_recorder.record_reset()"></i>
                        <i class="bi bi-play-circle" style="font-size: 2.5rem;" aria-hidden="true" data-action="record_play"></i>
                        <i class="bi bi-download  float-right" style="font-size: 2.5rem;" aria-hidden="true" data-action="record_download"></i>
                    </div>
                </div>`);
        $('#modal-custom').find('.close').on('click', () => {
            g_recorder.audio.pause();
            g_recorder.record_reset(false)
        });
        halfmoon.toggleModal('modal-custom');
    },

    startRecord: () => {
        if($('[data-action="recorded_time"]').html() != '00:00'){
            return g_recorder.showUi();
        }
        g_recorder.audio.pause();
        chunks = [];
        $('[data-action="recorded_icon"]').addClass('badge-primary');
        // $('#record_start, #record_end').html('00:00');
        // $('#record_progress').css('width', '0%');
        g_recorder.cache.startRecord = getNow(false);
        g_recorder.mediaRecorder.start();
        soundTip('./res/di.mp3');

        g_recorder.cache.recordTimer = setInterval(() => {
            var s = getNow() - parseInt(g_recorder.cache.startRecord);
            $('[data-action="recorded_time"]').html(getTime1(s));
        }, 250);
    },

    isRecording: () => {
        return g_recorder.mediaRecorder.state == "recording";
    },

    stopRecord: (play = true, finish = true) => {
        if (g_recorder.isRecording()) {
            clearInterval(g_recorder.cache.recordTimer);
        $('[data-action="recorded_icon"]').removeClass('badge-primary');
            g_recorder.cache.endRecord = getNow(false);
            g_recorder.cache.play = play;
            g_recorder.mediaRecorder.stop();
            if(finish) g_recorder.showUi();
        }
    },

    switchRecord: () => {
        if (!g_recorder.isRecording()) {
            g_recorder.startRecord();
        } else {
            g_recorder.stopRecord();
        }
    },

    record_reset: (close = true) => {
           $('[data-action="recorded_time"]').html('00:00');
           if(close) halfmoon.toggleModal('modal-custom');
    },
    inited: false,
    init: (callback) => {
        if(g_recorder.inited) return callback();
        g_recorder.inited = true;
        if (navigator.mediaDevices.getUserMedia) {
            const constraints = { audio: true };
            navigator.mediaDevices.getUserMedia(constraints).then(
                stream => {

                     registerAction('record_download', (dom, action, params) => {
                        downloadImg( g_recorder.audio.src, '(recored)' + document.title);
                        halfmoon.toggleModal('modal-custom');
                     });

                     registerAction('record_play', (dom, action, params) => {
                        if($(dom).hasClass('bi-pause-circle')){
                            g_recorder.audio.pause();
                        }else{
                            g_recorder.audio.play();
                        }
                     });
                     
                     

                    g_recorder.mediaRecorder = new MediaRecorder(stream);
                    g_recorder.mediaRecorder.ondataavailable = e => {
                        chunks.push(e.data);
                    };

                    g_recorder.mediaRecorder.onstop = e => {
                        if (g_recorder.cache.play) {
                            var blob = new Blob(chunks, { type: "audio/wav; codecs=opus" });
                            var audioURL = window.URL.createObjectURL(blob);
                            g_recorder.audio.src = audioURL;
                        }
                    };


                    g_recorder.audio.ontimeupdate = (event) => {
                        var s = event.srcElement.currentTime;
                        closeModal('modal-custom', 'voice', () => {
                            $('#record_start').html(getTime1(parseInt(s)));
                        })
                        $('#modal-custom .progress-bar').css('width', parseInt(s / event.srcElement.duration * 100) + '%');
                    }

                    g_recorder.audio.onplay = () => {
                        $('[data-action="record_play"]').prop('class', 'bi bi-pause-circle');
                    }
                    g_recorder.audio.onpause = () => {
                        $('[data-action="record_play"]').prop('class', 'bi bi-play-circle');

                    }
                    callback();
                },
                () => {
                    g_recorder.error("授权失败！");
                }
            );
        } else {
            g_recorder.error("浏览器不支持 getUserMedia");
        }
    },
    error: (msg) => {
                    $('[data-action="recorder"]').removeClass('hide');

    }
}

function getNow(b = true) {
    var i = new Date().getTime() / 1000;
    if (b) i = parseInt(i);
    return i;
}


