const connectButton = document.getElementById('connectButton');
const sendButton = document.getElementById('sendButton');
const ctx = document.getElementById('chart').getContext('2d');
let chart;
let port;
let writer;

const data = {
    labels: [],
    datasets: [{
        label: 'Seismic Data',
        backgroundColor: 'rgba(0, 99, 132, 0.6)',
        borderColor: 'rgba(0, 99, 132, 1)',
        data: [],
        pointRadius: 0 // Hide data points
    }]
};

const config = {
    type: 'line',
    data: data,
    options: {
        animation: false, // Disable animation for instant update
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                ticks: {
                    callback: function(value, index, values) {
                        const date = new Date(value * 1000);
                        return date.toLocaleTimeString();
                    }
                }
            },
            y: {
                min: -100, // Minimum value for y-axis
                max: 100, // Initial maximum value for y-axis
                beginAtZero: true
            }
        }
    }
};

chart = new Chart(ctx, config);

function enableButtons(value) {
    zeroButton.disabled = !value;
    gain1Button.disabled = !value;
    gain2Button.disabled = !value;
    gain4Button.disabled = !value;
    gain8Button.disabled = !value;
    gain16Button.disabled = !value;
    sps25Button.disabled = !value;
    sps50Button.disabled = !value;
    sps100Button.disabled = !value;
    input1Button.disabled = !value;
    input2Button.disabled = !value;
    bootloaderButton.disabled = !value;
}

async function connectSerial() {
    try {
        filter = {usbVendorId: 0x2E8A, usbProductId: 0x000A}
        port = await navigator.serial.requestPort({ filters: [filter]});
        await port.open({ baudRate: 115200 });

        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
        const reader = textDecoder.readable.getReader();

        const textEncoder = new TextEncoderStream();
        const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
        writer = textEncoder.writable.getWriter();

        enableButtons(true);

        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                break;
            }
            if (value) {
                buffer += value;
                let lines = buffer.split('\n');
                buffer = lines.pop(); // Keep the last partial line in the buffer
                for (let line of lines) {
                    const number = parseFloat(line.trim());
                    if (!isNaN(number)) {
                        addDataToChart(number);
                    }
                }
            }
        }

        await readableStreamClosed.catch(() => { /* Ignore the error */ });
        await writableStreamClosed.catch(() => { /* Ignore the error */ });
    } catch (error) {
        enableButtons(false);
        console.error('Error connecting to serial port:', error);
    }
}

function addDataToChart(number) {
    const currentTime = Date.now() / 1000; // Current time in seconds
    data.labels.push(currentTime);
    data.datasets[0].data.push({ x: currentTime, y: number });

    // Remove old data
    const cutoffTime = currentTime - 10; // 10 seconds ago
    while (data.labels.length > 0 && data.labels[0] < cutoffTime) {
        data.labels.shift();
        data.datasets[0].data.shift();
    }

    // Update the x-axis limits to create a smooth scrolling effect
    chart.options.scales.x.min = cutoffTime;
    chart.options.scales.x.max = currentTime;

    // Dynamically adjust y-axis limits to maintain a minimum range of +/-100
    const yMin = Math.min(...data.datasets[0].data.map(d => d.y));
    const yMax = Math.max(...data.datasets[0].data.map(d => d.y));
    chart.options.scales.y.min = Math.min(-250, yMin - 10); // Allow some space below the minimum value
    chart.options.scales.y.max = Math.max(250, yMax + 10); // Ensure the range is at least 100 units

    chart.update();
}

async function sendZero() {
    if (writer) {
        await writer.write('z');
    }
}

async function sendGain1() {
    if (writer) {
        await writer.write('1');
    }
}

async function sendGain2() {
    if (writer) {
        await writer.write('2');
    }
}

async function sendGain4() {
    if (writer) {
        await writer.write('4');
    }
}


async function sendGain8() {
    if (writer) {
        await writer.write('8');
    }
}


async function sendGain16() {
    if (writer) {
        await writer.write('16');
    }
}

async function sendSPS25() {
    if (writer) {
        await writer.write('a');
    }
}

async function sendSPS50() {
    if (writer) {
        await writer.write('b');
    }
}

async function sendSPS100() {
    if (writer) {
        await writer.write('c');
    }
}

async function sendInput1() {
    if (writer) {
        await writer.write('x');
    }
}

async function sendInput2() {
    if (writer) {
        await writer.write('y');
    }
}

async function sendBootloader() {
    if (writer) {
        await writer.write('r');
    }
}

connectButton.addEventListener('click', connectSerial);
zeroButton.addEventListener('click', sendZero);
gain1Button.addEventListener('click', sendGain1);
gain2Button.addEventListener('click', sendGain2);
gain4Button.addEventListener('click', sendGain4);
gain8Button.addEventListener('click', sendGain8);
gain16Button.addEventListener('click', sendGain16);
sps25Button.addEventListener('click', sendSPS25);
sps50Button.addEventListener('click', sendSPS50);
sps100Button.addEventListener('click', sendSPS100);
input1Button.addEventListener('click', sendInput1);
input2Button.addEventListener('click', sendInput2);
bootloaderButton.addEventListener('click', sendBootloader);