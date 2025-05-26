// src/webparts/streamioVideoGallery/StreamioVideoGalleryWebPart.ts
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneLabel,
  PropertyPaneSlider, // För numberOfVideos
  PropertyPaneDropdown // För sortOrder
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { ThemeProvider, ThemeChangedEventArgs } from '@microsoft/sp-component-base';

import * as strings from 'StreamioVideoGalleryWebPartStrings';
import StreamioVideoGallery from './components/StreamioVideoGallery';
import { IStreamioVideoGalleryProps, SortOrderOptions } from './components/IStreamioVideoGalleryProps'; // Importera SortOrderOptions

export interface IStreamioVideoGalleryWebPartProps {
  title: string;
  streamioUsername: string;
  streamioPassword: string;
  streamioTags: string;
  numberOfVideos: number; // Nytt
  sortOrder: SortOrderOptions;     // Nytt
}

export default class StreamioVideoGalleryWebPart extends BaseClientSideWebPart<IStreamioVideoGalleryWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _themeProvider: ThemeProvider;

  protected async onInit(): Promise<void> {
    await super.onInit();

    this._themeProvider = this.context.serviceScope.consume(ThemeProvider.serviceKey);
    this._themeProvider.themeChangedEvent.add(this, this._handleThemeChangedEvent);
    const currentTheme = this._themeProvider.tryGetTheme();
    if (currentTheme) {
        this._isDarkTheme = !!currentTheme.isInverted;
    }

    // Sätt defaultvärden om de inte redan är satta
    if (this.properties.numberOfVideos === undefined) {
      this.properties.numberOfVideos = 20;
    }
    if (this.properties.sortOrder === undefined) {
      this.properties.sortOrder = SortOrderOptions.CreatedAtDesc;
    }
  }

  private _handleThemeChangedEvent(args: ThemeChangedEventArgs): void {
    if (args.theme) {
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
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        numberOfVideos: this.properties.numberOfVideos, // Skicka med
        sortOrder: this.properties.sortOrder         // Skicka med
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
                }),
                PropertyPaneTextField('streamioTags', {
                  label: "Streamio Tags (comma-separated)",
                  description: "e.g., sports,nature"
                }),
                PropertyPaneLabel('', {
                  text: "WARNING: Storing credentials directly in web part properties is not secure for production environments.",
                  required: false
                })
              ]
            },
            { // Ny grupp för visningsinställningar
              groupName: "Display Settings",
              groupFields: [
                PropertyPaneSlider('numberOfVideos', {
                  label: "Number of videos to display",
                  min: 1,
                  max: 200, // Enligt önskemål
                  step: 1,
                  showValue: true,
                  value: this.properties.numberOfVideos // Se till att värdet är bundet
                }),
                PropertyPaneDropdown('sortOrder', {
                  label: "Sort videos by",
                  options: [
                    { key: SortOrderOptions.CreatedAtDesc, text: 'Latest Created (Default)' },
                    { key: SortOrderOptions.CreatedAtAsc, text: 'Oldest Created' },
                    { key: SortOrderOptions.TitleAsc, text: 'Title (A-Z)' },
                    { key: SortOrderOptions.TitleDesc, text: 'Title (Z-A)' },
                    // Lägg till fler om Streamio stöder det (t.ex. plays.desc)
                  ],
                  selectedKey: this.properties.sortOrder
                })
              ]
            }
          ]
        }
      ]
    };
  }
}