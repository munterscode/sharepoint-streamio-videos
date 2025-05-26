// src/webparts/streamioVideoGallery/components/IStreamioVideoGalleryProps.ts
import { HttpClient } from '@microsoft/sp-http';

// Definiera enum för sorteringsalternativ
export enum SortOrderOptions {
  CreatedAtDesc = 'created_at.desc',
  CreatedAtAsc = 'created_at.asc',
  TitleAsc = 'title.asc',
  TitleDesc = 'title.desc',
  // Lägg till fler om API:et stöder dem
}

export interface IStreamioVideoGalleryProps {
  title: string;
  streamioUsername: string;
  streamioPassword: string;
  streamioTags: string;
  httpClient: HttpClient;
  isDarkTheme: boolean;
  hasTeamsContext: boolean;
  numberOfVideos: number; // Nytt
  sortOrder: SortOrderOptions;     // Nytt
}