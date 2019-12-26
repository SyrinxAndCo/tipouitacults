const fs = require("fs")
let colorRole = new RegExp(/^#[\da-f]+$/)
let quarantaineFile = "/media/usb/nodejs/tipouitaculte/private/quarantaine.json"

module.exports = {
  alias: [
    'quarantaine'
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
    name : "Quarantaine",
    desc : "Mettre ou retirer eun membre de la quarantaine, afin de régler des problèmes en privé, ou vérifier son statut de quarantaine.",
    schema : "!quarantaine <@> <+|ajouter|add> (raison)\nou\n!quarantaine <@> <-|enlever|retirer|supprimer|remove> (raison)\nou\n!quarantaine <target> <statut|status>",
    channels : "Bots Vigilant·es",
    authors : "Toustes",
    roleNames : "Tous"
  },
  run : function(params, msg) {
    let crop = new RegExp(/^(!quarantaine\s+[^\s]+\s+[^\s]+\s+)/)
    let action = params[1]
    let target
    if(TiCu.Mention(params[0])) {target = TiCu.Mention(params[0])} else return TiCu.Log.Error("quarantaine", "cible invalide", msg)
    let reason = !!params[2]
    if(reason) {reason = msg.content.substring(msg.content.match(crop)[1].length)}
    switch(action) {
      case "+":
      case "ajouter":
      case "add":
        if(!(target.roles.get(PUB.roles.quarantaineRole.id))) {
          msg.reply("voulez-vous mettre <@" + target.id + "> en quarantaine ?")
            .then(newMsg => {
              newMsg
              .react("👍")
              .then(() => newMsg.react("👎"))
              .then(() => {
                let filter = (reaction, user) => {return (user.id === msg.author.id)}
                newMsg
                  .awaitReactions(filter, { max: 1, time: 10000, errors: ["time"] })
                  .then(collected => {
                    const reaction = collected.firstKey();
                    if (reaction === "👍") {
                      let roles = []
                      target.roles.array().forEach((role, i) => {if(!(role.name.match(colorRole) || role.name === "@everyone" || role.name === "@here" || role.id === PUB.roles.nso.id)) {roles.push(role.id)}})
                      let json = {"action": "write","content": {}}
                      json.target = quarantaineFile
                      json.content[target.id] = {"roles": roles}
                      json.content[target.id].date = TiCu.Date("fr")
                      if(TiCu.json(json)) {
                        try {
                          target.addRole(PUB.roles.quarantaineRole.id)
                          target.removeRoles(roles)
                            .then(TiCu.Log.Commands.Quarantaine(true, target, reason, msg))
                        } catch {TiCu.Log.Error("quarantaine", "erreur de modification des rôles", msg)}
                      } else TiCu.Log.Error("quarantaine", "impossible d'enregistrer les rôles actuels", msg)
                    } else {
                      return TiCu.Log.Error("quarantaine", "annulation", msg)
                    }
                  })
                  .catch(collected => {
                    if (!collected) Event.emit("cancelAwait", "quarantaine", target)
                  })
              })
            })
        } else return TiCu.Log.Error("quarantaine", "cible déjà en quarantaine", msg)
        break
      case "-":
      case "enlever":
      case "retirer":
      case "supprimer":
      case "remove":
        if((target.roles.get(PUB.roles.quarantaineRole.id))) {
          msg.reply("voulez-vous sortir <@" + target.id + "> de quarantaine ?")
            .then(newMsg => {
              newMsg
                .react("👍")
                .then(() => newMsg.react("👎"))
                .then(() => {
                  let filter = (reaction, user) => {return (user.id === msg.author.id)}
                  newMsg
                    .awaitReactions(filter, { max: 1, time: 10000, errors: ["time"] })
                    .then(collected => {
                      const reaction = collected.firstKey();
                      if (reaction === "👍") {
                        let jsonRead = {"action": "read"}
                        jsonRead.target =  quarantaineFile
                        let read = TiCu.json(jsonRead)
                        let jsonRemove = {"action": "delete"}
                        jsonRemove.target = quarantaineFile
                        jsonRemove.content = target.id
                        if(read) {
                          if(TiCu.json(jsonRemove)) {
                            try {
                              target.removeRole(PUB.roles.quarantaineRole.id)
                              target.addRoles(read[target.id].roles)
                                .then(TiCu.Log.Prefixed.Quarantaine(false, target, reason, msg))
                            } catch {TiCu.Log.Error("quarantaine", "erreur de modification des rôles")}
                          } else TiCu.Log.Error("quarantaine", "erreur de suppression des données de quarantaine", msg)
                        } else TiCu.Log.Error("quarantaine", "impossible de récupérer les rôles passés", msg)
                      } else {
                        return TiCu.Log.Error("quarantaine", "annulation", msg)
                      }
                    })
                    .catch(collected => {
                      if (!collected) Event.emit("cancelAwait", "quarantaine", target)
                    })
                })
            })
        } else return TiCu.Log.Error("quarantaine", "cible pas en quarantaine", msg)
        break
      case "status":
      case "statut":
        let status = !(target.roles.get(PUB.roles.quarantaineRole.id)) ? "est" : "n'est pas"
        return msg.reply("<@" + target.id + "> " + status + " en quarantaine.")
      default:
        return TiCu.Log.Error("quarantaine", "action non reconnue", msg)
      }
  }
}
