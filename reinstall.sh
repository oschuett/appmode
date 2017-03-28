#!/bin/bash

jupyter nbextension uninstall --sys-prefix --py jupyter_appmode
jupyter nbextension install   --sys-prefix --py --symlink jupyter_appmode
jupyter nbextension enable    --sys-prefix --py jupyter_appmode
jupyter nbextension list


jupyter serverextension disable --py jupyter_appmode
jupyter serverextension enable  --py jupyter_appmode
jupyter serverextension list    --py jupyter_appmode

# jupyter nbextension install   --sys-prefix --py jupyter_appmode
# jupyter nbextension enable    --sys-prefix --py jupyter_appmode
# jupyter nbextension disable   --sys-prefix --py jupyter_appmode
# jupyter nbextension uninstall --sys-prefix --py jupyter_appmode
# jupyter nbextension list

#EOF