let calendar;
let selectedDate = new Date().toISOString().slice(0, 10);
let srpeChart = null;
let hooperChart = null;

document.addEventListener("DOMContentLoaded", function () {
  // 数字ボタンを生成
  createNumberButtons("rpeButtons", 10);
  createNumberButtons("sleepButtons", 7);
  createNumberButtons("fatigueButtons", 7);
  createNumberButtons("stressButtons", 7);
  createNumberButtons("muscleButtons", 7);

  // RPE ヘルプ表示切り替え
  const rpeHelpBtn = document.getElementById("rpeHelpBtn");
  const rpeHelpBox = document.getElementById("rpeHelpBox");

  if (rpeHelpBtn && rpeHelpBox) {
    rpeHelpBtn.addEventListener("click", () => {
      rpeHelpBox.style.display =
        rpeHelpBox.style.display === "block" ? "none" : "block";
    });
  }

  // sRPE ヘルプ表示切り替え
  const srpeHelpBtn = document.getElementById("srpeHelpBtn");
  const srpeHelpBox = document.getElementById("srpeHelpBox");
  if (srpeHelpBtn && srpeHelpBox) {
    srpeHelpBtn.addEventListener("click", () => {
      srpeHelpBox.style.display =
        srpeHelpBox.style.display === "block" ? "none" : "block";
    });
  }

  // Hooper ヘルプ表示切り替え
  const hooperHelpBtn = document.getElementById("hooperHelpBtn");
  const hooperHelpBox = document.getElementById("hooperHelpBox");

  if (hooperHelpBtn && hooperHelpBox) {
    hooperHelpBtn.addEventListener("click", () => {
      hooperHelpBox.style.display =
        hooperHelpBox.style.display === "block" ? "none" : "block";
    });
  }

  // 練習時間セレクト（5分刻み）
  const timeSelect = document.getElementById("time");
  for (let i = 0; i <= 300; i += 5) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${i} 分`;
    timeSelect.appendChild(option);
    timeSelect.addEventListener("change", updateComputedDisplays);
  }

  const calendarEl = document.getElementById("calendar");
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    height: "auto",
    selectable: true,

    customButtons: {
      todaySelect: {
        text: "today",
        click: function () {
          calendar.today(); // 表示を今日の月へ移動
          const todayStr = new Date().toISOString().slice(0, 10);
          selectDate(todayStr); // ★今日を選択状態にする
        }
      }
    },

    headerToolbar: {
      left: "prev,next todaySelect",
      center: "title",
      right: ""
    },

    dateClick: function (info) {
      selectDate(info.dateStr);
    },
    datesSet: function () {
      const records = JSON.parse(localStorage.getItem("records")) || [];
      updateRecordedMarks(records);
      highlightSelectedDay();
    }
  });
  calendar.render();

  const initialRecords = JSON.parse(localStorage.getItem("records")) || [];
  updateRecordedMarks(initialRecords);
  selectDate(selectedDate);

  const startInput = document.getElementById("startDate");
  const endInput = document.getElementById("endDate");

  function onDateRangeChange() {
    if (!startInput || !endInput) return;

    let start = startInput.value;
    let end = endInput.value;
    // 両方入ってないと何もしない
    if (!start || !end) return;

    // 開始 > 終了 のときは入れ替える
    if (start > end) {
      const tmp = start;
      start = end;
      end = tmp;
      startInput.value = start;
      endInput.value = end;
    }

    renderAllGraphsByRange(start, end);
  }

  if (startInput) startInput.addEventListener("change", onDateRangeChange);
  if (endInput) endInput.addEventListener("change", onDateRangeChange);

  // ページ切り替え（1つのボタンで切り替え）
  document.getElementById("toGraphBtn").addEventListener("click", togglePage);

});

function togglePage() {
  const layout = document.getElementById("posterLayout");
  const graph = document.getElementById("graphPage");
  const btn = document.getElementById("toGraphBtn");
  const startInput = document.getElementById("startDate");
  const endInput = document.getElementById("endDate");

  if (layout.style.display !== "none") {
    // グラフページへ
    layout.style.display = "none";
    graph.style.display = "block";
    btn.textContent = "カレンダーに戻る";

    // 記録がある範囲で、デフォルトの開始/終了日を自動セット
    let records = JSON.parse(localStorage.getItem("records")) || [];
    if (records.length > 0) {
      records.sort((a, b) => new Date(a.date) - new Date(b.date));
      const first = records[0].date;
      const last = records[records.length - 1].date;

      if (startInput && !startInput.value) startInput.value = first;
      if (endInput && !endInput.value) endInput.value = last;

      const start = startInput ? startInput.value : first;
      const end = endInput ? endInput.value : last;

      renderAllGraphsByRange(start, end);
    }
  } else {
    // カレンダーページへ
    layout.style.display = "flex";
    graph.style.display = "none";
    btn.textContent = "グラフを表示する";
  }
}

// 数字ボタン生成
function createNumberButtons(containerId, max) {
  const container = document.getElementById(containerId);

  for (let i = 1; i <= max; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = i;

    // 0〜1 に正規化
    const ratio = (i - 1) / (max - 1);

    // 青 → 赤（RGBで補間：途中で緑/黄にならない）
    const start = { r: 90,  g: 150, b: 255 }; // 薄い青
    const end   = { r: 255, g: 110, b: 110 }; // 薄い赤

    let r = Math.round(start.r + (end.r - start.r) * ratio);
    let g = Math.round(start.g + (end.g - start.g) * ratio);
    let b = Math.round(start.b + (end.b - start.b) * ratio);

    // さらに薄くしたいなら白を混ぜる（0.0〜0.6くらいがおすすめ）
    const mix = 0.25;
    r = Math.round(r + (255 - r) * mix);
    g = Math.round(g + (255 - g) * mix);
    b = Math.round(b + (255 - b) * mix);

    btn.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    btn.style.color = "#111";
    btn.style.border = "1px solid rgba(0,0,0,0.08)";

    btn.addEventListener("click", () => {
      [...container.children].forEach(c => c.classList.remove("selected"));
      btn.classList.add("selected");

      updateComputedDisplays();
    });

    container.appendChild(btn);
  }
}

function getSelectedValue(containerId) {
  const btn = document.querySelector(`#${containerId} .selected`);
  return btn ? parseInt(btn.textContent) : null;
}

function setSelectedValue(containerId, value) {
  const container = document.getElementById(containerId);
  [...container.children].forEach(c => {
    c.classList.remove("selected");
    if (parseInt(c.textContent) === value) c.classList.add("selected");
  });
}

function updateComputedDisplays() {
  // sRPE（RPE×時間）
  const rpe = getSelectedValue("rpeButtons");
  const timeStr = document.getElementById("time")?.value;
  const time = timeStr ? parseInt(timeStr) : null;

  const srpeEl = document.getElementById("srpeValue");
  if (srpeEl) {
    if (rpe != null && time != null && !Number.isNaN(time)) {
      srpeEl.textContent = rpe * time;
    } else {
      srpeEl.textContent = "-";
    }
  }

  // Hooper Index 合計（sleep+fatigue+stress+muscle）
  const sleep = getSelectedValue("sleepButtons");
  const fatigue = getSelectedValue("fatigueButtons");
  const stress = getSelectedValue("stressButtons");
  const muscle = getSelectedValue("muscleButtons");

  const hooperEl = document.getElementById("hooperTotal");
  if (hooperEl) {
    if (sleep != null && fatigue != null && stress != null && muscle != null) {
      hooperEl.textContent = sleep + fatigue + stress + muscle;
    } else {
      hooperEl.textContent = "-";
    }
  }
}

// 記録済みの日に赤丸を付ける
function updateRecordedMarks(records) {
  document.querySelectorAll(".fc-daygrid-day-number").forEach(n => n.classList.remove("recorded"));

  const set = new Set((records || []).map(r => r.date));
  document.querySelectorAll(".fc-daygrid-day").forEach(cell => {
    const dateStr = cell.getAttribute("data-date");
    const numberEl = cell.querySelector(".fc-daygrid-day-number");
    if (numberEl && set.has(dateStr)) {
      numberEl.classList.add("recorded");
    }
  });
}

// 選択日の青枠を付ける
function highlightSelectedDay() {
  document.querySelectorAll(".fc-daygrid-day").forEach(c => c.classList.remove("selected-day"));
  const cell = document.querySelector(`.fc-daygrid-day[data-date="${selectedDate}"]`);
  if (cell) cell.classList.add("selected-day");
}

// 日付選択処理
function selectDate(dateStr) {
  selectedDate = dateStr;
  document.getElementById("date").value = selectedDate;
  highlightSelectedDay();

  const records = JSON.parse(localStorage.getItem("records")) || [];
  const record = records.find(r => r.date === selectedDate);

  if (record) {
    setSelectedValue("rpeButtons", record.rpe);
    setSelectedValue("sleepButtons", record.sleep);
    setSelectedValue("fatigueButtons", record.fatigue);
    setSelectedValue("stressButtons", record.stress);
    setSelectedValue("muscleButtons", record.muscle);
    document.getElementById("time").value = record.time;
  } else {
    resetForm();
  }
  // selectDate の末尾に追加
  updateComputedDisplays();

  // resetForm の末尾に追加
  updateComputedDisplays();
}

// フォームをリセット
function resetForm() {
  ["rpeButtons", "sleepButtons", "fatigueButtons", "stressButtons", "muscleButtons"].forEach(id => {
    [...document.getElementById(id).children].forEach(c => c.classList.remove("selected"));
  });
  document.getElementById("time").value = "";
}

// 保存処理
document.getElementById("saveBtn").addEventListener("click", function (e) {
  e.preventDefault();

  // エラー表示用
  const errorEl = document.getElementById("errorMsg");
  const showError = (msg) => {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.style.display = "block";
  };
  const clearError = () => {
    if (!errorEl) return;
    errorEl.textContent = "";
    errorEl.style.display = "none";
  };

  // ===== 入力チェック =====
  const date = document.getElementById("date").value;
  const rpe = getSelectedValue("rpeButtons");
  const timeStr = document.getElementById("time").value;
  const time = parseInt(timeStr);
  const sleep = getSelectedValue("sleepButtons");
  const fatigue = getSelectedValue("fatigueButtons");
  const stress = getSelectedValue("stressButtons");
  const muscle = getSelectedValue("muscleButtons");

  const missing = [];
  if (!date) missing.push("日付");
  if (rpe == null) missing.push("RPE");
  if (!timeStr || Number.isNaN(time)) missing.push("時間");
  if (sleep == null) missing.push("睡眠の質");
  if (fatigue == null) missing.push("疲労感");
  if (stress == null) missing.push("ストレス");
  if (muscle == null) missing.push("筋肉痛");

  if (missing.length > 0) {
    showError(`入力漏れがあります。未入力：${missing.join("、")}`);
    return; // ★漏れがあるなら保存しない
  }

  clearError(); // ★全部OKならエラーを消す

  // ===== ここから保存処理（今まで通り） =====
  const record = {
    date,
    rpe,
    time,
    sleep,
    fatigue,
    stress,
    muscle
  };
  record.srpe = record.rpe * record.time;

  let records = JSON.parse(localStorage.getItem("records")) || [];
  const index = records.findIndex(r => r.date === record.date);
  if (index >= 0) {
    records[index] = record;
  } else {
    records.push(record);
  }
  localStorage.setItem("records", JSON.stringify(records));

  updateRecordedMarks(records);
  highlightSelectedDay();

    // ▼ 保存後：下の「グラフ表示」ボタンを目立たせる
  const toGraphBtn = document.getElementById("toGraphBtn");
  if (toGraphBtn) {
    const originalText = toGraphBtn.textContent;

    // カレンダー画面にいるときだけ文言を一時変更
    if (document.getElementById("posterLayout").style.display !== "none") {
      toGraphBtn.textContent = "保存しました！グラフを見る";
    }

    // アニメーションを確実に再発火
    toGraphBtn.classList.remove("pulse");
    void toGraphBtn.offsetWidth;
    toGraphBtn.classList.add("pulse");

    setTimeout(() => {
      if (toGraphBtn.textContent === "保存しました！グラフを見る") {
        toGraphBtn.textContent = originalText;
      }
      toGraphBtn.classList.remove("pulse");
    }, 1800);
  }

});

// 修正処理
document.getElementById("editBtn").addEventListener("click", function () {
  selectDate(selectedDate);
});

// 削除処理
document.getElementById("deleteBtn").addEventListener("click", function () {
  let records = JSON.parse(localStorage.getItem("records")) || [];
  records = records.filter(r => r.date !== selectedDate);
  localStorage.setItem("records", JSON.stringify(records));

  resetForm();
  updateRecordedMarks(records);
  highlightSelectedDay();
});

// ===== グラフ描画 =====
function renderGraph(days = null) {
  let records = JSON.parse(localStorage.getItem("records")) || [];
  if (records.length === 0) return;

  records.sort((a, b) => new Date(a.date) - new Date(b.date));

  let filtered = records;
  if (days) {
    const cutoff = new Date(records[records.length - 1].date);
    cutoff.setDate(cutoff.getDate() - days);
    filtered = records.filter(r => new Date(r.date) >= cutoff);
  }

  const labels = filtered.map(r => r.date);
  const srpeValues = filtered.map(r => r.srpe);
  const acwrValues = calcAcwr(filtered).map(r => r.ACWR);

  const ctx = document.getElementById("srpeAcwrChart").getContext("2d");
  if (srpeChart) srpeChart.destroy();

  srpeChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        { label: "sRPE", data: srpeValues, borderColor: "blue", yAxisID: "y" },
        { label: "ACWR", data: acwrValues, borderColor: "orange", yAxisID: "y1" }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { title: { display: true, text: "sRPEとACWRの推移" } },
      scales: {
        y: {
          type: "linear",
          position: "left",
          title: {
            display: true,
            text: "sRPE"
          }
        },
        y1: {
          type: "linear",
          position: "right",
          grid: { drawOnChartArea: false },
          title: {
            display: true,
            text: "ACWR"
          }
        }
      }
    }
  });
}

