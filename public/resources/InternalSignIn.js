var DEFAULT_USERNAME = "Email or WestJet ID";
var DEFAULT_PASSWORD = "Password";



$("#login").submit(function() {
    var valid = true;
    $("#login-error").hide();
    var un = $.trim($("#username").val());
    var pw = $.trim($("#password").val());
    if ( un != "" && (validateUsername(un) ||validateEmail(un) || validateWestJetId(un))) {
        $("#username-error").hide();
        $("#username").removeClass("error-background");
    } else {
        $("#username-error").show();
        $("#username").addClass("error-background");
        valid = false;

    }
    if ( pw == "") {
        $("#password-error").show();
        $("#password").addClass("error-background");
        valid = false;
    } else {
        $("#password-error").hide();
        $("#password").removeClass("error-background");
    }

    return valid;
});

function validateUsername(username) {
    var regex = /^[a-zA-Z0-9_-]{1,25}$/;
    var valid = true;
    if (username == "" || !regex.test(username)) {
        valid = false;
    }
    return valid;
}

function validateWestJetId(westJetId) {
    var regex = /^(\d{9})$/;
    var valid = true;
    if (westJetId == "" || !regex.test(westJetId)) {
        valid = false;
    }
    return valid;
}

function validateEmail(emailId) {
    var regex = /^[_a-zA-Z0-9-]+(\.[_a-zA-Z0-9-]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.(([0-9]{1,3})|([a-zA-Z]{2,6}))$/;
    var valid = true;
    if (emailId == "" || !regex.test(emailId)) {
        valid = false;
    }
    return valid;
}

$(function() {
    $('[autofocus]:not(:focus)').eq(0).focus();
});