//
// プラグイン側から以下のような ActXiv オブジェクトとしてデータが提供される
//
// var ActXiv = {
//    "Encounter": {...},
//    "Combatant": {
//        "PlayerName1": {...},
//        "PlayerName2": {...},
//        ...
//    }
// };
//
// データの更新は 1 秒毎。
//
// プラグインから onOverlayDataUpdate イベントが発行されるので、それを受信することもできる
// イベントハンドラの第一引数の detail プロパティ内に上記のオブジェクトが入る
//

//
// 表示設定 (2)
//

// エンカウント情報の定義
var encounterDefine = "Time: {duration} / DPS: {ENCDPS}";

// 上記のエンカウント情報を HTML として扱うなら true
var useHTMLEncounterDefine = false;

// ヘッダの定義
var headerDefine = [
  //{ text: "#", width: "5%", align: "center" },
  { text: "Name", width: "10%", align: "left" },
  { text: "Job", width: "5%", align: "center" },
  { text: "DPS", width: "10%", align: "center", span: 1 },
  { text: "HPS", width: "10%", align: "center", span: 1 },
  { text: "OH", width: "10%", align: "center", span: 1 },
  { text: "Death", width: "10%", align: "center", span: 1 },
  //{ text: "DPS %", width: "5%", align: "center", span: 1 },

  { text: "Crt %", width: "5%", align: "center" },
];

// 表示するデータの定義
var bodyDefine = [
  //{ text: rankingText, width: "5%", align: "center", effect: deadYatsuEffect },
  { text: "{name}", width: "10%" },
  { html: "<img src='./images/default/hd/{JobOrName}.png' onError=\"this.onerror=null;this.src='./images/error.png';\" />", width: "5%", align: "center" },
  { text: "{encdps}", width: "10%", align: "center" },
  { text: "{enchps}", width: "10%", align: "center" },
  { text: "{OverHealPct}", width: "10%", align: "center" },
  { text: "{deaths}", width: "10%", align: "center" },
  //{ text: "{damage%}", width: "5%", align: "center" },
  { text: "{crithit%}", width: "5%", align: "center" },
];

// 順位を表示する（text に関数を指定する例）
// 引数:
//  combatant : キャラクターのデータ。combatant["..."]でデータを取得できる。
//  index : キャラクターの並び順。一番上は 0 で、その後は 1 ずつ増える。
// 戻り値:
//  表示するテキスト。
//  ACT のタグは展開されないので、展開したい場合は parseActFormat 関数を使用してください。
function rankingText(combatant, index) {
  // 1 から始まる番号を返す
  return (index + 1).toString();
}

// 死亡奴を赤くする（effect の例）
// 引数:
//  cell : セルの DOM 要素
//  combatant : キャラクターのデータ。combatant["..."]でデータを取得できる。
//  index: キャラクターの並び順。一番上は 0 で、その後は 1 ずつ増える。
// 戻り値: なし
function deadYatsuEffect(cell, combatant, index) {
  // デス数を整数値に変換
  var deaths = parseInt(combatant["deaths"]);
  // デス数が 0 よりも大きいなら
  if (deaths > 0) {
    // 赤くする
    cell.style.color = "#FFA0A0";
    cell.style.textShadow = "-1px 0 3px #802020, 0 1px 3px #802020, 1px 0 3px #802020, 0 -1px 3px #802020";
  }
}

//
// 以下表示用スクリプト
//

// onOverlayDataUpdate イベントを購読
document.addEventListener("onOverlayDataUpdate", function (e) {
  update(e.detail);
});
window.addEventListener("message", function (e) {
  if (e.data.type === "onOverlayDataUpdate") {
    update(e.data.detail);
  }
});

// 表示要素の更新
function update(data) {
  updateEncounter(data);
  if (document.getElementById("combatantTableHeader") == null) {
    updateCombatantListHeader();
  }
  updateCombatantList(data);
}

// エンカウント情報を更新する
function updateEncounter(data) {
  // 要素取得
  var encounterElem = document.getElementById("encounter");

  // テキスト取得
  var elementText;
  if (typeof encounterDefine === "function") {
    elementText = encounterDefine(data.Encounter);
  } else if (typeof encounterDefine === "string") {
    elementText = parseActFormat(encounterDefine, data.Encounter);
  } else {
    console.log("updateEncounter: Could not update the encounter element due to invalid type.");
    return;
  }

  // テキスト設定
  if (!useHTMLEncounterDefine) {
    encounterElem.innerText = parseActFormat(encounterDefine, data.Encounter);
  } else {
    encounterElem.innerHTML = parseActFormat(encounterDefine, data.Encounter);
  }
}

