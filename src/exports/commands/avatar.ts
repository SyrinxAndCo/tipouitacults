import {Command, Pub, Ticu} from "../../types"
import {GuildMember, Message, RichEmbed} from "discord.js"

declare const PUB: Pub
declare const TiCu: Ticu

export = new class implements Command {
  alias = [
    "avatar"
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
      type: "any"
    },
    name : "Avatar",
    desc : "Afficher l'avatar d'eun membre",
    schema : "!avatar (@)",
    channels : "🦄la-maison-de-la-bot",
    authors : "Toustes",
    roleNames : "Tous"
  }
  run = function(params: string[], msg: Message) {
    const target = params[0] ? TiCu.Mention(params[0]) : TiCu.Mention(msg.author.id)
    if (target instanceof GuildMember) {
      msg.channel.send(
        new RichEmbed()
          .setColor(target.displayColor)
          .setAuthor(`Avatar de ${target.displayName}`, target.user.avatarURL)
          .setImage(target.user.avatarURL)
      )
      TiCu.Log.Commands.Avatar(msg, target)
    } else {
      TiCu.Log.Error('avatar', "Cible invalide : l'élément recherché n'est pas eun utilisateurice", msg)
    }
  }
}
