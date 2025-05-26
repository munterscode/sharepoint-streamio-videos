// src/webparts/streamioVideoGallery/components/StreamioVideoGallery.tsx
import * as React from 'react';
import { useState, useEffect, useRef } from 'react'; // Added useRef
import { IStreamioVideoGalleryProps } from './IStreamioVideoGalleryProps';
import { StreamioService } from '../../../services/StreamioService';
import { IStreamioVideo, ITranscoding } from '../../../models/IVideo';

import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  makeStyles,
  shorthands,
  tokens,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Button,
  Spinner,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Image
} from '@fluentui/react-components';
import { PlayCircle24Regular, DismissCircle24Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalL),
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    ...shorthands.gap("16px"),
  },
  card: {
    maxWidth: "400px",
    height: "fit-content",
  },
  cardImage: {
    width: '100%',
    aspectRatio: '16 / 9',
    objectFit: 'cover',
    backgroundColor: tokens.colorNeutralBackground3, // Placeholder background
  },
  titleText: {
    overflowWrap: 'break-word',
  },
  caption: {
    color: tokens.colorNeutralForeground2,
    display: '-webkit-box',
    '-webkit-line-clamp': '3',
    '-webkit-box-orient': 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    minHeight: '48px', // Approx 3 lines of text
    marginTop: tokens.spacingVerticalSNudge,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.padding(tokens.spacingHorizontalM, tokens.spacingVerticalM),
  },
  videoPlayer: {
    width: '100%',
    height: 'auto',
    maxHeight: 'calc(80vh - 100px)', // Account for dialog title/actions
    aspectRatio: '16 / 9',
    backgroundColor: '#000',
  },
  dialogSurface: {
    width: 'clamp(320px, 80vw, 900px) !important',
    maxHeight: '90vh !important',
    overflowY: 'auto',
  },
  dialogContentWithVideo: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalM),
  }
});

interface IStreamioVideoGalleryState {
  videos: IStreamioVideo[];
  isLoading: boolean;
  error: string | null;
  selectedVideo: IStreamioVideo | null;
  isModalOpen: boolean;
}

