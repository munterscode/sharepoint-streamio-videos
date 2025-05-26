import { HttpClient } from '@microsoft/sp-http';

export interface IStreamioVideoGalleryProps {
  title: string;
  streamioUsername: string;
  streamioPassword: string;
  streamioTags: string;
  httpClient: HttpClient;
  isDarkTheme: boolean; // For theme awareness
  hasTeamsContext: boolean; // For Teams context awareness
}