// ヘッダを更新する
function updateCombatantListHeader() {
  var table = document.getElementById("combatantTable");
  var tableHeader = document.createElement("thead");
  tableHeader.id = "combatantTableHeader";
  var headerRow = tableHeader.insertRow();

  for (var i = 0; i < headerDefine.length; i++) {
    var cell = document.createElement("th");
    // テキスト設定
    if (typeof headerDefine[i].text !== "undefined") {
      cell.innerText = headerDefine[i].text;
    } else if (typeof headerDefine[i].html !== "undefined") {
      cell.innerHTML = headerDefine[i].html;
    }
    // 幅設定
    cell.style.width = headerDefine[i].width;
    cell.style.maxWidth = headerDefine[i].width;
    // 横結合数設定
    if (typeof headerDefine[i].span !== "undefined") {
      cell.colSpan = headerDefine[i].span;
    }
    // 行揃え設定
    if (typeof headerDefine[i].align !== "undefined") {
      cell.style["textAlign"] = headerDefine[i].align;
    }
    headerRow.appendChild(cell);
  }

  table.tHead = tableHeader;
}

// プレイヤーリストを更新する
function updateCombatantList(data) {
  // 要素取得＆作成
  var table = document.getElementById("combatantTable");
  var oldTableBody = table.tBodies.namedItem("combatantTableBody");
  var newTableBody = document.createElement("tbody");
  newTableBody.id = "combatantTableBody";

  // tbody の内容を作成
  var combatantIndex = 0;
  for (var combatantName in data.Combatant) {
    var combatant = data.Combatant[combatantName];
    combatant.JobOrName = combatant.Job.toLowerCase() || combatantName;
    var egiSearch = combatant.JobOrName.indexOf("-Egi (");
    if (egiSearch != -1) {
      combatant.JobOrName = combatant.JobOrName.substring(0, egiSearch);
    } else if (combatant.JobOrName.indexOf("Eos (") == 0) {
      combatant.JobOrName = "Eos";
    } else if (combatant.JobOrName.indexOf("Selene (") == 0) {
      combatant.JobOrName = "Selene";
    } else if (combatant.JobOrName.indexOf("Carbuncle (") != -1) {
      // currently no carbuncle pics
      combatant.JobOrName = "pet";
    } else if (combatant.JobOrName.indexOf(" (") != -1) {
      combatant.JobOrName = "choco";
    }

    var tableRow = newTableBody.insertRow(newTableBody.rows.length);
    for (var i = 0; i < bodyDefine.length; i++) {
      var cell = tableRow.insertCell(i);
      // テキスト設定
      if (typeof bodyDefine[i].text !== "undefined") {
        var cellText;
        if (typeof bodyDefine[i].text === "function") {
          cellText = bodyDefine[i].text(combatant, combatantIndex);
        } else {
          cellText = parseActFormat(bodyDefine[i].text, combatant);
        }
        cell.innerText = cellText;
      } else if (typeof bodyDefine[i].html !== "undefined") {
        var cellHTML;
        if (typeof bodyDefine[i].html === "function") {
          cellHTML = bodyDefine[i].html(combatant, combatantIndex);
        } else {
          cellHTML = parseActFormat(bodyDefine[i].html, combatant);
        }
        cell.innerHTML = cellHTML;
      }
      // 幅設定
      cell.style.width = bodyDefine[i].width;
      cell.style.maxWidth = bodyDefine[i].width;
      // 行構え設定
      if (typeof bodyDefine[i].align !== "undefined") {
        cell.style.textAlign = bodyDefine[i].align;
      }
      // エフェクト実行
      if (typeof bodyDefine[i].effect === "function") {
        bodyDefine[i].effect(cell, combatant, combatantIndex);
      }
    }
    combatantIndex++;
  }

  // tbody が既に存在していたら置換、そうでないならテーブルに追加
  if (oldTableBody != void 0) {
    table.replaceChild(newTableBody, oldTableBody);
  } else {
    table.appendChild(newTableBody);
  }
}

// Miniparse フォーマット文字列を解析し、表示文字列を取得する
function parseActFormat(str, dictionary) {
  var result = "";

  var currentIndex = 0;
  do {
    var openBraceIndex = str.indexOf("{", currentIndex);
    if (openBraceIndex < 0) {
      result += str.slice(currentIndex);
      break;
    } else {
      result += str.slice(currentIndex, openBraceIndex);
      var closeBraceIndex = str.indexOf("}", openBraceIndex);
      if (closeBraceIndex < 0) {
        // parse error!
        console.log("parseActFormat: Parse error: missing close-brace for " + openBraceIndex.toString() + ".");
        return "ERROR";
      } else {
        var tag = str.slice(openBraceIndex + 1, closeBraceIndex);
        if (typeof dictionary[tag] !== "undefined") {
          result += dictionary[tag];
        } else {
          console.log("parseActFormat: Unknown tag: " + tag);
          result += "ERROR";
        }
        currentIndex = closeBraceIndex + 1;
      }
    }
  } while (currentIndex < str.length);

  return result;
}
