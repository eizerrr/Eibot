#!/data/data/com.termux/files/usr/bin/bash

echo "📦 Memulai Ei Bot Setup..."

pkg update -y && pkg upgrade -y
pkg install nodejs git ffmpeg imagemagick -y

echo "📥 Menginstall dependency..."
npm install

echo "🚀 Menjalankan Ei Bot..."
npm start
