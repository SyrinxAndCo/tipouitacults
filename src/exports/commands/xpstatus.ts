import {Command, MemberXPType, Pub, Ticu} from "../../types"
import {GuildMember, Message} from "discord.js"

declare const PUB: Pub
declare const TiCu: Ticu

exports = new class implements Command {
  alias = [
    'xpstatus'
  ]
  activated = true
  authorizations = {
    chans : {
      type: "whitelist",
      list: [PUB.salons.debug.id, PUB.salons.bots.id, PUB.salons.botsecret.id]
    },
    auths : {
      type: "any"
    },
    roles : {
      type: "any"
    },
    name : "XP Status",
    desc : "Afficher le statut d'un membre dans le système d'XP ou changer son statut.",
    schema : "!xpstatus ([inclure|exclure]) (@)",
    channels : "🦄la-maison-de-la-bot, #💠interface-tipoui",
    authors : "Toustes",
    roleNames : "Tous"
  }
  run = function(params: string[], msg: Message) {
    switch (params.length) {
      case 1:
        if (params[0] === 'inclure' || params[0] === 'exclure') {
          TiCu.Xp.changeMemberStatus(msg.author.id, params[0] === 'inclure', msg)
        } else {
          const mention = TiCu.Mention(params[0])
          const target = mention instanceof GuildMember ? mention.id : null
          TiCu.Xp.getMember(target).then(
            (entry: MemberXPType) => {
              if (entry && mention instanceof GuildMember) {
                msg.channel.send(`Le compte de ${mention.displayName} est ${entry.activated ? 'activé' : 'désactivé'} dans le système`)
              } else {
                msg.channel.send('Impossible de retrouver votre cible dans le système')
                TiCu.Log.Commands.XPStatus(target)
              }
            }
          )
        }
        break;
      case 2:
        if (msg.channel.id === PUB.salons.botsecret.id) { // only able to change status for another one in interface-tipoui
          const memberParam = params[1] ? TiCu.Mention(params[1]) : null
          const target = memberParam instanceof GuildMember ? memberParam.id : msg.author.id
          TiCu.Xp.changeMemberStatus(target, params[0] === 'inclure', msg)
        } else {
          TiCu.Log.Error('xpstatus', "permissions manquantes : vous ne pouvez pas modifier le status d'un tiers", msg)
        }
        break;
      default:
        TiCu.Xp.getMember(msg.author.id).then(
          (entry: MemberXPType) => {
            if (entry) {
              msg.channel.send( `Votre compte est ${entry.activated ? 'activé' : 'désactivé'} dans le système`)
            } else {
              msg.channel.send('Impossible de retrouver votre cible dans le système')
              TiCu.Log.Commands.XPStatus(msg.author.id)
            }
          }
        )
    }
  }
}