const StreamioVideoGallery: React.FC<IStreamioVideoGalleryProps> = (props) => {
  const classes = useStyles();
  const [state, setState] = useState<IStreamioVideoGalleryState>({
    videos: [],
    isLoading: true,
    error: null,
    selectedVideo: null,
    isModalOpen: false,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const theme = props.isDarkTheme ? webDarkTheme : webLightTheme;

  const ensureFullUrl = (urlPart: string | null | undefined): string => {
    if (!urlPart) return '';
    if (urlPart.startsWith('http://') || urlPart.startsWith('https://')) {
      return urlPart;
    }
    return `https://${urlPart}`;
  };

  useEffect(() => {
    const fetchVideos = async () => {
      if (!props.streamioUsername || !props.streamioPassword) {
        setState(s => ({ ...s, isLoading: false, error: "Streamio credentials not configured in web part settings.", videos: [] }));
        return;
      }
      setState(s => ({ ...s, isLoading: true, error: null }));
      try {
        const videosData = await StreamioService.getVideos(
          props.httpClient,
          props.streamioUsername,
          props.streamioPassword,
          props.streamioTags
        );
        const readyVideos = videosData.filter((video: IStreamioVideo) =>
            video.state === 'ready' &&
            video.screenshot?.normal &&
            video.transcodings.some((t: ITranscoding) => t.state === 'ready' && (t.hls_uri || t.http_uri))
        );
        setState(s => ({ ...s, videos: readyVideos, isLoading: false }));

      } catch (err: any) {
        console.error("Error fetching videos in component:", err);
        setState(s => ({ ...s, error: err.message || "An unknown error occurred while fetching videos.", isLoading: false }));
      }
    };

    fetchVideos();
  }, [props.streamioUsername, props.streamioPassword, props.streamioTags, props.httpClient]);

  const handleVideoPlay = (video: IStreamioVideo) => {
    setState(s => ({ ...s, selectedVideo: video, isModalOpen: true }));
  };

  const handleModalClose = () => {
    // Pause video when closing modal
    if (videoRef.current) {
        videoRef.current.pause();
    }
    setState(s => ({ ...s, selectedVideo: null, isModalOpen: false }));
  };

  // OPTION 1: PRIORITIZE MP4 (http_uri)
  const getPlayableStream = (video: IStreamioVideo | null): ITranscoding | null => {
    if (!video) return null;
    console.log("Attempting to get playable stream for video:", video.title, video.transcodings);

    // Prefer specific MP4 qualities
    let stream = video.transcodings.find((t: ITranscoding) =>
      t.state === 'ready' && t.http_uri && t.title.includes('720p')
    );
    if (stream) { console.log("Found 720p MP4:", stream.http_uri); return stream; }

    stream = video.transcodings.find((t: ITranscoding) =>
      t.state === 'ready' && t.http_uri && t.title.includes('1080p')
    );
    if (stream) { console.log("Found 1080p MP4:", stream.http_uri); return stream; }

    // Fallback to any ready MP4
    stream = video.transcodings.find((t: ITranscoding) =>
      t.state === 'ready' && t.http_uri
    );
    if (stream) { console.log("Found other MP4:", stream.http_uri); return stream; }

    // If no MP4, then try HLS as a fallback
    console.log("No direct MP4 found, trying HLS as fallback for:", video.title);
    stream = video.transcodings.find((t: ITranscoding) =>
      t.state === 'ready' && t.hls_uri && t.hls_uri.endsWith('.m3u8') && t.title.includes('720p')
    );
    if (stream) { console.log("Found 720p HLS:", stream.hls_uri); return stream; }

    stream = video.transcodings.find((t: ITranscoding) =>
      t.state === 'ready' && t.hls_uri && t.hls_uri.endsWith('.m3u8') && t.title.includes('1080p')
    );
    if (stream) { console.log("Found 1080p HLS:", stream.hls_uri); return stream; }

    // Fallback to any ready HLS
    stream = video.transcodings.find((t: ITranscoding) =>
      t.state === 'ready' && t.hls_uri && t.hls_uri.endsWith('.m3u8')
    );
    if (stream) { console.log("Found other HLS:", stream.hls_uri); return stream; }


    console.warn("No suitable playable stream (MP4 or HLS) found for video:", video.title);
    return null;
  };


  const playableStream = getPlayableStream(state.selectedVideo);
  const placeholderImage = "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22169%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20169%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A15pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%22300%22%20height%3D%22169%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2299.6%22%20y%3D%2291.3%22%3ENo Preview%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E";

  // useEffect for video element event listeners (optional but good for debugging)
  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement && playableStream && state.isModalOpen) {
      console.log("Video element found, attaching event listeners. SRC:", videoElement.src);

      const onLoadedMetadata = () => console.log("Video metadata loaded. Duration:", videoElement.duration);
      const onCanPlay = () => console.log("Video can play.");
      const onPlaying = () => console.log("Video is playing.");
      const onError = (e: Event) => {
        console.error("Video Player Error Event:", e);
        if (videoElement.error) {
          console.error("Video Element Error Code:", videoElement.error.code, "Message:", videoElement.error.message);
        }
      };
      const onStalled = () => console.log("Video stalled.");
      const onWaiting = () => console.log("Video waiting.");
      const onSuspend = () => console.log("Video suspend.");

      videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
      videoElement.addEventListener('canplay', onCanPlay);
      videoElement.addEventListener('playing', onPlaying);
      videoElement.addEventListener('error', onError);
      videoElement.addEventListener('stalled', onStalled);
      videoElement.addEventListener('waiting', onWaiting);
      videoElement.addEventListener('suspend', onSuspend);

      // If autoplay is true and it might fail, try to play it again after a short delay
      // or if the src changes.
      if (videoElement.autoplay && videoElement.paused) {
        videoElement.play().catch(e => console.warn("Autoplay failed in useEffect:", e));
      }


      return () => {
        console.log("Cleaning up video event listeners.");
        videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
        videoElement.removeEventListener('canplay', onCanPlay);
        videoElement.removeEventListener('playing', onPlaying);
        videoElement.removeEventListener('error', onError);
        videoElement.removeEventListener('stalled', onStalled);
        videoElement.removeEventListener('waiting', onWaiting);
        videoElement.removeEventListener('suspend', onSuspend);
      };
    }
  }, [playableStream, state.isModalOpen]); // Re-run if playableStream changes or modal visibility changes


  return (
    <FluentProvider theme={theme}>
      <div className={classes.root}>
        {props.title && <Text as="h2" block size={700} weight="semibold" style={{marginBottom: tokens.spacingVerticalL}}>{props.title}</Text>}

        {state.isLoading && <Spinner labelPosition="below" label="Loading videos from Streamio..." />}

        {state.error && (
          <MessageBar intent="error">
            <MessageBarBody>
              <MessageBarTitle>Error Loading Videos</MessageBarTitle>
              {state.error}
            </MessageBarBody>
          </MessageBar>
        )}

        {!state.isLoading && !state.error && state.videos.length === 0 && (
          <Text>No videos found matching the criteria, or there might be an issue with the Streamio configuration or API.</Text>
        )}

        {!state.isLoading && !state.error && state.videos.length > 0 && (
          <div className={classes.grid}>
            {state.videos.map((video: IStreamioVideo) => {
              const screenshotUrl = ensureFullUrl(video.screenshot?.normal);
              const videoDurationMinutes = Math.round(video.duration / 60);
              const displayDescription = video.description ? video.description : "No description available.";

              return (
              <Card key={video.id} className={classes.card}>
                <CardPreview>
                  <Image
                    className={classes.cardImage}
                    src={screenshotUrl || placeholderImage}
                    alt={video.title || 'Video thumbnail'}
                    fit="cover"
                  />
                </CardPreview>
                <CardHeader
                  header={
                    <Text weight="semibold" className={classes.titleText}>
                      {video.title || video.filename}
                    </Text>
                  }
                  description={
                    <Text size={200} className={classes.caption}>
                      {displayDescription}
                    </Text>
                  }
                />
                <div className={classes.cardFooter}>
                  <Text size={200}>
                    {videoDurationMinutes > 0 ? `${videoDurationMinutes} min` : '< 1 min'}
                    {` • ${video.plays} plays`}
                  </Text>
                  <Button
                    icon={<PlayCircle24Regular />}
                    appearance="primary"
                    onClick={() => handleVideoPlay(video)}
                    disabled={!getPlayableStream(video)} // Check if a stream can be found
                  >
                    Watch
                  </Button>
                </div>
              </Card>
            )})}
          </div>
        )}

        {state.selectedVideo && (
          <Dialog
            modalType="modal"
            open={state.isModalOpen}
            onOpenChange={(_event, data) => { if (!data.open) handleModalClose(); }}
          >
            <DialogSurface className={classes.dialogSurface}>
              <DialogBody>
                <DialogTitle
                  action={
                    <DialogTrigger action="close">
                      <Button
                        appearance="subtle"
                        aria-label="close"
                        icon={<DismissCircle24Regular />}
                        onClick={handleModalClose}
                      />
                    </DialogTrigger>
                  }
                >
                  {state.selectedVideo.title || "Video Player"}
                </DialogTitle>
                <DialogContent className={classes.dialogContentWithVideo}>
                  {playableStream ? (
                    <video
                      ref={videoRef}
                      className={classes.videoPlayer}
                      // The src will be determined by what getPlayableStream prefers
                      src={ensureFullUrl(playableStream.http_uri || playableStream.hls_uri)}
                      controls
                      autoPlay
                      poster={ensureFullUrl(state.selectedVideo.screenshot?.normal)}
                    >
                      Your browser does not support the video tag.
                      {(playableStream.http_uri) && // Prefer http_uri for download link
                        <span> You can try downloading the video: <a href={ensureFullUrl(playableStream.http_uri)} target="_blank" rel="noopener noreferrer">Download MP4</a></span>
                      }
                    </video>
                  ) : (
                    <Text>No playable video stream found for this item. Please check transcoding status.</Text>
                  )}
                  {state.selectedVideo.description && <Text block>{state.selectedVideo.description}</Text>}
                </DialogContent>
                <DialogActions>
                  <DialogTrigger disableButtonEnhancement>
                    <Button appearance="secondary" onClick={handleModalClose}>Close</Button>
                  </DialogTrigger>
                </DialogActions>
              </DialogBody>
            </DialogSurface>
          </Dialog>
        )}
      </div>
    </FluentProvider>
  );
};

export default StreamioVideoGallery;