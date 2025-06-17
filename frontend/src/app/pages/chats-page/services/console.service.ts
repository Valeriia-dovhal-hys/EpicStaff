import {
  Injectable,
  OnDestroy,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// @ts-ignore
import { RealtimeClient } from '../libs/openai/client';
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';
import { WavRecorder, WavStreamPlayer } from 'wavtools';
import { Subject, from, fromEvent, of, EMPTY } from 'rxjs';
import { catchError, switchMap, tap, delay } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChatsService } from './chats.service';
import { ToastService } from '../../../services/notifications/toast.service';
import { ConfigService } from '../../../services/config/config.service';

export interface InitRealtime {
  agent_id: number;
  realtime_config_id: number;
  search_limit: number;
  distance_threshold: string;
}
@Injectable({
  providedIn: 'root',
})
export class ConsoleService implements OnDestroy {
  private get apiUrl(): string {
    return this.configService.apiUrl + 'init-realtime/';
  }
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  private wavRecorder!: WavRecorder;
  private wavStreamPlayer!: WavStreamPlayer;
  private client!: RealtimeClient | null;
  private destroyRef = inject(DestroyRef);

  // Signals
  public items = signal<ItemType[]>([]);
  public isConnected = signal<boolean>(false);

  public currentVoice = signal<string>('verse');

  //new Signals
  public audioDevices = signal<MediaDeviceInfo[]>([]);
  public isLoadingDevices = signal<boolean>(true);
  public isClientConnected = signal<boolean>(false);
  public isConversationConnected = signal<boolean>(false);
  public isRecordingStarted = signal<boolean>(false);
  // Subjects
  private connectionError$ = new Subject<Error>();

  // Threshold and Search Limit Signals
  public threshold = signal<number>(0.65);
  public searchLimit = signal<number>(300);

  constructor(
    private http: HttpClient,
    private chatsService: ChatsService,
    private toastService: ToastService,
    private configService: ConfigService
  ) {
    this.initializeComponents();

    this.connectionError$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((error) => {
        console.error('Connection error:', error);
        this.isConnected.set(false);
      });
  }
  // Method to update threshold
  updateThreshold(value: number): void {
    this.threshold.set(value);
    console.log('Threshold updated:', value.toFixed(2));
  }

  // Method to update search limit
  updateSearchLimit(value: number): void {
    this.searchLimit.set(value);
    console.log('Search limit updated:', value.toFixed(2));
  }
  ngOnDestroy(): void {
    this.disconnectConversation();
    // this.client.reset();
    this.connectionError$.complete();
  }
  connectToRealtime(connectionKey: string) {
    console.log('connectionkey', connectionKey);

    // Save the connectionKey in local storage
    localStorage.setItem('connectionKey', connectionKey);
    this.client = new RealtimeClient({
      url: this.configService.realtimeApiUrl,
      //   apiKey: environment.apiKey,
      dangerouslyAllowAPIKeyInBrowser: true,
    });
    this.setupClient();
  }
  private initializeComponents(): void {
    this.wavRecorder = new WavRecorder({ sampleRate: 24000 });
    this.wavStreamPlayer = new WavStreamPlayer({ sampleRate: 24000 });

    this.getAudioDevices().then((devices: MediaDeviceInfo[]) => {
      this.audioDevices.set(devices);
      this.isLoadingDevices.set(false);
    });

    this.wavRecorder.listenForDeviceChange((devices: MediaDeviceInfo[]) => {
      this.audioDevices.set(devices);
      this.isLoadingDevices.set(false);
      console.log('Audio devices updated:', devices);
    });
  }

  getAudioDevices(): Promise<MediaDeviceInfo[]> {
    return this.wavRecorder.listDevices().finally(() => {
      this.isLoadingDevices.set(false);
    });
  }
  // --- WavRecorder control methods ---
  beginWavRecorder(deviceId?: string): Promise<boolean> {
    return this.wavRecorder.begin(deviceId);
  }

  pauseWavRecorder(): Promise<boolean> {
    if (this.wavRecorder.getStatus() === 'recording') {
      return this.wavRecorder.pause();
    } else {
      console.warn('Cannot pause because recorder is not recording.');
      return Promise.resolve(true);
    }
  }

  recordWavRecorder(): Promise<boolean> {
    const status = this.wavRecorder.getStatus();
    if (status === 'recording') {
      console.warn('Already recording.');
      return Promise.resolve(true);
    } else if (status === 'paused') {
      return this.wavRecorder.record(
        (data: { mono: Int16Array; raw: Int16Array }) => {
          this.isRecordingStarted.set(true);
          this.client!.appendInputAudio(data.mono);
        }
      );
    } else {
      console.warn('Recorder is not paused; cannot resume.');
      return Promise.resolve(true);
    }
  }

  endWavRecorder(): Promise<any> {
    this.isRecordingStarted.set(false);
    return this.wavRecorder.end();
  }
  // --- End WavRecorder control methods ---

  async clearRecording(): Promise<boolean> {
    try {
      return await this.wavRecorder.clear();
    } catch (err) {
      console.error('Error clearing recording:', err);
      return false;
    }
  }

