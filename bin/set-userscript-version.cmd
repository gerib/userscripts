@echo off

setlocal EnableDelayedExpansion

echo "%1">>s-u-v.log

:: See: Read stdin stream in a batch file <https://stackoverflow.com/a/6980605/1744774>
for /f "tokens=*" %%l in ( 'findstr /n $' ) do (
	set line=%%l
	set version=!line:~2,12!
    set time_=0%time: =%
	if "!version!"=="// @version " (
	  echo // ^@version     %date:~8,2%.%date:~3,2%.%date:~0,2%-!time_:~-11,2!!time_:~-8,2!!time_:~-5,2!
	) else (
	  set line=!line:*:=!
	  echo:!line!
	)
)

git checkout-index

endlocal
