import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer,
} from '@jupyterlab/application';

import {
  ICommandPalette,
  WidgetTracker,
  // ToolbarButton,
} from '@jupyterlab/apputils';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { PageConfig } from '@jupyterlab/coreutils';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { IMainMenu } from '@jupyterlab/mainmenu';

import {
  INotebookTracker,
  NotebookPanel,
  INotebookModel,
} from '@jupyterlab/notebook';

// import { CommandRegistry } from '@lumino/commands';

import { ReadonlyPartialJSONObject } from '@lumino/coreutils';

// import { IDisposable } from '@lumino/disposable';

import {
  // APPMODE_ICON_CLASS,
  AppmodePreview,
  IAppmodePreviewTracker,
  AppmodePreviewFactory,
} from './preview';

import '../style/index.css';

// https://jupyterlab.readthedocs.io/en/latest/api/modules/ui_components.html
import { LabIcon } from '@jupyterlab/ui-components';

import gearsSvgstr from '../style/gears.svg';
export const gearsIcon = new LabIcon({
  name: 'appmode:gears',
  svgstr: gearsSvgstr
});

// from https://raw.githubusercontent.com/FortAwesome/Font-Awesome/master/svgs/solid/expand-arrows-alt.svg
import expandSvgstr from '../style/expand-arrows-alt.svg';
export const appmodeIcon = new LabIcon({
  name: 'appmode:expand',
  svgstr: expandSvgstr
});

/**
 * The command IDs used by the plugin.
 */
export namespace CommandIDs {
  export const appmodeRender = 'notebook:render-with-appmode';

  export const appmodeOpen = 'notebook:open-with-appmode';
}

// moved to schema/plugin.json
// /**
//  * A notebook widget extension that adds a appmode preview button to the toolbar.
//  */
// class AppmodeRenderButton
//   implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
//   /**
//    * Instantiate a new AppmodeRenderButton.
//    * @param commands The command registry.
//    */
//   constructor(commands: CommandRegistry) {
//     this._commands = commands;
//   }

//   /**
//    * Create a new extension object.
//    */
//   createNew(panel: NotebookPanel): IDisposable {
//     const button = new ToolbarButton({
//       className: 'appmodeOpen',
//       label: 'Appmode',
//       tooltip: 'Render with Appmode',
//       iconClass: 'fa fa-arrows-alt',
//       onClick: () => {
//         this._commands.execute(CommandIDs.appmodeOpen);
//       },
//     });
//     panel.toolbar.insertAfter('cellType', 'appmodeRender', button);
//     return button;
//   }

//   private _commands: CommandRegistry;
// }

/**
 * Initialization data for the appmode extension.
 */
const extension: JupyterFrontEndPlugin<IAppmodePreviewTracker> = {
  id: 'appmode:plugin',
  autoStart: true,
  requires: [INotebookTracker],
  optional: [ICommandPalette, ILayoutRestorer, IMainMenu, ISettingRegistry],
  provides: IAppmodePreviewTracker,
  activate: (
    app: JupyterFrontEnd,
    notebooks: INotebookTracker,
    palette: ICommandPalette | null,
    restorer: ILayoutRestorer | null,
    menu: IMainMenu | null,
    settingRegistry: ISettingRegistry | null
  ) => {
    // Create a widget tracker for Voilà Previews.
    const tracker = new WidgetTracker<AppmodePreview>({
      namespace: 'appmode-preview',
    });

    if (restorer) {
      restorer.restore(tracker, {
        command: 'docmanager:open',
        args: (panel) => ({
          path: panel.context.path,
          factory: factory.name,
        }),
        name: (panel) => panel.context.path,
        when: app.serviceManager.ready,
      });
    }

    function getCurrent(args: ReadonlyPartialJSONObject): NotebookPanel | null {
      const widget = notebooks.currentWidget;
      const activate = args['activate'] !== false;

      if (activate && widget) {
        app.shell.activateById(widget.id);
      }

      return widget;
    }

    function isEnabled(): boolean {
      return (
        notebooks.currentWidget !== null &&
        notebooks.currentWidget === app.shell.currentWidget
      );
    }

    function getAppmodeUrl(path: string): string {
      const baseUrl = PageConfig.getBaseUrl();
      // remove path prefix when collaboration extension is enabled
      path = path.replace('RTC:','');
      return `${baseUrl}apps/${path.replace('RTC:','')}`;
    }

    const factory = new AppmodePreviewFactory(getAppmodeUrl, {
      name: 'Appmode-preview',
      fileTypes: ['notebook'],
      modelName: 'notebook',
    });

    factory.widgetCreated.connect((sender, widget) => {
      // Notify the widget tracker if restore data needs to update.
      widget.context.pathChanged.connect(() => {
        void tracker.save(widget);
      });
      // Add the notebook panel to the tracker.
      void tracker.add(widget);
    });

    const updateSettings = (settings: ISettingRegistry.ISettings): void => {
      factory.defaultRenderOnSave = settings.get('renderOnSave')
        .composite as boolean;
    };

    if (settingRegistry) {
      Promise.all([settingRegistry.load(extension.id), app.restored])
        .then(([settings]) => {
          updateSettings(settings);
          settings.changed.connect(updateSettings);
        })
        .catch((reason: Error) => {
          console.error(reason.message);
        });
    }

    app.docRegistry.addWidgetFactory(factory);

    // const { commands, docRegistry } = app;
    const { commands } = app;

    commands.addCommand(CommandIDs.appmodeRender, {
      label: 'Render Notebook with Appmode',
      execute: async (args) => {
        const current = getCurrent(args);
        let context: DocumentRegistry.IContext<INotebookModel>;
        if (current) {
          context = current.context;
          await context.save();

          commands.execute('docmanager:open', {
            path: context.path,
            factory: 'Appmode-preview',
            options: {
              mode: 'split-right',
            },
          });
        }
      },
      isEnabled,
    });

    commands.addCommand(CommandIDs.appmodeOpen, {
      label: 'Open with Appmode in New Browser Tab',
      execute: async (args) => {
        const current = getCurrent(args);
        if (!current) {
          return;
        }
        await current.context.save();
        const appmodeUrl = getAppmodeUrl(current.context.path);
        window.open(appmodeUrl);
      },
      isEnabled,
    });

    if (palette) {
      const category = 'Notebook Operations';
      [CommandIDs.appmodeRender, CommandIDs.appmodeOpen].forEach((command) => {
        palette.addItem({ command, category });
      });
    }

    if (menu) {
      menu.viewMenu.addGroup(
        [
          {
            command: CommandIDs.appmodeRender,
          },
          {
            command: CommandIDs.appmodeOpen,
          },
        ],
        1000
      );
    }
    // moved to schema/plugin.json
    // const appmodeButton = new AppmodeRenderButton(commands);
    // docRegistry.addWidgetExtension('Notebook', appmodeButton);

    return tracker;
  },
};

export default extension;
