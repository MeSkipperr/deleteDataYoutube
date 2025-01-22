const { exec } = require('child_process');
const fs = require('fs');
const cron = require('node-cron');

const adbPath = '"C:\\Users\\I KADEK YOLA ANDIKA\\Downloads\\platform-tools-latest-windows\\platform-tools\\adb.exe"';
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

const  updateStatusTV = (array, targetName, updateStatus) => {
    array.forEach((item) => {
    if (item.name === targetName) {
        item.status = updateStatus;
    }
    });
}

// Fungsi utama untuk menangani tiap perangkat
const processDevices = async () => {
    const statusError  = ["Connecting","Cannot connect to device" , "Failed to clear Youtube data application" ,"Success"]
    const devices = readDevicesFromFile();
    const clearDevices = [];

    for (const device of devices) {
        const deviceAddress = `${device.ipAddress}:5555`;
        try {
            clearDevices.push({ name: device.name, ipAddress: deviceAddress, status : statusError[0]});

            console.log(`Trying connect to : ${device.name} | ${device.ipAddress} ...`)
            const connectCommand = `${adbPath} connect ${deviceAddress}`;
            const connectOutput = await runCommand(connectCommand);

            if (connectOutput.toLowerCase().includes('failed')) {
                updateStatusTV(clearDevices,device.name,statusError[1])
                console.error(`Cannot Connect to device  ${device.name}: ${connectOutput}`);
                // continue;
            }
            
            console.log(`Trying to clear Youtube data application : ${device.name} | ${device.ipAddress} ...`)
            const clearCommand = `${adbPath} -s ${deviceAddress} shell pm clear ${youtubePackage}`;
            const clearOutput = await runCommand(clearCommand);

            if (clearOutput.toLowerCase().includes('failed')) {
                updateStatusTV(clearDevices,device.name,statusError[2])
                console.error(`Cannot clear youtube data application ${device.name}: ${clearOutput}`);
                continue; 
            }
            updateStatusTV(clearDevices,device.name,statusError[3])
        } catch (error) {
            console.error(`Error trying to connect device ${device.name}:`, error);
        }
    }
    console.table(clearDevices)
};

// Jadwalkan eksekusi fungsi setiap hari pada jam 13:00
cron.schedule('0 13 * * *', () => {
    console.log('Running Program');
    processDevices();
});


processDevices()

// console.log('Jadwal telah dijalankan. Fungsi akan diproses setiap hari pada jam 13:00.');
