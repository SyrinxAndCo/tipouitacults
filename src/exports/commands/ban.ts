import {Command, Pub, Ticu} from "../../types"
import {GuildMember, Message, MessageReaction, User} from "discord.js"
import {EventEmitter} from "events"

declare const PUB: Pub
declare const TiCu: Ticu
declare const Event: EventEmitter

export = new class implements Command {
  alias = [
    'ban'
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
    name : "Ban",
    desc : "Bannir eun membre du serveur.",
    schema : "!ban <@> (raison)",
    channels : "Bots Vigilant·es",
    authors : "Toustes",
    roleNames : "Tous"
  }
  run = function(params: string[], msg: Message) {
    let crop = new RegExp(/^(!ban\s+[^\s]+\s+)/)
    let target: GuildMember, reasonTxt : string
    let mention = TiCu.Mention(params[0])
    if(mention instanceof GuildMember) {target = mention} else return TiCu.Log.Error("ban", "cible invalide", msg)
    let reason: boolean = !!params[1]
    if(reason) {
      let stringCrop = msg.content.match(crop)
      if (stringCrop) {reasonTxt = msg.content.substring(stringCrop[1].length)}
    }
    msg.reply("voulez-vous bannir <@" + target.id + "> du serveur ?")
      .then(newMsg => {
        if (newMsg instanceof Message) {
          newMsg
            .react("👍")
            .then(() => newMsg.react("👎"))
            .then(() => {
              let filter = (reaction: MessageReaction, user: User) => {
                return (user.id === msg.author.id)
              }
              newMsg
                .awaitReactions(filter, {max: 1, time: 10000, errors: ["time"]})
                .then(collected => {
                  const reaction = collected.firstKey();
                  if (reaction === "👍") {
                    reasonTxt ? target.ban(reasonTxt) : target.ban()
                    TiCu.Log.Commands.Ban(target, reasonTxt, msg)
                  } else {
                    return TiCu.Log.Error("ban", "annulation", msg)
                  }
                })
                .catch(collected => {
                  if (!collected) Event.emit("cancelAwait", "ban", target)
                })
            })
        }
      })
  }
}
