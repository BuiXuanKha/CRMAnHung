import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PostGptRequestDto } from './dto/post-gpt.dto';
import { POST_GPT_SYSTEM_PROMPT } from './post-gpt-prompt';

const DEFAULT_MODEL = 'gpt-5.6-sol';

type OpenAiChatResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
};

@Injectable()
export class PostGptService {
  constructor(private readonly config: ConfigService) {}

  async generateContent(payload: PostGptRequestDto): Promise<{ content: string }> {
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
          messages: [
            { role: 'system', content: POST_GPT_SYSTEM_PROMPT },
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