function renderHooperChart(days = null) {
  let records = JSON.parse(localStorage.getItem("records")) || [];
  if (records.length === 0) return;

  records.sort((a, b) => new Date(a.date) - new Date(b.date));

  let filtered = records;
  if (days) {
    const cutoff = new Date(records[records.length - 1].date);
    cutoff.setDate(cutoff.getDate() - days);
    filtered = records.filter(r => new Date(r.date) >= cutoff);
  }

  const labels = filtered.map(r => r.date);
  const sleep = filtered.map(r => r.sleep);
  const fatigue = filtered.map(r => r.fatigue);
  const stress = filtered.map(r => r.stress);
  const muscle = filtered.map(r => r.muscle);

  const ctx = document.getElementById("hooperChart").getContext("2d");
  if (hooperChart) hooperChart.destroy();

  hooperChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        { label: "睡眠", data: sleep, backgroundColor: "rgba(135, 206, 250, 0.7)" }, // light blue
        { label: "疲労感", data: fatigue, backgroundColor: "rgba(255, 182, 193, 0.7)" }, // light pink/red
        { label: "ストレス", data: stress, backgroundColor: "rgba(255, 218, 185, 0.7)" }, // peach
        { label: "筋肉痛", data: muscle, backgroundColor: "rgba(144, 238, 144, 0.7)" }  // light green
      ]

    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { title: { display: true, text: "Hooper Index" } },
      scales: {
        x: { stacked: true },
        y: {
          stacked: true,
          min: 0,
          max: 28,
          title: {
            display: true,
            text: "HIスコア"
          }
        }
      }

    }
  });
}

