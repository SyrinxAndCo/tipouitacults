let dateFormat = require("dateformat")
dateFormat.i18n = {
    dayNames: [
        "Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi",
    ],
    monthNames: [
        "Jan", "Fév", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ],
    timeNames: [
        'a', 'p', 'am', 'pm', 'A', 'P', 'AM', 'PM'
    ]
}

module.exports = function(type) {
    let res
    let now = Date()
    switch(type) {
        case "raw":
            // Raw: 1572369144723
            res = Date.now()
            break
        case "time":
            // Time: 18:12:24
            res = dateFormat(now, "HH:MM:ss")
            break
        case "fr":
            // fr: 29-10-2019 18:12:24
            res = dateFormat(now, "dd-mm-yyyy HH:MM:ss")
            break
        case "frDate":
            // frDate: Mardi 29 Octobre 2019
            res = dateFormat(now, "dddd d mmmm yyyy")
            break
        case "frDateTime":
            // frDateTime: Mardi 29 Octobre 2019 - 18:12:24
            res = dateFormat(now, "dddd d mmmm yyyy - HH:MM:ss")
            break
        case "log":
            // Log: 2019-10-29-18-12-24
            res = dateFormat(now, "yyyy-mm-dd-HH-MM-ss")
            break
        default:
            return 0
    }
    return res
}