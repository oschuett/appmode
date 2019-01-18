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
    var appmode_unload_handler = function (e) {
        var nb = Jupyter.notebook;
        var url_parts = [nb.base_url, 'apps', nb.notebook_path];
        var url = utils.url_path_join.apply(null, url_parts);

        // tell server to clean up session, kernel, and tmp notebook file.
        utils.ajax(url, {cache: false, type: "DELETE", async: false});
    };

    //==========================================================================
    var kernel_busy_handler = function (e) {
        $('#appmode-busy').css('visibility', 'visible');
    }

    //==========================================================================
    var kernel_idle_handler = function (e) {
        $('#appmode-busy').css('visibility', 'hidden');
    }

    //==========================================================================
    function goto_app_mode() {
        // kill Jupyter session
        Jupyter.notebook.session.delete();

        // build new URL
        var base_url = Jupyter.notebook.base_url;
        var prefix = base_url+"notebooks/"
        var path = window.location.pathname.substring(prefix.length);
        var search = window.location.search;
        var scroll = "appmode_scroll=" + $('#site').scrollTop();
        if (search.search(/appmode_scroll=\d+/) != -1){
            search = search.replace(/appmode_scroll=\d+/g, scroll);
        }else if (search.length == 0) {
            search = "?" + scroll;
        } else {
            search += "&" + scroll;
        }

        // goto new URL
        window.location.href = base_url + "apps/" + path + search;
    }

    //==========================================================================
    function goto_normal_mode() {
        // build new URL
        var base_url = Jupyter.notebook.base_url;
        var prefix = base_url+"apps/"
        var path = window.location.pathname.substring(prefix.length);
        var new_url = base_url + "notebooks/" + path + window.location.search;

        // goto new URL
        // Not using location.pathname as it might urlencode the path again
        window.location.href = new_url;
    }

    //==========================================================================
    function kernel_inject_url(kernel) {
        kernel.execute("jupyter_notebook_url = '" + window.location + "'");
    }

    //==========================================================================
    function initialize_step1() {
        if (Jupyter.notebook && Jupyter.notebook._fully_loaded) {
            initialize_step2();
        }else{
            events.one('notebook_loaded.Notebook', initialize_step2);
        }
    }

    //==========================================================================
    function initialize_step2() {
        // scroll to last position if in normal mode
        var base_url = Jupyter.notebook.base_url;
        if(window.location.pathname.startsWith(base_url+"notebooks/")){
             var url = window.location.href;
             var m = url.match(/appmode_scroll=(\d+)/);
             if(m)
                $('#site').scrollTop(m[1]);
        }

        var nb = Jupyter.notebook;
        if(nb.kernel && nb.kernel.info_reply.status) {
            initialize_step3();
        }else{
            events.one('kernel_ready.Kernel', initialize_step3);
        }
    }

    //==========================================================================
    function initialize_step3() {
        kernel_inject_url(Jupyter.notebook.kernel);

        // run kernel_inject_url() again when a new kernel is created
        events.on('kernel_created.Kernel kernel_created.Session', function(event, data) {
            kernel_inject_url(data.kernel);
        });

        var base_url = Jupyter.notebook.base_url;
        if(window.location.pathname.startsWith(base_url+"apps/")){
            // appmode is active -> continue intializtion
            initialize_step4();
        }
    }

    //==========================================================================
    function initialize_step4() {
        // install unload-handler
        window.onbeforeunload = appmode_unload_handler;

        // disable autosave
        Jupyter.notebook.set_autosave_interval(0);

        // disable keyboard shortcuts
        Jupyter.keyboard_manager.command_shortcuts.clear_shortcuts();
        Jupyter.keyboard_manager.edit_shortcuts.clear_shortcuts();

        // disable editing of text cells
        $('.text_cell').off("dblclick");

        // disable editing of raw cells
        $('.CodeMirror').each(function() {
            this.CodeMirror.setOption('readOnly', "nocursor");
        });

        // register kernel events
        events.on('kernel_idle.Kernel',  kernel_idle_handler);
        events.on('kernel_busy.Kernel',  kernel_busy_handler);

        // register on_click handler
        $('#appmode-leave').click(goto_normal_mode);

        // clear all cell outputs persisted in the initial notebook
        Jupyter.notebook.clear_all_output();
        // try to load the jupyter-js-widgets extension to see if it's installed
        utils.load_extension('jupyter-js-widgets/extension').then(function(module) {
            // force the extension to initialize if it exists, even if it's a repeat
            // operation, to avoid a race condition with executing cells that contain
            // widgets
            module.load_ipython_extension().then(initialize_step5);
        }).catch(initialize_step5);
    }

    //==========================================================================
    function initialize_step5() {
        // hide loading screen
        $('#appmode-loader').slideUp();
        // execute all cells
        Jupyter.notebook.execute_all_cells();
        console.log("Appmode: initialization finished");
    };

    //==========================================================================
    var load_ipython_extension = function() {

        // add button to toolbar in case appmode is not enabled
        Jupyter.toolbar.add_buttons_group([{
            id : 'toggle_codecells',
            label : 'Appmode',
            icon : 'fa-arrows-alt',
            callback : goto_app_mode
        }]);

        initialize_step1();
    };

    //==========================================================================
    return {
        load_ipython_extension : load_ipython_extension
    };
});