// ACWR計算（単純平均版）
function calcAcwr(records) {
  const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
  let result = [];

  for (let i = 0; i < sorted.length; i++) {
    const currentDate = new Date(sorted[i].date);

    // 直近7日と28日
    const past7 = sorted.filter(r => {
      const d = new Date(r.date);
      return (currentDate - d) / (1000 * 60 * 60 * 24) <= 7 && d <= currentDate;
    });

    const past28 = sorted.filter(r => {
      const d = new Date(r.date);
      return (currentDate - d) / (1000 * 60 * 60 * 24) <= 28 && d <= currentDate;
    });

    const acute = past7.reduce((sum, r) => sum + (r.srpe || 0), 0) / (past7.length || 1);
    const chronic = past28.reduce((sum, r) => sum + (r.srpe || 0), 0) / (past28.length || 1);

    // 慢性負荷が0なら null
    const acwr = chronic > 0 ? acute / chronic : null;

    result.push({ date: sorted[i].date, ACWR: acwr });
  }

  return result;
}

// ===== 両方のグラフをまとめて更新 =====
function renderAllGraphs(days = null) {
  renderGraph(days);
  renderHooperChart(days);
}

// 任意の期間でレコードを絞り込む
function filterRecordsByRange(records, startDate, endDate) {
  if (!startDate && !endDate) return records;

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  return records.filter(r => {
    const d = new Date(r.date);
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  });
}

