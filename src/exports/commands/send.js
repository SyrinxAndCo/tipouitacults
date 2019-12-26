module.exports = {
  alias: [
    'send'
  ],
  activated: true,
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
    name : "Send",
    desc : "Envoyer un message par l'intermédiaire de ce bot.",
    schema : "!send <target> <texte>",
    channels : "Bots Vigilant·es",
    authors : "Toustes",
    roleNames : "Tous"
  },
  run : function(params, msg) {
    let crop = new RegExp(/^(!send\s+[^\s]+\s+)/)
    let target = TiCu.Mention(params[0]).id
    let content = msg.content.match(crop) ? msg.content.substring(msg.content.match(crop)[0].length) : false
    if(target) {
      if(content) {
        let type = Discord.channels.get(target) ? "channels" : Discord.users.get(target) ? "users" : false
        if(type){
          Discord[type].get(target).send(content)
            .then(sentMsg => TiCu.Log.Commands.Send(msg, sentMsg))
            .catch(error => TiCu.Log.Error("send", "erreur inattendue " + error, msg))
        } else TiCu.Log.Error("send", "envoyer à un rôle ?", msg)
      } else TiCu.Log.Error("send", "erreur invalide", msg)
    } else TiCu.Log.Error("send", "destination invalide", msg)
  }
}
