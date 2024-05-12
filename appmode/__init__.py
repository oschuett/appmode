# -*- coding: utf-8 -*-

__version__ = '1.0.0'

# Jupyter Extension points
def _jupyter_nbextension_paths():
    return [dict(
        section="notebook",
        src="static",
        dest="appmode",
        require="appmode/main")]

def _jupyter_server_extension_points():
    from .server_extension import Appmode

    return [{"module": "appmode.server_extension", "app": Appmode}]

#EOF
