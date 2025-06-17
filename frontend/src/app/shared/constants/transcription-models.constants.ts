export interface GetRealtimeTranscriptionModelRequest {
  id: number;
  name: string;
  provider: number;
}

export const realTimeTranscriptionModels: GetRealtimeTranscriptionModelRequest[] =
  [
    {
      id: 1,
      name: 'whisper-1',
      provider: 1,
    },
    {
      id: 2,
      name: 'gpt-4o-mini-transcribe',
      provider: 1,
    },
    {
      id: 3,
      name: 'gpt-4o-transcribe',
      provider: 1,
    },
  ];
