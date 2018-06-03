# -*- coding: utf-8 -*-

__version__ = '0.4.0'

# Jupyter Extension points
def _jupyter_nbextension_paths():
    return [dict(
        section="notebook",
        src="static",
        dest="appmode",
        require="appmode/main")]

def _jupyter_server_extension_paths():
    return [{"module":"appmode.server_extension"}]

#EOF