// sRPE & ACWRグラフを期間指定で描画
function renderGraphByRange(startDate, endDate) {
  let records = JSON.parse(localStorage.getItem("records")) || [];
  if (records.length === 0) return;

  records.sort((a, b) => new Date(a.date) - new Date(b.date));
  const filtered = filterRecordsByRange(records, startDate, endDate);
  if (filtered.length === 0) {
    if (srpeChart) srpeChart.destroy();
    return;
  }

  const labels = filtered.map(r => r.date);
  const srpeValues = filtered.map(r => r.srpe);
  const acwrValues = calcAcwr(filtered).map(r => r.ACWR);

  const ctx = document.getElementById("srpeAcwrChart").getContext("2d");
  if (srpeChart) srpeChart.destroy();

  srpeChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        { label: "sRPE", data: srpeValues, borderColor: "blue", yAxisID: "y" },
        { label: "ACWR", data: acwrValues, borderColor: "orange", yAxisID: "y1" }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { title: { display: true, text: "sRPEとACWRの推移" } },
      scales: {
        y: {
          type: "linear",
          position: "left",
          title: {
            display: true,
            text: "sRPE"
          }
        },
        y1: {
          type: "linear",
          position: "right",
          grid: { drawOnChartArea: false },
          title: {
            display: true,
            text: "ACWR"
          }
        }
      }
    }
  });
}

