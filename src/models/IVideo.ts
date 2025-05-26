// src/models/IVideo.ts

export interface IUploader {
    // Add properties if any are available and needed
}

export interface ITranscoding {
    progress: number;
    size: number;
    state: string;
    title: string;
    http_uri: string;
    hls_uri: string;
    rtmp_uri: string | null;
    rtmp_base_uri: string | null;
    rtmp_stream_uri: string | null;
    width: number;
    height: number;
    bitrate: number;
    id: string;
}

export interface IScreenshot {
    thumb: string;
    original: string;
    normal: string;
}

export interface IStreamioVideo {
    account_id: string;
    aspect_ratio_multiplier: number;
    created_at: string;
    default_subtitle_id: string | null;
    description: string;
    internal_notes: string;
    duration: number;
    filename: string;
    image_id: string | null;
    plays: number;
    progress: number;
    state: string;
    tags: string[];
    thumbnail_id: string | null;
    title: string;
    updated_at: string;
    id: string;
    uploader: IUploader;
    original_video: {
        http_uri: string;
        size: number;
    };
    transcodings: ITranscoding[];
    subtitles: any[]; // Define if needed
    screenshot: IScreenshot;
}