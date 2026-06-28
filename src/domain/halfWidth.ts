// 全角 ASCII（U+FF01〜U+FF5E）は半角 ASCII（U+0021〜U+007E）から
// このオフセットだけずれた位置に並んでいる。
const FULLWIDTH_TO_HALFWIDTH_OFFSET = 0xfee0;

/**
 * `pattern` にマッチした全角文字だけを半角へ変換する。
 * 変換対象の文字クラスは呼び出し側が決める（英数字のみ・記号込みなど用途で異なるため）。
 */
export const toHalfWidth = (value: string, pattern: RegExp): string =>
  value.replace(pattern, (char) =>
    String.fromCharCode(char.charCodeAt(0) - FULLWIDTH_TO_HALFWIDTH_OFFSET),
  );
