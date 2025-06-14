#!/data/data/com.termux/files/usr/bin/bash

echo "🚀 Menjalankan Ei Bot pakai PM2..."

npm install -g pm2

pm2 start index.js --name ei-bot
pm2 save
