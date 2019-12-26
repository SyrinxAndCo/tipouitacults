import {Command, Pub, Ticu} from "../../types"
import {Message, Role} from "discord.js"

declare const PUB: Pub
declare const TiCu: Ticu

export = new class implements Command{
  alias = [
    'purifier'
  ]
  activated = true
  authorizations = {
    chans : {
      type: "whitelist",
      list: [PUB.salons.debug.id, PUB.salons.bots.id]
    },
    auths : {
      type: "any"
    },
    roles : {
      type: "whitelist",
      list: [PUB.roles.pourfendeureuse.id]
    },
    name : "Purifier",
    desc : "Accorder l'accès au salon du Bûcher et le rôle de Pourfendeureuse de Cismecs à eun membre.",
    schema : "!purifier <@>",
    channels : "🦄la-maison-de-la-bot",
    authors : "Toustes",
    roleNames : "🔥Pourfendeureuse de cismecs"
  }
  run = function(params: string[], msg: Message) {
    let target
    if(TiCu.Mention(params[0])) {target = TiCu.Mention(params[0])} else return TiCu.Log.Error("purifier", "cible invalide", msg)
    if(!target.roles.find((e: Role) => e.id === PUB.roles.pourfendeureuse.id)) {
      target.addRole(PUB.roles.pourfendeureuse.id)
      TiCu.Log.Commands.Purifier(target, msg)
    } else return TiCu.Log.Error("purifier", "cible déjà Pourfendeureuse de Cismecs", msg)
  }
}