// Hooper Indexグラフを期間指定で描画
function renderHooperChartByRange(startDate, endDate) {
  let records = JSON.parse(localStorage.getItem("records")) || [];
  if (records.length === 0) return;

  records.sort((a, b) => new Date(a.date) - new Date(b.date));
  const filtered = filterRecordsByRange(records, startDate, endDate);
  if (filtered.length === 0) {
    if (hooperChart) hooperChart.destroy();
    return;
  }

  const labels = filtered.map(r => r.date);
  const sleep = filtered.map(r => r.sleep);
  const fatigue = filtered.map(r => r.fatigue);
  const stress = filtered.map(r => r.stress);
  const muscle = filtered.map(r => r.muscle);

  const ctx = document.getElementById("hooperChart").getContext("2d");
  if (hooperChart) hooperChart.destroy();

  hooperChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        { label: "睡眠", data: sleep, backgroundColor: "rgba(135, 206, 250, 0.7)" },
        { label: "疲労感", data: fatigue, backgroundColor: "rgba(255, 182, 193, 0.7)" },
        { label: "ストレス", data: stress, backgroundColor: "rgba(255, 218, 185, 0.7)" },
        { label: "筋肉痛", data: muscle, backgroundColor: "rgba(144, 238, 144, 0.7)" }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { title: { display: true, text: "Hooper Index" } },
      scales: {
        x: { stacked: true },
        y: {
          stacked: true,
          min: 0,
          max: 28,
          title: {
            display: true,
            text: "HIスコア"
          }
        }
      }

    }
  });
}

// 任意期間の両方のグラフをまとめて更新
function renderAllGraphsByRange(startDate, endDate) {
  renderGraphByRange(startDate, endDate);
  renderHooperChartByRange(startDate, endDate);
}
