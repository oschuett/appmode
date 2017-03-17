#!/bin/bash

jupyter nbextension uninstall --sys-prefix --py jupyter_appmode
jupyter nbextension install   --sys-prefix --py --symlink jupyter_appmode
jupyter nbextension enable    --sys-prefix --py jupyter_appmode
jupyter nbextension list

# jupyter nbextension install   --sys-prefix --py jupyter_appmode
# jupyter nbextension enable    --sys-prefix --py jupyter_appmode
# jupyter nbextension disable   --sys-prefix --py jupyter_appmode
# jupyter nbextension uninstall --sys-prefix --py jupyter_appmode
# jupyter nbextension list

#EOF