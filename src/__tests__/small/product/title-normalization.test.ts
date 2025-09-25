import { test, expect } from "@jest/globals";
import Doujinshi from "../../../Doujinshi";
import { AcceptedService } from "../../../constant";

const makeDoujinshi = (title: string) => {
  return Doujinshi.make(
    AcceptedService.fanza,
    title,
    ["author1", "author2"],
    "https://example.com",
    null,
    "サークル名",
    "イベント名",
  );
};

test("巻数のカッコはとる_半角", () => {
  const doujin = makeDoujinshi("タイトル(1)");
  expect(doujin.titleForSearch).toBe("タイトル 1");
});

test("巻数のカッコはとる_全角", () => {
  const doujin = makeDoujinshi("タイトル（1）");
  expect(doujin.titleForSearch).toBe("タイトル 1");
});

test("巻数のカッコは全角でもとる", () => {
  const doujin = makeDoujinshi("タイトル（1）");
  expect(doujin.titleForSearch).toBe("タイトル 1");
});

test("文頭と文末の()は削除される。文中に()があっても問題ない", () => {
  const doujin = makeDoujinshi(
    "(最新刊) 刑部姫コスプレイヤーのフリをした刑部姫(本人)が何故か俺のサークルでコスプレ売り子している話 (同人BOOKS)",
  );
  expect(doujin.titleForSearch).toBe(
    "刑部姫コスプレイヤーのフリをした刑部姫 本人 が何故か俺のサークルでコスプレ売り子している話",
  );
});

test("文頭と文末の全角（）は削除される。文中にあっても問題ない", () => {
  const doujin = makeDoujinshi(
    "（最新刊） 刑部姫コスプレイヤーのフリをした刑部姫（本人）が何故か俺のサークルでコスプレ売り子している話 （同人BOOKS）",
  );
  expect(doujin.titleForSearch).toBe(
    "刑部姫コスプレイヤーのフリをした刑部姫 本人 が何故か俺のサークルでコスプレ売り子している話",
  );
});

test("磔（ハリツケ）", () => {
  const doujin = makeDoujinshi("磔（ハリツケ）");
  expect(doujin.titleForSearch).toBe("磔");
});

test("中間カッコのあるタイトルはスペースに_半角", () => {
  const doujin = makeDoujinshi("猥婦(ワイフ)アウト");
  expect(doujin.titleForSearch).toBe("猥婦 ワイフ アウト");
});

test("中間にカッコのあるタイトルはスペースに_全角", () => {
  const doujin = makeDoujinshi("猥婦（ワイフ）アウト");
  expect(doujin.titleForSearch).toBe("猥婦 ワイフ アウト");
});

test("【】があったら除外", () => {
  const doujin = makeDoujinshi(
    "【超加速オナサポ鉄道】快楽急行『射精我慢地獄行き』多段階連続変速しこしこボイス搭載～田舎訛り見習いロリ狐と淫乱おほおほ喘ぎ声エッチをしながら射精許可駅を目指せ!",
  );
  expect(doujin.titleForSearch).toBe(
    "快楽急行『射精我慢地獄行き』多段階連続変速しこしこボイス搭載 田舎訛り見習いロリ狐と淫乱おほおほ喘ぎ声エッチをしながら射精許可駅を目指せ",
  );
});

test("【推しの子】は特別扱い", () => {
  const doujin = makeDoujinshi("【推しの子】");
  expect(doujin.titleForSearch).toBe("【推しの子】");
});

test("数字カッコは外れる", () => {
  const doujin = makeDoujinshi(
    "刑部姫コスプレイヤーのフリをした刑部姫(本人)が何故か俺のサークルでコスプレ売り子している話(2)",
  );
  expect(doujin.titleForSearch).toBe(
    "刑部姫コスプレイヤーのフリをした刑部姫 本人 が何故か俺のサークルでコスプレ売り子している話 2",
  );
});

test("行頭や末尾の！は外す", () => {
  const doujin = makeDoujinshi("!俺は屑だからこそ救われる権利がある!");
  expect(doujin.titleForSearch).toBe("俺は屑だからこそ救われる権利がある");
});

