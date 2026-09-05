/**
 * Nhận diện tên người đa ngôn ngữ (Latin/VN, Hàn, Trung, Nhật, Thái, …).
 *
 * Bảng dịch tên hàm (tên trong code giữ nguyên để extension khác gọi được):
 *
 * | Tên trong code              | Tên tiếng Việt (dễ hiểu)              |
 * |-----------------------------|----------------------------------------|
 * | normalizePersonNameText     | Làm sạch chuỗi tên                     |
 * | hasPersonNameLetters        | Có phải chữ tên người không            |
 * | usesCompactNameScript       | Tên viết kiểu chữ gọn (Hán/Hàn/Nhật…)  |
 * | minPersonNameLength         | Độ dài tối thiểu coi là tên            |
 * | isShortSingleTokenName      | Tên quá ngắn, một từ, bỏ qua           |
 */
(function () {
  "use strict";

  /** Các ký tự thường gặp trong tên kiểu Trung, Nhật, Hàn (một chữ cũng có thể là cả họ tên). */
  const CJK_HANGUL_KANA_RE =
    /[\u4E00-\u9FFF\u3400-\u4DBF\u3040-\u30FF\uAC00-\uD7AF\u1100-\u11FF]/;

  /**
   * Làm sạch chuỗi tên (normalizePersonNameText)
   * Gom khoảng trắng thừa, bỏ khoảng đầu/cuối — ví dụ "  Nguyễn   Văn A  " → "Nguyễn Văn A".
   */
  function normalizePersonNameText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Có phải chữ tên người không (hasPersonNameLetters)
   * Kiểm tra chuỗi có chứa chữ cái thật (Latin, tiếng Việt có dấu, hoặc chữ Hán/Hàn/Nhật…),
   * không phải chỉ số hoặc ký hiệu lạ.
   */
  function hasPersonNameLetters(text) {
    if (!text) return false;
    try {
      return /\p{L}/u.test(text);
    } catch {
      return /[A-Za-z\u00C0-\u1EF9]/.test(text) || CJK_HANGUL_KANA_RE.test(text);
    }
  }

  /**
   * Tên viết kiểu chữ gọn — Hán/Hàn/Nhật… (usesCompactNameScript)
   * Một ký tự có thể là cả tên (vd. 「李明」), khác với tên Latin thường cần nhiều chữ hơn.
   */
  function usesCompactNameScript(text) {
    if (!text) return false;
    if (CJK_HANGUL_KANA_RE.test(text)) return true;
    try {
      return /\p{Script=Han}|\p{Script=Hangul}|\p{Script=Hiragana}|\p{Script=Katakana}/u.test(
        text,
      );
    } catch {
      return false;
    }
  }

  /**
   * Độ dài tối thiểu coi là tên (minPersonNameLength)
   * Tên chữ gọn (Hán/Hàn/Nhật): ít nhất 2 ký tự. Tên Latin/Việt: ít nhất 4 ký tự.
   */
  function minPersonNameLength(text) {
    return usesCompactNameScript(text) ? 2 : 4;
  }

  /**
   * Tên quá ngắn, một từ — bỏ qua (isShortSingleTokenName)
   * Một từ duy nhất và ngắn hơn ngưỡng trên → không coi là tên khách (tránh nhầm "OK", "Aa"…).
   */
  function isShortSingleTokenName(text) {
    const clean = normalizePersonNameText(text);
    if (!clean || /\s/.test(clean)) return false;
    return clean.length < minPersonNameLength(clean);
  }

  window.__ANHUNGLAND_PERSON_NAME__ = {
    normalizePersonNameText,
    hasPersonNameLetters,
    usesCompactNameScript,
    minPersonNameLength,
    isShortSingleTokenName,
  };
})();
