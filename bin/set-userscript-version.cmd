@echo off
setlocal EnableDelayedExpansion

for /f "usebackq delims=" %%l in ("%1") do (
	set line=%%l
	set version=!line:~0,12!
	if "!version!"=="// @version " (
	  echo // ^@version     %date:~4,8%-%time:~0,2%%time:~3,2%%time:~6,2%
	) else (
	  echo !line!
	)
)

endlocal
