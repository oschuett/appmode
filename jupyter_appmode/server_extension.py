# -*- coding: utf-8 -*-

import os
import itertools
from notebook.utils import url_path_join
from notebook.base.handlers import IPythonHandler, FilesRedirectHandler, path_regex
from tornado import web

class AppmodeHandler(IPythonHandler):
    
    @web.authenticated
    def get(self, path):
        """get renders the notebook template if a name is given, or 
        redirects to the '/files/' handler if the name is not given."""
        path = path.strip('/')
        cm = self.contents_manager
        
        # will raise 404 on not found
        try:
            model = cm.get(path, content=False)
        except web.HTTPError as e:
            if e.status_code == 404 and 'files' in path.split('/'):
                # 404, but '/files/' in URL, let FilesRedirect take care of it
                return FilesRedirectHandler.redirect_to_files(self, path)
            else:
                raise
        if model['type'] != 'notebook':
            # not a notebook, redirect to files
            return FilesRedirectHandler.redirect_to_files(self, path)
            
        # Ok let's roll ....
        
        tmp_model = self.mk_tmp_copy(path)
        tmp_path = tmp_model['path']
        tmp_name = tmp_path.rsplit('/', 1)[-1]
        
        self.write(self.render_template('notebook.html',
            notebook_path=tmp_path,
            notebook_name=tmp_name,
            kill_kernel=False,
            mathjax_url=self.mathjax_url,
            # mathjax_config=self.mathjax_config # need in future versions
            )
        )

    #===========================================================================
    def mk_tmp_copy(self, path):
        cm = self.contents_manager
        
        dirname = os.path.dirname(path)
        fullbasename = os.path.basename(path)
        basename, ext = os.path.splitext(fullbasename)
        
        for i in itertools.count():
            tmp_path = "%s/.%s-%i%s"%(dirname, basename, i, ext)
            print "trying:", tmp_path
            if not cm.exists(tmp_path):
                break
        
        # create tmp copy - allows opening same notebook multiple times
        tmp_model = cm.copy(path, tmp_path)
        return(tmp_model)
        
#===============================================================================    
def load_jupyter_server_extension(nbapp):
    nbapp.log.info("Appmode server extension loaded.")
    web_app = nbapp.web_app
    host_pattern = '.*$'
    route_pattern = url_path_join(web_app.settings['base_url'], r'/apps%s' % path_regex)
    web_app.add_handlers(host_pattern, [(route_pattern, AppmodeHandler)])
    
#EOF