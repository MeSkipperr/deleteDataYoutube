const { exec } = require('child_process');
const fs = require('fs');

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

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Fungsi utama untuk menangani tiap perangkat
const processDevices = async () => {
    const statusError  = ["Connecting","Cannot connect to device" , "Failed to enable Youtube data application" ,"Success"]
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
            
            console.log(`Trying to enable Youtube data application : ${device.name} | ${device.ipAddress} ...`)
            const clearCommand = `${adbPath} -s ${deviceAddress} shell pm enable ${youtubePackage}`;
            const clearOutput = await runCommand(clearCommand);

            if (clearOutput.toLowerCase().includes('failed')) {
                updateStatusTV(clearDevices,device.name,statusError[2])
                console.error(`Cannot enable youtube data application ${device.name}: ${clearOutput}`);
                continue; 
            }

            const boot = `${adbPath} -s ${deviceAddress} reboot`;
            const runtime = `${adbPath} -s ${deviceAddress}  shell cat /proc/uptime`;
            console.log("runtime", await runCommand(runtime))
            await delay(5000);
            
            await runCommand(boot);
            
            updateStatusTV(clearDevices,device.name,statusError[3])
        } catch (error) {
            console.error(`Error trying to connect device ${device.name}:`, error);
        }
    }
    console.table(clearDevices)
};


processDevices()