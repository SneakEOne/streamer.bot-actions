var currentTimer;
var remainingSeconds;
var timer;
var timerDoneText = "";//<h1>Countdown is done!</h1>"
var desc;

window.addEventListener('load', (event) => {
    $('#timeleft').html("00:00");
    connectws();
});

function connectws() {
    if ("WebSocket" in window) {
        ws = new WebSocket("ws://localhost:8080/");
        bindEvents();
    }
}

function bindEvents() {
    ws.onopen = function() {
        console.debug('Websocket connected');
        ws.send(JSON.stringify({
            "request": "Subscribe",
            "events": {
                "general": [
                    "Custom"
                ],
            },
            "id": "countdown"
        }));
    }

    ws.onmessage = function(event) {
        // grab message and parse JSON
        const msg = event.data;
        const wsdata = JSON.parse(msg);


        console.debug(event);

        if (wsdata.data == null) {
            return;
        }

        // check for events to trigger
        switch (wsdata.data.name) {
            case "SetupTimer":
                console.debug(wsdata.data.arguments);

                time = wsdata.data.arguments.time;
                desc = wsdata.data.arguments.description;

                // Check if time is contained inside description
                if (time == desc.substring(0, 2)) {
                    desc = desc.substring(100, time.length);
                }

                setupTimer(parseInt(wsdata.data.arguments.time), desc);
                break;
            case "StartTimer":
                startTimer();
                break;
            case "RestartTimer":
                restartTimer();
                break;
            case "AddTime":
                addTime(parseInt(wsdata.data.arguments.time));
                break;
            case "PauseTimer":
                pauseTimer();
                break;
            case "StopTimer":
                stopTimer();
                break;
            case "ResumeTimer":
                startTimer();
                break;
            default:
                console.log(wsdata.data.event.type);

        }
    };

    ws.onclose = function() {
        // "connectws" is the function we defined previously
        setTimeout(connectws, 10000);
    };
}

function setupTimer(time, description = "") {

    if (timer) {
        pauseTimer();
    }

    // Setting up timer
    currentTimer = time;
    remainingSeconds = time;

    // Add description if set
    $('#description').html(description);

    startTimer()
}

function startTimer() {
    timer = setInterval(function() {

        if (remainingSeconds === 0) {
            clearInterval(timer);
            timerDone();
        }

        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = ('0' + remainingSeconds % 60).slice(-2);

        var result = `${minutes} : ${seconds}`;

        $('#timeleft').html(result);

        remainingSeconds--;

    }, 1000)
}

function restartTimer() {
    remainingSeconds = currentTimer;
}

function addTime(time) {
    remainingSeconds = remainingSeconds + time;
}

function pauseTimer() {
    clearInterval(timer);
}

function stopTimer() {
    remainingSeconds = 0;
}

function timerDone() {
    $('#description').html(timerDoneText);

    ws.send(JSON.stringify({
        "request": "DoAction",
        "action": {
            "id": "f600902f-0b5d-454d-8487-f51ff8a9e6e8", // Can be found in context menu of action
            "name": "Timer Finished"
        },
        "id": "countdown-finished"
    }));

}