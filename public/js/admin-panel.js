
$(document).ready(function () {

	$('.toast').toast({
		delay: 2000
	})

	// TODO: toast doesn't work
	$('.toggle-auth').change(function () {
		$("#successToast").toast("hide");
		let id = $(this).attr("ref-id");
		let action;
		if ($(this).is(':checked') == false) {
			$("#successToast .toast-body span").text("disabilitato");
			action = "disable";
		} else {
			$("#successToast .toast-body span").text("abilitato");
			action = "enable";
		}
		$.ajax({
			url: `/referent/${id}/${action}`,
			method: "POST",
			statusCode: {
				200: function() {
					$("#successToast").show();
					$("#successToast").toast("show");
				}
			  }
		});
	})

})