@echo off

setlocal EnableDelayedExpansion

for /f "tokens=*" %%l in ( 'findstr /n $' ) do (
	set line=%%l
	set version=!line:~2,12!
	if "!version!"=="// @version " (
	  echo // ^@version     %date:~4,8%-%time:~0,2%%time:~3,2%%time:~6,2%
	) else (
	  set line=!line:*:=!
	  echo:!line!
	)
)

endlocal
