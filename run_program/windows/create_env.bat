@echo off
:: Get the current absolute path
set CURRENT_PATH=%cd%
:: Replace '\' with '/' to match POSIX-style path
set target_path=%CURRENT_PATH:\=/%
:: Add /savefiles/ to the end of the path
set target_path=%target_path%/savefiles/
:: Write to .env
echo CREW_SAVEFILES_PATH="%target_path%" > ./../.env
echo Path saved to manager.env: %target_path%