exports.isInt = function (value) {
    var er = /^-?[0-9]+$/;
    return er.test(value);
};

