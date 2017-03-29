# -*- coding: utf-8 -*-

# Jupyter Extension points

def _jupyter_nbextension_paths():
    return [dict(
        section="notebook",
        src="static",
        dest="jupyter_appmode",
        require="jupyter_appmode/main")]

def _jupyter_server_extension_paths():
    return [{"module":"jupyter_appmode.server_extension"}]
    
#EOF