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

	let checkOutDate = localStorage.getItem("checkoutTimestampBF");

	if(checkOutDate == null || Date.now()-checkOutDate > 8*60*60*1000) { // Not valid anymore after 8 hour
		localStorage.removeItem("checkoutUUID");
		localStorage.removeItem("checkoutTimestamp");
		localStorage.removeItem("checkoutTimestampBF");
	}

	let currentPlaceUUID = $("#place").attr("place-uuid");
	
	if (localStorage.getItem("checkoutUUID") != null && localStorage.getItem("checkoutUUID") == currentPlaceUUID) {
		stopCountdown();
		$("#session-expired").fadeIn(600);
		$('#manual-checkout').fadeIn(600);
	}

	$('#manual-checkout').click(function () {
		checkOut();
	});

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

/**
 * Stops the countdown if the user do not want to check-out
 */
function stopCountdown() {
	clearInterval(countdownInterval);
	$("#stop-check-out").remove();
	$("#info").remove();
	$("#countdown").remove();
}

/**
 * Function called to handle the check-out process
 */
function checkOut() {
	let placeUUID = $("#place").attr("place-uuid");

	$.ajax({
		url: `/place/${placeUUID}/check-out`,
		method: "POST",
		statusCode: {
			200: function() {
				$('#manual-checkout').hide();
				$("#session-expired").hide();
				localStorage.setItem('checkoutUUID', $("#place").attr("place-uuid"));
				localStorage.setItem("checkoutTimestampBF", Date.now());
				localStorage.removeItem("checkinUUID");
				localStorage.removeItem("checkinTimestampBF");
				stopCountdown();
				$(".showCheckIn").show();
				$(".row.semaphore").removeClass("hide");
			},
			500: function() {
				stopCountdown();
				alert("Errore: si prega di riprovare!");
			}
		  }
	});
}