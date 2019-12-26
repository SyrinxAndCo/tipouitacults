import {Command, Pub, Ticu} from "../../types"
import {GuildMember, Message, MessageReaction, User} from "discord.js"
import {EventEmitter} from "events"

declare const TiCu: Ticu
declare const PUB: Pub
declare const Event: EventEmitter

export = new class implements Command{
  alias = [
    'kick'
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
    name : "Kick",
    desc : "Expulser eun membre du serveur.",
    schema : "!kick <@> (raison)",
    channels : "Bots Vigilant·es",
    authors : "Toustes",
    roleNames : "Tous"
  }
  run = function(params: string[], msg: Message) {
    let crop = new RegExp(/^(!kick\s+[^\s]+\s+)/)
    let target: GuildMember, reasonTxt : string
    let mention = TiCu.Mention(params[0])
    if(mention instanceof GuildMember) {target = mention} else return TiCu.Log.Error("kick", "cible invalide", msg)
    let reason = !!params[1]
    if(reason) {
      let stringCrop = msg.content.match(crop)
      if (stringCrop) {reasonTxt = msg.content.substring(stringCrop[1].length)}
    }
    msg.reply("voulez-vous expulser <@" + target.id + "> du serveur ?")
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
                    reasonTxt ? target.kick(reasonTxt) : target.kick()
                    TiCu.Log.Commands.Kick(target, reasonTxt, msg)
                  } else {
                    return TiCu.Log.Error("kick", "annulation", msg)
                  }
                })
                .catch(collected => {
                  if (!collected) Event.emit("cancelAwait", "kick", target)
                })
            })
        }
      })
  }
}
