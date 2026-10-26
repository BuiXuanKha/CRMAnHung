import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VideoStudioTtsService {
  constructor(private readonly config: ConfigService) {}

  /** Returns MP3 bytes. */
  async synthesize(narrationText: string): Promise<Buffer> {
    const apiKey = this.config.get<string>('ELEVENLABS_API_KEY')?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Chưa cấu hình ELEVENLABS_API_KEY trên server.',
      );
    }

    const voiceId =
      this.config.get<string>('ELEVENLABS_VOICE_ID')?.trim() ||
      'wBXNqKUATyqu0RtYt25i';

    const text = narrationText.trim();
    if (!text) {
      throw new BadRequestException('Cần lời thuyết minh trước khi tạo giọng đọc.');
    }

    let res: Response;
    try {
      res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
          }),
        },
      );
    } catch {
      throw new ServiceUnavailableException('Không kết nối được ElevenLabs.');
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      let detail = errText.slice(0, 400);
      try {
        const j = JSON.parse(errText) as { detail?: { message?: string } };
        detail = j.detail?.message ?? detail;
      } catch {
        // keep raw
      }
      if (res.status === 402) {
        throw new BadRequestException(
          'ElevenLabs: cần gói Creator hoặc credit API (paid_plan_required).',
        );
      }
      throw new BadRequestException(
        detail ? `ElevenLabs: ${detail}` : `ElevenLabs lỗi (${res.status}).`,
      );
    }

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 100) {
      throw new BadRequestException('ElevenLabs trả file âm thanh rỗng.');
    }
    return buf;
  }
}
