on run
    set appPath to POSIX path of (path to me)
    set projectPath to do shell script "/usr/bin/dirname " & quoted form of appPath
    set scriptPath to projectPath & "/preview/set-gemini-key-window.py"
    try
        do shell script "/usr/bin/python3 " & quoted form of scriptPath & " >/dev/null 2>&1"
    on error
        display dialog "登録画面を起動できませんでした。My appフォルダ内にあるアプリを開いてください。" with title "のびログ・Gemini登録" buttons {"OK"} default button "OK"
    end try
end run
