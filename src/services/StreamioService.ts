// src/services/StreamioService.ts
import { HttpClient, HttpClientResponse, IHttpClientOptions } from '@microsoft/sp-http';
import { IStreamioVideo } from '../models/IVideo';
import { SortOrderOptions } from '../webparts/streamioVideoGallery/components/IStreamioVideoGalleryProps'; // Importera

export class StreamioService {
  private static readonly API_BASE_URL = "https://streamio.com/api/v1/videos.json";
  private static readonly MAX_LIMIT_PER_API_CALL = 100;

  public static async getVideos(
    httpClient: HttpClient,
    username: string,
    password: string,
    tags: string,
    limit: number, // Total limit önskad
    sortOrder: SortOrderOptions,
    initialSkip: number = 0 // För eventuell framtida "load more" knapp, initialt 0
  ): Promise<IStreamioVideo[]> {
    if (!username || !password) {
      console.warn("Streamio username or password not provided.");
      return Promise.resolve([]);
    }

    const encodedCredentials = btoa(`${username}:${password}`);
    const headers: HeadersInit = new Headers();
    headers.append('Authorization', `Basic ${encodedCredentials}`);
    headers.append('Accept', 'application/json');
    const httpClientOptions: IHttpClientOptions = { headers: headers };

    const allFetchedVideos: IStreamioVideo[] = [];
    let accumulatedSkip = initialSkip;
    let remainingLimit = limit;

    while (remainingLimit > 0) {
      const currentCallLimit = Math.min(remainingLimit, this.MAX_LIMIT_PER_API_CALL);
      if (currentCallLimit <= 0) break;

      let apiUrl = `${this.API_BASE_URL}?limit=${currentCallLimit}&skip=${accumulatedSkip}&order=${sortOrder}`;
      if (tags && tags.trim() !== "") {
        apiUrl += `&tags=${encodeURIComponent(tags.trim())}`;
      }

      console.log(`StreamioService: Fetching videos. URL: ${apiUrl}`);

      try {
        const response: HttpClientResponse = await httpClient.get(
          apiUrl,
          HttpClient.configurations.v1,
          httpClientOptions
        );

        if (response.ok) {
          const videosOnPage: IStreamioVideo[] = await response.json();
          if (videosOnPage.length > 0) {
            allFetchedVideos.push(...videosOnPage);
            accumulatedSkip += videosOnPage.length; // Öka skip med antalet faktiskt hämtade
            remainingLimit -= videosOnPage.length;

            // Om vi fick färre än vi begärde i detta anrop (och det var mindre än max),
            // eller om vi fick 0, finns det troligen inga fler.
            if (videosOnPage.length < currentCallLimit || videosOnPage.length === 0) {
                remainingLimit = 0; // Stoppa loopen
            }

          } else {
            remainingLimit = 0; // Inga fler videor, stoppa loopen
          }
        } else {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          const errorMessage = `Error fetching Streamio videos: ${response.status} - ${errorData.message || response.statusText}`;
          console.error(errorMessage, errorData);
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error("Exception in StreamioService.getVideos:", error);
        throw error;
      }
    }
    console.log(`StreamioService: Fetched a total of ${allFetchedVideos.length} videos.`);
    return allFetchedVideos;
  }
}