
$(document).ready(function () {

	$('.toast').toast({
		delay: 2000
	})

	$('.toggle-auth').change(function () {
		$("#successToast").toast("hide");
		if ($(this).is(':checked') == false) {
			$("#successToast .toast-body span").text("disabilitato");
		} else {
			$("#successToast .toast-body span").text("abilitato");
		}
		$("#successToast").toast("show");
	})

})