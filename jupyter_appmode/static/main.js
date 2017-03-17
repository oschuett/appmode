// toggle display of all code cells' inputs

define([
    'jquery',
    'base/js/namespace',
    'base/js/dialog',
    'base/js/events',
    'require',
], function(
    $,
    Jupyter,
    dialog,
    events,
    require
) {
    "use strict";

    //==========================================================================
    function update_url_state(enabled) {
        var l = window.location, s = l.search.slice(1);
        if (enabled) {
            if (s.split(/[&=]/).indexOf('appmode') === -1) {
                s += (s.length ? '&' : '') + 'appmode';
            }
        } else {
            var params = s.split('&');
            var idx = params.indexOf('appmode');
            if (idx !== -1) {
                params.splice(idx, 1);
            }
            s = params.join('&');
        }
        var url = l.protocol + '//' + l.host + l.pathname + (s.length ? '?' + s : '');
        window.history.replaceState(null, null, url);
    }
    
    //==========================================================================
    function goto_app_mode() {
        //TODO: check notbook is trusted
        console.log("Going to application mode.");
        update_url_state(true);
        $('body').addClass('jupyter-appmode');
        Jupyter.notebook.restart_run_all({confirm: false});
    }

    //==========================================================================
    function goto_normal_mode() {
        console.log("Going to normal mode.");
        update_url_state(false);
        $('body').removeClass('jupyter-appmode');
    }

    //==========================================================================
    function initialize () {
        var idx = window.location.search.slice(1).split(/[&=]/).indexOf('appmode');
        if (idx !== -1){
            if (Jupyter.notebook.trusted) {
                goto_app_mode();
            }else{
                dialog.modal({
                    title : 'Untrusted notebook',
                    body : 'This notebook is not trusted, so appmode will not automatically start. You can still start it manually, though.',
                    buttons: {'OK': {'class' : 'btn-primary'}},
                    notebook: Jupyter.notebook,
                    keyboard_manager: Jupyter.keyboard_manager,
                });
            }
        }
    }

    //==========================================================================
    var load_css = function (name) {
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = require.toUrl(name);
        document.getElementsByTagName("head")[0].appendChild(link);
    };
    
    //==========================================================================
    var load_ipython_extension = function() {
        load_css("./main.css");
        var quit_button = $('<button id="jupyer-appmode-quit" class="btn btn-default" title="Switch to Jupyter mode">Jupyter&raquo;</button>');
        $('body').append(quit_button);
        quit_button.click(goto_normal_mode);
        
        Jupyter.toolbar.add_buttons_group([{
            id : 'toggle_codecells',
            label : 'Switch to application mode',
            icon : 'fa-arrows-alt',
            callback : goto_app_mode
        }]);
        
        if (Jupyter.notebook !== undefined && Jupyter.notebook._fully_loaded) {
            // notebook_loaded.Notebook event has already happened
            initialize();
        }
        events.on('notebook_loaded.Notebook', initialize);
    };

    return {
        load_ipython_extension : load_ipython_extension
    };
});