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
		$(".showCheckInStopped").show();
		$("#form-report-problem").fadeIn(600);
	})

	$("#send-problem").click(function() {
		let email = $("#inputEmail").val();
		let problem = $("#inputProblem").val();
		let placeUUID = $("#place").attr("place-uuid");
		$.ajax({
			url: `/report/create`,
			method: "POST",
			data: {
				email: email,
				problem: problem,
				placeUUID: placeUUID
			},
			statusCode: {
				200: function() {
					$("#form-report-problem").fadeOut(600);
				}
			  }
		});

	})

});

function stopCountdown() {
	clearInterval(countdownInterval);
	$("#stop-check-in").remove();
	$("#info").remove();
	$("#countdown").remove();
}

function checkIn() {
	let placeUUID = $("#place").attr("place-uuid");
	// Chiamata per il check-in
	$.ajax({
		url: `/place/${placeUUID}/check-in`,
		method: "POST",
		statusCode: {
			200: function() {
				stopCountdown();
				$(".showCheckIn").show();
			},
			500: function() {
				stopCountdown();
				alert("Errore: si prega di riprovare!");
			}
		  }
	});

}