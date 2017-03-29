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
        
        //TODO: remove notebook as well, but check that it has expected name
    };

    //==========================================================================
    function goto_app_mode() {
        var base_url = Jupyter.notebook.base_url;
        var prefix = base_url+"notebooks/"
        var path = window.location.pathname.substring(prefix.length); 
        window.location.pathname = base_url+"apps/"+path;
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
    function initialize_step1() {

        if (Jupyter.notebook !== undefined && Jupyter.notebook._fully_loaded) {
            // notebook_loaded.Notebook event has already happened
            initialize_step2();
        }

        events.on('notebook_loaded.Notebook', initialize_step2);
    }

    //==========================================================================
    function initialize_step2() {
        var base_url = Jupyter.notebook.base_url;
        if(window.location.pathname.startsWith(base_url+"apps/")){
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
            initialize_step4()
        }
    }

    //==========================================================================
    function initialize_step4() {
        console.log("Appmode: intializing.");
        
        // disable autosave
        Jupyter.notebook.set_autosave_interval(0);

        // temporary hack to access url until I have a suitable widget
        Jupyter.notebook.kernel.execute("jupyter_notebook_url = '" + window.location + "'");

        Jupyter.notebook.clear_all_output();
        
        Jupyter.notebook.execute_all_cells();
           
        // disable code editing
        $('.CodeMirror').each(function() {
            this.CodeMirror.setOption('readOnly', "nocursor");
        });

        // install unload handler which simply kills the kernel
        window.onbeforeunload = appmode_unload_handler;
        
        $('#jupyer-appmode-leave').click(goto_normal_mode);
        
        // hide loading screen
        setTimeout(function (){
                $('#jupyter-appmode-loader').slideUp();
        }, 2000); //two seconds should be enough for most cases

    }
        
    //==========================================================================
    var load_ipython_extension = function() {
        //html = '<button id="jupyer-appmode-start" class="btn btn-sm navbar-btn">App Mode&raquo;</button>'
        //$('#header-container').prepend(html);
        //$('#jupyer-appmode-start').click(goto_app_mode);

        Jupyter.toolbar.add_buttons_group([{
            id : 'toggle_codecells',
            label : 'Switch to Application mode',
            icon : 'fa-arrows-alt',
            callback : goto_app_mode
        }]);

        initialize_step1();
    };

    return {
        load_ipython_extension : load_ipython_extension
    };
});