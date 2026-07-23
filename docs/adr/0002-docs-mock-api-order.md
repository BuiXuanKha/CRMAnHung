# ADR 0002 — Docs → Skill → Contract → UI mock → API

- **Status:** Accepted
- **Date:** 2026-07-23
- **Context:** Hệ cũ viết “nghĩ tới đâu làm tới đó” → god-file, khó mở rộng. Cần quy trình buộc làm rõ nghiệp vụ trước khi code.

## Quyết định

Mọi feature domain đi theo thứ tự trong [PLAYBOOK.md](../PLAYBOOK.md):

1. Docs domain  
2. Skill (nếu pattern mới)  
3. Contract Zod shared  
4. UI + mock data  
5. API thật  
6. Nối UI → API  
7. Extension (nếu cần)  

## Lý do

- **UI mock trước API** buộc chốt UX + contract sớm; tránh API “đoán” rồi sửa 3 lần.
- **Docs trước** giữ kiến thức ngoài đầu người viết.
- **Skill** để agent/người sau làm đúng convention repo, không invent lại.

## Hệ quả

- PR có thể ship UI mock riêng (flag `VITE_USE_MOCK`) trước khi API xong.
- Không chấp nhận PR “chỉ API” khi chưa có docs domain tương ứng (trừ infra/P0).

## Không áp dụng cho

- Hotfix bảo mật / bug production staging.
- Thay đổi thuần infra (CI, nginx) — vẫn nên có note trong DEPLOYMENT.
