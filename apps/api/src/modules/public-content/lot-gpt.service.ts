import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { LotGptRequestDto } from './dto/lot-gpt.dto';

const DEFAULT_MODEL = 'gpt-5.6-sol';

const LOT_GPT_SYSTEM_PROMPT = `Bạn là copywriter bất động sản Việt Nam cho An Hưng Land.
Nhận JSON thông tin lô đất (tiêu đề, địa chỉ, diện tích, giá, excerpt, extraDescription, …).
Viết nội dung bài đăng rao bán hấp dẫn, chính xác, tiếng Việt tự nhiên.
extraDescription (nếu có) là ghi chú thực địa do NV nhập — ưu tiên đưa vào bodyHtml/excerpt khi phù hợp.
Không bịa số liệu ngoài dữ liệu đầu vào; thiếu thông tin thì không đoán.
Trả lời bằng JSON hợp lệ (không markdown, không giải thích thêm) với các trường:
title (string), excerpt (string, ≤160 ký tự), bodyHtml (string HTML đơn giản: p, strong, ul/li), metaDescription (string, ≤160 ký tự).`;

type OpenAiChatResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
};

@Injectable()
export class LotGptService {
  constructor(private readonly config: ConfigService) {}

  async generateContent(payload: LotGptRequestDto): Promise<{ content: string }> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY')?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Chưa cấu hình OPENAI_API_KEY trên server. Liên hệ quản trị.',
      );
    }

    const model = this.config.get<string>('OPENAI_MODEL')?.trim() || DEFAULT_MODEL;
    const userContent = JSON.stringify(payload, null, 2);

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
          temperature: 0.6,
          messages: [
            { role: 'system', content: LOT_GPT_SYSTEM_PROMPT },
            { role: 'user', content: userContent },
          ],
        }),
      });
    } catch {
      throw new ServiceUnavailableException('Không kết nối được OpenAI. Thử lại sau.');
    }

    const data = (await res.json().catch(() => ({}))) as OpenAiChatResponse;
    if (!res.ok) {
      const msg = data.error?.message?.trim();
      if (res.status === 401) {
        throw new ServiceUnavailableException('OpenAI từ chối API key. Kiểm tra OPENAI_API_KEY.');
      }
      throw new BadRequestException(
        msg ? `OpenAI: ${msg}` : `OpenAI trả lỗi (${res.status}).`,
      );
    }

    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new BadRequestException('OpenAI không trả nội dung.');
    }

    return { content: this.normalizeAssistantContent(content) };
  }

  /** Strip markdown code fences if the model wraps JSON. */
  private normalizeAssistantContent(raw: string): string {
    const fenced = raw.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/i);
    const inner = (fenced?.[1] ?? raw).trim();
    try {
      return `${JSON.stringify(JSON.parse(inner), null, 2)}\n`;
    } catch {
      return `${inner}\n`;
    }
  }
}