  connectConversation(): void {
    if (!this.isClientConnected() && !this.isConversationConnected()) {
      // this.toastService.error('Error updating realtime config');
      if (!this.chatsService.selectedAgent$()?.realtime_config) {
        this.toastService.warning(
          `The selected agent does not have Realtime LLM specified`
        );
      }

      const payload: InitRealtime = {
        agent_id: this.chatsService.selectedAgentId$() ?? 0,
        realtime_config_id:
          +!this.chatsService.selectedAgent$()!.realtime_config, //TO DO FIX ME
        search_limit: this.searchLimit(),
        distance_threshold: this.threshold().toString(),
      };
      console.log(payload);

      this.http
        .post<{ connection_key: string }>(this.apiUrl, payload, {
          headers: this.headers,
        })
        .pipe(
          tap((response) => {
            console.log('POST Response:', response);
            if (response.connection_key) {
              localStorage.setItem('connectionKey', response.connection_key);
            } else {
              console.error('connection_key is missing in the response');
            }
          }),
          delay(200), // Add a delay before proceeding
          takeUntilDestroyed(this.destroyRef),
          switchMap(() => {
            const storedKey = localStorage.getItem('connectionKey'); // Retrieve from local storage
            console.log('Retrieved connectionKey:', storedKey);
            if (!storedKey) {
              console.error('No connectionKey found in localStorage');
              return EMPTY;
            }
            this.connectToRealtime(storedKey);
            // this.isConnected.set(true);

            this.updateItems();
            return from(this.beginWavRecorder());
          }),
          switchMap(() => from(this.wavStreamPlayer.connect())),
          switchMap(() => from(this.client!.connect())),
          tap(() => {
            this.isClientConnected.set(true);
          }),
          switchMap(() => from(this.recordWavRecorder())),
          tap(() => {
            this.isConversationConnected.set(true);
          }),
          catchError((error) => {
            this.connectionError$.next(error);
            return EMPTY;
          })
        )
        .subscribe();
    } else {
      this.disconnectConversation();
    }
  }

  disconnectConversation(): void {
    if (!this.isConversationConnected()) return;
    from(this.endWavRecorder())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => {
          const interruptResult = this.wavStreamPlayer.interrupt();
          console.log('Interrupt result:', interruptResult);
          this.client!.disconnect();
          this.items.set([]);
          this.client!.reset();
          this.client = null;
          this.isClientConnected.set(false);
          this.isConversationConnected.set(false);
        }),
        catchError((error) => {
          console.error('Error disconnecting conversation:', error);
          return EMPTY;
        })
      )
      .subscribe();
  }

  deleteConversationItem(id: string): void {
    this.client!.deleteItem(id);
    of(null)
      .pipe(
        delay(100),
        tap(() => this.updateItems())
      )
      .subscribe();
  }

  private updateItems(): void {
    this.items.set(this.client!.conversation.getItems());
  }

  private setupClient(): void {
    this.client!.updateSession({
      input_audio_transcription: { model: 'whisper-1' },
    });
    this.client!.updateSession({
      turn_detection: { type: 'server_vad' },
    });
    fromEvent(this.client!, 'error')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event: any) => console.error(event));
    fromEvent(this.client!, 'conversation.interrupted')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => {
          const interruptResult: {
            trackId: string | null;
            offset: number;
            currentTime: number;
          } = this.wavStreamPlayer.interrupt();
          if (interruptResult?.trackId) {
            const { trackId, offset } = interruptResult;
            this.client!.cancelResponse(trackId, offset);
          }
        }),
        catchError((error) => {
          console.error('Error interrupting conversation:', error);
          return EMPTY;
        })
      )
      .subscribe();
    fromEvent(this.client!, 'conversation.updated')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(({ item, delta }: any) => {
          if (delta?.audio) {
            this.wavStreamPlayer.add16BitPCM(delta.audio, item.id);
          }
          this.updateItems();
        }),
        catchError((error) => {
          console.error('Error updating conversation:', error);
          return EMPTY;
        })
      )
      .subscribe();

    this.updateItems();
  }

  sendTextMessage(message: string): void {
    if (this.isConversationConnected() && this.isClientConnected()) {
      this.client!.sendUserMessageContent([
        { type: 'input_text', text: message },
      ]);
    } else {
      console.warn('Cannot send message: Not connected');
    }
  }

  getFrequencyData(
    analysisType: 'frequency' | 'music' | 'voice' = 'frequency',
    minDecibels: number = -120,
    maxDecibels: number = -120
  ) {
    return this.wavRecorder.getFrequencies(
      analysisType,
      minDecibels,
      maxDecibels
    );
  }
  public getStreamFrequencyData(
    analysisType: 'frequency' | 'music' | 'voice' = 'frequency',
    minDecibels: number = -100,
    maxDecibels: number = -30
  ) {
    return this.wavStreamPlayer.getFrequencies(
      analysisType,
      minDecibels,
      maxDecibels
    );
  }
  updateVoice(voiceInput: string): void {
    // Convert the input string to a valid VoiceOption through a switch statement
    let validVoice: string;

    switch (voiceInput) {
      case 'verse':
        validVoice = 'verse';
        if (validVoice !== this.currentVoice()) {
          this.currentVoice.set(validVoice);
          this.client!.updateSession({
            voice: 'verse',
          });
          console.log(`Voice updated to: ${validVoice}`);
        }
        break;
      case 'alloy':
        validVoice = 'alloy';
        if (validVoice !== this.currentVoice()) {
          this.currentVoice.set(validVoice);
          this.client!.updateSession({
            voice: 'alloy',
          });
          console.log(`Voice updated to: ${validVoice}`);
        }
        break;

      default:
        console.warn(
          `Invalid voice type "${voiceInput}", defaulting to "verse"`
        );
        validVoice = 'verse';
        break;
    }
  }
}
