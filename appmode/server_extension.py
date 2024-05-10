# -*- coding: utf-8 -*-

import os
import inspect
import itertools
from jupyter_server.utils import url_path_join as ujoin, ensure_async
from jupyter_server.base.handlers import JupyterHandler, FilesRedirectHandler, path_regex
from jupyter_server.extension.handler import ExtensionHandlerMixin, ExtensionHandlerJinjaMixin
import nbclassic.notebook.handlers as orig_handler
from nbclassic.notebookapp import NotebookApp
import nbclassic
from tornado import web
from traitlets import Bool, Unicode

class Appmode(NotebookApp):
    """Object containing server-side configuration settings for Appmode.
    Defined separately from the AppmodeHandler to avoid multiple inheritance.
    """

    name = "appmode"

    trusted_path = Unicode('', help="Run only notebooks below this path in Appmode.", config=True)
    show_edit_button = Bool(True, help="Show Edit App button during Appmode.", config=True)
    show_other_buttons = Bool(True, help="Show other buttons, e.g. Logout, during Appmode.", config=True)
    temp_dir = Unicode('', help="Create temporary Appmode notebooks in this directory.", config=True)

    extra_template_paths = [ujoin(os.path.dirname(__file__), "templates")]

    def initialize_handlers(self):
        super(Appmode, self).initialize_handlers()
        self.handlers.append(((r'/apps%s' % path_regex), AppmodeHandler))
        if self.trusted_path:
            self.log.info("Server extension loaded with trusted path: %s", self.trusted_path)
        else:
            self.log.info("Server extension loaded.")


class AppmodeHandler(ExtensionHandlerJinjaMixin, ExtensionHandlerMixin, JupyterHandler):

    @property
    def trusted_path(self):
        return self.settings['appmode'].trusted_path

    @property
    def show_edit_button(self):
        return self.settings['appmode'].show_edit_button

    @property
    def show_other_buttons(self):
        return self.settings['appmode'].show_other_buttons

    @property
    def temp_dir(self):
        return self.settings['appmode'].temp_dir

    #===========================================================================
    @web.authenticated
    async def get(self, path):
        """get renders the notebook template if a name is given, or
        redirects to the '/files/' handler if the name is not given."""
        path = path.strip('/')
        self.log.info('Get: %s', path)

        # Abort if the app path is not below configured trusted_path.
        if not path.startswith(self.trusted_path):
            self.log.warn('Refused to launch %s outside trusted path %s.', path, self.trusted_path)
            raise web.HTTPError(401, 'Notebook is not within trusted Appmode path.')

        cm = self.contents_manager
        # will raise 404 on not found
        try:
            model = await ensure_async(cm.get(path, content=False))
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
        tmp_path = await self.mk_tmp_copy(path)
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
    async def post(self, path):
        assert self.get_body_arguments("appmode_action")[0] == "delete"
        path = path.strip('/')
        self.log.info('Deleting: %s', path)

        # delete session, including the kernel
        sm = self.session_manager

        s = await ensure_async(sm.get_session(path=path))
        await ensure_async(sm.delete_session(session_id=s['id']))

        # delete tmp copy
        cm = self.contents_manager
        await ensure_async(cm.delete(path))
        await self.finish()

    #===========================================================================
    async def mk_tmp_copy(self, path):
        cm = self.contents_manager
        # find tmp_path
        dirname = self.temp_dir or os.path.dirname(path)
        if dirname and not os.path.exists(dirname):
            os.makedirs(dirname)
        fullbasename = os.path.basename(path)
        basename, ext = os.path.splitext(fullbasename)
        if cm.allow_hidden:
            basename = '.' + basename
        for i in itertools.count():
            tmp_path = "%s/%s-%i%s"%(dirname, basename, i, ext)
            if not cm.exists(tmp_path):
                break

        # create tmp copy - allows opening same notebook multiple times
        self.log.info("Creating tmp copy: "+tmp_path)
        await ensure_async(cm.copy(path, tmp_path))
        return tmp_path

#EOF
