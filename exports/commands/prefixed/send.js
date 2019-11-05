module.exports = function(params, msg) {
  return {
    authorizations : {
      chans : {
        type: "whitelist",
        list: [PUB.tipoui.botsecret]
      },
      auths : {
        type: "any"
      },
      roles : {
        type: "any"
    },
      channels : "Bots Vigilant·es",
      authors : "Tous",
      roleNames : "Tous",
      schema : "!send <target> <content>"
    },
    run : function(params, msg) {
      let crop = new RegExp(/^(!send\s+[^\s]+\s+)/, )
      let target = TiCu.Mention(params[0]).id
      let content = msg.content.match(crop) ? msg.content.substring(msg.content.match(crop)[0].length) : false
      if(target) {
        if(content) {
          let type = Discord.channels.get(target) ? "channels" : Discord.users.get(target) ? "users" : false
          if(type){
            Discord[type].get(target).send(content)
              .then(sentMsg => TiCu.Log.Prefixed.Send(msg, sentMsg))
              .catch(error => Event.emit("error", "send", "erreur inattendue", error))
          } else Event.emit("error", "send", "envoyer à un rôle ?", origin)
        } else Event.emit("error", "send", "erreur invalide", msg)
      } else Event.emit("error", "send", "destination invalide", msg)
    }
  }
}
