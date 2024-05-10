import {
  IFrame,
  ToolbarButton,
  ReactWidget,
  IWidgetTracker,
} from '@jupyterlab/apputils';

import {
  ABCWidgetFactory,
  DocumentRegistry,
  DocumentWidget,
} from '@jupyterlab/docregistry';

import { INotebookModel } from '@jupyterlab/notebook';

import { Token } from '@lumino/coreutils';

import { Signal } from '@lumino/signaling';

import * as React from 'react';

/**
 * A class that tracks Voilà Preview widgets.
 */
export type IAppmodePreviewTracker = IWidgetTracker<AppmodePreview>;

/**
 * The Voilà Preview tracker token.
 */
export const IAppmodePreviewTracker = new Token<IAppmodePreviewTracker>(
  'appmode:IAppmodePreviewTracker'
);

/**
 * The class name for a Voilà preview icon.
 */
export const APPMODE_ICON_CLASS = 'jp-MaterialIcon jp-AppmodeIcon';

/**
 * A DocumentWidget that shows a Voilà preview in an IFrame.
 */
export class AppmodePreview extends DocumentWidget<IFrame, INotebookModel> {
  /**
   * Instantiate a new AppmodePreview.
   * @param options The AppmodePreview instantiation options.
   */
  constructor(options: AppmodePreview.IOptions) {
    super({
      ...options,
      content: new IFrame({ sandbox: ['allow-same-origin', 'allow-scripts'] }),
    });

    window.onmessage = (event: any) => {
      //console.log("EVENT: ", event);

      switch (event.data?.level) {
        case 'debug':
          console.debug(...event.data?.msg);
          break;

        case 'info':
          console.info(...event.data?.msg);
          break;

        case 'warn':
          console.warn(...event.data?.msg);
          break;

        case 'error':
          console.error(...event.data?.msg);
          break;

        default:
          console.log(event);
          break;
      }
    };

    const { getAppmodeUrl, context, renderOnSave } = options;

    this.content.url = getAppmodeUrl(context.path);
    this.content.title.iconClass = APPMODE_ICON_CLASS;

    this.renderOnSave = renderOnSave;

    context.pathChanged.connect(() => {
      this.content.url = getAppmodeUrl(context.path);
    });

    const reloadButton = new ToolbarButton({
      iconClass: 'jp-RefreshIcon',
      tooltip: 'Reload Preview',
      onClick: () => {
        this.reload();
      },
    });

    const renderOnSaveCheckbox = ReactWidget.create(
      <label className="jp-AppmodePreview-renderOnSave">
        <input
          style={{ verticalAlign: 'middle' }}
          name="renderOnSave"
          type="checkbox"
          defaultChecked={renderOnSave}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            this._renderOnSave = event.target.checked;
          }}
        />
        Render on Save
      </label>
    );

    this.toolbar.addItem('reload', reloadButton);

    if (context) {
      this.toolbar.addItem('renderOnSave', renderOnSaveCheckbox);
      void context.ready.then(() => {
        context.fileChanged.connect(() => {
          if (this.renderOnSave) {
            this.reload();
          }
        });
      });
    }
  }

  /**
   * Dispose the preview widget.
   */
  dispose() {
    if (this.isDisposed) {
      return;
    }
    super.dispose();
    Signal.clearData(this);
  }

  /**
   * Reload the preview.
   */
  reload() {
    const iframe = this.content.node.querySelector('iframe')!;
    if (iframe.contentWindow) {
      iframe.contentWindow.location.reload();
    }
  }

  /**
   * Get whether the preview reloads when the context is saved.
   */
  get renderOnSave(): boolean | undefined {
    return this._renderOnSave;
  }

  /**
   * Set whether the preview reloads when the context is saved.
   */
  set renderOnSave(renderOnSave: boolean | undefined) {
    this._renderOnSave = renderOnSave;
  }

  private _renderOnSave: boolean | undefined;
}

/**
 * A namespace for AppmodePreview statics.
 */
export namespace AppmodePreview {
  /**
   * Instantiation options for `AppmodePreview`.
   */
  export interface IOptions
    extends DocumentWidget.IOptionsOptionalContent<IFrame, INotebookModel> {
    /**
     * The Voilà URL function.
     */
    getAppmodeUrl: (path: string) => string;

    /**
     * Whether to reload the preview on context saved.
     */
    renderOnSave?: boolean;
  }
}

export class AppmodePreviewFactory extends ABCWidgetFactory<
  AppmodePreview,
  INotebookModel
> {
  defaultRenderOnSave = false;

  constructor(
    private getAppmodeUrl: (path: string) => string,
    options: DocumentRegistry.IWidgetFactoryOptions<AppmodePreview>
  ) {
    super(options);
  }

  protected createNewWidget(
    context: DocumentRegistry.IContext<INotebookModel>
  ): AppmodePreview {
    return new AppmodePreview({
      context,
      getAppmodeUrl: this.getAppmodeUrl,
      renderOnSave: this.defaultRenderOnSave,
    });
  }
}
