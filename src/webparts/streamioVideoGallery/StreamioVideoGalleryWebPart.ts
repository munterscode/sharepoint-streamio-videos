// src/webparts/streamioVideoGallery/StreamioVideoGalleryWebPart.ts
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneLabel
  // No PropertyPaneTextFieldType needed here for the 'type' property of PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { ThemeProvider, ThemeChangedEventArgs } from '@microsoft/sp-component-base';

import * as strings from 'StreamioVideoGalleryWebPartStrings';
import StreamioVideoGallery from './components/StreamioVideoGallery';
import { IStreamioVideoGalleryProps } from './components/IStreamioVideoGalleryProps';

export interface IStreamioVideoGalleryWebPartProps {
  title: string;
  streamioUsername: string;
  streamioPassword: string;
  streamioTags: string;
}

export default class StreamioVideoGalleryWebPart extends BaseClientSideWebPart<IStreamioVideoGalleryWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _themeProvider: ThemeProvider;

  protected async onInit(): Promise<void> {
    await super.onInit(); // Ensure base onInit completes

    this._themeProvider = this.context.serviceScope.consume(ThemeProvider.serviceKey);
    this._themeProvider.themeChangedEvent.add(this, this._handleThemeChangedEvent);
    const currentTheme = this._themeProvider.tryGetTheme();
    if (currentTheme) {
        this._isDarkTheme = !!currentTheme.isInverted;
    }
  }

  private _handleThemeChangedEvent(args: ThemeChangedEventArgs): void {
    if (args.theme) { // Add null check for theme
        this._isDarkTheme = !!args.theme.isInverted;
    }
    this.render();
  }

  public render(): void {
    const element: React.ReactElement<IStreamioVideoGalleryProps> = React.createElement(
      StreamioVideoGallery,
      {
        title: this.properties.title,
        streamioUsername: this.properties.streamioUsername,
        streamioPassword: this.properties.streamioPassword,
        streamioTags: this.properties.streamioTags,
        httpClient: this.context.httpClient,
        isDarkTheme: this._isDarkTheme,
        hasTeamsContext: !!this.context.sdks.microsoftTeams
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('title', {
                  label: "Web Part Title"
                }),
                PropertyPaneTextField('streamioUsername', {
                  label: "Streamio Username"
                }),
                PropertyPaneTextField('streamioPassword', {
                  label: "Streamio Password"
                  // The 'type' property does not exist on IPropertyPaneTextFieldProps.
                  // Visual masking in the property pane for password fields is a browser/SharePoint UI behavior.
                  // The critical aspect is secure handling, not just visual masking in this config UI.
                }),
                PropertyPaneTextField('streamioTags', {
                  label: "Streamio Tags (comma-separated)",
                  description: "e.g., sports,nature"
                }),
                PropertyPaneLabel('', {
                  text: "WARNING: Storing credentials directly in web part properties is not secure for production environments. Consider using a secure backend service or Azure Key Vault for credential management.",
                  required: false
                })
              ]
            }
          ]
        }
      ]
    };
  }
}