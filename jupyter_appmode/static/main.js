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

        if (Jupyter.notebook.dirty) {
            dialog.modal({
                title : 'Unsaved changes.',
                body : 'This notebook has unsaved changes. Please save before going to Appmode.',
                buttons: {'OK': {'class' : 'btn-primary'}},
                notebook: Jupyter.notebook,
                keyboard_manager: Jupyter.keyboard_manager,
            });

        }else{
            // kill Jupyter session
            Jupyter.notebook.session.delete();

            // change URL
            var base_url = Jupyter.notebook.base_url;
            var prefix = base_url+"notebooks/"
            var path = window.location.pathname.substring(prefix.length);
            window.location.pathname = base_url+"apps/"+path;
        }
    }

    //==========================================================================
    function goto_normal_mode() {
        console.log("Appmode: going to normal mode.");
        var base_url = Jupyter.notebook.base_url;
        var prefix = base_url+"apps/"
        var path = window.location.pathname.substring(prefix.length);
        window.location.pathname = base_url+"notebooks/"+path;
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
            // continue intializtion only if appmode is active
            initialize_step4();
        }
    }

    //==========================================================================
    function initialize_step4() {
        console.log("Appmode: initialize_step4");

        if (Jupyter.notebook.trusted) {
            initialize_step5();
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

    //==========================================================================
    function initialize_step5() {
        console.log("Appmode: initialize_step5");
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
        $('#jupyer-appmode-leave').click(goto_normal_mode);

        // hide loading screen
        $('#jupyter-appmode-loader').slideUp();

        console.log("Appmode: initialization finished");
    }

    //==========================================================================
    var load_ipython_extension = function() {

        // add button to toolbar in case appmode is not enabled
        Jupyter.toolbar.add_buttons_group([{
            id : 'toggle_codecells',
            label : 'Switch to Application mode',
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