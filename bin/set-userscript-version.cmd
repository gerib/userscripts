@echo off
@setlocal EnableDelayedExpansion
@set prompt=$g$s 
@set out=bin\s-u-v.out
for /f "tokens=2 delims==" %%d in ('wmic os get localdatetime /format:list') do set datetime=%%d

@echo:>%out%

:: See: Read stdin stream in a batch file <https://stackoverflow.com/a/6980605/1744774>
for /f "tokens=*" %%l in ( 'findstr /n $' ) do (
	set line=%%l
	set version=!line:~2,12!
	if "!version!"=="// @version " (
	  echo // ^@version     %datetime:~2,2%.%datetime:~4,2%.%datetime:~6,2%-%datetime:~8,6%
	  echo // ^@version     %datetime:~2,2%.%datetime:~4,2%.%datetime:~6,2%-%datetime:~8,6%>>%out%
	) else (
	  set line=!line:*:=!
	  echo:!line! && echo:!line!>>%out%
	)
)

:: Unfortunately executed before Git adding
git diff --cached --name-only>>%out%

@endlocal
