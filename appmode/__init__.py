# -*- coding: utf-8 -*-

try:
    from ._version import __version__
except ImportError:
    # Fallback when using the package in dev mode without installing
    # in editable mode with pip. It is highly recommended to install
    # the package from a stable release or in editable mode: https://pip.pypa.io/en/stable/topics/local-project-installs/#editable-installs
    import warnings
    warnings.warn("Importing 'appmode' outside a proper installation.")
    __version__ = "dev"


# Jupyter Extension points
def _jupyter_nbextension_paths():
    return [dict(
        section="notebook",
        src="static",
        dest="appmode",
        require="appmode/main")]


def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": "appmode"
    }]


def _jupyter_server_extension_points():
    from .server_extension import Appmode

    return [{"module": "appmode.server_extension", "app": Appmode}]

#EOF
