import {Command, Pub, Ticu} from "../../types"
import {Client, Message} from "discord.js"

declare const PUB: Pub
declare const TiCu: Ticu
declare const Discord: Client

export = new class implements Command{
  alias = [
    'send'
  ]
  activated = true
  authorizations = {
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
  }
  run = function(params: string[], msg: Message) {
    let crop = new RegExp(/^(!send\s+[^\s]+\s+)/)
    let target = TiCu.Mention(params[0]).id
    let cropedMessage = msg.content.match(crop)
    let content = cropedMessage ? msg.content.substring(cropedMessage[0].length) : false
    if(target) {
      if(content) {
        let type = Discord.channels.get(target) ? "channels" : Discord.users.get(target) ? "users" : false
        if(type){
          (Discord as any)[type].get(target).send(content)
            .then((sentMsg: Message) => TiCu.Log.Commands.Send(msg, sentMsg))
            .catch((error: any) => TiCu.Log.Error("send", "erreur inattendue " + error, msg))
        } else TiCu.Log.Error("send", "envoyer à un rôle ?", msg)
      } else TiCu.Log.Error("send", "erreur invalide", msg)
    } else TiCu.Log.Error("send", "destination invalide", msg)
  }
}
