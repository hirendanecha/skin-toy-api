const Admin = require("../models/admin.model");

exports.login = function (req, res) {
    const { username, password } = req.body;

    Admin.login(username, password, function (err, token) {
        if (err) {
            console.log(err);
            res.status(400).send({ error: true, message: err });
        } else {
            res.json(token);
        }
    });
};