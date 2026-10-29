/*
 * 学校ワークから作る問題の受け入れ口。
 * ワークのPDF・写真がそろったら、内容を確認してこの配列へ追加する。
 * source は "same"（ワークからそのまま）または "similar"（考え方を保って変更）。
 */
window.NOBI_WORKBOOK_QUESTIONS = [];

// 2026年9月 第2回定期テスト用。写真は問題文を丸写しするためではなく、
// 出題範囲・形式・難しさを合わせるための資料として確認した。
window.NOBI_WORKBOOK_SOURCES = [
  {
    subject: "社会",
    unit: "9月定期テスト範囲",
    files: ["IMG_3119.heic", "IMG_3120.heic", "IMG_3121.heic", "IMG_3122.heic", "IMG_3123.heic", "IMG_3124.heic", "IMG_3125.heic", "IMG_3126.heic", "IMG_3127.heic", "IMG_3128.heic"],
    topics: ["時代と世紀", "人類と古代文明", "アジア州", "ヨーロッパ州", "アフリカ州"]
  },
  {
    subject: "英語",
    unit: "9月定期テスト範囲",
    files: ["IMG_3129.heic", "IMG_3131.heic", "IMG_3132.heic", "IMG_3133.heic", "IMG_3134.heic", "IMG_3136.heic"],
    topics: ["be動詞と一般動詞", "疑問文と否定文", "過去形", "疑問詞", "語順"]
  },
  {
    subject: "国語",
    unit: "9月定期テスト範囲",
    files: ["IMG_3137.heic", "IMG_3138.heic", "IMG_3139.heic", "IMG_3140.heic", "IMG_3141.heic", "IMG_3142.heic", "IMG_3143.heic", "IMG_3144.heic", "IMG_3145.heic", "IMG_3146.heic", "IMG_3147.heic", "IMG_3148.heic", "IMG_3149.heic", "IMG_3150.heic"],
    topics: ["ベンチ", "森には魔法つかいがいる", "漢字・語句", "文の成分", "案内文", "意見文"]
  },
  {
    subject: "数学",
    unit: "素因数分解・文字式",
    files: [],
    topics: ["素因数分解", "文字式"],
    note: "写真がないため、ユーザー指定の単元から類題を作成"
  },
  {
    subject: "理科",
    unit: "動物の特徴と分類・物質の区別・密度",
    files: ["IMG_3080.heic", "IMG_3082.heic", "IMG_3102.heic", "IMG_3103.heic", "IMG_3104.heic", "IMG_3105.heic"],
    topics: ["脊椎動物と無脊椎動物", "動物の分類", "物体と物質", "有機物と無機物", "金属と非金属", "密度"],
    note: "追加写真33枚を確認し、学校の範囲表に含まれるワーク p10②〜13・p50〜52①・p54〜56 に合う部分だけを使用"
  }
];

/* 追加例（見本なので配列には入れない）
{
  grade: "中一",
  subject: "数学",
  unit: "文字と式",
  kind: "calc",
  source: "similar",
  question: "3x + 5x を計算しなさい",
  answer: "8x",
  type: "calc",
  work: "同類項の係数を足す"
}
*/
