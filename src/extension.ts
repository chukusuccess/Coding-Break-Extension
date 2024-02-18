import * as vscode from "vscode";

let reminderInterval: NodeJS.Timeout | undefined = undefined;
export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "break-reminder.remindBreak",
    () => {
      const columnToShowIn = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined;

      if (tab) {
        tab.reveal(columnToShowIn);
      } else {
        tab = vscode.window.createWebviewPanel(
          "breakReminder",
          "Break Reminder",
          columnToShowIn || vscode.ViewColumn.One,
          { enableScripts: true }
        );

        tab.webview.html = getWebviewContent();

        vscode.commands.executeCommand(
          "setContext",
          "breakReminderWebviewFocused",
          true
        );

        tab.onDidDispose(() => {
          vscode.commands.executeCommand(
            "setContext",
            "breakReminderWebviewFocused",
            false
          );
          tab = undefined;
        });

        tab.onDidChangeViewState((e) => {
          const focused = e.webviewPanel.active;
          vscode.commands.executeCommand(
            "setContext",
            "breakReminderWebviewFocused",
            focused
          );
        });

        tab.webview.onDidReceiveMessage((message) => {
          switch (message.command) {
            case "configure":
              vscode.window.showInformationMessage(message.text);
              break;

            case "dismissMessage":
              tab?.dispose();
              vscode.window.showInformationMessage(message.text);
              break;

            default:
              console.warn(`Unknown command: ${message.command}`);
          }
        });
      }

      if (!reminderInterval) {
        reminderInterval = setInterval(() => {
          vscode.commands.executeCommand("break-reminder.remindBreak");
        }, 360000); // 1 hour in milliseconds
      }
    }
  );

  function getWebviewContent() {
    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline';"/>
        <title>Break Reminder</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: transparent;
          }
          .msgboxparent {
            border-radius: 24px;
            background-color: rgba(0, 255, 255, 0.750);
          }
          .msgbox {
            border: 2px solid #737372;
            padding: 24px;
            background-color: #f5f5f5;
            min-width: 350px;
            max-width: 500px;
            border-radius: 24px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            color: #333;
            text-align: center;
          }
          p{
            font-size: 1.2rem;
            font-weight: 400;
          }
          .btnBox {
            width:100%;
            display: flex;
            justify-content: center;
            gap: 20px;
            margin: 16px auto;
          }
          .closeholder{
            border-radius: 8px;
            background-color: #c51e3a;
          }
          .pinholder{
            border-radius: 8px;
            background-color: #5dbb63;
          }
          button {
            width: 150px;
            height: 50px;
            background: black;
            border: 0;
            border-radius: 8px;
            color: white;
            font-size: 1.2rem;
            cursor: pointer;
          }
          button:active{
            transform: scale(1.05); 
            transition: transform 0.1s ease-in-out;
          }
        </style>
      </head>
      <body data-vscode-context='{"preventDefaultContextMenuItems": true}'>
        <div class="msgboxparent">
          <div id="msgbox" class="msgbox">
            <h1>Break Time</h1>
            <br/>
            <p>
            Hey there! 😀 You've been doing great, but your mind and body deserve a little break. Let's take 10 minutes to step away, stretch, and refresh 🤸‍♂️. It's a small investment for your well-being and productivity. See you in a bit! 🕒
            </p>
            <div class="btnBox">
              <div class="closeholder">
                <button id="closeBtn">Close Tab</button>
              </div>
              <div class="pinholder">
              <button id="configBtn" >Configure</button>
              </div>
          </div>
          </div>
        </div>
        <script>
        (function(){
        const vscode = acquireVsCodeApi();

        function closeTab() {
          vscode.postMessage({
            command: 'dismissMessage',
            text: 'Next reminder in one hour! 😊'
          })
        }

        function configure() {
          vscode.postMessage({
            command: 'configure',
            text: 'This feature is coming soon'
          })
        }

        window.addEventListener("load", function () {
          const card = document.getElementById("msgbox");
          const closeBtn = document.getElementById("closeBtn");
          const configBtn = document.getElementById("configBtn");
        
          function addGlowEffect(element, color) {
            element.addEventListener("mousemove", (event) => {
              const rect = element.getBoundingClientRect();
              const mouseX = event.clientX - rect.left;
              const mouseY = event.clientY - rect.top;
        
              const gradientX = (mouseX / element.clientWidth) * 100;
              const gradientY = (mouseY / element.clientHeight) * 100;
        
              element.style.background = 'radial-gradient(circle at ' + gradientX + '% ' + gradientY + '%, transparent 20%, ' + color + ' 80%)';
            });
        
            element.addEventListener("mouseleave", () => {
              element.style.background = color;
            });
          }
      
          addGlowEffect(card, "#f5f5f5");
          addGlowEffect(closeBtn, "#000");
          addGlowEffect(configBtn, "#000");

          closeBtn.onclick = closeTab;
          configBtn.onclick = configure;
        });
      })();
        </script>
      </body>
    </html>`;
  }

  let tab: vscode.WebviewPanel | undefined = undefined;

  let dismissCommand = vscode.commands.registerCommand(
    "break-reminder.dismissMessage",
    () => {
      tab?.dispose();
      vscode.window.showInformationMessage("Next reminder in one hour! 😊");
    }
  );

  let configure = vscode.commands.registerCommand(
    "break-reminder.configure",
    () => {
      vscode.window.showInformationMessage("This feature is coming soon");
    }
  );

  let stopReminders = vscode.commands.registerCommand(
    "break-reminder.stopReminders",
    () => {
      if (reminderInterval) {
        clearInterval(reminderInterval);
        reminderInterval = undefined;
      }
      if (tab) {
        tab.dispose();
      }
      vscode.window.showErrorMessage(
        "You will no longer receive break-time reminders. To undo, restart extension"
      );
    }
  );

  context.subscriptions.push(stopReminders);
  context.subscriptions.push(dismissCommand);
  context.subscriptions.push(configure);
  context.subscriptions.push(disposable);
}

export function deactivate() {}
