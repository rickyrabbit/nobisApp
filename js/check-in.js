let countdownNumberEl = $("#countdown-number");
let countdown = 5;
let countdownInterval;


$(document).ready(function () {

	$("#countdown-number").text(countdown);

	countdownInterval = setInterval(function () {
		countdown = --countdown;
		$("#countdown-number").text(countdown);
		if ($("#countdown-number").text() == 0) {
			clearInterval(countdownInterval);
			checkIn();
		}
	}, 1000);

	if (sessionStorage.getItem("sessionTimestamp") == null) {
		sessionStorage.setItem('sessionTimestamp', Date.now());
	} else {
		stopCountdown();
		$("#session-expired").fadeIn(600);
	}

	$("#stop-check-in").click(function () {
		stopCountdown();
		$(".showCheckInStopped").show();
	})

	$("#report-problem").click(function () {
		$(".report-problem-group").remove();
		stopCountdown();
		$("#form-report-problem").fadeIn(600);
	})

});

function stopCountdown() {
	clearInterval(countdownInterval);
	$("#stop-check-in").remove();
	$("#info").remove();
	$("#countdown").remove();
}

function checkIn() {

	// Chiamata per il check-in

	stopCountdown();
	$(".showCheckIn").show();

}