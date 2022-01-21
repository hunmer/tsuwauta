
halfmoon._toggleSidebar= halfmoon.toggleSidebar;
halfmoon.toggleSidebar = () => {
    halfmoon._toggleSidebar();
    var btn = $('#closeSidebar');
    g_cache.hide = $('#page-wrapper').attr('data-sidebar-hidden') == 'hidden';
}


halfmoon._toggleModal= halfmoon.toggleModal;
halfmoon.toggleModal = (id) => {
    halfmoon._toggleModal(id);
}

halfmoon._toggleDarkMode= halfmoon.toggleDarkMode;
halfmoon.toggleDarkMode = () => {
    halfmoon._toggleDarkMode();
    g_config.darkMode = $('body').hasClass('dark-mode');
    local_saveJson('config', g_config);
    checkBgBlur();
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

function hideSidebar() {
    if(!g_cache.hide){
        halfmoon.toggleSidebar();
    }
}

function setProgress(value, selector='.progress-bar') {
    $(selector).css('width', + value + '%');
}

function checkBgBlur(){
    if(!g_player.data) return;
    if(!$('.dark-mode').length){
        if(g_cache.blurImg != g_player.data['pic']){
               $('html').backgroundBlur({
                    blurAmount : 15, // 模糊度
                    imageClass : 'bg-blur',
                    overlayClass : 'tinted-bg-overlay',
                    duration: 1500, // 图片淡出时间
                }).backgroundBlur(g_player.data['pic']);
                 blurText();
                g_cache.blurImg = g_player.data['pic'];
            }
          
        }else{
            if( g_cache.css){
                 g_cache.css.remove();
                 delete  g_cache.css;
            }
            g_cache.blurImg = '';
          $('html').backgroundBlur('');
        }
}
// [data-toggle="tooltip"]
function initCss(color1, color2){
    g_cache.color1 = color1;
    g_cache.color2 = color2;
      //$(':root').css('--blur-border-color', color1);
                 g_cache.css = $(`<style>

                    body {
                        color: `+color1+`,
                    }
                .navbar button {
                     background-color: transparent;
                }

                 .navbar button i {
                    color: `+color1+` !important;
                 }


                .modal-full .modal-content {
                    background-color: `+color2+` !important;
                }

                input[type="text"] {
                    background-color: `+color1+`;
                    color: `+color2+`;
                }

                 input[type="text"]:focus {
                    background-color: `+color1+`;
                    color: `+color2+`;
                }

                :root {
                    --lm-muted-text-color: `+color1+`;
                    --lm-base-text-color: `+color1+`;
                    --gray-color-light: transparent;
                    --lm-sidebar-bg-color: transparent;
                    --lm-navbar-bg-color: transparent;
                    --lm-card-bg-color: transparent;
                }
                </style>`).appendTo('body');
}