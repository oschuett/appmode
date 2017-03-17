# -*- coding: utf-8 -*-

# Jupyter Extension points
def _jupyter_nbextension_paths():
    return [dict(
        section="notebook",
        # the path is relative to the `my_fancy_module` directory
        src="static",
        # directory in the `nbextension/` namespace
        dest="jupyter_appmode",
        # _also_ in the `nbextension/` namespace
        require="jupyter_appmode/main")]


# jupyter nbextension install   --sys-prefix --py jupyter_appmode
# jupyter nbextension enable    --sys-prefix --py jupyter_appmode
# jupyter nbextension disable   --sys-prefix --py jupyter_appmode
# jupyter nbextension uninstall --sys-prefix --py jupyter_appmode
# jupyter nbextension list
#EOF