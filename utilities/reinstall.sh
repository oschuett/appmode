#!/bin/bash
# Note: this file was moved in a subfolder (and ideally should be run from
# within it) because otherwise the installation below could catch up 
# the local folder instead of the installed one when creating symlinks

set -ev

jupyter nbextension uninstall --sys-prefix --py jupyter_appmode
jupyter nbextension install   --sys-prefix --py --symlink jupyter_appmode
jupyter nbextension enable    --sys-prefix --py jupyter_appmode
jupyter nbextension list


jupyter serverextension disable --py jupyter_appmode
jupyter serverextension enable  --py jupyter_appmode
jupyter serverextension list

