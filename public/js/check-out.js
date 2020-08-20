let countdownNumberEl = $("#countdown-number");
let countdown = 5;
let countdownInterval;

$(document).ready(function () {

	$("#countdown-number").text(countdown);

	countdownInterval = setInterval(function () {
		countdown = --countdown;
		$("#countdown-number").text(countdown);
		if ($("#countdown-number").text() == 0) {
			stopCountdown();
			checkOut();
		}
	}, 1000);

	if (sessionStorage.getItem("sessionTimestamp") == null) {
		sessionStorage.setItem('sessionTimestamp', Date.now());
	} else {
		stopCountdown();
		$("#session-expired").fadeIn(600);
	}

	$("#stop-check-out").click(function () {
		stopCountdown();
		$(".showCheckInStopped").show();
	})

	$(".send-feedback").click(function() {
		let feedback = $(this).attr("data-feedback");
		let placeUUID = $("#place").attr("place-uuid");
		$.ajax({
			url: `/place/${placeUUID}/feedback`,
			method: "POST",
			data: {
				feedback: feedback
			},
			statusCode: {
				200: function() {
					$("#feedback").slideUp(600);
				},
				500: function() {
					alert("Errore: si prega di riprovare!");
				}
			  }
		});
	})

});

function stopCountdown() {
	clearInterval(countdownInterval);
	$("#stop-check-out").remove();
	$("#info").remove();
	$("#countdown").remove();
}

function checkOut() {
	let placeUUID = $("#place").attr("place-uuid");

	$.ajax({
		url: `/place/${placeUUID}/check-out`,
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