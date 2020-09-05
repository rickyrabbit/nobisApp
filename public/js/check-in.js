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

	let checkInDate = localStorage.getItem("checkinTimestamp");

	if(checkInDate != null && Date.now()-checkInDate > 8*60*60*10000) { // Not valid anymore after 8 hour
		localStorage.removeItem("checkinUUID");
		localStorage.removeItem("checkinTimestamp");
	}

	let currentPlaceUUID = $("#place").attr("place-uuid");

	if (localStorage.getItem("checkinUUID") != null && localStorage.getItem("checkinUUID") == currentPlaceUUID) {
		stopCountdown();
		$("#session-expired").fadeIn(600);
		$('#manual-checkin').fadeIn(600);
	}

	$('#manual-checkin').click(function () {
		checkIn();
	});

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

	$("#send-problem").click(function () {
		let problem = $("#inputProblem").val();
		let placeUUID = $("#place").attr("place-uuid");
		$.ajax({
			url: `/report/create`,
			method: "POST",
			data: {
				problem: problem,
				placeUUID: placeUUID
			},
			statusCode: {
				200: function () {
					$("#form-report-problem").slideDown(600);
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
			200: function () {
				$('#manual-checkin').hide();
				$("#session-expired").hide();
				stopCountdown();
				localStorage.setItem('checkinUUID', $("#place").attr("place-uuid"));
				localStorage.setItem("checkinTimestamp", Date.now());
				localStorage.removeItem("checkoutUUID");
				localStorage.removeItem("checkoutTimestamp");
				$(".showCheckIn").show();
			},
			500: function () {
				stopCountdown();
				alert("Errore: si prega di riprovare!");
			}
		}
	});

}