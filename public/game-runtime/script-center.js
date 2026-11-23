/* 统一脚本中心：把内置脚本与用户自定义 JS 合并到一个面板管理。
 * - 内置脚本复用 4.js 暴露的 window.__gsjcBridge，不重复实现加载器。
 * - 自定义脚本通过 Blob + <script src> 注入，不使用 eval/new Function，也不包裹 IIFE。
 * - 内置启用状态存 localStorage，自定义脚本存 IndexedDB；都不上传服务器。 */
(function () {
  "use strict";

  try {
    if (window.__xyzwScriptCenterActive) return;

    var ROOT_ID = "xyzw-script-center-root";
    var STYLE_ID = "xyzw-script-center-style";
    var POS_KEY = "xyzw_script_center_pos";
    var BUILTIN_KEY = "xyzw_script_center_builtin";
    var DB_NAME = "xyzw_script_center";
    var DB_VERSION = 1;
    var DB_STORE = "scripts";
    var ENGINE_WAIT_MS = 30000;
    var ENGINE_POLL_MS = 500;
    var JS_TYPES = [
      "text/javascript",
      "application/javascript",
      "application/ecmascript",
      "text/ecmascript",
      "application/x-javascript"
    ];
    var PANEL_EVENTS = ["pointerdown", "mousedown", "touchstart", "wheel", "click", "keydown"];
    var FALLBACK_BUILTIN = [
      { file: "3.js", name: "老版本岚山", group: "lanshan", versionName: "旧版本" },
      { file: "5.js", name: "新版本岚山", group: "lanshan", versionName: "新版本" },
      { file: "6.js", name: "盐场开战列表不关闭" },
      { file: "7.js", name: "战斗实时数值" },
      { file: "8自适应版.js", name: "蟠桃园助手（自适应版）" }
    ];

    /* ==================== 状态 ==================== */
    var builtinScripts = [];
    var builtinEnabled = new Set();
    var customScripts = [];
    var activeBuiltin = new Map();
    var activeCustom = new Map();
    var filter = "all";
    var state = { loading: true, engineReady: false, dbAvailable: false, importing: false, autoStarted: false };
    var db = null;
    var ui = {};
    var confirmResolve = null;
    var drag = null;
    var mounted = false;

    /* ==================== 基础工具 ==================== */
    function clamp(value, min, max) {
      if (max < min) return min;
      return Math.min(Math.max(value, min), max);
    }

    function isDisposed() {
      return !!(window.__multi && window.__multi.disposed);
    }

    function warn(message, error) {
      try {
        if (error) console.warn("[脚本中心]", message, error);
        else console.warn("[脚本中心]", message);
      } catch (ignored) {}
    }

    function el(tag, className, text) {
      var node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined && text !== null) node.textContent = String(text);
      return node;
    }

    function btnEl(text, className) {
      var node = el("button", className, text);
      node.type = "button";
      return node;
    }

    function statusClass(base, extra) {
      return extra ? base + " " + extra : base;
    }

    function formatSize(bytes) {
      var size = Number(bytes) || 0;
      if (size < 1024) return size + " B";
      if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
      return (size / 1024 / 1024).toFixed(2) + " MB";
    }

    function dateText(timestamp) {
      try {
        var date = new Date(timestamp);
        if (isNaN(date.getTime())) return "";
        var month = date.getMonth() + 1;
        var day = date.getDate();
        return date.getFullYear() + "-" + (month < 10 ? "0" + month : month) + "-" + (day < 10 ? "0" + day : day);
      } catch (error) {
        return "";
      }
    }

    function makeId() {
      return "u" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
    }

    function isJsFile(file) {
      var name = String(file && file.name || "").toLowerCase();
      var type = String(file && file.type || "").toLowerCase();
      if (name.slice(-3) === ".js") return true;
      return JS_TYPES.indexOf(type) !== -1;
    }

    function extractName(code, fileName) {
      var head = String(code || "").slice(0, 20000);
      var match = /^[ \t]*\/\/[ \t]*@name(?::|[ \t])[ \t]*(.+)$/m.exec(head);
      if (match && match[1].trim()) return match[1].trim().slice(0, 80);
      return String(fileName || "").replace(/\.js$/i, "") || "未命名脚本";
    }

    function extractDescription(code) {
      var head = String(code || "").slice(0, 20000);
      var match = /^[ \t]*\/\/[ \t]*@description(?::|[ \t])[ \t]*(.+)$/m.exec(head);
      return match && match[1].trim() ? match[1].trim().slice(0, 120) : "";
    }

    function validateFile(file) {
      if (!file) return "未选择文件";
      if (!isJsFile(file)) return "仅支持 .js 文件";
      if (!file.size) return "文件内容为空，无法注入";
      return "";
    }

    /* ==================== localStorage ==================== */
    function readStorage(key) {
      try {
        return window.localStorage.getItem(key);
      } catch (error) {
        return null;
      }
    }

    function writeStorage(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch (error) {
        warn("无法写入 localStorage", error);
      }
    }

    function readBuiltinSet() {
      builtinEnabled.clear();
      var raw = readStorage(BUILTIN_KEY);
      if (!raw) return;
      var parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        return;
      }
      if (!Array.isArray(parsed)) return;
      var known = Object.create(null);
      builtinScripts.forEach(function (item) {
        known[item.file] = true;
      });
      parsed.forEach(function (file) {
        if (typeof file === "string" && known[file]) builtinEnabled.add(file);
      });
    }

    function persistBuiltin() {
      writeStorage(BUILTIN_KEY, JSON.stringify(Array.from(builtinEnabled)));
    }

    function readPos() {
      var raw = readStorage(POS_KEY);
      if (!raw) return null;
      try {
        var parsed = JSON.parse(raw);
        if (!parsed || typeof parsed.left !== "number" || typeof parsed.top !== "number") return null;
        return { left: parsed.left, top: parsed.top };
      } catch (error) {
        return null;
      }
    }

    /* ==================== IndexedDB ==================== */
    function openDb() {
      return new Promise(function (resolve) {
        if (!window.indexedDB) {
          resolve(null);
          return;
        }
        var request;
        try {
          request = window.indexedDB.open(DB_NAME, DB_VERSION);
        } catch (error) {
          resolve(null);
          return;
        }
        var settled = false;
        var timer = setTimeout(function () {
          finish(null);
        }, 3000);

        function finish(value) {
          if (settled) {
            if (value) {
              try {
                value.close();
              } catch (error) {}
            }
            return;
          }
          settled = true;
          clearTimeout(timer);
          resolve(value);
        }

        request.onupgradeneeded = function () {
          try {
            var database = request.result;
            if (!database.objectStoreNames.contains(DB_STORE)) {
              database.createObjectStore(DB_STORE, { keyPath: "id" });
            }
          } catch (error) {
            warn("创建 IndexedDB 存储失败", error);
          }
        };
        request.onsuccess = function () {
          finish(request.result);
        };
        request.onerror = function () {
          finish(null);
        };
        request.onblocked = function () {
          finish(null);
        };
      });
    }

    function dbRequest(mode, handler) {
      return new Promise(function (resolve, reject) {
        if (!db) {
          reject(new Error("存储不可用"));
          return;
        }
        var transaction;
        try {
          transaction = db.transaction(DB_STORE, mode);
        } catch (error) {
          reject(error);
          return;
        }
        transaction.onerror = function () {
          reject(transaction.error || new Error("存储操作失败"));
        };
        transaction.onabort = function () {
          reject(transaction.error || new Error("存储操作已中止"));
        };
        try {
          handler(transaction.objectStore(DB_STORE), resolve, reject);
        } catch (error) {
          reject(error);
        }
      });
    }

    function normalizeRecord(value) {
      return {
        id: String(value.id),
        name: String(value.name || "未命名脚本"),
        code: typeof value.code === "string" ? value.code : "",
        size: Number(value.size) || 0,
        enabled: value.enabled !== false,
        createdAt: Number(value.createdAt) || Date.now(),
        meta: value.meta && typeof value.meta === "object" ? value.meta : {}
      };
    }

    function readAllScripts() {
      return dbRequest("readonly", function (store, resolve, reject) {
        var rows = [];
        var request = store.openCursor();
        request.onsuccess = function () {
          var cursor = request.result;
          if (!cursor) {
            resolve(rows);
            return;
          }
          var value = cursor.value;
          if (value && typeof value.id === "string" && typeof value.code === "string") {
            rows.push(normalizeRecord(value));
          }
          cursor.continue();
        };
        request.onerror = function () {
          reject(request.error || new Error("读取脚本失败"));
        };
      });
    }

    function persistRecord(record) {
      return dbRequest("readwrite", function (store, resolve, reject) {
        try {
          var request = store.put({
            id: record.id,
            name: record.name,
            code: record.code,
            size: record.size,
            enabled: record.enabled,
            createdAt: record.createdAt,
            meta: record.meta || {}
          });
          request.onsuccess = function () {
            resolve();
          };
          request.onerror = function () {
            reject(request.error || new Error("保存脚本失败"));
          };
        } catch (error) {
          reject(error);
        }
      });
    }

    function deleteRecord(id) {
      return dbRequest("readwrite", function (store, resolve, reject) {
        try {
          var request = store.delete(id);
          request.onsuccess = function () {
            resolve();
          };
          request.onerror = function () {
            reject(request.error || new Error("删除脚本失败"));
          };
        } catch (error) {
          reject(error);
        }
      });
    }

    function storageErrorText(error) {
      var name = error && error.name || "";
      if (name === "QuotaExceededError") return "存储空间不足，脚本仅在本次窗口生效";
      return "保存失败，脚本仅在本次窗口生效";
    }

    function withTimeout(promise, ms, message) {
      return new Promise(function (resolve, reject) {
        var timer = setTimeout(function () {
          reject(new Error(message || "操作超时"));
        }, ms);
        Promise.resolve(promise).then(function (value) {
          clearTimeout(timer);
          resolve(value);
        }, function (error) {
          clearTimeout(timer);
          reject(error);
        });
      });
    }

    /* ==================== 样式 ==================== */
    function applyStyle() {
      if (document.getElementById(STYLE_ID)) return;
      var style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = [
        "#" + ROOT_ID + "{position:fixed;inset:0;z-index:2147483645;pointer-events:none;text-align:left;",
        "font-family:'Microsoft YaHei',system-ui,-apple-system,sans-serif;font-size:13px;line-height:1.5;color:#2d3748}",
        "#" + ROOT_ID + " *{box-sizing:border-box}",
        "#" + ROOT_ID + " button{font-family:inherit}",

        ".sc-btn{position:fixed;top:16px;right:16px;width:44px;height:44px;padding:0;border-radius:50%;",
        "border:1px solid rgba(49,130,206,.2);background:rgba(247,250,252,.94);backdrop-filter:blur(10px);",
        "-webkit-backdrop-filter:blur(10px);box-shadow:0 4px 16px rgba(15,42,74,.2);font-size:22px;line-height:1;",
        "display:flex;align-items:center;justify-content:center;cursor:grab;user-select:none;touch-action:none;",
        "pointer-events:auto;z-index:2;transition:transform .15s ease,box-shadow .15s ease}",
        ".sc-btn:hover{transform:scale(1.08);box-shadow:0 6px 20px rgba(49,130,206,.28)}",
        ".sc-btn.dragging{cursor:grabbing;transform:scale(1.12)}",
        ".sc-btn:active{transform:scale(.96)}",

        ".sc-panel{display:none;position:fixed;top:68px;right:12px;width:min(380px,calc(100vw - 24px));",
        "max-height:min(72vh,560px);padding:14px;border-radius:18px;border:1px solid rgba(226,232,240,.9);",
        "background:rgba(247,250,252,.98);backdrop-filter:blur(15px);-webkit-backdrop-filter:blur(15px);",
        "box-shadow:0 12px 40px rgba(15,42,74,.18),0 2px 8px rgba(15,42,74,.08);pointer-events:auto;z-index:3;",
        "flex-direction:column;overflow:hidden;color:#2d3748}",
        ".sc-panel.open{display:flex;animation:sc-in .22s cubic-bezier(.34,1.4,.64,1)}",
        "@keyframes sc-in{from{opacity:0;transform:translateY(-8px) scale(.98)}to{opacity:1;transform:none}}",

        ".sc-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;flex:none}",
        ".sc-title{margin:0;font-size:16px;font-weight:700;color:#1a365d;letter-spacing:.3px}",
        ".sc-sub{margin:2px 0 0;font-size:11px;color:#718096}",
        ".sc-close{flex:none;width:28px;height:28px;padding:0;border:none;border-radius:8px;background:transparent;",
        "color:#94a3b8;font-size:20px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center}",
        ".sc-close:hover{background:rgba(15,42,74,.06);color:#4a5568}",

        ".sc-import{flex:none;margin-top:10px;padding:9px;border:1px dashed rgba(49,130,206,.35);border-radius:12px;",
        "background:rgba(49,130,206,.06);text-align:center;transition:background .15s ease,border-color .15s ease}",
        ".sc-import.dragover{background:rgba(49,130,206,.16);border-color:#3182ce}",
        ".sc-import-btn{width:100%;padding:9px 10px;border-radius:9px;border:1px solid rgba(49,130,206,.22);",
        "background:rgba(49,130,206,.1);color:#2b6cb0;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s ease}",
        ".sc-import-btn:hover{background:rgba(49,130,206,.16);box-shadow:0 3px 8px rgba(49,130,206,.16)}",
        ".sc-import-btn:disabled{opacity:.55;cursor:not-allowed;box-shadow:none}",
        ".sc-hint{margin-top:6px;font-size:11px;color:#718096}",
        ".sc-progress{min-height:14px;margin-top:3px;font-size:11px;color:#2b6cb0;word-break:break-all}",

        ".sc-tabs{display:flex;gap:6px;margin-top:10px;flex:none}",
        ".sc-tab{flex:1;min-width:0;padding:6px 4px;border-radius:8px;border:1px solid transparent;",
        "background:rgba(226,232,240,.6);color:#4a5568;font-size:12px;cursor:pointer;white-space:nowrap;transition:all .15s ease}",
        ".sc-tab:hover{background:rgba(226,232,240,.9)}",
        ".sc-tab.active{background:rgba(49,130,206,.12);border-color:rgba(49,130,206,.3);color:#2b6cb0;font-weight:600}",

        ".sc-list{flex:1 1 auto;min-height:0;margin-top:8px;overflow-y:auto;overscroll-behavior:contain;padding-right:2px}",
        ".sc-item{background:rgba(255,255,255,.82);border:1px solid rgba(226,232,240,.9);border-radius:12px;",
        "padding:9px 10px;margin-bottom:8px;transition:box-shadow .15s ease,border-color .15s ease}",
        ".sc-item:hover{box-shadow:0 4px 12px rgba(15,42,74,.08)}",
        ".sc-item.failed{border-color:rgba(229,62,62,.4);background:rgba(255,245,245,.9)}",
        ".sc-row{display:flex;align-items:center;gap:8px}",
        ".sc-name{flex:1;min-width:0;font-size:13px;font-weight:600;color:#2d3748;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
        ".sc-badge{flex:none;font-size:10px;padding:1px 6px;border-radius:999px;background:rgba(49,130,206,.12);color:#2b6cb0}",
        ".sc-badge.custom{background:rgba(56,161,105,.12);color:#2f855a}",
        ".sc-badge.warn{background:rgba(229,62,62,.1);color:#c53030}",
        ".sc-meta{margin-top:3px;font-size:11px;color:#718096;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
        ".sc-status{margin-top:3px;font-size:11px;color:#718096}",
        ".sc-status.running{color:#2f855a}",
        ".sc-status.failed{color:#c53030}",
        ".sc-status.loading{color:#2b6cb0}",
        ".sc-actions{display:flex;align-items:center;justify-content:flex-end;gap:6px;margin-top:7px}",
        ".sc-op{padding:4px 9px;border-radius:7px;border:1px solid rgba(229,62,62,.25);",
        "background:rgba(229,62,62,.08);color:#c53030;font-size:11px;cursor:pointer;transition:background .15s ease}",
        ".sc-op:hover{background:rgba(229,62,62,.15)}",

        ".sc-switch{position:relative;flex:none;width:38px;height:22px;padding:0;border-radius:999px;",
        "border:1px solid rgba(148,163,184,.5);background:rgba(203,213,224,.8);cursor:pointer;transition:background .15s ease}",
        ".sc-switch::after{content:'';position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;",
        "background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:transform .15s ease}",
        ".sc-switch.on{background:#38a169;border-color:#38a169}",
        ".sc-switch.on::after{transform:translateX(16px)}",

        ".sc-empty{padding:24px 8px;text-align:center;font-size:12px;color:#94a3b8;line-height:1.7}",
        ".sc-batch{flex:none;display:flex;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid rgba(226,232,240,.9)}",
        ".sc-batch-btn{flex:1;padding:7px 4px;border-radius:8px;border:1px solid rgba(49,130,206,.22);",
        "background:rgba(49,130,206,.08);color:#2b6cb0;font-size:12px;cursor:pointer;transition:background .15s ease}",
        ".sc-batch-btn:hover{background:rgba(49,130,206,.15)}",
        ".sc-batch-btn.danger{border-color:rgba(229,62,62,.22);background:rgba(229,62,62,.07);color:#c53030}",
        ".sc-batch-btn.danger:hover{background:rgba(229,62,62,.14)}",

        ".sc-msg{flex:none;display:none;max-height:72px;overflow-y:auto;margin-top:8px;font-size:11px;",
        "line-height:1.5;color:#4a5568;word-break:break-word;overscroll-behavior:contain}",
        ".sc-msg.ok{color:#2f855a}",
        ".sc-msg.error{color:#c53030}",
        ".sc-msg-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:5px}",
        ".sc-mini{padding:3px 8px;border-radius:6px;border:1px solid rgba(49,130,206,.3);",
        "background:rgba(49,130,206,.1);color:#2b6cb0;font-size:11px;cursor:pointer}",
        ".sc-mini:hover{background:rgba(49,130,206,.18)}",
        ".sc-mini.danger{border-color:rgba(229,62,62,.3);background:rgba(229,62,62,.08);color:#c53030}",

        ".sc-confirm{position:fixed;inset:0;display:none;align-items:center;justify-content:center;",
        "background:rgba(15,23,42,.28);pointer-events:auto;z-index:5}",
        ".sc-confirm.open{display:flex}",
        ".sc-confirm-box{width:min(320px,calc(100vw - 40px));padding:16px;border-radius:14px;background:#fff;",
        "box-shadow:0 18px 48px rgba(15,23,42,.28)}",
        ".sc-confirm-msg{font-size:13px;line-height:1.65;color:#2d3748;word-break:break-word}",
        ".sc-confirm-actions{display:flex;gap:8px;margin-top:14px}",
        ".sc-confirm-btn{flex:1;padding:8px 6px;border-radius:8px;border:1px solid rgba(148,163,184,.4);",
        "background:#f7fafc;color:#4a5568;font-size:13px;cursor:pointer}",
        ".sc-confirm-btn:hover{background:#edf2f7}",
        ".sc-confirm-btn.ok{background:#e53e3e;border-color:#e53e3e;color:#fff}",
        ".sc-confirm-btn.ok:hover{background:#c53030}",

        "@media (max-width:480px){",
        ".sc-panel{padding:12px;border-radius:14px}",
        ".sc-btn{width:46px;height:46px;font-size:24px}",
        ".sc-name{font-size:12px}",
        "}"
      ].join("");
      (document.head || document.documentElement).appendChild(style);
    }

    /* ==================== UI 构建 ==================== */
    function buildUi() {
      applyStyle();

      var root = el("div");
      root.id = ROOT_ID;

      var button = btnEl("❄️", "sc-btn");
      button.id = "xyzw-script-center-btn";
      button.title = "脚本中心";
      button.setAttribute("aria-label", "打开脚本中心");
      button.setAttribute("aria-expanded", "false");

      var panel = el("div", "sc-panel");
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-label", "脚本中心");

      var head = el("div", "sc-head");
      var headText = el("div");
      headText.appendChild(el("h3", "sc-title", "❄️ 脚本中心"));
      headText.appendChild(el("p", "sc-sub", "内置与自定义脚本统一管理"));
      var closeButton = btnEl("×", "sc-close");
      closeButton.setAttribute("aria-label", "关闭脚本中心");
      head.appendChild(headText);
      head.appendChild(closeButton);

      var importSection = el("div", "sc-import");
      var importButton = btnEl("📁 导入脚本文件", "sc-import-btn");
      var hint = el("div", "sc-hint", "脚本以游戏页面权限运行，请仅导入可信文件；支持 .js，可多选或拖拽到面板，不限制大小");
      var progress = el("div", "sc-progress");
      var fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.multiple = true;
      fileInput.accept = ".js,text/javascript,application/javascript";
      fileInput.style.display = "none";
      importSection.appendChild(importButton);
      importSection.appendChild(hint);
      importSection.appendChild(progress);
      importSection.appendChild(fileInput);

      var tabsWrap = el("div", "sc-tabs");
      var tabs = [];
      [
        { key: "all", label: "全部" },
        { key: "builtin", label: "内置" },
        { key: "custom", label: "自定义" }
      ].forEach(function (definition) {
        var tabButton = btnEl(definition.label, "sc-tab");
        tabButton.setAttribute("data-filter", definition.key);
        tabs.push({ key: definition.key, label: definition.label, btn: tabButton });
        tabsWrap.appendChild(tabButton);
      });

      var list = el("div", "sc-list");
      list.setAttribute("role", "list");

      var batch = el("div", "sc-batch");
      var enableAllButton = btnEl("全部启用", "sc-batch-btn");
      var disableAllButton = btnEl("全部停用", "sc-batch-btn danger");
      batch.appendChild(enableAllButton);
      batch.appendChild(disableAllButton);

      var message = el("div", "sc-msg");

      panel.appendChild(head);
      panel.appendChild(importSection);
      panel.appendChild(tabsWrap);
      panel.appendChild(list);
      panel.appendChild(batch);
      panel.appendChild(message);

      var confirmLayer = el("div", "sc-confirm");
      var confirmBox = el("div", "sc-confirm-box");
      var confirmMessage = el("div", "sc-confirm-msg");
      var confirmActions = el("div", "sc-confirm-actions");
      var confirmCancel = btnEl("取消", "sc-confirm-btn");
      var confirmOk = btnEl("确定", "sc-confirm-btn ok");
      confirmActions.appendChild(confirmCancel);
      confirmActions.appendChild(confirmOk);
      confirmBox.appendChild(confirmMessage);
      confirmBox.appendChild(confirmActions);
      confirmLayer.appendChild(confirmBox);

      root.appendChild(button);
      root.appendChild(panel);
      root.appendChild(confirmLayer);

      ui = {
        root: root,
        button: button,
        panel: panel,
        head: head,
        closeButton: closeButton,
        importSection: importSection,
        importButton: importButton,
        progress: progress,
        fileInput: fileInput,
        tabs: tabs,
        list: list,
        enableAllButton: enableAllButton,
        disableAllButton: disableAllButton,
        message: message,
        confirmLayer: confirmLayer,
        confirmMessage: confirmMessage,
        confirmCancel: confirmCancel,
        confirmOk: confirmOk
      };

      bindUi();
      return root;
    }

    function bindUi() {
      ui.button.addEventListener("pointerdown", onButtonPointerDown);
      ui.button.addEventListener("pointermove", onButtonPointerMove);
      ui.button.addEventListener("pointerup", onButtonPointerUp);
      ui.button.addEventListener("pointercancel", onButtonPointerCancel);
      ui.button.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          togglePanel();
        }
      });

      ui.closeButton.addEventListener("click", function (event) {
        event.stopPropagation();
        togglePanel(false);
      });

      ui.tabs.forEach(function (tab) {
        tab.btn.addEventListener("click", function (event) {
          event.stopPropagation();
          if (filter === tab.key) return;
          filter = tab.key;
          render();
        });
      });

      ui.importButton.addEventListener("click", function (event) {
        event.stopPropagation();
        if (state.importing) return;
        try {
          ui.fileInput.click();
        } catch (error) {
          setMessage("无法打开文件选择器", "error");
        }
      });

      ui.fileInput.addEventListener("change", function () {
        var files = ui.fileInput.files;
        try {
          handleFiles(files);
        } finally {
          ui.fileInput.value = "";
        }
      });

      ui.enableAllButton.addEventListener("click", function (event) {
        event.stopPropagation();
        batchEnable();
      });

      ui.disableAllButton.addEventListener("click", function (event) {
        event.stopPropagation();
        batchDisable();
      });

      ui.panel.addEventListener("dragover", function (event) {
        event.preventDefault();
        event.stopPropagation();
        ui.importSection.classList.add("dragover");
      });

      ui.panel.addEventListener("dragleave", function (event) {
        event.stopPropagation();
        if (!ui.panel.contains(event.relatedTarget)) ui.importSection.classList.remove("dragover");
      });

      ui.panel.addEventListener("drop", function (event) {
        event.preventDefault();
        event.stopPropagation();
        ui.importSection.classList.remove("dragover");
        var transfer = event.dataTransfer;
        if (transfer && transfer.files && transfer.files.length) handleFiles(transfer.files);
      });

      ui.confirmCancel.addEventListener("click", function (event) {
        event.stopPropagation();
        closeConfirm(false);
      });

      ui.confirmOk.addEventListener("click", function (event) {
        event.stopPropagation();
        closeConfirm(true);
      });

      ui.confirmLayer.addEventListener("click", function (event) {
        event.stopPropagation();
        if (event.target === ui.confirmLayer) closeConfirm(false);
      });

      for (var i = 0; i < PANEL_EVENTS.length; i++) {
        ui.root.addEventListener(PANEL_EVENTS[i], function (event) {
          event.stopPropagation();
        }, { passive: true });
      }

      // 根节点会拦截 keydown 冒泡，Escape 必须在这里处理。
      ui.root.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && ui.confirmLayer.classList.contains("open")) {
          event.preventDefault();
          closeConfirm(false);
        }
      });

      window.addEventListener("resize", function () {
        clampButtonPosition();
        if (ui.panel.classList.contains("open")) positionPanel();
      });
    }

    /* ==================== 面板定位与拖动 ==================== */
    function placeButton(left, top) {
      ui.button.style.left = left + "px";
      ui.button.style.top = top + "px";
      ui.button.style.right = "auto";
      ui.button.style.bottom = "auto";
    }

    function clampButtonPosition() {
      if (!ui.button) return;
      var rect = ui.button.getBoundingClientRect();
      if (!rect.width && !rect.height) return;
      var left = clamp(rect.left, 4, window.innerWidth - rect.width - 4);
      var top = clamp(rect.top, 4, window.innerHeight - rect.height - 4);
      if (left !== rect.left || top !== rect.top) placeButton(left, top);
    }

    function applySavedPos() {
      var position = readPos();
      if (!position) return;
      var width = ui.button.offsetWidth || 44;
      var height = ui.button.offsetHeight || 44;
      placeButton(
        clamp(position.left, 4, window.innerWidth - width - 4),
        clamp(position.top, 4, window.innerHeight - height - 4)
      );
    }

    function persistPos() {
      var rect = ui.button.getBoundingClientRect();
      writeStorage(POS_KEY, JSON.stringify({ left: rect.left, top: rect.top }));
    }

    function positionPanel() {
      if (!ui.panel) return;
      var rect = ui.button.getBoundingClientRect();
      var panelWidth = ui.panel.offsetWidth;
      var panelHeight = ui.panel.offsetHeight;
      var viewportWidth = window.innerWidth;
      var viewportHeight = window.innerHeight;
      var left = clamp(rect.right - panelWidth, 8, viewportWidth - panelWidth - 8);
      var top;
      if (rect.bottom + 8 + panelHeight <= viewportHeight - 8) {
        top = rect.bottom + 8;
      } else if (rect.top - 8 - panelHeight >= 8) {
        top = rect.top - 8 - panelHeight;
      } else {
        top = clamp(rect.bottom + 8, 8, viewportHeight - panelHeight - 8);
      }
      ui.panel.style.left = left + "px";
      ui.panel.style.top = top + "px";
      ui.panel.style.right = "auto";
      ui.panel.style.bottom = "auto";
    }

    function togglePanel(force) {
      if (!ui.panel) return;
      var open = typeof force === "boolean" ? force : !ui.panel.classList.contains("open");
      if (open) {
        ui.panel.classList.add("open");
        ui.button.setAttribute("aria-expanded", "true");
        checkEngine();
        syncBridgeStatus();
        render();
        positionPanel();
      } else {
        ui.panel.classList.remove("open");
        ui.button.setAttribute("aria-expanded", "false");
      }
    }

    function onButtonPointerDown(event) {
      if (event.button !== undefined && event.button !== 0) return;
      var rect = ui.button.getBoundingClientRect();
      drag = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originLeft: rect.left,
        originTop: rect.top,
        moved: false
      };
      try {
        ui.button.setPointerCapture(event.pointerId);
      } catch (error) {}
      event.preventDefault();
    }

    function onButtonPointerMove(event) {
      if (!drag || event.pointerId !== drag.id) return;
      var deltaX = event.clientX - drag.startX;
      var deltaY = event.clientY - drag.startY;
      if (!drag.moved && (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4)) {
        drag.moved = true;
        ui.button.classList.add("dragging");
      }
      if (!drag.moved) return;
      var width = ui.button.offsetWidth || 44;
      var height = ui.button.offsetHeight || 44;
      placeButton(
        clamp(drag.originLeft + deltaX, 4, window.innerWidth - width - 4),
        clamp(drag.originTop + deltaY, 4, window.innerHeight - height - 4)
      );
      if (ui.panel.classList.contains("open")) positionPanel();
      event.preventDefault();
    }

    function finishDrag(event, shouldToggle) {
      if (!drag || event.pointerId !== drag.id) return;
      var moved = drag.moved;
      drag = null;
      ui.button.classList.remove("dragging");
      try {
        ui.button.releasePointerCapture(event.pointerId);
      } catch (error) {}
      if (moved) {
        persistPos();
        if (ui.panel.classList.contains("open")) positionPanel();
      } else if (shouldToggle) {
        togglePanel();
      }
    }

    function onButtonPointerUp(event) {
      finishDrag(event, true);
    }

    function onButtonPointerCancel(event) {
      finishDrag(event, false);
    }

    /* ==================== 消息 / 确认 ==================== */
    function setMessage(text, type, actions) {
      if (!ui.message) return;
      ui.message.textContent = "";
      ui.message.className = "sc-msg";
      if (!text) {
        ui.message.style.display = "none";
        return;
      }
      ui.message.style.display = "block";
      if (type) ui.message.classList.add(type);
      ui.message.appendChild(el("div", "", text));
      if (actions && actions.length) {
        var row = el("div", "sc-msg-actions");
        actions.forEach(function (action) {
          var actionButton = btnEl(action.label, "sc-mini" + (action.danger ? " danger" : ""));
          actionButton.addEventListener("click", function (event) {
            event.stopPropagation();
            action.onClick();
          });
          row.appendChild(actionButton);
        });
        ui.message.appendChild(row);
      }
    }

    function setProgress(text) {
      if (!ui.progress) return;
      ui.progress.textContent = text || "";
    }

    function showConfirm(message, okText) {
      if (confirmResolve) closeConfirm(false);
      return new Promise(function (resolve) {
        confirmResolve = resolve;
        ui.confirmMessage.textContent = message;
        ui.confirmOk.textContent = okText || "确定";
        ui.confirmLayer.classList.add("open");
        try {
          ui.confirmOk.focus();
        } catch (error) {}
      });
    }

    function closeConfirm(result) {
      if (!ui.confirmLayer) return;
      ui.confirmLayer.classList.remove("open");
      var resolve = confirmResolve;
      confirmResolve = null;
      if (resolve) resolve(!!result);
    }

    /* ==================== 状态映射 ==================== */
    function bridgeAvailable() {
      return !!(window.__gsjcBridge && typeof window.__gsjcBridge.load === "function");
    }

    function bridgeIsLoaded(file) {
      try {
        return !!(window.__gsjcBridge && typeof window.__gsjcBridge.isLoaded === "function" && window.__gsjcBridge.isLoaded(file));
      } catch (error) {
        return false;
      }
    }

    function syncBridgeStatus() {
      if (!window.__gsjcBridge || typeof window.__gsjcBridge.isLoaded !== "function") return;
      builtinScripts.forEach(function (item) {
        var status = activeBuiltin.get(item.file);
        if (status === "running" || status === "loading" || status === "failed") return;
        if (bridgeIsLoaded(item.file)) activeBuiltin.set(item.file, "running");
      });
    }

    function builtinStatus(item) {
      var active = activeBuiltin.get(item.file);
      var enabled = builtinEnabled.has(item.file);
      if (active === "loading") return { text: "加载中…", cls: "loading" };
      if (active === "failed") return { text: "加载失败", cls: "failed" };
      if (active === "running") {
        return { text: enabled ? "运行中" : "运行中（已停用，本窗口仍生效）", cls: "running" };
      }
      if (enabled) return { text: state.engineReady ? "已启用（等待加载）" : "已启用（等待引擎）", cls: "" };
      return { text: "未启用", cls: "" };
    }

    function customStatus(record) {
      var active = activeCustom.get(record.id);
      if (active === "loading") return { text: "注入中…", cls: "loading" };
      if (active === "failed") return { text: "加载失败", cls: "failed" };
      if (active === "unknown") {
        return { text: "状态未知（可能已执行）", cls: "failed" };
      }
      if (active === "running") {
        return { text: record.enabled ? "运行中" : "运行中（已停用，本窗口仍生效）", cls: "running" };
      }
      if (record.enabled) return { text: state.engineReady ? "已启用（等待注入）" : "已启用（等待引擎）", cls: "" };
      return { text: "未启用", cls: "" };
    }

    /* ==================== 渲染 ==================== */
    function makeSwitch(on, label, onToggle) {
      var switchButton = btnEl("", "sc-switch" + (on ? " on" : ""));
      switchButton.setAttribute("role", "switch");
      switchButton.setAttribute("aria-checked", on ? "true" : "false");
      switchButton.setAttribute("aria-label", (on ? "停用 " : "启用 ") + label);
      switchButton.addEventListener("click", function (event) {
        event.stopPropagation();
        onToggle();
      });
      return switchButton;
    }

    function buildBuiltinItem(item) {
      var enabled = builtinEnabled.has(item.file);
      var status = builtinStatus(item);
      var node = el("div", "sc-item" + (status.cls === "failed" ? " failed" : ""));
      node.setAttribute("role", "listitem");

      var row = el("div", "sc-row");
      var name = el("span", "sc-name", item.name);
      name.title = item.name;
      row.appendChild(name);
      var badge = el(
        "span",
        "sc-badge" + (item.group === "lanshan" ? " warn" : ""),
        "第三方"
      );
      badge.title = item.group === "lanshan"
        ? "随包第三方脚本，可能包含卡密绕过逻辑，请确认你信任该脚本"
        : "随包第三方脚本，非官方代码，请确认你信任该脚本";
      row.appendChild(badge);
      row.appendChild(makeSwitch(enabled, item.name, function () {
        if (enabled) disableBuiltin(item);
        else enableBuiltin(item);
      }));

      var metaText =
        "随包 · " + item.file + (item.versionName ? " · " + item.versionName : "");
      var meta = el("div", "sc-meta", metaText);
      meta.title = metaText;

      node.appendChild(row);
      node.appendChild(meta);
      node.appendChild(el("div", statusClass("sc-status", status.cls), status.text));

      if (enabled || activeBuiltin.has(item.file)) {
        var actions = el("div", "sc-actions");
        var op = btnEl("停用", "sc-op");
        op.addEventListener("click", function (event) {
          event.stopPropagation();
          disableBuiltin(item);
        });
        actions.appendChild(op);
        node.appendChild(actions);
      }
      return node;
    }

    function buildCustomItem(record) {
      var enabled = record.enabled;
      var status = customStatus(record);
      var node = el("div", "sc-item" + (status.cls === "failed" ? " failed" : ""));
      node.setAttribute("role", "listitem");

      var row = el("div", "sc-row");
      var name = el("span", "sc-name", record.name);
      name.title = record.name;
      row.appendChild(name);
      row.appendChild(el("span", "sc-badge custom", "自定义"));
      row.appendChild(makeSwitch(enabled, record.name, function () {
        setCustomEnabled(record, !record.enabled);
      }));

      var description = record.meta && record.meta.description ? record.meta.description : "";
      var metaParts = ["自定义", formatSize(record.size)];
      var created = dateText(record.createdAt);
      if (created) metaParts.push(created);
      if (description) metaParts.push(description);
      var metaText = metaParts.join(" · ");
      var meta = el("div", "sc-meta", metaText);
      meta.title = metaText;

      node.appendChild(row);
      node.appendChild(meta);
      node.appendChild(el("div", statusClass("sc-status", status.cls), status.text));

      var actions = el("div", "sc-actions");
      var op = btnEl("卸载", "sc-op");
      op.addEventListener("click", function (event) {
        event.stopPropagation();
        uninstallCustom(record);
      });
      actions.appendChild(op);
      node.appendChild(actions);
      return node;
    }

    function render() {
      if (!ui.list) return;
      syncBridgeStatus();
      ui.list.textContent = "";

      var builtinCount = builtinScripts.length;
      var customCount = customScripts.length;
      ui.tabs.forEach(function (tab) {
        var count = tab.key === "all" ? builtinCount + customCount : tab.key === "builtin" ? builtinCount : customCount;
        tab.btn.textContent = tab.label + " " + count;
        if (tab.key === filter) tab.btn.classList.add("active");
        else tab.btn.classList.remove("active");
      });

      if (state.loading) {
        ui.list.appendChild(el("div", "sc-empty", "正在读取已保存脚本…"));
      } else {
        var rows = [];
        if (filter !== "custom") {
          builtinScripts.forEach(function (item) {
            rows.push(buildBuiltinItem(item));
          });
        }
        if (filter !== "builtin") {
          customScripts.forEach(function (record) {
            rows.push(buildCustomItem(record));
          });
        }
        if (!rows.length) {
          var emptyText = filter === "custom"
            ? "暂无自定义脚本。点击上方“导入脚本文件”，或把 .js 拖进面板。"
            : filter === "builtin"
              ? "暂无内置脚本。"
              : "暂无脚本。";
          ui.list.appendChild(el("div", "sc-empty", emptyText));
        } else {
          rows.forEach(function (node) {
            ui.list.appendChild(node);
          });
        }
      }

      if (ui.panel.classList.contains("open")) positionPanel();
    }

    /* ==================== 内置脚本操作 ==================== */
    function loadBuiltin(item) {
      if (!bridgeAvailable()) {
        activeBuiltin.set(item.file, "failed");
        setMessage("内置脚本加载器不可用（4.js 未加载），无法启动 " + item.name, "error");
        render();
        return Promise.resolve();
      }
      if (!state.engineReady) checkEngine();
      if (!state.engineReady) {
        setMessage("游戏引擎尚未就绪，" + item.name + " 将在引擎就绪后自动加载", "");
        render();
        return Promise.resolve();
      }
      if (bridgeIsLoaded(item.file)) {
        activeBuiltin.set(item.file, "running");
        render();
        return Promise.resolve();
      }
      if (activeBuiltin.get(item.file) === "loading") return Promise.resolve();
      activeBuiltin.set(item.file, "loading");
      render();
      var work;
      try {
        work = window.__gsjcBridge.load(item.file);
      } catch (error) {
        work = Promise.reject(error);
      }
      return Promise.resolve(work).then(function () {
        activeBuiltin.set(item.file, "running");
        setMessage("已启动内置脚本：" + item.name, "ok");
        render();
      }, function (error) {
        activeBuiltin.set(item.file, "failed");
        setMessage(item.name + " 加载失败：" + (error && error.message || error), "error");
        render();
      });
    }

    function enableBuiltin(item) {
      if (!bridgeAvailable()) {
        setMessage("内置脚本加载器不可用（4.js 未加载），无法启用", "error");
        return;
      }
      if (item.group) {
        for (var i = 0; i < builtinScripts.length; i++) {
          var other = builtinScripts[i];
          if (other === item || other.group !== item.group) continue;
          var otherStatus = activeBuiltin.get(other.file);
          if (otherStatus === "running" || otherStatus === "loading") {
            setMessage(other.name + " 已在本窗口加载，需重开窗口后切换", "error");
            return;
          }
          if (builtinEnabled.has(other.file)) {
            builtinEnabled.delete(other.file);
            activeBuiltin.delete(other.file);
          }
        }
      }
      builtinEnabled.add(item.file);
      persistBuiltin();
      setMessage("已启用内置脚本：" + item.name, "ok");
      render();
      loadBuiltin(item);
    }

    function disableBuiltin(item) {
      builtinEnabled.delete(item.file);
      persistBuiltin();
      var status = activeBuiltin.get(item.file);
      if (status === "running" || status === "loading") {
        setMessage("已停用 " + item.name + "；本窗口仍生效，刷新/重开窗口后关闭", "");
      } else {
        activeBuiltin.delete(item.file);
        setMessage("已停用 " + item.name, "");
      }
      render();
    }

    /* ==================== 自定义脚本操作 ==================== */
    function injectCustom(record) {
      if (!record || !record.code) return Promise.resolve();
      if (isDisposed()) return Promise.resolve();
      var current = activeCustom.get(record.id);
      if (current === "running" || current === "loading") return Promise.resolve();
      if (record.mayHaveRun || current === "unknown") {
        setMessage(
          "上次注入状态未知：" + record.name + "；请刷新/重开窗口后再启用，避免重复执行",
          "error"
        );
        render();
        return Promise.resolve();
      }

      activeCustom.set(record.id, "loading");
      render();

      return new Promise(function (resolve) {
        var script = document.createElement("script");
        var objectUrl = "";
        var finished = false;
        var watchdog = 0;

        function cleanupUrl() {
          if (!objectUrl) return;
          try {
            URL.revokeObjectURL(objectUrl);
          } catch (error) {}
          objectUrl = "";
        }

        function finish(status, message) {
          if (finished) return;
          finished = true;
          if (watchdog) {
            clearTimeout(watchdog);
            watchdog = 0;
          }
          cleanupUrl();
          try {
            if (script.parentNode) script.parentNode.removeChild(script);
          } catch (error) {}
          activeCustom.set(record.id, status);
          if (status === "failed") {
            record.enabled = false;
            if (db) persistRecord(record).catch(function () {});
            setMessage("注入失败：" + record.name + (message ? " · " + message : ""), "error");
          } else if (status === "unknown") {
            record.mayHaveRun = true;
            setMessage(
              "注入状态未知：" + record.name + "（可能已执行）；请刷新/重开窗口确认，避免重复执行",
              "error"
            );
          }
          render();
          resolve();
        }

        script.type = "text/javascript";
        script.charset = "utf-8";
        script.setAttribute("data-xyzw-user-id", record.id);
        script.onload = function () {
          finish("running", "");
        };
        script.onerror = function () {
          finish("failed", "脚本未被执行");
        };

        try {
          var source = record.code + "\n//# sourceURL=xyzw-user-" + record.id + ".js";
          objectUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
        } catch (error) {
          finish("failed", "无法创建注入脚本");
          return;
        }
        script.src = objectUrl;

        try {
          var target = document.head || document.body;
          if (!target) {
            finish("failed", "页面尚未就绪");
            return;
          }
          target.appendChild(script);
          watchdog = setTimeout(function () {
            finish("unknown", "注入超时（可能被 CSP 拦截）");
          }, 5000);
        } catch (error) {
          finish("failed", "无法挂载脚本节点");
        }
      });
    }

    function setCustomEnabled(record, enabled) {
      if (
        enabled &&
        (record.mayHaveRun || activeCustom.get(record.id) === "unknown")
      ) {
        setMessage(
          "上次注入状态未知：" + record.name + "；请刷新/重开窗口后再启用，避免重复执行",
          "error"
        );
        render();
        return;
      }
      record.enabled = enabled;
      if (db) {
        persistRecord(record).catch(function (error) {
          setMessage(storageErrorText(error), "error");
        });
      }
      if (enabled) {
        if (!state.engineReady) checkEngine();
        if (state.engineReady) {
          setMessage("已启用自定义脚本：" + record.name, "ok");
          render();
          injectCustom(record);
          return;
        }
        setMessage("已启用 " + record.name + "，等待游戏引擎后自动注入", "");
      } else {
        var running = activeCustom.get(record.id) === "running" || activeCustom.get(record.id) === "loading";
        setMessage(
          "已停用 " + record.name + (running ? "；本窗口仍生效，刷新/重开窗口后关闭" : ""),
          ""
        );
      }
      render();
    }

    function uninstallCustom(record) {
      showConfirm(
        "卸载“" + record.name + "”？卸载后本窗口可能仍有残留，建议刷新/重开应用。",
        "卸载"
      ).then(function (confirmed) {
        if (!confirmed) return;
        var removal = db
          ? withTimeout(deleteRecord(record.id), 2000, "删除存储超时")
          : Promise.resolve();
        removal.then(function () {
          customScripts = customScripts.filter(function (item) {
            return item.id !== record.id;
          });
          activeCustom.delete(record.id);
          try {
            var nodes = document.querySelectorAll("script[data-xyzw-user-id]");
            for (var i = 0; i < nodes.length; i++) {
              if (nodes[i].getAttribute("data-xyzw-user-id") === record.id && nodes[i].parentNode) {
                nodes[i].parentNode.removeChild(nodes[i]);
              }
            }
          } catch (error) {}
          render();
          setMessage("已卸载，请刷新页面或重新打开应用以完全生效", "", [
            {
              label: "刷新游戏窗口",
              onClick: function () {
                try {
                  location.reload();
                } catch (error) {}
              }
            },
            {
              label: "稍后",
              onClick: function () {
                setMessage("已卸载，刷新后完全生效", "");
              }
            }
          ]);
        }, function (error) {
          record.enabled = false;
          if (db) persistRecord(record).catch(function () {});
          setMessage(
            "卸载失败：" + (error && error.message || error) + "；已停用，请稍后重试",
            "error"
          );
          render();
        });
      });
    }

    /* ==================== 导入 ==================== */
    function readFileText(file, onProgress) {
      return new Promise(function (resolve, reject) {
        var reader;
        try {
          reader = new FileReader();
        } catch (error) {
          reject(new Error("无法创建文件读取器"));
          return;
        }
        var lastPercent = -1;
        reader.onprogress = function (event) {
          if (!event.lengthComputable || typeof onProgress !== "function") return;
          var percent = Math.round(event.loaded / event.total * 100);
          if (percent === lastPercent) return;
          lastPercent = percent;
          onProgress(percent);
        };
        reader.onload = function () {
          if (typeof onProgress === "function") onProgress(100);
          resolve(String(reader.result || ""));
        };
        reader.onerror = function () {
          reject(reader.error || new Error("文件读取失败"));
        };
        reader.onabort = function () {
          reject(new Error("文件读取已取消"));
        };
        try {
          reader.readAsText(file, "utf-8");
        } catch (error) {
          reject(error);
        }
      });
    }

    function handleFiles(fileList) {
      if (state.importing || !fileList) return;
      var files = [];
      for (var i = 0; i < fileList.length; i++) files.push(fileList[i]);
      if (!files.length) return;

      var names = files.slice(0, 5).map(function (file) {
        return file && file.name ? file.name : "未命名文件";
      }).join("、");
      if (files.length > 5) names += " 等 " + files.length + " 个文件";
      var totalSize = 0;
      files.forEach(function (file) {
        totalSize += Number(file && file.size) || 0;
      });
      var sizeHint = totalSize > 8 * 1024 * 1024 ? "文件较大，读取/注入可能需要更久。" : "";
      showConfirm(
        "将导入并立即启用：" + names + "。" + sizeHint +
          "脚本将以游戏页面权限运行，请确认来源可信。",
        "导入并启用"
      ).then(function (confirmed) {
        if (confirmed) importFiles(files);
      });
    }

    function importFiles(files) {
      state.importing = true;
      ui.importButton.disabled = true;
      var index = 0;
      var imported = 0;
      var failed = 0;
      var pendingInject = 0;

      function step() {
        if (index >= files.length) {
          state.importing = false;
          ui.importButton.disabled = false;
          setProgress("");
          render();
          if (imported) {
            var text = "已导入 " + imported + " 个脚本";
            if (state.engineReady) text += "并开始注入";
            else if (pendingInject) text += "，等待游戏引擎后自动注入";
            if (failed) text += "；" + failed + " 个失败";
            setMessage(text, failed ? "error" : "ok");
          }
          return;
        }

        var file = files[index];
        var validation = validateFile(file);
        if (validation) {
          failed += 1;
          setMessage("导入失败：" + (file && file.name || "未知文件") + " · " + validation, "error");
          index += 1;
          step();
          return;
        }

        setProgress("读取中 (" + (index + 1) + "/" + files.length + ") " + file.name + " · 0%");
        readFileText(file, function (percent) {
          setProgress("读取中 (" + (index + 1) + "/" + files.length + ") " + file.name + " · " + percent + "%");
        }).then(function (code) {
          if (isDisposed()) return null;
          if (!code || !code.trim()) throw new Error("文件内容为空，无法注入");
          if (code.indexOf("\u0000") !== -1) throw new Error("文件包含二进制内容，已拒绝注入");

          var record = {
            id: makeId(),
            name: extractName(code, file.name),
            code: code,
            size: file.size,
            enabled: true,
            createdAt: Date.now(),
            meta: { fileName: file.name, description: extractDescription(code) }
          };

          // 先进入内存列表并注入，持久化异步进行；存储失败时脚本仍可在本窗口使用。
          customScripts.push(record);
          imported += 1;
          render();
          if (db) {
            persistRecord(record).catch(function (error) {
              setMessage(storageErrorText(error), "error");
            });
          }
          if (state.engineReady) return injectCustom(record);
          pendingInject += 1;
          return null;
        }).catch(function (error) {
          failed += 1;
          setMessage("导入失败：" + file.name + " · " + (error && error.message || error), "error");
        }).then(function () {
          index += 1;
          step();
        });
      }

      step();
    }

    /* ==================== 批量操作 ==================== */
    function batchEnable() {
      if (state.loading) return;
      var skipped = [];
      var claimedGroups = Object.create(null);

      builtinScripts.forEach(function (item) {
        if (item.group && claimedGroups[item.group]) {
          if (builtinEnabled.has(item.file)) builtinEnabled.delete(item.file);
          return;
        }

        if (item.group) {
          // 同组已在本窗口运行的脚本无法热切换，跳过并提示。
          var blockedBy = null;
          for (var i = 0; i < builtinScripts.length; i++) {
            var other = builtinScripts[i];
            if (other === item || other.group !== item.group) continue;
            var otherStatus = activeBuiltin.get(other.file);
            if (otherStatus === "running" || otherStatus === "loading") {
              blockedBy = other;
              break;
            }
          }
          if (blockedBy) {
            skipped.push(item.name);
            claimedGroups[item.group] = true;
            return;
          }
          // 每组只保留一个持久化启用项。
          for (var j = 0; j < builtinScripts.length; j++) {
            var sibling = builtinScripts[j];
            if (sibling !== item && sibling.group === item.group) {
              builtinEnabled.delete(sibling.file);
              activeBuiltin.delete(sibling.file);
            }
          }
          claimedGroups[item.group] = true;
        }

        if (!builtinEnabled.has(item.file)) {
          if (!bridgeAvailable()) return;
          builtinEnabled.add(item.file);
          loadBuiltin(item);
        }
      });

      persistBuiltin();

      customScripts.forEach(function (record) {
        if (!record.enabled) {
          record.enabled = true;
          if (db) persistRecord(record).catch(function () {});
          if (state.engineReady) injectCustom(record);
        }
      });

      render();
      var text = "已全部启用";
      if (skipped.length) text += "；以下脚本因同组已加载被跳过：" + skipped.join("、");
      setMessage(text, skipped.length ? "error" : "ok");
    }

    function batchDisable() {
      if (state.loading) return;
      builtinScripts.forEach(function (item) {
        builtinEnabled.delete(item.file);
      });
      persistBuiltin();

      customScripts.forEach(function (record) {
        if (!record.enabled) return;
        record.enabled = false;
        if (db) persistRecord(record).catch(function () {});
      });

      render();
      setMessage("已全部停用；本窗口已运行的内置/自定义脚本需刷新或重开窗口后才会完全关闭", "");
    }

    /* ==================== 启动流程 ==================== */
    function hasPending() {
      if (builtinEnabled.size > 0) return true;
      for (var i = 0; i < customScripts.length; i++) {
        if (customScripts[i].enabled) return true;
      }
      return false;
    }

    // 30s 超时后引擎才就绪时，用户打开面板/点击启用仍应能继续加载。
    function checkEngine() {
      if (state.engineReady) return true;
      if (!(window.cc && window.cc.game)) return false;
      state.engineReady = true;
      if (!state.loading && !state.autoStarted && hasPending()) {
        state.autoStarted = true;
        startEnabledScripts().catch(function (error) {
          warn("延迟启动脚本失败", error);
        });
      }
      render();
      return true;
    }

    function waitForEngine() {
      return new Promise(function (resolve) {
        if (window.cc && window.cc.game) {
          resolve(true);
          return;
        }
        var startedAt = Date.now();
        var timer = setInterval(function () {
          if (isDisposed()) {
            clearInterval(timer);
            resolve(false);
            return;
          }
          if (window.cc && window.cc.game) {
            clearInterval(timer);
            resolve(true);
            return;
          }
          if (Date.now() - startedAt >= ENGINE_WAIT_MS) {
            clearInterval(timer);
            resolve(false);
          }
        }, ENGINE_POLL_MS);
      });
    }

    function startEnabledScripts() {
      var seenGroups = Object.create(null);
      var skippedBuiltin = 0;
      var chain = Promise.resolve();

      builtinScripts.forEach(function (item) {
        if (!builtinEnabled.has(item.file)) return;
        if (item.group) {
          if (seenGroups[item.group]) {
            builtinEnabled.delete(item.file);
            return;
          }
          seenGroups[item.group] = true;
        }
        if (!bridgeAvailable()) {
          skippedBuiltin += 1;
          return;
        }
        chain = chain.then(function () {
          return loadBuiltin(item);
        });
      });

      customScripts.forEach(function (record) {
        if (!record.enabled) return;
        chain = chain.then(function () {
          return injectCustom(record);
        });
      });

      persistBuiltin();
      return chain.then(function () {
        return skippedBuiltin;
      });
    }

    function initDb() {
      return openDb().then(function (opened) {
        db = opened;
        state.dbAvailable = !!opened;
        if (!opened) {
          setMessage("浏览器存储不可用，自定义脚本仅在本次窗口生效（未持久化）", "error");
        }
        return opened;
      });
    }

    function loadCustomFromDb() {
      if (!db) return Promise.resolve();
      return new Promise(function (resolve) {
        var settled = false;
        var timer = setTimeout(function () {
          if (settled) return;
          settled = true;
          warn("读取自定义脚本超时");
          resolve();
        }, 5000);

        readAllScripts().then(function (rows) {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          customScripts = rows.sort(function (a, b) {
            return a.createdAt - b.createdAt;
          });
          resolve();
        }, function (error) {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          warn("读取自定义脚本失败", error);
          setMessage("读取已保存的自定义脚本失败", "error");
          resolve();
        });
      });
    }

    function autoStart() {
      readBuiltinSet();
      render();

      initDb().then(function () {
        return loadCustomFromDb();
      }).then(function () {
        state.loading = false;
        render();
        return waitForEngine();
      }).then(function (ready) {
        if (isDisposed()) return null;
        state.engineReady = ready;
        if (!ready) {
          if (hasPending()) {
            setMessage("等待游戏引擎超时，已启用脚本未自动加载；可刷新后重试", "error");
          }
          render();
          return null;
        }
        if (!hasPending()) {
          render();
          return null;
        }
        return startEnabledScripts().then(function (skippedBuiltin) {
          if (skippedBuiltin > 0) {
            setMessage("内置脚本加载器不可用（4.js 未加载），已跳过内置脚本", "error");
          } else {
            setMessage("已自动加载已启用的脚本", "ok");
          }
          render();
          return null;
        });
      }).catch(function (error) {
        state.loading = false;
        render();
        setMessage("脚本中心初始化失败：" + (error && error.message || error), "error");
      });
    }

    /* ==================== 挂载 ==================== */
    function mount() {
      if (mounted || isDisposed()) return;
      if (document.getElementById(ROOT_ID)) return;
      if (!document.body) {
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", mount, { once: true });
        }
        return;
      }

      loadBuiltinMeta();
      var root = buildUi();
      document.body.appendChild(root);
      mounted = true;
      try {
        var legacyLauncher = document.getElementById("gsjc-launcher");
        if (legacyLauncher) legacyLauncher.remove();
      } catch (error) {}
      applySavedPos();
      render();
      // 只有 UI 真正渲染成功后才让 4.js 的原 UI 让位，避免半初始化时无入口。
      window.__xyzwScriptCenterActive = true;
      autoStart();
    }

    function loadBuiltinMeta() {
      var list = null;
      if (window.__gsjcBridge && Array.isArray(window.__gsjcBridge.list) && window.__gsjcBridge.list.length) {
        list = window.__gsjcBridge.list;
      }
      if (!list) list = FALLBACK_BUILTIN;
      builtinScripts = list.map(function (item) {
        return {
          file: String(item.file || ""),
          name: String(item.name || item.file || "内置脚本"),
          group: String(item.group || ""),
          versionName: String(item.versionName || "")
        };
      }).filter(function (item) {
        return !!item.file;
      });
    }

    /* ==================== 调试 API（不含凭据） ==================== */
    window.__xyzwScriptCenter = {
      state: function () {
        return {
          engineReady: state.engineReady,
          dbAvailable: state.dbAvailable,
          loading: state.loading,
          filter: filter,
          builtin: builtinScripts.map(function (item) {
            return {
              file: item.file,
              name: item.name,
              group: item.group,
              enabled: builtinEnabled.has(item.file),
              status: activeBuiltin.get(item.file) || ""
            };
          }),
          custom: customScripts.map(function (record) {
            return {
              id: record.id,
              name: record.name,
              size: record.size,
              enabled: record.enabled,
              status: activeCustom.get(record.id) || ""
            };
          })
        };
      },
      refresh: function () {
        syncBridgeStatus();
        render();
      }
    };

    mount();
  } catch (error) {
    try {
      window.__xyzwScriptCenterActive = false;
      if (ui.root && ui.root.parentNode) ui.root.remove();
      mounted = false;
      if (window.console) console.warn("[脚本中心] 初始化异常", error);
    } catch (ignored) {}
  }
})();
