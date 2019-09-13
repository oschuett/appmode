# -*- coding: utf-8 -*-

import os
import itertools
from notebook.utils import url_path_join
from notebook.base.handlers import IPythonHandler, FilesRedirectHandler, path_regex
import notebook.notebook.handlers as orig_handler
from tornado import web, gen
from traitlets.config import LoggingConfigurable
from traitlets import Bool, Unicode


class Appmode(LoggingConfigurable):
    """Object containing server-side configuration settings for Appmode.
    Defined separately from the AppmodeHandler to avoid multiple inheritance.
    """
    trusted_path = Unicode('', help="Run only notebooks below this path in Appmode.", config=True)
    show_edit_button = Bool(True, help="Show Edit App button during Appmode.", config=True)
    show_other_buttons = Bool(True, help="Show other buttons, e.g. Logout, during Appmode.", config=True)

#===============================================================================
class AppmodeHandler(IPythonHandler):
    @property
    def trusted_path(self):
        return self.settings['appmode'].trusted_path

    @property
    def show_edit_button(self):
        return self.settings['appmode'].show_edit_button

    @property
    def show_other_buttons(self):
        return self.settings['appmode'].show_other_buttons

    #===========================================================================
    @web.authenticated
    def get(self, path):
        """get renders the notebook template if a name is given, or
        redirects to the '/files/' handler if the name is not given."""

        path = path.strip('/')
        self.log.info('Appmode get: %s', path)

        # Abort if the app path is not below configured trusted_path.
        if not path.startswith(self.trusted_path):
            self.log.warn('Appmode refused to launch %s outside trusted path %s.', path, self.trusted_path)
            raise web.HTTPError(401, 'Notebook is not within trusted Appmode path.')

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

        # fix back button navigation
        self.add_header("Cache-Control", "cache-control: private, max-age=0, no-cache, no-store")

        # gather template parameters
        tmp_path = self.mk_tmp_copy(path)
        tmp_name = tmp_path.rsplit('/', 1)[-1]
        render_kwargs = {
            'notebook_path': tmp_path,
            'notebook_name': tmp_name,
            'kill_kernel': False,
            'mathjax_url': self.mathjax_url,
            'mathjax_config': self.mathjax_config,
            'show_edit_button': self.show_edit_button,
            'show_other_buttons': self.show_other_buttons,
        }

        # template parameters changed over time
        for parameter in ("get_custom_frontend_exporters", "get_frontend_exporters"):
            if hasattr(orig_handler, parameter):
                render_kwargs[parameter] = getattr(orig_handler, parameter)

        # Ok let's roll ....
        self.write(self.render_template('appmode.html', **render_kwargs))

    #===========================================================================
    @web.authenticated
    @gen.coroutine
    def delete(self, path):
        path = path.strip('/')
        self.log.info('Appmode deleting: %s', path)

        # delete session, including the kernel
        sm = self.session_manager
        if gen.is_coroutine_function(sm.get_session):
            s = yield sm.get_session(path=path)
        else:
            s = sm.get_session(path=path)
        if gen.is_coroutine_function(sm.delete_session):
            yield sm.delete_session(session_id=s['id'])
        else:
            sm.delete_session(session_id=s['id'])

        # delete tmp copy
        cm = self.contents_manager
        cm.delete(path)
        self.finish()

    #===========================================================================
    def mk_tmp_copy(self, path):
        cm = self.contents_manager

        # find tmp_path
        dirname = os.path.dirname(path)
        fullbasename = os.path.basename(path)
        basename, ext = os.path.splitext(fullbasename)
        for i in itertools.count():
            tmp_path = "%s/.%s-%i%s"%(dirname, basename, i, ext)
            if not cm.exists(tmp_path):
                break

        # create tmp copy - allows opening same notebook multiple times
        self.log.info("Appmode creating tmp copy: "+tmp_path)
        cm.copy(path, tmp_path)

        return(tmp_path)

#===============================================================================
def load_jupyter_server_extension(nbapp):
    tmpl_dir = os.path.dirname(__file__)
    # does not work, because init_webapp() happens before init_server_extensions()
    #nbapp.extra_template_paths.append(tmpl_dir) # dows

    # For configuration values that can be set server side
    appmode = Appmode(parent=nbapp)
    nbapp.web_app.settings['appmode'] = appmode

    # slight violation of Demeter's Law
    rootloader = nbapp.web_app.settings['jinja2_env'].loader
    for loader in getattr(rootloader, 'loaders', [rootloader]):
        if hasattr(loader, 'searchpath') and tmpl_dir not in loader.searchpath:
            loader.searchpath.append(tmpl_dir)

    web_app = nbapp.web_app
    host_pattern = '.*$'
    route_pattern = url_path_join(web_app.settings['base_url'], r'/apps%s' % path_regex)
    web_app.add_handlers(host_pattern, [(route_pattern, AppmodeHandler)])

    if appmode.trusted_path:
        nbapp.log.info("Appmode server extension loaded with trusted path: %s", appmode.trusted_path)
    else:
        nbapp.log.info("Appmode server extension loaded.")

#EOF
