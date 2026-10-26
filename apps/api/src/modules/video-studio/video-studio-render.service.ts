import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type CreatomateRender = {
  id?: string;
  status?: string;
  url?: string;
  error_message?: string;
};

@Injectable()
export class VideoStudioRenderService {
  constructor(private readonly config: ConfigService) {}

  private apiKey(): string {
    const key = this.config.get<string>('CREATOMATE_API_KEY')?.trim();
    if (!key) {
      throw new ServiceUnavailableException(
        'Chưa cấu hình CREATOMATE_API_KEY trên server.',
      );
    }
    return key;
  }

  /** Poll until succeeded; returns MP4 URL (temporary on Creatomate CDN). */
  async renderVerticalScene(input: {
    videoUrl: string;
    audioUrl: string;
    durationSec: number;
  }): Promise<string> {
    const duration = Math.min(Math.max(input.durationSec, 3), 60);
    const body = {
      output_format: 'mp4',
      width: 1080,
      height: 1920,
      duration,
      elements: [
        {
          type: 'video',
          source: input.videoUrl,
          time: 0,
          duration,
          fit: 'cover',
        },
        {
          type: 'audio',
          source: input.audioUrl,
          time: 0,
          duration,
        },
      ],
    };

    const created = await this.postRender(body);
    const id = created.id;
    if (!id) {
      throw new BadRequestException('Creatomate không trả id render.');
    }
    return this.waitForRender(id);
  }

  /** Concat approved scene MP4 URLs into one vertical video. */
  async renderFinalMontage(sceneMp4Urls: string[], sceneDurations: number[]): Promise<string> {
    if (sceneMp4Urls.length === 0) {
      throw new BadRequestException('Không có cảnh để ghép.');
    }
    let time = 0;
    const elements: Record<string, unknown>[] = [];
    for (let i = 0; i < sceneMp4Urls.length; i++) {
      const duration = Math.min(Math.max(sceneDurations[i] ?? 8, 3), 60);
      elements.push({
        type: 'video',
        source: sceneMp4Urls[i],
        time,
        duration,
        fit: 'cover',
      });
      time += duration;
    }

    const body = {
      output_format: 'mp4',
      width: 1080,
      height: 1920,
      duration: time,
      elements,
    };

    const created = await this.postRender(body);
    const id = created.id;
    if (!id) {
      throw new BadRequestException('Creatomate không trả id render cuối.');
    }
    return this.waitForRender(id);
  }

  private async postRender(body: Record<string, unknown>): Promise<CreatomateRender> {
    let res: Response;
    try {
      res = await fetch('https://api.creatomate.com/v2/renders', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch {
      throw new ServiceUnavailableException('Không kết nối được Creatomate.');
    }

    const data = (await res.json().catch(() => ({}))) as CreatomateRender & {
      hint?: string;
    };
    if (!res.ok) {
      throw new BadRequestException(
        data.hint?.trim() || `Creatomate lỗi (${res.status}).`,
      );
    }
    return data;
  }

  private async waitForRender(renderId: string): Promise<string> {
    const maxAttempts = 40;
    for (let i = 0; i < maxAttempts; i++) {
      await sleep(3000);
      let res: Response;
      try {
        res = await fetch(`https://api.creatomate.com/v2/renders/${renderId}`, {
          headers: { Authorization: `Bearer ${this.apiKey()}` },
        });
      } catch {
        continue;
      }
      const data = (await res.json().catch(() => ({}))) as CreatomateRender;
      if (data.status === 'succeeded' && data.url) {
        return data.url;
      }
      if (data.status === 'failed') {
        throw new BadRequestException(
          data.error_message?.trim() || 'Creatomate render thất bại.',
        );
      }
    }
    throw new BadRequestException('Creatomate render quá lâu — thử lại sau.');
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
