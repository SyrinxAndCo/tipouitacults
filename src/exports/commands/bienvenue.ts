import {Command, Pub, Ticu} from "../../types"
import {Message, Role} from "discord.js"

declare const TiCu: Ticu
declare const PUB: Pub

export = new class implements Command{
  alias = [
    'bienvenue'
  ]
  activated = true
  authorizations = {
    chans : {
      type: "whitelist",
      list: [PUB.salons.debug.id, PUB.salons.invite.id]
    },
    auths : {
      type: "any"
    },
    roles : {
      type: "whitelist",
      list: [PUB.roles.turquoise.id]
    },
    name : "Bienvenue",
    desc : "Accorder le rôle Phosphate à eun membre.",
    schema : "!bienvenue <@>",
    channels : "🌍présentations📜",
    authors : "Toustes",
    roleNames : "💠Turquoise"
  }
  run = function(params: string[], msg: Message) {
    let target
    if(TiCu.Mention(params[0])) {target = TiCu.Mention(params[0])} else return TiCu.Log.Error("bienvenue", "cible invalide", msg)
    if(!target.roles.find((e: Role) => e.id === PUB.roles.phosphate.id)) {
      target.addRole(PUB.roles.phosphate.id)
      TiCu.Log.Commands.Bienvenue(target, msg)
    } else return TiCu.Log.Error("bienvenue", "cible déjà phosphate", msg)
  }
}