test("中間にある!は半角にする", () => {
  const doujin = makeDoujinshi("孕ませ！！性春");
  expect(doujin.titleForSearch).toBe("孕ませ 性春");
});

test("中黒はスペースに変換する", () => {
  const doujin = makeDoujinshi("種付け・交尾んびん");
  expect(doujin.titleForSearch).toBe("種付け 交尾んびん");
});

test("ガールズ・オン・ザ・ブルーフィルム", () => {
  const doujin = makeDoujinshi("ガールズ・オン・ザ・ブルーフィルム");
  expect(doujin.titleForSearch).toBe("ガールズ オン ザ ブルーフィルム");
});

test("～（U+FF5E）はスペースに変換", () => {
  const doujin = makeDoujinshi("限界性欲～我慢できない人妻たち～");
  expect(doujin.titleForSearch).toBe("限界性欲 我慢できない人妻たち");
});

test("〜 （U+301C）はスペースに変換", () => {
  const doujin = makeDoujinshi("限界性欲〜我慢できない人妻たち〜");
  expect(doujin.titleForSearch).toBe("限界性欲 我慢できない人妻たち");
});

test("伏字の●はスペースに変換", () => {
  const doujin = makeDoujinshi("ドスケベ催●リベンジ");
  expect(doujin.titleForSearch).toBe("ドスケベ催 リベンジ");
});

test("?はスペースに変換", () => {
  const doujin = makeDoujinshi("ワルいこになっちゃった?？");
  expect(doujin.titleForSearch).toBe("ワルいこになっちゃった");
});

test("○はスペースに変換", () => {
  const doujin = makeDoujinshi("J○姪っ子の弱味を握った日");
  expect(doujin.titleForSearch).toBe("J 姪っ子の弱味を握った日");
});

test("全角は半角に変換", () => {
  const doujin = makeDoujinshi("１２３４ＩＮＳＵＬＴ（インサルト）");
  expect(doujin.titleForSearch).toBe("1234INSULT");
});

test("，はスペースに変換", () => {
  const doujin = makeDoujinshi(
    "牝歓（メスカン） カレ氏に絶対言えない，カレパパ種付け生交尾",
  );
  expect(doujin.titleForSearch).toBe(
    "牝歓 メスカン カレ氏に絶対言えない カレパパ種付け生交尾",
  );
});

test("検索語彙は4つまでにする", () => {
  const doujin = makeDoujinshi(
    "1LDK＋JK いきなり同居？密着！？初エッチ！！？ 第1集",
  );
  expect(doujin.titleForSearch).toBe("1LDK＋JK いきなり同居 密着 初エッチ");
});

test("末尾の▼は無視する", () => {
  const doujin = makeDoujinshi("犯してあげる▼");
  expect(doujin.titleForSearch).toBe("犯してあげる");
});

test("表記揺れする記号は半角になる", () => {
  const doujin = makeDoujinshi("、。（）！？");
  expect(doujin.titleForSearch).toBe("、。");
});

test("#はスペースに変換", () => {
  const doujin = makeDoujinshi(
    "旧校舎裏文化祭＃2 ご注文は交尾ですか？動物ふれあいカフェ編",
  );
  expect(doujin.titleForSearch).toBe(
    "旧校舎裏文化祭 2 ご注文は交尾ですか 動物ふれあいカフェ編",
  );
});

test("ーはスペースに変換", () => {
  const doujin = makeDoujinshi(
    "陽菜子の売春日記—性知識の無いJ○に課せられた淫らな契約—",
  );
  expect(doujin.titleForSearch).toBe(
    "陽菜子の売春日記 性知識の無いJ に課せられた淫らな契約",
  );
  const doujin2 = makeDoujinshi(
    "陽菜子の売春日記―性知識の無いJ○に課せられた淫らな契約―",
  );
  expect(doujin2.titleForSearch).toBe(
    "陽菜子の売春日記 性知識の無いJ に課せられた淫らな契約",
  );
});