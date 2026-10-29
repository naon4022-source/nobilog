#!/bin/zsh
set +x
unset HISTFILE
cd -- "$(dirname "$0")" || exit 1
printf '%s\n' '{"status":"awaiting hidden human input","loginVerified":false}' > human-result.json
python3 ./reset.py
nobi_reset_exit=$?
if [ "$nobi_reset_exit" -ne 0 ]; then
  printf '%s\n' '{"status":"cancelled or command failed; do not assume updated","loginVerified":false}' > human-result.json
fi
printf '\nこの画面を閉じるにはEnterを押してください。\n'
read -r nobi_close_reply
exit "$nobi_reset_exit"
