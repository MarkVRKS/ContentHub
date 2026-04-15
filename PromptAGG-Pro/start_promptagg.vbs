Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

' Получаем текущую папку (например, C:\CHUB)
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)

' 1. Запускаем Ядро (бэкенд) АБСОЛЮТНО СКРЫТО (0)
batPath = chr(34) & currentDir & "\backend\app\start_server.bat" & chr(34)
shell.Run batPath, 0, False

' Ждем 2.5 секунды, чтобы база проснулась
WScript.Sleep 2500

' 2. Запускаем Терминал (портативный .exe, лежащий в этой же папке)
' ВНИМАНИЕ: Убедись, что имя файла совпадает с тем, что ты закинешь в папку!
exePath = chr(34) & currentDir & "\PromptAGG Pro.exe" & chr(34) & " ?isManager=true"

' Запускаем интерфейс
shell.Run exePath, 1, False

Set shell = Nothing
Set fso = Nothing