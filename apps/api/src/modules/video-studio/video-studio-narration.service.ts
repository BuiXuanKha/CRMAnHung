import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const DEFAULT_MODEL = 'gpt-5.6-sol';

const SYSTEM = `Bạn là biên tập video bất động sản AnHungLand.
Viết lời thuyết minh tiếng Việt, tự nhiên, 2–4 câu, phù hợp đọc voice-over (ElevenLabs).
Không emoji, không markdown. Chỉ trả plain text lời đọc.`;

type OpenAiChatResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
};

export type NarrationContext = {
  sceneKind: string;
  sceneTitle: string;
  lodatTitle: string;
  locationLine: string;
  areaM2: number | null;
  frontageM: number | null;
  note: string | null;
};

@Injectable()
export class VideoStudioNarrationService {
  constructor(private readonly config: ConfigService) {}

  async generate(ctx: NarrationContext): Promise<{ narrationText: string; aiNotes: string }> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY')?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Chưa cấu hình OPENAI_API_KEY trên server. Liên hệ quản trị.',
      );
    }
    const model = this.config.get<string>('OPENAI_MODEL')?.trim() || DEFAULT_MODEL;

    const userPayload = {
      scene: ctx.sceneTitle,
      sceneKind: ctx.sceneKind,
      lot: {
        title: ctx.lodatTitle,
        location: ctx.locationLine,
        areaM2: ctx.areaM2,
        frontageM: ctx.frontageM,
        note: ctx.note,
      },
      instruction:
        'Viết lời thuyết minh cho cảnh video dọc 9:16. Nhấn đúng góc cảnh (tổng quan, chi tiết, vị trí, điểm mạnh, CTA, POI…).',
    };

    let res: Response;
    try {
      res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM },
            { role: 'user', content: JSON.stringify(userPayload, null, 2) },
          ],
          temperature: 0.7,
        }),
      });
    } catch {
      throw new ServiceUnavailableException('Không kết nối được OpenAI. Thử lại sau.');
    }

    const data = (await res.json().catch(() => ({}))) as OpenAiChatResponse;
    if (!res.ok) {
      const msg = data.error?.message?.trim();
      throw new BadRequestException(
        msg ? `OpenAI: ${msg}` : `OpenAI trả lỗi (${res.status}).`,
      );
    }

    const narrationText = data.choices?.[0]?.message?.content?.trim();
    if (!narrationText) {
      throw new BadRequestException('OpenAI không trả lời thuyết minh.');
    }

    return {
      narrationText,
      aiNotes: `GPT (${model}) · cảnh ${ctx.sceneTitle}`,
    };
  }
}
