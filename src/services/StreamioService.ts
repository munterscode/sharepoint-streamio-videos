// src/services/StreamioService.ts
import { HttpClient, HttpClientResponse, IHttpClientOptions } from '@microsoft/sp-http';
import { IStreamioVideo } from '../models/IVideo';

export class StreamioService {
  private static readonly API_BASE_URL = "https://streamio.com/api/v1/videos.json";

  public static async getVideos(
    httpClient: HttpClient,
    username: string,
    password: string,
    tags: string
  ): Promise<IStreamioVideo[]> {
    if (!username || !password) {
      console.warn("Streamio username or password not provided.");
      return Promise.resolve([]);
    }

    const encodedCredentials = btoa(`${username}:${password}`); // Basic Auth encoding

    const headers: HeadersInit = new Headers();
    headers.append('Authorization', `Basic ${encodedCredentials}`);
    headers.append('Accept', 'application/json');

    const httpClientOptions: IHttpClientOptions = {
      headers: headers
    };

    let apiUrl = this.API_BASE_URL;
    if (tags && tags.trim() !== "") {
      apiUrl += `?tags=${encodeURIComponent(tags.trim())}`;
    }

    try {
      const response: HttpClientResponse = await httpClient.get(
        apiUrl,
        HttpClient.configurations.v1,
        httpClientOptions
      );

      if (response.ok) {
        const videos: IStreamioVideo[] = await response.json();
        // Filter out videos that failed encoding or are not ready
        return videos.filter(video => video.state === 'ready' && video.transcodings.some(t => t.state === 'ready'));
      } else {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        console.error(`Error fetching Streamio videos: ${response.status} - ${errorData.message || response.statusText}`);
        throw new Error(`Failed to fetch videos: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error in StreamioService.getVideos:", error);
      throw error;
    }
  }
}