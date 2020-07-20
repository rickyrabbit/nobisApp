let countdownNumberEl = $("#countdown-number");
let countdown = 5;
let countdownInterval;

$( document ).ready(function() {

	$("#countdown-number").text(countdown);

  countdownInterval = setInterval(function() {
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

  $("#stop-check-out").click(function() {
		stopCountdown();
		$(".showCheckInStopped").show();
		closeWindow(2000);
	})

});

function stopCountdown() {
	clearInterval(countdownInterval);
	$("#stop-check-out").remove();
	$("#info").remove();
	$("#countdown").remove();
}

function checkOut() {

	//Inserire qui la chiamata ajax

	closeWindow(2000);

	$(".hideCheckIn").hide();
	$(".showCheckIn").removeClass("showCheckIn");
}

function closeWindow(timeout) {
	setTimeout(function() {
		//window.close();
	}, timeout);
}