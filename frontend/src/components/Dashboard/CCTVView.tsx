import ReactPlayer from 'react-player';

interface CCTVViewProps {
  streamUrl?: string;
}

export default function CCTVView({ streamUrl }: CCTVViewProps) {
  const defaultStreamUrl = import.meta.env.VITE_HLS_STREAM_URL || 'http://localhost:8080/hls/stream.m3u8';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Live CCTV Feed</h3>
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ paddingTop: '56.25%' }}>
        <ReactPlayer
          url={streamUrl || defaultStreamUrl}
          playing
          controls
          width="100%"
          height="100%"
          style={{ position: 'absolute', top: 0, left: 0 }}
          config={{
            file: {
              hlsOptions: {
                enableWorker: true,
              },
            },
          }}
        />
      </div>
      <p className="text-sm text-gray-500 mt-2">
        Live stream from parking area camera
      </p>
    </div>
  );
}

