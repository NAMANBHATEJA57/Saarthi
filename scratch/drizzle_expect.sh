#!/usr/bin/expect -f
set timeout 10
spawn npx drizzle-kit generate
expect {
    "Are you sure you want to proceed?" { send "\r"; exp_continue }
    "Do you want to rename" { send "\r"; exp_continue }
    "Rename" { send "\r"; exp_continue }
    "created or renamed from another" { send "\r"; exp_continue }
    eof
}
