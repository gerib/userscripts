@echo off
@setlocal EnableDelayedExpansion
@set prompt=$g$s 
@set out=bin\suv.out

@echo:>%out%

:: See: Read stdin stream in a batch file <https://stackoverflow.com/a/6980605/1744774>
for /f "tokens=*" %%l in ( 'findstr /n $' ) do (
	set line=%%l
	set version=!line:~2,12!
    set time_=0%time: =%
	if "!version!"=="// @version " (
	  echo // ^@version     %date:~8,2%.%date:~3,2%.%date:~0,2%-!time_:~-11,2!!time_:~-8,2!!time_:~-5,2!
	  echo // ^@version     %date:~8,2%.%date:~3,2%.%date:~0,2%-!time_:~-11,2!!time_:~-8,2!!time_:~-5,2!>>%out%
	) else (
	  set line=!line:*:=!
	  echo:!line! && echo:!line!>>%out%
	)
)

:: Doesn't work since it is executed before adding
::git diff --cached --name-only>>%out%

@endlocal
