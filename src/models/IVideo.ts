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
    rtmp_uri: string | undefined;
    rtmp_base_uri: string | undefined;
    rtmp_stream_uri: string | undefined;
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

export interface ISubtitle {
    id: string;
    language: string;
    title: string;
    uri: string;
    // Add other subtitle properties as needed
}

export interface IStreamioVideo {
    account_id: string;
    aspect_ratio_multiplier: number;
    created_at: string;
    default_subtitle_id: string | undefined;
    description: string;
    internal_notes: string;
    duration: number;
    filename: string;
    image_id: string | undefined;
    plays: number;
    progress: number;
    state: string;
    tags: string[];
    thumbnail_id: string | undefined;
    title: string;
    updated_at: string;
    id: string;
    uploader: IUploader;
    original_video: {
        http_uri: string;
        size: number;
    };
    transcodings: ITranscoding[];
    subtitles: ISubtitle[];
    screenshot: IScreenshot;
}