require([
    'jquery',
    'require',
], function(
     $,
     require
) {

    var idx = window.location.search.slice(1).split(/[&=]/).indexOf('appmode');
    if (idx !== -1){
        gears_url = require.toUrl("nbextensions/jupyter_appmode/gears.svg");
   
        html  = '<style> #jupyter-appmode-loader {' +
                   'position: fixed;' +
                   'top: 0;' +
                   'width: 100%;' +
                   'height: 100%;' +
                   'background: #222222;' +
                   'z-index: 1000;' +
                   'display:flex;' +
                   'justify-content:center;' +
                   'align-items:center;' +
                '} </style>' +
                '<div id="jupyter-appmode-loader">' +
                '<img src="'+gears_url+'">' +
                '</div>';
        $('body').append(html);
    }                             
    
});