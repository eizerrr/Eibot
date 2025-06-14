#!/data/data/com.termux/files/usr/bin/bash

echo "🛑 Menghentikan Ei Bot dengan PM2..."
pm2 stop ei-bot
pm2 delete ei-bot
pm2 save
