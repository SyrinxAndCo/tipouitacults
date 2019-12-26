module.exports = {
  authorizations : {
    chans : {
      type: "whitelist",
      list: [PUB.salons.debug.id, PUB.salons.botsecret.id]
    },
    auths : {
      type: "any"
    },
    roles : {
      type: "any"
    },
    name : "Raid",
    desc : "Activer/Désactiver le lien d'invitation en cas de raid ou vérifier son état",
    schema : "!raid <[on|off|status]>",
    channels : "💠interface-tipoui",
    authors : "Toustes",
    roleNames : "Tous"
  },
  run : function(params, msg) {
    switch(params[0]) {
      case "on":
        activeInvite = false
        msg.channel.send(`Désactivation du lien d'invitation, activation du mode raid... :scream: Que la force soit avec nous !`)
        TiCu.Log.Commands.Raid(msg, params[0])
        break
      case "off":
        activeInvite = true
        msg.channel.send(`Réactivation du lien d'invitation, désactivation du mode raid... :smiley:`)
        TiCu.Log.Commands.Raid(msg, params[0])
        break
      case "status":
        msg.channel.send(`Le lien d'invitation est actuellement ${activeInvite ? 'activé (pas de raid en cours).' : 'désactivé (raid en cours).'}`)
        break
      default:
        TiCu.Log.Error('raid', 'Mauvais paramètre d\'appel, consulter l\'aide (!help raid)', msg)
    }
  }
}
