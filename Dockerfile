# Gunakan image node resmi sebagai basis
FROM node:18

# Buat direktori kerja untuk aplikasi
WORKDIR /usr/src/app

COPY . . /usr/src/app/

# Instal dependensi aplikasi
RUN npm install

# Jalankan perintah untuk memulai aplikasi
CMD [ "npm", "run", "bot" ]
