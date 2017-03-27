// toggle display of all code cells' inputs

define([
    'jquery',
    'base/js/namespace',
    'base/js/dialog',
    'base/js/events',
    'base/js/utils',
    'require',
], function(
    $,
    Jupyter,
    dialog,
    events,
    utils,
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
    
    var normal_unload_handler = window.onbeforeunload;

    //==========================================================================
    var appmode_unload_handler = function (e) {
        // Jupyter.notebook.session.delete()// doesn't work because it's asyncrounous
        // see notebook/static/services/sessions/session.js
        var s = Jupyter.notebook.session;
        if (s.kernel) {
            s.events.trigger('kernel_killed.Session', {session: s, kernel: s.kernel});
            s.kernel._kernel_dead();
        }
        utils.ajax(s.session_url, {
            processData: false,
            cache: false,
            type: "DELETE",
            dataType: "json",
            async: false
        });
    };

    //==========================================================================
    function goto_app_mode() {
        //TODO: check notbook is trusted
        console.log("Appmode: going to application mode.");
        update_url_state(true);
        $('body').addClass('jupyter-appmode');

        //Jupyter.notebook.restart_run_all({confirm: false});

        var promise = Jupyter.notebook.restart_kernel({confirm: false});

        // temporary hack to access url until I have a suitable widget
        promise.then(function(value) {
           Jupyter.notebook.kernel.execute("jupyter_notebook_url = '" + window.location + "'");
           Jupyter.notebook.execute_all_cells();
        });

        // disable code editing
        $('.CodeMirror').each(function() {
            this.CodeMirror.setOption('readOnly', "nocursor");
        });

        // install unload handler which simply kills the kernel
        window.onbeforeunload = appmode_unload_handler;
    }

    //==========================================================================
    function goto_normal_mode() {
        console.log("Appmode: going to normal mode.");
        update_url_state(false);
        $('body').removeClass('jupyter-appmode');

        // enable code editing
        $('.CodeMirror').each(function() {
            this.CodeMirror.setOption('readOnly', false);
        });

        // install normal unload handler
        window.onbeforeunload = normal_unload_handler;
    }

    //==========================================================================
    function initialize_step1() {

        if (Jupyter.notebook !== undefined && Jupyter.notebook._fully_loaded) {
            // notebook_loaded.Notebook event has already happened
            initialize_step2();
        }

        events.on('notebook_loaded.Notebook', initialize_step2);
    }

    //==========================================================================
    function initialize_step2() {
        var idx = window.location.search.slice(1).split(/[&=]/).indexOf('appmode');
        if (idx !== -1){
            if (Jupyter.notebook.trusted) {
                initialize_step3();
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
    function initialize_step3() {
        if (!utils.is_loaded('jupyter-js-widgets/extension')) {
            setTimeout(initialize_step3, 100);
            console.log("Appmode: waiting until ipywidgets are loaded");
        }else{
            goto_app_mode();
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
                   
        var logo_url = require.toUrl("./Mark.png");
        html  = '<div id="jupyter-appmode-header">'
        html += '<img id="matcloud-logo" src="'+logo_url+'">'
        html += '<button id="jupyer-appmode-quit" title="Switch to Jupyter mode">Jupyter&raquo;</button>';
        html += '</div>';
        $('#header').append(html);
        $('#jupyer-appmode-quit').click(goto_normal_mode);
        
        html = '<button id="jupyer-appmode-start" class="btn btn-sm navbar-btn">App Mode&raquo;</button>'
        $('#header-container').prepend(html);
        $('#jupyer-appmode-start').click(goto_app_mode);

        //Jupyter.toolbar.add_buttons_group([{
        //    id : 'toggle_codecells',
        //    label : 'Switch to application mode',
        //    icon : 'fa-arrows-alt',
        //    callback : goto_app_mode
        //}]);

        initialize_step1();

        //TODO make temp copy of notebook behind the scene
        //Notebook.prototype.copy_notebook 
        //notebook.load_notebook(common_options.notebook_path);
    };

    return {
        load_ipython_extension : load_ipython_extension
    };
});