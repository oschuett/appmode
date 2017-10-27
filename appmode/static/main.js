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
    var appmode_unload_handler = function (e) {
        console.log("Appmode: running unload handler");

        var nb = Jupyter.notebook;
        var url_parts = [nb.base_url, 'apps', nb.notebook_path];
        var url = utils.url_path_join.apply(null, url_parts);

        // tell server to clean up session, kernel, and tmp notebook file.
        utils.ajax(url, {cache: false, type: "DELETE", async: false});
    };

    //==========================================================================
    function goto_app_mode() {
        console.log("Appmode: going to app mode.");
        // kill Jupyter session
        Jupyter.notebook.session.delete();

        // build new URL
        var url = new URL(window.location.href);
        var base_url = Jupyter.notebook.base_url;
        var prefix = base_url+"notebooks/"
        var path = url.pathname.substring(prefix.length);
        url.pathname = base_url + "apps/" + path
        var scroll = $('#site').scrollTop();
        url.searchParams.set("appmode_scroll", scroll);

        // goto new URL
        window.location.href = url.href;
    }

    //==========================================================================
    function goto_normal_mode() {
        console.log("Appmode: going to normal mode.");

        // build new URL
        var url = new URL(window.location.href);
        var base_url = Jupyter.notebook.base_url;
        var prefix = base_url+"apps/"
        var path = url.pathname.substring(prefix.length);
        url.pathname = base_url + "notebooks/" + path

        // goto new URL
        window.location.href = url.href;
    }

    //==========================================================================
    function kernel_inject_url(kernel) {
        console.log("Appmode: injecting url into new kernel"); 
        kernel.execute("jupyter_notebook_url = '" + window.location + "'");
    }

    //==========================================================================
    function initialize_step1() {
        console.log("Appmode: initialize_step1");

        if (Jupyter.notebook && Jupyter.notebook._fully_loaded) {
            console.log("Appmode: notebook already loaded.");
            initialize_step2();
        }else{
            console.log("Appmode: waiting for notebook to load.");
            events.one('notebook_loaded.Notebook', initialize_step2);
        }
    }

    //==========================================================================
    function initialize_step2() {
        console.log("Appmode: initialize_step2");
        var nb = Jupyter.notebook

        //console.log("Appmode: nb.kernel:"+nb.kernel);
        //if(nb.kernel)
        //    console.log("Appmode: nb.kernel.info_reply:"+nb.kernel.info_reply.status);

        if(nb.kernel && nb.kernel.info_reply.status) {
            console.log("Appmode: kernel already ready.");
            initialize_step3();
        }else{
            console.log("Appmode: waiting for kernel_ready event.");
            events.one('kernel_ready.Kernel', initialize_step3);
        }
    }

    //==========================================================================
    function initialize_step3() {
        console.log("Appmode: initialize_step3");

        kernel_inject_url(Jupyter.notebook.kernel);

        // run kernel_inject_url() again when a new kernel is created
        events.on('kernel_created.Kernel kernel_created.Session', function(event, data) {
            kernel_inject_url(data.kernel);
        });

        var base_url = Jupyter.notebook.base_url;
        if(window.location.pathname.startsWith(base_url+"apps/")){
            // appmode is active -> continue intializtion
            initialize_step4();
        }else{
            // normal mode is active -> scroll to last position
             var url = new URL(window.location.href);
             var scroll = url.searchParams.get("appmode_scroll");
             $('#site').scrollTop(scroll);
        }
    }

    //==========================================================================
    function initialize_step4() {
        console.log("Appmode: initialize_step4");
        //console.log("Appmode info_reply.status: "+Jupyter.notebook.kernel.info_reply.status);

        // disable autosave
        Jupyter.notebook.set_autosave_interval(0);

        // run all cells
        Jupyter.notebook.clear_all_output();
        Jupyter.notebook.execute_all_cells();

        // disable code editing
        $('.CodeMirror').each(function() {
            this.CodeMirror.setOption('readOnly', "nocursor");
        });

        // install unload-handler
        window.onbeforeunload = appmode_unload_handler;

        // register on_click handler
        $('#appmode-leave').click(goto_normal_mode);

        // hide loading screen
        $('#appmode-loader').slideUp();

        console.log("Appmode: initialization finished");
    }

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