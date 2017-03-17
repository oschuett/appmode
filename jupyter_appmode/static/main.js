// toggle display of all code cells' inputs

define([
    'jquery',
    'base/js/namespace',
    'base/js/events',
    'require',
], function(
    $,
    Jupyter,
    events,
    require,
    toolbarTemplate
) {
    "use strict";
//
//    function set_input_visible(show) {
//        var appmodeClass = 'jupyter-appmode';
//        if(show){
//            $('body').removeClass(appmodeClass);
//        }else{
//            $('body').addClass(appmodeClass);
//            //alert(toolbarTemplate);
//            //toolbarTemplate.clone().prependTo($('body'));
//        }
//        Jupyter.notebook.metadata.hide_input = !show;
//        
//        //if (show) $('div#header').show('slow');
//        //else $('div#header').hide('slow');
//        //
//        var btn = $('#toggle_codecells');
//        btn.toggleClass('active', !show);
//        //
//        var icon = btn.find('i');
//        icon.toggleClass('fa-eye', show);
//        icon.toggleClass('fa-eye-slash', !show);
//        $('#toggle_codecells').attr(
//           'title', (show ? 'Hide' : 'Show') + ' codecell inputs');
//    }
//
    function toggle() {
        //alert("toggle called");
        set_input_visible($('#toggle_codecells').hasClass('active'));
    }

    function goto_app_mode() {
        $('body').addClass('jupyter-appmode');
    }

    function goto_normal_mode() {
        $('body').removeClass('jupyter-appmode');
    }

    //function initialize () {
    //    set_input_visible(Jupyter.notebook.metadata.hide_input !== true);
    //}

    var load_css = function (name) {
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = require.toUrl(name);
        document.getElementsByTagName("head")[0].appendChild(link);
    };

    var load_ipython_extension = function() {
        load_css("./main.css");
        //<button class="btn btn-default" title="Switch to application mode" id="toggle_codecells"><i class="fa-arrows-alt fa"></i></button>
        //var quit_button = $('<div id="jupyer-appmode-quit">Jupyter Mode &raquo;</div>');
        var quit_button = $('<button id="jupyer-appmode-quit" class="btn btn-default" title="Switch to Jupyter mode" id="toggle_codecells">Jupyter&raquo;</button>');
        $('body').append(quit_button);
        quit_button.click(goto_normal_mode);
        
        Jupyter.toolbar.add_buttons_group([{
            id : 'toggle_codecells',
            label : 'Switch to application mode',
            icon : 'fa-arrows-alt',
            callback : goto_app_mode
        }]);
        //if (Jupyter.notebook !== undefined && Jupyter.notebook._fully_loaded) {
        //    // notebook_loaded.Notebook event has already happened
        //    initialize();
        //}
        //events.on('notebook_loaded.Notebook', initialize);
    };

    return {
        load_ipython_extension : load_ipython_extension
    };
});
