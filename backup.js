const { exec } = require('child_process');
const fs = require('fs');
const cron = require('node-cron');

const adbPath = 'C:\\Users\\DPSCYDT8238FX7\\Downloads\\platform-tools-latest-windows\\platform-tools\\adb.exe';
const youtubePackage = 'com.google.android.youtube.tv';

// Fungsi untuk menjalankan perintah ADB
const runCommand = (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(stderr || error.message);
            } else {
                resolve(stdout.trim());
            }
        });
    });
};

// Fungsi untuk membaca data perangkat dari file JSON
const readDevicesFromFile = () => {
    const data = fs.readFileSync('ipTv.json');
    return JSON.parse(data);
};

// Fungsi utama untuk menangani tiap perangkat
const processDevices = async () => {
    const devices = readDevicesFromFile();
    const failedDevices = [];

    for (const device of devices) {
        const deviceAddress = `${device.ipAddress}:${device.port}`;
        try {
            console.log(`\n=== Memproses perangkat: ${device.name} (${deviceAddress}) ===`);

            // Sambungkan ke perangkat
            console.log('Menyambungkan ke perangkat...');
            const connectCommand = `${adbPath} connect ${deviceAddress}`;
            const connectOutput = await runCommand(connectCommand);

            // Cek apakah koneksi berhasil
            if (connectOutput.toLowerCase().includes('failed')) {
                console.error(`Gagal menyambungkan ke perangkat ${device.name}: ${connectOutput}`);
                continue; // Lanjutkan ke perangkat berikutnya
            }
            console.log(connectOutput);

            // Clear data aplikasi YouTube
            console.log(`Menghapus data aplikasi YouTube (${youtubePackage}) pada perangkat ${device.name}...`);
            const clearCommand = `${adbPath} -s ${deviceAddress} shell pm clear ${youtubePackage}`;
            const clearOutput = await runCommand(clearCommand);

            // Cek apakah pm clear berhasil
            if (clearOutput.toLowerCase().includes('failed')) {
                console.error(`Gagal menghapus data aplikasi YouTube pada perangkat ${device.name}: ${clearOutput}`);
                failedDevices.push({ name: device.name, ipAddress: deviceAddress, clearYouTube: false });
                continue; // Lanjutkan ke perangkat berikutnya
            }
            console.log(clearOutput);

            console.log(`Data aplikasi YouTube pada perangkat ${device.name} berhasil dihapus.`);
            failedDevices.push({ name: device.name, ipAddress: deviceAddress, clearYouTube: true });
        } catch (error) {
            console.error(`Terjadi kesalahan pada perangkat ${device.name}:`, error);
            failedDevices.push({ name: device.name, ipAddress: deviceAddress, clearYouTube: false });
        }
    }

    // Tampilkan tabel perangkat yang gagal menghapus YouTube
    console.log('\n| Name | IP Address | Clear YouTube |');
    console.log('|------|------------|---------------|');
    failedDevices.forEach((device) => {
        console.log(`| ${device.name} | ${device.ipAddress} | ${device.clearYouTube ? 'true' : 'false'} |`);
    });
};

// Jadwalkan eksekusi fungsi setiap hari pada jam 13:00
cron.schedule('0 13 * * *', () => {
    console.log('=== Menjalankan proses pada pukul 13:00 ===');
    processDevices();
});

console.log('Jadwal telah dijalankan. Fungsi akan diproses setiap hari pada jam 13:00.');
