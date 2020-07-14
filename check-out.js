var countdownNumberEl = $("#countdown-number");
var countdown = 5;


$( document ).ready(function() {

	$("#countdown-number").text(countdown);

  var countdownInterval = setInterval(function() {
	  countdown = --countdown;
	  $("#countdown-number").text(countdown);
	  if ($("#countdown-number").text() == 0) {
	  	clearInterval(countdownInterval);
		checkOut();
	  }
	}, 1000);

  $("#stop-check-in").click(function() {
		clearInterval(countdownInterval);
		$(".hideCheckIn").hide();
		$(".showCheckInStopped").show();
	})

});



function checkOut() {

	//Inserire qui la chiamata ajax

	$(".hideCheckIn").hide();
	$(".showCheckIn").show();
}